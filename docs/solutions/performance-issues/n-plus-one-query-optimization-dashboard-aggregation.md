---
title: Critical N+1 Query Optimization - Admin and Parent Dashboards
category: performance-issues
tags: [performance, database, n-plus-1, optimization, query-efficiency, drizzle-orm]
severity: high
date_solved: 2025-12-22
components: [src/app/(site)/dashboard/admin/page.tsx, src/app/(site)/dashboard/parent/page.tsx]
symptoms: >-
  Dashboard pages fetched all data without limits or aggregation. Admin dashboard loaded ALL sessions
  with nested registrations and child data, then fetched registrations again separately. Parent dashboard
  loaded all sessions in the system. Acceptable at <100 sessions but would cause 3-5 second page loads
  at 1,000 sessions and timeouts at 10,000 sessions.
root_cause: >-
  Initial implementation prioritized correctness over performance. Full data fetching was needed for
  feature development but was never optimized for scale.
---

# N+1 Query Optimization - Dashboard Aggregation

## Problem

Admin and parent dashboards loaded unbounded data:

```typescript
// Before - Admin Dashboard (SLOW)
const allSessions = await db.query.sessions.findMany({
  with: {
    registrations: {
      with: { child: true, user: true },  // Over-fetching!
    },
  },
});

const allRegistrations = await db.query.registrations.findMany({
  with: { child: true, session: true },
});  // Fetching AGAIN!
```

**Impact at scale:**
- 100 sessions × 50 registrations = 5,000+ records loaded twice
- 1,000 sessions = 3-5 second page loads
- 10,000 sessions = timeouts and memory exhaustion

## Solution

### Admin Dashboard - SQL Aggregation

Replace multiple queries with a single aggregated stats query:

```typescript
// After - Admin Dashboard (FAST)
import { sql, desc, eq } from "drizzle-orm";
import { sessions, registrations } from "@/lib/schema";

// Single query for all stats
const [stats] = await db
  .select({
    totalSessions: sql<number>`COUNT(DISTINCT ${sessions.id})`.mapWith(Number),
    confirmedRegistrations: sql<number>`COUNT(CASE WHEN ${registrations.status} = 'confirmed' THEN 1 END)`.mapWith(Number),
    pendingRegistrations: sql<number>`COUNT(CASE WHEN ${registrations.status} = 'pending' THEN 1 END)`.mapWith(Number),
    totalRevenue: sql<number>`COALESCE(SUM(${registrations.amountPaid}::numeric), 0)`.mapWith(Number),
  })
  .from(sessions)
  .leftJoin(registrations, eq(sessions.id, registrations.sessionId));

// Limited data for display
const recentSessions = await db.query.sessions.findMany({
  with: {
    registrations: { columns: { status: true } },  // Only status column
  },
  orderBy: [desc(sessions.createdAt)],
  limit: 5,
});

const recentRegistrations = await db.query.registrations.findMany({
  with: {
    child: { columns: { firstName: true, lastName: true } },
    session: { columns: { name: true, startDate: true, price: true } },
  },
  orderBy: [desc(registrations.createdAt)],
  limit: 10,
});
```

### Parent Dashboard - Filtered + Limited

```typescript
// After - Parent Dashboard
const allSessions = await db.query.sessions.findMany({
  where: or(eq(sessions.status, "open"), eq(sessions.status, "draft")),
  with: {
    registrations: { columns: { status: true } },
  },
  limit: 50,
});
```

## Key Techniques

1. **SQL Aggregation** - Use `COUNT`, `SUM`, `CASE WHEN` instead of loading all data
2. **Selective Columns** - Only fetch columns needed for display
3. **Limits** - Cap result sets to reasonable display amounts
4. **Status Filtering** - Don't load closed/completed sessions for parents

## Performance Targets

| Metric | Before | After |
|--------|--------|-------|
| Query time | 500ms+ | <100ms |
| TTFB | 2-5s | <500ms |
| Records loaded | 5000+ | <100 |

## Prevention

- Always add `limit` to queries in server components
- Use aggregation for stats instead of loading full objects
- Review query plans for pages that display lists
- Add database indexes on frequently filtered columns
