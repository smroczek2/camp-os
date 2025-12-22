"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2, CheckCircle } from "lucide-react";
import { SessionPreview } from "./session-preview";
import { ConfirmationPanel } from "./confirmation-panel";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  sessionPlan?: SessionPlan;
}

interface SessionPlan {
  program: {
    name: string;
    description?: string;
    isNew: boolean;
    existingId?: string;
  };
  sessions: Array<{
    name?: string;
    startDate: string;
    endDate: string;
    price?: number;
    capacity?: number;
    minAge?: number;
    maxAge?: number;
    minGrade?: number;
    maxGrade?: number;
  }>;
  recommendedForms: Array<{
    name: string;
    reason: string;
  }>;
}

export function AISetupChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'll help you set up sessions for your camp. Tell me what you're planning - describe the camp, age group, and when you want to run it.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SessionPlan | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [createdSessions, setCreatedSessions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/session-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      if (data.sessionPlan) {
        setCurrentPlan(data.sessionPlan);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message, sessionPlan: data.sessionPlan },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmPlan() {
    if (!currentPlan) return;
    setIsConfirming(true);

    try {
      const response = await fetch("/api/ai/session-setup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: currentPlan }),
      });

      const data = await response.json();

      if (data.success) {
        setCreatedSessions(data.sessionIds);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I've created ${data.sessionIds.length} session(s) for you. You can view and manage them in the Programs section.`
          },
        ]);
        setCurrentPlan(null);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Failed to create sessions: ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to create sessions. Please try again." },
      ]);
    } finally {
      setIsConfirming(false);
    }
  }

  function handleEditPlan() {
    setInput("I'd like to make some changes to the plan: ");
    setCurrentPlan(null);
  }

  return (
    <div className="space-y-4">
      {/* Chat Messages */}
      <Card className="p-4 h-[500px] overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.sessionPlan && (
                  <div className="mt-3">
                    <SessionPreview plan={message.sessionPlan} />
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Confirmation Panel */}
      {currentPlan && (
        <ConfirmationPanel
          plan={currentPlan}
          onConfirm={handleConfirmPlan}
          onEdit={handleEditPlan}
          isConfirming={isConfirming}
        />
      )}

      {/* Success Banner */}
      {createdSessions.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700">
            Successfully created {createdSessions.length} session(s)!
          </span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your camp sessions..."
          disabled={isLoading || isConfirming}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || isConfirming || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
