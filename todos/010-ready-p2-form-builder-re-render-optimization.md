---
status: ready
priority: p2
issue_id: "010"
tags: [performance, react, optimization, memoization]
dependencies: [007]
---

# Optimize Form Builder Re-renders - Add Memoization

Form builder components re-render excessively, causing lag during editing. No memoization.

## Problem Statement

Form editing triggers full component re-renders with O(n) operations:
- Editing field label: iterates through all 50 fields
- Adding option: iterates through all fields × all options
- Every keystroke recalculates everything
- No React.memo, useMemo, or useCallback optimization

**Current Performance:**
- 50 fields × 5 options = 250 potential iterations per keystroke
- Noticeable lag at 30+ fields
- Will be unusable at 100+ fields

## Findings

**From Performance Oracle Review:**

**Problem areas in form-details.tsx:**

1. **No field memoization:**
```typescript
// Current: Re-renders ALL fields on ANY change
draft.fields.map(field => (
  <FieldEditor field={field} onChange={...} />
))
```

2. **Sorting on every render:**
```typescript
// Lines 516-519, 798-800
const sortedFields = [...draft.fields].sort((a, b) =>
  a.displayOrder - b.displayOrder
);
// Runs on EVERY render
```

3. **No callback memoization:**
```typescript
// New function created on every render
onChange={(e) => setDraft(prev => ({...}))}
```

## Proposed Solutions

### Option 1: Add React.memo + useCallback (RECOMMENDED)

Memoize components and callbacks to prevent unnecessary re-renders:

```typescript
// Memoize field editor component
const FieldEditor = React.memo(({
  field,
  onUpdate,
  onRemove
}: FieldEditorProps) => {
  // Only re-renders when field prop changes
  return <div>...</div>;
});

// Memoize update handlers
const updateField = useCallback((fieldId: string, updates: Partial<Field>) => {
  setDraft(prev => ({
    ...prev,
    fields: prev.fields.map(f =>
      f.id === fieldId ? { ...f, ...updates } : f
    )
  }));
}, []);

// Memoize sorted fields
const sortedFields = useMemo(() =>
  [...draft.fields].sort((a, b) => a.displayOrder - b.displayOrder),
  [draft.fields] // Only recalculate when fields change
);
```

**Expected improvement:** 60-70% reduction in re-renders

**Effort:** 4-6 hours
**Risk:** Low

### Option 2: Extract to Separate Components

Split large components into smaller ones (related to issue #007):

```typescript
// Each field is an independent component
function FieldListItem({ field, index }: Props) {
  // Isolated state and re-render scope
}

// List only re-renders when fields array changes
function FieldList({ fields }: Props) {
  return fields.map(field => (
    <FieldListItem key={field.id} field={field} />
  ));
}
```

**Effort:** 8-12 hours (part of #007)
**Risk:** Medium

### Option 3: Use Immer for State Updates

Simplify state updates and improve performance:

```typescript
import { useImmer } from 'use-immer';

const [draft, updateDraft] = useImmer(initialDraft);

// Simpler, faster state updates
updateDraft(draft => {
  const field = draft.fields.find(f => f.id === fieldId);
  if (field) field.label = newLabel;
});
```

**Effort:** 2-3 hours
**Risk:** Low

## Recommended Action

Implement all three options:
1. Add React.memo + useCallback (quick win)
2. Use Immer for state management (simplification)
3. Extract components as part of #007

## Technical Details

**Affected files:**
- `src/components/forms/form-builder/form-details.tsx` - Main optimization target
- `src/app/dashboard/admin/forms/ai-chat/page.tsx` - Similar issues
- `src/components/forms/form-renderer/dynamic-form.tsx` - Conditional logic memoization

**Performance targets:**
- Before: 250 iterations per keystroke (50 fields × 5 options)
- After: <10 iterations per keystroke (only affected component)
- Target: No visible lag up to 100 fields

**Measurements:**
Use React DevTools Profiler to measure:
- Re-render count
- Render duration
- Component update frequency

## Acceptance Criteria

- [ ] React.memo added to field editor components
- [ ] useCallback used for all update handlers
- [ ] useMemo used for sorting and filtering
- [ ] No visible lag when editing 50-field forms
- [ ] Performance profiling shows 60%+ re-render reduction
- [ ] No regression in functionality
- [ ] Tests pass

## Work Log

### 2025-12-16 - Initial Discovery

**By:** Performance Oracle Agent

**Actions:**
- Profiled form builder rendering
- Identified missing memoization patterns
- Calculated O(n) complexity on every keystroke
- Designed optimization strategy

**Learnings:**
- No memoization in current implementation
- Every state update triggers full re-render
- Sorting happens on every render
- Simple optimizations can provide 60-70% improvement
- Related to component size issue (#007)

---

### 2025-12-16 - Approved for Work

**By:** Claude Triage System

**Actions:**
- Issue approved during triage session
- Status changed from pending → ready
- Ready to be picked up and worked on

**Learnings:**
- Performance issue causing lag at 30+ fields
- 60-70% re-render reduction possible
- Depends on issue #007 for best results

## Notes

- Depends on #007 (component extraction) for best results
- Quick wins possible with React.memo + useCallback
- Immer simplifies complex state updates
- Should be done before adding more form features
- Use React DevTools Profiler to measure improvements
