'use client';

import EditorArea from './EditorArea';
import StatusBar from './StatusBar';
import { useEditor } from './useEditor';
import { useState } from 'react';

type EditorContainerProps = {
  docId: string;
};

export default function EditorContainer({ docId }: EditorContainerProps) {
  const { editorRef, status, users, handleManualSave, saveAsWord, saveAsPDF } = useEditor(docId);
  const [title, setTitle] = useState(`doc-${docId.slice(0, 8)}`);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = async () => {
    try {
      const content = editorRef.current?.innerText || '';
      await fetch('/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, id: docId, title }),
      });
      setIsRenaming(false);
    } catch (err) {
      console.error('Rename error:', err);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        {isRenaming ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-1 rounded text-gray-800"
              autoFocus
            />
            <button
              onClick={handleRename}
              className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsRenaming(false)}
              className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <button
              onClick={() => setIsRenaming(true)}
              className="p-1 text-white hover:text-gray-200 transition-colors"
              title="Rename"
            >
              ✏️
            </button>
          </div>
        )}
        <div className="flex space-x-3">
          <button
            onClick={handleManualSave}
            disabled={status === 'saving'}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-400 transform hover:scale-105"
          >
            {status === 'saving' ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={saveAsWord}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
          >
            Word
          </button>
          <button
            onClick={saveAsPDF}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
          >
            PDF
          </button>
        </div>
      </div>
      <EditorArea editorRef={editorRef} />
      <StatusBar status={status} users={users} />
    </div>
  );
}