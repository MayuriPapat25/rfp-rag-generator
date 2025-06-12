import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from "node:path";

const vectorDbDir = path.join(__dirname);
console.log("vectorDbDir", { vectorDbDir });

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embeddingsModel = new OllamaEmbeddings({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text", // Default to nomic-embed-text
    });

    const embedding = await embeddingsModel.embedQuery(text);
    return embedding;
  } catch (error: any) {
    console.error("Error generating embedding with Ollama:", error);
    throw new Error(
      `Embedding service error: ${error.message || error.toString()}`
    );
  }
}
