import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });

export default function Home() {
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Collaborative Editor</h1>
      <Editor />
    </div>
  );
}