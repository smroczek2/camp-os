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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Send, Check, X, Loader2, ArrowLeft } from "lucide-react";
import {
  generateFormAction,
  approveAIFormAction,
} from "@/app/actions/form-actions";
import { FIELD_TYPE_OPTIONS, fieldTypeSupportsOptions } from "@/lib/form-ui";
import Link from "next/link";
import type {
  FormType,
  AIFormGeneration,
  GeneratedFormResult,
} from "@/types/forms";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const ALL_SESSIONS_VALUE = "__all_sessions__";

export default function AIFormChat() {
  const router = useRouter();
  const [camps, setCamps] = useState<Array<{ id: string; name: string }>>([]);
  const [sessions, setSessions] = useState<
    Array<{ id: string; campId: string; startDate: Date }>
  >([]);
  const [selectedCamp, setSelectedCamp] = useState<string | undefined>();
  const [selectedSession, setSelectedSession] =
    useState<string>(ALL_SESSIONS_VALUE);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'll help you create a custom form. First, select a camp. Optionally choose a specific session (or keep \"All sessions\"). Then describe what information you need to collect.",
    },
  ]);
  const [input, setInput] = useState("");
  const [generatedForm, setGeneratedForm] = useState<GeneratedFormResult | null>(
    null
  );
  const [draft, setDraft] = useState<AIFormGeneration | null>(null);
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

  // Default to first camp once loaded
  useEffect(() => {
    if (!selectedCamp && camps.length > 0) {
      setSelectedCamp(camps[0].id);
      setSelectedSession(ALL_SESSIONS_VALUE);
    }
  }, [camps, selectedCamp]);

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
      if (!selectedCamp) {
        throw new Error("Please select a camp first.");
      }

      // Call AI form generation
      const result = await generateFormAction({
        prompt: userMessage,
        campId: selectedCamp,
        sessionId:
          selectedSession === ALL_SESSIONS_VALUE ? undefined : selectedSession,
      });

      setGeneratedForm(result);
      setDraft(result.params.generatedForm);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            `I've generated "${result.preview.formName}" with ${result.preview.fieldCount} fields. ` +
            "Review and edit it on the right, then approve & save when ready.",
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
      await approveAIFormAction({
        aiActionId: generatedForm.id,
        generatedForm: draft ?? undefined,
      });
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
    setDraft(null);
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
          <Link href="/dashboard/admin/forms" className="inline-flex">
            <Button variant="ghost" className="-ml-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
          </Link>
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
                <Select
                  value={selectedCamp}
                  onValueChange={(value) => {
                    setSelectedCamp(value);
                    setSelectedSession(ALL_SESSIONS_VALUE);
                  }}
                  disabled={camps.length === 0}
                >
                  <SelectTrigger id="camp-select">
                    <SelectValue placeholder="Select a camp" />
                  </SelectTrigger>
                  <SelectContent>
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
                    <SelectItem value={ALL_SESSIONS_VALUE}>
                      All sessions
                    </SelectItem>
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
              Pick a session to target it, or keep “All sessions” for camp-wide
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
                  placeholder="Example: Registration form with camper name, age, and t‑shirt size"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="h-[600px] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {generatedForm ? (
                <div className="space-y-6">
                  {/* Editable metadata */}
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="form-name">Form name</Label>
                      <Input
                        id="form-name"
                        value={draft?.formDefinition.name ?? generatedForm.preview.formName}
                        onChange={(e) =>
                          setDraft((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              formDefinition: {
                                ...prev.formDefinition,
                                name: e.target.value,
                              },
                            };
                          })
                        }
                        disabled={!draft || loading}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="form-description">Description</Label>
                      <Textarea
                        id="form-description"
                        value={draft?.formDefinition.description ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              formDefinition: {
                                ...prev.formDefinition,
                                description: e.target.value,
                              },
                            };
                          })
                        }
                        placeholder="What is this form for?"
                        disabled={!draft || loading}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Form type</Label>
                      <Select
                        value={draft?.formDefinition.formType ?? generatedForm.preview.formType}
                        onValueChange={(value) =>
                          setDraft((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              formDefinition: {
                                ...prev.formDefinition,
                                formType: value as FormType,
                              },
                            };
                          })
                        }
                        disabled={!draft || loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registration">Registration</SelectItem>
                          <SelectItem value="waiver">Waiver</SelectItem>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Editable field list (falls back to preview if draft missing) */}
                  {draft ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          Fields ({draft.fields.length})
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() =>
                            setDraft((prev) => {
                              if (!prev) return prev;
                              const nextIndex = prev.fields.length + 1;
                              return {
                                ...prev,
                                fields: [
                                  ...prev.fields,
                                  {
                                    fieldKey: `new_field_${nextIndex}`,
                                    label: `New field ${nextIndex}`,
                                    fieldType: "text",
                                    displayOrder: nextIndex,
                                    validationRules: { required: false },
                                  },
                                ],
                              };
                            })
                          }
                        >
                          Add field
                        </Button>
                      </div>

                      {draft.fields
                        .slice()
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((field, idx) => (
                          <div
                            key={`${field.fieldKey}-${idx}`}
                            className="p-4 border rounded-lg bg-muted/20 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="grid gap-2">
                                  <Label>Question</Label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) =>
                                      setDraft((prev) => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          fields: prev.fields.map((f) =>
                                            f.fieldKey === field.fieldKey
                                              ? { ...f, label: e.target.value }
                                              : f
                                          ),
                                        };
                                      })
                                    }
                                    disabled={loading}
                                  />
                                </div>

                                <div className="grid gap-2">
                                  <Label>Help text (optional)</Label>
                                  <Textarea
                                    value={field.description ?? ""}
                                    onChange={(e) =>
                                      setDraft((prev) => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          fields: prev.fields.map((f) =>
                                            f.fieldKey === field.fieldKey
                                              ? {
                                                  ...f,
                                                  description: e.target.value,
                                                }
                                              : f
                                          ),
                                        };
                                      })
                                    }
                                    disabled={loading}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="grid gap-2">
                                    <Label>Answer type</Label>
                                    <Select
                                      value={field.fieldType}
                                      onValueChange={(value) =>
                                        setDraft((prev) => {
                                          if (!prev) return prev;
                                          return {
                                            ...prev,
                                            fields: prev.fields.map((f) => {
                                              if (f.fieldKey !== field.fieldKey)
                                                return f;
                                              const next: typeof f = {
                                                ...f,
                                                fieldType: value,
                                              };
                                              if (
                                                fieldTypeSupportsOptions(value) &&
                                                (!next.options ||
                                                  next.options.length === 0)
                                              ) {
                                                next.options = [
                                                  { label: "Option 1", value: "option_1", displayOrder: 1 },
                                                  { label: "Option 2", value: "option_2", displayOrder: 2 },
                                                ];
                                              }
                                              return next;
                                            }),
                                          };
                                        })
                                      }
                                      disabled={loading}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {FIELD_TYPE_OPTIONS.map((opt) => (
                                          <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="flex items-center justify-between gap-3 pt-7">
                                    <div className="space-y-0.5">
                                      <Label>Required</Label>
                                      <p className="text-xs text-muted-foreground">
                                        Must be answered
                                      </p>
                                    </div>
                                    <Switch
                                      checked={!!field.validationRules?.required}
                                      onCheckedChange={(checked) =>
                                        setDraft((prev) => {
                                          if (!prev) return prev;
                                          return {
                                            ...prev,
                                            fields: prev.fields.map((f) =>
                                              f.fieldKey === field.fieldKey
                                                ? {
                                                    ...f,
                                                    validationRules: {
                                                      ...(f.validationRules ?? {}),
                                                      required: checked,
                                                    },
                                                  }
                                                : f
                                            ),
                                          };
                                        })
                                      }
                                      disabled={loading}
                                    />
                                  </div>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                  Key: <span className="font-mono">{field.fieldKey}</span>
                                </p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={loading || idx === 0}
                                  onClick={() =>
                                    setDraft((prev) => {
                                      if (!prev) return prev;
                                      const sorted = prev.fields
                                        .slice()
                                        .sort((a, b) => a.displayOrder - b.displayOrder);
                                      const current = sorted[idx];
                                      const above = sorted[idx - 1];
                                      return {
                                        ...prev,
                                        fields: prev.fields.map((f) => {
                                          if (f.fieldKey === current.fieldKey)
                                            return { ...f, displayOrder: above.displayOrder };
                                          if (f.fieldKey === above.fieldKey)
                                            return { ...f, displayOrder: current.displayOrder };
                                          return f;
                                        }),
                                      };
                                    })
                                  }
                                >
                                  Up
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={loading || idx === draft.fields.length - 1}
                                  onClick={() =>
                                    setDraft((prev) => {
                                      if (!prev) return prev;
                                      const sorted = prev.fields
                                        .slice()
                                        .sort((a, b) => a.displayOrder - b.displayOrder);
                                      const current = sorted[idx];
                                      const below = sorted[idx + 1];
                                      return {
                                        ...prev,
                                        fields: prev.fields.map((f) => {
                                          if (f.fieldKey === current.fieldKey)
                                            return { ...f, displayOrder: below.displayOrder };
                                          if (f.fieldKey === below.fieldKey)
                                            return { ...f, displayOrder: current.displayOrder };
                                          return f;
                                        }),
                                      };
                                    })
                                  }
                                >
                                  Down
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={loading}
                                  onClick={() =>
                                    setDraft((prev) => {
                                      if (!prev) return prev;
                                      const nextFields = prev.fields
                                        .filter((f) => f.fieldKey !== field.fieldKey)
                                        .map((f, index) => ({
                                          ...f,
                                          displayOrder: index + 1,
                                        }));
                                      return { ...prev, fields: nextFields };
                                    })
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>

                            {fieldTypeSupportsOptions(field.fieldType) && (
                              <div className="pt-2 border-t space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">Options</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={loading}
                                    onClick={() =>
                                      setDraft((prev) => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          fields: prev.fields.map((f) => {
                                            if (f.fieldKey !== field.fieldKey) return f;
                                            const options = f.options ? [...f.options] : [];
                                            const nextOrder = options.length + 1;
                                            options.push({
                                              label: `Option ${nextOrder}`,
                                              value: `option_${nextOrder}`,
                                              displayOrder: nextOrder,
                                            });
                                            return { ...f, options };
                                          }),
                                        };
                                      })
                                    }
                                  >
                                    Add option
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  {(field.options ?? [])
                                    .slice()
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map((opt, optIdx) => (
                                      <div
                                        key={`${field.fieldKey}-opt-${optIdx}`}
                                        className="grid grid-cols-[1fr,1fr,auto] gap-2 items-start"
                                      >
                                        <Input
                                          value={opt.label}
                                          onChange={(e) =>
                                            setDraft((prev) => {
                                              if (!prev) return prev;
                                              return {
                                                ...prev,
                                                fields: prev.fields.map((f) => {
                                                  if (f.fieldKey !== field.fieldKey) return f;
                                                  const options = (f.options ?? []).map((o) =>
                                                    o.displayOrder === opt.displayOrder
                                                      ? { ...o, label: e.target.value }
                                                      : o
                                                  );
                                                  return { ...f, options };
                                                }),
                                              };
                                            })
                                          }
                                          disabled={loading}
                                          placeholder="Label"
                                        />
                                        <Input
                                          value={opt.value}
                                          onChange={(e) =>
                                            setDraft((prev) => {
                                              if (!prev) return prev;
                                              return {
                                                ...prev,
                                                fields: prev.fields.map((f) => {
                                                  if (f.fieldKey !== field.fieldKey) return f;
                                                  const options = (f.options ?? []).map((o) =>
                                                    o.displayOrder === opt.displayOrder
                                                      ? { ...o, value: e.target.value }
                                                      : o
                                                  );
                                                  return { ...f, options };
                                                }),
                                              };
                                            })
                                          }
                                          disabled={loading}
                                          placeholder="Value"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          disabled={loading}
                                          onClick={() =>
                                            setDraft((prev) => {
                                              if (!prev) return prev;
                                              return {
                                                ...prev,
                                                fields: prev.fields.map((f) => {
                                                  if (f.fieldKey !== field.fieldKey) return f;
                                                  const next = (f.options ?? [])
                                                    .filter((o) => o.displayOrder !== opt.displayOrder)
                                                    .map((o, index) => ({
                                                      ...o,
                                                      displayOrder: index + 1,
                                                    }));
                                                  return { ...f, options: next };
                                                }),
                                              };
                                            })
                                          }
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Badge>{generatedForm.preview.formType}</Badge>
                        <Badge variant="outline">
                          {generatedForm.preview.fieldCount} fields
                        </Badge>
                      </div>
                      {generatedForm.preview.fields.map((field, idx) => (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg bg-muted/30"
                        >
                          <p className="font-medium">{field.label}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
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
                      ))}
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Generate a form to preview and edit it here</p>
                </div>
              )}
            </CardContent>
            {generatedForm && (
              <div className="border-t bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-4">
                <div className="flex gap-2">
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
                    disabled={loading || !generatedForm}
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
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
