# API Reference

Complete reference for all API routes in this application.

## Base URL

Development: `http://localhost:3000/api`
Production: `https://yourdomain.com/api`

## Authentication

Most endpoints require authentication via session cookie (set by Better Auth).

**Headers:**
```
Cookie: better-auth.session_token=<token>
```

**Unauthorized Response** (401):
```json
{
  "error": "Unauthorized"
}
```

---

## Auth Endpoints

### Better Auth Catch-All

**Endpoint:** `/api/auth/[...all]`

**Description:** Handles all Better Auth routes including sign-in, sign-out, callbacks, etc.

**Provider:** Better Auth

**Routes include:**
- `/api/auth/sign-in/social` - OAuth sign-in
- `/api/auth/sign-out` - Sign out
- `/api/auth/callback/google` - OAuth callback
- `/api/auth/session` - Get current session

See [Better Auth documentation](https://better-auth.com) for full API reference.

---

## Chat Endpoint

### Stream Chat Messages

**Endpoint:** `POST /api/chat`

**Description:** AI chat endpoint with streaming responses

**Authentication:** Required

**Request Body:**
```typescript
{
  messages: UIMessage[]  // Array of chat messages
}
```

**UIMessage Type:**
```typescript
interface UIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
  // ... additional UI metadata
}
```

**Response:** Streaming text response (Server-Sent Events)

**Example Request:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { id: '1', role: 'user', content: 'Hello!' }
    ]
  })
});

// Response is streamed
const reader = response.body.getReader();
```

**Using useChat Hook:**
```typescript
const { messages, sendMessage } = useChat({ api: '/api/chat' });
sendMessage({ text: 'Hello!' });
```

**Error Responses:**
- `401` - Not authenticated
- `500` - Server error (AI API failure, etc.)

---

## Diagnostics Endpoint

### System Health Check

**Endpoint:** `GET /api/diagnostics`

**Description:** Check system configuration status

**Authentication:** Not required

**Response:**
```typescript
{
  auth: {
    configured: boolean;      // Better Auth configured
    googleOAuth: boolean;     // Google OAuth credentials set
  };
  ai: {
    configured: boolean;      // OpenAI API key set
    model: string;            // Current model name
  };
  database: {
    configured: boolean;      // Database URL set
    connected: boolean;       // Can connect to DB
  };
}
```

**Example Response:**
```json
{
  "auth": {
    "configured": true,
    "googleOAuth": true
  },
  "ai": {
    "configured": true,
    "model": "gpt-4o-mini"
  },
  "database": {
    "configured": true,
    "connected": true
  }
}
```

---

## Building New API Routes

### Standard CRUD Pattern

Here's a template for creating new API routes:

```typescript
// src/app/api/[resource]/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { yourTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET - List user's resources
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
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST - Create new resource
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    if (!body.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const [item] = await db
      .insert(yourTable)
      .values({
        userId: session.user.id,
        ...body,
      })
      .returning();

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
```

### Dynamic Route Pattern

For routes with IDs:

```typescript
// src/app/api/[resource]/[id]/route.ts

// GET - Get single resource
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [item] = await db
      .select()
      .from(yourTable)
      .where(
        and(
          eq(yourTable.id, params.id),
          eq(yourTable.userId, session.user.id)
        )
      )
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// PUT - Update resource
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
      .update(yourTable)
      .set({ ...body, updatedAt: new Date() })
      .where(
        and(
          eq(yourTable.id, params.id),
          eq(yourTable.userId, session.user.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE - Delete resource
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
      .delete(yourTable)
      .where(
        and(
          eq(yourTable.id, params.id),
          eq(yourTable.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
```

---

## HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist or user doesn't own it |
| 500 | Internal Server Error | Unexpected server error |

---

## Error Response Format

All errors follow this format:

```typescript
{
  error: string;  // User-friendly error message
}
```

**Examples:**
```json
{ "error": "Unauthorized" }
{ "error": "Title is required" }
{ "error": "Not found" }
{ "error": "Failed to create resource" }
```

**Never expose:**
- Stack traces
- Database errors
- Internal server details
- Other users' data

---

## Best Practices

### Security

✓ Always check authentication
✓ Always filter by `session.user.id`
✓ Always verify ownership on updates/deletes
✓ Validate all input
✓ Return consistent error responses
✓ Log errors server-side only

### Performance

✓ Use database indexes
✓ Limit response size with `.limit()`
✓ Use pagination for large datasets
✓ Cache when appropriate
✓ Stream large responses

### Error Handling

✓ Use try/catch blocks
✓ Log errors with context
✓ Return user-friendly messages
✓ Return appropriate status codes
✓ Don't leak sensitive information

---

## Testing API Routes

### Using curl

```bash
# GET request
curl http://localhost:3000/api/diagnostics

# POST request
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"id":"1","role":"user","content":"Hello"}]}'
```

### Using fetch

```typescript
// GET
const response = await fetch('/api/resource');
const data = await response.json();

// POST
const response = await fetch('/api/resource', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Example' }),
});
const data = await response.json();

// PUT
const response = await fetch(`/api/resource/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Updated' }),
});

// DELETE
const response = await fetch(`/api/resource/${id}`, {
  method: 'DELETE',
});
```

---

This API design prioritizes **security, consistency, and developer experience** - making it easy to build features quickly while maintaining high standards for data protection and error handling.
