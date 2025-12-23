---
status: complete
priority: p3
issue_id: "027"
tags: [attendance, checkin, checkout, operations]
dependencies: []
---

# Attendance Check-In/Check-Out UI Missing

APPROVED - Attendance dashboard is view-only. No check-in actions.

## Problem Statement

The attendance dashboard shows records but staff cannot:
- Check children in when they arrive
- Check children out when they leave
- Update attendance status
- Record notes about attendance

Attendance data only exists from database seeds.

## Findings

**Current State:**
- `attendance` table exists with proper schema
- `checkedInAt`, `checkedOutAt` timestamps exist
- `checkedInBy`, `checkedOutBy` user references exist
- Dashboard displays attendance records nicely
- BUT no buttons or forms to create/update records

**Missing Components:**
1. Check-in button/action
2. Check-out button/action
3. Staff-friendly quick check-in UI
4. Bulk check-in capability
5. Late arrival handling
6. Absence recording

## Proposed Solutions

### Option 1: Staff-Friendly Check-In Interface (Recommended)

**Quick Check-In View:**
- Show all expected children for today
- One-click check-in buttons
- Search/filter by name
- Visual status indicators

**Implementation:**
```typescript
// src/app/actions/attendance-actions.ts
export async function checkInChildAction(data: {
  childId: string;
  sessionId: string;
}) {
  // Verify staff has permission
  // Create attendance record with checkedInAt = now
  // Record checkedInBy = current user
}

export async function checkOutChildAction(data: {
  attendanceId: string;
}) {
  // Update attendance with checkedOutAt = now
  // Record checkedOutBy = current user
}
```

**Effort:** 6-10 hours
**Risk:** Low

### Option 2: Mobile-First Check-In

Build separate mobile interface for quick check-in.

**Effort:** 12-16 hours
**Risk:** Medium

## Acceptance Criteria

- [ ] Staff can check in children with one click
- [ ] Staff can check out children
- [ ] Check-in/out records who performed action
- [ ] Expected children list shows who's not arrived
- [ ] Search by child name
- [ ] Visual indicators (green = present, gray = not arrived)

## Technical Details

**New Files:**
- `src/app/actions/attendance-actions.ts`
- `src/components/admin/check-in-list.tsx`
- `src/components/admin/check-in-button.tsx`

**Modify:**
- `src/app/(site)/dashboard/admin/attendance/page.tsx`

## Work Log

### 2025-12-22 - Initial Discovery

**By:** Backend-Frontend Gap Analysis Agent

**Actions:**
- Identified attendance as view-only
- Verified schema supports check-in/out
- Designed staff-friendly interface
- Documented action requirements
