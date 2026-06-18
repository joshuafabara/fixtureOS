CREATE TABLE "ai_audit_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dry_run_id" uuid NOT NULL,
	"status" text NOT NULL,
	"confidence" real,
	"model" text NOT NULL,
	"input_hash" text NOT NULL,
	"report_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_batches" ALTER COLUMN "status" SET DEFAULT 'uploaded';--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "mode" text DEFAULT 'create' NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "mapping_data" jsonb;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "diff_data" jsonb;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "errors_data" jsonb;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "resolved_errors" jsonb;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_audit_reports" ADD CONSTRAINT "ai_audit_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_audit_reports" ADD CONSTRAINT "ai_audit_reports_dry_run_id_dry_runs_id_fk" FOREIGN KEY ("dry_run_id") REFERENCES "public"."dry_runs"("id") ON DELETE cascade ON UPDATE no action;