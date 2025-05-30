import { NextResponse } from "next/server";
import { getDocuments, deleteDocument } from "@/lib/db";

export async function GET() {
  try {
    const documents = await getDocuments();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("API Error /api/documents GET:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const deleted = await deleteDocument(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("API Error /api/documents DELETE:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
