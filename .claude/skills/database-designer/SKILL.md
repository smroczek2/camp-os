---
name: database-designer
description: Specialized in designing database schemas with Drizzle ORM and PostgreSQL. Use when adding new tables, defining relationships, or modifying the database structure. Ensures proper foreign keys, timestamps, and data integrity.
---

# Database Designer

Expert in designing and implementing database schemas using Drizzle ORM with PostgreSQL.

## When to Activate

Use this skill when:
- Adding new tables to the database
- Defining relationships between entities
- Modifying existing schema
- Planning data models for features
- Setting up foreign keys and constraints

## Core Responsibilities

1. **Design database schemas** that follow project conventions
2. **Define proper relationships** with foreign keys
3. **Ensure data integrity** with constraints
4. **Include necessary timestamps** for audit trails
5. **Generate and apply migrations** correctly

## Schema Patterns

### User-Specific Data Table

For data that belongs to a user (tasks, notes, projects, etc.):

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const tasks = pgTable("tasks", {
  // Primary key (always UUID)
  id: uuid("id").defaultRandom().primaryKey(),

  // Foreign key to user (CASCADE DELETE)
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),

  // Your custom fields
  title: text("title").notNull(),
  description: text("description"), // Nullable
  completed: boolean("completed").default(false).notNull(),

  // Timestamps (ALWAYS include)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Key Points:**
- UUID primary keys (consistent with existing schema)
- `userId` with CASCADE DELETE (data deleted when user deleted)
- Include `createdAt` and `updatedAt` timestamps
- Use `.notNull()` for required fields
- Use `.default()` for fields with default values

### Shared/Public Data Table

For data not tied to specific users (categories, tags, etc.):

```typescript
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Many-to-Many Relationship

For linking two entities:

```typescript
export const taskTags = pgTable("task_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  tagId: uuid("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Complete Example: Blog System

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { user } from "./schema";

// Blog posts table
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),

  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),

  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments table
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),

  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),

  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),

  content: text("content").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tags table
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Post-Tag relationship (many-to-many)
export const postTags = pgTable("post_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  tagId: uuid("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Data Types Reference

| Type | Use Case | Example |
|------|----------|---------|
| `uuid` | Primary keys, foreign keys | User IDs, record IDs |
| `text` | Unlimited length strings | Content, descriptions |
| `varchar(n)` | Fixed max length | Slugs (varchar(100)) |
| `integer` | Whole numbers | Counts, quantities |
| `boolean` | True/false values | isPublished, isActive |
| `timestamp` | Date & time | createdAt, publishedAt |
| `date` | Date only | Birthday, dueDate |
| `jsonb` | Structured data | Preferences, metadata |

### JSONB Example

```typescript
import { jsonb } from "drizzle-orm/pg-core";

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  preferences: jsonb("preferences").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## Migration Workflow

### Development (Fast Iteration)

```bash
# After modifying src/lib/schema.ts
npm run db:push
```

This pushes changes directly without creating migration files. **Use during development.**

### Production (With Migration Files)

```bash
# Generate migration file
npm run db:generate

# Review the generated SQL in drizzle/ directory

# Apply migration
npm run db:migrate
```

**Use for production deployments.**

### Verify Changes

```bash
# Open Drizzle Studio to inspect database
npm run db:studio
```

## Schema Design Checklist

When adding a new table, ensure:

✓ UUID primary key: `uuid("id").defaultRandom().primaryKey()`
✓ Foreign keys with CASCADE: `references(() => user.id, { onDelete: "cascade" })`
✓ Timestamps: `createdAt` and `updatedAt`
✓ NOT NULL for required fields: `.notNull()`
✓ Default values where appropriate: `.default(value)`
✓ Unique constraints for unique data: `.unique()`
✓ Export the table: `export const tableName = ...`

## Common Imports

```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  varchar,
  date,
} from "drizzle-orm/pg-core";
import { user } from "./schema"; // Import existing tables
```

## Workflow

1. **Understand the data model** - What entities and relationships?
2. **Add to `src/lib/schema.ts`**
   - Define table structure
   - Add foreign keys with CASCADE
   - Include timestamps
   - Export the table
3. **Push changes**:
   - Development: `npm run db:push`
   - Production: `npm run db:generate` → `npm run db:migrate`
4. **Verify in Drizzle Studio**: `npm run db:studio`
5. **Create TypeScript types** (optional):
   ```typescript
   import { InferSelectModel } from "drizzle-orm";
   export type Task = InferSelectModel<typeof tasks>;
   ```
6. **Build API routes** to interact with the new table

## Common Mistakes

❌ **Forgetting CASCADE DELETE**
```typescript
// Wrong - orphaned records if user deleted
userId: uuid("user_id").references(() => user.id).notNull(),

// Correct
userId: uuid("user_id")
  .references(() => user.id, { onDelete: "cascade" })
  .notNull(),
```

❌ **Missing timestamps**
```typescript
// Wrong - no audit trail
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
});

// Correct
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

❌ **Using serial instead of UUID**
```typescript
// Wrong - inconsistent with existing schema
id: serial("id").primaryKey(),

// Correct
id: uuid("id").defaultRandom().primaryKey(),
```

❌ **Not exporting the table**
```typescript
// Wrong
const tasks = pgTable(/* ... */);

// Correct
export const tasks = pgTable(/* ... */);
```

## Relationship Types

### One-to-Many

```typescript
// One user has many tasks
export const tasks = pgTable("tasks", {
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
});
```

### Many-to-Many

```typescript
// Posts can have many tags, tags can have many posts
export const postTags = pgTable("post_tags", {
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  tagId: uuid("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
});
```

### One-to-One

```typescript
// One user has one settings record
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull()
    .unique(), // Ensures one-to-one
});
```

## Querying Examples

After creating tables, here's how to query them:

```typescript
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

// Get user's tasks
const userTasks = await db
  .select()
  .from(tasks)
  .where(eq(tasks.userId, session.user.id))
  .orderBy(desc(tasks.createdAt));

// Insert
const [newTask] = await db
  .insert(tasks)
  .values({ userId: session.user.id, title: "Task" })
  .returning();

// Update
const [updated] = await db
  .update(tasks)
  .set({ title: "Updated", updatedAt: new Date() })
  .where(
    and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id)
    )
  )
  .returning();

// Delete
await db
  .delete(tasks)
  .where(
    and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id)
    )
  );
```

## Remember

- **Consistency** - Follow existing schema patterns
- **Relationships** - Always use CASCADE DELETE for user data
- **Timestamps** - Include createdAt and updatedAt
- **Types** - Use UUIDs for IDs
- **Validation** - NOT NULL for required, defaults where appropriate
- **Migrations** - Use db:push for dev, db:generate for prod

This skill ensures database schemas are well-designed, maintainable, and follow PostgreSQL and Drizzle ORM best practices.
