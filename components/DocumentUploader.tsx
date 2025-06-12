"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { UploadCloud, Loader2, CheckCircle, XCircle } from "lucide-react";

interface DocumentUploaderProps {
  onFileUpload: (fileDetails: { name: string; projectName: string }) => void;
  selectedProjectName: string | null; // This prop is crucial
}

export default function DocumentUploader({
  onFileUpload,
  selectedProjectName,
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setUploadStatus("idle"); // Reset status on new file selection
      setUploadMessage("");
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadMessage("Please select a file to upload.");
      setUploadStatus("error");
      return;
    }
    if (!selectedProjectName) {
      setUploadMessage("Please select a project from the left sidebar first.");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("Uploading and processing file...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectName", selectedProjectName); // Pass the selected project name

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus("success");
        setUploadMessage(
          data.message || "File uploaded and processed successfully!"
        );
        onFileUpload({ name: file.name, projectName: selectedProjectName });
        setFile(null); // Clear file input after successful upload
      } else {
        const errorData = await response.json();
        setUploadStatus("error");
        setUploadMessage(errorData.error || "File upload failed.");
        console.error("Upload error:", errorData);
      }
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage("Network error or unexpected issue during upload.");
      console.error("Upload fetch error:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <UploadCloud className="mr-2 h-5 w-5 text-purple-600" /> Upload
        Documents
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload documents(.docx, .pdf, .txt) to expand the knowledge base for the
        selected project.
      </p>

      {!selectedProjectName && (
        <p className="text-red-500 text-sm mb-4 font-medium">
          Please select a project from the left sidebar before uploading
          documents.
        </p>
      )}

      <div className="flex flex-col space-y-4">
        <Input
          type="file"
          className="file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:border-none file:rounded-md file:py-2 file:px-4"
          onChange={handleFileChange}
          accept=".pdf,.txt,.docx" // Specify accepted file types
          disabled={!selectedProjectName || uploadStatus === "uploading"}
        />
        <Button
          onClick={handleUpload}
          disabled={
            !file || uploadStatus === "uploading" || !selectedProjectName
          }
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
        >
          {uploadStatus === "uploading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload
            </>
          )}
        </Button>
      </div>

      {uploadMessage && (
        <div
          className={`mt-4 p-3 rounded-md text-sm flex items-center ${
            uploadStatus === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {uploadStatus === "success" ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          {uploadMessage}
        </div>
      )}
    </div>
  );
}
