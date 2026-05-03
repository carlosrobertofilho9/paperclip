export const API_PREFIX = "/api";

export const API = {
  health: `${API_PREFIX}/health`,
  researchProjects: `${API_PREFIX}/research-projects`,
  /** @deprecated Use researchProjects */
  companies: `${API_PREFIX}/companies`,
  agents: `${API_PREFIX}/agents`,
  projects: `${API_PREFIX}/projects`,
  tasks: `${API_PREFIX}/tasks`,
  /** @deprecated Use tasks */
  issues: `${API_PREFIX}/issues`,
  taskTreeControl: `${API_PREFIX}/tasks/:taskId/tree-control`,
  /** @deprecated Use taskTreeControl */
  issueTreeControl: `${API_PREFIX}/issues/:issueId/tree-control`,
  taskTreeHolds: `${API_PREFIX}/tasks/:taskId/tree-holds`,
  /** @deprecated Use taskTreeHolds */
  issueTreeHolds: `${API_PREFIX}/issues/:issueId/tree-holds`,
  scientificObjectives: `${API_PREFIX}/scientific-objectives`,
  researchMilestones: `${API_PREFIX}/research-milestones`,
  /** @deprecated Use scientificObjectives or researchMilestones */
  goals: `${API_PREFIX}/goals`,
  approvals: `${API_PREFIX}/approvals`,
  secrets: `${API_PREFIX}/secrets`,
  costs: `${API_PREFIX}/costs`,
  activity: `${API_PREFIX}/activity`,
  dashboard: `${API_PREFIX}/dashboard`,
  sidebarBadges: `${API_PREFIX}/sidebar-badges`,
  sidebarPreferences: `${API_PREFIX}/sidebar-preferences`,
  invites: `${API_PREFIX}/invites`,
  joinRequests: `${API_PREFIX}/join-requests`,
  members: `${API_PREFIX}/members`,
  admin: `${API_PREFIX}/admin`,
} as const;
