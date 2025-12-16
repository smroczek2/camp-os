# Camp OS Phase 2.5 - Complete Testing Guide

**What We Built:**
- AI-powered form builder with admin interface
- Dynamic form renderer for parents
- Complete approval workflow
- Conditional logic and nested options support

---

## Manual Testing Instructions

### Test 1: Admin Creates Form with AI

**Goal:** Verify AI can generate a form from natural language

**Steps:**
1. Open browser to http://localhost:3004/dev-login
2. Click "Login as Admin"
3. You should see admin dashboard with "Form Builder" button in top right
4. Click "Form Builder" button
5. You should see Forms List page with stats (0 forms initially)
6. Click "Create with AI" button
7. AI Chat interface opens with:
   - Left: Chat panel
   - Right: Preview panel
   - Top: Camp/Session selector (optional)

8. Type this prompt:
   ```
   Create a summer camp registration form with:
   - child_name (text, required)
   - age (number, required, min 5, max 18)
   - has_allergies (boolean, required)
   - allergy_details (textarea, show only if has_allergies is true)
   - t_shirt_size (select, required, options: XS, S, M, L, XL)
   ```

9. Click Send (or press Enter)
10. AI should generate form and show preview on right
11. Preview should show:
    - Form name
    - Form type badge
    - Field count (5 fields)
    - List of all 5 fields with badges (Required, Conditional)

12. Click "Approve & Save"
13. Should redirect to Forms List
14. New form should appear with status "draft"

**Expected Result:**
✅ AI generates form from description
✅ Preview shows all fields correctly
✅ Conditional field marked as "Conditional"
✅ Form saves to database
✅ Appears in forms list

---

### Test 2: Admin Publishes Form

**Goal:** Verify form can be published and made available to parents

**Steps:**
1. From Forms List, click "View" on the newly created form
2. Form Details page loads showing:
   - Form name and description
   - Status badge ("draft")
   - 3 stat cards (5 Fields, 0 Submissions, Camp name)
   - List of all 5 fields with badges
3. Click "Publish Form" button
4. Page refreshes
5. Status should change from "draft" to "active"
6. "Publish Form" button should disappear

**Expected Result:**
✅ Form details display correctly
✅ All 5 fields shown with proper badges
✅ Publish button works
✅ Status updates to "active"
✅ Form is now published

---

### Test 3: Parent Views Available Forms

**Goal:** Verify parents see published forms for their registered sessions

**Steps:**
1. Click "Switch Role" in header
2. Select "Jennifer Smith" (parent with 2 children)
3. Parent dashboard loads
4. Scroll down to "Forms to Complete" section
5. Should see the published form with:
   - Form name
   - Description
   - "5 fields • Summer Adventure Camp 2025"
   - "Action Required" badge (orange)
   - "Complete Form" button

**Expected Result:**
✅ Parent dashboard shows forms section
✅ Published form appears
✅ Form linked to correct session
✅ "Complete Form" button visible

---

### Test 4: Parent Submits Form with Conditional Logic

**Goal:** Verify dynamic form rendering and conditional logic

**Steps:**
1. Click "Complete Form" button
2. Form page loads with:
   - Form title and description
   - All 5 fields visible (except allergy_details which is conditional)
3. Fill out form:
   - child_name: "Emma Smith"
   - age: 10
   - has_allergies: Check the checkbox (set to true)
   - **WATCH:** allergy_details field should appear automatically
   - allergy_details: "Severe peanut allergy"
   - t_shirt_size: Select "M"
4. Click "Submit Form"
5. Should redirect to parent dashboard
6. Form should now show "Completed" badge (green) instead of "Action Required"

**Expected Result:**
✅ All fields render correctly
✅ Conditional field (allergy_details) hidden initially
✅ Checking has_allergies makes allergy_details appear
✅ Validation works (try submitting without required fields)
✅ Submission succeeds
✅ Dashboard updates to show "Completed"

---

### Test 5: Admin Views Submission

**Goal:** Verify admin can see parent's form submission

**Steps:**
1. Switch back to Admin User
2. Navigate to Form Builder
3. Click "View" on the form
4. Check "Submissions" stat - should show "1"
5. (Future: Click to view submission details)

**Expected Result:**
✅ Submission count updates to 1
✅ Admin can see form was submitted

---

### Test 6: Test Validation

**Goal:** Verify form validation prevents invalid submissions

**Steps:**
1. As parent, navigate to the form again
2. Try to submit empty form
3. Should see validation errors under required fields:
   - "child_name is required"
   - "age is required"
   - "t_shirt_size is required"
4. Fill in age with invalid value (e.g., 100)
5. Should see error: "Maximum value is 18"
6. Fix all errors and submit successfully

**Expected Result:**
✅ Required field validation works
✅ Min/max validation works
✅ Error messages display under fields
✅ Submit button disabled until valid

---

### Test 7: Test Multiple Field Types

**Goal:** Create form with all supported field types

**AI Prompt to test:**
```
Create a comprehensive test form with:
- full_name (text, required)
- email_address (email, required)
- phone_number (text)
- age (number, min: 5, max: 100)
- birth_date (date, required)
- bio (textarea)
- gender (radio, options: Male, Female, Other, Prefer not to say)
- interests (checkbox, options: Sports, Arts, Music, Science)
- session_preference (select, options: Morning, Afternoon, Evening)
- newsletter_signup (boolean)
```

**Test all field types render and validate correctly**

---

## Database Verification

After testing, check database:

```bash
npm run db:studio
```

**Tables to Check:**
1. **form_definitions** - Should have 1-2 forms
2. **form_fields** - Should have 5-10 fields per form
3. **form_options** - Should have options for select/radio/checkbox fields
4. **form_submissions** - Should have 1 submission with JSONB data
5. **events** - Should have event logs for form creation and submission

**Verify:**
- ✅ Conditional logic stored in form_fields.conditionalLogic (JSONB)
- ✅ Submission data stored in form_submissions.submissionData (JSONB)
- ✅ Options have correct labels and values
- ✅ Events logged for audit trail

---

## What to Test in Browser

### Admin Workflow
- [ ] Login as admin
- [ ] Navigate to Form Builder
- [ ] Forms list loads (stats, empty state, or existing forms)
- [ ] Create with AI works
- [ ] Camp/session selector works (or can leave blank)
- [ ] AI generates valid form structure
- [ ] Preview shows all fields
- [ ] Conditional fields marked
- [ ] Approve & Save creates form
- [ ] Form appears in list
- [ ] View form details
- [ ] Publish form makes it available
- [ ] Archive form removes it

### Parent Workflow
- [ ] Login as parent
- [ ] Dashboard shows "Forms to Complete" section
- [ ] Published forms appear
- [ ] Can click "Complete Form"
- [ ] Form renders all fields
- [ ] Conditional logic works (fields appear/disappear)
- [ ] Validation prevents invalid submission
- [ ] Required fields enforced
- [ ] Min/max validation works
- [ ] Form submits successfully
- [ ] Dashboard shows "Completed" badge
- [ ] Form data saved to database

### Edge Cases
- [ ] Submit form without checking conditional checkbox (field should stay hidden)
- [ ] Check then uncheck conditional checkbox (field should disappear)
- [ ] Try to access form as wrong user (should block)
- [ ] Try to submit invalid data (should show errors)
- [ ] Try to approve without selecting camp (should use first camp)
- [ ] Create camp-wide form (no session selected)
- [ ] Create session-specific form

---

## Known Limitations (Phase 3+)

**Not Yet Implemented:**
- Manual form builder (drag-and-drop)
- Form editing after creation
- Nested options (parent-child option relationships)
- Advanced conditional logic (AND/OR combinations)
- Form templates
- CSV export of submissions
- Multi-step forms
- File upload fields
- Signature fields

**These are Phase 3+ features - backend supports them, UI not built yet**

---

## Success Criteria

### Must Work:
✅ Admin can create forms with AI
✅ Admin can publish forms
✅ Parents see published forms for their sessions
✅ Forms render dynamically from database
✅ Conditional logic shows/hides fields correctly
✅ Form validation works
✅ Submissions save to database
✅ RBAC enforced on all operations

### Performance:
- Forms list loads in <1 second
- AI generates form in <5 seconds
- Form rendering instant
- Form submission <1 second

### Security:
- Parents can't access admin pages
- Parents only see forms for registered sessions
- All Server Actions check authentication
- Submissions filtered by userId

---

## Quick Verification Commands

```bash
# Check if forms table has data
npm run db:studio

# Check server logs
# (running in background)

# Check for console errors
# Open browser DevTools Console

# Verify session working
curl -b cookies.txt http://localhost:3004/api/dev-login
```

---

## If Issues Found

**If forms page redirects:**
1. Check server logs for errors
2. Verify getSession() is working
3. Check if dev auth cookie is set
4. Try refreshing page after login
5. Check browser DevTools > Application > Cookies

**If AI generation fails:**
1. Check OPENAI_API_KEY in .env
2. Check console for error messages
3. Verify camps exist in database
4. Check server logs for API errors

**If form doesn't render:**
1. Check form exists in database (db:studio)
2. Check form is published
3. Check user has registration for that session
4. Check console for errors

---

## Summary

**What Works:**
- All code is written and committed
- Database schema applied
- All components created
- Server Actions implemented
- RBAC configured

**What Needs Testing:**
- End-to-end flow in browser
- Session persistence with dev auth
- AI form generation
- Form submission and validation

**Status:** Code complete, needs manual browser testing to verify session handling
