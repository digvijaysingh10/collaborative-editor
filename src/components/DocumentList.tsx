'use client';

import { useEffect, useState } from 'react';
import { FiEdit2, FiTrash2, FiShare2, FiCheck, FiX } from 'react-icons/fi';

type Document = { id: string; title: string; updatedAt: string; content?: string };
type DocumentListProps = { onSelect: (id: string) => void; onNewDocument: () => void };

export default function DocumentList({ onSelect, onNewDocument }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const fetchDocuments = async () => {
    const res = await fetch('/api/document');
    const data = await res.json();
    setDocuments(data.documents || []);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleRename = async (id: string) => {
    if (!newTitle.trim()) return;
    const currentDoc = documents.find((doc) => doc.id === id);
    await fetch('/api/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: currentDoc?.content || '', id, title: newTitle }),
    });
    setRenamingId(null);
    setNewTitle('');
    fetchDocuments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/document/delete/${id}`, { method: 'DELETE' });
    fetchDocuments();
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/?docId=${id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied!');
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <h2 className="text-lg md:text-xl font-bold">Documents</h2>
        <p className="text-xs md:text-sm opacity-80">Real-time synced docs</p>
      </div>
      <div className="p-4">
        <button
          onClick={onNewDocument}
          className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
        >
          + New Document
        </button>
        <ul className="mt-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {documents.map((doc) => (
            <li key={doc.id} className="p-3 bg-gray-50 rounded-lg flex flex-col gap-2">
              {renamingId === doc.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 p-1 rounded border border-gray-300 text-gray-800 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(doc.id)}
                    className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    <FiCheck size={16} />
                  </button>
                  <button
                    onClick={() => setRenamingId(null)}
                    className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span
                    onClick={() => onSelect(doc.id)}
                    className="text-gray-800 font-medium truncate cursor-pointer hover:text-blue-600 text-sm md:text-base"
                  >
                    {doc.title}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => { setRenamingId(doc.id); setNewTitle(doc.title); }} className="p-1 text-gray-500 hover:text-blue-600">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="p-1 text-gray-500 hover:text-red-600">
                      <FiTrash2 size={16} />
                    </button>
                    <button onClick={() => handleShare(doc.id)} className="p-1 text-gray-500 hover:text-green-600">
                      <FiShare2 size={16} />
                    </button>
                  </div>
                </div>
              )}
              <span className="text-xs text-gray-500">
                Last updated: {new Date(doc.updatedAt).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}