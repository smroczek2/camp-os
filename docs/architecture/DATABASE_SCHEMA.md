# Database Schema Documentation

This document provides comprehensive documentation of the PostgreSQL database schema used in this starter kit.

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────┐
│                  user                    │
├─────────────────────────────────────────┤
│ id (uuid) PK                            │
│ email (text) UNIQUE NOT NULL            │
│ emailVerified (timestamp)               │
│ name (text)                             │
│ image (text)                            │
│ createdAt (timestamp) NOT NULL          │
│ updatedAt (timestamp) NOT NULL          │
└─────────────────────────────────────────┘
         │
         │ 1:N (CASCADE DELETE)
         │
         ├──────────────────────────────────────┐
         │                                       │
         ▼                                       ▼
┌─────────────────────────┐      ┌──────────────────────────┐
│       session           │      │        account           │
├─────────────────────────┤      ├──────────────────────────┤
│ id (uuid) PK            │      │ id (uuid) PK             │
│ expiresAt (timestamp)   │      │ accountId (text) NOT NULL│
│ token (text) UNIQUE     │      │ providerId (text)        │
│ createdAt (timestamp)   │      │ userId (uuid) FK ────────┼──┐
│ updatedAt (timestamp)   │      │ accessToken (text)       │  │
│ ipAddress (text)        │      │ refreshToken (text)      │  │
│ userAgent (text)        │      │ idToken (text)           │  │
│ userId (uuid) FK ───────┼──┐   │ accessTokenExpiresAt...  │  │
└─────────────────────────┘  │   │ scope (text)             │  │
                             │   │ password (text)          │  │
                             │   │ createdAt (timestamp)    │  │
                             │   │ updatedAt (timestamp)    │  │
                             │   └──────────────────────────┘  │
                             │                                 │
                             │   CASCADE DELETE                │
                             └─────────────────────────────────┘

┌──────────────────────────┐
│     verification         │
├──────────────────────────┤
│ id (uuid) PK             │
│ identifier (text)        │
│ value (text) NOT NULL    │
│ expiresAt (timestamp)    │
│ createdAt (timestamp)    │
│ updatedAt (timestamp)    │
└──────────────────────────┘
```

## Tables

### user

**Purpose**: Stores user account information

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique user identifier (auto-generated) |
| `email` | text | UNIQUE, NOT NULL | User's email address (used for login) |
| `emailVerified` | timestamp | NULL | When the email was verified (null if unverified) |
| `name` | text | NULL | User's display name |
| `image` | text | NULL | URL to user's profile image |
| `createdAt` | timestamp | NOT NULL, DEFAULT NOW | Account creation timestamp |
| `updatedAt` | timestamp | NOT NULL, DEFAULT NOW | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `email`

**Relationships:**
- One-to-many with `session` (CASCADE DELETE)
- One-to-many with `account` (CASCADE DELETE)

**Example Query:**
```typescript
// Get user by email
const user = await db
  .select()
  .from(user)
  .where(eq(user.email, "user@example.com"))
  .limit(1);

// Get user with all sessions
const userWithSessions = await db
  .select()
  .from(user)
  .leftJoin(session, eq(session.userId, user.id))
  .where(eq(user.id, userId));
```

---

### session

**Purpose**: Stores active user sessions for authentication

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique session identifier |
| `expiresAt` | timestamp | NOT NULL | When this session expires |
| `token` | text | UNIQUE, NOT NULL | Session token (stored in HTTP-only cookie) |
| `createdAt` | timestamp | NOT NULL, DEFAULT NOW | Session creation time |
| `updatedAt` | timestamp | NOT NULL, DEFAULT NOW | Last update time |
| `ipAddress` | text | NULL | IP address where session was created |
| `userAgent` | text | NULL | Browser user agent string |
| `userId` | uuid | FK → user.id, NOT NULL | Owner of this session |

**Foreign Keys:**
- `userId` references `user(id)` ON DELETE CASCADE

**Indexes:**
- Primary key on `id`
- Unique index on `token`
- Index on `userId` for fast lookups

**Behavior:**
- When a user is deleted, all their sessions are automatically deleted (CASCADE)
- Sessions are validated on every authenticated request
- Expired sessions should be cleaned up periodically

**Example Query:**
```typescript
// Get active session by token
const activeSession = await db
  .select()
  .from(session)
  .where(
    and(
      eq(session.token, sessionToken),
      gt(session.expiresAt, new Date())
    )
  )
  .limit(1);

// Delete expired sessions
await db
  .delete(session)
  .where(lt(session.expiresAt, new Date()));
```

---

### account

**Purpose**: Stores OAuth provider accounts linked to users

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique account identifier |
| `accountId` | text | NOT NULL | Provider's user ID |
| `providerId` | text | NOT NULL | OAuth provider name (e.g., "google") |
| `userId` | uuid | FK → user.id, NOT NULL | User this account belongs to |
| `accessToken` | text | NULL | OAuth access token |
| `refreshToken` | text | NULL | OAuth refresh token |
| `idToken` | text | NULL | OAuth ID token (JWT) |
| `accessTokenExpiresAt` | timestamp | NULL | When access token expires |
| `refreshTokenExpiresAt` | timestamp | NULL | When refresh token expires |
| `scope` | text | NULL | OAuth scopes granted |
| `password` | text | NULL | Hashed password (if using email/password) |
| `createdAt` | timestamp | NOT NULL, DEFAULT NOW | Account link creation time |
| `updatedAt` | timestamp | NOT NULL, DEFAULT NOW | Last update time |

**Foreign Keys:**
- `userId` references `user(id)` ON DELETE CASCADE

**Indexes:**
- Primary key on `id`
- Index on `userId`
- Composite index on `(providerId, accountId)` for fast provider lookups

**Behavior:**
- When a user is deleted, all linked accounts are deleted (CASCADE)
- Multiple providers can be linked to one user
- Tokens are encrypted/hashed in production

**Example Query:**
```typescript
// Get all OAuth accounts for a user
const accounts = await db
  .select()
  .from(account)
  .where(eq(account.userId, userId));

// Find user by OAuth provider account
const userAccount = await db
  .select()
  .from(account)
  .innerJoin(user, eq(user.id, account.userId))
  .where(
    and(
      eq(account.providerId, "google"),
      eq(account.accountId, googleUserId)
    )
  )
  .limit(1);
```

---

### verification

**Purpose**: Stores email verification tokens and other verification codes

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique verification identifier |
| `identifier` | text | NOT NULL | Email or phone to verify |
| `value` | text | NOT NULL | Verification token/code |
| `expiresAt` | timestamp | NOT NULL | When this code expires |
| `createdAt` | timestamp | NOT NULL, DEFAULT NOW | Code creation time |
| `updatedAt` | timestamp | NOT NULL, DEFAULT NOW | Last update time |

**Indexes:**
- Primary key on `id`
- Index on `identifier` for email lookups
- Index on `value` for code validation

**Behavior:**
- Tokens expire after a set time (typically 15-60 minutes)
- Should be cleaned up after use or expiration
- Used for email verification, password reset, etc.

**Example Query:**
```typescript
// Validate verification code
const verification = await db
  .select()
  .from(verification)
  .where(
    and(
      eq(verification.identifier, email),
      eq(verification.value, code),
      gt(verification.expiresAt, new Date())
    )
  )
  .limit(1);

// Clean up expired verifications
await db
  .delete(verification)
  .where(lt(verification.expiresAt, new Date()));
```

---

## Adding New Tables

When adding new tables for features, follow these patterns:

### User-Specific Data Pattern

For data that belongs to a specific user (tasks, notes, projects, etc.):

```typescript
// In src/lib/schema.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const yourTable = pgTable("your_table_name", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  // Your custom columns
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Key Points:**
- Always include `userId` with CASCADE DELETE
- Always include `createdAt` and `updatedAt` timestamps
- Use UUID for `id` (consistent with existing schema)
- Use `.notNull()` for required fields
- Use `.default()` for fields with default values

### Shared/Public Data Pattern

For data not tied to a specific user (categories, tags, public content):

```typescript
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Many-to-Many Relationship Pattern

For linking two entities (user_tags, project_members, etc.):

```typescript
export const userTags = pgTable("user_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  tagId: uuid("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Optional: Add unique constraint for the combination
// .unique(["userId", "tagId"])
```

---

## Common Data Types

### When to use each type:

| Type | Use Case | Example |
|------|----------|---------|
| `uuid` | Primary keys, foreign keys | User IDs, session IDs |
| `text` | Strings of any length | Descriptions, content, URLs |
| `varchar(n)` | Short strings with max length | Slugs, codes, short names |
| `integer` | Whole numbers | Counts, quantities |
| `boolean` | True/false values | `isPublished`, `isActive` |
| `timestamp` | Date and time | `createdAt`, `expiresAt` |
| `date` | Date only (no time) | Birthdays, due dates |
| `json` | Structured data | Preferences, metadata |
| `jsonb` | Structured data (better performance) | Same as json but faster queries |

### JSON vs JSONB

Use `jsonb` for:
- Preferences/settings objects
- Metadata that you might query
- Flexible schema data

```typescript
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  preferences: jsonb("preferences").notNull().default({}),
});
```

---

## Database Migrations

### Development Workflow

```bash
# After changing src/lib/schema.ts:
npm run db:push      # Push changes directly (no migration file)
```

**Use `db:push` when:**
- Developing locally
- Rapid iteration
- Schema is still changing

### Production Workflow

```bash
# After finalizing schema changes:
npm run db:generate  # Generate migration SQL file
npm run db:migrate   # Apply migration to database
```

**Use `db:generate` + `db:migrate` when:**
- Deploying to production
- Want migration history
- Need to review SQL before applying

### Viewing Database

```bash
npm run db:studio    # Opens Drizzle Studio in browser
```

---

## Query Patterns

### Safe User-Specific Queries

**ALWAYS filter by userId for user-specific data:**

```typescript
// ✓ CORRECT - Filters by user
const userTasks = await db
  .select()
  .from(tasks)
  .where(eq(tasks.userId, session.user.id));

// ✗ WRONG - Returns all users' data (security vulnerability!)
const allTasks = await db.select().from(tasks);
```

### Update with Ownership Check

```typescript
// ✓ CORRECT - Verifies ownership before updating
const [updated] = await db
  .update(tasks)
  .set({ title: "New Title" })
  .where(
    and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id) // Ownership check
    )
  )
  .returning();

if (!updated) {
  // Either doesn't exist or user doesn't own it
  throw new Error("Not found or unauthorized");
}
```

### Delete with Ownership Check

```typescript
// ✓ CORRECT - Verifies ownership before deleting
await db
  .delete(tasks)
  .where(
    and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id)
    )
  );
```

### Joins

```typescript
// Get tasks with user information
const tasksWithUsers = await db
  .select({
    task: tasks,
    user: user,
  })
  .from(tasks)
  .innerJoin(user, eq(user.id, tasks.userId))
  .where(eq(tasks.userId, session.user.id));
```

---

## Performance Considerations

### Indexes

The existing schema has indexes on:
- Primary keys (automatic)
- Unique columns (`email`, `token`)
- Foreign keys (`userId` in session and account)

**Add indexes for:**
- Frequently queried columns
- Foreign keys
- Columns used in WHERE clauses
- Columns used in ORDER BY

### Connection Pooling

The `src/lib/db.ts` uses postgres.js with connection pooling:
```typescript
import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL!;
const sql = postgres(connectionString, { max: 10 }); // Pool size
```

### Query Optimization Tips

1. **Use .limit()** for pagination
2. **Select only needed columns** with `.select({ ... })`
3. **Avoid N+1 queries** - use joins instead of separate queries
4. **Use indexes** on frequently queried columns
5. **Batch operations** when possible

---

## Data Integrity

### Constraints

All foreign keys use **CASCADE DELETE** for data integrity:
- Deleting a user deletes all sessions, accounts
- Prevents orphaned records
- Automatic cleanup

### Validation

**Database level:**
- NOT NULL constraints
- UNIQUE constraints
- Foreign key constraints

**Application level:**
- Zod schemas for input validation
- TypeScript types for compile-time safety
- Drizzle ORM for runtime type safety

---

## Backup & Recovery

### Recommended Practices

1. **Automated Backups** (Vercel Postgres includes this)
2. **Point-in-time Recovery** for production
3. **Regular Testing** of backup restoration
4. **Separate Staging Database** for testing migrations

---

## Security Best Practices

### DO

✓ Always filter by `userId` for user-specific data
✓ Use parameterized queries (Drizzle handles this)
✓ Validate input before database operations
✓ Encrypt sensitive data (tokens, passwords)
✓ Use environment variables for connection strings
✓ Enable SSL for database connections in production

### DON'T

✗ Never store plain-text passwords
✗ Never expose raw database errors to users
✗ Never trust client-side validation alone
✗ Never commit `.env` files
✗ Never use SELECT * in production APIs
✗ Never skip ownership checks on updates/deletes

---

This schema is designed to be **simple, secure, and scalable** - providing a solid foundation for building features quickly without sacrificing data integrity or security.
