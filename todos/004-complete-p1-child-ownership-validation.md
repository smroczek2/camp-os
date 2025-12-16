---
status: ready
priority: p1
issue_id: "004"
tags: [security, data-integrity, rbac, validation]
dependencies: []
---

# Add Child Ownership Validation in Form Submission

CRITICAL SECURITY & DATA INTEGRITY ISSUE - Parents can submit forms for other parents' children.

## Problem Statement

The `submitFormAction` accepts a `childId` parameter without validating that the child belongs to the authenticated user. This allows:
- Parent A to submit forms for Parent B's children
- Unauthorized access to child data
- Data integrity violations
- GDPR/privacy violations

**Security Severity:** HIGH
**Exploitability:** MEDIUM - Requires knowing another child's ID
**Impact:** Privacy violation, unauthorized data access, data integrity compromise

## Findings

**From Data Integrity Guardian Review:**

**Location:** `src/app/actions/form-actions.ts:42`

Current vulnerable implementation:
```typescript
export async function submitFormAction(data: {
  formDefinitionId: string;
  childId?: string;           // NOT VALIDATED
  registrationId?: string;    // NOT VALIDATED
  sessionId?: string;
  submissionData: Record<string, unknown>;
}) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  await enforcePermission(session.user.id, "formSubmission", "create");

  const canAccess = await canAccessForm(session.user.id, data.formDefinitionId);
  if (!canAccess) throw new ForbiddenError("Cannot access this form");

  // VULNERABILITY: No check that childId belongs to session.user.id
  return formService.submitForm({
    ...data,
    userId: session.user.id,
  });
}
```

**Attack Scenario:**
1. Parent A discovers Parent B's child ID (via URL inspection, enumeration, etc.)
2. Parent A submits a form with `childId: "parent-b-child-id"`
3. Form submission succeeds because only permission is checked, not ownership
4. Parent A has now modified data for a child they don't own

**Similar Issues Found:**
- `registrationId` also not validated for ownership
- Pattern may exist in other actions

## Proposed Solutions

### Option 1: Add Ownership Validation in Action (RECOMMENDED)

**Approach:** Validate ownership at the Server Action layer before calling service.

**Implementation:**
```typescript
// src/app/actions/form-actions.ts
export async function submitFormAction(data: {
  formDefinitionId: string;
  childId?: string;
  registrationId?: string;
  sessionId?: string;
  submissionData: Record<string, unknown>;
}) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  await enforcePermission(session.user.id, "formSubmission", "create");

  const canAccess = await canAccessForm(session.user.id, data.formDefinitionId);
  if (!canAccess) throw new ForbiddenError("Cannot access this form");

  // VALIDATE CHILD OWNERSHIP
  if (data.childId) {
    const child = await db.query.children.findFirst({
      where: and(
        eq(children.id, data.childId),
        eq(children.userId, session.user.id)
      ),
      columns: { id: true } // Only need ID for validation
    });

    if (!child) {
      throw new ForbiddenError("Invalid child ID");
    }
  }

  // VALIDATE REGISTRATION OWNERSHIP
  if (data.registrationId) {
    const registration = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.id, data.registrationId),
        eq(registrations.userId, session.user.id)
      ),
      columns: { id: true }
    });

    if (!registration) {
      throw new ForbiddenError("Invalid registration ID");
    }
  }

  return formService.submitForm({
    ...data,
    userId: session.user.id,
  });
}
```

**Pros:**
- Clear security boundary at action layer
- Easy to understand and audit
- Consistent with RBAC pattern
- Explicit validation

**Cons:**
- Adds database queries (2 extra queries)
- Duplicates some validation logic

**Effort:** 1-2 hours
**Risk:** Low

---

### Option 2: Add Ownership Check in Service Layer

**Approach:** Move validation into `FormService.submitForm()`.

**Implementation:**
```typescript
// src/services/form-service.ts
async submitForm(data: SubmitFormData) {
  // Validate ownership
  if (data.childId) {
    const child = await db.query.children.findFirst({
      where: and(
        eq(children.id, data.childId),
        eq(children.userId, data.userId)
      )
    });
    if (!child) throw new ForbiddenError("Invalid child");
  }

  if (data.registrationId) {
    const reg = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.id, data.registrationId),
        eq(registrations.userId, data.userId)
      )
    });
    if (!reg) throw new ForbiddenError("Invalid registration");
  }

  // Rest of submission logic...
}
```

**Pros:**
- Centralized validation
- Can't be bypassed
- Reusable if service called from multiple places

**Cons:**
- Mixes security with business logic
- Less clear responsibility
- Service shouldn't know about RBAC details

**Effort:** 1-2 hours
**Risk:** Low

---

### Option 3: Add Helper Function in RBAC

**Approach:** Create reusable ownership validation helper.

**Implementation:**
```typescript
// src/lib/rbac.ts
export async function validateResourceOwnership(
  userId: string,
  resourceType: 'child' | 'registration',
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'child':
      const child = await db.query.children.findFirst({
        where: and(eq(children.id, resourceId), eq(children.userId, userId)),
        columns: { id: true }
      });
      return !!child;

    case 'registration':
      const reg = await db.query.registrations.findFirst({
        where: and(eq(registrations.id, resourceId), eq(registrations.userId, userId)),
        columns: { id: true }
      });
      return !!reg;

    default:
      return false;
  }
}

// Usage in action:
if (data.childId) {
  const owns = await validateResourceOwnership(session.user.id, 'child', data.childId);
  if (!owns) throw new ForbiddenError("Invalid child");
}
```

**Pros:**
- Reusable across actions
- Consistent API
- Easy to extend for other resources
- Clean separation

**Cons:**
- Additional abstraction
- More code to maintain

**Effort:** 2-3 hours
**Risk:** Low

## Recommended Action

**To be filled during triage.**

**Suggested:** Implement Option 1 (validation in action) immediately for security fix, then refactor to Option 3 (helper function) for reusability.

## Technical Details

**Affected files:**
- `src/app/actions/form-actions.ts:18-46` - submitFormAction (CRITICAL FIX)
- `src/services/form-service.ts:96-152` - submitForm receives unvalidated IDs
- Potentially other actions that accept childId or registrationId

**Database queries:**
```sql
-- Child ownership check
SELECT id FROM children
WHERE id = ? AND user_id = ?

-- Registration ownership check
SELECT id FROM registrations
WHERE id = ? AND user_id = ?
```

**Performance impact:**
- +2 additional queries per form submission
- Queries are simple primary key lookups (fast)
- Can be optimized with caching if needed

**Related issues:**
- Existing `canAccessForm()` function checks form access but not child ownership
- `enforcePermission()` checks role permissions but not resource ownership
- This pattern should be audited across all Server Actions

## Resources

- **OWASP A01:2021**: Broken Access Control
- **Data Integrity Guardian Review**: 2025-12-16
- **AGENTS.md**: Security checklist (line 376-382)
- **RBAC implementation**: `src/lib/rbac.ts`

## Acceptance Criteria

- [x] Child ownership validated before form submission
- [x] Registration ownership validated before form submission
- [x] Appropriate error thrown for unauthorized access
- [x] Error message doesn't leak information ("Invalid child" not "Child belongs to another user")
- [ ] Tests added for ownership validation
- [ ] Tests added for unauthorized access attempts
- [ ] Audit other actions for similar vulnerabilities
- [ ] Documentation updated with ownership validation pattern

## Work Log

### 2025-12-16 - Initial Discovery

**By:** Data Integrity Guardian Agent (Code Review)

**Actions:**
- Discovered missing child ownership validation in submitFormAction
- Identified attack vector: parent submitting for other parent's child
- Found similar issue with registrationId
- Analyzed 3 implementation approaches
- Categorized as HIGH severity security issue

**Learnings:**
- RBAC permission checks don't validate resource ownership
- `canAccessForm` checks form access, not child/registration ownership
- This is a common pattern to audit across all actions
- Simple database query can prevent this vulnerability
- Should be caught earlier in development process

---

### 2025-12-16 - Approved for Work

**By:** Claude Triage System

**Actions:**
- Issue approved during triage session
- Status changed from pending → ready
- Ready to be picked up and worked on

**Learnings:**
- Critical security and data integrity issue
- Simple fix with 1-2 hours effort
- Also affects registrationId parameter

---

### 2025-12-16 - Implementation Complete

**By:** Claude Code Review Resolution Agent

**Actions:**
- Implemented Option 1: Added ownership validation in submitFormAction
- Added child ownership validation using db.query with userId filter
- Added registration ownership validation using db.query with userId filter
- Used ForbiddenError with generic error messages to prevent information leakage
- Added necessary imports: children, registrations tables and 'and' operator from drizzle-orm
- Validated changes with npm run lint (passed) and npm run typecheck (no new errors)
- Updated acceptance criteria checkboxes for completed items

**Implementation Details:**
- Location: `/Users/smroczek/Projects/camp-os/src/app/actions/form-actions.ts:42-70`
- Child validation: Queries children table with both id and userId filters
- Registration validation: Queries registrations table with both id and userId filters
- Only selects id column for efficient validation queries
- Uses ForbiddenError("Invalid child ID") and ForbiddenError("Invalid registration ID") for security
- Validation occurs after permission checks but before calling formService.submitForm()

**Security Improvements:**
- Prevents Parent A from submitting forms for Parent B's children
- Prevents unauthorized access to child data via childId parameter
- Prevents unauthorized access to registration data via registrationId parameter
- Error messages don't reveal whether resource exists or ownership issue
- Maintains consistency with existing RBAC and ForbiddenError patterns

**Remaining Work:**
- Tests need to be added for ownership validation (acceptance criteria)
- Tests need to be added for unauthorized access attempts (acceptance criteria)
- Other actions should be audited for similar vulnerabilities (acceptance criteria)
- Documentation should be updated with ownership validation pattern (acceptance criteria)

**Learnings:**
- Security validation should occur at Server Action boundary before service calls
- Database queries for ownership validation are simple and performant (indexed lookups)
- Generic error messages are important to prevent information disclosure
- This pattern should be applied consistently across all resource-accepting actions

## Notes

- **BLOCKS MERGE**: High severity security issue
- Audit ALL Server Actions for similar ownership validation gaps
- Consider adding ownership validation to RBAC enforcePermission()
- Add integration tests for cross-user access attempts
- Consider adding audit logging for failed ownership checks (potential attacks)
- Related to GDPR/privacy compliance - unauthorized access to child data
