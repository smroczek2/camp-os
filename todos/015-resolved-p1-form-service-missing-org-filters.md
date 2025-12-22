---
status: resolved
priority: p1
issue_id: "015"
tags: [security, multi-tenant, data-leakage, service, critical]
dependencies: []
---

# Form Service Methods Missing Organization Filters

CRITICAL SECURITY ISSUE - The FormService class methods query forms and submissions without organization filtering, enabling cross-tenant data access.

## Problem Statement

The FormService at `src/services/form-service.ts` contains multiple methods that query data without organization context:
- `getFormComplete()` - fetches form by ID only
- `getFormsByCamp()` - no org filter on camp
- `getSubmissionsByForm()` - no org filter
- `getSubmissionsByUser()` - no org filter

This allows cross-tenant data access when these service methods are called.

**Security Severity:** CRITICAL (10/10)
**Exploitability:** HIGH - Core service methods have no isolation
**Impact:** Complete cross-tenant data leakage via service layer

## Findings

**Location:** `src/services/form-service.ts`

### Issue 1: getFormComplete (Lines 19-36)
```typescript
async getFormComplete(formId: string) {
  return db.query.formDefinitions.findFirst({
    where: eq(formDefinitions.id, formId),  // ⚠️ NO ORG FILTER
    with: {
      fields: {
        orderBy: (fields, { asc }) => [asc(fields.displayOrder)],
        with: {
          options: {
            orderBy: (options, { asc }) => [asc(options.displayOrder)],
          },
        },
      },
    },
  });
}
```

### Issue 2: getFormsByCamp (Lines 80-94)
```typescript
async getFormsByCamp(campId: string, sessionId?: string) {
  return db.query.formDefinitions.findMany({
    where: sessionId
      ? and(
          eq(formDefinitions.campId, campId),  // ⚠️ NO ORG FILTER ON CAMP
          eq(formDefinitions.sessionId, sessionId)
        )
      : eq(formDefinitions.campId, campId),  // ⚠️ NO ORG FILTER
    with: {...},
  });
}
```

### Issue 3: getSubmissionsByForm (Lines 194-215)
```typescript
async getSubmissionsByForm(formId: string) {
  return db.query.formSubmissions.findMany({
    where: eq(formSubmissions.formDefinitionId, formId),  // ⚠️ NO ORG FILTER
    with: {...},
    orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
  });
}
```

### Issue 4: getSubmissionsByUser (Lines 220-233)
```typescript
async getSubmissionsByUser(userId: string) {
  return db.query.formSubmissions.findMany({
    where: eq(formSubmissions.userId, userId),  // ⚠️ NO ORG FILTER
    with: {...},
    orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
  });
}
```

**Root Cause:**
- Service methods designed without multi-tenant context
- Direct database queries bypass RLS
- No organizationId parameter in method signatures
- Trust that callers will filter results (they don't)

## Proposed Solutions

### Option 1: Add organizationId Parameter (RECOMMENDED)

**Approach:** Add required organizationId parameter to all service methods.

**Implementation:**
```typescript
class FormService {
  async getFormComplete(formId: string, organizationId: string) {
    return db.query.formDefinitions.findFirst({
      where: and(
        eq(formDefinitions.id, formId),
        eq(formDefinitions.organizationId, organizationId)  // ✅ ORG FILTER
      ),
      with: {...},
    });
  }

  async getFormsByCamp(campId: string, organizationId: string, sessionId?: string) {
    return db.query.formDefinitions.findMany({
      where: and(
        eq(formDefinitions.campId, campId),
        eq(formDefinitions.organizationId, organizationId),  // ✅ ORG FILTER
        sessionId ? eq(formDefinitions.sessionId, sessionId) : undefined
      ),
      with: {...},
    });
  }

  async getSubmissionsByForm(formId: string, organizationId: string) {
    return db.query.formSubmissions.findMany({
      where: and(
        eq(formSubmissions.formDefinitionId, formId),
        eq(formSubmissions.organizationId, organizationId)  // ✅ ORG FILTER
      ),
      with: {...},
    });
  }

  async getSubmissionsByUser(userId: string, organizationId: string) {
    return db.query.formSubmissions.findMany({
      where: and(
        eq(formSubmissions.userId, userId),
        eq(formSubmissions.organizationId, organizationId)  // ✅ ORG FILTER
      ),
      with: {...},
    });
  }
}
```

**Pros:**
- Explicit organization filtering
- Type-safe (required parameter)
- Clear contract for callers
- Easy to audit

**Cons:**
- Breaking change for existing callers
- Need to update all call sites

**Effort:** 3-4 hours
**Risk:** Low

---

### Option 2: Accept Transaction Parameter

**Approach:** Service methods accept a transaction parameter that already has organization context set.

**Implementation:**
```typescript
import { TenantTransaction } from "@/lib/db/tenant-context";

class FormService {
  async getFormComplete(formId: string, tx?: TenantTransaction) {
    const dbOrTx = tx || db;
    return dbOrTx.query.formDefinitions.findFirst({
      where: eq(formDefinitions.id, formId),
      with: {...},
    });
  }
}

// Caller:
const form = await withOrganizationContext(orgId, async (tx) => {
  return formService.getFormComplete(formId, tx);  // RLS applies
});
```

**Pros:**
- Uses existing RLS policies
- Transaction ensures isolation
- Flexible (works with or without tx)

**Cons:**
- Callers must remember to use withOrganizationContext
- Fallback to `db` is still unsafe
- Less explicit than Option 1

**Effort:** 2-3 hours
**Risk:** Medium (easy to forget tx)

---

### Option 3: Hybrid - Required orgId + Optional tx

**Approach:** Require organizationId AND optionally accept transaction for RLS.

**Implementation:**
```typescript
class FormService {
  async getFormComplete(
    formId: string,
    organizationId: string,
    tx?: TenantTransaction
  ) {
    const dbOrTx = tx || db;
    return dbOrTx.query.formDefinitions.findFirst({
      where: and(
        eq(formDefinitions.id, formId),
        eq(formDefinitions.organizationId, organizationId)
      ),
      with: {...},
    });
  }
}
```

**Pros:**
- Defense in depth (org filter + RLS)
- Works with or without transaction
- Maximum safety

**Cons:**
- Redundant filtering
- More complex interface

**Effort:** 4 hours
**Risk:** Low

## Recommended Action

**Implement Option 1** (Add organizationId parameter) as the simplest and most explicit fix.

This makes organization filtering required and type-checked, preventing accidental cross-tenant queries.

## Technical Details

**Affected files:**
- `src/services/form-service.ts` - All methods need updating

**Methods to update:**
1. `getFormComplete()` - Add organizationId param
2. `getFormsByCamp()` - Add organizationId param
3. `getSubmissionsByForm()` - Add organizationId param
4. `getSubmissionsByUser()` - Add organizationId param
5. Any other methods that query tenant data

**Callers to update:**
```bash
grep -r "formService\." src/ --include="*.ts" --include="*.tsx"
```

**Files that call FormService:**
- `src/app/actions/form-actions.ts`
- `src/app/(site)/dashboard/admin/forms/*`
- `src/app/(site)/dashboard/parent/forms/*`

## Acceptance Criteria

- [ ] All FormService methods have organizationId parameter
- [ ] All queries filter by organizationId
- [ ] All callers updated with organizationId
- [ ] Test: Service returns only org-specific data
- [ ] Test: Cross-org form IDs return null/empty
- [ ] TypeScript enforces organizationId parameter
- [ ] No TypeScript or lint errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Pattern Recognition Specialist (Multi-Agent Analysis)

**Actions:**
- Discovered 4 FormService methods without org filtering
- Analyzed service usage across codebase
- Identified as PRIMARY source of cross-tenant data leakage
- Categorized as CRITICAL (P1) security issue
- Documented 3 solution approaches

**Learnings:**
- Service layer must enforce tenant isolation
- Direct `db.query` bypasses RLS
- Parameters make requirements explicit
- Type system can enforce security constraints

## Resources

- **Form Service:** `src/services/form-service.ts`
- **Tenant Context:** `src/lib/db/tenant-context.ts`
- **OWASP A01:2021:** Broken Access Control

## Notes

- **BLOCKS MERGE**: Core service exposes all tenant data
- This is likely why users see "same data as superuser"
- Update all callers when fixing service
- Consider adding organizationId to constructor for stateful service
