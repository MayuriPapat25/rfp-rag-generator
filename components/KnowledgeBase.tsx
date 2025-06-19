"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, FileText, Upload } from "lucide-react"; // Removed Download icon as it's not used

interface DocumentEntry {
  id: string;
  filename: string;
  fileType: string;
  content: string;
  createdAt: number;
  projectName: string; // Ensure this is present for filtering consistency
}

// Updated props interface for KnowledgeBase
interface KnowledgeBaseProps {
  onDocumentDeleted: (deletedDocId: string) => void; // Removed deletedDocProjectName as it's not used in parent
  uploadedFiles: { id: string; name: string; projectName: string }[]; // More specific type than 'any'
  currentProjectId: string; // NEW: Prop to receive the currently active project ID
  currentProjectName: string;
}

export default function KnowledgeBase({
  onDocumentDeleted,
  uploadedFiles, // This prop is received but currently not directly used for display within this component,
  // as the component fetches its own data from the API. It's passed for potential future use or consistency.
  currentProjectId, // Destructure the new prop
  currentProjectName,
}: KnowledgeBaseProps) {
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKnowledgeBase = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass currentProjectId as a query parameter to filter results
      const docRes = await fetch(
        `/api/documents?projectId=${currentProjectId}`
      );

      if (!docRes.ok) {
        throw new Error("Failed to fetch knowledge base data.");
      }

      const docData = await docRes.json();

      // Ensure data is an array before setting state
      setDocuments(docData.documents || []);
    } catch (err: any) {
      console.error("Error fetching knowledge base:", err);
      setError(`Failed to load knowledge base: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentProjectId]); // Dependency on currentProjectId ensures re-fetch when project changes

  useEffect(() => {
    // Fetch data whenever currentProjectId changes
    if (currentProjectId) {
      fetchKnowledgeBase();
    }
  }, [fetchKnowledgeBase, currentProjectId]);

  const handleDeleteDocument = async (docToDelete: DocumentEntry) => {
    // Use a custom modal or confirm box instead of window.confirm
    const confirmed = window.confirm(
      `Are you sure you want to delete the document: "${docToDelete.filename}"?`
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/documents?id=${docToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete document.");

      // Notify the parent (ChatPage.tsx) about the deletion by ID
      onDocumentDeleted(docToDelete.id);

      // Optimistically update the local state without refetching all documents
      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== docToDelete.id)
      );
    } catch (err: any) {
      console.error("Error deleting document:", err);
      // Use a custom message display instead of alert
      console.error(`Error: ${err.message}`);
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

  const totalEntries = documents.length;

  return (
    <div className="tabContent">
      <div className="knowledgeWrapper">
        <h2 className="knowledgeHeader">
          Knowledge Base ({totalEntries} entries for project:{" "}
          {currentProjectName})
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents Section */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center">
            <Upload className="mr-2 h-5 w-5" /> Uploaded Documents (
            {documents.length})
          </h3>
          {documents.length === 0 ? (
            <p className="text-gray-500 italic">
              No documents uploaded yet for this project.
            </p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="relative border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteDocument(doc)}
                    aria-label="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button> */}
                  <p className="font-semibold text-base mb-1 text-gray-900">
                    {doc.filename}
                  </p>
                  <p className="text-sm text-gray-600 italic mb-2">
                    Project: {doc.projectName} | Type: {doc.fileType}
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
