---
title: Emergency Contact Management System Implementation
category: feature-implementations
tags: [safety, emergency, liability, contacts, business-critical, drizzle-orm, server-actions]
severity: critical
date_solved: 2025-12-22
components: [src/lib/schema.ts, src/app/actions/emergency-contact-actions.ts, src/components/parent/emergency-contacts-form.tsx]
symptoms: >-
  Camp OS had no emergency contact system. Children records lacked secondary contact fields, no relationship
  designation, no authorized pickup tracking. Significant liability risk - camps cannot operate safely
  without knowing who to contact in emergencies.
root_cause: >-
  Emergency contacts were deferred as a future feature during initial MVP planning. Feature was added
  to backlog but not prioritized until liability implications were recognized.
---

# Emergency Contact Management System

## Overview

Complete CRUD system for managing emergency contacts per child with:
- Multiple contacts per child with priority ordering
- Authorized pickup designation
- Role-based access (parents own children, admins all)
- Staff quick-lookup capability

## Implementation

### 1. Database Schema

Added `emergency_contacts` table to `src/lib/schema.ts`:

```typescript
export const emergencyContacts = pgTable(
  "emergency_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    childId: uuid("child_id")
      .references(() => children.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    relationship: text("relationship").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    priority: integer("priority").notNull().default(1),
    isAuthorizedPickup: boolean("is_authorized_pickup").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    childIdx: index("emergency_contacts_child_idx").on(table.childId),
    priorityIdx: index("emergency_contacts_priority_idx").on(table.childId, table.priority),
  })
);
```

Added relations:

```typescript
export const childrenRelations = relations(children, ({ one, many }) => ({
  // ...existing
  emergencyContacts: many(emergencyContacts),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  child: one(children, {
    fields: [emergencyContacts.childId],
    references: [children.id],
  }),
}));
```

### 2. Server Actions

Created `src/app/actions/emergency-contact-actions.ts`:

- `createEmergencyContactAction` - Add new contact with ownership verification
- `updateEmergencyContactAction` - Update with partial fields
- `deleteEmergencyContactAction` - Remove with ownership check
- `getEmergencyContactsForChild` - Fetch for staff/admin view

Key pattern - ownership verification:

```typescript
// Verify the user owns this child
const child = await db.query.children.findFirst({
  where: eq(children.id, parsed.data.childId),
});

// Parents can only add contacts to their own children
// Admins can add contacts to any child
if (session.user.role !== "admin" && child.userId !== session.user.id) {
  return { success: false, error: "You can only add contacts to your own children" };
}
```

### 3. UI Components

Created `src/components/parent/emergency-contacts-form.tsx`:

- `AddEmergencyContactDialog` - Modal form for adding contacts
- `EmergencyContactCard` - Display card with delete action
- `EmergencyContactsList` - Complete list with add button

## Database Migration

```bash
npm run db:generate  # Generated migration
npm run db:push      # Applied to database
```

## Usage

```tsx
import { EmergencyContactsList } from "@/components/parent/emergency-contacts-form";

// In parent dashboard or child detail page
<EmergencyContactsList
  childId={child.id}
  childName={`${child.firstName} ${child.lastName}`}
  contacts={child.emergencyContacts}
/>
```

## Security Considerations

- Parents can only manage their own children's contacts
- Admins can manage any child's contacts
- Staff can view (read-only) any child's contacts
- All mutations require authentication
- Input validated with Zod schemas
