ALTER TABLE "camps" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "camps" CASCADE;--> statement-breakpoint
ALTER TABLE "form_definitions" DROP CONSTRAINT "form_definitions_camp_id_camps_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_camp_id_camps_id_fk";
--> statement-breakpoint
DROP INDEX "form_definitions_camp_idx";--> statement-breakpoint
DROP INDEX "form_definitions_camp_session_status_idx";--> statement-breakpoint
DROP INDEX "sessions_org_camp_idx";--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "form_definitions_org_session_status_idx" ON "form_definitions" USING btree ("organization_id","session_id","status");--> statement-breakpoint
CREATE INDEX "sessions_org_idx" ON "sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sessions_org_status_idx" ON "sessions" USING btree ("organization_id","status");--> statement-breakpoint
ALTER TABLE "form_definitions" DROP COLUMN "camp_id";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "camp_id";