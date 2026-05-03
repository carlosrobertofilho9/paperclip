// Domain alias: ScientificObjective validators re-export Goal validators
export {
  createGoalSchema as createScientificObjectiveSchema,
  updateGoalSchema as updateScientificObjectiveSchema,
} from "./goal.js";

export type {
  CreateGoal as CreateScientificObjective,
  UpdateGoal as UpdateScientificObjective,
} from "./goal.js";
