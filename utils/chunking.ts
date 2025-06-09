// utils/chunking.ts
// This file provides a utility for splitting text into smaller chunks.

// Import the RecursiveCharacterTextSplitter from LangChain's textsplitters package.
// This splitter attempts to split text in a recursive manner using common delimiters
// to maintain context across chunks.
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Initialize the text splitter with specified chunk size and overlap.
// chunkSize: The maximum size (in characters) of each text chunk.
// chunkOverlap: The number of characters to overlap between consecutive chunks.
// This overlap helps ensure that important context is not lost when text is split.
export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // Example: Each chunk will aim for around 1000 characters
  chunkOverlap: 200, // Example: Chunks will overlap by 200 characters
});
