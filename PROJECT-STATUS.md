# Camp OS - Project Status

**Last Updated:** 2025-12-15
**Current Phase:** Phase 1 Complete (Foundation)
**Next Phase:** Phase 2 (Registration Forms)

---

## 🎯 Project Goal

Build a three-surface camp management platform:
1. Parent Portal - Register children, view updates
2. Staff Mobile App - Manage groups, check-in children
3. Admin Console - Manage camps, track revenue

See `plans/camp-os-three-surface-platform.md` for complete vision.

---

## ✅ Phase 1: Foundation (COMPLETE - 2025-12-15)

### Database Schema - DONE ✅

**File:** `src/lib/schema.ts`

**Status:** Complete and applied to database
- ✅ 15 tables created with all relations
- ✅ Indexes added for performance
- ✅ User table extended with `role` field
- ✅ Database schema pushed via `npm run db:push`

**Tables:**
```
user (Better Auth + role field)
session, account, verification (Better Auth)
children, medications, medication_logs
camps, sessions, registrations
groups, assignments, group_members
incidents, documents, events
attendance, ai_actions
```

**⚠️ DO NOT:** Run `npm run db:reset` or modify schema without reviewing existing structure

### RBAC System - DONE ✅

**File:** `src/lib/rbac.ts`

**Status:** Complete and working
- ✅ 4 roles defined (parent, staff, admin, nurse)
- ✅ Permission matrix implemented
- ✅ Enforcement functions created
- ✅ Tested with all dashboards

**Functions Available:**
```typescript
enforcePermission(userId, resource, action, resourceId?)
hasPermission(userId, resource, action)
ownsResource(userId, resourceType, resourceId)
isAssignedToChild(staffId, childId)
getUserRole(userId)
isAdmin(userId)
```

**⚠️ DO NOT:** Create new permission system - use existing functions

### Authentication - DONE ✅

**Files:**
- `src/lib/auth.ts` - Better Auth config (Google OAuth + role field)
- `src/lib/dev-auth.ts` - Dev session management
- `src/lib/auth-helper.ts` - Unified auth helper
- `src/app/api/dev-login/route.ts` - Dev login endpoint
- `src/components/role-switcher.tsx` - UI for role switching

**Status:** Complete and working
- ✅ Better Auth configured with Google OAuth
- ✅ Dev auth bypass for testing (dev mode only)
- ✅ Role switcher in header for testing
- ✅ All dashboards use unified auth

**Usage:**
```typescript
import { getSession } from "@/lib/auth-helper";  // ⚠️ ALWAYS use this

const session = await getSession();  // Works in dev + production
```

**⚠️ DO NOT:** Import from `@/lib/auth` directly - always use `@/lib/auth-helper`

### Seed Data - DONE ✅

**File:** `src/scripts/seed.ts`

**Status:** Database seeded with test data
- ✅ 7 users created (admin, 2 staff, nurse, 3 parents)
- ✅ 2 camps created
- ✅ 3 sessions created (July 2025)
- ✅ 6 children created with medical info
- ✅ 6 registrations created (5 confirmed, 1 pending)
- ✅ Staff assigned to groups
- ✅ Children assigned to groups

**Revenue:** $3,850 in confirmed registrations

**Command:** `npm run db:seed`

**⚠️ WARNING:** Running `npm run db:seed` will DELETE all existing data and recreate seed data. Only run if you want to reset.

**Test Users:**
```
Admin:   admin@camposarai.co
Staff:   sarah.johnson@camposarai.co, mike.chen@camposarai.co
Nurse:   emily.martinez@camposarai.co
Parents: jennifer.smith@example.com (Emma & Liam)
         david.williams@example.com (Olivia & Noah)
         maria.garcia@example.com (Sophia & Lucas)
```

### UI Dashboards - DONE ✅

**Status:** All three dashboards working and tested

1. **Landing Page** (`src/app/page.tsx`)
   - ✅ Camp OS branding
   - ✅ Three-surface overview
   - ✅ Feature highlights
   - ✅ Sign-in integration

2. **Dev Login** (`src/app/dev-login/page.tsx`)
   - ✅ User selection cards
   - ✅ Role-specific styling
   - ✅ Instant login

3. **Parent Dashboard** (`src/app/dashboard/parent/page.tsx`)
   - ✅ View children with medical info
   - ✅ See registrations with status
   - ✅ Browse available sessions
   - ✅ Allergy alerts highlighted

4. **Staff Dashboard** (`src/app/dashboard/staff/page.tsx`)
   - ✅ View assigned groups
   - ✅ See children rosters
   - ✅ Medical alerts displayed
   - ✅ Session information

5. **Admin Dashboard** (`src/app/dashboard/admin/page.tsx`)
   - ✅ Camp and session overview
   - ✅ Revenue tracking
   - ✅ Registration feed
   - ✅ Capacity and fill rate stats

**Dashboard Router** (`src/app/dashboard/page.tsx`)
- ✅ Auto-routes based on user role

**⚠️ DO NOT:** Recreate dashboards - extend or enhance existing ones

### Service Layer - STARTED ✅

**File:** `src/services/registration-service.ts`

**Status:** Example service created
- ✅ RegistrationService with transaction support
- ✅ Event logging pattern established
- ✅ CRUD operations implemented

**Pattern established for:**
- Using transactions for data consistency
- Logging events for audit trail
- Returning typed results

**⚠️ TODO:** Create additional services (AttendanceService, IncidentService, etc.)

### Components - DONE ✅

**Files:**
- `src/components/site-header.tsx` - Camp OS branded header
- `src/components/site-footer.tsx` - Simple footer
- `src/components/role-switcher.tsx` - Role switching dropdown

**Status:** Working across all pages

**⚠️ DO NOT:** Remove role-switcher component - used for testing

---

## 🚧 Phase 2: Registration Flow (TODO)

**Goal:** Parents can register children for camp sessions

**Tasks:**
- [ ] Multi-step registration form (4 steps)
- [ ] Form validation with Zod
- [ ] Child information step
- [ ] Medical information step
- [ ] Payment integration (mock Stripe)
- [ ] Confirmation page

**Dependencies Needed:**
- React Hook Form
- Zustand (form state)
- Stripe SDK (for mock payments)

**⚠️ START HERE for next feature work**

---

## 🚧 Phase 3: Check-In/Check-Out (TODO)

**Goal:** Staff can check in/out children

**Tasks:**
- [ ] Check-in interface for staff
- [ ] QR code scanning (optional)
- [ ] Check-out with parent verification
- [ ] Attendance recording
- [ ] Server Actions for attendance mutations

**Tables Available:**
- `attendance` table exists in schema (ready to use)

---

## 🚧 Phase 4: Incident Reporting (TODO)

**Goal:** Staff can report incidents

**Tasks:**
- [ ] Incident report form
- [ ] Photo upload support
- [ ] Severity selection
- [ ] Parent notifications
- [ ] Server Actions for incident creation

**Tables Available:**
- `incidents` table exists in schema (ready to use)

---

## ⚠️ CRITICAL: What NOT to Do

### DO NOT Recreate:

1. ❌ Database schema - It's complete in `src/lib/schema.ts`
2. ❌ Seed script - It's done in `src/scripts/seed.ts`
3. ❌ RBAC system - It's complete in `src/lib/rbac.ts`
4. ❌ Auth system - Better Auth + dev auth is configured
5. ❌ Dashboards - Parent, Staff, Admin dashboards are working
6. ❌ Service pattern - RegistrationService shows the pattern

### DO NOT Run Without Understanding:

1. ❌ `npm run db:reset` - Drops ALL tables (loses data)
2. ❌ `npm run db:seed` - Deletes existing data and recreates seed data
3. ❌ `npm run db:push` - Applies schema changes (only needed if schema modified)

---

## 🧪 How to Test Right Now

1. **Start server:** `npm run dev`
2. **Navigate to:** http://localhost:3000/dev-login
3. **Click any user card** to log in
4. **Use "Switch Role" dropdown** in header to test different roles
5. **Explore dashboards:**
   - Parent: See children, registrations, browse sessions
   - Staff: See assigned groups and rosters
   - Admin: See full system overview

**No Google OAuth needed for testing!**

---

## 📊 Current Database State

**Last Seeded:** 2025-12-15

**Data Counts:**
- 7 users (1 admin, 2 staff, 1 nurse, 3 parents)
- 2 camps
- 3 sessions (all open, July 2025)
- 6 children (3 with allergies)
- 6 registrations (5 confirmed @ $3,850, 1 pending)
- 4 groups
- 4 staff assignments
- 6 group member assignments

**To view data:** `npm run db:studio` (opens Drizzle Studio)

---

## 🎯 Next Steps

### Immediate Next Feature (Phase 2):

**Build multi-step registration form**

1. Create `/dashboard/parent/register/[sessionId]/page.tsx`
2. Implement 4-step form:
   - Step 1: Select child (or add new)
   - Step 2: Medical information
   - Step 3: Emergency contacts
   - Step 4: Payment (mock Stripe)
3. Use `registrationService.create()` on submission
4. Redirect to confirmation page

**Reference:** See `plans/camp-os-three-surface-platform.md` lines 526-545

---

## 📝 Documentation

**For AI Agents:**
- `AGENTS.md` (this file) - Primary reference
- `CLAUDE.md` - Claude Code specific workflows

**For Developers:**
- `README-CAMP-OS.md` - Setup and usage guide
- `plans/` - Technical specifications
- `docs/solutions/` - Documented solutions

**For Testing:**
- Navigate to `/dev-login` for instant role-based testing
- Use "Switch Role" dropdown in header

---

## 🔍 Troubleshooting

**Issue:** "Database connection error"
- Check `POSTGRES_URL` in `.env`
- Verify database is running

**Issue:** "Table doesn't exist"
- Run `npm run db:push` to apply schema
- Check `src/lib/schema.ts` for table definitions

**Issue:** "No data showing"
- Run `npm run db:seed` to populate test data
- Check database with `npm run db:studio`

**Issue:** "Authentication not working"
- For dev testing: Use `/dev-login` page
- For production: Configure Google OAuth in `.env`

---

**Summary:** Phase 1 (Foundation) is complete. Database seeded, dashboards working, RBAC enforced. Ready for Phase 2 (Registration Forms).
