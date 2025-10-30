---
name: starter-kit-intelligence
description: Use when building features for this Next.js starter kit. Provides deep knowledge of the existing tech stack (Next.js 15, Better Auth, Drizzle ORM, PostgreSQL, Vercel AI SDK, OpenAI, shadcn/ui), project structure, integration patterns, and how to properly extend the application with new features that work seamlessly with existing authentication, database, and AI capabilities.
---

# Starter Kit Intelligence

You are working with a Next.js agentic coding starter kit that comes pre-configured with authentication, database, and AI capabilities. This skill provides you with deep knowledge of the project structure and patterns.

## Tech Stack

### Core Framework
- **Next.js 15** with App Router
- **React 19**
- **TypeScript** (strict mode)
- **Turbopack** for development

### Authentication
- **Better Auth** - Configured and ready to use
- **Google OAuth** - Integration set up
- Session management included
- Client utilities: `@/lib/auth-client`
- Server utilities: `@/lib/auth`

### Database
- **PostgreSQL** - Connection configured
- **Drizzle ORM** - Schema and migrations ready
- **postgres.js** - Database driver
- Connection: `@/lib/db`
- Schema: `@/lib/schema`

### AI Integration
- **Vercel AI SDK** - Installed and configured
- **OpenAI** - Integration ready
- Model configuration via `OPENAI_MODEL` env var
- Streaming chat endpoint at `/api/chat`

### UI & Styling
- **shadcn/ui** - Component library (new-york style)
- **Tailwind CSS** - Styling system
- **Lucide React** - Icons
- **Geist Font** - Typography

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── auth/[...all]/ # Better Auth catch-all route
│   │   └── chat/          # AI chat endpoint (streaming)
│   ├── chat/              # AI chat page (protected)
│   ├── dashboard/         # User dashboard (protected)
│   ├── profile/           # User profile (protected)
│   ├── layout.tsx         # Root layout with header/footer
│   └── page.tsx           # Landing page
├── components/
│   ├── auth/              # Auth components (sign-in/out)
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
└── lib/
    ├── auth.ts            # Better Auth server config
    ├── auth-client.ts     # Better Auth client utilities
    ├── db.ts              # Database connection
    ├── schema.ts          # Drizzle schema definitions
    └── utils.ts           # Utilities (cn, etc.)
```

## Path Aliases

All imports use `@/` pointing to `src/`:
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/app` → `src/app`

## Existing Database Schema

The database uses Better Auth's schema with these tables:

### `user` table
- `id` (primary key)
- `name`, `email` (unique), `emailVerified`
- `image`, `createdAt`, `updatedAt`

### `session` table
- `id` (primary key)
- `token` (unique), `expiresAt`
- `userId` (foreign key → user, cascade delete)
- `ipAddress`, `userAgent`
- `createdAt`, `updatedAt`

### `account` table
- OAuth provider accounts
- Links to user (cascade delete)
- Stores tokens and provider info

### `verification` table
- Email verification tokens
- `identifier`, `value`, `expiresAt`

## How to Extend the Database

**Adding new tables:**

1. Define schema in `src/lib/schema.ts`:
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./schema"; // Import existing tables if needed

export const yourTable = pgTable("your_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

2. Generate migration:
```bash
npm run db:generate
```

3. Run migration:
```bash
npm run db:migrate
```

**For development (quick iteration):**
```bash
npm run db:push  # Push schema changes directly without migration files
```

## Authentication Patterns

### Protecting Routes (Server Components)

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

  return <div>Protected content for {session.user.name}</div>;
}
```

### Client-Side Auth

```typescript
"use client";
import { useSession, signIn, signOut } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <button onClick={() => signIn.social({ provider: "google" })}>Sign In</button>;

  return (
    <div>
      <p>Welcome {session.user.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

## AI Integration Patterns

### Using OpenAI (CRITICAL: Always use env var)

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

const result = streamText({
  model: openai(model),  // ✓ Use env var
  messages: [...],
});

// ✗ NEVER hardcode: model: openai("gpt-4o-mini")
```

### Chat API Route Pattern

See `src/app/api/chat/route.ts` for the complete streaming implementation:
- Uses `convertToModelMessages()` to transform UIMessage format
- Returns `toUIMessageStreamResponse()` for client streaming
- Proper error handling

### Client-Side Chat Hook

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

## UI Component Patterns

### Always Prefer shadcn/ui

1. **Check existing components first** in `src/components/ui/`
2. **Install new shadcn components** if needed:
   ```bash
   pnpm dlx shadcn@latest add [component-name]
   ```
3. **Only use custom components** if shadcn doesn't provide a suitable option

### Current shadcn/ui Components Installed
- Button, Dialog, Avatar, Dropdown Menu
- Card, Badge, Separator
- And more (check `src/components/ui/`)

### Styling Guidelines
- Use Tailwind classes
- Use CSS variables for theming (defined in `globals.css`)
- Stick to neutral color palette
- **Avoid custom colors** unless specifically instructed

## Available Scripts

```bash
npm run dev          # Development with Turbopack
npm run build        # Production build (includes db:migrate)
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript validation
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (dev - no migration files)
npm run db:studio    # Open Drizzle Studio GUI
npm run db:reset     # Reset database (drop all + push schema)
```

## Key Principles

1. **Always run lint and typecheck** after completing changes
2. **Use existing patterns** - don't reinvent authentication, DB connections, or AI integration
3. **Leverage what's configured** - auth, db, and AI are ready to use
4. **Follow the App Router patterns** - server components by default, "use client" when needed
5. **Use path aliases** - always import with `@/` prefix
6. **Environment variables** - use `OPENAI_MODEL` for model configuration
7. **Database changes** - update schema.ts, then run db:generate and db:migrate (or db:push for dev)

## When Building New Features

1. **Understand what's already available** - check existing auth, db schema, AI setup
2. **Extend, don't rebuild** - add to existing patterns rather than creating new systems
3. **Follow project structure** - pages in app/, components in components/, utilities in lib/
4. **Use TypeScript strictly** - leverage types from Drizzle schema and Better Auth
5. **Think about integration** - how does this feature connect to auth? Need database tables? Use AI?
6. **Keep it simple** - this is a starter kit, focus on working code over complex architectures

## Common Patterns

### Adding a New Protected Page

1. Create route in `src/app/your-page/page.tsx`
2. Add session check at top
3. Use existing components from shadcn/ui
4. Query database using Drizzle if needed

### Adding Database-Backed Feature

1. Define schema in `src/lib/schema.ts`
2. Run `npm run db:push` for quick iteration
3. Create API routes in `src/app/api/your-feature/`
4. Build UI with shadcn/ui components

### Adding AI-Powered Feature

1. Create API route using Vercel AI SDK patterns
2. Use `OPENAI_MODEL` env var for model selection
3. Implement streaming if real-time responses needed
4. Use `useChat` or custom hooks on client side

Remember: Everything is already wired up and working. Your job is to extend the existing foundation with new features that integrate seamlessly.
