import { z } from "zod";

export const CraftSeveritySchema = z.enum(["info", "low", "medium", "high", "critical"]);
export const CraftStatusSchema = z.enum([
  "detected", "classified", "traced", "proposed", "approval_pending",
  "approved", "resolving", "verifying", "resolved", "blocked", "rejected"
]);

export const CraftEvidenceSchema = z.object({
  evidenceId: z.string().min(1).max(120),
  source: z.string().min(1).max(300),
  capturedAt: z.string().datetime(),
  digest: z.string().max(256).optional(),
  description: z.string().max(1000).optional(),
});

export const CraftBlockerSchema = z.object({
  blockerId: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  severity: CraftSeveritySchema,
  status: CraftStatusSchema,
  category: z.enum(["build", "test", "dependency", "configuration", "security", "integration", "policy", "unknown"]),
  repository: z.string().max(200).optional(),
  branch: z.string().max(200).optional(),
  commitSha: z.string().regex(/^[a-f0-9]{7,64}$/i).optional(),
  evidence: z.array(CraftEvidenceSchema).max(100),
  rootCause: z.string().max(4000).optional(),
  assumptions: z.array(z.string().max(1000)).max(50).default([]),
  proposedRemediation: z.string().max(4000).optional(),
  riskNotes: z.array(z.string().max(1000)).max(50).default([]),
  requiresHumanApproval: z.boolean().default(true),
  detectedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CraftRemediationPlanSchema = z.object({
  planId: z.string().min(1).max(120),
  blockerId: z.string().min(1).max(120),
  steps: z.array(z.object({
    stepId: z.string().min(1).max(120),
    description: z.string().min(1).max(1000),
    expectedEvidence: z.array(z.string().max(300)).max(20),
    reversible: z.boolean(),
    risk: CraftSeveritySchema,
  })).min(1).max(30),
  rollbackPlan: z.string().min(1).max(3000),
  verificationCriteria: z.array(z.string().min(1).max(500)).min(1).max(30),
  status: z.enum(["draft", "review", "approved", "executing", "verified", "failed", "cancelled"]),
  approvalReference: z.string().max(200).optional(),
  createdAt: z.string().datetime(),
});

export type CraftBlocker = z.infer<typeof CraftBlockerSchema>;
export type CraftRemediationPlan = z.infer<typeof CraftRemediationPlanSchema>;

/**
 * CRAFT is advisory by default. This contract deliberately contains no
 * execution credentials or direct command runner. WARP GATE must authorize
 * every consequential operation server-side.
 */
