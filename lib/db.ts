// import fs from "fs/promises";
// import path from "path";
// import { v4 as uuidv4 } from "uuid";

// export interface QAEntry {
//   id: string;
//   question: string;
//   answer: string;
//   category: string;
//   tags: string[];
//   embedding?: number[];
//   createdAt: number;
// }

// export interface DocumentEntry {
//   id: string;
//   filename: string;
//   fileType: string;
//   content: string;
//   embedding?: number[];
//   createdAt: number;
// }

// // Define paths for our "database" files
// const DATA_DIR = path.join(process.cwd(), "data");
// const QA_FILE = path.join(DATA_DIR, "qa.json");
// const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");

// /**
//  * Ensures the data directory exists.
//  */
// async function ensureDataDirectory() {
//   try {
//     await fs.mkdir(DATA_DIR, { recursive: true });
//   } catch (error) {
//     console.error("Error ensuring data directory exists:", error);
//   }
// }

// /**
//  * Reads data from a JSON file. If file doesn't exist, returns an empty array.
//  * @param filePath The path to the JSON file.
//  * @returns An array of data from the file.
//  */
// async function readJsonFile<T>(filePath: string): Promise<T[]> {
//   await ensureDataDirectory();
//   try {
//     const data = await fs.readFile(filePath, "utf-8");
//     return JSON.parse(data) as T[];
//   } catch (error: any) {
//     if (error.code === "ENOENT") {
//       // File not found, return empty array and create the file
//       await fs.writeFile(filePath, "[]", "utf-8");
//       return [];
//     }
//     console.error(`Error reading ${filePath}:`, error);
//     throw error;
//   }
// }

// /**
//  * Writes data to a JSON file.
//  * @param filePath The path to the JSON file.
//  * @param data The data to write.
//  */
// async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
//   await ensureDataDirectory();
//   try {
//     await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
//   } catch (error) {
//     console.error(`Error writing to ${filePath}:`, error);
//     throw error;
//   }
// }

// // --- QA Pair Operations ---

// /**
//  * Retrieves all Q&A pairs.
//  */
// export async function getQaPairs(): Promise<QAEntry[]> {
//   return readJsonFile<QAEntry>(QA_FILE);
// }

// /**
//  * Adds a new Q&A pair.
//  * @param newQa The Q&A pair to add.
//  * @returns The added Q&A pair with an ID and timestamp.
//  */
// export async function addQaPair(
//   newQa: Omit<QAEntry, "id" | "createdAt">
// ): Promise<QAEntry> {
//   const qaPairs = await getQaPairs();
//   const qaToAdd: QAEntry = {
//     id: uuidv4(), // Now uuidv4 is defined!
//     createdAt: Date.now(),
//     ...newQa,
//   };
//   qaPairs.push(qaToAdd);
//   await writeJsonFile(QA_FILE, qaPairs);
//   return qaToAdd;
// }

// /**
//  * Deletes a Q&A pair by ID.
//  * @param id The ID of the Q&A pair to delete.
//  * @returns True if deleted, false if not found.
//  */
// export async function deleteQaPair(id: string): Promise<boolean> {
//   const qaPairs = await getQaPairs();
//   const initialLength = qaPairs.length;
//   const filteredQaPairs = qaPairs.filter((qa) => qa.id !== id);
//   if (filteredQaPairs.length === initialLength) {
//     return false; // Not found
//   }
//   await writeJsonFile(QA_FILE, filteredQaPairs);
//   return true;
// }

// // --- Document Operations ---

// /**
//  * Retrieves all documents.
//  */
// export async function getDocuments(): Promise<DocumentEntry[]> {
//   return readJsonFile<DocumentEntry>(DOCUMENTS_FILE);
// }

// /**
//  * Adds a new document.
//  * @param newDoc The document to add.
//  * @returns The added document with an ID and timestamp.
//  */
// export async function addDocument(
//   newDoc: Omit<DocumentEntry, "id" | "createdAt">
// ): Promise<DocumentEntry> {
//   const documents = await getDocuments();
//   const docToAdd: DocumentEntry = {
//     id: uuidv4(), // Now uuidv4 is defined!
//     createdAt: Date.now(),
//     ...newDoc,
//   };
//   documents.push(docToAdd);
//   await writeJsonFile(DOCUMENTS_FILE, documents);
//   return docToAdd;
// }

// /**
//  * Deletes a document by ID.
//  * @param id The ID of the document to delete.
//  * @returns True if deleted, false if not found.
//  */
// export async function deleteDocument(id: string): Promise<boolean> {
//   const documents = await getDocuments();
//   const initialLength = documents.length;
//   const filteredDocuments = documents.filter((doc) => doc.id !== id);
//   if (filteredDocuments.length === initialLength) {
//     return false; // Not found
//   }
//   await writeJsonFile(DOCUMENTS_FILE, filteredDocuments);
//   return true;
// }

// lib/db.ts

// Import Node.js built-in modules for file system operations and path manipulation.
import fs from "fs/promises";
import path from "path";

// Import a UUID generator for unique IDs.
import { v4 as uuidv4 } from "uuid";

// Define interfaces for your data structures.

// Interface for Q&A entries.
export interface QAEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  embedding?: number[]; // Optional: if you pre-compute and store embeddings here
  createdAt: number;
}

// Interface for document entries.
// IMPORTANT: Added 'projectName' to link documents to specific projects.
export interface DocumentEntry {
  id: string;
  filename: string;
  fileType: string;
  content: string;
  embedding?: number[]; // Optional: if you pre-compute and store embeddings here
  projectName: string; // <--- NEW: Project name associated with the document
  createdAt: number;
}

// Define paths for our file-based "database".
// These JSON files will store the respective data.
const DATA_DIR = path.join(process.cwd(), "data"); // Base directory for data files
const QA_FILE = path.join(DATA_DIR, "qa.json"); // File for Q&A pairs
const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json"); // File for documents

/**
 * Ensures the main data directory exists.
 * This is a foundational step before reading from or writing to any data files.
 */
async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log(`Data directory ensured: ${DATA_DIR}`);
  } catch (error) {
    console.error("Error ensuring data directory exists:", error);
    // Depending on the application's robustness, you might want to throw the error
    // or handle specific error codes (e.g., EEXIST if it already exists).
  }
}

/**
 * Reads data from a JSON file.
 * If the file does not exist, it initializes it as an empty array and returns it.
 * This prevents errors when trying to read from non-existent files.
 * @param filePath The absolute path to the JSON file.
 * @returns A promise that resolves to an array of data of type T.
 */
async function readJsonFile<T>(filePath: string): Promise<T[]> {
  await ensureDataDirectory(); // Ensure the parent directory exists first
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T[];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // File not found, return empty array and create the file with an empty array.
      console.warn(
        `File not found: ${filePath}. Initializing with empty array.`
      );
      await fs.writeFile(filePath, "[]", "utf-8");
      return [];
    }
    console.error(`Error reading ${filePath}:`, error);
    throw error; // Re-throw other errors (e.g., parsing issues, permissions)
  }
}

/**
 * Writes data to a JSON file.
 * The data is stringified with 2-space indentation for readability.
 * @param filePath The absolute path to the JSON file.
 * @param data The array of data of type T to write to the file.
 */
async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDirectory(); // Ensure the parent directory exists first
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    throw error;
  }
}

// --- QA Pair Operations ---

/**
 * Retrieves all Q&A pairs from the qa.json file.
 * @returns A promise that resolves to an array of QAEntry objects.
 */
export async function getQaPairs(): Promise<QAEntry[]> {
  return readJsonFile<QAEntry>(QA_FILE);
}

/**
 * Adds a new Q&A pair to the qa.json file.
 * @param newQa The Q&A pair to add (without id or createdAt).
 * @returns A promise that resolves to the newly added QAEntry object (with id and createdAt).
 */
export async function addQaPair(
  newQa: Omit<QAEntry, "id" | "createdAt">
): Promise<QAEntry> {
  const qaPairs = await getQaPairs();
  const qaToAdd: QAEntry = {
    id: uuidv4(), // Generate a unique ID
    createdAt: Date.now(), // Set creation timestamp
    ...newQa, // Spread the rest of the new Q&A data
  };
  qaPairs.push(qaToAdd); // Add to the array
  await writeJsonFile(QA_FILE, qaPairs); // Write updated array back to file
  console.log(
    `Added Q&A pair: ID=${qaToAdd.id}, Question="${qaToAdd.question.substring(
      0,
      50
    )}..."`
  );
  return qaToAdd;
}

/**
 * Deletes a Q&A pair from the qa.json file by its ID.
 * @param id The ID of the Q&A pair to delete.
 * @returns A promise that resolves to true if deleted, false if not found.
 */
export async function deleteQaPair(id: string): Promise<boolean> {
  const qaPairs = await getQaPairs();
  const initialLength = qaPairs.length;
  // Filter out the QA pair with the matching ID
  const filteredQaPairs = qaPairs.filter((qa) => qa.id !== id);
  if (filteredQaPairs.length === initialLength) {
    console.warn(`Q&A pair with ID=${id} not found for deletion.`);
    return false; // Not found
  }
  await writeJsonFile(QA_FILE, filteredQaPairs); // Write updated array back to file
  console.log(`Deleted Q&A pair with ID=${id}.`);
  return true;
}

// --- Document Operations ---

/**
 * Retrieves all documents from the documents.json file.
 * NOTE: This loads ALL documents. Use getDocumentsByProject for filtered retrieval.
 * @returns A promise that resolves to an array of DocumentEntry objects.
 */
export async function getDocuments(): Promise<DocumentEntry[]> {
  return readJsonFile<DocumentEntry>(DOCUMENTS_FILE);
}

/**
 * Adds a new document entry to the documents.json file.
 * IMPORTANT: This function now expects 'projectName' as part of the newDoc.
 * @param newDoc The document to add (without id or createdAt).
 * @returns A promise that resolves to the newly added DocumentEntry object.
 */
export async function addDocument(
  newDoc: Omit<DocumentEntry, "id" | "createdAt">
): Promise<DocumentEntry> {
  const documents = await getDocuments(); // Read all existing documents
  const docToAdd: DocumentEntry = {
    id: uuidv4(), // Generate a unique ID
    createdAt: Date.now(), // Set creation timestamp
    ...newDoc, // Spread the rest of the new document data, including projectName
  };
  documents.push(docToAdd); // Add to the array
  await writeJsonFile(DOCUMENTS_FILE, documents); // Write updated array back to file
  console.log(
    `Added document to DB: ${docToAdd.filename} (Project: ${docToAdd.projectName})`
  );
  return docToAdd;
}

/**
 * Deletes a document from the documents.json file by its ID.
 * @param id The ID of the document to delete.
 * @returns A promise that resolves to true if deleted, false if not found.
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const documents = await getDocuments();
  const initialLength = documents.length;
  // Filter out the document with the matching ID
  const filteredDocuments = documents.filter((doc) => doc.id !== id);
  if (filteredDocuments.length === initialLength) {
    console.warn(`Document with ID=${id} not found for deletion.`);
    return false; // Not found
  }
  await writeJsonFile(DOCUMENTS_FILE, filteredDocuments); // Write updated array back to file
  console.log(`Deleted document with ID=${id}.`);
  return true;
}

/**
 * Retrieves documents belonging to a specific project from the documents.json file.
 * This is crucial for project-wise ingestion.
 * @param projectName The name of the project to retrieve documents for.
 * @returns A promise that resolves to an array of DocumentEntry objects for the specified project.
 */
export async function getDocumentsByProject(
  projectName: string
): Promise<DocumentEntry[]> {
  console.log(`DB: Retrieving documents for project "${projectName}"...`);
  const allDocuments = await getDocuments(); // Get all documents
  // Filter documents by the provided project name (case-sensitive for exact match)
  const projectDocs = allDocuments.filter(
    (doc) => doc.projectName === projectName
  );
  console.log(
    `DB: Found ${projectDocs.length} documents for project "${projectName}".`
  );
  return projectDocs;
}

/**
 * Retrieves a list of all unique project names present in the documents.
 * This can be used for populating project selection lists in the UI.
 * @returns A promise that resolves to an array of unique project names (strings).
 */
export async function getProjectNames(): Promise<string[]> {
  const allDocuments = await getDocuments();
  const projectNames = new Set<string>(); // Use a Set to store unique project names
  for (const doc of allDocuments) {
    if (doc.projectName) {
      // Ensure projectName exists
      projectNames.add(doc.projectName);
    }
  }
  const uniqueProjectNames = Array.from(projectNames);
  console.log(
    `DB: Found ${
      uniqueProjectNames.length
    } unique projects: ${uniqueProjectNames.join(", ")}`
  );
  return uniqueProjectNames;
}

/**
 * Deletes all documents associated with a specific project name from documents.json.
 * @param projectName The name of the project whose documents should be deleted.
 */
export async function deleteDocumentsByProject(
  projectName: string
): Promise<void> {
  console.log(
    `DB: Attempting to delete all documents for project "${projectName}"...`
  );
  const allDocuments = await getDocuments(); // Assuming getDocuments() exists and reads from documents.json
  const initialCount = allDocuments.length;
  // Filter out documents belonging to the specified project
  const filteredDocuments = allDocuments.filter(
    (doc) => doc.projectName !== projectName
  );

  if (filteredDocuments.length === initialCount) {
    console.warn(
      `DB: No documents found for project "${projectName}" to delete.`
    );
  } else {
    await writeJsonFile(DOCUMENTS_FILE, filteredDocuments); // Save the filtered list back
    console.log(
      `DB: Deleted <span class="math-inline">\{initialCount \- filteredDocuments\.length\} documents for project "</span>{projectName}".`
    );
  }
}
