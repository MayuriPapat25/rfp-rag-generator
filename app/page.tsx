// // "use client";

// // import { useState } from "react";
// // import {
// //   Tabs,
// //   TabsList,
// //   TabsTrigger,
// //   TabsContent,
// // } from "../components/ui/tabs";
// // import { Button } from "../components/ui/button";
// // import { Textarea } from "../components/ui/textarea";
// // import KnowledgeBase from "../components/KnowledgeBase";
// // import AddQAPairForm from "../components/AddQAPairForm";
// // import DocumentUploader from "../components/DocumentUploader";
// // import { FileText, Lightbulb, ClipboardList } from "lucide-react";

// // export default function Home() {
// //   const [question, setQuestion] = useState("");
// //   const [response, setResponse] = useState("");
// //   const [isLoading, setIsLoading] = useState(false);

// //   const handleGenerateResponse = async () => {
// //     if (!question.trim()) return;

// //     setIsLoading(true);
// //     setResponse("");
// //     try {
// //       const res = await fetch("/api/generate", {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({ question }),
// //       });

// //       if (!res.ok || !res.body) {
// //         throw new Error(`HTTP error! status: ${res.status}`);
// //       }

// //       const reader = res.body.getReader();
// //       const decoder = new TextDecoder();
// //       let accumulatedResponse = "";

// //       // Read the stream
// //       while (true) {
// //         const { value, done } = await reader.read();
// //         if (done) break;

// //         const chunk = decoder.decode(value, { stream: true });
// //         accumulatedResponse += chunk;
// //         setResponse(accumulatedResponse); // Update state with each chunk
// //       }

// //       console.log("Full response received:", accumulatedResponse);
// //     } catch (error) {
// //       console.error("Failed to generate response:", error);
// //       setResponse("Error: Could not generate response. Please try again.");
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="container">
// //       <div>
// //         <h1 className="container_header">RFP Q&A Response Generator</h1>
// //         <p className="container_desc">
// //           RAG-powered system for generating hosting platform and InfoSec RFQ
// //           responses
// //         </p>
// //         <Tabs defaultValue="generate" className="w-full">
// //           <TabsList className="tablist">
// //             <TabsTrigger value="generate" className="tabsTrigger">
// //               <FileText className="mr-2 h-4 w-4" /> Generate
// //             </TabsTrigger>
// //             <TabsTrigger value="knowledge" className="tabsTrigger">
// //               <Lightbulb className="mr-2 h-4 w-4" /> Knowledge
// //             </TabsTrigger>
// //             <TabsTrigger value="manage" className="tabsTrigger">
// //               <ClipboardList className="mr-2 h-4 w-4" /> Manage
// //             </TabsTrigger>
// //           </TabsList>

// //           <TabsContent value="generate">
// //             <div className="tabContent">
// //               <div>
// //                 <h2 className="tabContentHeader">RFP/RFQ Question</h2>
// //                 <Textarea
// //                   className="tabTextArea"
// //                   rows={6}
// //                   placeholder="Enter the RFP/RFQ question you need to respond to..."
// //                   value={question}
// //                   onChange={(e) => setQuestion(e.target.value)}
// //                 />
// //               </div>
// //               <Button
// //                 className="generateButton"
// //                 onClick={handleGenerateResponse}
// //                 disabled={isLoading || !question.trim()}
// //               >
// //                 {isLoading ? "Generating..." : "Generate Response"}
// //               </Button>

// //               {response && (
// //                 <div className="responseWrapper">
// //                   <h2 className="responseText">Generated Response</h2>
// //                   <Textarea
// //                     className="responseTextArea"
// //                     rows={10}
// //                     readOnly
// //                     value={response}
// //                   />
// //                   <p className="tabTextArea">
// //                     Please review and customize this response before using in
// //                     your RFP submission.
// //                   </p>
// //                 </div>
// //               )}
// //             </div>
// //           </TabsContent>

// //           <TabsContent value="knowledge">
// //             <KnowledgeBase />
// //           </TabsContent>

// //           <TabsContent value="manage">
// //             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// //               <AddQAPairForm />
// //               <DocumentUploader />
// //             </div>
// //           </TabsContent>
// //         </Tabs>
// //       </div>
// //     </div>
// //   );
// // }

// //Project Management/Selection Page
// "use client"; // Required for client-side interactivity in App Router

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Input } from "@/components/ui/input"; // Assuming shadcn/ui components
// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { useToast } from "../hooks/use-toast"; // For notifications

// export default function ProjectSelectionPage() {
//   const [projectName, setProjectName] = useState("");
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [existingProjects, setExistingProjects] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const { toast } = useToast();

//   // Fetch existing projects on component mount
//   useEffect(() => {
//     async function fetchProjects() {
//       try {
//         const response = await fetch("/api/projects"); // GET request to your new API endpoint
//         if (!response.ok) {
//           throw new Error("Failed to fetch projects");
//         }
//         const data = await response.json();
//         setExistingProjects(data.projects);
//       } catch (error) {
//         console.error("Error fetching projects:", error);
//         toast({
//           title: "Error",
//           description: "Failed to load existing projects.",
//           variant: "destructive",
//         });
//       }
//     }
//     fetchProjects();
//   }, [toast]);

//   const handleFileUpload = async (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);

//     if (!projectName.trim()) {
//       toast({
//         title: "Missing Project Name",
//         description: "Please enter a project name.",
//         variant: "destructive",
//       });
//       setLoading(false);
//       return;
//     }
//     if (!selectedFile) {
//       toast({
//         title: "No File Selected",
//         description: "Please select a file to upload.",
//         variant: "destructive",
//       });
//       setLoading(false);
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file", selectedFile);
//     formData.append("projectName", projectName.trim()); // Send project name with file

//     try {
//       const response = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "File upload failed.");
//       }

//       const data = await response.json();
//       toast({
//         title: "Upload Successful",
//         description: `${
//           data.message
//         }. Now, run 'npm run ingest' for project '${projectName.trim()}' to process it.`,
//       });
//       setProjectName(""); // Clear input
//       setSelectedFile(null); // Clear file input
//       // Optionally re-fetch projects if a new one was created
//       if (!existingProjects.includes(projectName.trim())) {
//         setExistingProjects((prev) => [...prev, projectName.trim()]);
//       }
//     } catch (error: any) {
//       console.error("Error uploading file:", error);
//       toast({
//         title: "Upload Failed",
//         description:
//           error.message || "An unexpected error occurred during upload.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoToChat = (project: string) => {
//     router.push(`/chat?project=${project}`); // Navigate to project-specific chat page
//   };

//   return (
//     <div className="container mx-auto p-4 max-w-2xl">
//       <h1 className="text-3xl font-bold mb-6 text-center">RFP Q&A Generator</h1>

//       {/* Upload/Create New Project Section */}
//       <Card className="mb-8">
//         <CardHeader>
//           <CardTitle>Upload New Q&A File / Create Project</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleFileUpload} className="space-y-4">
//             <div>
//               <Label htmlFor="projectName">Project Name</Label>
//               <Input
//                 id="projectName"
//                 type="text"
//                 value={projectName}
//                 onChange={(e) => setProjectName(e.target.value)}
//                 placeholder="e.g., Banyan Living, Project Alpha"
//                 required
//               />
//             </div>
//             <div>
//               <Label htmlFor="file">Select Q&A Document (PDF/TXT/DOCS)</Label>
//               <Input
//                 id="file"
//                 type="file"
//                 accept=".pdf,.txt,.doc,.docx"
//                 onChange={(e) =>
//                   setSelectedFile(e.target.files ? e.target.files[0] : null)
//                 }
//                 required
//               />
//             </div>
//             <Button type="submit" disabled={loading}>
//               {loading ? "Uploading..." : "Upload File"}
//             </Button>
//             <p className="text-sm text-muted-foreground mt-2">
//               After uploading, remember to run `npm run ingest` in your terminal
//               for the project '{projectName || "[Project Name]"}' to build its
//               knowledge base.
//             </p>
//           </form>
//         </CardContent>
//       </Card>

//       {/* Existing Projects Section */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Existing Projects</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {existingProjects.length === 0 && !loading ? (
//             <p className="text-muted-foreground">
//               No projects found. Upload a file to create one!
//             </p>
//           ) : (
//             <ul className="space-y-2">
//               {existingProjects.map((project) => (
//                 <li
//                   key={project}
//                   className="flex justify-between items-center bg-gray-50 p-3 rounded-md shadow-sm"
//                 >
//                   <span className="font-medium">{project}</span>
//                   <Button onClick={() => handleGoToChat(project)}>
//                     Go to Chat
//                   </Button>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

"use client"; // Required for client-side interactivity in App Router

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "../hooks/use-toast"; // For notifications
// import { FaTrash } from "react-icons/fa"; // Import the trash icon (install if you haven't: npm install react-icons)

export default function ProjectSelectionPage() {
  const [projectName, setProjectName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingProjects, setExistingProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Function to fetch existing projects
  const fetchProjects = async () => {
    try {
      setLoading(true); // Set loading while fetching projects
      const response = await fetch("/api/projects"); // GET request to your API endpoint to list projects
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setExistingProjects(data.projects); // Assuming data.projects is an array of project names
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load existing projects.",
        variant: "destructive",
      });
    } finally {
      setLoading(false); // End loading regardless of success or failure
    }
  };

  // Fetch existing projects on component mount
  useEffect(() => {
    fetchProjects();
  }, [toast]); // Depend on toast to avoid linting warnings, though it's stable

  const handleFileUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!projectName.trim()) {
      toast({
        title: "Missing Project Name",
        description: "Please enter a project name.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("projectName", projectName.trim()); // Send project name with file

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "File upload failed.");
      }

      const data = await response.json();
      toast({
        title: "Upload Successful",
        description: `${
          data.message
        }. Now, run 'npm run ingest' for project '${projectName.trim()}' to process it.`,
      });
      setProjectName(""); // Clear input
      setSelectedFile(null); // Clear file input

      // Re-fetch projects to update the list, as a new one might have been created
      fetchProjects();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Failed",
        description:
          error.message || "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToChat = (project: string) => {
    router.push(`/chat?project=${encodeURIComponent(project)}`); // Navigate to project-specific chat page
  };

  // NEW: Function to handle project deletion
  // const handleDeleteProject = async (projectToDelete: string) => {
  //   // Confirmation dialog
  //   if (
  //     !confirm(
  //       `Are you sure you want to delete the project "${projectToDelete}" and ALL its associated data (documents, vector store)? This action cannot be undone.`
  //     )
  //   ) {
  //     return; // User cancelled the deletion
  //   }

  //   setLoading(true); // Indicate loading while deleting
  //   try {
  //     // Make a DELETE request to the new API endpoint
  //     const response = await fetch(
  //       `/api/projects/${encodeURIComponent(projectToDelete)}`,
  //       {
  //         method: "DELETE",
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(
  //         errorData.error || `Failed to delete project: ${response.statusText}`
  //       );
  //     }

  //     const result = await response.json();
  //     toast({
  //       title: "Deletion Successful",
  //       description: result.message,
  //     });
  //     console.log(result.message);

  //     // Re-fetch projects to update the list after deletion
  //     fetchProjects();
  //   } catch (error: any) {
  //     console.error("Error deleting project:", error);
  //     toast({
  //       title: "Deletion Failed",
  //       description:
  //         error.message || "An unexpected error occurred during deletion.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoading(false); // Stop loading
  //   }
  // };

  const handleDeleteProject = async (projectToDelete: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the project "${projectToDelete}" and ALL its associated data (documents, vector store)? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectToDelete)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to delete project: ${response.statusText}`
        );
      }

      const result = await response.json();
      toast({
        title: "Deletion Successful",
        description: result.message,
      });
      console.log(result.message);

      // This is the crucial part: re-fetch the projects to update the UI
      await fetchProjects(); // This will now get fresh data due to the cache headers
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast({
        title: "Deletion Failed",
        description:
          error.message || "An unexpected error occurred during deletion.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">RFP Q&A Generator</h1>

      {/* Upload/Create New Project Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload New Q&A File / Create Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Banyan Living, Project Alpha"
                required
              />
            </div>
            <div>
              <Label htmlFor="file">Select Q&A Document (PDF/TXT/DOCS)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) =>
                  setSelectedFile(e.target.files ? e.target.files[0] : null)
                }
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload File"}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              After uploading, remember to run `npm run ingest` in your terminal
              for the project '{projectName || "[Project Name]"}' to build its
              knowledge base.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Existing Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && existingProjects.length === 0 ? (
            <p className="text-muted-foreground">Loading projects...</p>
          ) : existingProjects.length === 0 ? (
            <p className="text-muted-foreground">
              No projects found. Upload a file to create one!
            </p>
          ) : (
            <ul className="space-y-2">
              {existingProjects.map((project) => (
                <li
                  key={project}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-md shadow-sm"
                >
                  <span className="font-medium">{project}</span>
                  <div className="flex space-x-2">
                    {" "}
                    {/* Container for buttons */}
                    <Button onClick={() => handleGoToChat(project)}>
                      Go to Chat
                    </Button>
                    {/* NEW: Delete Button */}
                    <Button
                      variant="destructive" // Use a destructive variant for delete actions
                      onClick={() => handleDeleteProject(project)}
                      disabled={loading} // Disable if any operation is in progress
                      title={`Delete project ${project}`} // Tooltip for accessibility
                    >
                      Delete
                      {/* <FaTrash className="w-4 h-4" /> Trash icon */}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
