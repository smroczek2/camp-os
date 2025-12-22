---
status: ready
priority: p3
issue_id: "028"
tags: [refactoring, code-quality, dry, patterns]
dependencies: []
---

# Code Quality Improvements - DRY Violations and Pattern Standardization

APPROVED - Reduce code duplication and standardize patterns.

## Problem Statement

Several patterns are duplicated across the codebase:
1. Auth checks repeated 35 times
2. Revalidation paths repeated 19 times
3. Error handling inconsistent (throw vs return)
4. Session dialog components share 80% code

## Findings

### Auth Check Duplication

**Pattern repeated 35 times:**
```typescript
const session = await getSession();
if (!session?.user) {
  throw new Error("Unauthorized");
}
```

### Revalidation Duplication

**Pattern repeated 19 times:**
```typescript
revalidatePath("/dashboard/admin");
revalidatePath("/dashboard/admin/programs");
```

### Inconsistent Error Handling

**Pattern A (throw):** parent-actions.ts, form-actions.ts
**Pattern B (return):** session-actions.ts, admin-actions.ts

### Component Duplication

- `create-session-dialog.tsx` and `edit-session-dialog.tsx` share 80% code

## Proposed Solutions

### Option 1: Extract Shared Utilities (Recommended)

**Auth Wrapper:**
```typescript
// src/lib/server-action-wrapper.ts
export async function withAuth<T>(
  handler: (userId: string, role: string) => Promise<T>
): Promise<ActionResult<T>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    const result = await handler(session.user.id, session.user.role);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Revalidation Constants:**
```typescript
// src/lib/revalidation.ts
export const PATHS = {
  admin: ["/dashboard/admin", "/dashboard/admin/programs"],
  parent: ["/dashboard/parent"],
};

export function revalidateAdmin() {
  PATHS.admin.forEach(revalidatePath);
}
```

**Shared Session Form:**
```typescript
// src/components/admin/session-form.tsx
export function SessionForm({ mode, initialData, onSubmit }) {
  // Shared form logic
}
```

**Effort:** 4-6 hours
**Risk:** Low

## Acceptance Criteria

- [ ] Auth wrapper reduces duplication
- [ ] Revalidation uses constants
- [ ] Session dialogs share base form
- [ ] Error handling standardized
- [ ] All tests pass (if any)
- [ ] TypeScript compiles

## Technical Details

**New Files:**
- `src/lib/server-action-wrapper.ts`
- `src/lib/revalidation.ts`
- `src/components/admin/session-form.tsx`

**Files to Refactor:**
- All files in `src/app/actions/`
- `src/components/admin/create-session-dialog.tsx`
- `src/components/admin/edit-session-dialog.tsx`

## Work Log

### 2025-12-22 - Initial Discovery

**By:** Code Quality Patterns Agent

**Actions:**
- Counted auth check instances (35)
- Counted revalidation instances (19)
- Identified component duplication
- Designed extraction patterns
