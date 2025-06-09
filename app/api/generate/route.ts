// app/api/generate/route.ts

// Import necessary modules from Next.js for API routes.
import { NextRequest, NextResponse } from "next/server";

// Import LangChain components for RAG functionality.
import { ChatOllama } from "@langchain/community/chat_models/ollama"; // For interacting with Ollama LLM
import { PromptTemplate } from "@langchain/core/prompts"; // For constructing the RAG prompt
import { StringOutputParser } from "@langchain/core/output_parsers"; // For parsing LLM output to string
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables"; // For building the RAG chain
import { formatDocumentsAsString } from "langchain/util/document"; // Utility for formatting retrieved documents

// Import your custom vector store loading utility.
// Ensure this path is correct relative to app/api/generate/route.ts
// It should point to the .js or .ts file based on your project's module resolution.
// Given your recent success, using .ts might be stable for development, but .js for build.
// Let's use .ts here, assuming tsx handles it during dev, and Next.js's bundler handles it for build.
import { loadVectorStore } from "../../../utils/vector-store"; // This now takes projectName

// Define Ollama models (can be constants or configurable)
const OLLAMA_CHAT_MODEL = "llama3"; // Ensure this model is pulled (e.g., `ollama pull llama3`)
// const OLLAMA_EMBEDDING_MODEL = "nomic-embed-text"; // Not directly used here, but needed by vector-store.ts

/**
 * Handles POST requests for generating RAG responses.
 * It expects a 'question' and a 'projectName' in the request body.
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body of the incoming request to get the user's question and selected project.
    const { question, projectName } = await req.json();

    // --- Input Validation ---
    if (!question || question.trim() === "") {
      console.error("Generate API Error: Question is required.");
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }
    if (!projectName || projectName.trim() === "") {
      console.error("Generate API Error: Project name is required.");
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const trimmedProjectName = projectName.trim();
    console.log(
      `Generate API: Received question for project "${trimmedProjectName}": "${question}"`
    );

    // 1. Load the vector store for the specific project.
    // This function will look for the Faiss index files within faiss_indexes/<projectName>/.
    console.log(
      `Generate API: Loading vector store for project "${trimmedProjectName}"...`
    );
    const vectorStore = await loadVectorStore(trimmedProjectName);
    console.log(
      `Generate API: Vector store for project "${trimmedProjectName}" loaded successfully.`
    );

    // 2. Create a retriever from the loaded vector store.
    // The retriever fetches relevant document chunks based on the user's question's embedding.
    const retriever = vectorStore.asRetriever();
    console.log("Generate API: Retriever created.");

    // 3. Initialize the Ollama language model for chat.
    // Ensure Ollama server is running locally and the specified chat model is pulled.
    const ollama = new ChatOllama({
      baseUrl: "http://localhost:11434", // Default Ollama URL
      model: OLLAMA_CHAT_MODEL, // Use the defined chat model
      temperature: 0.1, // Lower temperature for more factual responses
    });
    console.log(
      `Generate API: Ollama Chat model "${OLLAMA_CHAT_MODEL}" initialized.`
    );

    // 4. Define your Retrieval Augmented Generation (RAG) prompt template.
    // This template guides the LLM to answer using the provided context.
    const ragPrompt = PromptTemplate.fromTemplate(`
      You are an expert in hosting platforms and information security, specializing in responding to RFP/RFQ questions.
      Answer the following RFP/RFQ question based ONLY on the provided context.
      Ensure your answer is comprehensive, accurate, and professional, reflecting common industry best practices.
      If the information is not explicitly available in the context, state that you don't have enough information.
      Do not make up answers.
      Provide ONLY the direct answer to the RFP/RFQ question, without any preamble, introductory phrases, or conversational additions.

      Context:
      {context}

      ---

      RFP/RFQ Question: ${question}

      Direct Answer:`);

    // 5. Create the RAG chain using LangChain's Runnable API.
    // This chain orchestrates the retrieval and generation steps:
    // a) Retrieve: Uses the retriever to get relevant document chunks.
    // b) Format Context: Formats these chunks into a single string for the prompt.
    // c) Pass Question: Ensures the original question is also available for the prompt.
    // d) Combine: The prompt template combines context and question.
    // e) Generate: The Ollama LLM generates the response.
    // f) Parse Output: Converts the LLM's structured output into a plain string.
    const ragChain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString), // Retrieve and format context documents
        question: new RunnablePassthrough(), // Pass the original question
      },
      ragPrompt, // Apply the RAG prompt
      ollama, // Invoke the Ollama chat model
      new StringOutputParser(), // Parse the output into a string
    ]);
    console.log("Generate API: RAG chain constructed.");

    // --- Streaming Implementation for the API Route ---
    // Use the .stream() method on the LangChain RunnableSequence to get a streaming response.
    const ollamaResponseStream = await ragChain.stream(question); // Stream the response from the RAG chain

    // Create a ReadableStream for the Next.js Response.
    // This allows you to send chunks of the LLM's response as they are generated.
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of ollamaResponseStream) {
          // Each chunk from ragChain.stream() will be a string part of the answer.
          controller.enqueue(chunk); // Enqueue the text chunk to the response stream.
        }
        controller.close(); // Close the stream when all chunks have been sent.
      },
    });

    // Return the streaming response directly to the client.
    // Set 'Content-Type' to 'text/plain' or 'text/event-stream' if using SSE.
    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/plain", // Or 'text/event-stream' for Server-Sent Events
        "Cache-Control": "no-cache, no-transform", // Prevent caching
        Connection: "keep-alive", // Keep connection open for streaming
      },
    });
  } catch (error: any) {
    // Catch any errors during the process and return an appropriate error response.
    console.error(
      "Generate API: General error during response generation:",
      error
    );
    // Provide a user-friendly error message for the frontend.
    return NextResponse.json(
      {
        error: `Failed to generate response: ${
          error.message || "An unknown error occurred."
        }. Please ensure Ollama is running, the correct model is pulled, and the vector store is built for the selected project.`,
      },
      { status: 500 }
    );
  }
}
