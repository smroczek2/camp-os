# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Code Skills & Workflow

### Smart Clarifier Skill

**CRITICAL: When using the `smart-clarifier` skill, you MUST use the `AskUserQuestion` tool to present questions.**

- **Never** output clarifying questions as plain text
- **Always** use the `AskUserQuestion` tool with proper structure:
  - Present 2-3 questions using the tool
  - Each question should have 2-4 concrete options
  - Include your recommendation for each question
  - Set appropriate `multiSelect` values

**Example Pattern:**
```
When smart-clarifier skill activates:
1. Analyze the feature request
2. Identify 2-3 critical questions
3. Call AskUserQuestion tool with structured options
4. Wait for user response
5. Proceed with implementation
```

**Why this matters:** The `AskUserQuestion` tool provides a much better UX with clickable options, prevents misunderstandings, and ensures consistent question formatting.

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (includes database migration)
- `npm run start` - Start production server

### Quality Checks
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- **Always run the LINT and TYPECHECK scripts after completing your changes. This is to check for any issues.**

### Database Operations
- `npm run db:generate` - Generate database migrations from schema changes
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database (alias: `db:dev`)
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:reset` - Reset database (drop all tables and push schema)

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router) with React 19
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with Google OAuth
- **AI Integration**: Vercel AI SDK with OpenAI
- **UI**: shadcn/ui components with Tailwind CSS
- **Type Safety**: TypeScript with strict mode

### Path Aliases
All imports use the `@/` alias pointing to `src/`:
- `@/components` - React components
- `@/lib` - Utilities and configurations
- `@/hooks` - Custom React hooks

### Key Files and Their Purposes

**Database & Schema**
- `src/lib/db.ts` - PostgreSQL connection using postgres.js and Drizzle
- `src/lib/schema.ts` - Database schema with user, session, account, and verification tables
- `drizzle.config.ts` - Drizzle configuration pointing to schema and migrations output

**Authentication**
- `src/lib/auth.ts` - Better Auth server configuration with Google OAuth
- `src/lib/auth-client.ts` - Client-side auth utilities
- `src/app/api/auth/[...all]/route.ts` - Auth API catch-all route

**AI Integration**
- `src/app/api/chat/route.ts` - Streaming chat endpoint using Vercel AI SDK
  - Uses `streamText` with OpenAI model
  - Converts UIMessage to ModelMessage format
  - Returns UI stream response

### Database Schema Structure

The schema uses Better Auth's adapter pattern with the following tables:

**user table**: id (PK), name, email (unique), emailVerified, image, createdAt, updatedAt

**session table**: id (PK), expiresAt, token (unique), createdAt, updatedAt, ipAddress, userAgent, userId (FK to user with cascade delete)

**account table**: id (PK), accountId, providerId, userId (FK to user with cascade delete), accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt

**verification table**: id (PK), identifier, value, expiresAt, createdAt, updatedAt

### Environment Variables

Required environment variables (see `env.example`):
- `POSTGRES_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Random 32-character secret for auth
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `OPENAI_API_KEY` - OpenAI API key (optional, for chat)
- `OPENAI_MODEL` - OpenAI model name (defaults to "gpt-5-mini")
- `NEXT_PUBLIC_APP_URL` - Application URL

### Application Structure

**Pages**:
- `/` - Landing page with setup instructions
- `/dashboard` - Protected user dashboard
- `/chat` - AI chat interface (requires authentication)
- `/profile` - User profile page

**Layout**: Root layout includes theme provider, site header, and site footer using Geist fonts

### UI Components

**shadcn/ui Configuration** (`components.json`):
- Style: new-york
- Base color: neutral
- RSC enabled
- CSS variables enabled
- Icon library: lucide

### AI SDK Integration

**Chat Implementation**:
- Route handler uses `streamText` from AI SDK
- Messages are of type `UIMessage[]` (includes metadata like timestamps)
- Converted to `ModelMessage[]` for model consumption using `convertToModelMessages`
- Response streamed via `toUIMessageStreamResponse()`

**Frontend Pattern**:
- Use `useChat` hook from `@ai-sdk/react`
- Access message parts via `message.parts` array
- Parts can include: text, tool calls, and other structured data

### Styling Guidelines

- Avoid using custom colors unless very specifically instructed to do so
- Stick to standard Tailwind and shadcn colors, styles and tokens
- Use CSS variables for theming (configured in `globals.css`)

### Development Workflow

1. Make code changes
2. **Always run both `npm run lint` and `npm run typecheck` after completing changes**
3. Fix any errors or warnings before considering the task complete
4. For database schema changes: modify `src/lib/schema.ts`, then run `npm run db:generate` and `npm run db:push`
