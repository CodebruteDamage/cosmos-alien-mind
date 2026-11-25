import type { CraftAssessment, CraftBlockerInput } from "../engines/craft/index.mjs";

export type GuidanceCraftBlocker = {
  id: string;
  summary: string;
  verified: boolean;
  assessment?: Omit<CraftBlockerInput, "id" | "summary">;
};

export type GuidanceCraftDecision = {
  decision: string;
  craftRequired: boolean;
  verifiedBlockerIds?: string[];
};

export type GuidanceCraftResult = {
  invoked: boolean;
  status: "SKIPPED" | "GATHER_EVIDENCE" | "RECOMMENDATION_ONLY";
  reason?: string;
  missingBlockerIds?: readonly string[];
  missingEvidenceBlockerIds?: readonly string[];
  assessments?: readonly CraftAssessment[];
  requiresHumanApproval?: true;
  executionStarted?: false;
  authorizationGranted: false;
  trustBoundary?: "caller_asserted_untrusted";
};

export declare function runCraftForGuidance(
  decision: GuidanceCraftDecision,
  blockers: GuidanceCraftBlocker[]
): GuidanceCraftResult;
