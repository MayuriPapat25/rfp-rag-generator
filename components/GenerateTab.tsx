// components/GenerateTab.tsx
"use client";

import { useState } from "react";

export default function GenerateTab() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateResponse = async () => {
    setError(null);
    setIsLoading(true);
    setAnswer(""); // Clear previous answer

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate response.");
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (err: any) {
      console.error("Error generating response:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        RFP/RFQ Question
      </h2>

      <div className="mb-6">
        <label htmlFor="rfp-question" className="sr-only">
          Enter the RFP/RFQ question you need to respond to...
        </label>
        <textarea
          id="rfp-question"
          className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-lg placeholder-gray-400 min-h-[120px]"
          rows={5}
          placeholder="Enter the RFP/RFQ question you need to respond to..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        ></textarea>
      </div>

      <button
        onClick={handleGenerateResponse}
        disabled={isLoading || !question.trim()}
        className={`w-full py-3 px-6 rounded-lg text-white font-semibold text-lg transition duration-300 ease-in-out flex items-center justify-center ${
          isLoading || !question.trim()
            ? "bg-blue-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        }`}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating Response...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 inline-block mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4.552-4.552A1.25 1.25 0 0121 6.8V18a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h10.448c.813 0 1.588.324 2.162.906l1.026 1.026c.646.646.646 1.696 0 2.342L15 14zm-4 4L9 12m2 0l-2 2m2-2l2-2"
              />
            </svg>
            Generate Response
          </>
        )}
      </button>

      {error && (
        <div
          className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm"
          role="alert"
        >
          <strong className="font-bold">Error:</strong> {error}
        </div>
      )}

      {answer && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            Generated Answer:
          </h2>
          <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}
