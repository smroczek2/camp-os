---
status: complete
priority: p1
issue_id: "013"
tags: [security, multi-tenant, middleware, authorization, critical]
dependencies: []
---

# Middleware Organization Access Check is Disabled

CRITICAL SECURITY ISSUE - The middleware contains authorization logic for organization access verification, but it's commented out with a TODO.

## Problem Statement

The middleware at `src/middleware.ts` has organization context extraction but the critical authorization check that verifies user membership is commented out with `// TODO`. This means:
- Middleware injects `x-organization-id` header without verifying access
- Any authenticated user can potentially access any organization's API routes
- The security check was planned but never implemented

**Security Severity:** CRITICAL (10/10)
**Exploitability:** HIGH - Middleware bypasses allow direct API access
**Impact:** Complete tenant isolation bypass at API level

## Findings

**Location:** `src/middleware.ts` (Lines 76-89)

**Vulnerable Code:**
```typescript
// For authenticated routes, verify user has access
// Note: This is a simplified check. In production, you'd want to:
// 1. Get session from Better Auth
// 2. Check if user belongs to organization via organization_users
// 3. Handle super_admin role (can access all orgs)

// TODO: Add authentication check here when Better Auth session is available
// const session = await getSession();
// if (session && session.user.role !== 'super_admin') {
//   const hasAccess = await userBelongsToOrganization(session.user.id, org.id);
//   if (!hasAccess) {
//     return NextResponse.redirect(new URL('/unauthorized', request.url));
//   }
// }

// Inject organization context into request headers
const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-organization-id", org.id);  // ⚠️ INJECTED WITHOUT AUTHORIZATION
requestHeaders.set("x-organization-slug", org.slug);
```

**Root Cause:**
- Security check was planned but marked as TODO
- Headers injected without verifying user access
- Any request to `/org/{slug}/*` gets org headers set
- API routes that trust these headers are vulnerable

**Attack Vector:**
1. Attacker knows organization slug "victim-camp"
2. Attacker makes API request to `/org/victim-camp/api/...`
3. Middleware injects `x-organization-id: {victim-camp-uuid}`
4. API route trusts header and returns victim's data

## Proposed Solutions

### Option 1: Enable and Implement Auth Check (RECOMMENDED)

**Approach:** Uncomment and properly implement the authorization check.

**Implementation:**
```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizationUsers } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Bug #2 Fix: Enforce read-only mode for super admin preview
  const previewOrgId = request.cookies.get("preview_org_id")?.value;
  if (previewOrgId && request.method !== "GET") {
    return NextResponse.json(
      { error: "Preview mode is read-only" },
      { status: 403 }
    );
  }

  const orgMatch = pathname.match(/^\/org\/([^\/]+)/);

  if (!orgMatch) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/select-organization", request.url));
    }
    return NextResponse.next();
  }

  const slug = orgMatch[1];

  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    if (!org) {
      return NextResponse.redirect(new URL("/404", request.url));
    }

    if (org.status === "suspended" || org.status === "inactive") {
      return NextResponse.redirect(
        new URL(`/org-suspended?org=${slug}`, request.url)
      );
    }

    // CRITICAL: Get session and verify access
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Require authentication for org routes
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Super admins can access all organizations
    if (session.user.role !== "super_admin") {
      // Check membership
      const membership = await db.query.organizationUsers.findFirst({
        where: and(
          eq(organizationUsers.userId, session.user.id),
          eq(organizationUsers.organizationId, org.id),
          eq(organizationUsers.status, "active")
        ),
      });

      if (!membership) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    // Inject verified organization context
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-organization-id", org.id);
    requestHeaders.set("x-organization-slug", org.slug);
    requestHeaders.set("x-user-org-role", membership?.role || "super_admin");

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/error", request.url));
  }
}
```

**Pros:**
- Single point of authorization for all org routes
- Early rejection (before route handlers)
- Protects both pages and API routes
- Super admin bypass handled correctly

**Cons:**
- Database query in middleware (performance)
- Auth in middleware can be complex
- Better Auth session access in middleware needs testing

**Effort:** 2-3 hours
**Risk:** Medium (middleware auth can be tricky)

---

### Option 2: Remove Header Injection Until Verified

**Approach:** Remove the header injection code until auth is implemented.

**Implementation:**
```typescript
// Temporarily disable org header injection
// const requestHeaders = new Headers(request.headers);
// requestHeaders.set("x-organization-id", org.id);
// requestHeaders.set("x-organization-slug", org.slug);

// Just allow the request through, let routes handle auth
return NextResponse.next();
```

**Pros:**
- Quick fix to prevent false security
- Routes already have their own auth
- No false trust in headers

**Cons:**
- Breaks routes that rely on x-organization-id header
- Requires all routes to fetch org context themselves

**Effort:** 30 minutes
**Risk:** High (may break dependent routes)

---

### Option 3: Header Injection with Warning

**Approach:** Keep headers but add warning header about unverified access.

**Implementation:**
```typescript
const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-organization-id", org.id);
requestHeaders.set("x-organization-slug", org.slug);
requestHeaders.set("x-org-access-unverified", "true"); // WARNING FLAG

return NextResponse.next({
  request: { headers: requestHeaders },
});
```

**Pros:**
- Doesn't break existing routes
- Routes can check warning header
- Gradual migration path

**Cons:**
- Routes must check warning header (easy to forget)
- Security through documentation is weak

**Effort:** 1 hour
**Risk:** Medium

## Recommended Action

**Implement Option 1** (Enable Auth Check) as the proper fix. The middleware already has the logic spec'd out in comments - it just needs to be implemented.

Note: This should be implemented AFTER todo-012 (org layout check) as a defense-in-depth measure. The layout check is simpler and can be done immediately.

## Technical Details

**Affected files:**
- `src/middleware.ts` (Lines 76-89) - Primary fix location

**Routes protected by this middleware:**
- All routes matching `/org/{slug}/*`
- Any API routes under `/org/{slug}/api/*`

**Required changes:**
1. Import auth and db in middleware
2. Uncomment session check
3. Implement membership query
4. Handle super_admin role
5. Add user's org role to headers

**Environment considerations:**
- Middleware runs on Edge runtime
- Better Auth session access must work in Edge
- Database queries from Edge need connection pooling

## Acceptance Criteria

- [ ] Unauthenticated users redirected to login
- [ ] Non-members redirected to /unauthorized
- [ ] Super admins can access all organizations
- [ ] Headers only set after authorization verified
- [ ] x-user-org-role header set with membership role
- [ ] Test: API calls to wrong org rejected
- [ ] Test: Page navigation to wrong org rejected
- [ ] Performance: Middleware latency under 100ms
- [ ] No TypeScript or lint errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Security Review (Multi-Agent Analysis)

**Actions:**
- Found commented TODO in middleware with security logic
- Identified that org headers set without verification
- Analyzed attack vector via direct API requests
- Categorized as CRITICAL (P1) security issue
- Documented 3 solution approaches

**Learnings:**
- TODOs in security code are dangerous
- Header injection without auth creates false trust
- Middleware is ideal for API route protection
- Edge runtime has constraints (connection pooling, auth)

## Resources

- **Existing TODO:** `src/middleware.ts` (lines 76-89)
- **Better Auth Middleware:** Check Better Auth docs for Edge-compatible session access
- **OWASP A01:2021:** Broken Access Control

## Notes

- **BLOCKS MERGE**: Critical authorization bypass vulnerability
- This is defense-in-depth; implement AFTER layout check (todo-012)
- Test Edge runtime compatibility before deploying
- Consider caching membership in JWT/cookie to reduce DB calls
