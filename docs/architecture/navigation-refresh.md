# Dashboard Navigation & Destination Refresh (Mar 2025)

## What changed
- Added a **role-aware dashboard shell** (shared layout, sidebar, mobile nav, top search) so parent/staff/nurse/admin all use the same frame.
- Introduced a **global dashboard search** page with role-filtered results.
- Filled missing destinations for parents (sessions/forms), staff (groups + attendance), and nurses (incidents + medications), so cards have real targets.
- Standardized **breadcrumbs** across dashboards to avoid dead ends.
- Tightened **attendance visibility** for staff to only their assigned groups and revalidated staff views on check-in/out.
- Added a **Dashboard** entry in the user menu for quick return to the app home.

## Key files (by concern)
- Navigation shell/config: `src/app/(site)/dashboard/layout.tsx`, `src/components/dashboard/dashboard-nav.ts`, `dashboard-sidebar.tsx`, `mobile-bottom-nav.tsx`, `dashboard-topbar.tsx`
- Global search: `src/app/(site)/dashboard/search/page.tsx`
- New parent destinations: `src/app/(site)/dashboard/parent/sessions/page.tsx`, `.../parent/forms/page.tsx`
- New staff destinations: `src/app/(site)/dashboard/staff/groups/page.tsx`, `.../staff/groups/[groupId]/page.tsx`, `.../staff/attendance/page.tsx`
- New nurse destinations: `src/app/(site)/dashboard/nurse/incidents/page.tsx`, `.../nurse/incidents/[id]/page.tsx`, `.../nurse/medications/page.tsx`, `.../nurse/medications/[medicationId]/page.tsx`
- Breadcrumb coverage: added to admin accounts, forms, incidents, AI setup, parent children/registrations/forms, and nurse/staff pages.
- Attendance hardening: `src/app/actions/attendance-actions.ts` (staff-scoped expected children + revalidate staff attendance view)
- User menu shortcut: `src/components/auth/user-profile.tsx`

## Intent / rationale
- Reduce “island” pages by giving every role a consistent frame (sidebar, mobile nav, search, breadcrumbs).
- Remove misleading hover/click affordances by pointing cards to real detail pages or removing hover emphasis.
- Make parent session cards link to the existing public session page for a quick, safe destination; keep admin “Sessions” labeled consistently even though the route stays `/dashboard/admin/programs`.
- Ensure staff attendance is limited to their assigned groups; admin retains full access.

## How to use
- The dashboard shell auto-detects the user role; pages under `/dashboard/*` now inherit shared nav/top search.
- Global search: `/dashboard/search?q=term` (wired from the top search bar).
- Parent session details: cards now link to `/sessions/[sessionId]`; parent sessions index lives at `/dashboard/parent/sessions`.
- Staff group drill-down: `/dashboard/staff/groups/[groupId]` (roster); staff attendance: `/dashboard/staff/attendance`.
- Nurse drill-down: `/dashboard/nurse/incidents/[id]`, `/dashboard/nurse/medications/[medicationId]`.

## Notes / follow-ups
- If you want a parent-only session detail page (instead of linking to the public session page), add `/dashboard/parent/sessions/[sessionId]` and point the cards there.
- If you want the admin URL to match the “Sessions” label, add an alias/redirect from `/dashboard/admin/sessions` to `/dashboard/admin/programs`.
- A future command palette (Cmd/Ctrl+K) could reuse the global search backend; currently it’s a top search form.
