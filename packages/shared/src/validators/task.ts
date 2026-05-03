// Domain alias: Task validators re-export Issue validators for MetaClip Phase 1A compatibility
export {
  createIssueSchema as createTaskSchema,
  createChildIssueSchema as createChildTaskSchema,
  updateIssueSchema as updateTaskSchema,
  checkoutIssueSchema as checkoutTaskSchema,
  addIssueCommentSchema as addTaskCommentSchema,
  createIssueLabelSchema as createTaskLabelSchema,
  issueExecutionPolicySchema as taskExecutionPolicySchema,
  issueExecutionStateSchema as taskExecutionStateSchema,
  createIssueThreadInteractionSchema as createTaskThreadInteractionSchema,
  upsertIssueDocumentSchema as upsertTaskDocumentSchema,
  issueDocumentKeySchema as taskDocumentKeySchema,
} from "./issue.js";

export type {
  CreateIssue as CreateTask,
  UpdateIssue as UpdateTask,
  CheckoutIssue as CheckoutTask,
  AddIssueComment as AddTaskComment,
  CreateIssueLabel as CreateTaskLabel,
} from "./issue.js";
