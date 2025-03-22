import Editor from '@/components/Editor';

export default function Home() {
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Collaborative Editor</h1>
      <Editor />
    </div>
  );
}