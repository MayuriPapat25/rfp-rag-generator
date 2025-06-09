"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area"; // For chat history scrolling
import { useToast } from "../../hooks/use-toast";

interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
}

export default function ProjectChatPage() {
  const searchParams = useSearchParams();
  const projectName = searchParams.get("project");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!projectName) {
      // Redirect or show error if project name is missing
      toast({
        title: "Project Not Selected",
        description: "Please select or create a project first.",
        variant: "destructive",
      });
      // Optionally, redirect back to the project selection page
      // router.push('/');
    }
  }, [projectName, toast]);

  const handleAskQuestion = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    if (!projectName) {
      toast({
        title: "Error",
        description:
          "Project not specified. Please go back and select a project.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: question,
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setLoading(true);
    setQuestion(""); // Clear input

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: question.trim(), projectName }), // Send project name
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate response.");
      }

      const data = await response.json();
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: data.answer,
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error generating response:", error);
      toast({
        title: "Generation Failed",
        description:
          error.message ||
          "An unexpected error occurred while generating response. Ensure Ollama is running and knowledge base is built.",
        variant: "destructive",
      });
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: `Error: ${error.message}`,
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl flex flex-col h-[calc(100vh-32px)]">
      {" "}
      {/* Adjust height as needed */}
      <Card className="flex-1 flex flex-col mb-4">
        <CardHeader>
          <CardTitle>Chat for Project: {projectName || "Loading..."}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions based on the uploaded documents for this project.
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4">
          <ScrollArea className="flex-1 p-2 border rounded-md mb-4 bg-gray-50">
            {chatHistory.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Start by asking a question!
              </p>
            ) : (
              chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 ${
                    msg.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block p-2 rounded-lg max-w-[80%] ${
                      msg.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
          <form onSubmit={handleAskQuestion} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Ask"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
