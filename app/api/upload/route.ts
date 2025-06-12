import { NextResponse } from "next/server";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { addDocument } from "@/lib/db"; // Import addDocument
import { generateEmbedding } from "@/lib/embeddings"; // Assuming generateEmbedding exists and uses Ollama
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import path from "node:path";

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

    let fileContent = "";
    const buffer = Buffer.from(await file.arrayBuffer());
    switch (fileType) {
      case "text/plain":
        fileContent = buffer.toString("utf-8");
        console.log(`Upload API: Successfully read text file content.`);
        break;
      case "application/pdf":
        try {
          const data = await pdfParse(buffer);
          fileContent = data.text;
          console.log(
            `Upload API: Successfully parsed PDF content. Content length: ${fileContent.length}`
          );
        } catch (pdfError: any) {
          console.error(
            "Upload API: Error parsing PDF file:",
            pdfError.message
          );
          fileContent = `Error parsing PDF: ${filename}. Content could not be extracted. Reason: ${pdfError.message}`;
        }
        break;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        try {
          console.log("Upload API: Attempting to parse DOCX with mammoth...");
          const result = await mammoth.extractRawText({ buffer: buffer });
          fileContent = result.value;
          console.log(
            `Upload API: Successfully parsed DOCX content. Content length: ${fileContent.length}`
          );
        } catch (docxError: any) {
          console.error(
            "Upload API: Error parsing DOCX file:",
            docxError.message
          );
          fileContent = `Error parsing DOCX: ${filename}. Content could not be extracted. Reason: ${docxError.message}`;
        }
        break;
      default:
        console.error(`Upload API: Unsupported file type: ${fileType}`);
        return NextResponse.json(
          { error: "Unsupported file type." },
          { status: 400 }
        );
    }

    // Generate actual embedding for the content using Ollama
    // Ensure fileContent is not empty or an error message before generating embedding
    if (!fileContent || fileContent.startsWith("Error parsing")) {
      console.warn(
        "Upload API: Skipping embedding generation and document storage due to empty or errored file content."
      );
      return NextResponse.json({
        message:
          "File uploaded but content extraction failed. Document not added to knowledge base.",
        status: "warning",
        id: "extraction-failed-id",
      });
    } else {
      const embedding = await generateEmbedding(fileContent);
      console.log("Upload API: Generated actual embedding with Ollama.");

      // Store document in MongoDB via addDocument from lib/db.ts
      const newDocumentEntry = {
        // Omit<IDocumentEntry, '_id' | 'createdAt'>
        filename,
        fileType,
        content: fileContent,
        embedding,
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
    }
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
