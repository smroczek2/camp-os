# AGENTS.md

**Machine-readable instructions for AI coding agents**

This is the primary source of truth for all AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.) working with Camp OS.

---

## ⚠️ CRITICAL: Current Project State

**PROJECT NAME:** Camp OS - Camp Management Platform
**CURRENT PHASE:** Phase 2.5 Complete (Form Builder UI)
**STATUS:** Forms working end-to-end, ready for Phase 3 features

### ✅ COMPLETED - DO NOT REDO:

1. **Database Schema** (`src/lib/schema.ts`) - COMPLETE, DO NOT MODIFY WITHOUT REASON
   - ✅ 15 tables created (children, sessions, camps, registrations, incidents, groups, assignments, etc.)
   - ✅ All indexes and relations defined
   - ✅ Database has been reset and schema applied (`npm run db:push`)
   - ✅ **SEEDED with test data** - 7 users, 2 camps, 3 sessions, 6 children, 6 registrations

2. **RBAC System** (`src/lib/rbac.ts`) - COMPLETE
   - ✅ 4 roles: parent, staff, admin, nurse
   - ✅ Permission enforcement functions implemented
   - ✅ Role-based data filtering working

3. **Authentication** - COMPLETE
   - ✅ Better Auth configured with Google OAuth (`src/lib/auth.ts`)
   - ✅ Dev auth bypass for testing (`src/lib/dev-auth.ts`)
   - ✅ Unified auth helper (`src/lib/auth-helper.ts`)
   - ✅ User table extended with `role` field

4. **Service Layer** - COMPLETE
   - ✅ RegistrationService created (`src/services/registration-service.ts`)
   - ✅ FormService created (`src/services/form-service.ts`)
   - ✅ Event logging pattern established

5. **Form Builder System** - COMPLETE (Phase 2.5)
   - ✅ AI form generation with approval workflow
   - ✅ Dynamic form renderer with conditional logic
   - ✅ Form submission and review system
   - ✅ Parent submission with success confirmation
   - ✅ Admin submission review interface
   - ✅ Read-only completed submission view

6. **UI Dashboards** - COMPLETE FOR PHASE 1
   - ✅ Landing page (`src/app/page.tsx`)
   - ✅ Dev login page (`src/app/dev-login/page.tsx`)
   - ✅ Parent dashboard (`src/app/dashboard/parent/page.tsx`)
   - ✅ Staff dashboard (`src/app/dashboard/staff/page.tsx`)
   - ✅ Admin dashboard (`src/app/dashboard/admin/page.tsx`)
   - ✅ Role switcher component (`src/components/role-switcher.tsx`)

7. **Seed Script** (`src/scripts/seed.ts`) - COMPLETE
   - ✅ Creates 7 test users (admin, 2 staff, nurse, 3 parents)
   - ✅ Creates 2 camps with 3 sessions
   - ✅ Creates 6 children with medical info
   - ✅ Creates 6 registrations (5 confirmed, 1 pending)
   - ✅ Assigns children to groups
   - ✅ Run with: `npm run db:seed`
   - ⚠️ **DO NOT run db:seed again unless database needs to be reset**

### 🚧 TODO - Next Phases:

- ✅ Phase 1: Foundation (Database, Auth, RBAC, Dashboards)
- ✅ Phase 2.5: Form Builder UI (AI generation, dynamic forms, submissions)
- 🎯 Phase 2: Multi-step registration forms (NEXT)
- Phase 3: Check-in/check-out workflows
- Phase 4: Incident reporting
- Phase 5: Real-time updates (SSE)
- Phase 6: Event sourcing implementation
- Phase 7: AI features (optional)

See `plans/camp-os-three-surface-platform.md` for complete roadmap.
See `plans/phase-2-5-completion-plan.md` for Phase 2.5 completion details.

---

## Project Overview

**Camp OS** is a three-surface camp management platform:

1. **Parent Portal** - Register children, view updates, track registrations
2. **Staff Mobile App** - View assigned groups, manage rosters
3. **Admin Console** - Manage camps/sessions, track revenue

**Tech Stack:**
- **Framework**: Next.js 15 App Router, React 19, TypeScript (strict)
- **Auth**: Better Auth with Google OAuth + Dev Auth for testing
- **Database**: PostgreSQL + Drizzle ORM (postgres.js)
- **UI**: shadcn/ui (new-york style, neutral colors) + Tailwind CSS v4
- **RBAC**: Custom role-based access control system
- **Path Aliases**: `@/` → `src/`

---

## Setup Commands

```bash
# Install dependencies (ALREADY DONE)
npm install

# Development server (runs on port 3000 or 3003 if 3000 in use)
npm run dev

# Build
npm run build

# Database operations
npm run db:push       # Push schema changes (dev) - ⚠️ Schema already pushed
npm run db:generate   # Generate migrations (prod)
npm run db:migrate    # Run migrations (prod)
npm run db:studio     # Open database GUI
npm run db:seed       # Seed database - ⚠️ ALREADY SEEDED, only re-run if needed

# Quality checks (ALWAYS run after changes)
npm run lint
npm run typecheck
```

---

## Camp OS Specific Patterns

### Authentication (UPDATED)

**Use the unified auth helper** (supports Better Auth + dev mode):

```typescript
import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getSession();  // Checks dev auth first, then Better Auth
  if (!session) redirect("/dev-login");

  return <div>Welcome {session.user.name}</div>;
}
```

### Development Testing

**Test different roles WITHOUT Google OAuth:**

1. Navigate to `/dev-login` page
2. Click any test user card to log in
3. Use "Switch Role" dropdown in header to change users

**Test Users:**
- admin@camposarai.co - Admin User
- sarah.johnson@camposarai.co - Sarah Johnson (Staff)
- jennifer.smith@example.com - Jennifer Smith (Parent, 2 children)
- And 4 more...

### RBAC Enforcement (CRITICAL)

**Always enforce permissions in Server Actions:**

```typescript
'use server'

import { getSession } from "@/lib/auth-helper";
import { enforcePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { children } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function updateChild(childId: string, data: any) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  // ⚠️ CRITICAL: Check permission + verify ownership
  await enforcePermission(session.user.id, "child", "update", childId);

  // Now safe to update
  const [updated] = await db
    .update(children)
    .set(data)
    .where(eq(children.id, childId))
    .returning();

  return updated;
}
```

**Role Permissions Matrix** (see `src/lib/rbac.ts`):
- **parent**: create/read/update children, create/read/cancel registrations
- **staff**: read children/registrations, create/update incidents
- **nurse**: full medical access
- **admin**: full system access

### Service Layer Pattern

**Use services for business logic with transactions:**

```typescript
// src/services/your-service.ts
import { db } from "@/lib/db";
import { yourTable, events } from "@/lib/schema";

export class YourService {
  async create(data: any) {
    return db.transaction(async (tx) => {
      // Create record
      const [record] = await tx.insert(yourTable).values(data).returning();

      // Log event for audit trail
      await tx.insert(events).values({
        streamId: `your-entity-${record.id}`,
        eventType: "YourEntityCreated",
        eventData: record,
        version: 1,
        userId: data.userId,
      });

      return record;
    });
  }
}
```

---

## Database Schema (Camp OS)

**⚠️ Schema is COMPLETE - See `src/lib/schema.ts`**

**Core Tables:**
- `user` - Extended with `role` field (parent, staff, admin, nurse)
- `children` - Child profiles (linked to parent users)
- `medications` - Medication info
- `camps` - Camp definitions
- `sessions` - Camp sessions with pricing
- `registrations` - Child enrollments
- `incidents` - Incident reports
- `documents` - File uploads
- `events` - Event sourcing audit trail
- `groups` - Group/cabin organization
- `assignments` - Staff-to-group assignments
- `group_members` - Children in groups
- `attendance` - Check-in/check-out records
- `medication_logs` - Medication administration
- `ai_actions` - AI-generated actions (for future)

**All relations defined** - Use Drizzle's `with:` syntax for joins

**DO NOT:**
- ❌ Run `db:reset` without backing up data
- ❌ Modify core schema without understanding impact
- ❌ Re-run `db:seed` unless you want to reset all data

---

## Project Structure (Updated)

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/       # Better Auth catch-all
│   │   ├── dev-login/           # Dev auth bypass API
│   │   └── chat/                # AI streaming (if needed)
│   ├── dashboard/
│   │   ├── parent/              # Parent dashboard ✅ DONE
│   │   ├── staff/               # Staff dashboard ✅ DONE
│   │   ├── admin/               # Admin dashboard ✅ DONE
│   │   └── page.tsx             # Role router ✅ DONE
│   ├── dev-login/               # Dev login UI ✅ DONE
│   ├── chat/                    # AI chat (not needed for Camp OS)
│   └── page.tsx                 # Landing page ✅ DONE
├── components/
│   ├── auth/                    # Auth components
│   ├── ui/                      # shadcn/ui components
│   ├── role-switcher.tsx        # Role switching ✅ DONE
│   ├── site-header.tsx          # Header with Camp OS branding ✅ DONE
│   └── site-footer.tsx          # Footer ✅ DONE
├── lib/
│   ├── auth.ts                  # Better Auth config ✅ DONE (role field added)
│   ├── auth-helper.ts           # Unified auth (dev + prod) ✅ DONE
│   ├── dev-auth.ts              # Dev session mgmt ✅ DONE
│   ├── rbac.ts                  # RBAC enforcement ✅ DONE
│   ├── auth-client.ts           # Better Auth client
│   ├── db.ts                    # Database connection
│   ├── schema.ts                # Drizzle schema ✅ COMPLETE
│   └── utils.ts                 # Utilities
├── services/
│   └── registration-service.ts  # Registration logic ✅ DONE
├── scripts/
│   └── seed.ts                  # Database seeding ✅ DONE
└── docs/
    └── solutions/               # Documented patterns
        └── authentication/      # Dev auth pattern docs
```

---

## Core Principles (CRITICAL)

1. **Server Components by Default** - Only use `"use client"` when you need useState, useEffect, onClick, or browser APIs
2. **Always Filter by User ID** - All user-specific database queries MUST filter by `session.user.id`
3. **Use Existing Patterns** - Don't reinvent auth, database, or RBAC
4. **Check RBAC** - Use `enforcePermission()` before mutations
5. **Use Unified Auth** - Import from `@/lib/auth-helper`, not `@/lib/auth` directly
6. **Quality Checks Required** - Run `npm run lint` and `npm run typecheck` after ALL changes
7. **Security First** - Check authentication, validate input, verify ownership

---

## Authentication Pattern (Updated for Camp OS)

**Protected Server Component:**
```typescript
import { getSession } from "@/lib/auth-helper";  // ⚠️ Use this, not auth directly
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getSession();  // Works in dev + prod
  if (!session?.user) redirect("/dev-login");

  return <div>Welcome {session.user.name}</div>;
}
```

**With RBAC Enforcement:**
```typescript
import { getSession } from "@/lib/auth-helper";
import { enforcePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export default async function ParentDashboard() {
  const session = await getSession();
  if (!session?.user) redirect("/dev-login");

  // Get only THIS user's children (filtered by userId)
  const myChildren = await db.query.children.findMany({
    where: eq(children.userId, session.user.id),
  });

  return <div>{/* Render children */}</div>;
}
```

---

## Database Query Patterns (Camp OS)

**CRITICAL: Always filter by userId OR enforce RBAC**

```typescript
import { db } from "@/lib/db";
import { children, registrations } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// ✅ CORRECT - Parent sees only their children
const myChildren = await db.query.children.findMany({
  where: eq(children.userId, session.user.id),
});

// ✅ CORRECT - Staff sees only assigned children (RBAC checks this)
const assignedChildren = await db.query.children.findMany({
  where: eq(children.id, childId),
});
// But MUST call enforcePermission() first to verify assignment

// ❌ WRONG - Querying all children without filter
const allChildren = await db.query.children.findMany();
```

**With Relations:**
```typescript
const myRegistrations = await db.query.registrations.findMany({
  where: eq(registrations.userId, session.user.id),
  with: {
    child: true,
    session: {
      with: {
        camp: true,
      },
    },
  },
});
```

---

## Security Checklist (Camp OS Specific)

✓ Use `getSession()` from `@/lib/auth-helper` in ALL protected routes
✓ Call `enforcePermission()` before ANY mutation (create/update/delete)
✓ Filter ALL user data queries by `session.user.id` (parents) OR verify assignment (staff)
✓ Check user role before showing admin/staff features
✓ Validate medical data access (staff see allergies only, nurses see full records)
✓ Log all sensitive actions to `events` table for audit trail
✓ Return user-friendly error messages
✓ Never commit .env files

---

## Development Workflow

### Testing with Dev Auth

**Instead of setting up Google OAuth for every test user:**

1. Navigate to http://localhost:3000/dev-login
2. Click any test user card (Jennifer Smith, Sarah Johnson, Admin, etc.)
3. Use "Switch Role" button in header to change users
4. Dashboard auto-routes based on role

**Seed Data Available:**
- 3 Parents (each with 2 children)
- 2 Staff members (assigned to groups)
- 1 Nurse
- 1 Admin
- Run `npm run db:seed` to reset if needed

### Adding New Features

1. **Check existing patterns** - Look at dashboards and services
2. **Plan RBAC** - What permissions are needed?
3. **Create Server Action** - Use `enforcePermission()`
4. **Build UI** - Use Server Components when possible
5. **Test with role switcher** - Verify permissions work correctly
6. **Quality check** - Run `npm run lint && npm run typecheck`

---

## Anti-Patterns (NEVER Do)

❌ Modify database schema without understanding existing relations
❌ Use `auth.api.getSession()` directly - use `getSession()` from auth-helper
❌ Skip `enforcePermission()` on mutations
❌ Query all children/registrations without userId filter
❌ Run `db:seed` without realizing it will reset all data
❌ Create duplicate auth systems (we already have Better Auth + dev auth)
❌ Hardcode user roles in components (check dynamically with RBAC)
❌ Use `"use client"` unnecessarily

---

## Common Imports (Camp OS)

```typescript
// Auth (UPDATED)
import { getSession } from "@/lib/auth-helper";  // ⚠️ Use this
import { enforcePermission, getUserRole } from "@/lib/rbac";

// Database
import { db } from "@/lib/db";
import {
  children,
  registrations,
  sessions,
  camps,
  incidents,
  assignments,
  groups,
} from "@/lib/schema";
import { eq, and, or, desc } from "drizzle-orm";

// Services
import { registrationService } from "@/services/registration-service";

// UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Icons
import { Users, Calendar, Shield, Activity, Heart, Tent } from "lucide-react";
```

---

## Camp OS Data Model

### Key Entities

**User (Extended Better Auth)**
- `id` (text) - Primary key
- `email`, `name`, `image`
- **`role`** (text) - "parent" | "staff" | "admin" | "nurse"

**Children**
- Belongs to User (parent)
- Has allergies (jsonb array)
- Has medical notes (text)

**Sessions**
- Belongs to Camp
- Has many Registrations
- Has many Groups

**Registrations**
- Links Child to Session
- Belongs to User (parent who registered)
- Status: pending, confirmed, canceled, refunded

**Groups**
- Belongs to Session
- Has many Assignments (staff)
- Has many GroupMembers (children)

**Assignments**
- Links Staff to Group and Session
- Used to determine which children staff can view

### Permission Logic

```typescript
// Parents: see only their own children
where: eq(children.userId, session.user.id)

// Staff: see only assigned children
// Must check via assignments table
const assignment = await db.query.assignments.findFirst({
  where: and(
    eq(assignments.staffId, session.user.id),
    eq(assignments.sessionId, registration.sessionId)
  ),
});

// Admin: see everything (no filter needed)
// But still use enforcePermission() to verify role
```

---

## Environment Variables

Required in `.env`:
- `POSTGRES_URL` - Database connection ✅ CONFIGURED
- `BETTER_AUTH_SECRET` - Auth secret (32 chars)
- `BETTER_AUTH_URL` - App URL (http://localhost:3000)
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `OPENAI_API_KEY` - OpenAI key (for future AI features)
- `OPENAI_MODEL` - Model name (default: gpt-4o-mini)

---

## Additional Resources

- `CLAUDE.md` - Claude Code specific instructions
- `README-CAMP-OS.md` - Setup and usage guide
- `plans/camp-os-three-surface-platform.md` - Complete technical plan
- `plans/camp-os-technical-addendum.md` - Implementation details
- `docs/solutions/` - Documented patterns and solutions

---

## Quick Reference: What's Available

### Test with Real Data

Visit http://localhost:3000/dev-login and log in as:

- **Jennifer Smith (Parent)** - Has 2 children (Emma with allergies, Liam)
- **Sarah Johnson (Staff)** - Assigned to 2 groups (4 children)
- **Admin User** - Sees full system (3 sessions, $3,850 revenue)

### Dashboards Working

- `/dashboard/parent` - Children, registrations, browse sessions
- `/dashboard/staff` - Assigned groups, rosters with medical alerts
- `/dashboard/admin` - Camps, sessions, revenue, registration management

### Services Available

- `registrationService` - Create, cancel, confirm payment (with event logging)

### RBAC Functions

- `enforcePermission(userId, resource, action, resourceId?)` - Throws if unauthorized
- `hasPermission(userId, resource, action)` - Returns boolean
- `ownsResource(userId, resourceType, resourceId)` - Check ownership
- `isAssignedToChild(staffId, childId)` - Check staff assignment

---

**Remember**: This is Camp OS Phase 1 (Foundation). The database is seeded, dashboards work, RBAC is enforced. Build on this foundation - don't recreate it.
