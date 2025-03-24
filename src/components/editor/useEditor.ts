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
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Start typing here...',
        modules: {
          toolbar: [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']],
          cursors: { transformOnTextChange: true },
          history: { delay: 1000, maxStack: 100, userOnly: true },
        },
      });
    }

    const binding = new QuillBinding(ytext, quillRef.current!);

    fetch(`/api/document/${docId}`)
      .then((res) => (res.status === 404 ? { content: '' } : res.json()))
      .then((data: { content?: string }) => {
        if (data.content && ytext.length === 0) {
          ytext.insert(0, data.content);
        }
        setStatus('idle');
      })
      .catch((err) => {
        console.error(`Failed to load document ${docId}:`, err);
        setStatus('error');
      });

    ytext.observe((event) => {
      if (!event.transaction.local && quillRef.current) {
        const textLength = quillRef.current.getLength();
        quillRef.current.setSelection(textLength - 1, 0);
      }
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

    providerRef.current?.on('status', ({ status }) => {
      console.log(`WebSocket for ${docId}: ${status}`);
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