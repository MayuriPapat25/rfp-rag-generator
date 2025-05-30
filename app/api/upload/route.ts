import { NextResponse } from "next/server";
import formidable from "formidable";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { addDocument } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";

interface DocumentEntry {
  id: string;
  filename: string;
  fileType: string;
  content: string;
  embedding?: number[];
  createdAt: number;
}

export async function POST(req: Request) {
  try {
    console.log("Upload API: Received request.");

    const form = formidable({});
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("Upload API: No file received in formidable parse.");
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    const filename = file.name;
    const fileType = file.type;
    console.log(`Upload API: Processing file: ${filename}, type: ${fileType}`);

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
          console.log(`Upload API: Successfully parsed PDF content.`);
        } catch (pdfError) {
          console.error("Upload API: Error parsing PDF file:", pdfError);
          fileContent = `Error parsing PDF: ${filename}. Content could not be extracted.`;
        }
        break;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        try {
          const result = await mammoth.extractRawText({ buffer: buffer });
          fileContent = result.value;
          console.log(`Upload API: Successfully parsed DOCX content.`);
        } catch (docxError) {
          console.error("Upload API: Error parsing DOCX file:", docxError);
          fileContent = `Error parsing DOCX: ${filename}. Content could not be extracted.`;
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
    const embedding = await generateEmbedding(fileContent);
    console.log("Upload API: Generated actual embedding with Ollama.");

    // Store document in our new file-based database
    const newDoc = await addDocument({
      filename,
      fileType,
      content: fileContent,
      embedding,
    });
    console.log("Upload API: Stored document in file-based database.", newDoc);

    return NextResponse.json({
      message: "File uploaded and processed successfully.",
    });
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
      },
      { status: 500 }
    );
  }
}
