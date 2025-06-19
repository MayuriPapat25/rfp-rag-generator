import { NextResponse } from "next/server";

import { addDocument, getDocuments } from "@/lib/db"; // Import getDocuments
import { generateEmbedding } from "@/lib/embeddings"; // Assuming generateEmbedding exists and uses Ollama
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    console.log("Upload API: Received request.");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectName = formData.get("projectName") as string; // Extract projectName

    if (!file) {
      console.error("Upload API: No file received.");
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }
    if (!projectName) {
      console.error("Upload API: No project name received.");
      return NextResponse.json(
        { error: "Project name is required." },
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

    // Assign a unique ID to each chunk
    const allSplitsWithIds = allSplits.map((chunk) => ({
      ...chunk,
      id: uuidv4(),
    }));

    await vectorStore.addDocuments(allSplitsWithIds);
    const vectorDbDir = path.join("./vectors/");
    console.log("vectorDbDir", { vectorDbDir });

    // save to disk
    await vectorStore.save(`${vectorDbDir}/${filename}`);
    console.log("vectorStore", vectorStore);

    // Store document in MongoDB via addDocument from lib/db.ts
    const newDocumentEntry = {
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
