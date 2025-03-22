'use client';

import EditorArea from "./EditorArea";
import StatusBar from "./StatusBar";
import { useEditor } from "./useEditor";

export default function EditorContainer() {
  const { editorRef, status, users } = useEditor();

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="border-b border-gray-200" />
      <EditorArea editorRef={editorRef} />
      <StatusBar status={status} users={users} />
    </div>
  );
}