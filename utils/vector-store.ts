// // utils/vector-store.ts
// import { Document } from "@langchain/core/documents";
// import { MemoryVectorStore } from "langchain/vectorstores/memory"; // <-- Use MemoryVectorStore
// import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

// // IMPORTANT: Remove any lines related to 'hnswlib_index' or saving/loading from disk
// // e.g., NO const VECTOR_STORE_PATH = 'hnswlib_index';

// // Initialize embeddings (using Ollama)
// const embeddings = new OllamaEmbeddings({
//   model: "nomic-embed-text", // Ensure this model is pulled in Ollama: ollama pull nomic-embed-text
//   baseUrl: "http://localhost:11434",
// });

// // Declare a global variable to hold the in-memory vector store
// let globalVectorStore = null;

// export async function saveVectorStore(documents) {
//   console.log("Building in-memory vector store...");
//   // Create a new MemoryVectorStore from documents
//   globalVectorStore = await MemoryVectorStore.fromDocuments(
//     documents,
//     embeddings
//   );
//   console.log("In-memory vector store built.");
// }

// export async function loadVectorStore() {
//   console.log("Loading in-memory vector store...");
//   if (!globalVectorStore) {
//     console.error(
//       "In-memory vector store is not built yet. Please run `npm run ingest` to build the knowledge base."
//     );
//     throw new Error(
//       "Failed to load vector store. Please ensure `npm run ingest` has been run."
//     );
//   }
//   console.log("In-memory vector store loaded.");
//   return globalVectorStore;
// }

// utils/vector-store.ts
// import { Document } from "@langchain/core/documents";
// import { FaissStore } from "@langchain/community/vectorstores/faiss"; // <--- Import FaissStore
// import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

// // Define the path where the Faiss index will be saved/loaded
// const VECTOR_STORE_PATH = "faiss_index"; // This is the folder where Faiss will store its index files

// // Initialize embeddings (using Ollama)
// const embeddings = new OllamaEmbeddings({
//   model: "nomic-embed-text", // Ensure this model is pulled in Ollama: ollama pull nomic-embed-text
//   baseUrl: "http://localhost:11434",
// });

// export async function saveVectorStore(documents) {
//   console.log("Building and saving Faiss vector store...");
//   // Create a new FaissStore from documents
//   const vectorStore = await FaissStore.fromDocuments(documents, embeddings);
//   // Save the vector store to the specified path
//   await vectorStore.save(VECTOR_STORE_PATH);
//   console.log("Faiss vector store saved.");
// }

// export async function loadVectorStore() {
//   console.log("Loading Faiss vector store...");
//   try {
//     // Attempt to load the vector store from the path
//     // The Faiss index files must exist at VECTOR_STORE_PATH for this to work
//     const vectorStore = await FaissStore.load(VECTOR_STORE_PATH, embeddings);
//     console.log("Faiss vector store loaded.");
//     return vectorStore;
//   } catch (error) {
//     // If the index doesn't exist or there's a loading error
//     console.error(
//       `Error loading Faiss vector store: ${error}. It might not exist yet.`
//     );
//     console.log("Please run `npm run ingest` to build the knowledge base.");
//     throw new Error(
//       "Failed to load vector store. Please ensure `npm run ingest` has been run."
//     );
//   }
// }

import * as fs from "fs/promises";
import * as path from "path";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Document } from "@langchain/core/documents";

// Define the base path where FAISS indexes are stored.
const FAISS_INDEXES_BASE_PATH = "faiss_indexes";

// Corrected: Define the exact filenames that FaissStore.save() creates and FaissStore.load() expects.
// Based on your 'ls -F' output, the main FAISS index file is 'faiss.index'.
const FAISS_INDEX_FILE_NAME = "faiss.index"; // <<<-- CORRECTED THIS LINE
const FAISS_DOCSTORE_FILE_NAME = "docstore.json"; // This is what your save creates and load expects

// Initialize Ollama Embeddings once.
const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  // baseUrl: "http://localhost:11434", // Uncomment if your Ollama is not on default port
});

/**
 * Checks if the FAISS index files for a given project exist.
 * It now correctly checks for 'faiss.index' and 'docstore.json'.
 * @param projectIndexPath The full path to the project's FAISS index directory.
 * @returns A promise that resolves to true if both files exist, false otherwise.
 */
async function checkFaissIndexExists(
  projectIndexPath: string
): Promise<boolean> {
  const faissFilePath = path.join(projectIndexPath, FAISS_INDEX_FILE_NAME);
  const docstoreFilePath = path.join(
    projectIndexPath,
    FAISS_DOCSTORE_FILE_NAME
  );

  console.log(
    `[checkFaissIndexExists] Attempting to access FAISS file at: ${faissFilePath}`
  );
  console.log(
    `[checkFaissIndexExists] Attempting to access DocStore file at: ${docstoreFilePath}`
  );

  try {
    await fs.access(faissFilePath); // Check if the main FAISS index file exists
    await fs.access(docstoreFilePath); // Check if the document store file exists
    console.log(
      `[checkFaissIndexExists] Found both ${FAISS_INDEX_FILE_NAME} and ${FAISS_DOCSTORE_FILE_NAME} for project: ${projectIndexPath}`
    );
    return true; // Both files exist
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.warn(
        `[checkFaissIndexExists] One or both FAISS files NOT found at expected paths.`
      );
    } else {
      console.error(
        `[checkFaissIndexExists] Unexpected error accessing FAISS files in ${projectIndexPath}:`,
        error
      );
    }
    return false; // One or both files not found or other error
  }
}

/**
 * Saves or updates a FAISS vector store for a specific project.
 * If an index already exists, documents are added to it. Otherwise, a new index is created.
 * It ensures the index is saved using the 'faiss.index' and 'docstore.json' filenames.
 * @param documents An array of LangChain Document objects to be added to the vector store.
 * @param projectName The name of the project associated with the vector store.
 */
export async function saveVectorStore(
  documents: Document<Record<string, any>>[],
  projectName: string
): Promise<void> {
  if (!projectName || projectName.trim() === "") {
    throw new Error("Project name is required to save vector store.");
  }
  if (!documents || documents.length === 0) {
    console.warn(
      `[saveVectorStore] No documents provided for project "${projectName}". Skipping save.`
    );
    return;
  }

  const trimmedProjectName = projectName.trim();
  const projectIndexPath = path.join(
    process.cwd(),
    FAISS_INDEXES_BASE_PATH,
    trimmedProjectName
  );

  await fs.mkdir(projectIndexPath, { recursive: true });
  console.log(
    `[saveVectorStore] Ensured FAISS index directory exists: ${projectIndexPath}`
  );

  let vectorStore: FaissStore;
  const indexExists = await checkFaissIndexExists(projectIndexPath); // This now correctly checks for 'faiss.index' and 'docstore.json'

  if (indexExists) {
    console.log(
      `[saveVectorStore] Index exists. Loading from ${projectIndexPath}...`
    );
    vectorStore = await FaissStore.load(projectIndexPath, embeddings); // This will correctly load now
    console.log(
      `[saveVectorStore] Index loaded. Adding ${documents.length} new documents...`
    );
    await vectorStore.addDocuments(documents);
  } else {
    console.log(
      `[saveVectorStore] Index does NOT exist. Creating new index at ${projectIndexPath} with ${documents.length} documents...`
    );
    vectorStore = await FaissStore.fromDocuments(documents, embeddings);
  }

  // Save the vector store. It will automatically create/update faiss.index and docstore.json
  console.log(
    `[saveVectorStore] Saving index to disk at ${projectIndexPath} (as ${FAISS_INDEX_FILE_NAME} and ${FAISS_DOCSTORE_FILE_NAME})...`
  );
  await vectorStore.save(projectIndexPath);
  console.log(
    `FAISS index for project "${trimmedProjectName}" saved successfully to ${projectIndexPath}`
  );
}

/**
 * Loads a FAISS vector store for a specific project.
 * It expects the FAISS index and docstore files to be present in the project's directory.
 * @param projectName The name of the project whose vector store should be loaded.
 * @returns A promise that resolves to the loaded FaissStore instance.
 * @throws An error if the vector store for the project does not exist.
 */
export async function loadVectorStore(
  projectName: string
): Promise<FaissStore> {
  if (!projectName || projectName.trim() === "") {
    throw new Error("Project name is required to load vector store.");
  }

  const trimmedProjectName = projectName.trim();
  const projectIndexPath = path.join(
    process.cwd(),
    FAISS_INDEXES_BASE_PATH,
    trimmedProjectName
  );

  // Check explicitly for the expected files BEFORE attempting to load
  const indexExists = await checkFaissIndexExists(projectIndexPath); // This will now work correctly
  if (!indexExists) {
    throw new Error(
      `FAISS index for project "${trimmedProjectName}" not found at ${projectIndexPath}. Please run ingestion first.`
    );
  }

  console.log(
    `[loadVectorStore] Loading vector store for project "${trimmedProjectName}" from ${projectIndexPath}...`
  );
  try {
    const vectorStore = await FaissStore.load(projectIndexPath, embeddings);
    console.log(
      `[loadVectorStore] Vector store for project "${trimmedProjectName}" loaded successfully.`
    );
    return vectorStore;
  } catch (error) {
    console.error(
      `[loadVectorStore] Failed to load vector store for "${trimmedProjectName}" from ${projectIndexPath}:`,
      error
    );
    throw new Error(
      `Failed to load vector store for project "${trimmedProjectName}". Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Deletes the FAISS index directory for a specific project.
 * @param projectName The name of the project whose index should be deleted.
 */
export async function deleteVectorStore(projectName: string): Promise<void> {
  if (!projectName || projectName.trim() === "") {
    throw new Error("Project name is required to delete vector store.");
  }

  const trimmedProjectName = projectName.trim();
  const projectIndexPath = path.join(
    process.cwd(),
    FAISS_INDEXES_BASE_PATH,
    trimmedProjectName
  );

  try {
    // Check if the directory exists before attempting to remove it
    await fs.access(projectIndexPath); // Throws if directory doesn't exist
    await fs.rm(projectIndexPath, { recursive: true, force: true }); // Remove directory and its contents
    console.log(
      `FAISS index directory for project "${trimmedProjectName}" deleted: ${projectIndexPath}`
    );
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.warn(
        `FAISS index directory for project "${trimmedProjectName}" not found at ${projectIndexPath}. No deletion needed.`
      );
    } else {
      console.error(
        `Error deleting FAISS index directory for project "${trimmedProjectName}" at ${projectIndexPath}:`,
        error
      );
      throw error;
    }
  }
}
