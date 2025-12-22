---
status: ready
priority: p1
issue_id: "021"
tags: [ui, backend, crud, medications, documents, groups]
dependencies: []
---

# Backend Tables Without Frontend CRUD Operations

APPROVED - 6 database tables have zero frontend UI for managing data.

## Problem Statement

The database schema defines several important tables, but there are NO server actions or UI components to create, update, or delete records. Data can only be managed via database seeds or direct SQL.

## Findings

### Tables with ZERO UI:

1. **medications** (Lines 91-109 in schema.ts)
   - Purpose: Track medications for children
   - No create/edit/delete actions
   - Nurse dashboard shows read-only

2. **medicationLogs** (Lines 384-407)
   - Purpose: Log medication administration
   - No way for nurses to record medications given
   - Photo verification field unused

3. **documents** (Lines 224-244)
   - Purpose: Parent document uploads (custody, medical, immunization)
   - No upload UI
   - No file storage integration

4. **groups** (Lines 264-281)
   - Purpose: Cabin/activity groups
   - Only populated via seed script
   - Admins cannot create/manage groups

5. **groupMembers** (Lines 312-334)
   - Purpose: Assign children to groups
   - No UI for adding children to groups
   - No bulk assignment capability

6. **assignments** (Lines 283-310)
   - Purpose: Assign staff to groups
   - Read-only on staff dashboard
   - Admins cannot manage assignments

## Proposed Solutions

### Option 1: Phase Implementation (Recommended)

**Phase A - Medical (Highest Priority):**
1. Create `medication-actions.ts` with CRUD operations
2. Build medication management dialog for nurses
3. Build medication logging interface
4. Add medication schedule view

**Phase B - Groups:**
1. Create `group-actions.ts`
2. Build group management for admins
3. Build child-to-group assignment UI
4. Build staff assignment UI

**Phase C - Documents:**
1. Create `document-actions.ts`
2. Add file upload integration (S3/R2)
3. Build parent document upload UI
4. Build document verification admin UI

**Effort:** 40-60 hours total (15-20 hours per phase)
**Risk:** Medium

### Option 2: Generate UI with AI Form Builder

Use existing AI form builder to generate management forms, then integrate.

**Effort:** 20-30 hours
**Risk:** Higher (may not fit existing patterns)

## Acceptance Criteria

### Phase A - Medical:
- [ ] Nurses can add medications for children
- [ ] Nurses can log medication administration
- [ ] Medication schedule visible to staff
- [ ] Guardian notification on administration

### Phase B - Groups:
- [ ] Admins can create/edit/delete groups
- [ ] Admins can assign children to groups
- [ ] Admins can assign staff to groups
- [ ] Staff see their group assignments

### Phase C - Documents:
- [ ] Parents can upload documents
- [ ] Admins can view/download documents
- [ ] Document expiration tracking
- [ ] Required document checklist per child

## Work Log

### 2025-12-22 - Initial Discovery

**By:** Backend-Frontend Gap Analysis Agent

**Actions:**
- Analyzed schema against UI components
- Found 6 tables with zero frontend
- Documented missing server actions
- Prioritized by operational impact
