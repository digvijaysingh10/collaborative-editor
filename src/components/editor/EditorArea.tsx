'use client';

import { RefObject } from 'react';

type EditorAreaProps = {
  editorRef: RefObject<HTMLDivElement>;
};

export default function EditorArea({ editorRef }: EditorAreaProps) {
  return (
    <div
      ref={editorRef}
      className="min-h-[400px] p-4 focus:outline-none"
    />
  );
}