CREATE TABLE "session_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"required" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "min_age" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "max_age" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "min_grade" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "max_grade" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "registration_open_date" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "registration_close_date" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "special_instructions" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "what_to_bring" text;--> statement-breakpoint
ALTER TABLE "session_forms" ADD CONSTRAINT "session_forms_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_forms" ADD CONSTRAINT "session_forms_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_forms" ADD CONSTRAINT "session_forms_form_id_form_definitions_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "session_form_unique" ON "session_forms" USING btree ("session_id","form_id");--> statement-breakpoint
CREATE INDEX "session_forms_org_idx" ON "session_forms" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "session_forms_session_idx" ON "session_forms" USING btree ("session_id");