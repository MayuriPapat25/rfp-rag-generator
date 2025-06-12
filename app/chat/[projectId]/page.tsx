"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter for redirection
// Assuming these UI components are correctly aliased in tsconfig.json
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import KnowledgeBase from "../../../components/KnowledgeBase";
import DocumentUploader from "../../../components/DocumentUploader";
import {
  FileText,
  Lightbulb,
  ClipboardList,
  UploadCloud,
  Trash2,
} from "lucide-react"; // Import Trash2 icon
import { v4 as uuidv4 } from "uuid";

// Define a type for the uploaded file details for clarity
interface UploadedFileDetail {
  id: string;
  name: string;
  projectName: string; // The project name associated with the file
}

// Define props for this dynamic page, which receives 'params'
interface ChatPageProps {
  params: {
    projectId: string; // This will be the dynamic segment from the URL, e.g., 'proj-1'
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const projectId = params.projectId; // Extract the projectId from the URL parameters
  const router = useRouter(); // Initialize useRouter for redirection

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileDetail[]>([]);
  const [isDeletingProject, setIsDeletingProject] = useState(false); // New state for project deletion loading
  const [projectDeleteError, setProjectDeleteError] = useState<string | null>(
    null
  );

  // In this context, selectedProjectName will always be the current projectId from the URL
  const selectedProjectName = projectId;

  // Effect to load files from localStorage on component mount
  useEffect(() => {
    try {
      const storedFiles = localStorage.getItem("uploadedProjectFiles");
      if (storedFiles) {
        const allUploadedFiles = JSON.parse(
          storedFiles
        ) as UploadedFileDetail[];
        // Filter files relevant to the current projectId
        setUploadedFiles(
          allUploadedFiles.filter((file) => file.projectName === projectId)
        );
      }
    } catch (error) {
      console.error("Failed to load uploaded files from localStorage:", error);
      setUploadedFiles([]);
    }
  }, [projectId]); // Re-run effect if projectId changes

  // Effect to save ALL files (including those from other projects) to localStorage whenever uploadedFiles state changes
  useEffect(() => {
    try {
      const storedFiles = localStorage.getItem("uploadedProjectFiles");
      let allFilesFromLocalStorage: UploadedFileDetail[] = storedFiles
        ? JSON.parse(storedFiles)
        : [];

      // Filter out files that belong to the current projectId from the full list
      const otherProjectFiles = allFilesFromLocalStorage.filter(
        (file) => file.projectName !== projectId
      );

      // Combine other project files with the current project's updated files
      const updatedTotalFiles = [...otherProjectFiles, ...uploadedFiles];

      localStorage.setItem(
        "uploadedProjectFiles",
        JSON.stringify(updatedTotalFiles)
      );
    } catch (error) {
      console.error("Failed to save uploaded files to localStorage:", error);
    }
  }, [uploadedFiles, projectId]); // Depend on uploadedFiles and projectId

  // Function to handle new file uploads
  const handleFileUpload = (newFile: Omit<UploadedFileDetail, "id">) => {
    setUploadedFiles((prevFiles) => {
      const fileWithId = { ...newFile, id: uuidv4() };
      const isDuplicate = prevFiles.some(
        (file) =>
          file.name === fileWithId.name &&
          file.projectName === fileWithId.projectName
      );
      if (!isDuplicate) {
        return [...prevFiles, fileWithId];
      }
      return prevFiles;
    });
  };

  // Function to handle document deletion from KnowledgeBase
  const handleDocumentDeletedFromKnowledgeBase = (deletedDocId: string) => {
    setUploadedFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((file) => file.id !== deletedDocId);
      return updatedFiles;
    });
  };

  const handleGenerateResponse = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, projectName: selectedProjectName }), // Pass projectId as projectName
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      // Read the stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setResponse(accumulatedResponse); // Update state with each chunk
      }

      console.log("Full response received:", accumulatedResponse);
    } catch (error) {
      console.error("Failed to generate response:", error);
      setResponse("Error: Could not generate response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCurrentProject = async () => {
    // IMPORTANT: In a production app, use a custom modal for confirmation
    const confirmed = window.confirm(
      `Are you sure you want to delete the current project "${projectId}"? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setIsDeletingProject(true);
    setProjectDeleteError(null);

    try {
      const res = await fetch(`/api/projects?id=${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      // Successfully deleted the project.
      // Now, remove all associated files from localStorage before redirecting.
      try {
        const storedFiles = localStorage.getItem("uploadedProjectFiles");
        if (storedFiles) {
          let allFiles = JSON.parse(storedFiles) as UploadedFileDetail[];
          const filesAfterDeletion = allFiles.filter(
            (file) => file.projectName !== projectId
          );
          localStorage.setItem(
            "uploadedProjectFiles",
            JSON.stringify(filesAfterDeletion)
          );
        }
      } catch (localStorageError) {
        console.error(
          "Error updating localStorage after project deletion:",
          localStorageError
        );
        // Continue with redirection even if localStorage update fails
      }

      router.push("/"); // Redirect back to the main projects list
    } catch (e: any) {
      setProjectDeleteError(`Failed to delete project: ${e.message}`);
      console.error(e);
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Side Navigation Bar - Now displays current project context */}
      <aside className="w-64 bg-gray-100 p-4 border-r border-gray-200 flex flex-col">
        {/* Optional: Add a link back to the main projects list */}
        <div className="mt-4 border-t pt-4">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to All Projects
          </Link>
        </div>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
          <UploadCloud className="mr-2 h-5 w-5" /> Current Project
        </h2>
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="flex items-center justify-between text-blue-800 font-bold p-1 rounded-md bg-blue-200">
            <span className="flex items-center">
              <FileText className="mr-2 h-4 w-4 text-blue-600" />
              <span>{projectId}</span> {/* Display the current project ID */}
            </span>
            <button
              onClick={handleDeleteCurrentProject}
              className="ml-2 p-1 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
              disabled={isDeletingProject}
              title={`Delete current project ${projectId}`}
            >
              {isDeletingProject ? (
                <span className="text-sm">...</span>
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
          </div>
          {projectDeleteError && (
            <p className="text-red-500 text-xs mt-2">{projectDeleteError}</p>
          )}
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 p-6">
        <h1 className="container_header">
          RFP Q&A Response Generator for {projectId}
        </h1>
        <p className="container_desc">
          RAG-powered system for generating hosting platform and InfoSec RFQ
          responses
        </p>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="tablist">
            <TabsTrigger value="generate" className="tabsTrigger">
              <FileText className="mr-2 h-4 w-4" /> Generate
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="tabsTrigger">
              <Lightbulb className="mr-2 h-4 w-4" /> Knowledge
            </TabsTrigger>
            <TabsTrigger value="manage" className="tabsTrigger">
              <ClipboardList className="mr-2 h-4 w-4" /> Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="tabContent">
              <div>
                <h2 className="tabContentHeader">RFP/RFQ Question</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Generating response for project:{" "}
                  <span className="font-semibold text-blue-700">
                    {projectId}
                  </span>
                </p>
                <Textarea
                  className="tabTextArea"
                  rows={6}
                  placeholder="Enter the RFP/RFQ question you need to respond to..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>
              <Button
                className="generateButton"
                onClick={handleGenerateResponse}
                disabled={isLoading || !question.trim()} // Project is always selected here
              >
                {isLoading ? "Generating..." : "Generate Response"}
              </Button>

              {response && (
                <div className="responseWrapper">
                  <h2 className="responseText">Generated Response</h2>
                  <Textarea
                    className="responseTextArea"
                    rows={10}
                    readOnly
                    value={response}
                  />
                  <p className="tabTextArea">
                    Please review and customize this response before using in
                    your RFP submission.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeBase
              uploadedFiles={uploadedFiles} // Pass uploadedFiles for current project
              onDocumentDeleted={handleDocumentDeletedFromKnowledgeBase}
              currentProjectId={projectId} // Pass currentProjectId to KnowledgeBase
            />
          </TabsContent>

          <TabsContent value="manage">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DocumentUploader
                onFileUpload={handleFileUpload}
                selectedProjectName={projectId} // Pass current projectId to DocumentUploader
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
