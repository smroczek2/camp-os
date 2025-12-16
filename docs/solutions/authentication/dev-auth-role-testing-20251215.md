---
title: Development Authentication Bypass for Role Testing
module: Camp OS Authentication
date: 2025-12-15
problem_type: development_workflow
component: authentication
symptoms:
  - Need to test multiple user roles without OAuth setup
  - Cannot easily switch between parent/staff/admin views
  - Slow testing workflow with real authentication
root_cause: Better Auth requires OAuth providers, making role testing cumbersome
severity: moderate
tags: [dev-mode, authentication, role-testing, better-auth]
stage: foundation
files_modified:
  - src/lib/dev-auth.ts
  - src/lib/auth-helper.ts
  - src/app/api/dev-login/route.ts
  - src/components/role-switcher.tsx
---

# Development Authentication Bypass for Role Testing

## Problem Statement

When building a multi-role application (parent, staff, admin, nurse), testing each role's dashboard requires switching between different authenticated users. With Better Auth and Google OAuth:

1. Each role needs a separate Google account
2. Signing out and back in is slow
3. Development velocity suffers
4. Cannot quickly validate role-based permission logic

## Symptoms

- **Observed**: Testing requires multiple Google accounts and constant re-authentication
- **Impact**: Slow development and testing cycle
- **Affected**: All role-based features (dashboards, permissions, data access)

## Investigation

**Attempted Solutions:**
1. ❌ Multiple Google OAuth accounts - Too slow to switch
2. ❌ Mock auth in each component - Doesn't test real auth flow
3. ✅ Dev-only session bypass with cookie management

## Root Cause

Better Auth's session management is production-focused and doesn't provide a built-in way to impersonate users in development. Need a parallel auth system that:
- Works alongside Better Auth
- Only enables in dev mode
- Uses real database session structure
- Supports quick role switching

## Solution

### Architecture

Created a three-layer development authentication system:

1. **Dev Auth Helper** (`src/lib/dev-auth.ts`)
   - Cookie-based session storage
   - Only enabled when `NODE_ENV !== "production"`
   - Returns session-compatible objects

2. **Unified Auth Helper** (`src/lib/auth-helper.ts`)
   - Checks dev mode first, falls back to Better Auth
   - Single import point for all pages
   - Transparent to components

3. **Dev Login API** (`src/app/api/dev-login/route.ts`)
   - Sets dev user cookie
   - Validates user exists in database
   - Production-blocked

4. **Role Switcher UI** (`src/components/role-switcher.tsx`)
   - Dropdown in header for quick role switching
   - Shows all test users with role badges
   - Client-side component

### Implementation

**File: `src/lib/dev-auth.ts`**

```typescript
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

const DEV_SESSION_COOKIE = "camp_os_dev_user_id";

export async function setDevUser(userId: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev auth not available in production");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function getDevUser() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const cookieStore = await cookies();
  const devUserId = cookieStore.get(DEV_SESSION_COOKIE);

  if (!devUserId?.value) {
    return null;
  }

  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, devUserId.value),
  });

  if (!userRecord) {
    return null;
  }

  // Return Better Auth compatible session object
  return {
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      image: userRecord.image,
      emailVerified: userRecord.emailVerified,
    },
    session: {
      id: "dev-session",
      userId: userRecord.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  };
}
```

**File: `src/lib/auth-helper.ts`**

```typescript
import { auth } from "@/lib/auth";
import { getDevUser, isDevMode } from "@/lib/dev-auth";
import { headers } from "next/headers";

export async function getSession() {
  // In dev mode, check for dev user first
  if (isDevMode()) {
    const devUser = await getDevUser();
    if (devUser) {
      return devUser;
    }
  }

  // Fall back to Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}
```

**File: `src/components/role-switcher.tsx`**

```typescript
"use client";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const DEV_USERS = [
  { id: "parent-1", name: "Jennifer Smith (Parent)", role: "parent" },
  { id: "staff-1", name: "Sarah Johnson (Staff)", role: "staff" },
  { id: "admin-1", name: "Admin User", role: "admin" },
  // ... more test users
];

export function RoleSwitcher() {
  const switchRole = async (userId: string) => {
    const response = await fetch("/api/dev-login", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    if (response.ok) {
      window.location.href = "/dashboard";
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm">
          <RefreshCw /> Switch Role
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {DEV_USERS.map(user => (
          <DropdownMenuItem onClick={() => switchRole(user.id)}>
            {user.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Usage in Pages

**Before (requires Better Auth):**
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  // ...
}
```

**After (supports dev mode):**
```typescript
import { getSession } from "@/lib/auth-helper";

export default async function Dashboard() {
  const session = await getSession(); // Works in dev and production
  // ...
}
```

## Results

**Testing workflow:**
1. Navigate to `/dev-login` page
2. Click any test user card to instantly log in
3. Use "Switch Role" dropdown in header to change users
4. Dashboard automatically routes based on role
5. No OAuth setup required in development

**Benefits:**
- ⚡ Instant role switching (no re-authentication)
- 🔒 Production-safe (automatically disabled in production)
- 🎯 Tests real permission logic (uses actual database users)
- 🚀 Fast development cycle

## Prevention

For future projects with role-based auth:

1. **Plan dev auth early** - Add before building dashboards
2. **Use unified auth helper** - Single import point prevents refactoring later
3. **Seed test users** - Include diverse roles in seed script
4. **UI for switching** - Dropdown in header better than separate login page

## Related Patterns

- Role-based access control (RBAC) implementation
- Better Auth integration patterns
- Development workflow optimization

## Notes

**Security considerations:**
- Dev auth MUST be disabled in production (checked via `process.env.NODE_ENV`)
- Cookie is httpOnly to prevent XSS
- Session expires after 24 hours
- Uses actual database users (validates user exists)

**Better Auth compatibility:**
- Returns same session structure as Better Auth
- Can coexist with OAuth (falls back automatically)
- Works with existing auth middleware

**Testing:**
- Verified all 3 dashboards (parent, staff, admin)
- Role switcher tested with 6 different users
- Permission checks work correctly with dev sessions
