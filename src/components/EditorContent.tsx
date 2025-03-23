'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });

interface EditorContentProps {
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
}

export default function EditorContent({ selectedDocId, onSelectDoc }: EditorContentProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const docId = searchParams.get('docId');
    if (docId && docId !== selectedDocId) {
      onSelectDoc(docId);
    }
  }, [searchParams, selectedDocId, onSelectDoc]);

  return (
    <div className="flex-1 w-full">
      {selectedDocId ? (
        <Editor docId={selectedDocId} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500 font-medium text-center">
          <p>Select a document or create a new one to start editing</p>
        </div>
      )}
    </div>
  );
}