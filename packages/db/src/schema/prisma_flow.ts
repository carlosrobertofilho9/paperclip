import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { researchProjects } from "./research_projects.js";

export const prismaFlow = pgTable(
  "prisma_flow",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    researchProjectId: uuid("research_project_id").notNull().references(() => researchProjects.id),
    stage: text("stage").notNull(), // identification, screening, eligibility, included
    count: integer("count").notNull().default(0),
    description: text("description"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    researchProjectStageIdx: index("prisma_flow_research_project_stage_idx").on(table.researchProjectId, table.stage),
  }),
);
