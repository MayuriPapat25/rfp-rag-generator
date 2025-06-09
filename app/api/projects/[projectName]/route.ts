// app/api/projects/[projectName]/route.ts
// Create this new file in your project

import { NextRequest, NextResponse } from "next/server";
import { deleteDocumentsByProject } from "@/lib/db"; // Adjust path if needed, e.g., '../../../../lib/db'
import { deleteVectorStore } from "@/utils/vector-store"; // Adjust path if needed, e.g., '../../../../utils/vector-store'

// DELETE handler for deleting a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectName: string } } // Access dynamic segment from URL
) {
  const projectName = decodeURIComponent(params.projectName); // Decode the project name from the URL

  if (!projectName) {
    return NextResponse.json(
      { error: "Project name is required." },
      { status: 400 }
    );
  }

  console.log(`API: Received request to delete project: "${projectName}"`);

  try {
    // 1. Delete documents from the database (documents.json)
    await deleteDocumentsByProject(projectName);

    // 2. Delete the associated FAISS vector store files
    await deleteVectorStore(projectName);

    console.log(
      `API: Project "${projectName}" and all its associated data deleted successfully.`
    );
    return NextResponse.json(
      {
        message: `Project "${projectName}" and its data deleted successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`API: Error deleting project "${projectName}":`, error);
    return NextResponse.json(
      {
        error: "Failed to delete project data.",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
