---
name: feature-builder
description: Use after clarifying requirements to plan and implement new features. Designs architecture that integrates with existing auth/database/AI systems, creates necessary database tables, builds API routes and UI components, and ensures everything works together. Focuses on producing working code rather than tests or documentation.
---

# Feature Builder

This skill guides you through planning and implementing features that integrate seamlessly with the starter kit's existing authentication, database, and AI capabilities.

## Activation

Use this skill after:
- Clarifying requirements (smart-clarifier has run)
- User confirms they want to proceed with implementation
- You have clear understanding of what to build

## Implementation Workflow

### Phase 1: Plan the Architecture

Before writing code, create a clear mental model of:

#### 1. Data Model
**Questions to answer:**
- What database tables are needed?
- What fields and relationships?
- How does it relate to existing `user` table?
- Should records cascade delete with user?

**Example:**
```
Task Management App:
- tasks table: id, user_id, title, description, status, due_date, created_at
- Relationship: tasks.user_id → user.id (cascade delete)
- Indexes: user_id for fast user queries
```

#### 2. API Routes
**Questions to answer:**
- What API endpoints are needed?
- Which need authentication?
- What HTTP methods (GET, POST, PUT, DELETE)?
- Request/response shapes?

**Example:**
```
Tasks API:
- GET /api/tasks - List user's tasks (authenticated)
- POST /api/tasks - Create task (authenticated)
- PUT /api/tasks/[id] - Update task (authenticated)
- DELETE /api/tasks/[id] - Delete task (authenticated)
```

#### 3. Pages & UI
**Questions to answer:**
- What pages/routes are needed?
- Which are protected (require auth)?
- What shadcn/ui components to use?
- Layout structure?

**Example:**
```
Task Pages:
- /tasks - Task list page (protected)
- /tasks/[id] - Task detail page (protected)

Components:
- TaskList (uses Card, Button from shadcn)
- TaskForm (uses Input, Textarea, Select from shadcn)
- TaskItem (uses Checkbox, Badge from shadcn)
```

#### 4. Integration Points
**Questions to answer:**
- How does this use authentication?
- Does it need AI features?
- Real-time updates needed?
- External services?

**Example:**
```
Integrations:
- Auth: All routes check session, filter by user_id
- AI: Optional AI task suggestions using OpenAI
- Real-time: No (standard request/response is fine)
```

### Phase 2: Database Setup

#### Step 1: Define Schema

Add table definitions to `src/lib/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, done
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Key patterns:**
- Use UUID for IDs: `uuid("id").defaultRandom().primaryKey()`
- Foreign keys with cascade: `references(() => user.id, { onDelete: "cascade" })`
- Timestamps: `timestamp("created_at").defaultNow().notNull()`
- Status enums: Use text with validation in API layer

#### Step 2: Push Schema Changes

For development iteration:
```bash
npm run db:push
```

For production-ready migrations:
```bash
npm run db:generate
npm run db:migrate
```

**Use `db:push` during feature development** - it's faster and you can iterate quickly.

### Phase 3: Build API Routes

Create API routes in `src/app/api/[feature-name]/`:

#### Pattern: Authenticated API Route

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Query user's data only
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

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, dueDate } = body;

    // Validate
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Insert
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
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

**Key patterns:**
- Always check `session` first
- Always filter by `session.user.id` for user-specific data
- Validate input before database operations
- Use try/catch for error handling
- Return appropriate status codes
- Log errors for debugging

#### Pattern: Dynamic API Route (with ID)

For routes like `/api/tasks/[id]/route.ts`:

```typescript
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
    const { title, description, status, dueDate } = body;

    // Update only if owned by user (security check)
    const [updated] = await db
      .update(tasks)
      .set({
        title: title?.trim(),
        description: description?.trim(),
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, params.id), eq(tasks.userId, session.user.id)))
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

**Security:** Always use `and()` to check both ID match AND user ownership.

### Phase 4: Build UI Components

#### Step 1: Create Protected Page

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
      <TaskList userId={session.user.id} />
    </main>
  );
}
```

#### Step 2: Build Client Components

Use shadcn/ui components and React hooks:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function TaskList({ userId }: { userId: string }) {
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
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(title: string, description: string) {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      setTasks([...tasks, data.task]);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  }

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="space-y-4">
      <TaskForm onSubmit={createTask} />
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}
```

**Component patterns:**
- Use "use client" for interactive components
- Fetch data in useEffect or React Query
- Handle loading and error states
- Use shadcn/ui components for UI elements
- Keep components focused and composable

#### Step 3: Install Additional shadcn Components

If you need components not yet installed:

```bash
pnpm dlx shadcn@latest add [component-name]
```

Common components:
- `form` - Form handling with react-hook-form
- `select` - Dropdown selects
- `checkbox` - Checkboxes
- `calendar` - Date picker
- `toast` - Notifications
- `tabs` - Tab navigation

### Phase 5: Add AI Features (Optional)

If the feature needs AI, use the Vercel AI SDK:

```typescript
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

const result = await generateText({
  model: openai(model),
  prompt: "Generate task suggestions based on: " + userInput,
});
```

**Always use `OPENAI_MODEL` environment variable**, never hardcode model names.

### Phase 6: Final Steps

1. **Test the feature** - Make sure it works end-to-end
2. **Run lint** - `npm run lint`
3. **Run typecheck** - `npm run typecheck`
4. **Fix any errors** - Address linting and type issues

## Implementation Principles

### 1. Focus on Working Code

**Do:**
- Build features that work
- Handle errors gracefully
- Validate user input
- Provide good UX (loading states, error messages)

**Don't:**
- Generate unit tests (unless requested)
- Create extensive documentation
- Build complex test suites
- Over-engineer for future needs

### 2. Integrate with Existing Systems

**Always leverage:**
- Better Auth for authentication
- Existing user table and schema
- Drizzle ORM patterns
- shadcn/ui component library
- Tailwind CSS styling
- Path aliases (`@/`)

**Never:**
- Build custom auth
- Create new database connections
- Reinvent UI components
- Use different styling approaches

### 3. Keep It Simple

**Prefer:**
- Simple, readable code
- Standard patterns
- Existing components
- Straightforward logic

**Avoid:**
- Complex abstractions
- Premature optimization
- Over-engineering
- Unnecessary dependencies

### 4. Security First

**Always:**
- Check session in protected routes
- Filter data by user ID
- Validate user input
- Use parameterized queries (Drizzle handles this)
- Check ownership before update/delete operations

**Never:**
- Trust client input without validation
- Expose other users' data
- Skip authentication checks
- Use raw SQL with string concatenation

## Common Patterns Quick Reference

### Protected Server Component
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/");
```

### Protected API Route
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

### Database Query (User-Specific)
```typescript
const data = await db.select().from(table).where(eq(table.userId, session.user.id));
```

### Database Insert (User-Specific)
```typescript
const [newRecord] = await db.insert(table).values({ userId: session.user.id, ...data }).returning();
```

### Database Update (With Ownership Check)
```typescript
const [updated] = await db
  .update(table)
  .set({ ...updates })
  .where(and(eq(table.id, id), eq(table.userId, session.user.id)))
  .returning();
```

### Client Data Fetching
```typescript
useEffect(() => {
  fetch("/api/endpoint")
    .then(res => res.json())
    .then(data => setState(data));
}, []);
```

## Remember

- **Plan before coding** - Think through data model, API, and UI
- **Use what's there** - Leverage existing auth, db, UI components
- **Security matters** - Always check auth and ownership
- **Simple is better** - Straightforward code over clever abstractions
- **Working code wins** - Focus on functionality, not tests/docs
- **Lint and typecheck** - Always run before considering complete

After implementation, briefly explain what you built and how it integrates with the existing system.
