import ChatInterface from "../../../components/ChatInterface";
import { getProjects } from "@/lib/db"; // or a getProjectById if you have one

interface ChatPageProps {
  params: {
    projectId: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const allProjects = await getProjects();
  const project = allProjects.find(
    (p) => p._id.toString() === params.projectId
  );

  // Fallback if not found
  const projectName = project ? project.name : params.projectId;

  return (
    <ChatInterface projectId={params.projectId} projectName={projectName} />
  );
}
