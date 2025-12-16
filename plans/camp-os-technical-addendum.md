# Camp OS Technical Addendum: Critical Implementation Details

**Related Plan:** `plans/camp-os-three-surface-platform.md`
**Created:** 2025-12-15
**Status:** Required for Implementation

This addendum addresses critical technical gaps identified during plan review. These must be implemented to avoid blocking issues during development.

---

## Overview

This document provides implementation specifications for:
1. RBAC enforcement functions
2. Missing database schema (groups, assignments, AI actions)
3. AI approval workflow
4. Database indexes and constraints
5. Service layer architecture

**Context:** The main plan describes features but lacks implementation details for security-critical systems. This addendum fills those gaps.

---

## 1. RBAC Implementation (Critical Blocker)

### Problem

The main plan shows role definitions (lines 426-486) but no enforcement mechanism. Every Server Action that checks permissions will fail without these functions.

### Solution: Complete RBAC System

#### 1.1 Permission Enforcement Function

**File:** `src/lib/rbac.ts`

```typescript
import { db } from '@/lib/db'
import { user } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

// Permission check (core function)
export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId)
  })

  if (!userRecord) return false

  const rolePermissions = ROLE_PERMISSIONS[userRecord.role as UserRole]
  if (!rolePermissions) return false

  const resourcePermissions = rolePermissions[resource]
  if (!resourcePermissions) return false

  return resourcePermissions.includes(action)
}

// Row-level ownership check
export async function ownsResource(
  userId: string,
  resourceType: 'child' | 'registration' | 'document',
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'child':
      const child = await db.query.children.findFirst({
        where: and(
          eq(children.id, resourceId),
          eq(children.userId, userId)
        )
      })
      return !!child

    case 'registration':
      const registration = await db.query.registrations.findFirst({
        where: and(
          eq(registrations.id, resourceId),
          eq(registrations.userId, userId)
        )
      })
      return !!registration

    case 'document':
      const document = await db.query.documents.findFirst({
        where: and(
          eq(documents.id, resourceId),
          eq(documents.userId, userId)
        )
      })
      return !!document

    default:
      return false
  }
}

// Staff assignment check
export async function isAssignedToChild(
  staffId: string,
  childId: string
): Promise<boolean> {
  // Get child's registration to find session
  const registration = await db.query.registrations.findFirst({
    where: eq(registrations.childId, childId)
  })

  if (!registration) return false

  // Check if staff is assigned to any group in this session
  const assignment = await db.query.assignments.findFirst({
    where: and(
      eq(assignments.staffId, staffId),
      eq(assignments.sessionId, registration.sessionId)
    )
  })

  return !!assignment
}

// Combined enforcement (use in Server Actions)
export async function enforcePermission(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<void> {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId)
  })

  if (!userRecord) {
    throw new UnauthorizedError('User not found')
  }

  // Check role-based permission
  if (!await hasPermission(userId, resource, action)) {
    throw new ForbiddenError(`${userRecord.role} cannot ${action} ${resource}`)
  }

  // For non-admins, check row-level ownership
  if (userRecord.role !== 'admin' && resourceId) {
    if (userRecord.role === 'parent') {
      const owns = await ownsResource(userId, resource as any, resourceId)
      if (!owns) {
        throw new ForbiddenError('Access denied to this resource')
      }
    } else if (userRecord.role === 'staff') {
      const assigned = await isAssignedToChild(userId, resourceId)
      if (!assigned) {
        throw new ForbiddenError('Not assigned to this child')
      }
    }
  }
}

// Role permission definitions (from main plan)
export type UserRole = 'parent' | 'staff' | 'admin' | 'nurse'

export const ROLE_PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  parent: {
    child: ['create', 'read', 'update'],
    registration: ['create', 'read', 'cancel'],
    medication: ['read'],
    medicalRecord: ['read', 'update'],
    document: ['create', 'read', 'delete'],
    incident: ['read'],
  },
  staff: {
    child: ['read'],
    registration: ['read'],
    medication: ['read'],
    incident: ['create', 'read', 'update'],
    attendance: ['create', 'update'],
  },
  nurse: {
    child: ['read'],
    registration: ['read'],
    medication: ['create', 'read', 'update', 'delete'],
    medicalRecord: ['read', 'update'],
    incident: ['create', 'read', 'update', 'resolve'],
  },
  admin: {
    child: ['create', 'read', 'update', 'delete'],
    registration: ['create', 'read', 'update', 'cancel'],
    medication: ['create', 'read', 'update', 'delete'],
    medicalRecord: ['read', 'update'],
    document: ['create', 'read', 'delete'],
    incident: ['create', 'read', 'update', 'resolve'],
    session: ['create', 'read', 'update', 'delete'],
    staff: ['read', 'update'],
  },
}

// Custom error types
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}
```

#### 1.2 Usage in Server Actions

**File:** `src/app/actions/children.ts`

```typescript
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { children } from '@/lib/schema'
import { enforcePermission } from '@/lib/rbac'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateChildSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  allergies: z.array(z.string()).optional(),
  medicalNotes: z.string().optional(),
})

export async function updateChild(
  childId: string,
  data: z.infer<typeof updateChildSchema>
) {
  const session = await auth()
  if (!session?.user) {
    throw new UnauthorizedError('Not authenticated')
  }

  // Enforce permission (throws if unauthorized)
  await enforcePermission(session.user.id, 'child', 'update', childId)

  // Validate input
  const validated = updateChildSchema.parse(data)

  // Update child
  const [updated] = await db
    .update(children)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(eq(children.id, childId))
    .returning()

  return updated
}
```

---

## 2. Missing Database Schema

### 2.1 Groups Table

**Purpose:** Organize children into groups (cabins, age groups, activity groups)

**File:** `src/lib/schema.ts` (add to existing schema)

```typescript
export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "cabin", "age_group", "activity"
  capacity: integer("capacity").notNull(),
  staffRequired: integer("staff_required").notNull().default(2),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("groups_session_idx").on(table.sessionId),
}))

export const groupsRelations = relations(groups, ({ one, many }) => ({
  session: one(sessions, {
    fields: [groups.sessionId],
    references: [sessions.id],
  }),
  assignments: many(assignments),
  members: many(groupMembers),
}))
```

### 2.2 Assignments Table

**Purpose:** Link staff to groups (enforces "staff can only view assigned children")

```typescript
export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  staffId: text("staff_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  groupId: uuid("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").notNull(), // "counselor", "assistant", "specialist"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  staffGroupIdx: index("assignments_staff_group_idx").on(table.staffId, table.groupId),
  sessionIdx: index("assignments_session_idx").on(table.sessionId),
  uniqueAssignment: uniqueIndex("assignments_staff_group_unique")
    .on(table.staffId, table.groupId),
}))

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  staff: one(user, {
    fields: [assignments.staffId],
    references: [user.id],
  }),
  group: one(groups, {
    fields: [assignments.groupId],
    references: [groups.id],
  }),
  session: one(sessions, {
    fields: [assignments.sessionId],
    references: [sessions.id],
  }),
}))
```

### 2.3 Group Members Table

**Purpose:** Link children to groups

```typescript
export const groupMembers = pgTable("group_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  childId: uuid("child_id")
    .references(() => children.id, { onDelete: "cascade" })
    .notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  groupChildIdx: index("group_members_group_child_idx").on(table.groupId, table.childId),
  uniqueMember: uniqueIndex("group_members_unique")
    .on(table.groupId, table.childId),
}))

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  child: one(children, {
    fields: [groupMembers.childId],
    references: [children.id],
  }),
}))
```

### 2.4 AI Actions Table

**Purpose:** Store AI-generated actions pending approval

```typescript
export const aiActions = pgTable("ai_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  action: text("action").notNull(), // "createSession", "createDiscount", "assignStaff"
  params: jsonb("params").notNull().$type<Record<string, any>>(),
  preview: jsonb("preview").notNull().$type<Record<string, any>>(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected", "executed"
  approvedBy: text("approved_by").references(() => user.id),
  approvedAt: timestamp("approved_at"),
  executedAt: timestamp("executed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("ai_actions_user_idx").on(table.userId),
  statusIdx: index("ai_actions_status_idx").on(table.status),
}))

export const aiActionsRelations = relations(aiActions, ({ one }) => ({
  user: one(user, {
    fields: [aiActions.userId],
    references: [user.id],
  }),
  approver: one(user, {
    fields: [aiActions.approvedBy],
    references: [user.id],
  }),
}))
```

---

## 3. AI Approval Workflow

### 3.1 AI Tool Execution with Approval

**File:** `src/lib/ai/tools.ts`

```typescript
import { z } from 'zod'
import { db } from '@/lib/db'
import { aiActions, sessions } from '@/lib/schema'

export const createSessionTool = {
  description: 'Create a new camp session',
  parameters: z.object({
    campId: z.string().uuid(),
    startDate: z.string(), // ISO date
    endDate: z.string(),
    capacity: z.number().int().positive(),
    basePrice: z.number().positive(),
  }),
  execute: async (params: z.infer<typeof createSessionTool.parameters>, userId: string) => {
    // Validate dates
    const start = new Date(params.startDate)
    const end = new Date(params.endDate)

    if (end <= start) {
      throw new Error('End date must be after start date')
    }

    // Generate preview
    const preview = {
      type: 'session',
      campId: params.campId,
      startDate: params.startDate,
      endDate: params.endDate,
      capacity: params.capacity,
      basePrice: params.basePrice,
      summary: `Session from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}, $${params.basePrice}, capacity ${params.capacity}`,
    }

    // Store in ai_actions table (pending approval)
    const [action] = await db.insert(aiActions).values({
      userId,
      action: 'createSession',
      params,
      preview,
      status: 'pending',
    }).returning()

    return {
      requiresApproval: true,
      actionId: action.id,
      preview: preview.summary,
      fullPreview: preview,
    }
  },
}

export const createDiscountTool = {
  description: 'Create a pricing discount rule',
  parameters: z.object({
    type: z.enum(['early_bird', 'sibling', 'multi_week']),
    percentage: z.number().min(0).max(100),
    expiresAt: z.string().optional(), // ISO date
    sessionId: z.string().uuid().optional(),
  }),
  execute: async (params: z.infer<typeof createDiscountTool.parameters>, userId: string) => {
    const preview = {
      type: 'discount',
      discountType: params.type,
      percentage: params.percentage,
      expiresAt: params.expiresAt,
      sessionId: params.sessionId,
      summary: `${params.percentage}% ${params.type} discount` +
        (params.expiresAt ? ` until ${new Date(params.expiresAt).toLocaleDateString()}` : ''),
    }

    const [action] = await db.insert(aiActions).values({
      userId,
      action: 'createDiscount',
      params,
      preview,
      status: 'pending',
    }).returning()

    return {
      requiresApproval: true,
      actionId: action.id,
      preview: preview.summary,
      fullPreview: preview,
    }
  },
}
```

### 3.2 Approval Workflow Actions

**File:** `src/app/actions/ai-approval.ts`

```typescript
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { aiActions, sessions, discounts } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { enforcePermission } from '@/lib/rbac'

export async function approveAIAction(actionId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // Only admins can approve AI actions
  await enforcePermission(session.user.id, 'session', 'create')

  // Get action
  const action = await db.query.aiActions.findFirst({
    where: eq(aiActions.id, actionId)
  })

  if (!action) throw new Error('Action not found')
  if (action.status !== 'pending') throw new Error('Action already processed')

  // Execute the action
  try {
    let result

    switch (action.action) {
      case 'createSession':
        [result] = await db.insert(sessions).values({
          campId: action.params.campId,
          startDate: new Date(action.params.startDate),
          endDate: new Date(action.params.endDate),
          capacity: action.params.capacity,
          price: action.params.basePrice.toString(),
          status: 'draft',
        }).returning()
        break

      case 'createDiscount':
        [result] = await db.insert(discounts).values({
          type: action.params.type,
          percentage: action.params.percentage,
          expiresAt: action.params.expiresAt ? new Date(action.params.expiresAt) : null,
          sessionId: action.params.sessionId,
        }).returning()
        break

      default:
        throw new Error(`Unknown action: ${action.action}`)
    }

    // Update action status
    await db.update(aiActions).set({
      status: 'executed',
      approvedBy: session.user.id,
      approvedAt: new Date(),
      executedAt: new Date(),
    }).where(eq(aiActions.id, actionId))

    return { success: true, result }

  } catch (error) {
    // Update action with error
    await db.update(aiActions).set({
      status: 'rejected',
      approvedBy: session.user.id,
      approvedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }).where(eq(aiActions.id, actionId))

    throw error
  }
}

export async function rejectAIAction(actionId: string, reason?: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  await enforcePermission(session.user.id, 'session', 'create')

  await db.update(aiActions).set({
    status: 'rejected',
    approvedBy: session.user.id,
    approvedAt: new Date(),
    error: reason || 'Rejected by admin',
  }).where(eq(aiActions.id, actionId))

  return { success: true }
}

export async function getPendingAIActions() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  await enforcePermission(session.user.id, 'session', 'create')

  const actions = await db.query.aiActions.findMany({
    where: eq(aiActions.status, 'pending'),
    orderBy: (aiActions, { desc }) => [desc(aiActions.createdAt)],
  })

  return actions
}
```

---

## 4. Database Indexes and Constraints

### 4.1 Required Indexes

Add to existing schema definitions:

```typescript
// children table
export const children = pgTable("children", {
  // ... existing fields
}, (table) => ({
  userIdx: index("children_user_idx").on(table.userId),
  dobIdx: index("children_dob_idx").on(table.dateOfBirth),
}))

// registrations table
export const registrations = pgTable("registrations", {
  // ... existing fields
}, (table) => ({
  userSessionIdx: index("registrations_user_session_idx").on(table.userId, table.sessionId),
  statusIdx: index("registrations_status_idx").on(table.status),
  childIdx: index("registrations_child_idx").on(table.childId),
  // Prevent duplicate registrations
  uniqueRegistration: uniqueIndex("registrations_child_session_unique")
    .on(table.childId, table.sessionId),
}))

// events table
export const events = pgTable("events", {
  // ... existing fields
}, (table) => ({
  streamIdx: index("events_stream_idx").on(table.streamId, table.version),
  typeIdx: index("events_type_idx").on(table.eventType),
  timestampIdx: index("events_timestamp_idx").on(table.timestamp),
}))

// incidents table
export const incidents = pgTable("incidents", {
  // ... existing fields
}, (table) => ({
  childIdx: index("incidents_child_idx").on(table.childId),
  typeIdx: index("incidents_type_idx").on(table.type),
  timestampIdx: index("incidents_timestamp_idx").on(table.occurredAt),
}))
```

### 4.2 Check Constraints

Add validation constraints:

```typescript
// sessions table
export const sessions = pgTable("sessions", {
  // ... existing fields
}, (table) => ({
  capacityCheck: check("capacity_positive", sql`${table.capacity} > 0`),
  dateCheck: check("end_after_start", sql`${table.endDate} > ${table.startDate}`),
}))

// medications table
export const medications = pgTable("medications", {
  // ... existing fields
}, (table) => ({
  dateCheck: check("med_end_after_start",
    sql`${table.endDate} IS NULL OR ${table.endDate} > ${table.startDate}`),
}))
```

---

## 5. Service Layer Architecture

### 5.1 Why Services Matter

Server Actions should be **thin wrappers** that call services. This improves:
- Testability (services can be unit tested)
- Reusability (same logic from API routes and Server Actions)
- Transaction management (services handle DB transactions)

### 5.2 Service Pattern

**File:** `src/services/registration-service.ts`

```typescript
import { db } from '@/lib/db'
import { registrations, children, events } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export class RegistrationService {
  async create(data: {
    userId: string
    childId: string
    sessionId: string
    amountPaid?: string
  }) {
    return db.transaction(async (tx) => {
      // Create registration
      const [registration] = await tx.insert(registrations).values({
        ...data,
        status: 'pending',
      }).returning()

      // Log event
      await tx.insert(events).values({
        streamId: `registration-${registration.id}`,
        eventType: 'RegistrationCreated',
        eventData: registration,
        version: 1,
        userId: data.userId,
      })

      return registration
    })
  }

  async cancel(registrationId: string, userId: string) {
    return db.transaction(async (tx) => {
      // Update registration
      const [registration] = await tx.update(registrations)
        .set({ status: 'canceled' })
        .where(eq(registrations.id, registrationId))
        .returning()

      // Log event
      await tx.insert(events).values({
        streamId: `registration-${registrationId}`,
        eventType: 'RegistrationCanceled',
        eventData: { registrationId, canceledBy: userId },
        version: 2,
        userId,
      })

      return registration
    })
  }

  async getByUser(userId: string) {
    return db.query.registrations.findMany({
      where: eq(registrations.userId, userId),
      with: {
        child: true,
        session: true,
      },
    })
  }
}

export const registrationService = new RegistrationService()
```

### 5.3 Using Services in Server Actions

**File:** `src/app/actions/registrations.ts`

```typescript
'use server'

import { auth } from '@/lib/auth'
import { enforcePermission } from '@/lib/rbac'
import { registrationService } from '@/services/registration-service'

export async function createRegistration(
  childId: string,
  sessionId: string
) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  await enforcePermission(session.user.id, 'registration', 'create')

  // Service handles transaction and event logging
  const registration = await registrationService.create({
    userId: session.user.id,
    childId,
    sessionId,
  })

  return registration
}

export async function cancelRegistration(registrationId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  await enforcePermission(session.user.id, 'registration', 'cancel', registrationId)

  const registration = await registrationService.cancel(
    registrationId,
    session.user.id
  )

  return registration
}
```

---

## 6. Implementation Checklist

Before starting Phase 1, ensure:

### Database
- [ ] Add `groups` table to schema
- [ ] Add `assignments` table to schema
- [ ] Add `group_members` table to schema
- [ ] Add `ai_actions` table to schema
- [ ] Add all indexes (children, registrations, events, incidents)
- [ ] Add check constraints (sessions, medications)
- [ ] Run `npm run db:generate` to create migrations
- [ ] Run `npm run db:migrate` to apply migrations

### RBAC
- [ ] Create `src/lib/rbac.ts` with all enforcement functions
- [ ] Add custom error types (`UnauthorizedError`, `ForbiddenError`)
- [ ] Export `enforcePermission`, `hasPermission`, `ownsResource`, `isAssignedToChild`
- [ ] Update Better Auth to include `role` field in session

### AI Tools
- [ ] Create `src/lib/ai/tools.ts` with tool definitions
- [ ] Implement `createSessionTool` with approval flow
- [ ] Implement `createDiscountTool` with approval flow
- [ ] Create `src/app/actions/ai-approval.ts` with approval/rejection functions

### Services
- [ ] Create `src/services/` directory
- [ ] Implement `RegistrationService`
- [ ] Implement `AttendanceService` (check-in/out)
- [ ] Implement `IncidentService`

### Error Handling
- [ ] Create error boundary components for UI
- [ ] Implement global error handler for Server Actions
- [ ] Add logging for all errors (consider Sentry or similar)

---

## 7. Next Steps

With this addendum, you're ready to start implementation:

1. **Week 1:** Implement Phase 1 (Foundation)
   - Apply all schema changes
   - Implement RBAC system
   - Set up Better Auth with roles
   - Create service layer structure

2. **Week 2:** Implement Phase 2 (Registration)
   - Build registration form
   - Implement registration service
   - Add mock payment
   - Send confirmation emails

3. **Continue** with remaining phases as planned

---

## References

- Main Plan: `plans/camp-os-three-surface-platform.md`
- OpenAI Models: `docs/openai-models-reference.md`
- Review Feedback: See `/plan_review` output
- Better Auth RBAC: https://www.better-auth.com/docs/plugins/access-control
- Drizzle Indexes: https://orm.drizzle.team/docs/indexes-constraints
