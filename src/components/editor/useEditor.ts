'use client';

import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import { createYjsProvider } from '@/lib/yjs-config';
import { Packer, Document, Paragraph } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

Quill.register('modules/cursors', QuillCursors);

export function useEditor(docId: string) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const providerRef = useRef<ReturnType<typeof createYjsProvider> | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [users, setUsers] = useState<string[]>([]);

  const saveToBackend = async (isManual = false) => {
    const content = quillRef.current?.getText().trim();
    if (!content && !isManual) return;
    setStatus('saving');
    try {
      const res = await fetch('/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, id: docId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      setStatus('saved');
      setTimeout(() => setStatus('idle'), isManual ? 3000 : 1500);
    } catch (err) {
      console.error('Save error:', err);
      setStatus('error');
    }
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveToBackend(true);
  };

  const saveAsWord = () => {
    if (!quillRef.current) return;
    const content = quillRef.current.getText();
    const doc = new Document({
      sections: [{ children: [new Paragraph(content)] }],
    });
    Packer.toBlob(doc).then((blob) => saveAs(blob, `${docId}.docx`));
  };

  const saveAsPDF = () => {
    if (!quillRef.current) return;
    const content = quillRef.current.getText();
    const doc = new jsPDF();
    doc.text(content, 10, 10);
    doc.save(`${docId}.pdf`);
  };

  useEffect(() => {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('quill');
    providerRef.current = createYjsProvider(ydoc, docId);

    if (editorRef.current && !quillRef.current) {
      const Font = Quill.import('formats/font');
      Font.whitelist = ['inter', 'roboto', 'open-sans', 'lora', 'sans-serif', ''];
      Quill.register(Font, true);

      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Start typing here...',
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, false] }],
              ['#font-picker'],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link'],
              [{ align: [] }],
              ['clean'],
            ],
            handlers: {
              'font-picker': (value: string) => {
                if (quillRef.current) {
                  quillRef.current.format('font', value === '' ? false : value);
                }
              },
              link: (value: string | boolean) => {
                if (!quillRef.current) return;
                const range = quillRef.current.getSelection(true);
                if (range?.length === 0) {
                  const index = range.index;
                  const [leaf] = quillRef.current.getLeaf(index);
                  const text = leaf.text || '';
                  const offset = index - quillRef.current.getIndex(leaf);
                  const { start, end } = getWordBounds(text, offset);
                  if (end > start) quillRef.current.setSelection(index - offset + start, end - start);
                }
                if (value === true) {
                  const tooltip = (quillRef.current.getModule('toolbar') as any).tooltip;
                  tooltip?.edit('link');
                } else if (typeof value === 'string') {
                  quillRef.current.format('link', value);
                } else {
                  quillRef.current.format('link', false);
                }
              },
            },
          },
          cursors: { transformOnTextChange: true },
          history: { delay: 1000, maxStack: 100, userOnly: true },
        },
      });

      const toolbar = quillRef.current.getModule('toolbar');
      const fontPicker = document.createElement('select');
      fontPicker.id = 'font-picker';
      fontPicker.className = 'ql-font-picker ql-picker';
      const fonts = [
        { value: '', label: 'Select Font' },
        { value: 'inter', label: 'Inter' },
        { value: 'roboto', label: 'Roboto' },
        { value: 'open-sans', label: 'Open Sans' },
        { value: 'lora', label: 'Lora' },
        { value: 'sans-serif', label: 'Sans Serif' },
      ];
      fonts.forEach(({ value, label }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        fontPicker.appendChild(option);
      });
      toolbar.container.appendChild(fontPicker);

      fontPicker.addEventListener('change', () => {
        toolbar.handlers['font-picker'](fontPicker.value);
      });
    }

    const binding = new QuillBinding(ytext, quillRef.current!);

    fetch(`/api/document/${docId}`)
      .then((res) => (res.status === 404 ? { content: '' } : res.json()))
      .then((data: { content?: string }) => {
        if (data.content && ytext.length === 0) ytext.insert(0, data.content);
        setStatus('idle');
      })
      .catch((err) => {
        console.error(`Failed to load document ${docId}:`, err);
        if (err.message !== 'Failed to fetch') setStatus('error');
      });

    ytext.observe(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveToBackend(), 1000);
    });

    providerRef.current?.awareness.on('change', () => {
      const states = providerRef.current?.awareness.getStates();
      setUsers(
        Array.from(states?.values() || [])
          .map((state: any) => state.user?.name || 'Anonymous')
          .filter((name, idx, self) => self.indexOf(name) === idx)
      );
    });

    const userName = `User-${Math.random().toString(36).slice(2, 8)}`;
    providerRef.current?.awareness.setLocalStateField('user', {
      name: userName,
      color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
    });

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      providerRef.current?.destroy();
      binding.destroy();
      ydoc.destroy();
    };
  }, [docId]);

  return { editorRef, status, users, handleManualSave, saveAsWord, saveAsPDF };
}

function getWordBounds(text: string, offset: number): { start: number; end: number } {
  const left = text.slice(0, offset).search(/\S+$/) || 0;
  const right = text.slice(offset).search(/\s/);
  return {
    start: left,
    end: right < 0 ? text.length : offset + right,
  };
}