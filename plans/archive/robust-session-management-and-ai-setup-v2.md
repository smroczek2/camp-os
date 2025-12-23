# Robust Session Management & AI-Native Setup (v2)

**Created:** 2025-12-18
**Revised:** 2025-12-18 (incorporating reviewer feedback)
**Type:** Feature Enhancement + AI-First Experiment
**Priority:** Critical

---

## Overview

This plan has two goals:

1. **Fix session management** - Make it robust, clear, and capable
2. **Experiment with AI-native software** - What does AI-first camp setup look like?

The architecture must support both a comprehensive manual flow AND an AI-driven setup mode that uses the same underlying capabilities.

### Problem Statement

1. **Terminology confusion**: Camps vs sessions relationship unclear
2. **Too light**: Sessions only have dates, price, capacity, status
3. **No form attachment during creation**: Separate workflow required
4. **No eligibility restrictions**: Can't filter by age or grade
5. **No AI-first path**: Manual-only setup

### Design Principles

1. **Session-level only** - No org-level settings inheritance (simplicity)
2. **AI-compatible architecture** - Manual wizard and AI use same backend
3. **AI is collaborative** - Asks questions, confirms before acting, never assumes
4. **Comprehensive but focused** - Build what's needed, skip speculative features

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interfaces                          │
├────────────────────────┬────────────────────────────────────────┤
│     Manual Wizard      │           AI Setup Mode                │
│  (form-based, steps)   │    (conversational, collaborative)     │
└───────────┬────────────┴──────────────────┬─────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Session Actions API                          │
│  - createSession(data)                                          │
│  - updateSession(id, data)                                      │
│  - attachFormsToSession(sessionId, formIds[])                   │
│  - setSessionEligibility(sessionId, {minAge, maxAge, ...})      │
│  - duplicateSession(id, newDates)                               │
│  - createSessionBatch(template, dates[])                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                             │
│  sessions, session_forms, forms, camps, registrations           │
└─────────────────────────────────────────────────────────────────┘
```

**Key Point:** AI doesn't bypass the system - it drives the same actions a human would use.

---

## Database Schema Changes

### Modified Sessions Table

Add fields directly to sessions (no separate settings table):

```typescript
// src/lib/schema.ts - additions to existing sessions table

export const sessions = pgTable("sessions", {
  // Existing fields
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  campId: uuid("camp_id").references(() => camps.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // NEW: Basic info
  name: text("name"), // Optional override, defaults to "[Camp] - [Dates]"
  description: text("description"),

  // NEW: Eligibility
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  minGrade: integer("min_grade"), // -1=PreK, 0=K, 1-12=grades
  maxGrade: integer("max_grade"),

  // NEW: Registration window
  registrationOpenDate: timestamp("registration_open_date"),
  registrationCloseDate: timestamp("registration_close_date"),

  // NEW: Additional details
  specialInstructions: text("special_instructions"),
  whatToBring: text("what_to_bring"),
});
```

### New Junction Table: Session Forms

```typescript
// src/lib/schema.ts

export const sessionForms = pgTable(
  "session_forms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    formId: uuid("form_id")
      .references(() => forms.id, { onDelete: "cascade" })
      .notNull(),
    required: boolean("required").default(true),
    displayOrder: integer("display_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueIdx: uniqueIndex("session_form_unique").on(table.sessionId, table.formId),
  })
);

// Relations
export const sessionFormsRelations = relations(sessionForms, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionForms.sessionId],
    references: [sessions.id],
  }),
  form: one(forms, {
    fields: [sessionForms.formId],
    references: [forms.id],
  }),
}));
```

**What's NOT included (per simplification):**
- No `organization_settings` table
- No `session_settings` table
- No discount fields (sibling, early bird, multi-week)
- No waitlist fields
- No gender capacity fields
- No grade calculation method (use simple grade numbers)
- No deadline types for forms

---

## Implementation Phases

### Phase 1: Terminology & Schema Foundation (3-4 days)

**Goal:** Clear terminology + database ready for new fields

#### Tasks

1. **Fix terminology in UI**
   - Change "Manage Camps" → "Programs & Sessions" in sidebar
   - Add tooltip: "Programs are reusable camp types. Sessions are specific dates you offer."
   - Update page titles and button labels

2. **Run database migration**
   - Add new columns to sessions table
   - Create session_forms junction table
   - Generate and run migration

3. **Update TypeScript types**
   - Regenerate Drizzle types
   - Update any interfaces that reference sessions

#### Files to Modify

```
src/lib/schema.ts                           - Add new fields + session_forms table
src/app/(site)/dashboard/admin/camps/page.tsx - Update title, add tooltip
src/components/admin/create-camp-dialog.tsx  - Rename to "Create Program"
src/components/ui/sidebar.tsx (or nav)      - Update nav label
```

#### Success Criteria

- [ ] "Programs & Sessions" terminology consistent across admin UI
- [ ] Tooltip explains relationship on hover
- [ ] Database has new columns (even if UI doesn't use them yet)
- [ ] TypeScript compiles with new schema

---

### Phase 2: Enhanced Session Creation (4-5 days)

**Goal:** Session creation includes all new fields + form attachment

#### Approach: Enhanced Dialog, Not Wizard

Instead of a 6-step wizard, enhance the existing dialog with collapsible sections:

```
┌─────────────────────────────────────────────────────────────────┐
│ Create Session                                              [x] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Program*: [Summer Adventure Camp ▼]                             │
│                                                                 │
│ ▼ Dates & Pricing                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Start Date*: [Jun 15, 2025]  End Date*: [Jun 20, 2025]     │ │
│ │ Price*: [$500.00]            Capacity*: [30]               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ▶ Eligibility (optional)                                        │
│                                                                 │
│ ▶ Required Forms (optional)                                     │
│                                                                 │
│ ▶ Additional Details (optional)                                 │
│                                                                 │
│                          [Cancel]  [Create Session]             │
└─────────────────────────────────────────────────────────────────┘

When "Eligibility" expanded:
│ ▼ Eligibility                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Age Range: [8] to [12] years old                           │ │
│ │ Grade Range: [3rd ▼] to [6th ▼]                            │ │
│ │                                                             │ │
│ │ Preview: "Ages 8-12, Grades 3-6"                           │ │
│ └─────────────────────────────────────────────────────────────┘ │

When "Required Forms" expanded:
│ ▼ Required Forms                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [x] Medical Information Form          [Required ▼]         │ │
│ │ [x] Liability Waiver                  [Required ▼]         │ │
│ │ [ ] Photo/Video Release               [Optional ▼]         │ │
│ │ [ ] Emergency Contact Form            [Optional ▼]         │ │
│ │                                                             │ │
│ │ [+ Create New Form]                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
```

#### Component Structure

```typescript
// src/components/admin/create-session-dialog.tsx (enhanced)

export function CreateSessionDialog({ campId, campName }: Props) {
  const form = useForm<CreateSessionInput>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      campId,
      status: "draft",
    },
  });

  return (
    <Dialog>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Session</DialogTitle>
          <DialogDescription>
            Create a new session for {campName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Always visible: Program selector (if no campId passed) */}
            {!campId && <ProgramSelector control={form.control} />}

            {/* Always visible: Dates & Pricing */}
            <DatesAndPricingSection control={form.control} />

            {/* Collapsible: Eligibility */}
            <Collapsible>
              <CollapsibleTrigger>Eligibility (optional)</CollapsibleTrigger>
              <CollapsibleContent>
                <EligibilitySection control={form.control} />
              </CollapsibleContent>
            </Collapsible>

            {/* Collapsible: Forms */}
            <Collapsible>
              <CollapsibleTrigger>Required Forms (optional)</CollapsibleTrigger>
              <CollapsibleContent>
                <FormsSection
                  control={form.control}
                  availableForms={availableForms}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Collapsible: Additional Details */}
            <Collapsible>
              <CollapsibleTrigger>Additional Details (optional)</CollapsibleTrigger>
              <CollapsibleContent>
                <AdditionalDetailsSection control={form.control} />
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button type="submit">Create Session</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

#### Server Actions (AI-Compatible)

These actions will be used by both the manual UI and AI:

```typescript
// src/app/actions/session-actions.ts

export async function createSessionAction(
  input: CreateSessionInput
): Promise<ActionResult<Session>> {
  // Validate
  // Check permissions
  // Create session
  // Attach forms if provided
  // Log event
  // Return result
}

export async function attachFormsToSessionAction(
  sessionId: string,
  formIds: string[],
  required: boolean[] = []
): Promise<ActionResult<void>> {
  // Validate session exists
  // Validate forms exist
  // Create session_forms records
  // Return result
}

export async function updateSessionEligibilityAction(
  sessionId: string,
  eligibility: { minAge?: number; maxAge?: number; minGrade?: number; maxGrade?: number }
): Promise<ActionResult<void>> {
  // Update session with eligibility fields
}

export async function duplicateSessionAction(
  sessionId: string,
  newDates: { startDate: Date; endDate: Date }
): Promise<ActionResult<Session>> {
  // Copy session with new dates
  // Copy form attachments
  // Return new session
}

export async function createSessionBatchAction(
  template: Omit<CreateSessionInput, 'startDate' | 'endDate'>,
  dates: Array<{ startDate: Date; endDate: Date }>
): Promise<ActionResult<Session[]>> {
  // Create multiple sessions from template
  // Used by AI for "create 3 weeks of camp"
}
```

#### Files to Create/Modify

```
src/components/admin/create-session-dialog.tsx      - Enhance with sections
src/components/admin/session-form/dates-pricing-section.tsx
src/components/admin/session-form/eligibility-section.tsx
src/components/admin/session-form/forms-section.tsx
src/components/admin/session-form/additional-details-section.tsx
src/app/actions/session-actions.ts                  - New comprehensive actions
src/lib/validations/session.ts                      - Zod schemas
```

#### Success Criteria

- [ ] Can create session with all new fields in single dialog
- [ ] Can attach forms during session creation
- [ ] Collapsible sections keep UI clean
- [ ] Actions are granular and reusable (AI-compatible)
- [ ] Form attachment creates junction table records

---

### Phase 3: Eligibility Display for Parents (2-3 days)

**Goal:** Parents see which sessions their children are eligible for

#### Parent-Facing UI

```
┌─────────────────────────────────────────────────────────────────┐
│ Summer Adventure Camp - Week 1                                  │
│ June 15-20, 2025 | $500 | 12/30 spots                          │
│                                                                 │
│ Ages 8-12 | Grades 3-6                                         │
│                                                                 │
│ Your children:                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✓ Emma (age 10, Grade 5)         [Register]                │ │
│ │ ✗ Jack (age 6, Grade 1)          Too young (min age 8)     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Eligibility Service

```typescript
// src/services/eligibility-service.ts

interface EligibilityCheck {
  eligible: boolean;
  reason?: string;
}

export function checkEligibility(
  child: { birthDate: Date; grade?: number },
  session: { startDate: Date; minAge?: number; maxAge?: number; minGrade?: number; maxGrade?: number }
): EligibilityCheck {
  // Calculate age at session start
  const age = calculateAge(child.birthDate, session.startDate);

  // Check age
  if (session.minAge != null && age < session.minAge) {
    return { eligible: false, reason: `Too young (min age ${session.minAge})` };
  }
  if (session.maxAge != null && age > session.maxAge) {
    return { eligible: false, reason: `Too old (max age ${session.maxAge})` };
  }

  // Check grade (if child has grade and session has grade restrictions)
  if (child.grade != null) {
    if (session.minGrade != null && child.grade < session.minGrade) {
      return { eligible: false, reason: `Grade too low (min ${getGradeLabel(session.minGrade)})` };
    }
    if (session.maxGrade != null && child.grade > session.maxGrade) {
      return { eligible: false, reason: `Grade too high (max ${getGradeLabel(session.maxGrade)})` };
    }
  }

  return { eligible: true };
}

function calculateAge(birthDate: Date, asOfDate: Date): number {
  const age = asOfDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = asOfDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOfDate.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  return age;
}

function getGradeLabel(grade: number): string {
  if (grade === -1) return "Pre-K";
  if (grade === 0) return "Kindergarten";
  return `Grade ${grade}`;
}
```

#### Files to Create/Modify

```
src/services/eligibility-service.ts                 - Eligibility logic
src/components/parent/session-card.tsx              - Add eligibility display
src/components/parent/eligibility-badge.tsx         - Reusable badge component
src/components/parent/register-session-dialog.tsx   - Block ineligible registrations
```

#### Success Criteria

- [ ] Parents see eligibility status per child on session cards
- [ ] Clear reason shown when child is ineligible
- [ ] Cannot register ineligible child (blocked with message)
- [ ] Eligibility calculated at session start date

---

### Phase 4: AI Setup Mode (5-7 days)

**Goal:** Experiment with AI-native session setup

#### Design Philosophy

The AI should be:
- **Collaborative** - Asks questions, doesn't assume
- **Transparent** - Shows what it's about to do before doing it
- **Correctable** - Easy to modify suggestions
- **Educational** - Explains why it suggests things

#### AI Setup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ AI Session Setup                                        [Beta] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 Hi! I'll help you set up sessions for your camp.        │ │
│ │    Tell me what you're planning.                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 I want to create a summer STEM camp for middle schoolers│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 Great! A STEM camp for middle schoolers. Let me ask a   │ │
│ │    few questions to set this up right:                     │ │
│ │                                                             │ │
│ │    1. What age range? (middle school is typically 11-14)   │ │
│ │    2. Day camp or overnight?                               │ │
│ │    3. How many sessions/weeks are you running?             │ │
│ │    4. What dates?                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 Ages 11-14, day camp, 2 weeks starting July 7th         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 Got it! Here's what I'll create:                        │ │
│ │                                                             │ │
│ │    Program: "STEM Camp" (I'll create this)                 │ │
│ │                                                             │ │
│ │    Session 1: July 7-11, 2025                              │ │
│ │    Session 2: July 14-18, 2025                             │ │
│ │                                                             │ │
│ │    Both sessions:                                          │ │
│ │    • Ages 11-14                                            │ │
│ │    • Grades 6-8                                            │ │
│ │    • Price: [What do you charge?]                          │ │
│ │    • Capacity: [How many kids per session?]                │ │
│ │                                                             │ │
│ │    Recommended forms for STEM camps:                       │ │
│ │    ✓ Medical Information                                   │ │
│ │    ✓ Liability Waiver                                      │ │
│ │    ✓ Technology Use Agreement                              │ │
│ │                                                             │ │
│ │    [Edit details]  [Looks good, create!]                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Type your message...]                              [Send →]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### AI Tools (Function Calling)

```typescript
// src/app/api/ai/session-setup/route.ts

const tools = {
  askClarifyingQuestion: {
    description: "Ask the user a clarifying question before proceeding",
    parameters: z.object({
      question: z.string(),
      options: z.array(z.string()).optional(), // Suggested answers
      required: z.boolean().default(true),
    }),
  },

  proposeSessionPlan: {
    description: "Show the user a preview of sessions to create (requires confirmation)",
    parameters: z.object({
      program: z.object({
        name: z.string(),
        description: z.string().optional(),
        isNew: z.boolean(), // Whether to create new or use existing
      }),
      sessions: z.array(z.object({
        name: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        price: z.number().optional(), // Null if needs user input
        capacity: z.number().optional(),
        minAge: z.number().optional(),
        maxAge: z.number().optional(),
        minGrade: z.number().optional(),
        maxGrade: z.number().optional(),
      })),
      recommendedForms: z.array(z.object({
        name: z.string(),
        reason: z.string(),
      })),
    }),
  },

  createSessions: {
    description: "Actually create the sessions (only after user confirms)",
    parameters: z.object({
      confirmed: z.boolean(),
      plan: z.any(), // The confirmed plan
    }),
  },

  lookupExistingPrograms: {
    description: "Check what programs already exist for this organization",
    parameters: z.object({}),
  },

  lookupExistingForms: {
    description: "Check what forms already exist for this organization",
    parameters: z.object({}),
  },
};
```

#### System Prompt

```typescript
const systemPrompt = `You are a helpful assistant for setting up camp sessions.

IMPORTANT RULES:
1. NEVER assume details the user didn't provide
2. ALWAYS ask clarifying questions before creating anything
3. ALWAYS show a preview and get confirmation before creating sessions
4. Be conversational and friendly, not robotic
5. Explain your suggestions when relevant ("STEM camps typically need a tech agreement form")

WORKFLOW:
1. Understand what the user wants to create
2. Ask clarifying questions for any missing required info:
   - Age range (required)
   - Session type: day camp or overnight
   - Number of sessions/duration
   - Dates
   - Price (can suggest but must confirm)
   - Capacity (can suggest but must confirm)
3. Use proposeSessionPlan to show preview
4. Wait for user confirmation or edits
5. Only use createSessions after explicit confirmation

You can suggest reasonable defaults but must confirm:
- Middle school = ages 11-14, grades 6-8
- Elementary = ages 6-10, grades 1-5
- Day camp typically runs Mon-Fri
- Form recommendations based on camp type

When user says things like "create", "make", or "set up" sessions,
first gather info, then propose, then wait for "looks good" or similar.`;
```

#### Files to Create

```
src/app/(site)/dashboard/admin/sessions/ai-setup/page.tsx  - AI setup page
src/app/api/ai/session-setup/route.ts                      - AI streaming endpoint
src/components/admin/ai-setup/ai-chat.tsx                  - Chat interface
src/components/admin/ai-setup/session-preview.tsx          - Preview card
src/components/admin/ai-setup/confirmation-panel.tsx       - Confirm before create
src/lib/ai/session-setup-tools.ts                          - Tool implementations
src/lib/ai/session-setup-prompt.ts                         - System prompt
```

#### Success Criteria

- [ ] Can describe camp in natural language
- [ ] AI asks clarifying questions (doesn't assume)
- [ ] Preview shown before any creation
- [ ] User can modify preview before confirming
- [ ] Sessions created using same actions as manual flow
- [ ] Forms can be recommended and attached
- [ ] Works for single session and batch creation

---

## Summary

### What's Different from v1

| Aspect | v1 Plan | v2 Plan |
|--------|---------|---------|
| Settings | Org-level + Session-level with inheritance | Session-level only |
| Tables | 3 new tables (org_settings, session_settings, session_forms) | 1 new table (session_forms) + columns on sessions |
| Wizard | 6-step wizard with drafts | Enhanced dialog with collapsible sections |
| AI | Generates everything autonomously | Collaborative, asks questions, confirms |
| AI Position | Phase 5, post-MVP | Phase 4, core experiment |
| Grade Logic | Rising/current/completed with school year | Simple grade numbers |
| Discounts | Full system (sibling, early bird, multi-week) | Deferred |
| Waitlist | Full system | Deferred |
| Timeline | 7 weeks | 3-4 weeks |

### Files Summary

**Phase 1 (3-4 days):**
- Modify: schema.ts, camps/page.tsx, create-camp-dialog.tsx, nav
- Create: migration file

**Phase 2 (4-5 days):**
- Modify: create-session-dialog.tsx
- Create: 4 section components, session-actions.ts, validation schemas

**Phase 3 (2-3 days):**
- Create: eligibility-service.ts, eligibility-badge.tsx
- Modify: session-card.tsx, register-session-dialog.tsx

**Phase 4 (5-7 days):**
- Create: AI setup page, API route, chat components, tools, prompt

### Total: ~15-19 days (3-4 weeks)

---

## Future Enhancements (Not in Scope)

These are explicitly deferred:
- Organization-level settings and inheritance
- Discount system (sibling, early bird, multi-week)
- Payment plans
- Waitlist management
- Grade calculation methods (rising/current/completed)
- Form deadlines and enforcement
- Gender-specific capacity
- Multi-location support

These can be added later without breaking the current architecture.
