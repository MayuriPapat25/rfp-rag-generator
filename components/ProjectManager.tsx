"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export default function ProjectManager() {
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setProjects(data.projects);
    } catch (e: any) {
      setError(`Failed to fetch projects: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!newProjectName.trim()) {
      setError("Project name cannot be empty.");
      return;
    }

    setIsCreatingProject(true);
    const formData = new FormData();
    formData.append("name", newProjectName);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      setNewProjectName("");
      setSuccessMessage(result.message);

      // 2. If a file is selected, upload it
      if (selectedFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", selectedFile);
        uploadForm.append("projectName", result.project._id); // Use the new project ID
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json();
          throw new Error(uploadError.error || "File upload failed");
        }
        setSelectedFile(null);
      }

      await fetchProjects();
    } catch (e: any) {
      setError(`Failed to create project: ${e.message}`);
      console.error(e);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the project "${projectName}" (ID: ${projectId})? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setDeletingProjectId(projectId);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/projects?id=${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      setSuccessMessage(`Project "${projectName}" deleted successfully.`);
      setProjects((prevProjects) =>
        prevProjects.filter((p) => p._id !== projectId)
      );
    } catch (e: any) {
      setError(`Failed to delete project "${projectName}": ${e.message}`);
      console.error(e);
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        RFP Q&A Projects
      </h1>

      {/* Create New Project Form */}
      <form onSubmit={createProject} className="mb-8 p-4 bg-gray-50 rounded-md">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">
          Create New Project
        </h2>
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="Enter new project name"
          className="w-full p-3 border border-gray-300 rounded-md mb-3 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {/* File Input */}
        <label
          htmlFor="project-file-upload"
          className="block text-sm font-medium text-gray-700 mb-2 mt-4"
        >
          Optional: Upload initial RFP file (.docx, .pdf, .txt)
        </label>
        <input
          id="project-file-upload"
          type="file"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          accept=".pdf,.docx,.txt"
          required
        />
        {selectedFile && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedFile.name}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out font-semibold mt-6"
          disabled={isCreatingProject}
        >
          {isCreatingProject ? "Creating Project..." : "Create Project"}
        </button>
        {error && (
          <p className="text-red-600 mt-2 text-sm text-center">{error}</p>
        )}
        {successMessage && (
          <p className="text-green-600 mt-2 text-sm text-center">
            {successMessage}
          </p>
        )}
      </form>

      {/* Project List */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        Existing Projects
      </h2>
      {isLoading ? (
        <p className="text-gray-600 text-center">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-600 text-center">
          No projects found. Create one above!
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={project._id}
              className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between"
            >
              <Link
                href={`/chat/${project._id}`}
                className="block text-blue-600 hover:text-blue-800 font-medium text-lg flex-grow"
              >
                {project.name}
                <span className="text-sm text-gray-500 ml-2">
                  {" "}
                  (ID: {project._id})
                </span>
              </Link>
              <div className="flex items-center">
                <p className="text-xs text-gray-500 mt-1 mr-4">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleDeleteProject(project._id, project.name)}
                  className="ml-2 p-1 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
                  disabled={deletingProjectId === project._id}
                  title={`Delete project ${project.name}`}
                >
                  {deletingProjectId === project._id ? (
                    <span className="text-sm">...</span>
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
