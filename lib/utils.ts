import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDocuments } from "./db";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
// const { IndexShards } = Faiss;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function loadVectorData(projectId: string) {
  const allDocumentsFromDb = await getDocuments(projectId);
  console.log("allDocumentsFromDb", allDocumentsFromDb);

  const shards = new IndexShards(false); // false = not using multiple threads

  const embeddingsModel = new OllamaEmbeddings({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text", // Default to nomic-embed-text
  });

  allDocumentsFromDb.map(async (item, index) => {
    const data = await FaissStore.load(
      `./vectors/${item.filename}`,
      embeddingsModel
    );
    shards.add(data);
    console.log("shards", shards);
  });
  return shards;
  // return shards.search(allDocumentsFromDb[0].embedding, 10);
  // const res = await fetch("/api/projects");
  // if (!res.ok) {
  //   throw new Error(`HTTP error! status: ${res.status}`);
  // }
  // const data = await res.json();
  // console.log("data 14", data);
  // setProjects(data.projects);
}
