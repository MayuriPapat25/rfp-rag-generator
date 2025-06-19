import { NextResponse } from "next/server";
import { addProject, getProjects, deleteProject, addDocument } from "@/lib/db";

interface ProjectResponse {
  _id: string; // MongoDB's default ID
  name: string;
  createdAt: number; // JavaScript timestamp
}

export async function GET() {
  try {
    const projects = await getProjects(); // Call the MongoDB-backed getProjects function
    const formattedProjects: ProjectResponse[] = projects.map((p) => ({
      _id: p._id.toString(), // Convert ObjectId to string for JSON serialization
      name: p.name,
      createdAt: p.createdAt.getTime(), // Convert Date object to timestamp
    }));
    console.log(
      `API Projects: Fetched ${formattedProjects.length} projects from MongoDB.`
    );
    return NextResponse.json({ projects: formattedProjects });
  } catch (error: any) {
    console.error("Error fetching projects from MongoDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Handle POST requests to /api/projects
  // This function creates a new project and optionally processes an uploaded file
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Add the new project to MongoDB
    const savedProject = await addProject({ name }); // Call the MongoDB-backed addProject function
    const newProjectId = savedProject._id.toString(); // Get the MongoDB-generated ID and convert to string

    console.log(
      `API Projects: Created new project in MongoDB with ID: ${newProjectId}`
    );

    // Return the new project details (using the MongoDB-generated ID)
    return NextResponse.json(
      {
        message: "Project created successfully!",
        project: {
          _id: newProjectId,
          name: savedProject.name,
          createdAt: savedProject.createdAt.getTime(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "Error creating project and/or processing file in MongoDB:",
      error
    );
    return NextResponse.json(
      { error: "Failed to create project and process file: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectIdToDelete = searchParams.get("id");

    if (!projectIdToDelete) {
      return NextResponse.json(
        { error: "Project ID is required for deletion." },
        { status: 400 }
      );
    }

    // Call the MongoDB-backed deleteProject function which handles cascading deletions
    await deleteProject(projectIdToDelete);

    console.log(
      `Project ${projectIdToDelete} and its associated data deleted successfully from MongoDB.`
    );
    return NextResponse.json(
      {
        message: `Project ${projectIdToDelete} and its associated data deleted successfully.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "Error deleting project and associated data from MongoDB:",
      error
    );
    return NextResponse.json(
      { error: `Failed to delete project: ${error.message}` },
      { status: 500 }
    );
  }
}
