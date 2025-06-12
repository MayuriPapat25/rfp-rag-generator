import { NextResponse } from "next/server";
import { getDocuments, deleteDocument } from "@/lib/db"; // Import MongoDB-backed functions

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    console.log(
      `API Documents: Received GET request. Extracted Project ID: ${projectId}`
    );

    const documents = await getDocuments(projectId || undefined); // Pass projectId or undefined
    const formattedDocuments = documents.map((doc) => ({
      ...doc.toObject(), // Convert Mongoose document to plain object
      id: doc._id.toString(), // Ensure 'id' is a string using MongoDB's _id
      createdAt: doc.createdAt.getTime(), // Convert Date to timestamp
    }));

    console.log(
      `API Documents: Fetched ${
        formattedDocuments.length
      } documents for project ${projectId || "all projects"}.`
    );

    return NextResponse.json({ documents: formattedDocuments });
  } catch (error: any) {
    console.error("API Error /api/documents GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const documentIdToDelete = searchParams.get("id");

    if (!documentIdToDelete) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 }
      );
    }

    await deleteDocument(documentIdToDelete); // Call the MongoDB-backed deleteDocument function
    console.log(
      `API Documents: Document ${documentIdToDelete} deleted successfully.`
    );

    return NextResponse.json(
      { message: "Document deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error /api/documents DELETE:", error);
    return NextResponse.json(
      { error: `Failed to delete document: ${error.message}` },
      { status: 500 }
    );
  }
}
