// // utils/document-loader.ts
// import { Document } from "@langchain/core/documents";
// import * as fs from "fs/promises"; // Use fs/promises for async operations
// import * as path from "path";
// import mammoth from "mammoth"; // Or import * as mammoth from 'mammoth';
// import PdfParse from "pdf-parse"; // Make sure this is correctly imported

// // You might have interfaces or types here if they are defined in this file
// // Example:
// // interface DocMetadata {
// //   source: string;
// //   // other metadata properties
// // }

// export async function loadDocuments(dirPath) {
//   const documents = [];
//   const files = await fs.readdir(dirPath);

//   for (const file of files) {
//     const filePath = path.join(dirPath, file);
//     const fileExtension = path.extname(filePath).toLowerCase();

//     console.log(`Processing file: ${file}`);

//     try {
//       if (fileExtension === ".txt") {
//         const content = await fs.readFile(filePath, "utf-8");
//         documents.push(
//           new Document({
//             pageContent: content,
//             metadata: { source: file, type: "txt" },
//           })
//         );
//       } else if (fileExtension === ".pdf") {
//         const dataBuffer = await fs.readFile(filePath);
//         const data = await PdfParse(dataBuffer);
//         documents.push(
//           new Document({
//             pageContent: data.text,
//             metadata: { source: file, type: "pdf" },
//           })
//         );
//       } else if (fileExtension === ".docx") {
//         const dataBuffer = await fs.readFile(filePath);
//         const result = await mammoth.extractRawText({
//           arrayBuffer: dataBuffer,
//         });
//         documents.push(
//           new Document({
//             pageContent: result.value,
//             metadata: { source: file, type: "docx" },
//           })
//         );
//       } else {
//         console.warn(`Skipping unsupported file type: ${file}`);
//       }
//     } catch (error) {
//       console.error(`Error processing file ${file}:`, error);
//     }
//   }

//   return documents;
// }
