import type { CompanyStatus, PauseReason } from "../constants.js";

export interface ResearchProject {
  id: string;
  name: string;
  description: string | null;
  status: CompanyStatus;
  pauseReason: PauseReason | null;
  pausedAt: Date | null;
  issuePrefix: string;
  issueCounter: number;
  budgetMonthlyCents: number;
  spentMonthlyCents: number;
  attachmentMaxBytes: number;
  requireBoardApprovalForNewAgents: boolean;
  feedbackDataSharingEnabled: boolean;
  feedbackDataSharingConsentAt: Date | null;
  feedbackDataSharingConsentByUserId: string | null;
  feedbackDataSharingTermsVersion: string | null;
  brandColor: string | null;
  logoAssetId: string | null;
  logoUrl: string | null;
  // Scientific fields (Phase 1A)
  researchQuestion: string | null;
  picoP: string | null;
  picoI: string | null;
  picoC: string | null;
  picoO: string | null;
  createdAt: Date;
  updatedAt: Date;
}
