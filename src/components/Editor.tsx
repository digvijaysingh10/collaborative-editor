'use client';

import EditorContainer from './editor/EditorContainer';

type EditorProps = {
  docId: string;
};

export default function Editor({ docId }: EditorProps) {
  return <EditorContainer docId={docId} />;
}