// components/KnowledgeBase.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Trash2, FileText, Upload, Download } from "lucide-react"; // Icons

interface QAEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  createdAt: number;
}

interface DocumentEntry {
  id: string;
  filename: string;
  fileType: string;
  content: string;
  createdAt: number;
}

export default function KnowledgeBase() {
  const [qaPairs, setQaPairs] = useState<QAEntry[]>([]);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKnowledgeBase = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qaRes = await fetch("/api/qapairs");
      const docRes = await fetch("/api/documents");

      if (!qaRes.ok || !docRes.ok) {
        throw new Error("Failed to fetch knowledge base data.");
      }

      const qaData = await qaRes.json();
      const docData = await docRes.json();

      setQaPairs(qaData.qaPairs || []);
      setDocuments(docData.documents || []);
    } catch (err: any) {
      console.error("Error fetching knowledge base:", err);
      setError(`Failed to load knowledge base: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKnowledgeBase();
  }, [fetchKnowledgeBase]);

  const handleDeleteQaPair = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Q&A pair?")) return;
    try {
      const res = await fetch(`/api/qapairs?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete Q&A pair.");
      fetchKnowledgeBase();
    } catch (err: any) {
      console.error("Error deleting Q&A pair:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document.");
      fetchKnowledgeBase();
    } catch (err: any) {
      console.error("Error deleting document:", err);
      alert(`Error: ${err.message}`);
    }
  };

  if (isLoading)
    return (
      <div className="text-center py-8 text-blue-600">
        Loading knowledge base...
      </div>
    );
  if (error)
    return <div className="text-center py-8 text-red-500">{error}</div>;

  const totalEntries = qaPairs.length + documents.length;

  return (
    <div className="tabContent">
      <div className="knowledgeWrapper">
        <h2 className="knowledgeHeader">
          Knowledge Base ({totalEntries} entries)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Q&A Pairs Section */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center">
            <FileText className="mr-2 h-5 w-5" /> Q&A Pairs ({qaPairs.length})
          </h3>
          {qaPairs.length === 0 ? (
            <p className="text-gray-500 italic">No Q&A pairs added yet.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {qaPairs.map((qa) => (
                <div
                  key={qa.id}
                  className="relative border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteQaPair(qa.id)}
                    aria-label="Delete Q&A Pair"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <p className="font-semibold text-base mb-1 text-gray-900">
                    {qa.question}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">{qa.answer}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                      {qa.category}
                    </span>
                    {qa.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center">
            <Upload className="mr-2 h-5 w-5" /> Uploaded Documents (
            {documents.length})
          </h3>
          {documents.length === 0 ? (
            <p className="text-gray-500 italic">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="relative border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteDocument(doc.id)}
                    aria-label="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <p className="font-semibold text-base mb-1 text-gray-900">
                    {doc.filename}
                  </p>
                  <p className="text-sm text-gray-600 italic mb-2">
                    {doc.fileType}
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {doc.content.substring(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
