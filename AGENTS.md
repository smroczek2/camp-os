# AGENTS.md

**Machine-readable instructions for AI coding agents**

This is the primary source of truth for all AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.) working with this Next.js starter kit.

---

## Project Overview

Production-ready Next.js 15 starter kit with:
- **Framework**: Next.js 15 App Router, React 19, TypeScript (strict)
- **Auth**: Better Auth with Google OAuth
- **Database**: PostgreSQL + Drizzle ORM (postgres.js)
- **AI**: Vercel AI SDK with OpenAI
- **UI**: shadcn/ui (new-york style, neutral colors) + Tailwind CSS v4
- **Path Aliases**: `@/` → `src/`

---

## Setup Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Database operations
npm run db:push       # Push schema changes (dev)
npm run db:generate   # Generate migrations (prod)
npm run db:migrate    # Run migrations (prod)
npm run db:studio     # Open database GUI

# Quality checks (ALWAYS run after changes)
npm run lint
npm run typecheck
```

---

## Core Principles (CRITICAL)

1. **Server Components by Default** - Only use `"use client"` when you need useState, useEffect, onClick, or browser APIs
2. **Always Filter by User ID** - All user-specific database queries MUST filter by `session.user.id`
3. **Use Existing Patterns** - Don't reinvent auth, database, or AI integration
4. **Environment Variables** - ALWAYS use `process.env.OPENAI_MODEL`, never hardcode model names
5. **Quality Checks Required** - Run `npm run lint` and `npm run typecheck` after ALL changes
6. **Security First** - Check authentication, validate input, verify ownership on updates/deletes

---

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── auth/[...all]/   # Better Auth catch-all
│   │   └── chat/            # AI streaming endpoint
│   ├── dashboard/           # Protected pages
│   ├── chat/                # AI chat interface
│   └── page.tsx             # Public landing
├── components/
│   ├── auth/                # Auth components
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth.ts              # Better Auth server
│   ├── auth-client.ts       # Better Auth client
│   ├── db.ts                # Database connection
│   ├── schema.ts            # Drizzle schema
│   └── utils.ts             # Utilities
└── hooks/                   # Custom React hooks
```

---

## Database Schema

**Existing tables**: user, session, account, verification

**All new user-specific tables MUST include:**
```typescript
userId: uuid("user_id")
  .references(() => user.id, { onDelete: "cascade" })
  .notNull()
```

**Extending schema** (`src/lib/schema.ts`):
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const yourTable = pgTable("your_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**After schema changes**: Run `npm run db:push` (dev) or `npm run db:generate && npm run db:migrate` (prod)

---

## Authentication Pattern

**Protected Server Component:**
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  return <div>Welcome {session.user.name}</div>;
}
```

**Protected API Route:**
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Your logic here
}
```

**Client Component:**
```typescript
"use client";
import { useSession, signIn, signOut } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session, isPending } = useSession();
  if (isPending) return <div>Loading...</div>;
  if (!session) return <Button onClick={() => signIn.social({ provider: "google" })}>Sign In</Button>;
  return <div>Welcome {session.user.name}</div>;
}
```

---

## Database Query Patterns

**CRITICAL: Always filter by userId for user-specific data**

```typescript
import { db } from "@/lib/db";
import { yourTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// SELECT - Get user's records only
const records = await db
  .select()
  .from(yourTable)
  .where(eq(yourTable.userId, session.user.id));

// INSERT - With user ownership
const [newRecord] = await db
  .insert(yourTable)
  .values({ userId: session.user.id, title: "Example" })
  .returning();

// UPDATE - With ownership verification (CRITICAL)
const [updated] = await db
  .update(yourTable)
  .set({ title: "Updated" })
  .where(and(
    eq(yourTable.id, recordId),
    eq(yourTable.userId, session.user.id)  // MUST verify ownership
  ))
  .returning();

// DELETE - With ownership verification
await db
  .delete(yourTable)
  .where(and(
    eq(yourTable.id, recordId),
    eq(yourTable.userId, session.user.id)
  ));
```

---

## AI Integration Pattern

**CRITICAL: Always use environment variable for model**

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// ✓ CORRECT
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const result = streamText({
  model: openai(model),
  messages: convertToModelMessages(messages),
});

// ✗ WRONG - Never hardcode
// model: openai("gpt-4o-mini")
```

**Streaming API Route** (see `src/app/api/chat/route.ts`):
```typescript
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
```

**Client Hook:**
```typescript
"use client";
import { useChat } from "@ai-sdk/react";

export function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });
  // Render UI
}
```

---

## UI Component Guidelines

1. **Use shadcn/ui First** - Check `src/components/ui/` before creating custom components
2. **Install new components**: `pnpm dlx shadcn@latest add [component-name]`
3. **Styling**: Use Tailwind utilities ONLY, semantic color variables
4. **Responsive**: Mobile-first approach with `md:`, `lg:` breakpoints

**Semantic Colors:**
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `bg-background` - Main background
- `bg-card` - Card backgrounds
- `border-border` - Standard borders
- `bg-primary` - Primary buttons
- `bg-destructive` - Error states

**Never use custom hex colors** - Always use semantic variables

---

## API Route Pattern

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { yourTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db
      .select()
      .from(yourTable)
      .where(eq(yourTable.userId, session.user.id));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const [newItem] = await db
      .insert(yourTable)
      .values({ userId: session.user.id, title: title.trim() })
      .returning();

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
```

---

## Security Checklist

✓ Check session in ALL protected routes and API endpoints
✓ Filter ALL user data queries by `session.user.id`
✓ Use `and(eq(table.id, id), eq(table.userId, session.user.id))` on updates/deletes
✓ Validate and sanitize all user input
✓ Use try/catch in API routes, log errors server-side
✓ Return user-friendly error messages (never expose internals)
✓ Never commit .env files

---

## Development Workflow

1. **Plan**: What tables/endpoints/UI components are needed?
2. **Schema**: Add tables to `src/lib/schema.ts`, run `npm run db:push`
3. **API**: Create routes in `src/app/api/`, check auth, filter by userId
4. **UI**: Use shadcn/ui components, server components by default
5. **Quality**: Run `npm run lint` and `npm run typecheck`

---

## Anti-Patterns (NEVER Do)

❌ Use `"use client"` on server components unnecessarily
❌ Hardcode model names or API keys
❌ Query database without filtering by userId for user data
❌ Skip authentication checks
❌ Create custom components when shadcn/ui has them
❌ Use custom hex colors outside design system
❌ Skip ownership verification on updates/deletes
❌ Forget to run lint and typecheck

---

## Common Imports

```typescript
// Auth
import { auth } from "@/lib/auth";
import { useSession, signIn, signOut } from "@/lib/auth-client";

// Database
import { db } from "@/lib/db";
import { eq, and, or, desc } from "drizzle-orm";

// AI SDK
import { openai } from "@ai-sdk/openai";
import { streamText, generateText, generateObject } from "ai";
import { useChat } from "@ai-sdk/react";

// UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
```

---

## Environment Variables

Required in `.env`:
- `POSTGRES_URL` - Database connection
- `BETTER_AUTH_SECRET` - Auth secret (32 chars)
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `OPENAI_API_KEY` - OpenAI key (optional)
- `OPENAI_MODEL` - Model name (default: gpt-4o-mini)
- `NEXT_PUBLIC_APP_URL` - App URL

---

## Additional Resources

- `CLAUDE.md` - Claude Code specific instructions
- `.cursor/rules/` - Cursor IDE rules
- `.github/agents/` - GitHub Copilot instructions
- `docs/` - Additional documentation
- `README.md` - Setup guide

---

**Remember**: This starter kit is designed for rapid, secure development. Follow the patterns, check authentication, validate input, and always filter by userId.
