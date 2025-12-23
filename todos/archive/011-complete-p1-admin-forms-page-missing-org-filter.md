---
status: complete
priority: p1
issue_id: "011"
tags: [security, multi-tenant, data-leakage, forms, critical]
dependencies: []
---

# Admin Forms Page Missing Organization Filter - Complete Data Breach

CRITICAL SECURITY ISSUE - Admin forms page queries ALL forms from ALL organizations without any filtering.

## Problem Statement

The admin forms page at `/dashboard/admin/forms` uses a raw database query without any organization filtering. This means:
- Admin from Organization A sees ALL forms from Organizations A, B, C, etc.
- Form submissions, field counts, and sensitive metadata exposed across tenants
- Complete violation of multi-tenant isolation
- Potential HIPAA/COPPA violations for health/child data

**Security Severity:** CRITICAL (10/10)
**Exploitability:** HIGH - Requires only a logged-in admin user
**Impact:** Complete cross-tenant data leakage

## Findings

**Location:** `src/app/(site)/dashboard/admin/forms/page.tsx` (Lines 26-58)

**Vulnerable Code:**
```typescript
// Line 26-58: NO organizationId FILTER - QUERIES ALL ORGS
const forms = await db
  .select({
    id: formDefinitions.id,
    campId: formDefinitions.campId,
    sessionId: formDefinitions.sessionId,
    createdBy: formDefinitions.createdBy,
    name: formDefinitions.name,
    description: formDefinitions.description,
    formType: formDefinitions.formType,
    status: formDefinitions.status,
    isPublished: formDefinitions.isPublished,
    // ... more fields
  })
  .from(formDefinitions)
  .leftJoin(camps, eq(formDefinitions.campId, camps.id))
  .leftJoin(sessions, eq(formDefinitions.sessionId, sessions.id))
  .leftJoin(formFields, eq(formFields.formDefinitionId, formDefinitions.id))
  .leftJoin(formSubmissions, eq(formSubmissions.formDefinitionId, formDefinitions.id))
  .groupBy(...)
  .orderBy(desc(formDefinitions.createdAt));
```

**Root Cause:**
- Uses raw `db.select()` instead of `withOrganizationContext()`
- Does NOT set `app.current_organization_id` PostgreSQL session variable
- RLS policies are BYPASSED because no transaction context is established
- No WHERE clause filtering by organizationId

**Proof of Vulnerability:**
1. Create Organization A "Pine Ridge Camp" with an admin user
2. Create Organization B "Oak Valley Camp" with forms
3. Login as admin@pineridge.com
4. Navigate to `/dashboard/admin/forms`
5. Admin sees ALL forms from ALL organizations, including Oak Valley's sensitive forms

## Proposed Solutions

### Option 1: Use withOrganizationContext (RECOMMENDED)

**Approach:** Wrap the query in `withOrganizationContext()` to automatically apply RLS policies.

**Implementation:**
```typescript
export default async function FormsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (userRole !== "admin" && userRole !== "super_admin") {
    redirect("/dashboard");
  }

  // CRITICAL: Require active organization
  if (!session.user.activeOrganizationId) {
    redirect("/select-organization");
  }

  // CRITICAL: Verify membership before proceeding
  await verifyOrganizationMembership(
    session.user.id,
    session.user.activeOrganizationId
  );

  // Use withOrganizationContext to apply RLS policies
  const forms = await withOrganizationContext(
    session.user.activeOrganizationId,
    async (tx) => {
      return tx
        .select({
          id: formDefinitions.id,
          // ... same fields
        })
        .from(formDefinitions)
        .leftJoin(camps, eq(formDefinitions.campId, camps.id))
        // ... rest of query
        // RLS automatically filters by organizationId
    }
  );

  return <FormsPageUI forms={forms} />;
}
```

**Pros:**
- Uses existing RLS policies
- Consistent with other protected pages (admin/page.tsx)
- Automatic filtering via PostgreSQL session variable
- Transaction-safe (prevents connection pool issues)

**Cons:**
- Requires activeOrganizationId to be set
- Need to add membership verification helper

**Effort:** 1-2 hours
**Risk:** Low

---

### Option 2: Explicit WHERE Clause Filter

**Approach:** Add explicit `WHERE organizationId = ?` clause to the query.

**Implementation:**
```typescript
const forms = await db
  .select({...})
  .from(formDefinitions)
  .where(eq(formDefinitions.organizationId, session.user.activeOrganizationId))
  .leftJoin(camps, eq(formDefinitions.campId, camps.id))
  // ...
```

**Pros:**
- Simple to implement
- Clear and explicit filtering
- Works without RLS

**Cons:**
- Requires organizationId on every query
- Easy to forget in future queries
- Doesn't leverage existing RLS policies
- Duplicates filtering logic

**Effort:** 30 minutes
**Risk:** Medium (easy to forget in future code)

---

### Option 3: Move Page to Org-Scoped Route

**Approach:** Move the forms page from `(site)/dashboard/admin/forms` to `org/[slug]/admin/forms`.

**Implementation:**
- Delete `src/app/(site)/dashboard/admin/forms/*`
- Create `src/app/org/[slug]/admin/forms/page.tsx`
- Org layout already handles organization context

**Pros:**
- URL makes organization context explicit
- Consistent with other org-scoped routes
- Layout handles organization verification

**Cons:**
- Breaking change for existing URLs
- Need to update all navigation links
- More significant refactoring

**Effort:** 4-6 hours
**Risk:** Medium (requires URL changes)

## Recommended Action

**Implement Option 1** (withOrganizationContext) as the immediate fix. This:
- Follows existing patterns (admin dashboard uses this pattern)
- Leverages RLS policies already defined
- Requires minimal code changes
- Can be implemented immediately

**Long-term:** Consider Option 3 to consolidate all org-scoped routes under `/org/[slug]/*`.

## Technical Details

**Affected files:**
- `src/app/(site)/dashboard/admin/forms/page.tsx` (Lines 26-58) - CRITICAL

**Additional files that need similar fixes:**
- `src/app/(site)/dashboard/admin/forms/[formId]/page.tsx` (Lines 28-47)
- `src/app/(site)/dashboard/admin/forms/[formId]/submissions/page.tsx`
- `src/app/(site)/dashboard/admin/forms/[formId]/submissions/[submissionId]/page.tsx`

**Required changes:**
1. Add check for `activeOrganizationId`
2. Add membership verification
3. Wrap query in `withOrganizationContext()`
4. Update role check to include `super_admin`

**Helper to add to `src/lib/auth-helper.ts`:**
```typescript
export async function verifyOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<void> {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  // Super admins can access all organizations
  if (userRecord?.role === "super_admin") {
    return;
  }

  const membership = await db.query.organizationUsers.findFirst({
    where: and(
      eq(organizationUsers.userId, userId),
      eq(organizationUsers.organizationId, organizationId),
      eq(organizationUsers.status, "active")
    ),
  });

  if (!membership) {
    throw new Error("Access denied - not a member of this organization");
  }
}
```

## Acceptance Criteria

- [ ] Forms page only shows forms from user's active organization
- [ ] Super admins can access all organizations (with explicit selection)
- [ ] Non-members cannot access organization data
- [ ] Query uses `withOrganizationContext()` or explicit org filter
- [ ] Role check includes both "admin" and "super_admin"
- [ ] Test: Create 2 orgs, verify admin in org A cannot see org B forms
- [ ] Test: Super admin can switch orgs and see correct forms
- [ ] No TypeScript or lint errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Security Review (Multi-Agent Analysis)

**Actions:**
- Discovered complete data leakage in admin forms page
- Identified raw `db.select()` bypassing RLS policies
- Analyzed impact: complete cross-tenant exposure
- Categorized as CRITICAL (P1) security issue
- Documented 3 solution approaches

**Learnings:**
- Raw `db.select()` bypasses RLS even when policies exist
- Must use `withOrganizationContext()` to set session variable
- Connection pooling makes RLS unsafe without transaction wrapper
- All form-related pages need this fix (not just forms list)

## Resources

- **Similar Pattern:** `src/app/(site)/dashboard/admin/page.tsx` (correctly uses withOrganizationContext)
- **RLS Policies:** Database migration files
- **Tenant Context:** `src/lib/db/tenant-context.ts`
- **OWASP A01:2021:** Broken Access Control

## Notes

- **BLOCKS MERGE**: This is a critical data breach vulnerability
- User reported "seeing same options as superuser" - this is the root cause
- Fix must be applied to ALL form-related pages, not just the list
- Consider moving all admin pages to org-scoped routes long-term
