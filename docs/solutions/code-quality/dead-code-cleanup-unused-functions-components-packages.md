---
title: Dead Code Removal - Functions, Components, and Dependencies
category: code-quality
tags: [cleanup, dead-code, refactoring, maintenance, technical-debt]
severity: low
date_solved: 2025-12-22
components: [src/lib/auth-helper.ts, src/lib/rate-limit.ts, src/lib/ai-tools/form-builder-tool.ts, src/components/ui/github-stars.tsx, src/components/starter-prompt-modal.tsx, src/components/setup-checklist.tsx, package.json]
symptoms: >-
  Codebase contained unused functions (isSuperAdmin, requireAuth, isRateLimitingEnabled, getPendingFormGenerations),
  unused UI components (GitHubStars, StarterPromptModal, SetupChecklist), and unused npm dependencies
  (tw-animate-css, use-immer). These added confusion, increased mental load for maintainers, and served
  no functional purpose.
root_cause: >-
  Architectural changes from multi-tenant to single-tenant migration and initial scaffolding left behind
  unused code that was never refactored or cleaned up.
---

# Dead Code Removal - Functions, Components, and Dependencies

## Problem

The codebase accumulated unused code from:
- Multi-tenant to single-tenant architecture migration
- Initial scaffolding that was never used
- Experimental features that were abandoned

## Investigation

Used grep to verify each export/import had no references outside its definition file:

```bash
# Check for unused exports
grep -r "isSuperAdmin" --include="*.ts" --include="*.tsx"
grep -r "requireAuth" --include="*.ts" --include="*.tsx"
grep -r "isRateLimitingEnabled" --include="*.ts" --include="*.tsx"
grep -r "getPendingFormGenerations" --include="*.ts" --include="*.tsx"
```

## Solution

### 1. Removed Unused Functions

**`src/lib/auth-helper.ts`** - Removed:
- `isSuperAdmin()` - No longer needed after single-tenant migration
- `requireAuth()` - Replaced by `getSession()` pattern

**`src/lib/rate-limit.ts`** - Removed:
- `isRateLimitingEnabled()` - Never imported anywhere

**`src/lib/ai-tools/form-builder-tool.ts`** - Removed:
- `getPendingFormGenerations()` - Incomplete feature, never used

### 2. Deleted Unused Components

```bash
rm src/components/ui/github-stars.tsx
rm src/components/starter-prompt-modal.tsx
rm src/components/setup-checklist.tsx
```

### 3. Removed Unused npm Packages

```bash
npm uninstall tw-animate-css use-immer --legacy-peer-deps
```

## Verification

```bash
npm run typecheck  # No errors
npm run lint       # No warnings
```

## Prevention

- Run periodic dead code analysis
- Review imports before merging PRs
- Remove scaffolding code after feature is complete
- Use `eslint-plugin-unused-imports` for automated detection
