# Button-Link Semantics Refactor

## Overview

Refactor navigation patterns to use proper semantic HTML with `asChild` composition pattern instead of nested interactive elements (`<Link><Button></Button></Link>`).

## Problem Statement

Current dashboard navigation uses invalid HTML pattern:
- Sidebar navigation: 15 items with nested buttons inside links
- Admin header quick actions: 5 buttons with nested buttons inside links
- Creates WCAG 2.1 violations and accessibility issues
- Screen readers announce redundant interactive elements
- Keyboard navigation becomes confusing

## Solution

Replace with semantic pattern using `Button asChild`:
```tsx
// From (invalid):
<Link href="/path">
  <Button variant="ghost">Content</Button>
</Link>

// To (valid):
<Button asChild variant="ghost">
  <Link href="/path">Content</Link>
</Button>
```

## Files to Modify

1. `/src/components/dashboard/dashboard-sidebar.tsx` (Lines 41-57)
   - 15 navigation items across 4 role-based sections
   - Update pattern to use `asChild`
   - Verify active state styling
   - Test badge positioning

2. `/src/app/(site)/dashboard/admin/page.tsx` (Lines 77-107)
   - 5 quick action buttons
   - Update pattern to use `asChild`
   - Verify button variants apply correctly
   - Test responsive behavior

## Acceptance Criteria

### Phase 1: Analysis & Planning ✅ COMPLETE
- [x] Identify all button-like navigation patterns
- [x] Document issues and violations
- [x] Research best practices
- [x] Create implementation plan

### Phase 2: Implementation
- [ ] Refactor sidebar navigation component
- [ ] Refactor admin header quick action buttons
- [ ] CSS adjustments if needed
- [ ] No TypeScript errors
- [ ] Linting passes

### Phase 3: Testing & Validation
- [ ] Run accessibility audit (pre/post)
- [ ] Manual testing across browsers
- [ ] Keyboard navigation testing
- [ ] Visual regression verification
- [ ] Touch device testing

### Phase 4: Deployment
- [ ] Code review approval
- [ ] Merge to main
- [ ] Deploy to production

## Success Metrics

- ✅ Zero TypeScript errors
- ✅ All linting passes
- ✅ WCAG 2.1 Level A compliant
- ✅ Nested button count reduced from 12 to 0-1
- ✅ No visual regressions
- ✅ Keyboard navigation works
- ✅ Right-click context menu works
- ✅ Mobile interaction works

## References

- [WCAG 2.1 - Interactive Elements](https://www.w3.org/TR/WCAG21/#info-and-relationships)
- [shadcn/ui asChild Pattern](https://ui.shadcn.com/docs/components/button)
- [Radix UI Composition](https://www.radix-ui.com/primitives/docs/guides/composition)
- Current implementation: `/src/components/dashboard/dashboard-sidebar.tsx`

## Status

Ready for implementation by Claude Opus 4.5 or equivalent model.
