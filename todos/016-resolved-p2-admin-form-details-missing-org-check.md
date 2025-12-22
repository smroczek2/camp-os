---
status: resolved
priority: p2
issue_id: "016"
tags: [security, multi-tenant, forms, authorization]
dependencies: ["011", "015"]
---

# Admin Form Details Page Missing Organization Verification

HIGH SEVERITY - The admin form details page fetches form data by ID without verifying the form belongs to the user's organization.

## Problem Statement

The admin form details page at `/dashboard/admin/forms/[formId]/page.tsx` queries a form by its ID without checking if the form's organizationId matches the user's active organization. This allows:
- Admin from Org A can view form details from Org B by guessing/knowing the form ID
- Direct URL manipulation grants access to any form
- Related submissions may also be exposed

**Security Severity:** HIGH (8/10)
**Exploitability:** MEDIUM - Requires knowing/guessing form UUID
**Impact:** Cross-tenant form configuration and submission exposure

## Findings

**Location:** `src/app/(site)/dashboard/admin/forms/[formId]/page.tsx` (Lines 28-47)

**Vulnerable Code:**
```typescript
const form = await db.query.formDefinitions.findFirst({
  where: eq(formDefinitions.id, formId),  // ⚠️ NO ORG CHECK
  with: {
    camp: true,
    session: true,
    fields: {
      orderBy: (fields: any, { asc }: any) => [asc(fields.displayOrder)],
      with: {
        options: {
          orderBy: (options: any, { asc }: any) => [asc(options.displayOrder)],
        },
      },
    },
    submissions: { columns: { id: true } },
  },
});

if (!form) {
  notFound();
}
// ⚠️ No check: form.organizationId !== session.user.activeOrganizationId
```

## Proposed Solutions

### Option 1: Add Organization Verification (RECOMMENDED)

**Implementation:**
```typescript
export default async function FormDetailPage({ params }: FormDetailPageProps) {
  const { formId } = await params;
  const session = await getSession();

  if (!session?.user) redirect("/login");
  if (!session.user.activeOrganizationId) redirect("/select-organization");

  // Use withOrganizationContext to enforce RLS
  const form = await withOrganizationContext(
    session.user.activeOrganizationId,
    async (tx) => {
      return tx.query.formDefinitions.findFirst({
        where: eq(formDefinitions.id, formId),
        with: {...},
      });
    }
  );

  // RLS will return null if form not in user's org
  if (!form) {
    notFound();  // Returns 404 for wrong org (secure)
  }

  return <FormDetailUI form={form} />;
}
```

**Effort:** 1 hour
**Risk:** Low

## Technical Details

**Affected files:**
- `src/app/(site)/dashboard/admin/forms/[formId]/page.tsx` (Lines 28-47)

**Dependencies:**
- Depends on todo-011 (forms page org filter) pattern
- Depends on todo-015 (FormService org filter) if using service

## Acceptance Criteria

- [ ] Form details only accessible for org's forms
- [ ] Cross-org form IDs return 404
- [ ] Uses withOrganizationContext or explicit org filter
- [ ] Test: Admin from Org A cannot view Org B's form details
- [ ] No TypeScript or lint errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Security Review (Multi-Agent Analysis)

**Actions:**
- Found missing organization check in form details page
- Identified as HIGH severity (requires knowing UUID)
- Linked to parent issue (forms page - todo-011)
- Documented solution approach
