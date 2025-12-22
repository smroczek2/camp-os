ALTER TABLE "organization_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "organization_users" CASCADE;--> statement-breakpoint
DROP TABLE "organizations" CASCADE;--> statement-breakpoint
ALTER TABLE "ai_actions" DROP CONSTRAINT "ai_actions_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "children" DROP CONSTRAINT "children_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "form_definitions" DROP CONSTRAINT "form_definitions_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "form_fields" DROP CONSTRAINT "form_fields_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "form_options" DROP CONSTRAINT "form_options_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "form_snapshots" DROP CONSTRAINT "form_snapshots_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "form_submissions" DROP CONSTRAINT "form_submissions_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "groups" DROP CONSTRAINT "groups_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "incidents" DROP CONSTRAINT "incidents_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "medication_logs" DROP CONSTRAINT "medication_logs_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "medications" DROP CONSTRAINT "medications_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "session_forms" DROP CONSTRAINT "session_forms_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_organization_id_organizations_id_fk";
--> statement-breakpoint
DROP INDEX "ai_actions_org_idx";--> statement-breakpoint
DROP INDEX "assignments_org_idx";--> statement-breakpoint
DROP INDEX "attendance_org_date_idx";--> statement-breakpoint
DROP INDEX "children_org_user_idx";--> statement-breakpoint
DROP INDEX "documents_org_idx";--> statement-breakpoint
DROP INDEX "events_org_idx";--> statement-breakpoint
DROP INDEX "form_definitions_org_idx";--> statement-breakpoint
DROP INDEX "form_definitions_org_session_status_idx";--> statement-breakpoint
DROP INDEX "form_fields_org_idx";--> statement-breakpoint
DROP INDEX "form_options_org_idx";--> statement-breakpoint
DROP INDEX "form_snapshots_org_idx";--> statement-breakpoint
DROP INDEX "form_submissions_org_idx";--> statement-breakpoint
DROP INDEX "group_members_org_idx";--> statement-breakpoint
DROP INDEX "groups_org_idx";--> statement-breakpoint
DROP INDEX "incidents_org_idx";--> statement-breakpoint
DROP INDEX "medication_logs_org_idx";--> statement-breakpoint
DROP INDEX "medications_org_idx";--> statement-breakpoint
DROP INDEX "registrations_org_session_idx";--> statement-breakpoint
DROP INDEX "registrations_org_status_idx";--> statement-breakpoint
DROP INDEX "session_forms_org_idx";--> statement-breakpoint
DROP INDEX "sessions_org_idx";--> statement-breakpoint
DROP INDEX "sessions_org_status_idx";--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "attendance_session_idx" ON "attendance" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "attendance_child_idx" ON "attendance" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "documents_user_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_child_idx" ON "documents" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "form_definitions_session_status_idx" ON "form_definitions" USING btree ("session_id","status");--> statement-breakpoint
CREATE INDEX "medication_logs_child_idx" ON "medication_logs" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "medication_logs_medication_idx" ON "medication_logs" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "medications_child_idx" ON "medications" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "registrations_session_idx" ON "registrations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_date_idx" ON "sessions" USING btree ("start_date","end_date");--> statement-breakpoint
ALTER TABLE "ai_actions" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "assignments" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "children" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "form_definitions" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "form_fields" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "form_options" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "form_snapshots" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "form_submissions" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "group_members" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "groups" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "medication_logs" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "medications" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "session_forms" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "active_organization_id";