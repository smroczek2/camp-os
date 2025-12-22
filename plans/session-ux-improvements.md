# Session UX Improvements Plan

## Problem Summary

The current session management experience has significant UX gaps that make it difficult for admins to manage sessions effectively and for parents to find and register for camps.

## Issues Identified

### Critical (P0)
1. **Session names not displaying** - Sessions show only dates, names appear empty
2. **Sessions not clickable** - No way to view session details or registrations
3. **No shareable registration links** - Admins can't share links for parents to register

### High Priority (P1)
4. **No session edit capability** - Can't modify sessions after creation
5. **No session detail page** - Missing dedicated page for session management
6. **Poor admin visibility** - Can't see who's registered for a session

### Medium Priority (P2)
7. **No session actions** - Can't delete, archive, or duplicate sessions
8. **Status not actionable** - Can't toggle session status (draft/open/closed)
9. **Missing session stats** - No revenue, fill rate, or registration breakdown per session

---

## Implementation Plan

### Phase 1: Fix Session Names Display (Quick Fix)
**Goal:** Ensure session names display correctly everywhere

**Tasks:**
1. Investigate why session names appear empty (check database vs code)
2. Fix any rendering issues in:
   - Admin dashboard session list
   - Admin sessions page
   - Parent dashboard session cards
3. Ensure new sessions created via dialog have names

**Files to check/modify:**
- `src/app/(site)/dashboard/admin/page.tsx`
- `src/app/(site)/dashboard/admin/programs/page.tsx`
- `src/app/(site)/dashboard/parent/page.tsx`
- `src/components/admin/create-session-dialog.tsx`

---

### Phase 2: Session Detail Page (Admin)
**Goal:** Create a dedicated page to view and manage individual sessions

**Route:** `/dashboard/admin/programs/[sessionId]`

**Features:**
- Session header with name, status badge, dates, price
- Quick stats: registered count, capacity, fill %, revenue
- Registration list with camper names, status, payment info
- Edit session button (opens edit dialog or inline)
- Copy registration link button
- Change status dropdown (draft → open → closed)

**New files:**
- `src/app/(site)/dashboard/admin/programs/[sessionId]/page.tsx`
- `src/components/admin/session-detail-header.tsx`
- `src/components/admin/registration-list.tsx`
- `src/components/admin/copy-link-button.tsx`

**Modifications:**
- Make session rows clickable in sessions list
- Add chevron/arrow indicator for clickability

---

### Phase 3: Shareable Registration Links
**Goal:** Allow admins to share direct links for parent registration

**Option A: Public Session Page**
- Route: `/sessions/[sessionId]` (public, no auth required to view)
- Shows session details, eligibility, price
- "Register" button redirects to login → parent dashboard with session pre-selected

**Option B: Query Parameter Approach**
- Link: `/dashboard/parent?register=[sessionId]`
- When parent logs in, automatically scrolls to / highlights that session
- Opens registration dialog automatically

**Recommended:** Option A (better UX, allows browsing before login)

**New files:**
- `src/app/(public)/sessions/[sessionId]/page.tsx`
- `src/components/session/public-session-card.tsx`

---

### Phase 4: Session Edit Capability
**Goal:** Allow admins to modify sessions after creation

**Approach:**
- Reuse existing form sections from create dialog
- Add edit mode to session detail page
- Server action for updating sessions

**New files:**
- `src/app/actions/session-actions.ts` - add `updateSessionAction`
- `src/components/admin/edit-session-dialog.tsx`

**Features:**
- Edit all fields: name, description, dates, pricing, capacity
- Edit eligibility (age/grade ranges)
- Edit registration window
- Edit forms attached to session

---

### Phase 5: Session Actions
**Goal:** Add common management actions

**Actions to implement:**
1. **Delete session** (with confirmation, only if no registrations)
2. **Archive session** (hide from parent view, keep data)
3. **Duplicate session** (copy all settings, adjust dates)
4. **Export registrations** (CSV download)

**UI Location:**
- Dropdown menu on session detail page
- Or action buttons in header

---

## Technical Notes

### Database Considerations
- Session names are stored in `sessions.name` column
- Need to investigate if seed data was run or if sessions have null names
- May need migration if column has issues

### Component Reuse
- Reuse `DatesPricingSection`, `EligibilitySection` for edit
- Reuse `SessionStatusBadge` but make it actionable

### API Routes Needed
- `PATCH /api/sessions/[id]` - Update session
- `DELETE /api/sessions/[id]` - Delete session
- `POST /api/sessions/[id]/duplicate` - Duplicate session
- `GET /api/sessions/[id]/registrations` - Get registrations (or use server component)

---

## Success Metrics

1. Session names visible on all pages
2. Admin can click session → see details → see registrations
3. Admin can copy shareable link for any session
4. Admin can edit session after creation
5. Parents can view session details before registering

---

## Implementation Order

1. **Phase 1** (1-2 hours) - Fix names, quick win
2. **Phase 2** (3-4 hours) - Session detail page, biggest impact
3. **Phase 3** (2-3 hours) - Shareable links, high value
4. **Phase 4** (2-3 hours) - Edit capability
5. **Phase 5** (2 hours) - Actions (can defer)

**Total estimate:** 10-14 hours of implementation

---

## Questions to Clarify

1. Should sessions be viewable publicly without login, or require login?
2. Do we want inline editing on detail page or modal-based editing?
3. Should we support waitlists when sessions are full?
4. Do we need session categories/tags for filtering?
