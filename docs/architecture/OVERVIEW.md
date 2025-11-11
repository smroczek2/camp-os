# System Architecture Overview

This document provides a comprehensive overview of the starter kit's architecture, including system layers, data flow, and component interactions.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │   Pages    │  │ Components │  │   Client Hooks        │ │
│  │ (App Router)│  │ (shadcn/ui)│  │ (useSession, useChat)│ │
│  └────────────┘  └────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    API / Route Handler Layer                 │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │  Auth API  │  │  Chat API  │  │   Resource APIs       │ │
│  │ (Better Auth)│ │ (AI Stream)│  │ (CRUD operations)    │ │
│  └────────────┘  └────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │ Auth Logic │  │  AI Logic  │  │  Data Validation      │ │
│  │ (Sessions) │  │ (OpenAI)   │  │  (Zod schemas)        │ │
│  └────────────┘  └────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │Drizzle ORM │  │ Database   │  │    Vercel Blob        │ │
│  │(postgres.js)│  │ Connection │  │  (File Storage)       │ │
│  └────────────┘  └────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│                     External Services Layer                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │ PostgreSQL │  │  OpenAI    │  │   Google OAuth        │ │
│  │  Database  │  │    API     │  │    Provider           │ │
│  └────────────┘  └────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow Examples

### 1. User Authentication Flow (Google OAuth)

```
User clicks "Sign In"
    ↓
Client: signIn.social({ provider: "google" })
    ↓
Better Auth handles OAuth redirect
    ↓
Google OAuth consent screen
    ↓
User approves
    ↓
Callback to /api/auth/callback/google
    ↓
Better Auth creates session + user in database
    ↓
Session cookie set
    ↓
User redirected to dashboard
```

### 2. Protected Page Request Flow

```
User navigates to /dashboard
    ↓
Server component renders
    ↓
auth.api.getSession({ headers: await headers() })
    ↓
Check session cookie
    ↓
Query session table in database
    ↓
If session valid → Render page with user data
If session invalid → redirect("/")
```

### 3. API Request Flow (CRUD Operation)

```
Client component makes fetch("/api/tasks", { method: "POST" })
    ↓
API Route Handler (POST /api/tasks)
    ↓
Authenticate: auth.api.getSession()
    ↓
If no session → return 401 Unauthorized
If session valid ↓
    ↓
Parse request body
    ↓
Validate input with Zod (optional but recommended)
    ↓
Database operation via Drizzle ORM
    db.insert(tasks).values({ userId: session.user.id, ... })
    ↓
Return JSON response { task: newTask }
    ↓
Client receives response
    ↓
Update UI state
```

### 4. AI Chat Flow

```
User types message in chat interface
    ↓
Client: sendMessage({ text: input })
    ↓
useChat hook sends POST /api/chat
    ↓
API Route: POST /api/chat
    ↓
Authenticate session
    ↓
Convert UIMessage[] to ModelMessage[]
    ↓
streamText({
  model: openai(process.env.OPENAI_MODEL),
  messages: convertToModelMessages(messages)
})
    ↓
OpenAI API call
    ↓
Stream response back to client via toUIMessageStreamResponse()
    ↓
useChat hook receives stream
    ↓
UI updates in real-time as tokens arrive
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend (Browser)                    │
│                                                               │
│  ┌──────────────┐         ┌───────────────────────────────┐ │
│  │   Next.js    │◄────────┤   shadcn/ui Components        │ │
│  │   App Router │         │   (Button, Card, Dialog, etc.) │ │
│  │              │         └───────────────────────────────┘ │
│  │  ┌────────┐  │                                           │
│  │  │ Pages  │  │         ┌───────────────────────────────┐ │
│  │  └────────┘  │◄────────┤   React Hooks                 │ │
│  │  ┌────────┐  │         │   (useSession, useChat)        │ │
│  │  │Components │         └───────────────────────────────┘ │
│  │  └────────┘  │                                           │
│  └──────────────┘                                           │
│         ▲ │                                                  │
│         │ │  HTTP/HTTPS                                     │
└─────────┼─┼──────────────────────────────────────────────────┘
          │ │
          │ ▼
┌─────────┼─┼──────────────────────────────────────────────────┐
│         │ │            Backend (Next.js Server)              │
│         │ │                                                  │
│  ┌──────┴─▼────────┐          ┌─────────────────────────┐   │
│  │   API Routes    │◄─────────┤   Better Auth           │   │
│  │   /api/*        │          │   (Session Management)  │   │
│  └─────────────────┘          └─────────────────────────┘   │
│         │ ▲                                                  │
│         │ │                   ┌─────────────────────────┐   │
│         │ └───────────────────┤   Vercel AI SDK         │   │
│         │                     │   (OpenAI Integration)  │   │
│         │                     └─────────────────────────┘   │
│         │                                                    │
│         ▼                     ┌─────────────────────────┐   │
│  ┌─────────────────┐         │   Drizzle ORM           │   │
│  │   Data Layer    │◄────────┤   (Type-safe queries)   │   │
│  └─────────────────┘         └─────────────────────────┘   │
│         │ ▲                                                  │
└─────────┼─┼──────────────────────────────────────────────────┘
          │ │
          │ ▼
┌─────────┼─┼──────────────────────────────────────────────────┐
│         │ │       External Services                          │
│         │ │                                                  │
│  ┌──────▼─┴────────┐    ┌──────────────┐  ┌──────────────┐ │
│  │   PostgreSQL    │    │   OpenAI     │  │ Google OAuth │ │
│  │   Database      │    │   API        │  │   Provider   │ │
│  └─────────────────┘    └──────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Key Architecture Decisions

### Server-First Architecture
- **Default to Server Components** for better performance and SEO
- **Client Components only when necessary** (interactivity, hooks)
- **API routes for all data mutations** (create, update, delete)

### Type Safety Everywhere
- **TypeScript strict mode** catches errors at compile time
- **Zod schemas** for runtime validation
- **Drizzle ORM** for type-safe database queries
- **Vercel AI SDK** with TypeScript support

### Security by Design
- **Session-based authentication** via Better Auth
- **User data isolation** - all queries filtered by userId
- **Ownership verification** on updates/deletes
- **Input validation** on all API routes
- **Environment variable configuration** for secrets

### Modern UI/UX
- **shadcn/ui component library** for consistency
- **Tailwind CSS** for styling without custom CSS
- **Mobile-first responsive design**
- **Dark mode support** via CSS variables

### Scalability Considerations
- **Edge-ready** - Can deploy to Vercel Edge
- **Streaming responses** for AI features
- **Connection pooling** via postgres.js
- **Stateless architecture** for horizontal scaling

## File Organization Principles

### Colocation
- Related files are grouped together
- Components near their usage
- API routes mirror their purpose

### Clear Separation of Concerns
- `src/lib/` - Core utilities and configurations
- `src/components/` - UI components only
- `src/app/` - Pages and API routes
- `src/hooks/` - Reusable React hooks

### Import Path Aliases
- `@/` prefix for all imports
- Consistent, predictable import paths
- Easy refactoring

## Technology Integration Points

### Better Auth ↔ Database
- Better Auth manages user, session, account, verification tables
- Custom tables reference user table with foreign keys
- Cascade delete ensures data consistency

### Vercel AI SDK ↔ OpenAI
- AI SDK provides unified interface
- Streams responses for real-time UX
- Model name configurable via environment variable

### Next.js ↔ React
- App Router for file-based routing
- React Server Components by default
- Client components for interactivity

### Drizzle ORM ↔ PostgreSQL
- Type-safe queries generated at build time
- Schema defined in TypeScript
- Migrations for production, push for development

## Performance Optimizations

### Server Components
- Reduce JavaScript bundle size
- Faster initial page loads
- Better SEO

### Streaming
- AI responses stream in real-time
- Progressive rendering
- Improved perceived performance

### Connection Pooling
- Efficient database connections
- Reduced latency
- Better resource utilization

### Edge Deployment Ready
- Can deploy to Vercel Edge Network
- Global distribution
- Reduced latency for users worldwide

## Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Vercel Platform                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │         Next.js Application                       │ │
│  │  (Serverless Functions + Edge Functions)         │ │
│  └──────────────────────────────────────────────────┘ │
│                        ▲ │                             │
│                        │ ▼                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │         Vercel Postgres                          │ │
│  │         (PostgreSQL Database)                    │ │
│  └──────────────────────────────────────────────────┘ │
│                        ▲ │                             │
│                        │ ▼                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │         Vercel Blob                              │ │
│  │         (File Storage)                           │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
                         ▲ │
                         │ ▼
┌────────────────────────────────────────────────────────┐
│              External Services                          │
│  ┌──────────────┐          ┌──────────────────────┐   │
│  │  OpenAI API  │          │   Google OAuth       │   │
│  └──────────────┘          └──────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

## Environment Configuration

| Environment | Database | Deployment | Notes |
|-------------|----------|------------|-------|
| Development | Local PostgreSQL or Vercel Postgres | `npm run dev` | Use `db:push` for schema changes |
| Staging | Vercel Postgres | Vercel Preview | Auto-deploy on PR |
| Production | Vercel Postgres | Vercel Production | Use migrations for schema changes |

## Monitoring & Observability

### Built-in
- Next.js built-in error reporting
- Vercel Analytics (optional)
- Console logging in API routes

### Recommended Additions
- Error tracking (Sentry)
- Performance monitoring (Vercel Speed Insights)
- Database monitoring (Vercel Postgres insights)
- AI usage tracking (OpenAI dashboard)

## Security Architecture

### Authentication Layer
- Session-based auth with Better Auth
- HTTP-only cookies for session tokens
- CSRF protection built into Next.js
- OAuth with Google (extensible to other providers)

### Authorization Layer
- User ID filtering on all queries
- Ownership checks on updates/deletes
- Role-based access control ready (can be extended)

### Data Protection
- Environment variables for secrets
- No sensitive data in client bundles
- Input validation on all API routes
- SQL injection prevention via Drizzle ORM

## Future Scalability Considerations

### Horizontal Scaling
- Stateless design allows multiple server instances
- Session data in database (not in-memory)
- Connection pooling supports concurrent requests

### Vertical Scaling
- Can increase database size/compute on Vercel
- Serverless functions scale automatically
- No code changes needed

### Feature Additions
- Architecture supports:
  - Real-time features (WebSockets, Server-Sent Events)
  - Background jobs (Vercel Cron, Queue systems)
  - Multi-tenancy (teams, organizations)
  - Advanced AI features (RAG, embeddings, agents)
  - File uploads (Vercel Blob already integrated)
  - Email (Resend, SendGrid integration ready)
  - Payments (Stripe integration ready)

---

This architecture is designed to be **simple, secure, and scalable** - perfect for building modern full-stack applications quickly without sacrificing quality or security.
