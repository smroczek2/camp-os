---
name: feature-builder
description: Orchestrates full-stack feature implementation using Next.js 15 App Router patterns, Better Auth, Drizzle ORM, and shadcn/ui. Designs data models, creates authenticated API routes, builds UI components. Integrates with existing auth/database/AI systems. Focuses on producing working code following project patterns. Activates after requirements are clarified.
---

# Feature Builder

Guides full-stack feature implementation that integrates seamlessly with the starter kit's existing authentication, database, and AI capabilities.

## Activation

Use this skill after:
- smart-clarifier has gathered requirements
- User confirms they want to proceed with implementation
- Clear understanding of what to build exists

## Implementation Workflow

### Phase 1: Plan Architecture (Don't Code Yet!)

Before writing any code, plan:

**Data Model:**
- What database tables are needed?
- Fields and their types?
- Relationships to existing `user` table?
- Should records cascade delete when user is deleted?
- Indexes needed for performance?

**API Routes:**
- What endpoints are needed?
- HTTP methods (GET, POST, PUT, DELETE)?
- Which need authentication?
- Request and response shapes?

**UI Pages & Components:**
- What routes/pages are needed?
- Which are protected (require auth)?
- What shadcn/ui components to use?
- Server components vs client components?

**Integration Points:**
- How does this use Better Auth?
- Does it need AI features (OpenAI)?
- External APIs or services?
- Real-time updates needed?

**Example Plan:**
```
Task Management Feature:

Data Model:
- tasks table: id, user_id, title, description, status, due_date, created_at, updated_at
- Relationship: tasks.user_id → user.id (cascade delete)

API Routes:
- GET /api/tasks - List user's tasks
- POST /api/tasks - Create task
- PUT /api/tasks/[id] - Update task
- DELETE /api/tasks/[id] - Delete task
All routes require authentication.

UI:
- /tasks - Task list page (protected)
- Components: TaskList (client), TaskForm (client), TaskItem (client)
- Use shadcn: Card, Button, Input, Textarea, Checkbox

Integration:
- Auth: All routes check session, filter by user_id
- AI: Optional - AI task suggestions feature
- Real-time: No (standard request/response)
```

### Phase 2: Database Setup

**Step 1: Define Schema in `src/lib/schema.ts`**

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./schema"; // Import existing tables if needed

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Key Patterns:**
- UUID primary keys: `uuid("id").defaultRandom().primaryKey()`
- Foreign keys with cascade: `references(() => user.id, { onDelete: "cascade" })`
- Timestamps: `timestamp("created_at").defaultNow().notNull()`
- Not null constraints: `.notNull()`

**Step 2: Push Schema Changes**

For development (fast iteration):
```bash
npm run db:push
```

For production (with migration files):
```bash
npm run db:generate
npm run db:migrate
```

**Use `db:push` during feature development** - it's faster for iteration.

### Phase 3: Build API Routes

**Pattern: Authenticated API Route**

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 1. Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Query user's data only (CRITICAL: filter by user ID)
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, session.user.id));

    return NextResponse.json({ tasks: userTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
```

**Pattern: POST with Validation**

```typescript
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description } = body;

    // Validate input
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Insert with user ownership
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
      })
      .returning();

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
```

**Pattern: Update with Ownership Check**

```typescript
import { and } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Update only if owned by user (security check)
    const [updated] = await db
      .update(tasks)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(
        eq(tasks.id, params.id),
        eq(tasks.userId, session.user.id)  // CRITICAL: ownership check
      ))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
```

**API Route Checklist:**
- ✓ Check session first (401 if not authenticated)
- ✓ Validate all user input (400 for validation errors)
- ✓ Filter queries by `session.user.id` for user-specific data
- ✓ Use `and()` to check both ID match AND user ownership on updates/deletes
- ✓ Handle errors with try/catch (500 for server errors)
- ✓ Log errors for debugging
- ✓ Return appropriate status codes

### Phase 4: Build UI Components

**Step 1: Create Protected Page**

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TaskList } from "@/components/tasks/task-list";

export default async function TasksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
      <TaskList />
    </main>
  );
}
```

**Step 2: Build Client Components**

Use "use client" for interactive components:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <CardTitle>{task.title}</CardTitle>
          </CardHeader>
          <CardContent>{task.description}</CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Component Decision Tree:**
- **Server Component** (default): Can fetch data, no interactivity
- **Client Component** ("use client"): Needs useState, useEffect, onClick, onChange, etc.

**Install shadcn/ui Components:**
```bash
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add form
```

### Phase 5: Add AI Features (If Needed)

If the feature needs AI:

```typescript
import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

// CRITICAL: Always use environment variable
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

// For simple text generation
const result = await generateText({
  model: openai(model),
  prompt: "Your prompt here",
});

// For streaming responses
const stream = streamText({
  model: openai(model),
  messages: [...],
});
```

**Follow the pattern in `src/app/api/chat/route.ts` for streaming chat.**

### Phase 6: Quality Checks

Before considering the feature complete:

```bash
npm run lint        # Fix all linting errors
npm run typecheck   # Fix all type errors
```

**Don't skip this step.** These catches issues early.

## Security Checklist

**CRITICAL - Review every feature:**

✓ **Authentication checks in all protected routes and API endpoints**
  - Server pages: redirect if no session
  - API routes: return 401 if no session

✓ **User-specific data filtering**
  - All queries filtered by `session.user.id`
  - No user can access another user's data

✓ **Ownership verification on updates/deletes**
  - Use `and(eq(table.id, id), eq(table.userId, session.user.id))`
  - Return 404 if not found or not owned

✓ **Input validation**
  - Validate all user input before database operations
  - Trim strings, check required fields
  - Return 400 with clear error messages

✓ **Error handling**
  - Try/catch in all API routes
  - Log errors server-side
  - Return user-friendly messages (don't expose internals)

## Core Principles

**1. Extend, Don't Rebuild**
- Use Better Auth (don't build custom auth)
- Use existing DB connection (don't create new one)
- Use shadcn/ui components (don't build from scratch)
- Follow existing patterns

**2. Simple Over Clever**
- Straightforward code > complex abstractions
- Standard patterns > creative solutions
- Readable > concise

**3. Working Code Over Tests/Docs**
- Focus on functionality first
- Don't generate tests unless requested
- Don't create extensive documentation unless requested
- Working MVP > perfect implementation

**4. Security First**
- Always check authentication
- Always filter by user ID
- Always validate input
- Always check ownership before update/delete

## Common Patterns Quick Reference

**Protected Server Component:**
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/");
```

**Protected API Route:**
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

**User-Specific Query:**
```typescript
const data = await db.select().from(table).where(eq(table.userId, session.user.id));
```

**Insert with User Ownership:**
```typescript
const [record] = await db.insert(table).values({ userId: session.user.id, ...data }).returning();
```

**Update with Ownership Check:**
```typescript
const [updated] = await db
  .update(table)
  .set({ ...updates })
  .where(and(eq(table.id, id), eq(table.userId, session.user.id)))
  .returning();
```

## After Implementation

1. Test the feature end-to-end
2. Run `npm run lint` and `npm run typecheck`
3. Fix any errors
4. Briefly explain what you built and how it integrates with existing systems

## Remember

- **Plan before coding** - Architecture first, implementation second
- **Use what's there** - Leverage existing auth, DB, UI patterns
- **Security matters** - Check auth and ownership everywhere
- **Simple is better** - Straightforward code wins
- **Working code first** - Functionality over tests/docs
- **Quality checks** - Always lint and typecheck before done
