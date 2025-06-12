import { NextResponse } from "next/server";
import ollama from "ollama";
import { getDocuments, IDocumentEntry } from "@/lib/db"; // Removed getQaPairs import
import { generateEmbedding } from "@/lib/embeddings"; // Import the embedding generation function

const OLLAMA_CHAT_MODEL = "llama2";
// const OLLAMA_CHAT_MODEL = "qwen3:0.6b";
// const OLLAMA_CHAT_MODEL = "qwen2.5";
const OLLAMA_EMBEDDING_MODEL = "nomic-embed-text"; // This model is used for embeddings

// Only FormattedDocumentEntry interface remains
interface FormattedDocumentEntry {
  id: string;
  filename: string;
  fileType: string;
  content: string;
  createdAt: number;
  projectName: string; // Ensure this is present for filtering consistency
  embedding?: number[]; // Ensure embedding is an optional property
}

// Helper function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (
    !vecA ||
    !vecB ||
    vecA.length === 0 ||
    vecB.length === 0 ||
    vecA.length !== vecB.length
  ) {
    return 0; // Invalid input, assume no similarity
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / (magnitudeA * magnitudeB);
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

    // 1. Generate embedding for the user's question
    const questionEmbedding = await generateEmbedding(question);
    console.log(
      "API Generate: Generated embedding for the user's question.",
      questionEmbedding
    );

    // 2. Fetch all relevant documents for the specified project
    const allDocuments = await getDocuments(projectName);
    console.log("allDocuments fetched:", allDocuments.length); // Adjusted log message

    // Prepare retrievable items for semantic search - now only documents
    let retrievableItems: FormattedDocumentEntry[] = [];

    // Process documents: Add the whole document as a chunk if it has an embedding.
    for (const doc of allDocuments) {
      if (doc.embedding && doc.embedding.length > 0) {
        retrievableItems.push({
          ...doc.toObject(), // Convert Mongoose document to plain object
          id: doc._id.toString(), // Ensure 'id' is a string
          createdAt: doc.createdAt.getTime(), // Convert Date to timestamp
          content: doc.content, // Ensure content is explicitly included if not part of toObject() or if type casting needs it
          filename: doc.filename, // Ensure filename is explicitly included
          fileType: doc.fileType, // Ensure fileType is explicitly included
          projectName: doc.projectName, // Ensure projectName is explicitly included
          embedding: doc.embedding, // Explicitly include embedding
        });
      }
    }
    console.log("retrievableItems prepared:", retrievableItems.length);

    // Filter out items without embeddings (safeguard, though already handled above)
    retrievableItems = retrievableItems.filter(
      (item) => item.embedding && item.embedding.length > 0
    );

    // Log all retrievable items before scoring
    console.log(
      `API Generate: Total retrievable items before semantic search: ${retrievableItems.length}`
    );
    retrievableItems.forEach((item, index) =>
      console.log(
        ` - Item ${index + 1} (Type: document_chunk, Project: ${
          item.projectName
        }, Has Embedding: ${!!item.embedding})`
      )
    );

    // 3. Perform semantic search to find top K relevant items
    const TOP_K = 8; // Number of top relevant documents to retrieve

    const scoredItems = retrievableItems
      .map((item) => ({
        item,
        similarity: cosineSimilarity(questionEmbedding, item.embedding!), // ! asserts non-null
      }))
      // Removed the similarity filter here to ensure TOP_K items are always selected
      .sort((a, b) => b.similarity - a.similarity) // Sort by similarity in descending order
      .slice(0, TOP_K); // Take only the top K

    console.log(
      `API Generate: Found ${scoredItems.length} relevant items (top ${TOP_K}).`
    );
    scoredItems.forEach((si) =>
      console.log(
        ` - Item ID: ${si.item.id}, Type: document_chunk, Filename: ${
          "filename" in si.item ? si.item.filename : "N/A"
        }, Similarity: ${si.similarity.toFixed(4)}`
      )
    );

    // 4. Construct context text from the content of the most relevant items
    const contextText = scoredItems
      .map(({ item }) => {
        console.log("item selected for context:", item.id);
        // This block now exclusively handles 'document_chunk' type
        return `Document Entry (Project: ${
          item.projectName || "N/A"
        }):\nFilename: ${item.filename}\nContent: ${item.content}`;
      })
      .join("\n\n---\n\n");

    // Log the final context sent to the LLM
    console.log(
      "API Generate: Final Context Sent to LLM (first 500 chars):\n",
      contextText.substring(0, 500) + (contextText.length > 500 ? "..." : "")
    );
    console.log("Complete contextText being sent to LLM:\n", contextText); // Added for full context inspection

    // ENHANCED PROMPT: Made the "don't know" instruction stronger and emphasized direct answer
    const prompt = `You are a highly diligent and precise information security expert specializing in hosting platforms, tasked with drafting official responses to critical RFP/RFQ questions. Your primary directive is to provide factual, direct, and concise answers.

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

    Direct Answer:`; // Emphasized the "Direct Answer:" part

    console.log("Final prompt being sent to Ollama:\n", prompt); // Added for full prompt inspection

    // Initiate a streaming chat session with the Ollama model.
    const ollamaResponseStream = await ollama.chat({
      model: OLLAMA_CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });
    console.log("ollamaResponseStream", ollamaResponseStream);
    // Create a ReadableStream to pipe the Ollama response chunks directly to the client.
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of ollamaResponseStream) {
          controller.enqueue(chunk.message.content);
        }
        controller.close();
      },
    });
    console.log("readableStream created for response.", readableStream);
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
