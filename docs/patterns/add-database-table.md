# Pattern: Adding a Database Table

How to add a new table to the database schema.

## When to Use

- Adding a new entity to your application (tasks, notes, projects, etc.)
- Storing user-specific data
- Creating relationships between entities

## Steps

### 1. Define Schema in `src/lib/schema.ts`

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { user } from "./schema"; // Import existing tables if needed

export const tasks = pgTable("tasks", {
  // Primary key (always use UUID)
  id: uuid("id").defaultRandom().primaryKey(),

  // Foreign key to user (for user-specific data)
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),

  // Your custom fields
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),

  // Timestamps (always include these)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 2. Export the Table

Make sure the table is exported from `schema.ts`:
```typescript
export const tasks = pgTable(/* ... */);
```

### 3. Push Schema Changes

**For Development:**
```bash
npm run db:push
```

This pushes changes directly without creating migration files (faster for iteration).

**For Production:**
```bash
npm run db:generate  # Creates migration file
npm run db:migrate   # Applies migration
```

### 4. Verify in Drizzle Studio

```bash
npm run db:studio
```

Open the browser, verify your table exists with correct columns.

### 5. Create TypeScript Type (Optional)

```typescript
// types.ts or at top of your component file
import { tasks } from "@/lib/schema";
import { InferSelectModel } from "drizzle-orm";

export type Task = InferSelectModel<typeof tasks>;
```

## Common Patterns

### User-Specific Data

Always include `userId` with CASCADE DELETE:
```typescript
userId: uuid("user_id")
  .references(() => user.id, { onDelete: "cascade" })
  .notNull(),
```

### Timestamps

Always include `createdAt` and `updatedAt`:
```typescript
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().notNull(),
```

### Boolean Fields

Use `.default()` and `.notNull()` for clarity:
```typescript
isPublished: boolean("is_published").default(false).notNull(),
```

### Optional Text Fields

Use `.text()` without `.notNull()`:
```typescript
description: text("description"), // Can be null
notes: text("notes"), // Can be null
```

### JSON Fields

For structured data:
```typescript
import { jsonb } from "drizzle-orm/pg-core";

metadata: jsonb("metadata").default({}).notNull(),
preferences: jsonb("preferences"),
```

## Complete Example: Blog Posts Table

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { user } from "./schema";

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
```

## Common Mistakes

❌ **Forgetting CASCADE DELETE**
```typescript
// Wrong - orphaned records if user deleted
userId: uuid("user_id").references(() => user.id).notNull(),
```

❌ **Not including timestamps**
```typescript
// Wrong - no audit trail
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  // Missing createdAt, updatedAt
});
```

❌ **Using serial instead of UUID**
```typescript
// Wrong - inconsistent with existing schema
id: serial("id").primaryKey(),
```

❌ **Not exporting the table**
```typescript
// Wrong - can't import in other files
const tasks = pgTable(/* ... */);
// Missing: export const tasks = ...
```

## Next Steps

After adding a table:
1. [Create API routes](./create-api-route.md) to interact with it
2. [Build UI components](./build-form.md) to display/edit data
3. Add ownership checks in queries

## See Also

- [Database Schema Documentation](../architecture/DATABASE_SCHEMA.md)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
