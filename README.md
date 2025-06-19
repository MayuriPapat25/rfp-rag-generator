Project Overview: The RFP Q&A RAG (Retrieval-Augmented Generation) application is designed to efficiently answer Requests for Proposals (RFPs) and Requests for Quotations (RFQs) by leveraging a customized knowledge base. Instead of relying solely on a large language model's pre-trained knowledge, it retrieves relevant, domain-specific information from your uploaded documents and uses that as context to generate precise answers. This approach significantly reduces "hallucinations" (incorrect or made-up information) and ensures responses are directly grounded in your proprietary data.

Model Choice: Specific Ollama Models Used
The application leverages the Ollama ecosystem for both text generation and embedding:
Ollama Chat Model (OLLAMA_CHAT_MODEL = "qwen3:0.6b" / "llama2"):

This is the Large Language Model (LLM) used for generating the final answer to the user's question.
qwen3:0.6b is part of the Qwen3 series, known for its instruction-following capabilities, human preference alignment, and multilingual support. It can handle complex logical reasoning and multi-turn dialogues, which is beneficial for generating coherent and relevant RFP/RFQ answers.
While the prompt explicitly requests a direct answer, the model's internal processing (sometimes seen as a <think> block in raw output) is an inherent behavior of some LLMs as they deliberate on the response. The prompt is designed to suppress this for the user-facing output.

I also tried llama2: Llama 2 is released by Meta Platforms, Inc. This model is trained on 2 trillion tokens, and by default supports a context length of 4096. Llama 2 Chat models are fine-tuned on over 1 million human annotations, and are made for chat. it's a powerful, open-source language model that's optimized for reasoning and question answering. With Ollama, you can run it locally with ease, enabling private, fast, and cost-effective inference.

Ollama Embedding Model (OLLAMA_EMBEDDING_MODEL = "nomic-embed-text"):
This model is specifically designed to create high-quality text embeddings (numerical representations of text).
nomic-embed-text is noted for its high performance and large token context window, surpassing some other popular embedding models.
Crucially, it is an "embedding-only" model, meaning its sole purpose is to generate embeddings; it cannot be used for direct chat or generation like qwen3:0.6b.

Chunking Strategy: For splitting documents into manageable pieces suitable for vector embedding and semantic search, we implemented LangChain’s RecursiveCharacterTextSplitter. It was configured with a chunkSize of 1000 characters and a chunkOverlap of 200 characters. This splitter recursively attempts to break text at increasingly granular semantic boundaries (\n\n, \n, space, then character), ensuring chunks remain logically coherent and minimize mid-sentence or mid-word breaks.

This approach was selected after testing alternatives like CharacterTextSplitter, which often split at arbitrary positions leading to incoherent chunks, and TokenTextSplitter, which, while token-aware, introduced additional dependency and configuration complexity. RecursiveCharacterTextSplitter provided the best balance of semantic preservation, simplicity, and consistent performance across formats like .pdf, .docx, and .txt.

These structured chunks are then embedded using OllamaEmbeddings and stored in a FAISS vector index, enabling accurate semantic retrieval and robust performance in retrieval-augmented generation (RAG) workflows.

Dynamic Prompting: To ensure accurate and context-aware responses to RFP/RFQ questions, our system uses a static but highly specialized prompt template tailored for professional, factual answering. This prompt is dynamically populated with the user’s question and the retrieved context from the FAISS vector store. It explicitly instructs the language model (via Ollama) to:

Only rely on the retrieved context (no external knowledge),

Avoid any fabrication or inference beyond what's present in the context,

Respond concisely and directly, omitting explanations, preambles, or conversational language,

Fail gracefully with a standard fallback response if the answer is not found in the context.

Here’s the core structure of the prompt we use:
const prompt = `You are an expert in hosting platforms and information security, tasked with drafting official responses to critical RFP/RFQ questions. Your primary directive is to provide factual, direct, and concise answers.

**CRITICAL GUIDELINES**:
1. Your sole source of truth is the "Provided Context" below.
2. If the exact information required to answer the RFP/RFQ question is NOT explicitly contained within the "Provided Context", you MUST respond with: "I do not have enough information in the knowledge base to answer this question."
3. DO NOT generate any information that is not directly supported by the "Provided Context".
4. Your final response MUST be ONLY the direct answer to the RFP/RFQ question. Do NOT include any introductory phrases, conversational elements, preambles, or explanations of your reasoning.

Provided Context:
${contextText || "No relevant information found in the provided context to answer the question."}

---

RFP/RFQ Question: ${question}

Direct Answer:`;
This approach ensures reliable, on-policy outputs suitable for enterprise use cases like RFP automation, where factual integrity and auditability are critical. While we currently use a single structured prompt, the system is designed to be extendable — future enhancements may include multi-intent prompting, fine-tuned classification, or adaptive reasoning chains depending on query type.

How to Run: 
1. Clone the Repository
   git clone https://github.com/your-username/rfp-rag-generator.git
   cd rfp-rag-generator

3. Install Dependencies
   Make sure you have Node.js (v18+) and npm or pnpm installed. Then run:
   npm install or pnpm install
4. Set Up Environment Variables
   Create a .env.local file in the root directory and add the following values:
  # URL of your local or remote Ollama instance
  OLLAMA_BASE_URL=http://localhost:11434
  # Embedding model name (make sure it's downloaded in Ollama)
  OLLAMA_EMBEDDING_MODEL=nomic-embed-text
  # MongoDB connection string
  MONGODB_URI=mongodb://localhost:27017/rfp_rag
  # MongoDB database name
  MONGODB_DB_NAME=rfp_rag

  💡 Tip: If you're using Ollama for the first time, install and start it locally:
  ollama run nomic-embed-text
  ollama run qwen3:0.6b

  4. Start the Development Server
     npm run dev
     Your app will be live at http://localhost:3000

5. Upload and Ask
   1.Go to the UI in your browser.
   2.Upload .pdf, .docx, or .txt files.
   3.Ask any RFP/RFQ-related question and get a precise answer from the uploaded documents.

🛠️ Optional: Pre-download Ollama Models
To avoid runtime delays, you can pre-pull the embedding model: ollama pull nomic-embed-text
You can also extend to use generation models (like llama3, mistral, etc.) if needed in future steps.

🧠 Vector Index Location
Embedded vectors are stored locally in:
./vectors/
This path can be modified in the upload route (/api/upload) if needed.
