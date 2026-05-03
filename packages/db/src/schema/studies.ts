import { pgTable, uuid, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { researchProjects } from "./research_projects.js";

export const studies = pgTable(
  "studies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    researchProjectId: uuid("research_project_id").notNull().references(() => researchProjects.id),
    pmid: text("pmid"),
    doi: text("doi"),
    title: text("title").notNull(),
    authors: text("authors"),
    abstract: text("abstract"),
    journal: text("journal"),
    year: integer("year"),
    source: text("source").notNull().default("manual"), // pubmed, crossref, manual
    searchStrategyId: uuid("search_strategy_id"),
    inclusionStatus: text("inclusion_status").notNull().default("pending"), // pending, included, excluded
    exclusionReason: text("exclusion_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    researchProjectIdx: index("studies_research_project_idx").on(table.researchProjectId),
    inclusionStatusIdx: index("studies_inclusion_status_idx").on(table.researchProjectId, table.inclusionStatus),
    pmidIdx: index("studies_pmid_idx").on(table.pmid),
    doiIdx: index("studies_doi_idx").on(table.doi),
  }),
);
