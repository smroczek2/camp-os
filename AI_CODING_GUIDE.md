# AI Coding Assistant Guide

**Universal reference for all AI coding tools (Claude Code, Cursor, Codex, etc.)**

This document provides comprehensive guidance for AI assistants working with this Next.js starter kit. It is designed to be tool-agnostic and provides all the context needed to build features correctly and securely.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Tech Stack Overview](#tech-stack-overview)
- [Project Architecture](#project-architecture)
- [Core Principles](#core-principles)
- [Authentication Patterns](#authentication-patterns)
- [Database Patterns](#database-patterns)
- [AI Integration Patterns](#ai-integration-patterns)
- [UI & Component Guidelines](#ui--component-guidelines)
- [API Route Patterns](#api-route-patterns)
- [Security Requirements](#security-requirements)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Anti-Patterns](#anti-patterns)

---

## Quick Start

**What is this?**
A production-ready Next.js 15 starter kit with authentication, database, AI capabilities, and modern UI components. Everything is pre-configured and follows best practices.

**Key Files:**
- `src/lib/auth.ts` - Better Auth configuration (server)
- `src/lib/auth-client.ts` - Better Auth client utilities
- `src/lib/db.ts` - Database connection (PostgreSQL + Drizzle)
- `src/lib/schema.ts` - Database schema definition
- `src/app/api/chat/route.ts` - Example AI streaming endpoint
- `CLAUDE.md` - Claude Code specific instructions
- `.cursorrules` - Cursor IDE specific rules

**Before You Start:**
1. Read [Core Principles](#core-principles)
2. Review [Security Requirements](#security-requirements)
3. Check existing code for patterns before building new features
4. Always run `npm run lint` and `npm run typecheck` after changes

---

## Tech Stack Overview

| Category | Technology | Notes |
|----------|-----------|-------|
| **Framework** | Next.js 15 (App Router) | Server components by default |
| **UI Library** | React 19 | Latest stable version |
| **Language** | TypeScript (strict) | Type safety enforced |
| **Auth** | Better Auth | Google OAuth configured |
| **Database** | PostgreSQL | Via Vercel Postgres or local |
| **ORM** | Drizzle ORM | postgres.js driver |
| **AI** | Vercel AI SDK | OpenAI integration |
| **UI Components** | shadcn/ui | new-york style, neutral colors |
| **Styling** | Tailwind CSS v4 | Utility-first, no custom CSS |
| **Icons** | Lucide React | Consistent icon system |
| **Validation** | Zod | Schema validation |
| **Forms** | react-hook-form | With Zod resolver |

---

## Project Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/[...all]/       # Better Auth catch-all
│   │   │   └── route.ts
│   │   ├── chat/                 # AI streaming endpoint
│   │   │   └── route.ts
│   │   └── diagnostics/          # System diagnostics
│   │       └── route.ts
│   ├── dashboard/                # Protected dashboard
│   │   └── page.tsx
│   ├── chat/                     # Protected AI chat
│   │   └── page.tsx
│   ├── profile/                  # User profile
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Public landing page
├── components/                    # React components
│   ├── auth/                     # Authentication UI
│   └── ui/                       # shadcn/ui components
├── hooks/                        # Custom React hooks
│   └── use-diagnostics.ts
├── lib/                          # Core libraries & utilities
│   ├── auth.ts                   # Better Auth server
│   ├── auth-client.ts            # Better Auth client
│   ├── db.ts                     # Database connection
│   ├── schema.ts                 # Drizzle schema
│   └── utils.ts                  # Helper functions
└── styles/
    └── globals.css               # Global styles + CSS variables
```

### Path Aliases

All imports use `@/` pointing to `src/`:

```typescript
import { auth } from "@/lib/auth";           // NOT "../lib/auth"
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
```

### Database Schema (Existing Tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user` | User accounts | id, email (unique), name, image |
| `session` | User sessions | id, userId (FK), token, expiresAt |
| `account` | OAuth accounts | id, userId (FK), providerId, accountId |
| `verification` | Email verification | id, identifier, value, expiresAt |

All tables use UUID primary keys. User-related tables cascade delete when user is deleted.

---

## Core Principles

### 1. Server Components by Default

**Default**: Server component (no "use client")
**Use Client Only When**: You need useState, useEffect, onClick, browser APIs

```typescript
// ✓ Server component (default)
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✓ Client component (when needed)
"use client";
import { useState } from "react";

export function Interactive() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 2. Always Filter by User ID

**CRITICAL**: All database queries for user-specific data MUST filter by `session.user.id`

```typescript
// ✓ CORRECT - Filters by user ID
const tasks = await db
  .select()
  .from(tasks)
  .where(eq(tasks.userId, session.user.id));

// ✗ WRONG - Returns all users' data (security vulnerability!)
const tasks = await db.select().from(tasks);
```

### 3. Use Existing Patterns

Don't reinvent:
- Authentication → Use Better Auth (`@/lib/auth`)
- Database → Use Drizzle (`@/lib/db`)
- AI → Use Vercel AI SDK (`@ai-sdk/openai`)
- UI → Use shadcn/ui (`@/components/ui/*`)

### 4. Environment Variables for Configuration

**CRITICAL**: Never hardcode model names, API keys, or configuration

```typescript
// ✓ CORRECT
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ✗ WRONG
const model = "gpt-4o-mini"; // Hardcoded
```

### 5. Quality Checks Required

Always run before considering a feature complete:
```bash
npm run lint        # ESLint validation
npm run typecheck   # TypeScript type checking
```

### 6. Security First

- ✓ Check authentication in all protected routes
- ✓ Validate all user input
- ✓ Filter queries by userId
- ✓ Verify ownership on updates/deletes
- ✓ Handle errors gracefully
- ✓ Log errors server-side

---

## Authentication Patterns

### Protected Server Page

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/"); // Redirect to home if not authenticated
  }

  // User is authenticated
  return (
    <div>
      <h1>Welcome {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### Protected API Route

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // User is authenticated - proceed with logic
  return NextResponse.json({
    userId: session.user.id,
    email: session.user.email,
  });
}
```

### Client Component with Auth

```typescript
"use client";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <Button disabled>Loading...</Button>;
  }

  if (!session) {
    return (
      <Button onClick={() => signIn.social({ provider: "google" })}>
        Sign In with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span>Signed in as {session.user.email}</span>
      <Button onClick={() => signOut()}>Sign Out</Button>
    </div>
  );
}
```

---

## Database Patterns

### Adding a New Table

**Step 1**: Add to `src/lib/schema.ts`

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { user } from "./schema"; // Import existing user table

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Step 2**: Push schema changes

```bash
# Development (fast, no migration files)
npm run db:push

# Production (with migration files)
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
```

### Querying User-Specific Data

```typescript
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Get user's tasks
const userTasks = await db
  .select()
  .from(tasks)
  .where(eq(tasks.userId, session.user.id));

// Get single task (with user check)
const task = await db
  .select()
  .from(tasks)
  .where(
    and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id)
    )
  )
  .limit(1);
```

### Creating Records

```typescript
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";

const [newTask] = await db
  .insert(tasks)
  .values({
    userId: session.user.id,  // ALWAYS set userId
    title: "My Task",
    description: "Task description",
  })
  .returning(); // Returns the created record
```

### Updating Records (with Ownership Check)

```typescript
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

const [updated] = await db
  .update(tasks)
  .set({
    title: "Updated Title",
    updatedAt: new Date(),
  })
  .where(
    and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id) // CRITICAL: verify ownership
    )
  )
  .returning();

if (!updated) {
  // Task not found or user doesn't own it
  return NextResponse.json(
    { error: "Task not found or unauthorized" },
    { status: 404 }
  );
}
```

### Deleting Records (with Ownership Check)

```typescript
await db
  .delete(tasks)
  .where(
    and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id)
    )
  );
```

---

## AI Integration Patterns

### Environment Variable for Model (CRITICAL)

```typescript
import { openai } from "@ai-sdk/openai";

// ✓ CORRECT - Use environment variable
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const result = await generateText({
  model: openai(model),
  prompt: "Hello",
});

// ✗ WRONG - Hardcoded
const result = await generateText({
  model: openai("gpt-4o-mini"), // Don't hardcode!
  prompt: "Hello",
});
```

### Streaming Chat API Route

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

### Client-Side Chat Component

```typescript
"use client";
import { useChat } from "@ai-sdk/react";

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### Generating Structured Data

```typescript
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const { object } = await generateObject({
  model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
  }),
  prompt: "Generate a blog post idea about AI",
});

// object is typed and validated
console.log(object.title); // Type-safe
```

---

## UI & Component Guidelines

### Use shadcn/ui Components

**ALWAYS check `src/components/ui/` first** before creating custom components.

**Install new components:**
```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add input
```

**Available components**: Button, Card, Dialog, Input, Label, Dropdown Menu, Avatar, etc.

### Styling with Tailwind (Semantic Colors)

**NEVER use custom hex colors** - Use semantic color variables:

```typescript
// ✓ CORRECT - Semantic colors
<div className="text-foreground bg-background border-border">
<button className="bg-primary text-primary-foreground">
<p className="text-muted-foreground">

// ✗ WRONG - Custom colors
<div className="text-[#333333] bg-[#FFFFFF]">
```

**Common semantic colors:**
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `bg-background` - Main background
- `bg-card` - Card backgrounds
- `border-border` - Standard borders
- `bg-primary` - Primary actions
- `bg-destructive` - Error/danger

### Responsive Design (Mobile-First)

```typescript
// Start with mobile, add breakpoints for larger screens
<div className="
  flex flex-col          // Mobile: vertical stack
  md:flex-row            // Tablet+: horizontal
  gap-4                  // Consistent spacing
  p-4 md:p-6 lg:p-8      // Responsive padding
">
  <div className="
    w-full                // Mobile: full width
    md:w-1/2              // Tablet: half width
    lg:w-1/3              // Desktop: third width
  ">
    Content
  </div>
</div>
```

### Composable Components

```typescript
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 shadow-sm",
        className // Allow custom classes to be merged
      )}
    >
      {children}
    </div>
  );
}

// Usage - can customize while keeping defaults
<Card className="hover:shadow-lg transition-shadow">
  Custom content
</Card>
```

---

## API Route Patterns

### Complete CRUD API Route Example

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tasks - List user's tasks
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

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

// PUT /api/tasks/[id] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const [updated] = await db
      .update(tasks)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.id, params.id),
          eq(tasks.userId, session.user.id) // Ownership check
        )
      )
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

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db
      .delete(tasks)
      .where(
        and(
          eq(tasks.id, params.id),
          eq(tasks.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
```

---

## Security Requirements

### Authentication Checklist

- ✓ Check session in ALL protected routes (pages and API)
- ✓ Return 401 for unauthenticated requests
- ✓ Use `redirect("/")` for server pages, `NextResponse.json` for API

### Data Access Checklist

- ✓ Filter ALL queries by `session.user.id` for user-specific data
- ✓ Use `and(eq(table.id, id), eq(table.userId, session.user.id))` on updates/deletes
- ✓ Return 404 if record not found OR user doesn't own it (don't leak info)

### Input Validation Checklist

- ✓ Validate all user input before database operations
- ✓ Use Zod schemas for type-safe validation
- ✓ Trim strings, sanitize data
- ✓ Return 400 with clear error messages for invalid input

### Error Handling Checklist

- ✓ Use try/catch blocks in all API routes
- ✓ Log errors server-side with `console.error()`
- ✓ Return user-friendly messages (don't expose internals)
- ✓ Return appropriate status codes (400, 401, 404, 500)

---

## Development Workflow

### Building a New Feature

1. **Plan Architecture**
   - What tables are needed?
   - What API endpoints?
   - What UI pages/components?
   - Does it need auth?
   - Does it integrate with AI?

2. **Database Schema**
   - Add tables to `src/lib/schema.ts`
   - Run `npm run db:push` (dev) or `npm run db:generate` + `db:migrate` (prod)

3. **API Routes**
   - Create route handlers in `src/app/api/`
   - Check authentication
   - Validate input
   - Filter by userId

4. **UI Components**
   - Use shadcn/ui components
   - Server components by default
   - Client only when needed

5. **Quality Checks**
   - Run `npm run lint`
   - Run `npm run typecheck`
   - Test authentication flows
   - Test error cases

### Available Scripts

```bash
npm run dev          # Development with Turbopack
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run typecheck    # TypeScript validation
npm run db:push      # Push schema (dev)
npm run db:generate  # Generate migration
npm run db:migrate   # Run migration
npm run db:studio    # Database GUI
npm run db:reset     # Reset database
```

---

## Common Tasks

### Add a New Page

1. Create file in `src/app/[route]/page.tsx`
2. If protected, add authentication check
3. Build UI with shadcn/ui components

```typescript
// src/app/tasks/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Tasks</h1>
    </main>
  );
}
```

### Add a New API Route

1. Create file in `src/app/api/[route]/route.ts`
2. Add authentication check
3. Implement HTTP methods (GET, POST, PUT, DELETE)

```typescript
// src/app/api/example/route.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ message: "Hello" });
}
```

### Add a shadcn/ui Component

```bash
pnpm dlx shadcn@latest add [component-name]
```

Then import from `@/components/ui/[component-name]`

---

## Anti-Patterns

### ❌ Things to NEVER Do

**Authentication:**
- ❌ Skip session checks on protected routes
- ❌ Trust client-side auth state for security decisions
- ❌ Forget to redirect unauthenticated users

**Database:**
- ❌ Query without filtering by userId for user data
- ❌ Skip ownership checks on updates/deletes
- ❌ Use raw SQL instead of Drizzle ORM

**Code Quality:**
- ❌ Use "use client" on server components unnecessarily
- ❌ Hardcode configuration (models, API keys, etc.)
- ❌ Skip lint and typecheck
- ❌ Create custom components when shadcn/ui has them

**Styling:**
- ❌ Use custom hex colors outside design system
- ❌ Write custom CSS instead of Tailwind utilities
- ❌ Forget mobile-first responsive design

**Security:**
- ❌ Expose error details to users
- ❌ Return different errors for "not found" vs "unauthorized"
- ❌ Skip input validation
- ❌ Commit .env files to git

---

## Additional Resources

- **CLAUDE.md** - Claude Code specific instructions
- **.cursorrules** - Cursor IDE specific rules
- **docs/** - Additional documentation
- **README.md** - Setup and getting started
- **.claude/skills/** - Claude Code skills

---

## Quick Reference

**Common Imports:**
```typescript
// Auth
import { auth } from "@/lib/auth";
import { useSession, signIn, signOut } from "@/lib/auth-client";

// Database
import { db } from "@/lib/db";
import { eq, and, or, desc } from "drizzle-orm";

// AI
import { openai } from "@ai-sdk/openai";
import { streamText, generateText, generateObject } from "ai";
import { useChat } from "@ai-sdk/react";

// UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
```

**Environment Variables:**
- `POSTGRES_URL` - Database connection
- `BETTER_AUTH_SECRET` - Auth secret
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - OpenAI model name (default: gpt-4o-mini)
- `NEXT_PUBLIC_APP_URL` - App URL

---

**Remember**: This starter kit is designed for rapid, secure development. Follow the patterns, check authentication, validate input, and always filter by userId. Build features quickly without introducing technical debt or security vulnerabilities.
