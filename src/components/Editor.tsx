'use client';

import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import { createYjsProvider } from '@/lib/yjs-config';

Quill.register('modules/cursors', QuillCursors);

export default function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const providerRef = useRef<ReturnType<typeof createYjsProvider> | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('quill');
    providerRef.current = createYjsProvider(ydoc);

    if (editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [['bold', 'italic', 'underline'], ['link']],
          cursors: true,
        },
      });
    }

    const binding = new QuillBinding(ytext, quillRef.current!);

    fetch('/api/document')
      .then((res) => res.json())
      .then((data: { content?: string }) => {
        if (data.content && ytext.length === 0) {
          ytext.insert(0, data.content);
        }
      })
      .catch((err) => console.error('Failed to load document:', err));

    const saveToBackend = async () => {
      const content = ytext.toString();
      try {
        const res = await fetch('/api/document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error('Failed to save');
      } catch (err) {
        console.error('Failed to save document:', err);
      }
    };

    ytext.observe(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveToBackend, 2000);
    });

    return () => {
      providerRef.current?.disconnect();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      binding.destroy();
    };
  }, []);

  return <div ref={editorRef} className="h-[400px]" />;
}