import { generateEmbedding } from "./embeddings"; // Function to get embeddings from Hugging Face (or via API)
import { retrieveRelevantDocuments } from "./db"; // Function to query your vector database
import { generateResponseWithOllama } from "./ollama"; // Function to interact with Ollama

/**
 * Orchestrates the RAG process: Retrieval and Generation.
 * @param question The user's RFP/RFQ question.
 * @returns The generated response.
 */
export async function retrieveAndGenerate(question: string): Promise<string> {
  const questionEmbedding = await generateEmbedding(question);

  const relevantContexts = await retrieveRelevantDocuments(
    questionEmbedding,
    5
  ); // Retrieve top 5

  // 3. Construct the prompt for the LLM
  // Combine the original question with the retrieved contexts.
  const contextText = relevantContexts
    .map(
      (doc: {
        type: string;
        question: any;
        answer: any;
        filename: any;
        text_content: any;
      }) => {
        if (doc.type === "qa_pair") {
          return `Q: ${doc.question}\nA: ${doc.answer}`;
        } else if (doc.type === "document_chunk") {
          return `Document Snippet (from ${doc.filename}): ${doc.text_content}`;
        }
        return ""; // Fallback
      }
    )
    .join("\n\n---\n\n");

  const prompt = `You are an expert in hosting platforms and information security, tasked with responding to RFP/RFQ questions.
  Use the following knowledge base to answer the question accurately and comprehensively.
  If the information is not in the knowledge base, state that you don't have enough information.

  Knowledge Base:
  ${contextText}

  ---

  RFP/RFQ Question: ${question}

  Your Response:`;

  console.log("Prompt sent to LLM:\n", prompt);

  const generatedResponse = await generateResponseWithOllama(prompt);

  return generatedResponse;
}
