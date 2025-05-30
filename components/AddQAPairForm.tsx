// components/AddQAPairForm.tsx
"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react"; // Icon

export default function AddQAPairForm() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [isAddingQa, setIsAddingQa] = useState(false);
  const [qaMessage, setQaMessage] = useState("");
  const [qaError, setQaError] = useState(false);

  const handleAddQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQaMessage("");
    setQaError(false);

    if (!question.trim() || !answer.trim() || !category.trim()) {
      setQaMessage("Question, Answer, and Category are required.");
      setQaError(true);
      return;
    }

    setIsAddingQa(true);

    try {
      const res = await fetch("/api/qapairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          category,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      setQaMessage("Q&A Pair added successfully!");
      setQuestion("");
      setAnswer("");
      setCategory("");
      setTags("");
    } catch (err: any) {
      console.error("Failed to add Q&A pair:", err);
      setQaMessage(`Error adding Q&A pair: ${err.message}`);
      setQaError(true);
    } finally {
      setIsAddingQa(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <PlusCircle className="mr-2 h-5 w-5" /> Add New Q&A Pair
      </h2>
      <form onSubmit={handleAddQaSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="qa-question"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Question
          </label>
          <Textarea
            id="qa-question"
            className="w-full p-3 border border-gray-300 rounded-md resize-y focus-visible:ring-blue-500" // Use focus-visible for shadcn
            rows={3}
            placeholder="Enter the question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isAddingQa}
          />
        </div>
        <div>
          <label
            htmlFor="qa-answer"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Answer
          </label>
          <Textarea
            id="qa-answer"
            className="w-full p-3 border border-gray-300 rounded-md resize-y focus-visible:ring-blue-500"
            rows={5}
            placeholder="Enter the answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isAddingQa}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="qa-category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <Input
              id="qa-category"
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md focus-visible:ring-blue-500"
              placeholder="e.g., Security, Infrastructure"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isAddingQa}
            />
          </div>
          <div>
            <label
              htmlFor="qa-tags"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tags (comma-separated)
            </label>
            <Input
              id="qa-tags"
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md focus-visible:ring-blue-500"
              placeholder="security, compliance, hosting"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isAddingQa}
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isAddingQa}
        >
          {isAddingQa ? "Adding Q&A Pair..." : "Add Q&A Pair"}
        </Button>
        {qaMessage && (
          <p
            className={`mt-4 text-center text-sm ${
              qaError ? "text-red-500" : "text-green-600"
            }`}
          >
            {qaMessage}
          </p>
        )}
      </form>
    </div>
  );
}
