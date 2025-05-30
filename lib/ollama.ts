// Install the Ollama JS client: `npm install ollama`
import ollama from "ollama";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama2"; // Or 'mistral', 'phi3', etc.

export async function generateResponseWithOllama(
  prompt: string
): Promise<string> {
  try {
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: false, // Set to true if you want streaming responses
    });
    return response.message.content;
  } catch (error) {
    console.error("Error communicating with Ollama:", error);
    throw new Error(
      "Failed to generate response with Ollama. Is Ollama running and model available?"
    );
  }
}

export async function initializeOllama() {
  try {
    const models = await ollama.list();
    const modelExists = models.models.some((m) =>
      m.name.startsWith(OLLAMA_MODEL)
    );

    if (!modelExists) {
      console.warn(
        `Ollama model "${OLLAMA_MODEL}" not found locally. Attempting to pull...`
      );
      // This will download the model. It might take a long time.
      await ollama.pull({ model: OLLAMA_MODEL });
      console.log(`Successfully pulled Ollama model: ${OLLAMA_MODEL}`);
    } else {
      console.log(`Ollama model "${OLLAMA_MODEL}" is already available.`);
    }
  } catch (error) {
    console.error("Failed to initialize Ollama or check model:", error);
  }
}
