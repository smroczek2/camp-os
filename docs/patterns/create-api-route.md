# Pattern: Creating an API Route

How to create a new API endpoint with authentication, validation, and database access.

## When to Use

- Creating CRUD operations for a resource
- Handling form submissions
- Processing data server-side
- Integrating with external APIs

## File Structure

```
src/app/api/
├── [resource]/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (single), PUT (update), DELETE
```

## Basic CRUD Template

### List & Create (`src/app/api/tasks/route.ts`)

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tasks - List user's tasks
export async function GET(request: NextRequest) {
  // 1. Authenticate
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Query database (filtered by user)
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, session.user.id));

    // 3. Return data
    return NextResponse.json({ tasks: userTasks });
  } catch (error) {
    // 4. Handle errors
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
    // 1. Parse request body
    const body = await request.json();
    const { title, description } = body;

    // 2. Validate input
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // 3. Insert into database
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
      })
      .returning();

    // 4. Return created resource
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

### Single Resource Operations (`src/app/api/tasks/[id]/route.ts`)

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tasks/[id] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [task] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, params.id),
          eq(tasks.userId, session.user.id) // Ownership check
        )
      )
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
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
        updatedAt: new Date(), // Update timestamp
      })
      .where(
        and(
          eq(tasks.id, params.id),
          eq(tasks.userId, session.user.id) // CRITICAL: Ownership check
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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

## With Zod Validation

```typescript
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  completed: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate with Zod
    const validated = taskSchema.parse(body);

    const [task] = await db
      .insert(tasks)
      .values({
        userId: session.user.id,
        ...validated,
      })
      .returning();

    return NextResponse.json({ task }, { status: 201 });
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

✓ **Authentication**: Check session first
✓ **Authorization**: Filter by userId
✓ **Ownership**: Verify on updates/deletes
✓ **Validation**: Validate input
✓ **Error Handling**: Try/catch blocks
✓ **Logging**: Log errors server-side
✓ **Status Codes**: Use appropriate codes

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, DELETE |
| 201 | Resource created (POST) |
| 400 | Invalid input |
| 401 | Not authenticated |
| 404 | Resource not found |
| 500 | Server error |

## Common Mistakes

❌ **No authentication check**
```typescript
export async function GET() {
  // Missing authentication!
  const tasks = await db.select().from(tasks);
  return NextResponse.json({ tasks });
}
```

❌ **No userId filter**
```typescript
// Returns ALL users' tasks (security vulnerability!)
const tasks = await db.select().from(tasks);
```

❌ **No ownership check on update**
```typescript
// Any user can update any task!
await db.update(tasks).set({ title }).where(eq(tasks.id, id));
```

❌ **Not handling errors**
```typescript
// No try/catch - errors crash the server
const task = await db.insert(tasks).values(data).returning();
```

## Testing Your API Route

### Using curl

```bash
# GET
curl http://localhost:3000/api/tasks

# POST
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task"}'

# PUT
curl -X PUT http://localhost:3000/api/tasks/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated"}'

# DELETE
curl -X DELETE http://localhost:3000/api/tasks/abc-123
```

### Using fetch in client component

```typescript
// GET
const response = await fetch('/api/tasks');
const { tasks } = await response.json();

// POST
const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'New Task' }),
});
const { task } = await response.json();
```

## Next Steps

1. [Build UI to interact with API](./build-form.md)
2. Add pagination for large datasets
3. Add filtering and sorting
4. Add rate limiting for production

## See Also

- [API Reference](../architecture/API_REFERENCE.md)
- [Security Best Practices](../SECURITY.md)
