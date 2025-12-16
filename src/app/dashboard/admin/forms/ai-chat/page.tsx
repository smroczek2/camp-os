"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Send, Check, X, Loader2 } from "lucide-react";
import {
  generateFormAction,
  approveAIFormAction,
} from "@/app/actions/form-actions";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type GeneratedForm = {
  aiActionId: string;
  preview: {
    formName: string;
    formType: string;
    fieldCount: number;
    fields: Array<{
      label: string;
      type: string;
      required: boolean;
      conditional?: boolean;
      hasOptions?: boolean;
    }>;
  };
};

export default function AIFormChat() {
  const router = useRouter();
  const [camps, setCamps] = useState<Array<{ id: string; name: string }>>([]);
  const [sessions, setSessions] = useState<
    Array<{ id: string; campId: string; startDate: Date }>
  >([]);
  const [selectedCamp, setSelectedCamp] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'll help you create a custom form. First, select a camp (or leave blank for camp-wide form). Then describe what information you need to collect.",
    },
  ]);
  const [input, setInput] = useState("");
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Fetch camps and sessions
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/camps");
        const data = await response.json();
        setCamps(data.camps || []);
        setSessions(data.sessions || []);
      } catch (error) {
        console.error("Failed to fetch camps:", error);
      }
    }
    fetchData();
  }, []);

  const filteredSessions = selectedCamp
    ? sessions.filter((s) => s.campId === selectedCamp)
    : [];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Get first available camp if none selected
      if (!selectedCamp && camps.length > 0) {
        setSelectedCamp(camps[0].id);
      }

      // Call AI form generation
      const result = await generateFormAction({
        prompt: userMessage,
        campId: selectedCamp || camps[0]?.id || "",
        sessionId: selectedSession || undefined,
      });

      setGeneratedForm(result as unknown as GeneratedForm);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I've generated "${result.preview.formName}" with ${result.preview.fieldCount} fields. Review it below and approve if it looks good!`,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Failed to generate form"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedForm) return;

    setLoading(true);
    try {
      await approveAIFormAction(generatedForm.aiActionId);
      router.push("/dashboard/admin/forms");
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Failed to approve"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setGeneratedForm(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "No problem! Describe what you'd like to change.",
      },
    ]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <Sparkles className="inline h-6 w-6 mr-2 text-blue-500" />
            AI Form Generator
          </h1>
          <p className="text-muted-foreground">
            Describe the form you need, and AI will create it for you
          </p>
        </div>

        {/* Camp/Session Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Form Scope (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="camp-select">Camp</Label>
                <Select value={selectedCamp} onValueChange={setSelectedCamp}>
                  <SelectTrigger id="camp-select">
                    <SelectValue placeholder="Camp-wide form (default)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Camp-wide (all sessions)</SelectItem>
                    {camps.map((camp) => (
                      <SelectItem key={camp.id} value={camp.id}>
                        {camp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="session-select">Session</Label>
                <Select
                  value={selectedSession}
                  onValueChange={setSelectedSession}
                  disabled={!selectedCamp}
                >
                  <SelectTrigger id="session-select">
                    <SelectValue placeholder="All sessions in camp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sessions</SelectItem>
                    {filteredSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {new Date(session.startDate).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Leave blank to create a camp-wide form visible to all parents
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Panel */}
          <Card className="flex flex-col h-[600px]">
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {msg.role === "user" ? "You" : "AI Assistant"}
                      </div>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="text-xs font-medium mb-1 opacity-70">
                        AI Assistant
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating form...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Example: Registration form with name, age, and t-shirt size"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="h-[600px] overflow-y-auto">
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedForm ? (
                <div className="space-y-6">
                  {/* Form metadata */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {generatedForm.preview.formName}
                    </h3>
                    <div className="flex gap-2">
                      <Badge>{generatedForm.preview.formType}</Badge>
                      <Badge variant="outline">
                        {generatedForm.preview.fieldCount} fields
                      </Badge>
                    </div>
                  </div>

                  {/* Field list */}
                  <div className="space-y-3">
                    {generatedForm.preview.fields.map((field, idx) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{field.label}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {field.required && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Required
                                </Badge>
                              )}
                              {field.conditional && (
                                <Badge variant="secondary" className="text-xs">
                                  Conditional
                                </Badge>
                              )}
                              {field.hasOptions && (
                                <Badge variant="secondary" className="text-xs">
                                  Has Options
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Approval Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={handleReject}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={handleApprove}
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Approve & Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Form preview will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
