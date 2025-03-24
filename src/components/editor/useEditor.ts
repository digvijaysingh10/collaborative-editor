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
import { debounce } from 'lodash';

Quill.register('modules/cursors', QuillCursors);

export function useEditor(docId: string) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const providerRef = useRef<ReturnType<typeof createYjsProvider> | null>(null);
  const bindingRef = useRef<QuillBinding | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [users, setUsers] = useState<string[]>([]);
  const lastSavedContentRef = useRef<string>('');
  const isInitialLoadRef = useRef(true);
  const isSavingRef = useRef(false);
  const hasTypedRef = useRef(false); // Track if user has typed

  const saveToBackend = async (isManual = false) => {
    if (isSavingRef.current) return;
    const content = quillRef.current?.getText().trim() || '';
    console.log(`Preparing to save content for ${docId}:`, content);
    if (!content && !isManual) return;
    if (content === lastSavedContentRef.current && !isManual) {
      console.log(`Content unchanged for ${docId}, skipping save`);
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');
    try {
      const res = await fetch('/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, id: docId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      lastSavedContentRef.current = content;
      console.log(`Successfully saved content for ${docId}:`, content);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), isManual ? 3000 : 1500);
    } catch (err) {
      console.error('Save error:', err);
      setStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  };

  const saveToBackendDebounced = debounce(saveToBackend, 1000, { leading: false, trailing: true });

  const handleManualSave = () => {
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

    bindingRef.current = new QuillBinding(ytext, quillRef.current!);

    // Load initial content
    setStatus('saving');
    fetch(`/api/document/${docId}?force=true`)
      .then((res) => (res.status === 404 ? { content: '' } : res.json()))
      .then((data: { content?: string }) => {
        const newContent = data.content || '';
        console.log(`Loaded content for ${docId} from backend:`, newContent);
        if (isInitialLoadRef.current) {
          ytext.delete(0, ytext.length);
          quillRef.current!.setText('');
          ytext.insert(0, newContent);
          quillRef.current!.setText(newContent);
          lastSavedContentRef.current = newContent;
          isInitialLoadRef.current = false;
          providerRef.current!.connect();
        }
        setStatus('idle');
      })
      .catch((err) => {
        console.error(`Failed to load document ${docId}:`, err);
        ytext.delete(0, ytext.length);
        quillRef.current!.setText('');
        setStatus('error');
        providerRef.current!.connect();
      });

    ytext.observe((event) => {
      const ytextContent = ytext.toString();
      const quillContent = quillRef.current!.getText().trim();
      console.log(`Yjs update for ${docId} - Yjs: "${ytextContent}", Quill: "${quillContent}"`);

      if (ytextContent !== quillContent) {
        console.log(`Syncing Quill with Yjs for ${docId} - Applying: "${ytextContent}"`);
        quillRef.current!.setText(ytextContent);
      }

      // Only save if user has typed and it's a local change
      if (!isInitialLoadRef.current && event.transaction.local) {
        hasTypedRef.current = true; // Mark that user has typed
        console.log(`Local Yjs update for ${docId} after typing`);
        if (quillContent !== lastSavedContentRef.current) {
          console.log(`Content changed locally for ${docId}, triggering debounced save`);
          saveToBackendDebounced();
        } else {
          console.log(`Local content matches saved for ${docId}, skipping save`);
        }
      } else if (!isInitialLoadRef.current && !event.transaction.local) {
        console.log(`Remote Yjs update for ${docId}, not saving`);
      }
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

    quillRef.current?.on('text-change', () => {
      console.log(`Quill text changed for ${docId}:`, quillRef.current!.getText().trim());
    });

    return () => {
      saveToBackendDebounced.cancel();
      providerRef.current?.destroy();
      bindingRef.current?.destroy();
      ydoc.destroy();
    };
  }, [docId]);

  return { editorRef, status, users, handleManualSave, saveAsWord, saveAsPDF };
}