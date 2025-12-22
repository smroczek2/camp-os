---
status: resolved
priority: p1
issue_id: "012"
tags: [security, multi-tenant, authorization, layout, critical]
dependencies: []
---

# Organization Layout Missing Membership Verification

CRITICAL SECURITY ISSUE - The org layout loads organization data but never verifies if the user belongs to that organization.

## Problem Statement

The organization-scoped layout at `/org/[slug]/layout.tsx` fetches organization data based on the URL slug but does NOT verify that the current user is a member of that organization. This allows:
- Any authenticated user can access ANY organization's dashboard by guessing/knowing the slug
- Complete bypass of organization isolation
- Data from any camp accessible to any logged-in user

**Security Severity:** CRITICAL (10/10)
**Exploitability:** HIGH - Just modify the URL
**Impact:** Complete tenant isolation bypass

## Findings

**Location:** `src/app/org/[slug]/layout.tsx` (Lines 18-29)

**Vulnerable Code:**
```typescript
export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params;
  const session = await getSession();

  // Get organization by slug
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (!org) {
    notFound();
  }

  // Check if organization is suspended
  if (org.status === "suspended") {
    return <SuspendedMessage />;
  }

  // ⚠️ MISSING: Verify user belongs to this organization!
  // Any authenticated user can access any org's pages

  return (
    <ThemeProvider>
      <OrgHeader organization={org} user={session?.user || null} />
      <main>{children}</main>
    </ThemeProvider>
  );
}
```

**Root Cause:**
- Layout trusts URL slug without authorization check
- No query to `organizationUsers` table to verify membership
- No special handling for `super_admin` role
- Allows any logged-in user to access any organization

**Attack Vector:**
1. User A belongs to organization "acme" (slug: "acme")
2. User A discovers organization "competitor" exists (slug: "competitor")
3. User A navigates to `/org/competitor/dashboard`
4. Layout loads competitor's data without any authorization check
5. User A sees competitor's camps, registrations, children data

## Proposed Solutions

### Option 1: Add Membership Check in Layout (RECOMMENDED)

**Approach:** Verify organization membership before rendering any org-scoped content.

**Implementation:**
```typescript
export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params;
  const session = await getSession();

  // Require authentication
  if (!session?.user) {
    redirect("/login");
  }

  // Get organization by slug
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (!org) {
    notFound();
  }

  // Check if organization is suspended
  if (org.status === "suspended") {
    return <SuspendedMessage />;
  }

  // CRITICAL: Verify user has access to this organization
  if (session.user.role !== "super_admin") {
    const membership = await db.query.organizationUsers.findFirst({
      where: and(
        eq(organizationUsers.organizationId, org.id),
        eq(organizationUsers.userId, session.user.id),
        eq(organizationUsers.status, "active")
      ),
    });

    if (!membership) {
      redirect("/unauthorized?reason=not_member");
    }
  }

  return (
    <ThemeProvider>
      <OrgHeader organization={org} user={session.user} />
      <main>{children}</main>
    </ThemeProvider>
  );
}
```

**Pros:**
- Single point of enforcement for all org routes
- Super admins can still access all orgs
- Clear authorization pattern
- Minimal code changes

**Cons:**
- Extra database query per request (membership check)
- Could cache membership in session/cookie

**Effort:** 1-2 hours
**Risk:** Low

---

### Option 2: Middleware-Based Authorization

**Approach:** Enable the commented-out authorization check in middleware.ts.

**Implementation:**
```typescript
// In src/middleware.ts (lines 76-89)
// UNCOMMENT AND IMPLEMENT:
const session = await auth.api.getSession({
  headers: await headers(),
});

if (session?.user && session.user.role !== 'super_admin') {
  const hasAccess = await userBelongsToOrganization(session.user.id, org.id);
  if (!hasAccess) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
}
```

**Pros:**
- Earlier enforcement (before route handler)
- Single check for all org routes
- Already partially implemented

**Cons:**
- Middleware database calls can be slow
- Requires careful handling of auth headers
- More complex error handling

**Effort:** 2-3 hours
**Risk:** Medium (auth in middleware can be tricky)

---

### Option 3: Hybrid Approach

**Approach:** Middleware does basic check, layout does full verification.

**Implementation:**
- Middleware: Check session exists and has valid activeOrganizationId
- Layout: Verify full membership and organization status

**Pros:**
- Defense in depth
- Early rejection of unauthenticated requests
- Full verification at route level

**Cons:**
- Duplicate checks
- More complex codebase

**Effort:** 3-4 hours
**Risk:** Low

## Recommended Action

**Implement Option 1** (Layout Membership Check) as the immediate fix. This is:
- Simple and direct
- Follows existing patterns
- Can be implemented immediately
- Clear authorization flow

After Option 1 is working, consider enabling middleware checks (Option 2) as defense in depth.

## Technical Details

**Affected files:**
- `src/app/org/[slug]/layout.tsx` (Lines 18-29) - Primary fix location

**Child routes that will be automatically protected:**
- `src/app/org/[slug]/dashboard/page.tsx`
- `src/app/org/[slug]/settings/page.tsx`
- Any future routes under `/org/[slug]/*`

**Required changes:**
1. Add authentication check at start of layout
2. Add membership verification query
3. Handle super_admin bypass
4. Redirect unauthorized users to `/unauthorized` page
5. Create `/unauthorized` page if it doesn't exist

**Database query to add:**
```typescript
const membership = await db.query.organizationUsers.findFirst({
  where: and(
    eq(organizationUsers.organizationId, org.id),
    eq(organizationUsers.userId, session.user.id),
    eq(organizationUsers.status, "active")
  ),
});
```

## Acceptance Criteria

- [ ] Unauthenticated users redirected to login
- [ ] Non-members redirected to unauthorized page
- [ ] Super admins can access all organizations
- [ ] Members can access their organization
- [ ] Suspended/inactive members cannot access
- [ ] Test: User A cannot access Org B via URL manipulation
- [ ] Test: Super admin can access any org
- [ ] `/unauthorized` page exists with clear messaging
- [ ] No TypeScript or lint errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Architecture Review (Multi-Agent Analysis)

**Actions:**
- Discovered missing authorization check in org layout
- Identified that any user can access any org via URL
- Analyzed attack vector: simple URL manipulation
- Categorized as CRITICAL (P1) security issue
- Documented 3 solution approaches

**Learnings:**
- Layouts are ideal places for authorization checks (one place, all child routes protected)
- Must explicitly handle super_admin role separately
- Membership status matters (active vs suspended)
- Need dedicated unauthorized page for clear UX

## Resources

- **Middleware TODO:** `src/middleware.ts` (lines 76-89) - Contains commented authorization logic
- **Organization Users Schema:** `src/lib/schema.ts` (organizationUsers table)
- **OWASP A01:2021:** Broken Access Control

## Notes

- **BLOCKS MERGE**: Critical authorization bypass vulnerability
- This is the second layer of protection (first is middleware)
- Consider caching membership in session to reduce DB queries
- All org-scoped routes inherit this protection once fixed
