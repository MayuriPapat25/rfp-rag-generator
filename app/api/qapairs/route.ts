import { NextResponse } from "next/server";
import { getQaPairs, addQaPair, deleteQaPair } from "@/lib/db";

export async function GET() {
  try {
    const qaPairs = await getQaPairs();
    return NextResponse.json({ qaPairs });
  } catch (error) {
    console.error("API Error /api/qapairs GET:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { question, answer, category, tags } = await req.json();
    if (!question || !answer || !category) {
      return NextResponse.json(
        { error: "Question, Answer, and Category are required" },
        { status: 400 }
      );
    }
    const newQa = await addQaPair({ question, answer, category, tags });
    return NextResponse.json(
      { message: "Q&A pair added successfully", qaPair: newQa },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error /api/qapairs POST:", error);
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
    const deleted = await deleteQaPair(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Q&A pair not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Q&A pair deleted successfully" });
  } catch (error) {
    console.error("API Error /api/qapairs DELETE:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
