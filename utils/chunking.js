import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
