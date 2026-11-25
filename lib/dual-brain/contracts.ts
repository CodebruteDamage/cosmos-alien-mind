import { z } from "zod";

/**
 * Dual-brain wire contracts.
 * These schemas validate shape only; they do not authenticate principals,
 * authorize data access, or grant tools/capabilities.
 */
const boundedText = z.string().min(1).max(50_000);
const identifier = z.string().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/);

export const BRAIN_ROLES = ["cosmos_core", "alien_mind"] as const;
export type BrainRole = (typeof BRAIN_ROLES)[number];

export const BrainContextItemSchema = z.object({
  sourceId: identifier,
  sourceType: z.enum(["user_input", "repository", "document", "memory", "tool_result", "system_record"]),
  content: z.string().max(20_000),
  trust: z.enum(["trusted_system", "verified_source", "untrusted"]),
  provenance: z.string().min(1).max(2_000),
}).strict();

export const BrainRequestSchema = z.object({
  requestId: z.string().uuid(),
  role: z.enum(BRAIN_ROLES),
  tenantId: identifier,
  userId: identifier,
  input: boundedText,
  context: z.array(BrainContextItemSchema).max(30),
  policyVersion: identifier,
  deadlineMs: z.number().int().min(100).max(60_000),
}).strict();

export type BrainRequest = z.infer<typeof BrainRequestSchema>;

export const BrainClaimSchema = z.object({
  claimId: identifier,
  statement: z.string().min(1).max(4_000),
  stance: z.enum(["supports", "opposes", "uncertain"]),
  evidenceRefs: z.array(identifier).max(20),
}).strict();

export const BrainResponseSchema = z.object({
  requestId: z.string().uuid(),
  role: z.enum(BRAIN_ROLES),
  status: z.enum(["ok", "refused", "timeout", "error"]),
  summary: z.string().max(12_000),
  claims: z.array(BrainClaimSchema).max(100),
  uncertainties: z.array(z.string().max(2_000)).max(50),
  proposedActions: z.array(z.string().min(1).max(2_000)).max(30),
  durationMs: z.number().int().min(0).max(300_000),
  providerId: identifier,
}).strict();

export type BrainResponse = z.infer<typeof BrainResponseSchema>;

export type BrainAdapter = (
  request: BrainRequest,
  signal: AbortSignal,
) => Promise<unknown>;

export type BrainInvocation = {
  role: BrainRole;
  status: "ok" | "refused" | "timeout" | "error";
  response?: BrainResponse;
  errorCode?: "TIMEOUT" | "ADAPTER_ERROR" | "INVALID_RESPONSE" | "CORRELATION_MISMATCH";
};

export type BrainDisagreement = {
  claimId: string;
  cosmosCore: BrainClaimSchema extends z.ZodTypeAny ? z.infer<typeof BrainClaimSchema> : never;
  alienMind: BrainClaimSchema extends z.ZodTypeAny ? z.infer<typeof BrainClaimSchema> : never;
};

export type DualBrainResult = {
  requestId: string;
  status: "complete" | "needs_review" | "degraded" | "unavailable";
  invocations: BrainInvocation[];
  disagreements: BrainDisagreement[];
  availableRoles: BrainRole[];
  consensusClaim: false;
};
