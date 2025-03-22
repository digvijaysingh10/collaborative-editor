'use client';

import { RefObject } from 'react';

type EditorAreaProps = {
  editorRef: RefObject<HTMLDivElement>;
};

export default function EditorArea({ editorRef }: EditorAreaProps) {
  return (
    <div
      ref={editorRef}
      className="min-h-[500px] p-4 bg-white text-gray-800 focus:outline-none transition-all duration-200"
    />
  );
}