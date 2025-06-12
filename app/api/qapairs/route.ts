import { NextResponse } from "next/server";
import { getQaPairs, addQaPair, deleteQaPair } from "@/lib/db"; // Import MongoDB-backed functions

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    console.log(
      `API Q&A: Received GET request. Extracted Project ID: ${projectId}`
    );

    const qaPairs = await getQaPairs(projectId || undefined); // Pass projectId or undefined
    const formattedQaPairs = qaPairs.map((qa) => ({
      ...qa.toObject(), // Convert Mongoose document to plain object
      id: qa._id.toString(), // Ensure 'id' is a string using MongoDB's _id
      createdAt: qa.createdAt.getTime(), // Convert Date to timestamp
    }));

    console.log(
      `API Q&A: Fetched ${formattedQaPairs.length} Q&A pairs for project ${
        projectId || "all projects"
      }.`
    );

    return NextResponse.json({ qaPairs: formattedQaPairs });
  } catch (error: any) {
    console.error("API Error /api/qapairs GET:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { question, answer, category, tags, projectName } = await req.json();

    if (!question || !answer || !category) {
      return NextResponse.json(
        { error: "Question, Answer, and Category are required" },
        { status: 400 }
      );
    }
    if (!projectName) {
      return NextResponse.json(
        { error: "Project name is required to add a Q&A pair." },
        { status: 400 }
      );
    }

    console.log(`API Q&A: Adding Q&A pair for project: ${projectName}`);

    // Call addQaPair from lib/db, ensuring projectName is passed
    const newQa = await addQaPair({
      question,
      answer,
      category,
      tags: tags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter(Boolean),
      projectName,
    });

    console.log(
      `API Q&A: Q&A pair added successfully for project ${projectName}.`
    );

    return NextResponse.json(
      {
        message: "Q&A pair added successfully",
        qaPair: {
          ...newQa.toObject(),
          id: newQa._id.toString(),
          createdAt: newQa.createdAt.getTime(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error /api/qapairs POST:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
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

    console.log(`API Q&A: Attempting to delete Q&A pair with ID: ${id}`);

    await deleteQaPair(id); // Call the MongoDB-backed deleteQaPair function

    console.log(`API Q&A: Q&A pair ${id} deleted successfully.`);

    return NextResponse.json({ message: "Q&A pair deleted successfully" });
  } catch (error: any) {
    console.error("API Error /api/qapairs DELETE:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
