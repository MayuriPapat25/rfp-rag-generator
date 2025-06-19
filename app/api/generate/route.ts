import { NextResponse } from "next/server";
import ollama from "ollama";
import { getDocuments } from "@/lib/db"; // MongoDB document fetching
import { loadProjectFaissStore } from "@/lib/server/faiss";

// const OLLAMA_CHAT_MODEL = "llama2";
const OLLAMA_CHAT_MODEL = "qwen3:0.6b";

interface FormattedDocumentEntry {
  id: string;
  filename: string;
  fileType: string;
  content: string;
  createdAt: number;
  projectName: string;
  embedding?: number[];
  type: "document_chunk";
}

export async function POST(req: Request) {
  try {
    const { question, projectName } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    console.log(
      `API Generate: Received question: "${question}" for project: "${projectName}"`
    );

    // 1. Fetch all relevant documents for the specified project from MongoDB
    const allDocumentsFromDb = await getDocuments(projectName);
    console.log("allDocuments fetched from DB:", allDocumentsFromDb.length);

    const filePaths = allDocumentsFromDb.map(
      (doc) => `./vectors/${doc.filename}`
    );
    const vectorStore = await loadProjectFaissStore(filePaths);
    const TOP_K = 8;

    let relevantDocs;
    if (typeof vectorStore.similaritySearch === "function") {
      relevantDocs = await vectorStore.similaritySearch(question, TOP_K);
    } else if (typeof vectorStore.similaritySearchWithScore === "function") {
      relevantDocs = await vectorStore.similaritySearchWithScore(
        question,
        TOP_K
      );
    } else {
      throw new Error("No similarity search method found on vectorStore");
    }
    console.log("relevantDocs 63", relevantDocs);

    const contextText = relevantDocs
      .map((doc) => {
        // LangChain Document has pageContent and metadata
        return `Document Entry (Project: ${
          doc.metadata.projectName || "N/A"
        }):\nFilename: ${doc.metadata.filename}\nContent: ${doc.pageContent}`;
      })
      .join("\n\n---\n\n");

    // Log the final context sent to the LLM
    console.log(
      "API Generate: Final Context Sent to LLM (first 500 chars):\n",
      contextText.substring(0, 500) + (contextText.length > 500 ? "..." : "")
    );
    console.log("Complete contextText being sent to LLM:\n", contextText);

    // Prompt remains the same
    const prompt = `You are an expert in hosting platforms and information security, tasked with drafting official responses to critical RFP/RFQ questions. Your primary directive is to provide factual, direct, and concise answers.

    **CRITICAL GUIDELINES**:
    1.  Your sole source of truth is the "Provided Context" below.
    2.  If the exact information required to answer the RFP/RFQ question is NOT explicitly contained within the "Provided Context", you MUST respond with: "I do not have enough information in the knowledge base to answer this question."
    3.  DO NOT generate any information that is not directly supported by the "Provided Context".
    4.  Your final response MUST be ONLY the direct answer to the RFP/RFQ question. Do NOT include any introductory phrases, conversational elements, preambles, or explanations of your reasoning.

    Provided Context:
    ${
      contextText ||
      "No relevant information found in the provided context to answer the question."
    }

    ---

    RFP/RFQ Question: ${question}

    Direct Answer:`;

    console.log("Final prompt being sent to Ollama:\n", prompt);

    // Initiate a streaming chat session with the Ollama model.
    const ollamaResponseStream = await ollama.chat({
      model: OLLAMA_CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    // Create a ReadableStream to pipe the Ollama response chunks directly to the client.
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of ollamaResponseStream) {
          controller.enqueue(chunk.message.content);
        }
        controller.close();
      },
    });
    console.log("readableStream created for response.");
    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error: any) {
    console.error("API Error /api/generate:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
