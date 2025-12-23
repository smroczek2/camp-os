# UI & UX Navigation Overhaul Plan

**Date:** 2026-01-09  
**Scope:** Cross-role dashboards (admin, staff, nurse, parent), global navigation, search, and action patterns  
**Goal:** Replace confusing/isolated UI with a consistent, role-aware navigation and layout system that clarifies what each role can do and where to find it.

---

## Context & Pain Points
- Navigation sits in a small card at top-left; primary actions float in headers with no hierarchy.
- Search lives under the top menu and feels secondary; no command palette/hotkeys.
- Role visibility is unclear (admin can see nurse affordances); nav items are not consistently gated.
- Dashboards contain ad-hoc button clusters (Accounts, Sessions, Attendance, etc.) with varying styles and placement.
- Visual rhythm varies by page (mismatched paddings, card styles, typography scale); mobile/nav experiences differ by role.

## Objectives
1) Establish a single dashboard shell shared by all roles (desktop + mobile) with predictable regions: brand/role switcher, primary nav, search/command, page actions, breadcrumbs, content.  
2) Rebuild information architecture per role so only allowed destinations/actions appear.  
3) Make search/command first-class (top-aligned, keyboard driven) with scoped placeholders per role.  
4) Normalize action placement (primary vs secondary) and card/grid spacing for consistency.  
5) Preserve RBAC and data filtering; surface permission state in the UI (disabled + explain why) instead of showing everything.

## Work Streams (parallel-friendly)
**A) Navigation & Shell System**  
- Create `DashboardShell` (layout) that renders: top bar (brand, role switcher, status), left rail (collapsible) on desktop, mobile bottom tab bar, breadcrumbs, content area.  
- Extract `NavItem` config per role into a single source of truth; support sections and badges (e.g., “New”, counts).  
- Add layout tokens for spacing, card width, max content width.

**B) Search & Command**  
- Promote search to top bar with consistent width; add cmd/ctrl+k shortcut to open a command palette.  
- Provide scoped search per role (accounts/sessions/forms for admin; groups/attendance for staff; medications/incidents for nurse; sessions/registrations/children for parent).  
- Add “recent” and “quick actions” in the palette (e.g., “Create session”, “Log medication”, “Check-in group”).

**C) Role Visibility & Permissions**  
- Tie nav/action visibility to `enforcePermission`/role maps; remove cross-role affordances from UI.  
- Add inline “permission denied” empty states where needed instead of hiding data errors.  
- Provide visual role indicator (chip) in the top bar; clarify environment (Dev Auth vs OAuth).

**D) Page-Level Action Hygiene**  
- Standardize action row at top of each page: primary (filled), secondary (outline/ghost), tertiary in kebab menu.  
- Consolidate dashboard button clusters into page-level actions and inline row actions.  
- Introduce consistent card headers (title + meta + action) and table bars (filters/search/download in one place).

**E) Visual Cohesion & Mobile**  
- Define typography scale for headings/subheads/body; align paddings/gaps across cards and grids.  
- Align icon sizing/stroke and badge usage; introduce subtle backgrounds (no floating card-on-card).  
- Ensure mobile parity: bottom nav, sticky page actions where needed, collapsible filters.

## Phases & Deliverables
1) **IA & Shell Definition (1–2 days)**  
   - Deliver: `dashboard-shell` design doc, nav map per role, wireframe of top bar/left rail/mobile tabs.  
2) **Shell Implementation (2 days)**  
   - Deliver: Shared `DashboardShell` component; updated `(site)/dashboard/layout.tsx` to use it; responsive left rail + bottom tabs.  
3) **Search/Command Layer (1–2 days)**  
   - Deliver: `CommandPalette` with role-scoped sources; replace `DashboardTopbar` search with new component + hotkey.  
4) **Role-Gated Nav & Actions (2–3 days)**  
   - Deliver: Updated nav config enforcing roles; audit of all dashboards to remove cross-role actions; permission-aware empty/disabled states.  
5) **Page Refits & Action Hygiene (3–4 days)**  
   - Deliver: Admin/staff/nurse/parent dashboards refit to shell; standardized action bars; cleaned button clusters.  
6) **Visual Pass & Mobile QA (1–2 days)**  
   - Deliver: Typography/spacing tokens; consistent card/table shells; mobile navigation QA across roles.

## Acceptance Criteria
- All dashboard routes render inside a single `DashboardShell` with top bar, left rail (desktop), and bottom nav (mobile).  
- Search is available from the top bar and via cmd/ctrl+k; results/actions are role-scoped.  
- Nav and actions only show items the current role may access; admin cannot see nurse-specific UI and vice versa.  
- Page-level actions follow a consistent hierarchy (primary filled, secondary outline, tertiary menu); no floating button clusters.  
- Breadcrumbs visible on all nested pages; content width/padding consistent across dashboards.  
- Mobile: bottom nav works for every role; no orphan pages without reachable nav.  
- Lint/typecheck pass after refactor; smoke tests for each role’s primary flows still function.

## Risks & Mitigations
- **Scope creep:** Lock IA and shell before refitting pages; treat new features as follow-ups.  
- **Regression in RBAC:** Pair UI visibility changes with permission checks; add snapshots of nav config by role.  
- **Fragmented styling:** Centralize tokens in shell/theme and forbid local overrides without review.

## Next Steps
- Review/adjust IA and phase breakdown with stakeholders.  
- If approved, start `/work` with Phase 1 (shell doc + nav map) while in parallel prototyping command palette data sources.  
- Schedule a short design review after shell wireframes before coding Phase 2.
