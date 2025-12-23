---
status: complete
priority: p1
issue_id: "022"
tags: [safety, emergency, contacts, liability]
dependencies: []
---

# Emergency Contact Management Missing

APPROVED - No emergency contact system. Liability risk for camp operations.

## Problem Statement

Camps cannot operate safely without knowing who to contact in emergencies. Currently:
- No emergency_contacts table in schema
- Children table has no emergency contact fields
- No way to record alternative contacts (grandparents, neighbors, etc.)
- No authorized pickup tracking

**Liability Impact:** A camp without emergency contacts cannot operate safely or legally in most jurisdictions.

## Findings

**Current State:**
- Parent user account exists with email/phone
- But no secondary emergency contacts
- No relationship field (mother, father, aunt, etc.)
- No availability times
- No authorized pickup designation

**Missing from Schema:**
```typescript
// Needs to be added
export const emergencyContacts = pgTable("emergency_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").notNull().references(() => children.id),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  priority: integer("priority").default(1), // 1 = primary, 2 = secondary
  isAuthorizedPickup: boolean("is_authorized_pickup").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Proposed Solutions

### Option 1: Full Emergency Contact System (Recommended)

**Implementation:**
1. Add `emergency_contacts` table to schema
2. Run database migration
3. Create `emergency-contact-actions.ts`
4. Build parent UI for adding contacts
5. Build admin/staff view for contact lookup
6. Add quick-dial functionality for emergencies

**Effort:** 8-12 hours
**Risk:** Low

### Option 2: Extend Children Table

Add emergency contact fields directly to children table.

**Pros:** Simpler, fewer joins
**Cons:** Limited to 1-2 contacts

**Effort:** 4-6 hours
**Risk:** Low but less flexible

## Acceptance Criteria

- [ ] Parents can add multiple emergency contacts per child
- [ ] Contacts have relationship and phone number
- [ ] Authorized pickup can be designated
- [ ] Staff can quickly access emergency contacts
- [ ] Priority ordering (who to call first)
- [ ] Notes field for special instructions

## Technical Details

**New Files:**
- Migration: `drizzle/XXXX_add_emergency_contacts.sql`
- Actions: `src/app/actions/emergency-contact-actions.ts`
- Component: `src/components/parent/emergency-contacts-form.tsx`
- View: `src/components/admin/child-emergency-contacts.tsx`

**Schema Addition:**
```typescript
// Add to src/lib/schema.ts
export const emergencyContacts = pgTable("emergency_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").notNull().references(() => children.id),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  priority: integer("priority").default(1),
  isAuthorizedPickup: boolean("is_authorized_pickup").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Work Log

### 2025-12-22 - Initial Discovery

**By:** Missing Features Analysis Agent

**Actions:**
- Identified complete absence of emergency contact system
- Assessed liability implications
- Designed schema addition
- Documented implementation approach
