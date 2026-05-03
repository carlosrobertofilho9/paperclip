import { pgTable, uuid, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { researchProjects } from "./research_projects.js";
import { studies } from "./studies.js";
import { agents } from "./agents.js";

export const studyExtractions = pgTable(
  "study_extractions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    researchProjectId: uuid("research_project_id").notNull().references(() => researchProjects.id),
    studyId: uuid("study_id").notNull().references(() => studies.id, { onDelete: "cascade" }),
    extractionData: jsonb("extraction_data").$type<Record<string, unknown>>().notNull().default({}),
    extractedByAgentId: uuid("extracted_by_agent_id").references(() => agents.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    researchProjectIdx: index("study_extractions_research_project_idx").on(table.researchProjectId),
    studyIdx: index("study_extractions_study_idx").on(table.studyId),
  }),
);
