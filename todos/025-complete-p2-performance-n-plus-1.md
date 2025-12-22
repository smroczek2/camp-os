---
status: complete
priority: p2
issue_id: "025"
tags: [performance, database, n-plus-1, optimization]
dependencies: []
---

# Critical N+1 Query Patterns in Dashboards

APPROVED - Admin and parent dashboards load all data without limits.

## Problem Statement

Dashboard pages fetch ALL data for display, creating severe performance issues at scale:

1. **Admin Dashboard** loads ALL sessions + ALL registrations + ALL child data
2. **Parent Dashboard** loads ALL sessions in the system
3. **Forms List** has no pagination

**Current Impact:** Acceptable with < 100 sessions
**At 1,000 sessions:** 3-5 second page loads
**At 10,000 sessions:** Timeouts and memory exhaustion

## Findings

### Admin Dashboard (Critical)

**Location:** `/src/app/(site)/dashboard/admin/page.tsx` (Lines 25-42)

```typescript
// Loads EVERYTHING
const allSessions = await db.query.sessions.findMany({
  with: {
    registrations: {
      with: {
        child: true,
        user: true,  // Over-fetching!
      },
    },
  },
});

// Then fetches all registrations AGAIN
const allRegistrations = await db.query.registrations.findMany({
  with: {
    child: true,
    session: true,
  },
});
```

**Problem:** 100 sessions × 50 registrations = 5,000+ records loaded twice.

### Parent Dashboard (High)

**Location:** `/src/app/(site)/dashboard/parent/page.tsx` (Lines 43-47)

```typescript
const allSessions = await db.query.sessions.findMany({
  with: {
    registrations: true,  // ALL registrations for ALL sessions
  },
});
```

### Forms Page (Medium)

**Location:** `/src/app/(site)/dashboard/admin/forms/page.tsx`

No LIMIT clause on forms query.

## Proposed Solutions

### Option 1: Aggregation + Pagination (Recommended)

**Admin Dashboard Fix:**
```typescript
// Get aggregated stats in single query
const stats = await db
  .select({
    totalSessions: sql<number>`COUNT(DISTINCT ${sessions.id})`,
    confirmedRegistrations: sql<number>`COUNT(CASE WHEN ${registrations.status} = 'confirmed' THEN 1 END)`,
    pendingRegistrations: sql<number>`COUNT(CASE WHEN ${registrations.status} = 'pending' THEN 1 END)`,
    totalRevenue: sql<number>`SUM(${registrations.amountPaid}::numeric)`,
  })
  .from(sessions)
  .leftJoin(registrations, eq(sessions.id, registrations.sessionId));

// Only fetch recent 5 sessions for display
const recentSessions = await db.query.sessions.findMany({
  with: {
    registrations: { columns: { status: true } },
  },
  orderBy: [desc(sessions.createdAt)],
  limit: 5,
});
```

**Parent Dashboard Fix:**
```typescript
// Only open sessions, limited fields
const availableSessions = await db.query.sessions.findMany({
  where: eq(sessions.status, 'open'),
  with: {
    registrations: { columns: { status: true } }, // Just for counting
  },
  limit: 50,
});
```

**Effort:** 4-6 hours
**Risk:** Low

## Acceptance Criteria

- [ ] Admin dashboard loads in < 500ms
- [ ] Parent dashboard loads in < 500ms
- [ ] Stats are calculated via aggregation
- [ ] Only necessary data is fetched
- [ ] Pagination added to long lists
- [ ] No N+1 queries remain

## Technical Details

**Files to Modify:**
- `src/app/(site)/dashboard/admin/page.tsx`
- `src/app/(site)/dashboard/parent/page.tsx`
- `src/app/(site)/dashboard/admin/forms/page.tsx`
- `src/app/(site)/dashboard/admin/programs/page.tsx`

**Performance Targets:**
- Query time: < 100ms
- TTFB: < 500ms
- Full load: < 2s

## Work Log

### 2025-12-22 - Initial Discovery

**By:** Performance Oracle Agent

**Actions:**
- Identified unbounded queries
- Calculated scale impact
- Designed aggregation approach
- Documented fix patterns
