---
status: complete
priority: p2
issue_id: "017"
tags: [security, multi-tenant, forms, submissions, authorization]
dependencies: ["011", "015"]
---

# Admin Submission Detail Page Missing Organization Verification

HIGH SEVERITY - The admin submission detail page fetches submission data by ID without verifying the submission belongs to the user's organization.

## Problem Statement

The admin submission detail page at `/dashboard/admin/forms/[formId]/submissions/[submissionId]/page.tsx` queries submissions without organization filtering. This allows:
- Admin from Org A can view submission details from Org B
- Sensitive child/parent data exposed across tenants
- Medical and registration information leaked

**Security Severity:** HIGH (9/10)
**Exploitability:** MEDIUM - Requires knowing submission UUID
**Impact:** PII and sensitive data exposure across tenants

## Findings

**Location:** `src/app/(site)/dashboard/admin/forms/[formId]/submissions/[submissionId]/page.tsx` (Lines 25-67)

**Vulnerable Code:**
```typescript
const submission = await db.query.formSubmissions.findFirst({
  where: and(
    eq(formSubmissions.id, submissionId),
    eq(formSubmissions.formDefinitionId, formId)  // ⚠️ NO ORG CHECK
  ),
  with: {
    user: { columns: { id: true, name: true, email: true } },
    child: { columns: { firstName: true, lastName: true } },
    session: {...},
    formDefinition: {...},
  },
});
```

## Proposed Solutions

### Option 1: Add Organization Verification (RECOMMENDED)

**Implementation:**
```typescript
export default async function SubmissionDetailPage({ params }: Props) {
  const { formId, submissionId } = await params;
  const session = await getSession();

  if (!session?.user) redirect("/login");
  if (!session.user.activeOrganizationId) redirect("/select-organization");

  const submission = await withOrganizationContext(
    session.user.activeOrganizationId,
    async (tx) => {
      return tx.query.formSubmissions.findFirst({
        where: and(
          eq(formSubmissions.id, submissionId),
          eq(formSubmissions.formDefinitionId, formId)
        ),
        with: {...},
      });
    }
  );

  if (!submission) {
    notFound();  // Returns 404 for wrong org
  }

  return <SubmissionDetailUI submission={submission} />;
}
```

**Effort:** 1 hour
**Risk:** Low

## Acceptance Criteria

- [ ] Submission details only accessible for org's submissions
- [ ] Cross-org submission IDs return 404
- [ ] Uses withOrganizationContext or explicit org filter
- [ ] Test: Admin from Org A cannot view Org B's submissions
- [ ] No TypeScript or lint errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Security Review (Multi-Agent Analysis)

**Actions:**
- Found missing organization check in submission details page
- Identified as HIGH severity (exposes PII)
- Linked to parent issues (forms page, form service)
- Documented solution approach
