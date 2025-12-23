CREATE TABLE "account_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"relationship" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"receives_billing" boolean DEFAULT false NOT NULL,
	"receives_updates" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"note" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charges" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"registration_id" uuid,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"charge_type" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"amount" integer NOT NULL,
	"payment_method" text NOT NULL,
	"reference_number" text,
	"description" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"refunded_amount" integer DEFAULT 0,
	"refund_reason" text,
	"stripe_payment_intent_id" text,
	"processed_by" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "account_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "account_contacts" ADD CONSTRAINT "account_contacts_account_id_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_notes" ADD CONSTRAINT "account_notes_account_id_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_notes" ADD CONSTRAINT "account_notes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_account_id_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_account_id_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_contacts_account_idx" ON "account_contacts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_contacts_primary_idx" ON "account_contacts" USING btree ("account_id","is_primary");--> statement-breakpoint
CREATE INDEX "account_notes_account_idx" ON "account_notes" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_notes_created_at_idx" ON "account_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "charges_account_idx" ON "charges" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "charges_registration_idx" ON "charges" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "charges_created_at_idx" ON "charges" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payments_account_idx" ON "payments" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_processed_at_idx" ON "payments" USING btree ("processed_at");--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_account_number_unique" UNIQUE("account_number");