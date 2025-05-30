import { NextResponse } from "next/server";
import ollama from "ollama";
import { getQaPairs, getDocuments, QAEntry, DocumentEntry } from "@/lib/db";

const OLLAMA_CHAT_MODEL = "llama2";
const OLLAMA_EMBEDDING_MODEL = "nomic-embed-text";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const qaPairs = await getQaPairs();
    const documents = await getDocuments();

    const allContexts: (QAEntry | DocumentEntry)[] = [
      ...qaPairs.map((qa) => ({ ...qa, type: "qa_pair" as const })),
      ...documents.map((doc) => ({ ...doc, type: "document_chunk" as const })),
    ];

    const contextText = allContexts
      .map((entry) => {
        if ("question" in entry) {
          return `Q&A Entry:\nQuestion: ${entry.question}\nAnswer: ${
            entry.answer
          }\nCategory: ${entry.category}\nTags: ${entry.tags.join(", ")}`;
        } else {
          return `Document Entry:\nFilename: ${entry.filename}\nContent: ${entry.content}`;
        }
      })
      .join("\n\n---\n\n");

    const prompt = `You are an expert in hosting platforms and information security, tasked with responding to RFP/RFQ questions.
    Use the following knowledge base to answer the question accurately and comprehensively.
    If the information is not explicitly available in the knowledge base, state that you don't have enough information.
    Do not make up answers.
    Provide ONLY the direct answer to the RFP/RFQ question, without any preamble, introductory phrases, or conversational additions.

    Knowledge Base:
    ${
      contextText ||
      "No relevant context found in knowledge base. Rely only on general knowledge if no context is provided."
    }

    ---

    RFP/RFQ Question: ${question}

    Direct Answer:`;

    //  STREAMING IMPLEMENTATION FOR THE API ROUTE
    const ollamaResponseStream = await ollama.chat({
      model: OLLAMA_CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    // Create a ReadableStream for the Next.js Response
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of ollamaResponseStream) {
          controller.enqueue(chunk.message.content);
        }
        controller.close();
      },
    });

    // Return the stream directly to the client
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
