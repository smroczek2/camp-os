---
name: starter-kit-intelligence
description: Deep knowledge of Next.js 15 App Router, Better Auth, Drizzle ORM with PostgreSQL, Vercel AI SDK with OpenAI, and shadcn/ui integration patterns. Use when extending authentication, database schema, AI features, or understanding how existing systems are configured. Provides integration patterns and project structure guidance for this starter kit.
---

# Starter Kit Intelligence

Knowledge of this Next.js agentic coding starter kit's tech stack, project structure, and integration patterns.

## Tech Stack Overview

**Framework:**
- Next.js 15 with App Router (Turbopack for dev)
- React 19 with TypeScript (strict mode)

**Authentication:**
- Better Auth with Google OAuth
- Server config: `@/lib/auth`
- Client utilities: `@/lib/auth-client`

**Database:**
- PostgreSQL with Drizzle ORM
- Driver: postgres.js
- Connection: `@/lib/db`
- Schema: `@/lib/schema`

**AI Integration:**
- Vercel AI SDK with OpenAI
- Model via `OPENAI_MODEL` env var
- Chat endpoint: `/api/chat`

**UI:**
- shadcn/ui (new-york style, neutral colors)
- Tailwind CSS with CSS variables
- Lucide React icons

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── auth/[...all]/ # Better Auth catch-all
│   │   └── chat/          # AI streaming endpoint
│   ├── dashboard/         # Protected page
│   ├── chat/              # Protected AI chat
│   └── page.tsx           # Landing page
├── components/
│   ├── auth/              # Auth components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
└── lib/
    ├── auth.ts            # Better Auth server
    ├── auth-client.ts     # Better Auth client
    ├── db.ts              # Database connection
    ├── schema.ts          # Drizzle schema
    └── utils.ts           # Utilities (cn, etc.)
```

**Path aliases:** All imports use `@/` → `src/`

## Better Auth Patterns

### Server Component (Protected Route)
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return <div>Welcome {session.user.name}</div>;
}
```

### Client Component
```typescript
"use client";
import { useSession, signIn, signOut } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <button onClick={() => signIn.social({ provider: "google" })}>Sign In</button>;

  return <button onClick={() => signOut()}>Sign Out</button>;
}
```

### API Route
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... authenticated logic
}
```

## Drizzle ORM Patterns

### Database Schema (Existing Tables)

**user:** id, name, email (unique), emailVerified, image, createdAt, updatedAt

**session:** id, token, expiresAt, userId (FK → user, cascade delete), ipAddress, userAgent, createdAt, updatedAt

**account:** OAuth provider accounts, links to user (cascade delete)

**verification:** Email verification tokens

### Extending Schema
```typescript
// In src/lib/schema.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./schema"; // Import existing tables

export const yourTable = pgTable("your_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Then run:**
- Dev: `npm run db:push` (fast iteration, no migration files)
- Prod: `npm run db:generate` → `npm run db:migrate`

### Querying User-Specific Data
```typescript
import { db } from "@/lib/db";
import { yourTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// Get user's records
const records = await db
  .select()
  .from(yourTable)
  .where(eq(yourTable.userId, session.user.id));

// Insert with user ownership
const [newRecord] = await db
  .insert(yourTable)
  .values({
    userId: session.user.id,
    title: "Example",
  })
  .returning();

// Update with ownership check
const [updated] = await db
  .update(yourTable)
  .set({ title: "Updated" })
  .where(and(
    eq(yourTable.id, recordId),
    eq(yourTable.userId, session.user.id)
  ))
  .returning();
```

## Vercel AI SDK Patterns

### CRITICAL: Always Use Environment Variable
```typescript
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ✓ Correct
const result = streamText({
  model: openai(model),
  messages: [...],
});

// ✗ NEVER hardcode model names
// model: openai("gpt-4o-mini")
```

### Streaming Chat Endpoint
See `src/app/api/chat/route.ts` for complete pattern:
- Uses `convertToModelMessages()` to transform UIMessage format
- Returns `toUIMessageStreamResponse()` for client streaming

### Client Hook
```typescript
"use client";
import { useChat } from "@ai-sdk/react";

export function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  return (
    <form onSubmit={handleSubmit}>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <input value={input} onChange={handleInputChange} />
    </form>
  );
}
```

## shadcn/ui Patterns

### Check Existing Components
Look in `src/components/ui/` before installing new ones.

### Install New Components
```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add dialog
```

### Styling Guidelines
- Use Tailwind utility classes only
- Use CSS variables for theming (in `globals.css`)
- Stick to neutral color palette
- Avoid custom colors unless explicitly required

**Common patterns:**
```typescript
// Semantic colors
text-foreground          // Primary text
text-muted-foreground    // Secondary text
bg-background           // Main background
bg-card                 // Card backgrounds
border-border           // Standard borders

// Responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="flex flex-col md:flex-row"
```

## Available Scripts

```bash
npm run dev          # Development with Turbopack
npm run build        # Production build (includes db:migrate)
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript validation
npm run db:generate  # Generate migrations from schema
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (dev - no migration files)
npm run db:studio    # Open Drizzle Studio GUI
npm run db:reset     # Reset database (drop all + push schema)
```

## Key Principles

1. **Server Components by default** - Only use "use client" when you need hooks, event handlers, or browser APIs
2. **Always use path aliases** - Import with `@/` prefix (e.g., `@/lib/db`)
3. **User-specific data** - Always filter DB queries by `session.user.id`
4. **Environment variables** - Use `OPENAI_MODEL` for AI, never hardcode
5. **Quality checks** - Always run `npm run lint` and `npm run typecheck` after changes
6. **Database changes** - Use `db:push` for dev, `db:generate` + `db:migrate` for prod
7. **Cascade deletes** - User data should use `onDelete: "cascade"` in foreign keys

## When Building Features

1. **Leverage what's configured** - Auth, DB, and AI are ready to extend
2. **Follow existing patterns** - Don't reinvent authentication, DB connections, or AI integration
3. **Use App Router conventions** - Server components, API routes, proper headers handling
4. **Think about integration** - How does this connect to auth? Need database tables? Use AI?
5. **Keep it simple** - Focus on working code over complex architectures
