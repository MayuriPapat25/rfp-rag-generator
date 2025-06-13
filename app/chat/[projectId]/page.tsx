import { loadVectorData } from "../../../lib/utils";
import ChatInterface from "../../../components/ChatInterface";

interface ChatPageProps {
  params: {
    projectId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const shards = loadVectorData(params.projectId);
  console.log("shards 12", shards);
  return <ChatInterface projectId={params.projectId} />;
}
