# Troubleshooting Guide

Common issues and their solutions.

## Table of Contents

- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Build & Development Issues](#build--development-issues)
- [AI Integration Issues](#ai-integration-issues)
- [Deployment Issues](#deployment-issues)

---

## Database Issues

### Connection Refused / Can't Connect to Database

**Symptom:** Error messages like "Connection refused" or "ECONNREFUSED"

**Causes:**
1. PostgreSQL not running
2. Wrong connection string
3. Database doesn't exist
4. Network/firewall issues

**Solutions:**

1. **Check POSTGRES_URL:**
   ```bash
   # Verify .env.local has correct URL
   cat .env.local | grep POSTGRES_URL
   ```

2. **Verify database is running:**
   ```bash
   # For local PostgreSQL
   psql $POSTGRES_URL -c "SELECT 1;"
   ```

3. **For Vercel Postgres:**
   - Check Vercel dashboard for database status
   - Verify connection string hasn't changed
   - Ensure you're using the correct environment

4. **Test connection manually:**
   ```bash
   npm run db:studio  # Opens Drizzle Studio
   ```

### Migration Errors

**Symptom:** "Migration failed" or schema mismatch errors

**Solutions:**

1. **Reset database** (development only!):
   ```bash
   npm run db:reset
   ```

2. **Generate and apply migrations:**
   ```bash
   npm run db:generate  # Creates migration files
   npm run db:migrate   # Applies them
   ```

3. **Check migration status:**
   ```bash
   # Look in drizzle/ directory for migration files
   ls -la drizzle/
   ```

4. **Manual fix:**
   - Check `src/lib/schema.ts` for errors
   - Ensure all imports are correct
   - Run `npm run typecheck` to catch type errors

### "relation does not exist" Error

**Symptom:** PostgreSQL error about missing tables

**Solution:**
```bash
# Push schema to create tables
npm run db:push

# Or run migrations
npm run db:migrate
```

---

## Authentication Issues

### Session Always Null / Not Authenticated

**Symptom:** `session` is always `null` even after signing in

**Causes:**
1. Missing `BETTER_AUTH_SECRET`
2. Wrong environment variable names
3. Cookie issues
4. Incorrect headers usage

**Solutions:**

1. **Check environment variables:**
   ```bash
   # Must be set
   echo $BETTER_AUTH_SECRET
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_SECRET
   ```

2. **Generate new BETTER_AUTH_SECRET:**
   ```bash
   # Generate random 32-character string
   openssl rand -base64 32
   ```

3. **Check Better Auth configuration:**
   ```typescript
   // In src/lib/auth.ts
   import { betterAuth } from "better-auth";

   export const auth = betterAuth({
     database: dbAdapter,
     secret: process.env.BETTER_AUTH_SECRET, // Must be set!
     // ...
   });
   ```

4. **Verify headers usage:**
   ```typescript
   // Server component
   const session = await auth.api.getSession({
     headers: await headers(), // Don't forget await!
   });

   // API route
   import { headers } from "next/headers";
   const session = await auth.api.getSession({
     headers: await headers(),
   });
   ```

5. **Clear cookies and try again:**
   - Open browser DevTools
   - Application tab → Cookies
   - Delete all cookies for localhost:3000
   - Sign in again

### OAuth Redirect URI Mismatch

**Symptom:** Google OAuth error about redirect URI

**Solution:**

1. **Check Google Cloud Console:**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - APIs & Services → Credentials
   - Your OAuth 2.0 Client ID → Authorized redirect URIs

2. **Add correct URIs:**
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

3. **Verify NEXT_PUBLIC_APP_URL:**
   ```bash
   # Should match your current environment
   echo $NEXT_PUBLIC_APP_URL
   ```

### "use client" Errors with useSession

**Symptom:** Error about using hooks in server component

**Solution:**

Add `"use client"` directive to the component:
```typescript
"use client"; // Must be first line

import { useSession } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session } = useSession();
  // ...
}
```

---

## Build & Development Issues

### TypeScript Errors

**Symptom:** Build fails with TypeScript errors

**Solutions:**

1. **Check for errors:**
   ```bash
   npm run typecheck
   ```

2. **Common fixes:**
   - Missing imports
   - Wrong types
   - Nullable values not handled

3. **Restart TypeScript server:**
   - VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
   - Or restart your editor

### ESLint Errors

**Symptom:** Linting errors prevent build

**Solutions:**

1. **Run linter:**
   ```bash
   npm run lint
   ```

2. **Auto-fix:**
   ```bash
   npm run lint -- --fix
   ```

3. **Common issues:**
   - Unused imports → Remove them
   - Missing dependencies in useEffect → Add them or disable rule
   - console.log in production → Remove or use proper logging

### Module Not Found Errors

**Symptom:** "Module not found" or import errors

**Solutions:**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Clear cache:**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run dev
   ```

3. **Check path aliases:**
   ```typescript
   // Use @ alias
   import { auth } from "@/lib/auth";  // ✓ Correct
   import { auth } from "../lib/auth"; // ✗ Don't use relative paths
   ```

### Port Already in Use

**Symptom:** "Port 3000 is already in use"

**Solutions:**

1. **Kill process on port 3000:**
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill

   # Or use different port
   PORT=3001 npm run dev
   ```

2. **Find and kill manually:**
   ```bash
   lsof -i :3000  # Find process ID
   kill -9 <PID>  # Kill it
   ```

---

## AI Integration Issues

### OpenAI API Errors

**Symptom:** 401, 429, or 500 errors from OpenAI

**Solutions:**

1. **Check API key:**
   ```bash
   echo $OPENAI_API_KEY  # Should start with sk-
   ```

2. **Verify key is valid:**
   - Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Check key hasn't been revoked
   - Check usage limits

3. **Rate limiting (429):**
   - You've hit OpenAI rate limits
   - Wait and retry
   - Upgrade OpenAI plan

4. **Invalid model (404):**
   ```bash
   # Check OPENAI_MODEL env var
   echo $OPENAI_MODEL

   # Use valid model name
   # gpt-4o-mini, gpt-4o, gpt-4-turbo, etc.
   ```

### Streaming Not Working

**Symptom:** Chat doesn't stream, shows all at once

**Causes:**
1. Not using `streamText`
2. Not converting to stream response
3. Client not handling stream

**Solutions:**

1. **Server-side - use streamText:**
   ```typescript
   import { streamText } from "ai";

   const result = streamText({
     model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
     messages: convertToModelMessages(messages),
   });

   return result.toUIMessageStreamResponse(); // Important!
   ```

2. **Client-side - use useChat:**
   ```typescript
   import { useChat } from "@ai-sdk/react";

   const { messages, sendMessage } = useChat({ api: "/api/chat" });
   ```

### Model Name Hardcoded Error

**Symptom:** Want to change model but it's not changing

**Solution:**

Never hardcode model name:
```typescript
// ✗ WRONG
const result = streamText({
  model: openai("gpt-4o-mini"), // Hardcoded!
});

// ✓ CORRECT
const result = streamText({
  model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
});
```

---

## Deployment Issues

### Vercel Deployment Fails

**Symptom:** Build succeeds locally but fails on Vercel

**Solutions:**

1. **Check environment variables:**
   - Go to Vercel project settings
   - Environment Variables tab
   - Ensure all required vars are set:
     - `POSTGRES_URL`
     - `BETTER_AUTH_SECRET`
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `OPENAI_API_KEY`
     - `NEXT_PUBLIC_APP_URL`

2. **Check build logs:**
   - Look for specific error messages
   - Common issues:
     - Missing environment variables
     - TypeScript errors
     - Missing dependencies

3. **Verify node version:**
   ```json
   // package.json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

### Database Migrations on Vercel

**Symptom:** App deployed but database schema outdated

**Solution:**

Migrations run automatically via `build` script:
```json
{
  "scripts": {
    "build": "npm run db:migrate && next build"
  }
}
```

Verify:
1. Migration files exist in `drizzle/` directory
2. Build logs show migrations running
3. Check database schema in Drizzle Studio

### OAuth Not Working in Production

**Symptom:** OAuth works locally but not in production

**Solutions:**

1. **Update Google OAuth redirect URIs:**
   - Add production URL to authorized redirect URIs
   - `https://yourdomain.com/api/auth/callback/google`

2. **Update NEXT_PUBLIC_APP_URL:**
   - Set to production domain in Vercel env vars
   - `https://yourdomain.com`

3. **Check Better Auth secret:**
   - Must be different from development
   - Set in Vercel environment variables

---

## General Debugging Tips

### Enable Detailed Logging

```typescript
// API routes
console.log("Session:", session);
console.log("Request body:", body);
console.log("Database result:", result);
```

### Use React DevTools

- Install React DevTools extension
- Inspect component props and state
- Check re-render causes

### Use Network Tab

- Open browser DevTools → Network
- Check API responses
- Verify request/response format
- Look for errors

### Check Server Logs

```bash
# Development
# Logs appear in terminal running `npm run dev`

# Production (Vercel)
# View logs in Vercel dashboard
```

---

## Still Having Issues?

1. **Search existing issues:**
   - Check GitHub issues for this repo
   - Search Next.js, Better Auth, Drizzle docs

2. **Create minimal reproduction:**
   - Isolate the problem
   - Remove unrelated code
   - Share reproduction steps

3. **Check versions:**
   ```bash
   npm list next react better-auth drizzle-orm
   ```

4. **Update dependencies:**
   ```bash
   npm update
   ```

---

**Remember:** Most issues are configuration-related. Double-check environment variables, then check code, then check external services.
