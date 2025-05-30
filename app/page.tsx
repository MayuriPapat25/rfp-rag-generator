"use client";

import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import KnowledgeBase from "../components/KnowledgeBase";
import AddQAPairForm from "../components/AddQAPairForm";
import DocumentUploader from "../components/DocumentUploader";
import { FileText, Lightbulb, ClipboardList } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateResponse = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      // Read the stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setResponse(accumulatedResponse); // Update state with each chunk
      }

      console.log("Full response received:", accumulatedResponse);
    } catch (error) {
      console.error("Failed to generate response:", error);
      setResponse("Error: Could not generate response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="container_header">RFP Q&A Response Generator</h1>
      <p className="container_desc">
        RAG-powered system for generating hosting platform and InfoSec RFQ
        responses
      </p>
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="tablist">
          <TabsTrigger value="generate" className="tabsTrigger">
            <FileText className="mr-2 h-4 w-4" /> Generate
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="tabsTrigger">
            <Lightbulb className="mr-2 h-4 w-4" /> Knowledge
          </TabsTrigger>
          <TabsTrigger value="manage" className="tabsTrigger">
            <ClipboardList className="mr-2 h-4 w-4" /> Manage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="tabContent">
            <div>
              <h2 className="tabContentHeader">RFP/RFQ Question</h2>
              <Textarea
                className="tabTextArea"
                rows={6}
                placeholder="Enter the RFP/RFQ question you need to respond to..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <Button
              className="generateButton"
              onClick={handleGenerateResponse}
              disabled={isLoading || !question.trim()}
            >
              {isLoading ? "Generating..." : "Generate Response"}
            </Button>

            {response && (
              <div className="responseWrapper">
                <h2 className="responseText">Generated Response</h2>
                <Textarea
                  className="responseTextArea"
                  rows={10}
                  readOnly
                  value={response}
                />
                <p className="tabTextArea">
                  Please review and customize this response before using in your
                  RFP submission.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeBase />
        </TabsContent>

        <TabsContent value="manage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AddQAPairForm />
            <DocumentUploader />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
