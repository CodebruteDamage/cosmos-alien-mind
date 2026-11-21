import { z } from "zod";

/**
 * Shared API contracts for COSMOS module communication.
 * Structural validation is not authentication or authorization.
 */
const nonEmpty = z.string().trim().min(1);
const isoTimestamp = z.string().datetime({ offset: true });

export const COSMOS_CONTRACT_VERSION = "1.0.0";

const semanticVersion = z.string().regex(/^\d+\.\d+\.\d+$/);

export const CosmosRequestEnvelopeSchema = z.object({
  requestId: z.string().uuid(),
  correlationId: z.string().uuid(),
  actorId: nonEmpty,
  tenantId: nonEmpty,
  sourceModule: nonEmpty,
  targetModule: nonEmpty,
  operation: nonEmpty,
  scope: z.array(nonEmpty).min(1),
  contractVersion: semanticVersion,
  requestedAt: isoTimestamp,
  authorizationRef: nonEmpty.optional(),
}).strict();

export type CosmosRequestEnvelope = z.infer<typeof CosmosRequestEnvelopeSchema>;

export const CosmosApiErrorSchema = z.object({
  error: z.object({
    code: nonEmpty,
    message: nonEmpty,
    requestId: z.string().uuid().optional(),
    retryable: z.boolean().default(false),
  }).strict(),
}).strict();

export type CosmosApiError = z.infer<typeof CosmosApiErrorSchema>;

export const CosmosApiResponseMetaSchema = z.object({
  requestId: z.string().uuid(),
  correlationId: z.string().uuid(),
  contractVersion: semanticVersion,
  servedAt: isoTimestamp,
}).strict();

export type CosmosApiResponseMeta = z.infer<typeof CosmosApiResponseMetaSchema>;
