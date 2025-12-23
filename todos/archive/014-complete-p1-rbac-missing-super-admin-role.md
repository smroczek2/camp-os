---
status: complete
priority: p1
issue_id: "014"
tags: [security, rbac, roles, authorization, critical]
dependencies: []
---

# RBAC System Missing super_admin Role

CRITICAL SECURITY ISSUE - The RBAC permission system only defines 4 roles, missing "super_admin" which is used throughout the codebase.

## Problem Statement

The RBAC system at `src/lib/rbac.ts` defines `UserRole` with only 4 roles, but the auth system assigns "super_admin" role to platform administrators. This creates:
- Permission checks fail for super_admin users
- Inconsistent role enforcement across the application
- Functions like `isAdmin()` return false for super_admins
- Role-based UI shows incorrect options

**Security Severity:** CRITICAL (10/10)
**Exploitability:** HIGH - Causes authorization failures and confusion
**Impact:** Super admins may be blocked from legitimate access; role checks inconsistent

## Findings

**Location:** `src/lib/rbac.ts` (Line 13)

**Vulnerable Code:**
```typescript
// Line 13: super_admin is NOT included
export type UserRole = "parent" | "staff" | "admin" | "nurse";

export const ROLE_PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  parent: {...},
  staff: {...},
  nurse: {...},
  admin: {...},
  // ⚠️ MISSING: super_admin permissions
};
```

**Evidence of super_admin usage elsewhere:**
- `src/lib/auth.ts` (line 65): Assigns "super_admin" role to @campminder.com emails
- `src/lib/auth-helper.ts` (line 50): `isSuperAdmin()` checks for "super_admin" role
- `src/app/actions/super-admin-actions.ts` (line 44): Requires "super_admin" role
- `src/middleware.ts` (line 82): Commented check for "super_admin" role
- `src/components/org/org-header.tsx` (line 75): Shows super admin UI

**Additional Issues:**

### Issue 1: isAdmin() doesn't include super_admin (Lines 204-208)
```typescript
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "admin";  // ⚠️ Returns false for super_admin!
}
```

### Issue 2: Permission bypass only checks "admin" (Line 176)
```typescript
// For non-admins, check row-level ownership
if (userRecord.role !== "admin" && resourceId) {
  // ⚠️ super_admin users go through row-level checks they shouldn't need
}
```

### Issue 3: canAccessForm returns true only for admin (Lines 222-223)
```typescript
export async function canAccessForm(userId: string, formId: string): Promise<boolean> {
  const userRole = await getUserRole(userId);
  if (userRole === "admin") return true;  // ⚠️ super_admin not included
  // ...
}
```

## Proposed Solutions

### Option 1: Add super_admin to RBAC (RECOMMENDED)

**Approach:** Add super_admin to UserRole type and ROLE_PERMISSIONS, update all role checks.

**Implementation:**

**Step 1: Update UserRole type (Line 13)**
```typescript
export type UserRole = "parent" | "staff" | "admin" | "nurse" | "super_admin";
```

**Step 2: Add super_admin permissions (after line 55)**
```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  parent: {...},
  staff: {...},
  nurse: {...},
  admin: {...},
  super_admin: {
    // Super admins have ALL permissions across ALL organizations
    child: ["create", "read", "update", "delete"],
    registration: ["create", "read", "update", "cancel", "delete"],
    medication: ["create", "read", "update", "delete"],
    medicalRecord: ["read", "update"],
    document: ["create", "read", "delete"],
    incident: ["create", "read", "update", "resolve", "delete"],
    session: ["create", "read", "update", "delete"],
    staff: ["create", "read", "update", "delete"],
    form: ["create", "read", "update", "delete"],
    formSubmission: ["read", "update", "delete"],
    organization: ["create", "read", "update", "delete", "suspend"],
  },
};
```

**Step 3: Update isAdmin() (Lines 204-208)**
```typescript
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "admin" || role === "super_admin";
}
```

**Step 4: Add isSuperAdmin() function**
```typescript
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "super_admin";
}
```

**Step 5: Update enforcePermission() (Line 176)**
```typescript
// For non-admins and non-super_admins, check row-level ownership
if (userRecord.role !== "admin" && userRecord.role !== "super_admin" && resourceId) {
  // Row-level checks...
}
```

**Step 6: Update canAccessForm() (Line 222)**
```typescript
export async function canAccessForm(userId: string, formId: string): Promise<boolean> {
  const userRole = await getUserRole(userId);
  if (userRole === "admin" || userRole === "super_admin") return true;
  // ...
}
```

**Pros:**
- Complete role coverage
- Type-safe (TypeScript enforces)
- Super admins get proper permissions
- Consistent with rest of codebase

**Cons:**
- Need to audit all role checks
- May expose edge cases

**Effort:** 2-3 hours
**Risk:** Low

---

### Option 2: Create Separate Super Admin RBAC

**Approach:** Create separate permission functions for super_admin that bypass normal RBAC.

**Implementation:**
```typescript
export async function enforcePermission(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<void> {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) {
    throw new UnauthorizedError("User not found");
  }

  // Super admins bypass all permission checks
  if (userRecord.role === "super_admin") {
    return; // Full access
  }

  // Normal RBAC for other roles
  // ...
}
```

**Pros:**
- Simple bypass logic
- No need to define permissions
- Clear separation

**Cons:**
- No audit trail of super admin actions
- Can't restrict super admin if needed
- Less type-safe

**Effort:** 1 hour
**Risk:** Medium

## Recommended Action

**Implement Option 1** (Add super_admin to RBAC). This is:
- Type-safe and complete
- Allows fine-grained control if ever needed
- Consistent with existing patterns
- Documents what super_admin can do

## Technical Details

**Affected files:**
- `src/lib/rbac.ts` (Lines 13, 176, 204-208, 222) - Primary changes
- All files calling `isAdmin()`, `hasPermission()`, `enforcePermission()`

**Required changes:**
1. Add "super_admin" to UserRole type
2. Add super_admin permissions to ROLE_PERMISSIONS
3. Update isAdmin() to include super_admin
4. Add isSuperAdmin() function
5. Update enforcePermission() role bypass
6. Update canAccessForm() role check
7. Audit all role checks in codebase

**Files to audit for role checks:**
```bash
grep -r "role.*admin" src/ --include="*.ts" --include="*.tsx"
```

## Acceptance Criteria

- [ ] super_admin added to UserRole type
- [ ] super_admin added to ROLE_PERMISSIONS
- [ ] isAdmin() returns true for super_admin
- [ ] isSuperAdmin() function added
- [ ] enforcePermission() bypasses row-level checks for super_admin
- [ ] canAccessForm() returns true for super_admin
- [ ] All role checks in codebase audited
- [ ] Test: Super admin can access all resources
- [ ] Test: Super admin bypasses ownership checks
- [ ] No TypeScript or lint errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Security Review (Multi-Agent Analysis)

**Actions:**
- Found super_admin role missing from RBAC type definition
- Identified multiple places super_admin is used but not in RBAC
- Analyzed impact: authorization failures, inconsistent behavior
- Categorized as CRITICAL (P1) security issue
- Documented 2 solution approaches

**Learnings:**
- Role definitions must be consistent across auth and RBAC systems
- Type definitions enforce completeness
- Helper functions (isAdmin) must cover all admin-like roles
- Row-level bypass logic needs all privileged roles

## Resources

- **Auth Config:** `src/lib/auth.ts` (line 65) - super_admin assignment
- **Auth Helper:** `src/lib/auth-helper.ts` - isSuperAdmin() check
- **OWASP A01:2021:** Broken Access Control

## Notes

- **BLOCKS MERGE**: Super admin role broken across RBAC
- This may cause super admins to be blocked from legitimate access
- Audit all `role === "admin"` checks in codebase
- Consider adding role constants to prevent typos
