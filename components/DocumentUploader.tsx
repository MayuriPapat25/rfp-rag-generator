// components/DocumentUploader.tsx
"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Upload } from "lucide-react"; // Icon

export default function DocumentUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docMessage, setDocMessage] = useState("");
  const [docError, setDocError] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setDocMessage("");
      setDocError(false);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) {
      setDocMessage("Please select a file to upload.");
      setDocError(true);
      return;
    }

    setIsUploadingDoc(true);
    setDocMessage("");
    setDocError(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      setDocMessage("File uploaded and processed successfully!");
      setSelectedFile(null);
    } catch (err: any) {
      console.error("File upload failed:", err);
      setDocMessage(`Error uploading file: ${err.message}`);
      setDocError(true);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <Upload className="mr-2 h-5 w-5" /> Upload Documents
      </h2>
      <div className="space-y-4">
        <p className="text-gray-700 text-sm">
          Supported formats: .docx, .txt, .pdf (content extraction is a
          placeholder for docx/pdf)
        </p>
        <div>
          <label
            htmlFor="document-upload"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select File
          </label>
          <Input
            id="document-upload"
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus-visible:ring-blue-500"
            disabled={isUploadingDoc}
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {selectedFile.name}
            </p>
          )}
        </div>
        <Button
          onClick={handleDocumentUpload}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isUploadingDoc || !selectedFile}
        >
          {isUploadingDoc ? "Uploading..." : "Upload Document"}
        </Button>
        {docMessage && (
          <p
            className={`mt-4 text-center text-sm ${
              docError ? "text-red-500" : "text-green-600"
            }`}
          >
            {docMessage}
          </p>
        )}
      </div>
    </div>
  );
}
