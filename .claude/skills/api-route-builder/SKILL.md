---
name: api-route-builder
description: Specialized in creating authenticated API routes with CRUD operations, validation, and error handling. Use when building new API endpoints for resources. Follows Next.js App Router patterns with Better Auth and Drizzle ORM.
---

# API Route Builder

Expert in building secure, type-safe API routes for Next.js App Router with authentication, validation, and database integration.

## When to Activate

Use this skill when:
- Creating new API endpoints
- Building CRUD operations for a resource
- Need to add authentication to an API route
- Implementing data validation
- Handling database operations in API routes

## Core Responsibilities

1. **Create authenticated API routes** with session validation
2. **Implement CRUD operations** (Create, Read, Update, Delete)
3. **Add input validation** using Zod schemas
4. **Handle errors properly** with appropriate status codes
5. **Ensure security** with userId filtering and ownership checks

## API Route Structure

### List & Create Pattern

**File**: `src/app/api/[resource]/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { yourTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
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

    // Validate
    if (!body.title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
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

### Single Resource Pattern

**File**: `src/app/api/[resource]/[id]/route.ts`

```typescript
import { and } from "drizzle-orm";

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
          eq(yourTable.userId, session.user.id) // CRITICAL
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

## Zod Validation Pattern

```typescript
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = schema.parse(body);

    const [item] = await db
      .insert(yourTable)
      .values({ userId: session.user.id, ...validated })
      .returning();

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

## Security Checklist

When building API routes, ALWAYS:

✓ Check session first (auth.api.getSession)
✓ Return 401 if not authenticated
✓ Filter queries by session.user.id
✓ Verify ownership with and(eq(id), eq(userId))
✓ Validate all input
✓ Use try/catch for error handling
✓ Log errors server-side
✓ Return user-friendly error messages
✓ Use appropriate HTTP status codes

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Common Imports

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { yourTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod"; // If using validation
```

## Workflow

1. **Understand the resource** - What data is being managed?
2. **Check schema exists** - Ensure table is defined in src/lib/schema.ts
3. **Create route files**:
   - `src/app/api/[resource]/route.ts` for list & create
   - `src/app/api/[resource]/[id]/route.ts` for get, update, delete
4. **Add authentication** to all routes
5. **Filter by userId** for user-specific data
6. **Add validation** with Zod schemas
7. **Handle errors** with try/catch
8. **Test endpoints** with curl or client

## Testing

```bash
# GET
curl http://localhost:3000/api/tasks

# POST
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task"}'

# PUT
curl -X PUT http://localhost:3000/api/tasks/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated"}'

# DELETE
curl -X DELETE http://localhost:3000/api/tasks/abc-123
```

## Anti-Patterns (Never Do These)

❌ Skip authentication checks
❌ Query without filtering by userId
❌ Update/delete without ownership verification
❌ Return raw error messages to users
❌ Hardcode values instead of using env vars
❌ Trust client-side input without validation
❌ Use GET for mutations

## Remember

- **Security first** - Always authenticate and authorize
- **User isolation** - Filter everything by userId
- **Validate input** - Never trust client data
- **Handle errors** - Try/catch and appropriate status codes
- **Be consistent** - Follow existing patterns in the codebase

This skill ensures API routes are secure, maintainable, and follow best practices from day one.
