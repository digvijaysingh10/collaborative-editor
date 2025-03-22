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

export function useEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const providerRef = useRef<ReturnType<typeof createYjsProvider> | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [users, setUsers] = useState<string[]>([]);

  const saveToBackend = async (isManual = false) => {
    const content = quillRef.current?.getText() || '';
    if (!content.trim()) {
      console.log('No content to save');
      return;
    }
    console.log('Saving content:', content);
    setStatus('saving');
    try {
      const res = await fetch('/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const responseData = await res.json();
      console.log('API response:', responseData);
      if (!res.ok) throw new Error(responseData.error || 'Failed to save');
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
      sections: [
        {
          properties: {},
          children: [new Paragraph(content)],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, 'document.docx');
    }).catch((err) => {
      console.error('Error generating Word document:', err);
    });
  };

  const saveAsPDF = () => {
    if (!quillRef.current) return;
    const content = quillRef.current.getText();
    const doc = new jsPDF();
    doc.text(content, 10, 10);
    doc.save('document.pdf');
  };

  useEffect(() => {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('quill');
    providerRef.current = createYjsProvider(ydoc);

    if (editorRef.current && !quillRef.current) {
      const Font = Quill.import('formats/font');
      Font.whitelist = ['inter', 'roboto', 'open-sans', 'lora', 'sans-serif'];
      Quill.register(Font, true);

      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Start typing here...',
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, false] }],
              [{ font: ['inter', 'roboto', 'open-sans', 'lora', 'sans-serif'] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link'],
              [{ align: [] }],
              ['clean'],
            ],
            handlers: {
              font: function (value: string) {
                if (quillRef.current) {
                  quillRef.current.format('font', value || false);
                }
              },
              link: function (value: string | boolean) {
                if (!quillRef.current) return;

                const range = quillRef.current.getSelection(true);
                if (range && range.length === 0) {
                  const index = range.index;
                  const [leaf] = quillRef.current.getLeaf(index);
                  const text = leaf.text || '';
                  const offset = index - quillRef.current.getIndex(leaf);
                  const wordBounds = getWordBounds(text, offset);
                  const start = index - offset + wordBounds.start;
                  const length = wordBounds.end - wordBounds.start;

                  if (length > 0) {
                    quillRef.current.setSelection(start, length);
                  }
                }

                if (value === true) {
                  const tooltip = (quillRef.current.getModule('toolbar') as any).tooltip;
                  if (tooltip) {
                    tooltip.edit('link');
                  } else {
                    console.error('Tooltip not found');
                  }
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
    }

    const binding = new QuillBinding(ytext, quillRef.current!);

    fetch('/api/document')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: { content?: string }) => {
        if (data.content && ytext.length === 0) {
          ytext.insert(0, data.content);
        }
      })
      .catch((err) => {
        console.error('Failed to load document:', err);
        setStatus('error');
      });

    ytext.observe(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveToBackend(false), 1000);
    });

    providerRef.current?.awareness.on('change', () => {
      const states = providerRef.current?.awareness.getStates();
      const userNames = Array.from(states?.values() || [])
        .map((state: any) => state.user?.name || 'Anonymous')
        .filter((name, idx, self) => self.indexOf(name) === idx);
      setUsers(userNames);
    });

    const userName = `User-${Math.random().toString(36).substring(2, 8)}`;
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
  }, []);

  return { editorRef, status, users, handleManualSave, saveAsWord, saveAsPDF };
}

function getWordBounds(text: string, offset: number): { start: number; end: number } {
  const left = text.slice(0, offset).search(/\S+$/);
  const right = text.slice(offset).search(/\s/);
  const start = left < 0 ? 0 : left;
  const end = right < 0 ? text.length : offset + right;
  return { start, end };
}