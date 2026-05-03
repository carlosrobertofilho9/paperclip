CREATE TABLE "prisma_flow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_project_id" uuid NOT NULL,
	"stage" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_project_id" uuid NOT NULL,
	"study_id" uuid,
	"doi" text,
	"pmid" text,
	"url" text,
	"citation_text" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_project_id" uuid NOT NULL,
	"pmid" text,
	"doi" text,
	"title" text NOT NULL,
	"authors" text,
	"abstract" text,
	"journal" text,
	"year" integer,
	"source" text DEFAULT 'manual' NOT NULL,
	"search_strategy_id" uuid,
	"inclusion_status" text DEFAULT 'pending' NOT NULL,
	"exclusion_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_extractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_project_id" uuid NOT NULL,
	"study_id" uuid NOT NULL,
	"extraction_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"extracted_by_agent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "research_question" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "pico_p" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "pico_i" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "pico_c" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "pico_o" text;--> statement-breakpoint
ALTER TABLE "prisma_flow" ADD CONSTRAINT "prisma_flow_research_project_id_companies_id_fk" FOREIGN KEY ("research_project_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_research_project_id_companies_id_fk" FOREIGN KEY ("research_project_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studies" ADD CONSTRAINT "studies_research_project_id_companies_id_fk" FOREIGN KEY ("research_project_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_extractions" ADD CONSTRAINT "study_extractions_research_project_id_companies_id_fk" FOREIGN KEY ("research_project_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_extractions" ADD CONSTRAINT "study_extractions_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_extractions" ADD CONSTRAINT "study_extractions_extracted_by_agent_id_agents_id_fk" FOREIGN KEY ("extracted_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prisma_flow_research_project_stage_idx" ON "prisma_flow" USING btree ("research_project_id","stage");--> statement-breakpoint
CREATE INDEX "references_research_project_idx" ON "references" USING btree ("research_project_id");--> statement-breakpoint
CREATE INDEX "references_study_idx" ON "references" USING btree ("study_id");--> statement-breakpoint
CREATE INDEX "references_verified_idx" ON "references" USING btree ("research_project_id","verified");--> statement-breakpoint
CREATE INDEX "studies_research_project_idx" ON "studies" USING btree ("research_project_id");--> statement-breakpoint
CREATE INDEX "studies_inclusion_status_idx" ON "studies" USING btree ("research_project_id","inclusion_status");--> statement-breakpoint
CREATE INDEX "studies_pmid_idx" ON "studies" USING btree ("pmid");--> statement-breakpoint
CREATE INDEX "studies_doi_idx" ON "studies" USING btree ("doi");--> statement-breakpoint
CREATE INDEX "study_extractions_research_project_idx" ON "study_extractions" USING btree ("research_project_id");--> statement-breakpoint
CREATE INDEX "study_extractions_study_idx" ON "study_extractions" USING btree ("study_id");