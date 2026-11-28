export const COSMAXX_CONTRACT_VERSION = "1.0" as const;

export const COSMOS_DOMAIN_IDS = [
  "THINK",
  "KNOW",
  "ACT",
  "GOVERN",
  "ADAPT",
  "COMPANION",
  "EVOLVE",
] as const;

export type CosmosDomainId = (typeof COSMOS_DOMAIN_IDS)[number];

export type EvidenceReference = {
  id: string;
  source: string;
  digest?: string;
};

export type OptimizationRequest = {
  schema_version: typeof COSMAXX_CONTRACT_VERSION;
  request_id: string;
  trace_id: string;
  domain_id: CosmosDomainId;
  operation: string;
  context: Record<string, unknown>;
  evidence_refs: EvidenceReference[];
  requested_capabilities: string[];
  created_at: string;
};

export type OptimizationRecommendation = {
  id: string;
  title: string;
  rationale: string;
  domain_id: CosmosDomainId;
  evidence_refs: EvidenceReference[];
  confidence?: number;
  impact: "low" | "medium" | "high" | "critical";
  requires_approval: true;
};

export type OptimizationResult = {
  status: "completed" | "rejected" | "failed";
  contract_version: typeof COSMAXX_CONTRACT_VERSION;
  request_id: string;
  trace_id: string;
  domain_id: CosmosDomainId;
  recommendations: OptimizationRecommendation[];
  errors: string[];
  completed_at: string;
};

export type AuthorizationDecision = {
  allowed: boolean;
  reason?: string;
};

export interface CosmaxxOptimizer {
  optimize(
    request: OptimizationRequest,
    signal: AbortSignal,
  ): Promise<OptimizationRecommendation[]>;
}

export interface CosmaxxAuthorization {
  authorize(
    request: OptimizationRequest,
  ): Promise<AuthorizationDecision>;
}
