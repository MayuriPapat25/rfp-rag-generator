// lib/server/faiss.ts
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";

export async function loadProjectFaissStore(filePaths: string[]) {
  const embeddingsModel = new OllamaEmbeddings({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text",
  });

  const baseStore = await FaissStore.load(filePaths[0], embeddingsModel);

  for (let i = 1; i < filePaths.length; i++) {
    const nextStore = await FaissStore.load(filePaths[i], embeddingsModel);
    try {
      await baseStore.mergeFrom(nextStore);
    } catch (err: any) {
      if (
        err.message &&
        err.message.startsWith("Tried to add ids that already exist")
      ) {
        console.warn(
          `Skipping merge for ${filePaths[i]} due to duplicate IDs:`,
          err.message
        );
        // Optionally, continue or handle as needed
      } else {
        throw err;
      }
    }
  }

  return baseStore;
}
