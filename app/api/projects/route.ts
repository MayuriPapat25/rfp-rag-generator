// app/api/projects/route.ts

// Import necessary modules for Next.js API routes.
import { NextResponse } from "next/server";

// Import the getProjectNames function from your local database utility.
// This function is responsible for retrieving all unique project names from your stored documents.
import { getProjectNames } from "@/lib/db"; // Adjust path if needed, e.g., '../../lib/db'

/**
 * Handles GET requests to retrieve a list of existing project names.
 * These project names are fetched directly from the application's document database.
 */
export async function GET() {
  try {
    // Retrieve the list of unique project names from the database.
    // The getProjectNames function typically reads from documents.json and extracts unique project names.
    const projects = await getProjectNames();

    console.log(
      `API: Successfully fetched ${
        projects.length
      } project names from DB: ${projects.join(", ")}`
    );

    // Return the list of project names as a JSON response.
    // Crucially, add headers to prevent caching, ensuring the client always gets the latest list.
    return NextResponse.json(
      { projects },
      {
        status: 200,
        headers: {
          // These headers instruct browsers and proxies not to cache the response,
          // ensuring that the client always fetches the most up-to-date project list.
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    // Catch any errors during the process (e.g., database read errors)
    // and return an appropriate error response.
    console.error("API: Error fetching projects from database:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects. Check server logs for details." },
      { status: 500 }
    );
  }
}
