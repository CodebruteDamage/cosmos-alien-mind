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
  analysisIds: z.array(z.string().max(120)).max(50).default([]),
  evidence: z.array(CraftEvidenceSchema).max(100),
  rootCause: z.string().max(4000).optional(),
  assumptions: z.array(z.string().max(1000)).max(50).default([]),
  proposedRemediation: z.string().max(4000).optional(),
  riskNotes: z.array(z.string().max(1000)).max(50).default([]),
  requiresHumanApproval: z.boolean().default(true),
  detectedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CraftRemediationStepSchema = z.object({
  stepId: z.string().min(1).max(120),
  description: z.string().min(1).max(1000),
  expectedEvidence: z.array(z.string().max(300)).max(20),
  reversible: z.boolean(),
  risk: CraftSeveritySchema,
});

export const CraftRemediationPlanSchema = z.object({
  planId: z.string().min(1).max(120),
  blockerId: z.string().min(1).max(120),
  steps: z.array(CraftRemediationStepSchema).min(1).max(30),
  rollbackPlan: z.string().min(1).max(3000),
  verificationCriteria: z.array(z.string().min(1).max(500)).min(1).max(30),
  status: z.enum(["draft", "review", "approved", "executing", "verified", "failed", "cancelled"]),
  approvalReference: z.string().max(200).optional(),
  createdAt: z.string().datetime(),
});

export type CraftBlocker = z.infer<typeof CraftBlockerSchema>;
export type CraftRemediationPlan = z.infer<typeof CraftRemediationPlanSchema>;

const FIXTURE_TIME = "2026-11-24T12:00:00.000Z";

/** Demo evidence only. Replace with authenticated CI/analyzer ingestion before operational use. */
export const DEMO_CRAFT_BLOCKERS: CraftBlocker[] = [
  {
    blockerId: "demo-eslint-config-resolution",
    title: "ESLint Next.js config module resolution",
    description: "A prior CI run failed during lint because extensionless eslint-config-next subpath imports could not be resolved.",
    severity: "medium",
    status: "proposed",
    category: "configuration",
    repository: "CodebruteDamage/cosmos-alien-mind",
    branch: "feature/cosmos-office-maxx-workforce-live-v1",
    commitSha: "66c39465d6934fb11b2c504cd449b1a59bb8262f",
    analysisIds: ["demo-maxx-ci-analysis-001"],
    evidence: [{
      evidenceId: "demo-ci-log-eslint-import",
      source: "GitHub Actions run 45420109783 · verify job 138537003503",
      capturedAt: FIXTURE_TIME,
      description: "Historical lint error; import extension fix was committed afterward. Current status requires a fresh CI run."
    }],
    rootCause: "The ESM configuration imported package subpaths without the .js extension required by the resolved package exports.",
    assumptions: ["The later eslint.config.mjs change is expected to resolve this historical error; it has not yet been confirmed by a passing CI run."],
    proposedRemediation: "Run the current branch lint and production build. If lint still fails, inspect the exact installed eslint-config-next exports before changing dependencies.",
    riskNotes: ["Do not apply broad dependency upgrades to address a path-resolution failure."],
    requiresHumanApproval: true,
    detectedAt: FIXTURE_TIME,
    updatedAt: FIXTURE_TIME
  }
];

export function buildCraftRemediationPlan(blocker: CraftBlocker, now = new Date()): CraftRemediationPlan {
  const timestamp = now.toISOString();
  return CraftRemediationPlanSchema.parse({
    planId: `plan-${blocker.blockerId}-v1`,
    blockerId: blocker.blockerId,
    steps: [
      {
        stepId: "inspect-current-state",
        description: "Collect the latest branch commit, CI run, job summary, and lint output. Confirm whether the historical failure still reproduces.",
        expectedEvidence: ["Current branch SHA", "Latest CI run URL and conclusion", "Lint output"],
        reversible: true,
        risk: "low"
      },
      {
        stepId: "validate-existing-fix",
        description: "Review the current ESLint config imports and installed eslint-config-next package exports. Avoid dependency changes unless evidence identifies a package mismatch.",
        expectedEvidence: ["Current eslint.config.mjs", "Installed package export map", "Lint result"],
        reversible: true,
        risk: "low"
      },
      {
        stepId: "apply-scoped-correction-if-needed",
        description: "If the current failure reproduces, propose the smallest import-path correction on the isolated feature branch and request review before writing.",
        expectedEvidence: ["Proposed diff", "Review/approval reference", "Post-change lint output"],
        reversible: true,
        risk: "medium"
      }
    ],
    rollbackPlan: "Keep the pre-change commit SHA. Revert only the reviewed ESLint configuration patch if the post-change lint or build regresses; do not reset shared branches or force-push.",
    verificationCriteria: [
      "Latest branch CI lint job passes.",
      "Production build completes successfully.",
      "The CI run references the intended feature-branch commit.",
      "No unrelated files or dependency versions changed."
    ],
    status: "draft",
    createdAt: timestamp
  });
}

/** No execution adapter is exposed by this module. Plans are proposals only. */
