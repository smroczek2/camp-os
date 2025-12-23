---
status: complete
priority: p2
issue_id: "023"
tags: [cleanup, dead-code, refactoring, maintenance]
dependencies: []
---

# Dead Code and Unused Dependencies Cleanup

APPROVED - Unused functions, components, and dependencies should be removed.

## Problem Statement

The codebase contains dead code from architecture changes (multi-tenant to single-tenant) and scaffolding that was never used. This adds confusion and maintenance burden.

## Findings

### Unused Functions (Remove):

1. **`isSuperAdmin()`** - `/src/lib/auth-helper.ts` (Lines 35-38)
   - Exported but never imported
   - Replaced by role-based RBAC

2. **`requireAuth()`** - `/src/lib/auth-helper.ts` (Lines 43-49)
   - Never called
   - Replaced by `getSession()` pattern

3. **`isRateLimitingEnabled()`** - `/src/lib/rate-limit.ts` (Lines 201-206)
   - Never imported anywhere

4. **`getPendingFormGenerations()`** - `/src/lib/ai-tools/form-builder-tool.ts` (Lines 227-238)
   - Never called, incomplete feature

### Unused Components (Remove):

5. **`GitHubStars`** - `/src/components/ui/github-stars.tsx`
   - Boilerplate component, 53 lines
   - Never imported

6. **`StarterPromptModal`** - `/src/components/starter-prompt-modal.tsx`
   - ~202 lines of boilerplate
   - Only used by other unused components

7. **`SetupChecklist`** - `/src/components/setup-checklist.tsx`
   - ~120 lines
   - Scaffolding, not used

### Unused Dependencies (Remove from package.json):

8. **`tw-animate-css`** - Not imported anywhere
9. **`use-immer`** - Not imported anywhere

### Unused Scripts:

10. **`fix-super-admin-roles.ts`** - `/src/scripts/fix-super-admin-roles.ts`
    - One-time migration script, should be archived

## Proposed Solutions

### Option 1: Manual Cleanup (Recommended)

**Steps:**
1. Delete unused functions from auth-helper.ts
2. Delete unused components (3 files)
3. Remove unused packages: `npm uninstall tw-animate-css use-immer`
4. Move script to `scripts/archive/`
5. Run typecheck and lint to verify

**Effort:** 30-60 minutes
**Risk:** Very Low

### Option 2: Gradual Deprecation

Mark items as @deprecated first, remove in next sprint.

**Effort:** Same
**Risk:** Lower but slower

## Acceptance Criteria

- [ ] No unused exports in auth-helper.ts
- [ ] GitHubStars component deleted
- [ ] StarterPromptModal component deleted
- [ ] SetupChecklist component deleted
- [ ] tw-animate-css removed from package.json
- [ ] use-immer removed from package.json
- [ ] TypeScript compiles without errors
- [ ] ESLint passes

## Technical Details

**Files to Delete:**
- `src/components/ui/github-stars.tsx`
- `src/components/starter-prompt-modal.tsx`
- `src/components/setup-checklist.tsx`

**Files to Modify:**
- `src/lib/auth-helper.ts` - Remove unused functions
- `src/lib/rate-limit.ts` - Remove isRateLimitingEnabled
- `package.json` - Remove unused deps

**Commands:**
```bash
rm src/components/ui/github-stars.tsx
rm src/components/starter-prompt-modal.tsx
rm src/components/setup-checklist.tsx
npm uninstall tw-animate-css use-immer
npm run typecheck
npm run lint
```

## Work Log

### 2025-12-22 - Initial Discovery

**By:** Code Bloat Analysis Agent

**Actions:**
- Searched for unused exports
- Checked import references
- Identified unused npm dependencies
- Documented all dead code locations
