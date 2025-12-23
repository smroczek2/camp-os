# Dashboard Shell & Navigation IA

**Date:** 2026-01-09  
**Scope:** Cross-role dashboards (admin, staff, nurse, parent)  
**Goal:** Define a single dashboard shell and role-aware navigation/search pattern to replace the current top-left card nav and ad-hoc action clusters.

## Principles
- One shell for all roles (desktop + mobile) with predictable regions: top bar, left rail, breadcrumbs, content, mobile bottom nav.
- Navigation and actions are role-scoped; never show destinations a role cannot use.
- Search/command is first-class (top bar + cmd/ctrl+k) with role-specific scopes and quick actions.
- Page actions follow a clear hierarchy: primary (filled), secondary (outline/ghost), tertiary (kebab).
- Consistent spacing/typography/card shells; avoid floating button piles in headers.

## Shell Layout (desktop)
- **Top bar:** brand glyph + “Camp OS”, role chip, user menu, mode toggle; primary search/command input centered/right; optional status (Dev Auth).
- **Left rail:** collapsible nav with section labels; active state is solid/filled; badges for counts/“New”.
- **Breadcrumb row:** sits above content on all nested pages; shows page-level action bar on the right.
- **Content area:** max-width container with uniform padding (desktop 32px, mobile 16px); cards use consistent radius/shadow.

## Shell Layout (mobile)
- **Top bar:** brand + role chip + user menu + search trigger; keep height compact.
- **Bottom nav:** persistent tabs per role (4–5 max) with icons + labels; mirrors primary desktop nav.
- **Filters/actions:** collapsible drawers; avoid floating buttons overlapping bottom nav.
- **Breadcrumbs:** condensed text label above content; back button when depth >1.

## Navigation Map (proposed, matches existing routes)
- **Admin:** Overview `/dashboard/admin`, Accounts `/dashboard/admin/accounts`, Programs `/dashboard/admin/programs`, Attendance `/dashboard/admin/attendance`, Incidents `/dashboard/admin/incidents`, Forms `/dashboard/admin/forms`. Optional tertiary: Reports/Export (in action menus, not primary nav).
- **Staff:** Overview `/dashboard/staff`, Groups `/dashboard/staff/groups`, Attendance `/dashboard/staff/attendance`.
- **Nurse:** Overview `/dashboard/nurse`, Medications `/dashboard/nurse/medications`, Incidents `/dashboard/nurse/incidents`.
- **Parent:** Overview `/dashboard/parent`, Children `/dashboard/parent/children`, Registrations `/dashboard/parent/registrations`, Sessions `/dashboard/parent/sessions`, Forms `/dashboard/parent/forms`.
- **Rules:** Only render nav for the current role; do not co-mingle nurse/admin items. All nav generation comes from a single config map.

## Search & Command
- Replace the current under-header search with a **top-bar search field + cmd/ctrl+k palette**.
- **Scopes by role:**  
  - Admin: accounts, sessions/programs, forms, incidents, attendance logs (ids/name/date).  
  - Staff: groups, attendance, assigned children.  
  - Nurse: medications, incidents, children.  
  - Parent: sessions, registrations, children, forms.  
- **Quick actions (palette):** create session (admin), log medication (nurse), start check-in (staff), register child/pay now (parent).  
- **UX:** keyboard shortcut visible; inline placeholder reflects role scope; recent items surfaced in palette.

## Action Placement
- **Page-level action bar:** right side of breadcrumb row; primary filled, secondary outline, tertiary menu. No free-floating button stacks in headers.
- **Tables/lists:** filters + search + export grouped in a single toolbar above the table.
- **Row actions:** icon buttons or kebab menus; avoid duplicating actions in both header and row.

## Permissions & Visibility
- Nav/action visibility tied to role/permission checks before render.  
- If a user lands on a disallowed route, show a permission empty state instead of leaking cross-role UI.  
- Surface role chip + environment (e.g., “Dev user”) in top bar for clarity.

## Spacing & Visual Tokens
- Desktop container padding 32px; mobile 16px; consistent gap scale (8/12/16/24/32).  
- Cards: uniform radius/shadow, consistent header/footer padding.  
- Icon sizing: 16–20px; badge usage for status, not decoration.  
- Typography: H1 32/36, H2 24/28, H3 20/24, body 14–16.

## Implementation Notes (Phase 2 targets)
- Create `DashboardShell` that wraps top bar, left rail, breadcrumbs, content, mobile bottom nav; used by `(site)/dashboard/layout.tsx`.
- Centralize nav config (per role) with flags for mobile visibility/badges to feed both left rail and bottom nav.
- Replace `DashboardTopbar` with `CommandSearch` component (search field + palette trigger).
- Add breadcrumb component that accepts segments and slots an action area.
- Keep RBAC enforcement in server actions; UI visibility is additive safety, not the only guard.
