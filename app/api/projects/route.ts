import { NextResponse } from "next/server";
import {
  addProject,
  getProjects,
  deleteProject,
  addDocument,
  DocumentModel, // Assuming DocumentModel is needed for typing or direct access if getDocuments isn't used
  // Removed Firestore specific imports
} from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings"; // Assuming generateEmbedding exists and uses Ollama

// Import necessary libraries for file parsing
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from "node:path";

// NOTE: The ProjectData, DocumentEntry interfaces are now defined
// in lib/db.ts, so we can rely on those or re-import if necessary.
// For consistency, let's use the ones from lib/db.ts

interface ProjectResponse {
  _id: string; // MongoDB's default ID
  name: string;
  createdAt: number; // JavaScript timestamp
}

export async function GET() {
  // Handle GET requests to /api/projects
  // This function fetches all existing projects from MongoDB
  try {
    const projects = await getProjects(); // Call the MongoDB-backed getProjects function
    const formattedProjects: ProjectResponse[] = projects.map((p) => ({
      _id: p._id.toString(), // Convert ObjectId to string for JSON serialization
      name: p.name,
      createdAt: p.createdAt.getTime(), // Convert Date object to timestamp
    }));
    console.log(
      `API Projects: Fetched ${formattedProjects.length} projects from MongoDB.`
    );
    return NextResponse.json({ projects: formattedProjects });
  } catch (error: any) {
    console.error("Error fetching projects from MongoDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Handle POST requests to /api/projects
  // This function creates a new project and optionally processes an uploaded file
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const file = formData.get("file") as File | null; // The optional initial file

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Add the new project to MongoDB
    const savedProject = await addProject({ name }); // Call the MongoDB-backed addProject function
    const newProjectId = savedProject._id.toString(); // Get the MongoDB-generated ID and convert to string

    console.log(
      `API Projects: Created new project in MongoDB with ID: ${newProjectId}`
    );

    let extractedFileContent: string = ""; // Initialize as empty string
    let fileProcessSuccess = true; // Flag to track if file parsing was successful

    if (file) {
      console.log(
        `Processing initial file: ${file.name} for new project: ${name} (ID: ${newProjectId})`
      );
      const fileBuffer = Buffer.from(await file.arrayBuffer()); // Get file as a buffer

      const fileType = file.type; // Mime type e.g., "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"

      const embeddingsModel = new OllamaEmbeddings({
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        model: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text", // Default to nomic-embed-text
      });

      const vectorStore = new FaissStore(embeddingsModel, {});

      let fileContent = "";

      const loader = new PDFLoader(file);
      const docs = await loader.load();
      console.log("Loaded PDF:", docs);

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const allSplits = await splitter.splitDocuments(docs);
      console.log("Split PDF:", allSplits);

      await vectorStore.addDocuments(allSplits);
      const vectorDbDir = path.join("./vectors/");
      console.log("vectorDbDir", { vectorDbDir });

      // save to disk
      await vectorStore.save(`${vectorDbDir}/${file.name}`);
      console.log("vectorStore", vectorStore);

      // switch (fileType) {
      //   case "text/plain":
      //     extractedFileContent = fileBuffer.toString("utf-8");
      //     console.log(
      //       `Initial file upload: Successfully read text file content.`
      //     );
      //     break;
      //   case "application/pdf":
      //     try {
      //       console.log(
      //         "Initial file upload: Attempting to parse PDF with pdfParse..."
      //       );
      //       const data = await pdfParse(fileBuffer);
      //       extractedFileContent = data.text;
      //       console.log(
      //         `Initial file upload: Successfully parsed PDF content. Content length: ${extractedFileContent.length}`
      //       );
      //     } catch (pdfError: any) {
      //       console.error(
      //         "Initial file upload: Error parsing PDF file:",
      //         pdfError.message
      //       );
      //       extractedFileContent = `Error parsing PDF: ${file.name}. Content could not be extracted. Reason: ${pdfError.message}`;
      //       fileProcessSuccess = false; // Mark as failed
      //     }
      //     break;
      //   case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      //     try {
      //       console.log(
      //         "Initial file upload: Attempting to parse DOCX with mammoth..."
      //       );
      //       const result = await mammoth.extractRawText({ buffer: fileBuffer });
      //       extractedFileContent = result.value;
      //       console.log(
      //         `Initial file upload: Successfully parsed DOCX content. Content length: ${extractedFileContent.length}`
      //       );
      //     } catch (docxError: any) {
      //       console.error(
      //         "Initial file upload: Error parsing DOCX file:",
      //         docxError.message
      //       );
      //       extractedFileContent = `Error parsing DOCX: ${file.name}. Content could not be extracted. Reason: ${docxError.message}`;
      //       fileProcessSuccess = false; // Mark as failed
      //     }
      //     break;
      //   default:
      //     console.warn(
      //       `Initial file upload: Unsupported file type: ${fileType}. Cannot extract content.`
      //     );
      //     extractedFileContent = `[Content extraction failed: Unsupported file type '${fileType}']`;
      //     fileProcessSuccess = false; // Mark as failed
      // }

      // CRITICAL CHECK: Only proceed with embedding and saving if content was successfully extracted
      if (fileProcessSuccess && extractedFileContent.length > 0) {
        console.log(
          "Initial file upload: Extracted content for embedding and storage (first 100 chars):\n",
          extractedFileContent.substring(0, 100)
        );

        // Generate embedding for the extracted content
        const embedding = await generateEmbedding(extractedFileContent);
        console.log("Initial file upload: Generated embedding for document.");

        // *** IMPORTANT: Save the extracted document content to MongoDB via addDocument ***
        const newDocumentEntry = {
          // Omit<IDocumentEntry, '_id' | 'createdAt'>
          filename: file.name,
          fileType: file.type,
          content: extractedFileContent,
          embedding: embedding, // Include the embedding
          projectName: newProjectId, // Link to the newly created project's ID
        };
        await addDocument(newDocumentEntry); // Call your MongoDB-backed addDocument
        console.log(
          "Initial file upload: Document added to MongoDB 'documents' collection."
        );
      } else {
        console.warn(
          "Initial file upload: Skipping document storage due to empty or errored content."
        );
      }
    }

    // Return the new project details (using the MongoDB-generated ID)
    return NextResponse.json(
      {
        message: "Project created successfully!",
        project: {
          _id: newProjectId,
          name: savedProject.name,
          createdAt: savedProject.createdAt.getTime(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "Error creating project and/or processing file in MongoDB:",
      error
    );
    return NextResponse.json(
      { error: "Failed to create project and process file: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectIdToDelete = searchParams.get("id");

    if (!projectIdToDelete) {
      return NextResponse.json(
        { error: "Project ID is required for deletion." },
        { status: 400 }
      );
    }

    // Call the MongoDB-backed deleteProject function which handles cascading deletions
    await deleteProject(projectIdToDelete);

    console.log(
      `Project ${projectIdToDelete} and its associated data deleted successfully from MongoDB.`
    );
    return NextResponse.json(
      {
        message: `Project ${projectIdToDelete} and its associated data deleted successfully.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "Error deleting project and associated data from MongoDB:",
      error
    );
    return NextResponse.json(
      { error: `Failed to delete project: ${error.message}` },
      { status: 500 }
    );
  }
}
