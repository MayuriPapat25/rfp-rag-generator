// // scripts/ingest-docs.ts
// import { loadDocuments } from "../utils/document-loader.js";
// import { textSplitter } from "../utils/chunking.js";
// import { saveVectorStore } from "../utils/vector-store.js";

// // Define the path to your knowledge base documents
// const KNOWLEDGE_BASE_PATH = "knowledge_base"; // <--- Define this constant

// async function run() {
//   try {
//     console.log(`Loading documents from ${KNOWLEDGE_BASE_PATH}/...`);
//     const rawDocuments = await loadDocuments(KNOWLEDGE_BASE_PATH); // <--- Pass the argument here
//     console.log(`Loaded ${rawDocuments.length} documents.`);

//     console.log("Splitting documents into chunks...");
//     const splitDocuments = await textSplitter.splitDocuments(rawDocuments);
//     console.log(`Split into ${splitDocuments.length} chunks.`);

//     await saveVectorStore(splitDocuments);
//     console.log("Ingestion complete!");
//   } catch (error) {
//     console.error("Ingestion failed:", error);
//   }
// }

// run();

// scripts/ingest-docs.ts

import { textSplitter } from "../utils/chunking"; // Ensure this path is correct
import { saveVectorStore } from "../utils/vector-store"; // Ensure this path is correct
import { getDocumentsByProject } from "../lib/db"; // This imports from your database functions
import { Document } from "@langchain/core/documents"; // Langchain Document type

async function run() {
  // Get project name from command line arguments
  // process.argv[0] is 'node', process.argv[1] is the script path
  // so process.argv[2] will be the first argument passed after the script
  const PROJECT_NAME_TO_INGEST = process.argv[2];

  if (!PROJECT_NAME_TO_INGEST) {
    console.error("Error: Project name not provided.");
    console.error("Usage: npm run ingest -- <PROJECT_NAME>");
    console.error('Example: npm run ingest -- "Banyan Living"');
    process.exit(1); // Exit with error if no project name is provided
  }

  try {
    console.log(`Starting ingestion for project: "${PROJECT_NAME_TO_INGEST}"`);

    console.log(
      `Fetching processed documents for project "${PROJECT_NAME_TO_INGEST}" from DB...`
    );
    const dbDocuments = await getDocumentsByProject(PROJECT_NAME_TO_INGEST);
    console.log(`Fetched ${dbDocuments.length} documents from DB.`);

    if (dbDocuments.length === 0) {
      console.warn(
        `No documents found in DB for project "${PROJECT_NAME_TO_INGEST}". Skipping ingestion.`
      );
      console.warn(
        `Please ensure documents for this project have been uploaded and saved to the database.`
      );
      return; // Exit if no documents are found for this project
    }

    const langchainDocuments: Document[] = dbDocuments.map(
      (doc: any) =>
        new Document({
          pageContent: doc.content,
          metadata: {
            filename: doc.filename,
            fileType: doc.fileType,
            projectName: doc.projectName, // Ensure this metadata is consistent
            id: doc.id,
            createdAt: doc.createdAt,
            // Add any other relevant metadata from your DB schema if needed
          },
        })
    );

    console.log("Splitting documents into chunks...");
    const splitDocuments = await textSplitter.splitDocuments(
      langchainDocuments
    );
    console.log(`Split into ${splitDocuments.length} chunks.`);

    await saveVectorStore(splitDocuments, PROJECT_NAME_TO_INGEST);
    console.log("Ingestion complete!");
  } catch (error) {
    console.error("Ingestion failed:", error);
    process.exit(1);
  }
}

run();
