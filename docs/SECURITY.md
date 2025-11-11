# Security Best Practices

This document outlines security best practices for this application.

## Authentication & Authorization

### Session Management

✓ **DO**:
- Check session on every protected route (pages and API)
- Use HTTP-only cookies for session tokens (Better Auth handles this)
- Validate session server-side, never trust client-side auth state
- Implement session expiration (configured in Better Auth)
- Clear sessions on sign-out

✗ **DON'T**:
- Store sensitive data in client-side storage (localStorage, cookies without httpOnly)
- Trust auth tokens sent in request body or query params
- Allow session tokens to be accessed by JavaScript

**Example - Protected Server Page:**
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/");
```

**Example - Protected API Route:**
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

### User Data Access

✓ **DO**:
- Filter ALL database queries by `session.user.id` for user-specific data
- Verify ownership before updates/deletes
- Return 404 for both "not found" and "not authorized" (don't leak info)

✗ **DON'T**:
- Query database without userId filter for user-specific data
- Trust user IDs from request body or query params
- Return different errors for "doesn't exist" vs "you don't own this"

**Example - Secure Query:**
```typescript
const items = await db
  .select()
  .from(tasks)
  .where(eq(tasks.userId, session.user.id)); // ALWAYS filter by userId
```

**Example - Secure Update:**
```typescript
const [updated] = await db
  .update(tasks)
  .set({ title: "New Title" })
  .where(
    and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id) // Verify ownership
    )
  )
  .returning();

if (!updated) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

---

## Input Validation

### Server-Side Validation

✓ **DO**:
- Validate ALL user input on the server
- Use Zod schemas for type-safe validation
- Sanitize input before database operations
- Return clear, user-friendly error messages
- Trim strings, handle edge cases

✗ **DON'T**:
- Trust client-side validation alone
- Accept arbitrary JSON without validation
- Use unsanitized input in database queries
- Return raw validation errors to users

**Example:**
```typescript
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
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
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
```

---

## Database Security

### SQL Injection Prevention

✓ **DO**:
- Use Drizzle ORM for all queries (prevents SQL injection)
- Use parameterized queries via Drizzle
- Validate and sanitize input before queries

✗ **DON'T**:
- Concatenate user input into SQL strings
- Use raw SQL with unvalidated input
- Trust any data coming from the client

**Safe (Drizzle ORM):**
```typescript
await db.select().from(tasks).where(eq(tasks.id, userProvidedId));
```

**Unsafe (Never do this):**
```typescript
await db.execute(`SELECT * FROM tasks WHERE id = '${userProvidedId}'`);
```

### Data Isolation

✓ **DO**:
- Use foreign keys with CASCADE DELETE
- Filter queries by userId
- Implement row-level security in application logic

**Example Schema:**
```typescript
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
});
```

---

## API Security

### Rate Limiting

⚠️ **RECOMMENDED**: Implement rate limiting to prevent abuse

**Vercel Deployment** (built-in protection):
- Automatic DDoS protection
- Rate limiting at edge level

**Manual Implementation** (if needed):
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

### CORS

✓ **DO**:
- Set appropriate CORS headers
- Whitelist allowed origins in production
- Use credentials: true only when necessary

**Example (Next.js middleware):**
```typescript
const allowedOrigins = process.env.NODE_ENV === "production"
  ? ["https://yourdomain.com"]
  : ["http://localhost:3000"];
```

### CSRF Protection

✓ **BUILT-IN**: Next.js provides CSRF protection for API routes

✓ **DO**:
- Use POST, PUT, DELETE for state-changing operations
- Never use GET for mutations
- Verify session on all mutations

---

## Environment Variables

### Secrets Management

✓ **DO**:
- Use `.env.local` for local development (gitignored)
- Use Vercel Environment Variables for production
- Rotate secrets regularly
- Use different secrets for dev/staging/prod
- Prefix public vars with `NEXT_PUBLIC_`

✗ **DON'T**:
- Commit `.env` files to git
- Use the same secrets across environments
- Share secrets in plain text (Slack, email, etc.)
- Expose secrets to client-side code

**Example - `.env.local`:**
```bash
# Database
POSTGRES_URL="postgresql://..."

# Auth (NEVER commit these)
BETTER_AUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI (NEVER commit this)
OPENAI_API_KEY="sk-..."

# Public (safe to expose)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Checking for Secrets

✓ **DO**: Add pre-commit hooks to check for secrets

```bash
# .git/hooks/pre-commit
#!/bin/bash
if grep -r "sk-" --include="*.ts" --include="*.js" .; then
  echo "ERROR: Possible API key found in code"
  exit 1
fi
```

---

## Cross-Site Scripting (XSS)

### React Protection

✓ **BUILT-IN**: React escapes values by default

✓ **DO**:
- Use JSX for all dynamic content
- Sanitize HTML if using `dangerouslySetInnerHTML`
- Use Content Security Policy headers

✗ **DON'T**:
- Use `dangerouslySetInnerHTML` with user input
- Render unsanitized markdown from users
- Trust data from external APIs

**Safe:**
```typescript
<div>{userInput}</div>  // React escapes automatically
```

**Unsafe:**
```typescript
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // XSS risk!
```

**Safe markdown rendering:**
```typescript
import ReactMarkdown from "react-markdown";

<ReactMarkdown>{userMarkdown}</ReactMarkdown>  // Sanitized by default
```

---

## Error Handling

### Secure Error Messages

✓ **DO**:
- Log detailed errors server-side
- Return generic errors to users
- Use appropriate HTTP status codes
- Monitor errors with tracking tools

✗ **DON'T**:
- Expose stack traces to users
- Return database errors to users
- Reveal internal system details
- Log sensitive data (passwords, tokens)

**Example:**
```typescript
try {
  // Database operation
} catch (error) {
  console.error("Database error:", error); // Detailed log server-side
  return NextResponse.json(
    { error: "Failed to process request" }, // Generic message to user
    { status: 500 }
  );
}
```

---

## File Uploads (When Added)

### Validation

✓ **DO**:
- Validate file types (MIME type AND extension)
- Limit file sizes
- Scan for malware
- Use signed URLs for access
- Store files outside web root
- Generate random filenames

✗ **DON'T**:
- Trust client-provided MIME types
- Allow unrestricted file uploads
- Execute uploaded files
- Use user-provided filenames directly

**Example with Vercel Blob:**
```typescript
import { put } from "@vercel/blob";

const blob = await put(fileName, file, {
  access: "public",
  addRandomSuffix: true,  // Prevents filename collisions
});
```

---

## Dependencies

### Package Security

✓ **DO**:
- Run `npm audit` regularly
- Keep dependencies up to date
- Review dependency licenses
- Use `npm audit fix` for vulnerabilities
- Lock versions with package-lock.json

✗ **DON'T**:
- Install packages from untrusted sources
- Use outdated, unmaintained packages
- Ignore security warnings

**Commands:**
```bash
npm audit                 # Check for vulnerabilities
npm audit fix             # Fix vulnerabilities automatically
npm outdated              # Check for outdated packages
```

---

## Production Checklist

Before deploying to production:

### Configuration
- [ ] All secrets in environment variables (not in code)
- [ ] Different secrets for production than dev/staging
- [ ] HTTPS enabled (Vercel handles this automatically)
- [ ] Database backups configured
- [ ] Error tracking configured (Sentry, etc.)

### Security
- [ ] Rate limiting enabled
- [ ] CORS configured for production domains
- [ ] Content Security Policy headers set
- [ ] All API routes have authentication checks
- [ ] All queries filtered by userId
- [ ] Input validation on all endpoints

### Code Quality
- [ ] No console.logs with sensitive data
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings resolved
- [ ] No TODO comments with security implications

### Testing
- [ ] Test authentication flows
- [ ] Test authorization (user can't access other users' data)
- [ ] Test error handling
- [ ] Test with invalid/malicious input

---

## Incident Response

If a security issue is discovered:

1. **Assess Impact**: What data is affected? How many users?
2. **Contain**: Disable affected features if necessary
3. **Fix**: Patch the vulnerability
4. **Deploy**: Push fix to production immediately
5. **Notify**: Inform affected users if data was compromised
6. **Document**: Write post-mortem, update security practices

---

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/authentication)
- [Better Auth Security](https://better-auth.com/docs/concepts/security)
- [Vercel Security](https://vercel.com/docs/security/security-overview)

---

**Remember**: Security is not a one-time task. Continuously review, test, and improve security practices as the application evolves.
