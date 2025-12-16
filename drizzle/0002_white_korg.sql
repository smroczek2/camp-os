CREATE TABLE "form_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_definition_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN "form_version" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "form_snapshots" ADD CONSTRAINT "form_snapshots_form_definition_id_form_definitions_id_fk" FOREIGN KEY ("form_definition_id") REFERENCES "public"."form_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_snapshots_form_version_idx" ON "form_snapshots" USING btree ("form_definition_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "form_snapshots_unique_form_version" ON "form_snapshots" USING btree ("form_definition_id","version");--> statement-breakpoint
CREATE INDEX "form_submissions_form_version_idx" ON "form_submissions" USING btree ("form_definition_id","form_version");