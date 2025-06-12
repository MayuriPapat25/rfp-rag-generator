// lib/db.ts - MongoDB (Mongoose) Integration

import mongoose, { Schema, Document, Model } from "mongoose";

// Environment variable for MongoDB connection string
// In a Next.js app, these are typically accessed via process.env
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Interfaces for Document and QA entries (extend Mongoose Document)
export interface IDocumentEntry extends Document {
  filename: string;
  fileType: string;
  content: string;
  embedding?: number[];
  createdAt: Date; // Stored as Date, Mongoose handles timestamping
  projectName: string; // Crucial for filtering
}

// export interface IQAEntry extends Document {
//   question: string;
//   answer: string;
//   category: string;
//   tags: string[];
//   createdAt: Date; // Stored as Date, Mongoose handles timestamping
//   projectName: string; // Crucial for filtering
// }

export interface IProjectEntry extends Document {
  name: string;
  createdAt: Date; // Stored as Date
}

export interface IChatHistoryEntry extends Document {
  projectId: string; // Link to the project
  question: string;
  answer: string;
  timestamp: Date; // When the chat entry was created
}

// Mongoose Schemas
const DocumentSchema: Schema = new Schema({
  filename: { type: String, required: true },
  fileType: { type: String, required: true },
  content: { type: String, required: true },
  embedding: { type: [Number], required: false }, // Array of numbers
  projectName: { type: String, required: true, index: true }, // Index for efficient querying
  createdAt: { type: Date, default: Date.now }, // Mongoose handles default timestamp
});

// const QASchema: Schema = new Schema({
//   question: { type: String, required: true },
//   answer: { type: String, required: true },
//   category: { type: String, required: true },
//   tags: { type: [String], required: false, default: [] },
//   projectName: { type: String, required: true, index: true }, // Index for efficient querying
//   createdAt: { type: Date, default: Date.now }, // Mongoose handles default timestamp
// });

const ProjectSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, index: true }, // Project name should be unique
  createdAt: { type: Date, default: Date.now },
});

// NEW SCHEMA for Chat History
const ChatHistorySchema: Schema = new Schema({
  projectId: { type: String, required: true, index: true }, // Link to project
  question: { type: String, required: true },
  answer: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }, // Timestamp for the chat entry
});

// Mongoose Models
// Use a check to prevent recompiling models in Next.js development mode
export const DocumentModel: Model<IDocumentEntry> =
  mongoose.models.Document ||
  mongoose.model<IDocumentEntry>("Document", DocumentSchema);
// export const QAModel: Model<IQAEntry> =
//   mongoose.models.QA || mongoose.model<IQAEntry>("QA", QASchema);
export const ProjectModel: Model<IProjectEntry> =
  mongoose.models.Project ||
  mongoose.model<IProjectEntry>("Project", ProjectSchema);
export const ChatHistoryModel: Model<IChatHistoryEntry> =
  mongoose.models.ChatHistory ||
  mongoose.model<IChatHistoryEntry>("ChatHistory", ChatHistorySchema); // NEW MODEL

// Database connection
let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log("MongoDB is already connected.");
    return;
  }
  try {
    console.log("Attempting to connect to MongoDB with URI:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI!, {
      // useNewUrlParser: true, // Deprecated in Mongoose 6+
      // useUnifiedTopology: true, // Deprecated in Mongoose 6+
      dbName: "rfp_rag_db", // Specify your database name here
    });
    isConnected = true;
    console.log("MongoDB connected successfully!");
  } catch (error: any) {
    console.error("MongoDB connection failed:", error.message);
    throw new Error("MongoDB connection failed.");
  }
}

// Call connectDB once on module load (for serverless functions, this is fine)
// For Next.js API routes, it's safer to call connectDB at the start of each API handler.
// await connectDB(); // Removed, better to call per API route.

// --- Document Operations ---

export async function addDocument(
  docData: Omit<IDocumentEntry, "_id" | "createdAt">
): Promise<IDocumentEntry> {
  await connectDB();
  try {
    const newDoc = new DocumentModel(docData);
    const savedDoc = await newDoc.save();
    console.log(
      "Document added to MongoDB with ID:",
      savedDoc._id,
      "for project:",
      savedDoc.projectName
    );
    return savedDoc;
  } catch (error: any) {
    console.error("Error adding document to MongoDB:", error);
    throw new Error(`Failed to add document: ${error.message}`);
  }
}

export async function getDocuments(
  projectId?: string
): Promise<IDocumentEntry[]> {
  await connectDB();
  try {
    let query: any = {};
    if (projectId) {
      query.projectName = projectId;
      console.log("MongoDB: Querying documents for projectId:", projectId);
    } else {
      console.warn(
        "MongoDB: getDocuments called without projectId. Fetching all documents (not recommended for large datasets)."
      );
    }
    const documents = await DocumentModel.find(query).exec();
    console.log(`MongoDB: Found ${documents.length} documents.`);
    return documents;
  } catch (error: any) {
    console.error("Error getting documents from MongoDB:", error);
    throw new Error(`Failed to get documents: ${error.message}`);
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  await connectDB();
  try {
    const result = await DocumentModel.deleteOne({ _id: documentId }).exec();
    if (result.deletedCount === 0) {
      throw new Error(`Document with ID ${documentId} not found.`);
    }
    console.log("Document deleted from MongoDB with ID:", documentId);
  } catch (error: any) {
    console.error("Error deleting document from MongoDB:", error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// // --- Q&A Pair Operations ---

// export async function addQaPair(
//   qaData: Omit<IQAEntry, "_id" | "createdAt">
// ): Promise<IQAEntry> {
//   await connectDB();
//   try {
//     const newQa = new QAModel(qaData);
//     const savedQa = await newQa.save();
//     console.log(
//       "Q&A Pair added to MongoDB with ID:",
//       savedQa._id,
//       "for project:",
//       savedQa.projectName
//     );
//     return savedQa;
//   } catch (error: any) {
//     console.error("Error adding Q&A pair to MongoDB:", error);
//     throw new Error(`Failed to add Q&A pair: ${error.message}`);
//   }
// }

// export async function getQaPairs(projectId?: string): Promise<IQAEntry[]> {
//   await connectDB();
//   try {
//     let query: any = {};
//     if (projectId) {
//       query.projectName = projectId;
//       console.log("MongoDB: Querying QA pairs for projectId:", projectId);
//     } else {
//       console.warn(
//         "MongoDB: getQaPairs called without projectId. Fetching all QA pairs (not recommended for large datasets)."
//       );
//     }
//     const qaPairs = await QAModel.find(query).exec();
//     console.log(`MongoDB: Found ${qaPairs.length} QA pairs.`);
//     return qaPairs;
//   } catch (error: any) {
//     console.error("Error getting QA pairs from MongoDB:", error);
//     throw new Error(`Failed to get QA pairs: ${error.message}`);
//   }
// }

// export async function deleteQaPair(qaId: string): Promise<void> {
//   await connectDB();
//   try {
//     const result = await QAModel.deleteOne({ _id: qaId }).exec();
//     if (result.deletedCount === 0) {
//       throw new Error(`Q&A Pair with ID ${qaId} not found.`);
//     }
//     console.log("Q&A Pair deleted from MongoDB with ID:", qaId);
//   } catch (error: any) {
//     console.error("Error deleting Q&A pair from MongoDB:", error);
//     throw new Error(`Failed to delete Q&A pair: ${error.message}`);
//   }
// }

// --- Project Operations ---

export async function addProject(
  projectData: Omit<IProjectEntry, "_id" | "createdAt">
): Promise<IProjectEntry> {
  await connectDB();
  try {
    const newProject = new ProjectModel(projectData);
    const savedProject = await newProject.save();
    console.log("Project added to MongoDB with ID:", savedProject._id);
    return savedProject;
  } catch (error: any) {
    console.error("Error adding project to MongoDB:", error);
    throw new Error(`Failed to add project: ${error.message}`);
  }
}

export async function getProjects(): Promise<IProjectEntry[]> {
  await connectDB();
  try {
    const projects = await ProjectModel.find({}).exec();
    console.log(`MongoDB: Found ${projects.length} projects.`);
    return projects;
  } catch (error: any) {
    console.error("Error getting projects from MongoDB:", error);
    throw new Error(`Failed to get projects: ${error.message}`);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  await connectDB();
  // Removed transaction logic as it's not supported on standalone MongoDB instances
  try {
    // Delete the project itself
    const projectResult = await ProjectModel.deleteOne({ _id: projectId });
    if (projectResult.deletedCount === 0) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }
    console.log(`MongoDB: Deleted project ${projectId}.`);

    // Delete associated documents
    const docResult = await DocumentModel.deleteMany({
      projectName: projectId,
    });
    console.log(
      `MongoDB: Deleted ${docResult.deletedCount} documents for project ${projectId}.`
    );

    // Delete associated Q&A pairs
    // const qaResult = await QAModel.deleteMany({ projectName: projectId });
    // console.log(
    //   `MongoDB: Deleted ${qaResult.deletedCount} Q&A pairs for project ${projectId}.`
    // );

    console.log(
      `MongoDB: Project ${projectId} and all associated data deleted successfully.`
    );
  } catch (error: any) {
    console.error(
      "Error deleting project and associated data from MongoDB:",
      error
    );
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

export async function addChatEntry(
  chatData: Omit<IChatHistoryEntry, "_id" | "timestamp">
): Promise<IChatHistoryEntry> {
  await connectDB();
  try {
    const newChatEntry = new ChatHistoryModel(chatData);
    const savedChatEntry = await newChatEntry.save();
    console.log(
      "Chat history entry added to MongoDB with ID:",
      savedChatEntry._id,
      "for project:",
      savedChatEntry.projectId
    );
    return savedChatEntry;
  } catch (error: any) {
    console.error("Error adding chat history entry to MongoDB:", error);
    throw new Error(`Failed to add chat history entry: ${error.message}`);
  }
}

export async function getChatHistory(
  projectId: string
): Promise<IChatHistoryEntry[]> {
  await connectDB();
  try {
    const chatHistory = await ChatHistoryModel.find({ projectId: projectId })
      .sort({ timestamp: 1 }) // Sort by timestamp ascending
      .exec();
    console.log(
      `MongoDB: Found ${chatHistory.length} chat history entries for project: ${projectId}.`
    );
    return chatHistory;
  } catch (error: any) {
    console.error("Error getting chat history from MongoDB:", error);
    throw new Error(`Failed to get chat history: ${error.message}`);
  }
}
