// utils/vector-store.ts
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory"; // <-- Use MemoryVectorStore
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

// IMPORTANT: Remove any lines related to 'hnswlib_index' or saving/loading from disk
// e.g., NO const VECTOR_STORE_PATH = 'hnswlib_index';

// Initialize embeddings (using Ollama)
const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text", // Ensure this model is pulled in Ollama: ollama pull nomic-embed-text
  baseUrl: "http://localhost:11434",
});

// Declare a global variable to hold the in-memory vector store
let globalVectorStore = null;

export async function saveVectorStore(documents) {
  console.log("Building in-memory vector store...");
  // Create a new MemoryVectorStore from documents
  globalVectorStore = await MemoryVectorStore.fromDocuments(
    documents,
    embeddings
  );
  console.log("In-memory vector store built.");
}

export async function loadVectorStore() {
  console.log("Loading in-memory vector store...");
  if (!globalVectorStore) {
    console.error(
      "In-memory vector store is not built yet. Please run `npm run ingest` to build the knowledge base."
    );
    throw new Error(
      "Failed to load vector store. Please ensure `npm run ingest` has been run."
    );
  }
  console.log("In-memory vector store loaded.");
  return globalVectorStore;
}
