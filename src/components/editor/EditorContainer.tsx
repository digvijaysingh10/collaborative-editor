'use client';

import EditorArea from './EditorArea';
import StatusBar from './StatusBar';
import { useEditor } from './useEditor';

export default function EditorContainer() {
  const { editorRef, status, users, handleManualSave } = useEditor();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h2 className="text-lg font-semibold">Collaborative Editor</h2>
          <button
            onClick={handleManualSave}
            className="px-4 py-2 text-sm font-medium bg-white text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 disabled:bg-gray-300 disabled:text-gray-500"
            disabled={status === 'saving'}
          >
            {status === 'saving' ? 'Saving...' : 'Save Now'}
          </button>
        </div>
        <EditorArea editorRef={editorRef} />
        <StatusBar status={status} users={users} />
      </div>
    </div>
  );
}