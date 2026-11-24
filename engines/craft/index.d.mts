export type CraftBlockerInput = {
  id: string;
  summary: string;
  complexity: number;
  risk: number;
  urgency: number;
  dependency: number;
  confidence?: number;
  evidenceRefs?: string[];
  gapCycleId?: string | null;
  gapStageId?: string | null;
  source?: string;
};

export type CraftAssessment = {
  id: string;
  summary: string;
  priorityScore: number;
  priority: "critical" | "high" | "moderate" | "low";
  confidence: number;
  evidenceRequired: boolean;
  recommendedNextStep: string;
  context: {
    gapCycleId: string | null;
    gapStageId: string | null;
    evidenceRefs: readonly string[];
    source: string;
  };
  decision: "recommendation_only";
  requiresHumanApproval: true;
};

export declare function assessBlocker(input: CraftBlockerInput): CraftAssessment;
export declare function assessBlockers(blockers: CraftBlockerInput[]): CraftAssessment[];
