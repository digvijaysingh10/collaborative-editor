'use client';

import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import { createYjsProvider } from '@/lib/yjs-config';

Quill.register('modules/cursors', QuillCursors);

export function useEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const providerRef = useRef<ReturnType<typeof createYjsProvider> | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('quill');
    providerRef.current = createYjsProvider(ydoc);

    if (editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Start typing here...',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            [{ align: [] }],
            ['clean'],
          ],
          cursors: {
            transformOnTextChange: true,
          },
          history: {
            delay: 1000,
            maxStack: 100,
            userOnly: true,
          },
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
      .catch((err) => {
        console.error('Failed to load document:', err);
        setStatus('error');
      });

    const saveToBackend = async () => {
      const content = ytext.toString();
      setStatus('saving');
      try {
        const res = await fetch('/api/document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error('Failed to save');
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to save document:', err);
        setStatus('error');
      }
    };

    ytext.observe(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveToBackend, 2000);
    });

    providerRef.current?.awareness.on('change', () => {
      const states = providerRef.current?.awareness.getStates();
      const userNames = Array.from(states?.values() || []).map((state: any) => state.user?.name || 'Anonymous');
      setUsers(Array.from(new Set(userNames)));
    });

    providerRef.current?.awareness.setLocalStateField('user', {
      name: `User-${Math.floor(Math.random() * 1000)}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });

    return () => {
      providerRef.current?.disconnect();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      binding.destroy();
    };
  }, []);

  return { editorRef, status, users };
}