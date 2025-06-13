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
