import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { researchProjects } from "./research_projects.js";
import { studies } from "./studies.js";

export const references = pgTable(
  "references",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    researchProjectId: uuid("research_project_id").notNull().references(() => researchProjects.id),
    studyId: uuid("study_id").references(() => studies.id, { onDelete: "set null" }),
    doi: text("doi"),
    pmid: text("pmid"),
    url: text("url"),
    citationText: text("citation_text").notNull(),
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    researchProjectIdx: index("references_research_project_idx").on(table.researchProjectId),
    studyIdx: index("references_study_idx").on(table.studyId),
    verifiedIdx: index("references_verified_idx").on(table.researchProjectId, table.verified),
  }),
);
