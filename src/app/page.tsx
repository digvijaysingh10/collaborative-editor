"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import DocumentList from "@/components/DocumentList";
import { useSearchParams } from "next/navigation";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

function HomeContent() {
  const searchParams = useSearchParams();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const docId = searchParams.get("docId");
    if (docId && docId !== selectedDocId) setSelectedDocId(docId);
  }, [searchParams]);

  const handleNewDocument = async () => {
    const newDocId = crypto.randomUUID();
    const res = await fetch("/api/document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "", id: newDocId }),
    });
    if (res.ok) setSelectedDocId(newDocId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 md:p-6 flex flex-col md:flex-row md:space-x-6">
      <button
        className="md:hidden mb-4 p-2 bg-blue-500 text-white rounded-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
      </button>
      <div
        className={`${
          isSidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-80 flex-shrink-0 mb-4 md:mb-0`}
      >
        <DocumentList onSelect={setSelectedDocId} onNewDocument={handleNewDocument} />
      </div>
      <div className="flex-1 w-full">
        {selectedDocId ? (
          <Editor docId={selectedDocId} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 font-medium text-center">
            <p>Select a document or create a new one to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}