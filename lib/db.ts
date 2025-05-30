import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface QAEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  embedding?: number[];
  createdAt: number;
}

export interface DocumentEntry {
  id: string;
  filename: string;
  fileType: string;
  content: string;
  embedding?: number[];
  createdAt: number;
}

// Define paths for our "database" files
const DATA_DIR = path.join(process.cwd(), "data");
const QA_FILE = path.join(DATA_DIR, "qa.json");
const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");

/**
 * Ensures the data directory exists.
 */
async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error ensuring data directory exists:", error);
  }
}

/**
 * Reads data from a JSON file. If file doesn't exist, returns an empty array.
 * @param filePath The path to the JSON file.
 * @returns An array of data from the file.
 */
async function readJsonFile<T>(filePath: string): Promise<T[]> {
  await ensureDataDirectory();
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T[];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // File not found, return empty array and create the file
      await fs.writeFile(filePath, "[]", "utf-8");
      return [];
    }
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

/**
 * Writes data to a JSON file.
 * @param filePath The path to the JSON file.
 * @param data The data to write.
 */
async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDirectory();
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    throw error;
  }
}

// --- QA Pair Operations ---

/**
 * Retrieves all Q&A pairs.
 */
export async function getQaPairs(): Promise<QAEntry[]> {
  return readJsonFile<QAEntry>(QA_FILE);
}

/**
 * Adds a new Q&A pair.
 * @param newQa The Q&A pair to add.
 * @returns The added Q&A pair with an ID and timestamp.
 */
export async function addQaPair(
  newQa: Omit<QAEntry, "id" | "createdAt">
): Promise<QAEntry> {
  const qaPairs = await getQaPairs();
  const qaToAdd: QAEntry = {
    id: uuidv4(), // Now uuidv4 is defined!
    createdAt: Date.now(),
    ...newQa,
  };
  qaPairs.push(qaToAdd);
  await writeJsonFile(QA_FILE, qaPairs);
  return qaToAdd;
}

/**
 * Deletes a Q&A pair by ID.
 * @param id The ID of the Q&A pair to delete.
 * @returns True if deleted, false if not found.
 */
export async function deleteQaPair(id: string): Promise<boolean> {
  const qaPairs = await getQaPairs();
  const initialLength = qaPairs.length;
  const filteredQaPairs = qaPairs.filter((qa) => qa.id !== id);
  if (filteredQaPairs.length === initialLength) {
    return false; // Not found
  }
  await writeJsonFile(QA_FILE, filteredQaPairs);
  return true;
}

// --- Document Operations ---

/**
 * Retrieves all documents.
 */
export async function getDocuments(): Promise<DocumentEntry[]> {
  return readJsonFile<DocumentEntry>(DOCUMENTS_FILE);
}

/**
 * Adds a new document.
 * @param newDoc The document to add.
 * @returns The added document with an ID and timestamp.
 */
export async function addDocument(
  newDoc: Omit<DocumentEntry, "id" | "createdAt">
): Promise<DocumentEntry> {
  const documents = await getDocuments();
  const docToAdd: DocumentEntry = {
    id: uuidv4(), // Now uuidv4 is defined!
    createdAt: Date.now(),
    ...newDoc,
  };
  documents.push(docToAdd);
  await writeJsonFile(DOCUMENTS_FILE, documents);
  return docToAdd;
}

/**
 * Deletes a document by ID.
 * @param id The ID of the document to delete.
 * @returns True if deleted, false if not found.
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const documents = await getDocuments();
  const initialLength = documents.length;
  const filteredDocuments = documents.filter((doc) => doc.id !== id);
  if (filteredDocuments.length === initialLength) {
    return false; // Not found
  }
  await writeJsonFile(DOCUMENTS_FILE, filteredDocuments);
  return true;
}
