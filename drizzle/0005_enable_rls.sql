-- Enable Row-Level Security on all content tables
-- This migration enables RLS and creates isolation policies for multi-tenant architecture

-- =============================================
-- CHILDREN TABLE
-- =============================================
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY children_org_isolation ON children
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- MEDICATIONS TABLE
-- =============================================
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY medications_org_isolation ON medications
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- CAMPS TABLE
-- =============================================
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;

CREATE POLICY camps_org_isolation ON camps
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- SESSIONS TABLE
-- =============================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_org_isolation ON sessions
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- REGISTRATIONS TABLE
-- =============================================
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY registrations_org_isolation ON registrations
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- INCIDENTS TABLE
-- =============================================
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY incidents_org_isolation ON incidents
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_org_isolation ON documents
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- EVENTS TABLE
-- =============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Events table allows null organizationId for super-admin events
CREATE POLICY events_org_isolation ON events
  FOR ALL
  USING (
    organization_id IS NULL OR
    organization_id = current_setting('app.current_organization_id', true)::uuid
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id = current_setting('app.current_organization_id', true)::uuid
  );

-- =============================================
-- GROUPS TABLE
-- =============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY groups_org_isolation ON groups
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- ASSIGNMENTS TABLE
-- =============================================
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY assignments_org_isolation ON assignments
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- GROUP_MEMBERS TABLE
-- =============================================
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_members_org_isolation ON group_members
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- ATTENDANCE TABLE
-- =============================================
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendance_org_isolation ON attendance
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- MEDICATION_LOGS TABLE
-- =============================================
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY medication_logs_org_isolation ON medication_logs
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- AI_ACTIONS TABLE
-- =============================================
ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_actions_org_isolation ON ai_actions
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- FORM_DEFINITIONS TABLE
-- =============================================
ALTER TABLE form_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_definitions_org_isolation ON form_definitions
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- FORM_FIELDS TABLE
-- =============================================
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_fields_org_isolation ON form_fields
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- FORM_OPTIONS TABLE
-- =============================================
ALTER TABLE form_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_options_org_isolation ON form_options
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- FORM_SNAPSHOTS TABLE
-- =============================================
ALTER TABLE form_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_snapshots_org_isolation ON form_snapshots
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- FORM_SUBMISSIONS TABLE
-- =============================================
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_submissions_org_isolation ON form_submissions
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================
-- ORGANIZATIONS TABLE - No RLS (accessible by all authenticated users)
-- =============================================
-- Note: Organizations table does NOT have RLS enabled because users need to
-- see which organizations they belong to. Access control is handled via
-- the organization_users junction table.

-- =============================================
-- ORGANIZATION_USERS TABLE - No RLS (users need to see their memberships)
-- =============================================
-- Note: Organization_users table does NOT have RLS enabled because users need
-- to query which organizations they belong to before setting the tenant context.

-- =============================================
-- VERIFICATION & TESTING
-- =============================================
-- To verify RLS is enabled on all content tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

-- To test RLS isolation:
-- SET app.current_organization_id = 'org-uuid-1';
-- SELECT * FROM children; -- Should only return children for org-uuid-1

-- To disable RLS (for debugging only):
-- ALTER TABLE children DISABLE ROW LEVEL SECURITY;
