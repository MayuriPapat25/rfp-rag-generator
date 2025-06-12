// app/api/chat_history/route.ts

import { NextResponse } from "next/server";
import { addChatEntry, getChatHistory, IChatHistoryEntry } from "@/lib/db";

// GET method to fetch chat history for a specific project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required to fetch chat history." },
        { status: 400 }
      );
    }

    console.log(
      `API Chat History: Fetching chat history for project: ${projectId}`
    );
    const chatHistory = await getChatHistory(projectId);

    // Format the Mongoose documents for sending over API
    const formattedChatHistory = chatHistory.map((entry) => ({
      id: entry._id.toString(),
      projectId: entry.projectId,
      question: entry.question,
      answer: entry.answer,
      timestamp: entry.timestamp.getTime(), // Convert Date to Unix timestamp (milliseconds)
    }));

    console.log(
      `API Chat History: Found ${formattedChatHistory.length} entries for project ${projectId}.`
    );
    return NextResponse.json({ chatHistory: formattedChatHistory });
  } catch (error: any) {
    console.error("API Error /api/chat_history GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history: " + error.message },
      { status: 500 }
    );
  }
}

// POST method to add a new chat entry
export async function POST(req: Request) {
  try {
    const { projectId, question, answer } = await req.json();

    if (!projectId || !question || !answer) {
      return NextResponse.json(
        {
          error:
            "Project ID, question, and answer are required to save chat history.",
        },
        { status: 400 }
      );
    }

    console.log(
      `API Chat History: Saving new chat entry for project: ${projectId}`
    );
    const newEntry = await addChatEntry({ projectId, question, answer });

    console.log(`API Chat History: Saved chat entry with ID: ${newEntry._id}.`);
    return NextResponse.json(
      {
        message: "Chat entry saved successfully",
        chatEntry: {
          id: newEntry._id.toString(),
          projectId: newEntry.projectId,
          question: newEntry.question,
          answer: newEntry.answer,
          timestamp: newEntry.timestamp.getTime(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error /api/chat_history POST:", error);
    return NextResponse.json(
      { error: "Failed to save chat entry: " + error.message },
      { status: 500 }
    );
  }
}
