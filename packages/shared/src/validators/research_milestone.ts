// Domain alias: ResearchMilestone validators re-export Goal validators
export {
  createGoalSchema as createResearchMilestoneSchema,
  updateGoalSchema as updateResearchMilestoneSchema,
} from "./goal.js";

export type {
  CreateGoal as CreateResearchMilestone,
  UpdateGoal as UpdateResearchMilestone,
} from "./goal.js";
