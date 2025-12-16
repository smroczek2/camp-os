# Phase 2.5: Form Builder UI - Admin AI Interface & Dynamic Form Renderer

**Type:** Feature / User Interface
**Status:** Planning
**Created:** 2025-12-16
**Complexity:** High (AI chat interface, dynamic form rendering, conditional logic)
**Dependencies:** Phase 2 Backend (✅ Complete)

---

## Overview

Build the complete UI layer for the custom form builder system. Admins can create forms using AI chat or manual builder. Parents can fill out dynamically-rendered forms with conditional logic and nested options.

**Three Core Surfaces:**

1. **Admin Form Builder** - Create/manage forms with AI assistance
2. **AI Approval Interface** - Preview and approve AI-generated forms
3. **Parent Form Renderer** - Dynamic form display with conditional logic

---

## Problem Statement

**Current State:**
- ✅ Backend complete (4 database tables, AI generation tool, validation)
- ❌ No UI to create forms
- ❌ No way for admins to use AI form generation
- ❌ No way for parents to view or submit forms
- ❌ Form builder backend is inaccessible

**User Pain Points:**
- Admin logs in, sees dashboard, but has no "Create Form" button
- No way to test AI form generation
- No way to see what forms look like to parents
- Backend functionality exists but is unusable

---

## Proposed Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         Admin Dashboard (/dashboard/admin)          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   Forms Tab      │  │  AI Chat Tab     │        │
│  │  (List + CRUD)   │  │  (Generate)      │        │
│  └──────────────────┘  └──────────────────┘        │
│           │                      │                   │
│           ├─→ View Form          └─→ Preview        │
│           ├─→ Edit Form               ↓             │
│           ├─→ Delete Form         Approve/Reject    │
│           └─→ Publish                 ↓             │
│                                  Save to DB         │
└─────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────┐
│      Parent Dashboard (/dashboard/parent)           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  "Complete Registration Form" button                │
│           │                                          │
│           ↓                                          │
│  ┌──────────────────────────────────┐              │
│  │   Dynamic Form Renderer           │              │
│  │  • Conditional Logic              │              │
│  │  • Nested Options                 │              │
│  │  • Real-time Validation           │              │
│  │  • Progress Tracking              │              │
│  └──────────────────────────────────┘              │
│           │                                          │
│           ↓                                          │
│      Server Action (submitFormAction)               │
│           │                                          │
│           ↓                                          │
│   Confirmation + View Submissions                   │
└─────────────────────────────────────────────────────┘
```

---

## Technical Approach

### Dependencies to Install

```bash
# shadcn/ui components
npx shadcn@latest add form input label select textarea checkbox radio-group switch tabs table

# Form libraries
npm install react-hook-form @hookform/resolvers

# State management for multi-step forms
npm install zustand

# Drag and drop (optional for manual builder)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### File Structure

```
src/app/dashboard/admin/
├── forms/
│   ├── page.tsx                    # Forms list
│   ├── new/page.tsx                # AI chat or manual builder selector
│   ├── ai-chat/page.tsx            # AI form generation interface
│   ├── [formId]/page.tsx           # View form details
│   ├── [formId]/edit/page.tsx      # Manual form editor
│   ├── [formId]/preview/page.tsx   # Preview as parent would see
│   └── [formId]/submissions/page.tsx # View submissions

src/components/forms/
├── form-builder/
│   ├── ai-form-chat.tsx            # AI chat interface (client component)
│   ├── form-preview.tsx            # Preview generated form
│   ├── approval-panel.tsx          # Approve/reject AI forms
│   └── field-palette.tsx           # Manual builder (optional Phase 3)
│
├── form-renderer/
│   ├── dynamic-form.tsx            # Main form renderer (client component)
│   ├── conditional-field.tsx       # Field with show/hide logic
│   ├── nested-select.tsx           # Cascading select component
│   └── form-progress.tsx           # Progress indicator
│
└── form-actions/
    ├── submit-button.tsx           # Submit with loading state
    └── form-error.tsx              # Error display component
```

---

## Implementation Phases

### Phase 1: Admin Forms List & Navigation

**Goal:** Admin can see all forms and navigate to creation/editing

**Files:**
- `src/app/dashboard/admin/forms/page.tsx` (Server Component)

**Implementation:**

```typescript
// src/app/dashboard/admin/forms/page.tsx
import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formDefinitions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Sparkles, FileEdit } from "lucide-react";
import Link from "next/link";

export default async function FormsPage() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all forms
  const forms = await db.query.formDefinitions.findMany({
    with: {
      camp: { columns: { name: true } },
      session: { columns: { id: true, startDate: true } },
      fields: { columns: { id: true } },
    },
    orderBy: (forms, { desc }) => [desc(forms.createdAt)],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Form Builder</h1>
          <p className="text-muted-foreground">
            Create custom forms for camp registration and data collection
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/forms/ai-chat">
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Create with AI
            </Button>
          </Link>
          <Link href="/dashboard/admin/forms/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Manually
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{forms.length}</div>
            <p className="text-sm text-muted-foreground">Total Forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {forms.filter(f => f.isPublished).length}
            </div>
            <p className="text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {forms.filter(f => f.status === "draft").length}
            </div>
            <p className="text-sm text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {forms.filter(f => f.aiActionId).length}
            </div>
            <p className="text-sm text-muted-foreground">AI Generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{form.name}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {form.description || "No description"}
                  </p>
                </div>
                <Badge variant={form.isPublished ? "default" : "outline"}>
                  {form.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {form.fields?.length || 0} fields • {form.camp?.name}
                </p>
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/admin/forms/${form.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileEdit className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {forms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No forms created yet. Get started with AI!
          </p>
          <Link href="/dashboard/admin/forms/ai-chat">
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Your First Form
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Admin sees list of all forms with stats
- [ ] Forms display name, description, field count, status
- [ ] "Create with AI" button links to AI chat page
- [ ] "Create Manually" button links to manual builder
- [ ] Empty state shows helpful message

---

### Phase 2: AI Chat Interface for Form Generation

**Goal:** Admin can describe a form in natural language, see preview, approve

**Files:**
- `src/app/dashboard/admin/forms/ai-chat/page.tsx` (Client Component)
- `src/app/api/forms/generate/route.ts` (API Route with streaming)

**Implementation:**

```typescript
// src/app/dashboard/admin/forms/ai-chat/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Check, X } from "lucide-react";
import { generateFormAction, approveAIFormAction } from "@/app/actions/form-actions";

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
    }>;
  };
};

export default function AIFormChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'll help you create a custom form. Describe what information you need to collect.",
    },
  ]);
  const [input, setInput] = useState("");
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Call AI form generation
      const result = await generateFormAction({
        prompt: userMessage,
        campId: "camp-id-here", // TODO: Get from context
        sessionId: undefined,
      });

      setGeneratedForm(result as GeneratedForm);
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
      alert(`Error: ${error instanceof Error ? error.message : "Failed to approve"}`);
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
                      Generating form...
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
                  placeholder="Example: Create a form with name, age, and t-shirt size"
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
                          <div>
                            <p className="font-medium">{field.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {field.type}
                            </p>
                          </div>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
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
                      <Check className="h-4 w-4 mr-2" />
                      Approve & Save
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
```

**Acceptance Criteria:**
- [ ] Admin sees chat interface on left, preview on right
- [ ] Can type natural language form description
- [ ] AI generates form structure and shows preview
- [ ] Preview displays form name, type, field count, field list
- [ ] "Approve & Save" button calls approveAIFormAction
- [ ] "Regenerate" clears preview and continues chat
- [ ] After approval, redirects to forms list

---

### Phase 3: Dynamic Form Renderer for Parents

**Goal:** Parents see dynamically-rendered forms with conditional logic

**Files:**
- `src/app/dashboard/parent/forms/[formId]/page.tsx` (Server Component wrapper)
- `src/components/forms/form-renderer/dynamic-form.tsx` (Client Component)

**Implementation:**

```typescript
// src/app/dashboard/parent/forms/[formId]/page.tsx
import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { getFormAction } from "@/app/actions/form-actions";
import { DynamicForm } from "@/components/forms/form-renderer/dynamic-form";

export default async function FormPage({
  params,
}: {
  params: { formId: string };
}) {
  const session = await getSession();
  if (!session?.user) redirect("/dev-login");

  const formConfig = await getFormAction(params.formId);

  if (!formConfig) {
    return <div>Form not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{formConfig.name}</h1>
        {formConfig.description && (
          <p className="text-muted-foreground mb-8">{formConfig.description}</p>
        )}

        <DynamicForm
          formConfig={formConfig}
          sessionId={session.user.id}
        />
      </div>
    </div>
  );
}
```

```typescript
// src/components/forms/form-renderer/dynamic-form.tsx
"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildSubmissionSchema } from "@/lib/form-validation";
import { submitFormAction } from "@/app/actions/form-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useRouter } from "next/navigation";

type FormConfig = {
  id: string;
  name: string;
  fields: Array<{
    id: string;
    fieldKey: string;
    label: string;
    description?: string;
    fieldType: string;
    validationRules?: any;
    conditionalLogic?: {
      showIf?: Array<{
        fieldKey: string;
        operator: string;
        value: any;
      }>;
    };
    displayOrder: number;
    options?: Array<{
      label: string;
      value: string;
    }>;
  }>;
};

export function DynamicForm({
  formConfig,
  sessionId,
}: {
  formConfig: FormConfig;
  sessionId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Build Zod schema dynamically
  const schema = buildSubmissionSchema(
    formConfig.fields.map((f) => ({
      fieldKey: f.fieldKey,
      fieldType: f.fieldType as any,
      validationRules: f.validationRules,
    }))
  );

  const form = useForm({
    resolver: zodResolver(schema),
  });

  // Watch all fields for conditional logic
  const formValues = useWatch({ control: form.control });

  // Check if field should be visible
  const shouldShowField = (field: FormConfig["fields"][0]) => {
    if (!field.conditionalLogic?.showIf) return true;

    return field.conditionalLogic.showIf.every((condition) => {
      const fieldValue = formValues[condition.fieldKey];

      switch (condition.operator) {
        case "equals":
          return fieldValue === condition.value;
        case "notEquals":
          return fieldValue !== condition.value;
        case "contains":
          return Array.isArray(fieldValue)
            ? fieldValue.includes(condition.value)
            : fieldValue?.toString().includes(condition.value);
        default:
          return true;
      }
    });
  };

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await submitFormAction({
        formDefinitionId: formConfig.id,
        sessionId,
        submissionData: data,
      });
      router.push("/dashboard/parent");
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Submission failed"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Sort fields by displayOrder
  const sortedFields = [...formConfig.fields].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {sortedFields.map((field) => {
        // Check conditional visibility
        if (!shouldShowField(field)) return null;

        return (
          <div key={field.id}>
            <Label htmlFor={field.fieldKey}>
              {field.label}
              {field.validationRules?.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {field.description}
              </p>
            )}

            {/* Render field based on type */}
            {field.fieldType === "text" || field.fieldType === "email" && (
              <Input
                id={field.fieldKey}
                type={field.fieldType}
                {...form.register(field.fieldKey)}
                className={form.formState.errors[field.fieldKey] ? "border-destructive" : ""}
              />
            )}

            {field.fieldType === "textarea" && (
              <Textarea
                id={field.fieldKey}
                {...form.register(field.fieldKey)}
                className={form.formState.errors[field.fieldKey] ? "border-destructive" : ""}
              />
            )}

            {field.fieldType === "number" && (
              <Input
                id={field.fieldKey}
                type="number"
                {...form.register(field.fieldKey, { valueAsNumber: true })}
                className={form.formState.errors[field.fieldKey] ? "border-destructive" : ""}
              />
            )}

            {field.fieldType === "boolean" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.fieldKey}
                  {...form.register(field.fieldKey)}
                />
              </div>
            )}

            {field.fieldType === "select" && field.options && (
              <Select
                onValueChange={(value) => form.setValue(field.fieldKey, value)}
              >
                <SelectTrigger id={field.fieldKey}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Error message */}
            {form.formState.errors[field.fieldKey] && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors[field.fieldKey]?.message as string}
              </p>
            )}
          </div>
        );
      })}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Form"}
      </Button>
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Fields render in correct displayOrder
- [ ] Conditional fields show/hide based on answers
- [ ] Validation errors display under fields
- [ ] Form validates with dynamic Zod schema
- [ ] Submit button shows loading state
- [ ] Successful submission redirects to parent dashboard

---

### Phase 4: Form Management & Publishing

**Goal:** Admin can view, edit, publish, archive forms

**Files:**
- `src/app/dashboard/admin/forms/[formId]/page.tsx`
- `src/components/forms/form-builder/form-details.tsx`

**Implementation:**

```typescript
// src/app/dashboard/admin/forms/[formId]/page.tsx
import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formDefinitions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { FormDetailsView } from "@/components/forms/form-builder/form-details";

export default async function FormDetailsPage({
  params,
}: {
  params: { formId: string };
}) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const form = await db.query.formDefinitions.findFirst({
    where: eq(formDefinitions.id, params.formId),
    with: {
      camp: true,
      session: true,
      fields: {
        orderBy: (fields: any, { asc }: any) => [asc(fields.displayOrder)],
        with: {
          options: {
            orderBy: (options: any, { asc }: any) => [asc(options.displayOrder)],
          },
        },
      },
      submissions: true,
    },
  });

  if (!form) {
    return <div>Form not found</div>;
  }

  return <FormDetailsView form={form} />;
}
```

```typescript
// src/components/forms/form-builder/form-details.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { publishFormAction, archiveFormAction } from "@/app/actions/form-actions";
import { useRouter } from "next/navigation";
import { Eye, Archive, CheckCircle2 } from "lucide-react";

export function FormDetailsView({ form }: { form: any }) {
  const router = useRouter();

  const handlePublish = async () => {
    await publishFormAction(form.id);
    router.refresh();
  };

  const handleArchive = async () => {
    if (confirm("Archive this form? It will no longer be available to users.")) {
      await archiveFormAction(form.id);
      router.push("/dashboard/admin/forms");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{form.name}</h1>
            <p className="text-muted-foreground">{form.description}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={form.isPublished ? "default" : "outline"}>
              {form.status}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          {!form.isPublished && (
            <Button onClick={handlePublish}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Publish Form
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`/dashboard/admin/forms/${form.id}/preview`)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="destructive" onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        </div>

        {/* Form Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{form.fields?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Fields</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{form.submissions?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{form.camp?.name}</div>
              <p className="text-sm text-muted-foreground">Camp</p>
            </CardContent>
          </Card>
        </div>

        {/* Fields List */}
        <Card>
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {form.fields.map((field: any, idx: number) => (
                <div key={field.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">
                          {idx + 1}.
                        </span>
                        <p className="font-medium">{field.label}</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {field.fieldType}
                        </Badge>
                        {field.validationRules?.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {field.conditionalLogic?.showIf && (
                          <Badge variant="secondary" className="text-xs">
                            Conditional
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Options if present */}
                  {field.options && field.options.length > 0 && (
                    <div className="mt-3 pl-6 border-l-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Options:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {field.options.map((opt: any) => (
                          <Badge key={opt.value} variant="outline" className="text-xs">
                            {opt.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Form details page shows metadata and stats
- [ ] "Publish Form" button makes form available to parents
- [ ] "Preview" shows form as parents will see it
- [ ] "Archive" removes form from active use
- [ ] Fields list shows type, validation, conditional logic

---

## Acceptance Criteria (Complete)

### Admin Interface
- [ ] Admin sees "Form Builder" section in admin dashboard
- [ ] Forms list shows all created forms with stats
- [ ] "Create with AI" opens AI chat interface
- [ ] AI generates form from natural language description
- [ ] Admin can preview AI-generated form before approval
- [ ] "Approve & Save" creates form in database
- [ ] "Regenerate" allows iterative refinement
- [ ] Form details page shows complete configuration
- [ ] Admin can publish/archive forms
- [ ] All actions enforce RBAC permissions

### Parent Interface
- [ ] Parents see available forms for their registered sessions
- [ ] Forms render dynamically from database config
- [ ] Conditional fields show/hide based on answers
- [ ] Nested options display correctly
- [ ] Validation errors show under fields
- [ ] Form submits via Server Action
- [ ] Successful submission shows confirmation
- [ ] Parents can view their submitted forms

### Security & Performance
- [ ] All Server Actions check authentication
- [ ] RBAC enforced on all form operations
- [ ] Parents only access forms for registered sessions
- [ ] Dynamic Zod validation prevents invalid submissions
- [ ] Form state persists in localStorage (recovery)
- [ ] No client-side API keys exposed

---

## Dependencies & Prerequisites

### New NPM Packages

```json
{
  "dependencies": {
    "react-hook-form": "^7.53.2",
    "@hookform/resolvers": "^3.9.1",
    "zustand": "^5.0.2"
  }
}
```

### shadcn/ui Components to Add

```bash
npx shadcn@latest add form input label select textarea checkbox radio-group switch
```

### Environment Variables

No new environment variables needed. Uses existing:
- `OPENAI_API_KEY` (for AI form generation)
- `OPENAI_MODEL` (defaults to gpt-4o)

---

## Risk Analysis & Mitigation

### Risk 1: AI Generates Invalid Forms
**Severity:** Medium
**Likelihood:** Medium

**Mitigation:**
- Zod schema validates AI output before storage
- Admin reviews preview before approval
- Test with various prompts to find edge cases
- Add validation in `generateFormFromPrompt()`

### Risk 2: Conditional Logic Performance
**Severity:** Low
**Likelihood:** Low

**Mitigation:**
- Use `useWatch` for targeted field monitoring (not `watch()`)
- Memoize `shouldShowField()` function
- Limit form to 50 fields max (reasonable for camp forms)

### Risk 3: Form State Loss During Submission
**Severity:** Medium
**Likelihood:** Low

**Mitigation:**
- Save to localStorage on field change
- Offer "Resume Draft" on return
- Show clear error messages on submit failure

---

## Implementation Roadmap

### Week 1: Admin Forms List & AI Chat

**Tasks:**
1. Install dependencies (react-hook-form, zustand, shadcn components)
2. Create `/dashboard/admin/forms` route structure
3. Build forms list page with stats
4. Build AI chat interface component
5. Integrate with `generateFormAction()` and `approveAIFormAction()`
6. Test AI form generation end-to-end

**Deliverables:**
- [ ] Forms list page working
- [ ] AI chat generates forms
- [ ] Preview shows generated fields
- [ ] Approve saves to database

### Week 2: Dynamic Form Renderer & Conditional Logic

**Tasks:**
1. Build `DynamicForm` component
2. Implement conditional logic engine
3. Add all field types (text, email, number, select, checkbox, etc.)
4. Test conditional visibility
5. Integrate with `submitFormAction()`
6. Add form validation and error display

**Deliverables:**
- [ ] Dynamic form renders from database
- [ ] Conditional fields work
- [ ] Form validation shows errors
- [ ] Submission saves to database

### Week 3: Form Management & Polish

**Tasks:**
1. Build form details page
2. Add publish/archive actions
3. Build submissions view for admin
4. Add form preview for testing
5. Test entire flow (create → approve → render → submit)

**Deliverables:**
- [ ] Admin can manage form lifecycle
- [ ] Forms can be published/archived
- [ ] Preview shows parent view
- [ ] Full workflow tested

---

## Testing Strategy

### Unit Tests
- Dynamic Zod schema builder
- Conditional logic evaluation
- Form validation rules

### Integration Tests
- AI form generation → approval → database
- Form rendering → submission → database
- RBAC permission checks

### Manual Testing
```
1. As admin@camposarai.co:
   - Create form with AI: "Registration form with name, age, allergies"
   - Review preview
   - Approve
   - Publish form

2. As jennifer.smith@example.com (parent):
   - Navigate to form
   - Fill out fields
   - Test conditional logic (select "Yes" for allergies → allergies field appears)
   - Submit
   - Verify submission in database

3. As admin:
   - View submissions
   - Archive form
   - Verify no longer visible to parents
```

---

## Technical Considerations

### Performance Optimization

1. **Server Components for Data Fetching**
   - Forms list fetched server-side
   - Form config fetched server-side
   - Only form interactivity is client-side

2. **Minimal Re-renders**
   - React Hook Form isolates field re-renders
   - `useWatch` on specific fields only
   - Memoize conditional logic checks

3. **Lazy Loading**
   - AI chat only loads when accessed
   - Form builder only loads for admins

### Scalability Considerations

- Forms with 50+ fields remain performant (React Hook Form handles this)
- Submissions paginated (not loading all at once)
- JSONB indexing enables fast queries

### Accessibility

- All inputs have `<Label>` with `htmlFor`
- Error messages have proper ARIA
- Keyboard navigation works
- Required fields marked with asterisk
- Clear focus indicators

---

## Success Metrics

### Functional Completeness
- Admin can create forms via AI chat (100% success rate)
- Parents can submit forms without errors (>95% success rate)
- Conditional logic works correctly (0 logic bugs)

### User Experience
- AI generates usable forms (>80% approved without changes)
- Form submission time: <3 minutes for 10 fields
- No confusion about where to create forms

### Security
- All RBAC checks pass
- No unauthorized form access
- All submissions validated server-side

---

## Documentation Requirements

### User Guides
- **Admin**: How to create forms with AI
- **Admin**: How to approve AI-generated forms
- **Admin**: How to publish forms
- **Parent**: How to complete forms

### Technical Documentation
- Form config JSON schema
- Conditional logic operators
- Field type reference
- API endpoints

---

## Files to Create/Modify

### New Files (11 total)

**Admin Interface:**
1. `src/app/dashboard/admin/forms/page.tsx` - Forms list
2. `src/app/dashboard/admin/forms/ai-chat/page.tsx` - AI chat interface
3. `src/app/dashboard/admin/forms/[formId]/page.tsx` - Form details
4. `src/app/dashboard/admin/forms/[formId]/preview/page.tsx` - Preview form

**Components:**
5. `src/components/forms/form-builder/form-details.tsx` - Details view (client)
6. `src/components/forms/form-renderer/dynamic-form.tsx` - Dynamic renderer (client)
7. `src/components/forms/form-renderer/conditional-field.tsx` - Field wrapper

**Parent Interface:**
8. `src/app/dashboard/parent/forms/[formId]/page.tsx` - Fill out form
9. `src/app/dashboard/parent/forms/submissions/page.tsx` - View submissions

### Modified Files (2 total)
1. `src/app/dashboard/admin/page.tsx` - Add "Forms" navigation tab
2. `src/app/dashboard/parent/page.tsx` - Add "Complete Forms" section

---

## Example User Flows

### Flow 1: Admin Creates Form with AI

```
1. Admin clicks "Form Builder" in admin dashboard
2. Clicks "Create with AI"
3. Types: "Create a registration form with child name, age, grade, allergies (show allergy details if Yes), and t-shirt size"
4. AI generates form with 6 fields (including conditional)
5. Preview shows:
   - child_name (text, required)
   - age (number, required, min: 5, max: 18)
   - grade (select, required)
   - has_allergies (boolean, required)
   - allergy_details (textarea, conditional: showIf has_allergies = true)
   - t_shirt_size (select, options: XS, S, M, L, XL)
6. Admin reviews and clicks "Approve & Save"
7. Form saved to database with status "draft"
8. Admin clicks "Publish"
9. Form now available to parents
```

### Flow 2: Parent Completes Form

```
1. Parent logs in (jennifer.smith@example.com)
2. Sees "Complete Registration Form" button for Summer Camp Session 1
3. Clicks button
4. Form loads with all fields
5. Fills in:
   - child_name: "Emma"
   - age: 10
   - grade: "5th Grade"
   - has_allergies: true (checkbox)
   - [allergy_details field appears automatically]
   - allergy_details: "Peanut allergy"
   - t_shirt_size: "M"
6. Clicks "Submit Form"
7. Validation passes
8. Server Action saves to form_submissions table
9. Confirmation message appears
10. Parent returns to dashboard
```

---

## Open Questions

1. **Camp/Session Context**: How should forms know which camp/session they're for?
   - Option A: Form is linked to session, parents see forms for registered sessions
   - Option B: Forms are camp-wide, all parents see all forms
   - **Recommendation:** Option A (session-specific forms)

2. **Multiple Submissions**: Should parents be able to edit submissions or submit multiple times?
   - Option A: One submission per form per child (edit allowed before deadline)
   - Option B: Multiple submissions allowed (track latest version)
   - **Recommendation:** Option A (single submission with edit capability)

3. **Required Forms**: How to enforce parents must complete forms before camp?
   - Option A: Block check-in if forms incomplete
   - Option B: Send reminders but allow check-in
   - **Recommendation:** Option B (reminders, not blockers)

---

## Next Steps (Phase 3)

After UI is complete:

1. **Advanced Features:**
   - Manual form builder (drag-and-drop field reordering)
   - Field templates library
   - Form duplication/cloning
   - Advanced conditional logic (AND/OR combinations)

2. **Enhanced AI:**
   - Multi-turn form refinement
   - Learn from existing forms
   - Suggest validation rules based on field type

3. **Submissions Management:**
   - Export submissions to CSV
   - Bulk approval workflow
   - Submission analytics

---

## References

### Research Findings
- Form Builder UI Patterns: See `agentId: ab5aeac` research output
- React Hook Form Best Practices: See `agentId: af79509` documentation
- Existing Dashboard Patterns: See `agentId: a1bef2a` repo analysis

### Framework Documentation
- Next.js 15 App Router: https://nextjs.org/docs
- React Hook Form: https://react-hook-form.com
- shadcn/ui Forms: https://ui.shadcn.com/docs/components/form
- Vercel AI SDK: https://sdk.vercel.ai/docs

### Existing Code References
- Admin Dashboard Pattern: `/src/app/dashboard/admin/page.tsx`
- Card Grid Layout: `/src/app/dashboard/parent/page.tsx`
- AI Chat Pattern: `/src/app/chat/page.tsx`
- Dialog Component: `/src/components/ui/dialog.tsx`
- Server Actions Pattern: `/src/app/actions/form-actions.ts` (newly created)

---

## Notes

### Design Decisions

**Why AI-first approach?**
- Faster for admins (describe vs. build)
- Reduces errors (AI understands validation rules)
- Lowers barrier to entry

**Why separate preview panel?**
- Clear approval workflow (see before commit)
- Prevents accidental form creation
- Allows iterative refinement

**Why dynamic rendering?**
- No code changes needed for new forms
- Forms stored as data (not components)
- Enables AI generation and approval workflow

### Critical Implementation Notes

1. **Camp/Session Selection**: AI chat needs context picker before generating
2. **Form Submission Link**: Need clear path from parent dashboard to forms
3. **Conditional Logic Engine**: Must handle all operators (equals, notEquals, contains)
4. **Validation Consistency**: Server-side validation must match client-side

This plan provides the complete UI layer for the form builder system, making the Phase 2 backend accessible and usable.
