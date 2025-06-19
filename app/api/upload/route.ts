import { NextResponse } from "next/server";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { addDocument, getDocuments } from "@/lib/db"; // Import getDocuments
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { Document } from "@langchain/core/documents";
import fs from "fs";

export interface DocumentEntryInput {
  filename: string;
  fileType: string;
  content: string;
  embedding: any[];
  projectName: string;
}
// Helper function to convert File to Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: Request) {
  try {
    console.log("Upload API: Received request.");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectName = formData.get("projectName") as string; // Extract projectName

    if (!file || !projectName) {
      return NextResponse.json(
        { error: "File and projectName are required." },
        { status: 400 }
      );
    }

    const filename = file.name;
    const fileType = file.type;
    console.log(
      `Upload API: Processing file: ${filename}, type: ${fileType}, project: ${projectName}`
    );

    // Duplicate file check
    const existingDocs = await getDocuments(projectName);
    const duplicate = existingDocs.find((doc) => doc.filename === filename);
    if (duplicate) {
      return NextResponse.json(
        { error: "A file with this name already exists for this project." },
        { status: 400 }
      );
    }

    const embeddingsModel = new OllamaEmbeddings({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text", // Default to nomic-embed-text
    });

    const buffer = await fileToBuffer(file);
    let documents: Document[] = [];

    if (fileType === "application/pdf") {
      const pdfData = await pdfParse(buffer);
      documents = [
        new Document({ pageContent: pdfData.text, metadata: { filename } }),
      ];
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      filename.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      documents = [
        new Document({ pageContent: result.value, metadata: { filename } }),
      ];
    } else if (fileType === "text/plain" || filename.endsWith(".txt")) {
      const text = buffer.toString("utf-8");
      documents = [new Document({ pageContent: text, metadata: { filename } })];
    } else {
      return NextResponse.json(
        { error: "Unsupported file type." },
        { status: 400 }
      );
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitDocuments(documents);
    console.log("chunks PDF:", chunks);

    // Assign a unique ID to each chunk
    const chunksWithIds = chunks.map((chunk) => ({
      ...chunk,
      id: uuidv4(),
    }));

    // Initialize FAISS from documents
    const vectorStore = await FaissStore.fromDocuments(
      chunksWithIds,
      embeddingsModel
    );

    await vectorStore.addDocuments(chunksWithIds);

    // await vectorStore.addDocuments(allSplitsWithIds);
    const vectorDbDir = path.join("./vectors/");
    console.log("vectorDbDir", { vectorDbDir });
    if (!fs.existsSync(vectorDbDir)) {
      fs.mkdirSync(vectorDbDir, { recursive: true });
    }
    // save to disk
    await vectorStore.save(`${vectorDbDir}/${filename}`);
    console.log("vectorStore", vectorStore);

    // Store document in MongoDB via addDocument from lib/db.ts
    const newDocumentEntry: DocumentEntryInput = {
      // Omit<IDocumentEntry, '_id' | 'createdAt'>
      filename,
      fileType,
      content: "1",
      embedding: [],
      projectName, // Pass projectName to addDocument
    };
    const addedDoc = await addDocument(newDocumentEntry); // addDocument returns IDocumentEntry with _id/createdAt
    console.log("Upload API: Stored document in MongoDB.", addedDoc);

    // The DocumentUploader on the frontend expects an 'id' in the response.
    return NextResponse.json({
      message: "File uploaded and processed successfully.",
      id: addedDoc._id.toString(), // Return the MongoDB-generated _id as string
      status: "success",
    });
    // }
  } catch (error: any) {
    console.error(
      "Upload API: General error during file upload process:",
      error
    );
    return NextResponse.json(
      {
        error: `Failed to upload and process file: ${
          error.message || "Unknown error"
        }`,
        status: "error",
      },
      { status: 500 }
    );
  }
}
