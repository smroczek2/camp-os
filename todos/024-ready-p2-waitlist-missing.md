---
status: ready
priority: p2
issue_id: "024"
tags: [registration, waitlist, capacity, ux]
dependencies: []
---

# Waitlist Management System Missing

APPROVED - No waitlist capability when sessions reach capacity.

## Problem Statement

When a camp session is full, parents cannot join a waitlist. They simply see "Full" and have no recourse. This leads to:
- Lost potential registrations
- Parent frustration
- No automatic notification when spots open
- Manual waitlist management outside the system

## Findings

**Current Behavior:**
```typescript
// In parent dashboard
{spotsLeft <= 0 && (
  <Badge variant="outline" className="text-red-600">Full</Badge>
)}
```

No alternative path for full sessions.

**Missing Components:**
1. `waitlist` table in schema
2. Waitlist entry server action
3. Auto-promotion logic when spot opens
4. Parent notification system
5. Waitlist position display
6. Admin waitlist management

## Proposed Solutions

### Option 1: Simple Waitlist System (Recommended)

**Schema Addition:**
```typescript
export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id),
  childId: uuid("child_id").notNull().references(() => children.id),
  userId: uuid("user_id").notNull().references(() => user.id),
  position: integer("position").notNull(),
  status: text("status").default("waiting"), // waiting, offered, expired, converted
  offeredAt: timestamp("offered_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionChildUnique: unique().on(table.sessionId, table.childId),
}));
```

**Flow:**
1. Parent joins waitlist when session full
2. When spot opens, first in queue gets offer
3. Offer expires after 48 hours
4. Auto-promote next if expired
5. Convert to registration when accepted

**Effort:** 12-16 hours
**Risk:** Medium (timing/race conditions)

### Option 2: Manual Waitlist (Simpler)

Just track interest without auto-promotion.

**Effort:** 4-6 hours
**Risk:** Low but less useful

## Acceptance Criteria

- [ ] Parents can join waitlist for full sessions
- [ ] Waitlist shows position number
- [ ] Spots opening trigger offer to first in queue
- [ ] Offers expire after configurable time
- [ ] Auto-promote when offer expires
- [ ] Email notification on waitlist offer
- [ ] Admin can view/manage waitlist

## Technical Details

**New Files:**
- Migration: `drizzle/XXXX_add_waitlist.sql`
- Actions: `src/app/actions/waitlist-actions.ts`
- Component: `src/components/parent/join-waitlist-button.tsx`
- Admin: `src/components/admin/waitlist-manager.tsx`

**Background Job Needed:**
- Check for expired offers
- Auto-promote next in queue
- (Could use Vercel Cron or similar)

## Work Log

### 2025-12-22 - Initial Discovery

**By:** Missing Features Analysis Agent

**Actions:**
- Identified no waitlist capability
- Designed schema addition
- Documented auto-promotion flow
- Estimated implementation effort
