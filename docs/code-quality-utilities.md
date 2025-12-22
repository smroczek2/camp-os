# Code Quality Utilities

This document describes the utility files created to improve code quality and reduce duplication across the Camp OS codebase.

## Overview

Three utility files have been created to improve code consistency and reduce duplication:

1. **Server Action Wrapper** (`src/lib/server-action-wrapper.ts`)
2. **Revalidation Constants** (`src/lib/revalidation.ts`)
3. **Shared Session Form** (`src/components/admin/session-form.tsx`)

These utilities are designed for **incremental adoption** - existing code does not need to be refactored immediately. New code should use these utilities, and existing code can be gradually migrated over time.

---

## 1. Server Action Wrapper

**File:** `/Users/smroczek/Projects/camp-os/src/lib/server-action-wrapper.ts`

### Purpose

Provides consistent error handling and authentication checks for server actions, reducing boilerplate code.

### Functions

#### `withAuth<T>(handler)`

Wraps a server action with authentication checking. Returns a typed `ActionResult<T>`.

**Parameters:**
- `handler: (userId: string, role: string) => Promise<T>` - The authenticated action to execute

**Returns:**
- `{ success: true, data: T }` on success
- `{ success: false, error: string }` on error or authentication failure

**Example Usage:**

```typescript
// Before (manual auth checking)
export async function updateProfileAction(data: ProfileData) {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    const result = await updateProfile(session.user.id, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// After (using withAuth)
export async function updateProfileAction(data: ProfileData) {
  return withAuth(async (userId, role) => {
    return await updateProfile(userId, data);
  });
}
```

#### `withAdminAuth<T>(handler)`

Wraps a server action with admin-only authentication checking.

**Parameters:**
- `handler: (userId: string) => Promise<T>` - The admin-only action to execute

**Returns:**
- `{ success: true, data: T }` on success
- `{ success: false, error: string }` on error, authentication failure, or insufficient permissions

**Example Usage:**

```typescript
// Before (manual auth + role checking)
export async function deleteUserAction(userId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  if (session.user.role !== 'admin') {
    return { success: false, error: "Admin access required" };
  }
  try {
    await deleteUser(userId);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// After (using withAdminAuth)
export async function deleteUserAction(userId: string) {
  return withAdminAuth(async (adminId) => {
    await deleteUser(userId);
    return null;
  });
}
```

---

## 2. Revalidation Constants

**File:** `/Users/smroczek/Projects/camp-os/src/lib/revalidation.ts`

### Purpose

Centralizes path revalidation logic to ensure consistency and prevent typos when invalidating Next.js cache.

### Constants

#### `PATHS`

Object containing role-based path arrays for cache revalidation.

```typescript
export const PATHS = {
  admin: ["/dashboard/admin", "/dashboard/admin/programs", "/dashboard/admin/forms"],
  parent: ["/dashboard/parent"],
  nurse: ["/dashboard/nurse"],
  staff: ["/dashboard/staff"],
} as const;
```

### Functions

#### `revalidateAdmin()`

Revalidates all admin dashboard paths.

**Example Usage:**

```typescript
// Before (scattered revalidation calls)
export async function createSessionAction(data: SessionData) {
  // ... create session logic ...
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/programs");
  revalidatePath("/dashboard/admin/forms");
}

// After (using revalidateAdmin)
import { revalidateAdmin } from "@/lib/revalidation";

export async function createSessionAction(data: SessionData) {
  // ... create session logic ...
  revalidateAdmin();
}
```

#### `revalidateParent()`

Revalidates all parent dashboard paths.

**Example Usage:**

```typescript
import { revalidateParent } from "@/lib/revalidation";

export async function registerForSessionAction(sessionId: string) {
  // ... registration logic ...
  revalidateParent();
}
```

### Benefits

1. **Consistency:** All revalidation uses the same path strings
2. **Maintainability:** Update paths in one place
3. **Type Safety:** Paths are defined as constants
4. **Discoverability:** Easy to see all paths that get revalidated

---

## 3. Shared Session Form

**File:** `/Users/smroczek/Projects/camp-os/src/components/admin/session-form.tsx`

### Purpose

Extracts common form structure from `create-session-dialog.tsx` and `edit-session-dialog.tsx` to reduce code duplication and ensure UI consistency.

### Component Props

```typescript
interface SessionFormProps {
  control: Control<any>;           // React Hook Form control
  setValue?: UseFormSetValue<any>; // Required only if showFormsSection is true
  onSubmit: () => void;            // Form submission handler
  onCancel: () => void;            // Cancel button handler
  loading: boolean;                // Loading state for buttons
  errorMessage?: string;           // Error message to display
  submitLabel?: string;            // Submit button label (default: "Save")
  showFormsSection?: boolean;      // Show forms section (create mode only)
  defaultEligibilityOpen?: boolean; // Initial state of eligibility section
  defaultFormsOpen?: boolean;      // Initial state of forms section
  defaultDetailsOpen?: boolean;    // Initial state of details section
}
```

### Features

- **Dates & Pricing** section (always visible)
- **Status** selector dropdown
- **Eligibility** section (collapsible, optional)
- **Forms** section (collapsible, optional, create mode only)
- **Additional Details** section (collapsible, optional)
- Error display
- Loading states
- Cancel/Submit buttons

### Example Usage

#### For Create Dialog

```typescript
import { SessionForm } from "@/components/admin/session-form";

export function CreateSessionDialog() {
  const form = useForm<CreateSessionInput>({ ... });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    await form.handleSubmit(async (data) => {
      setLoading(true);
      const result = await createSessionAction(data);
      if (result.success) {
        setOpen(false);
        form.reset();
      }
      setLoading(false);
    })();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* ... dialog trigger ... */}
      <DialogContent>
        <Form {...form}>
          <form>
            <SessionForm
              control={form.control}
              setValue={form.setValue}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
              loading={loading}
              errorMessage={form.formState.errors.root?.message}
              submitLabel="Create Session"
              showFormsSection={true}  // Enable forms section for create
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

#### For Edit Dialog

```typescript
import { SessionForm } from "@/components/admin/session-form";

export function EditSessionDialog({ session }: EditSessionDialogProps) {
  const form = useForm<EditSessionInput>({ ... });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    await form.handleSubmit(async (data) => {
      setLoading(true);
      const result = await updateSessionAction(data);
      if (result.success) {
        setOpen(false);
      }
      setLoading(false);
    })();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* ... dialog trigger ... */}
      <DialogContent>
        <Form {...form}>
          <form>
            <SessionForm
              control={form.control}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
              loading={loading}
              errorMessage={form.formState.errors.root?.message}
              submitLabel="Save Changes"
              showFormsSection={false}  // No forms section for edit
              defaultEligibilityOpen={!!(session.minAge || session.maxAge)}
              defaultDetailsOpen={!!(session.specialInstructions)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Benefits

1. **Reduced Duplication:** Common form structure defined once
2. **Consistency:** Create and edit dialogs use identical UI
3. **Maintainability:** Form changes only need to be made in one place
4. **Flexibility:** Props allow customization for different use cases
5. **Type Safety:** TypeScript ensures correct usage

---

## Migration Guide

These utilities are designed for **incremental adoption**. You don't need to refactor all existing code immediately.

### Recommended Approach

1. **New Features:** Use these utilities for all new server actions and forms
2. **Bug Fixes:** When fixing bugs in existing code, consider migrating to utilities
3. **Refactoring:** Gradually migrate existing code during planned refactoring sessions

### Migration Checklist

#### Server Actions

- [ ] Replace manual auth checking with `withAuth()` or `withAdminAuth()`
- [ ] Update return types to use `ActionResult<T>`
- [ ] Replace scattered revalidation calls with utility functions

#### Forms

- [ ] Extract common form structure to use `SessionForm`
- [ ] Remove duplicated form field definitions
- [ ] Update dialog components to use shared form component

### Priority

**High Priority (Do First):**
- New server actions should use wrappers
- New forms should use shared components

**Medium Priority (Do When Touching Code):**
- Migrate existing server actions during bug fixes
- Update revalidation calls when modifying actions

**Low Priority (Nice to Have):**
- Refactor all existing code to use utilities
- Update older forms to use shared components

---

## Related Files

### Server Action Examples
- `/Users/smroczek/Projects/camp-os/src/app/actions/session-actions.ts`
- `/Users/smroczek/Projects/camp-os/src/app/actions/admin-actions.ts`
- `/Users/smroczek/Projects/camp-os/src/app/actions/parent-actions.ts`

### Form Examples
- `/Users/smroczek/Projects/camp-os/src/components/admin/create-session-dialog.tsx`
- `/Users/smroczek/Projects/camp-os/src/components/admin/edit-session-dialog.tsx`

---

## Questions?

For questions or suggestions about these utilities, refer to:
- **AGENTS.md** - Project architecture and patterns
- **CLAUDE.md** - Claude Code specific instructions
- **README.md** - Setup and getting started
