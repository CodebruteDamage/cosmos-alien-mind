/**
 * COSMOS M1.2 — lifecycle coordinator boundary.
 * Authorization must succeed before create/advance mutates the store.
 * This coordinator changes lifecycle state only; it never executes capabilities.
 */
import {
  authorizeLifecycle,
  type LifecycleAuthorizationRequest,
  type WarpGateClient,
  type WarpGateDecisionRecord,
} from "./warp-gate-adapter";

export interface LifecycleRecord {
  lifecycleId: string;
  tenantId: string;
  subjectId: string;
  stage: string;
  version: number;
}

export interface LifecycleStore {
  create(input: { lifecycleId: string; tenantId: string; subjectId: string; objective: string }): Promise<LifecycleRecord>;
  get(tenantId: string, lifecycleId: string): Promise<LifecycleRecord | null>;
  transition(input: {
    tenantId: string;
    lifecycleId: string;
    expectedVersion: number;
    targetStage: string;
    actor: string;
    reason: string;
    evidenceRefs: readonly string[];
  }): Promise<LifecycleRecord>;
}

export interface TrustedLifecycleContext {
  tenantId: string;
  subjectId: string;
  policyVersion: string;
  traceId: string;
}

export interface LifecycleIntent {
  lifecycleId: string;
  targetStage: string;
  reason: string;
  evidenceRefs?: readonly string[];
}

export class LifecycleAuthorizationError extends Error {
  constructor(readonly reason: string) {
    super("Lifecycle authorization denied");
    this.name = "LifecycleAuthorizationError";
  }
}

export class GovernedLifecycleCoordinator {
  constructor(
    private readonly store: LifecycleStore,
    private readonly warpGate: WarpGateClient,
    private readonly createId: () => string,
  ) {}

  private request(
    context: TrustedLifecycleContext,
    intent: LifecycleIntent,
    action: "create" | "advance",
    fromStage: string | null,
  ): LifecycleAuthorizationRequest {
    return {
      requestId: this.createId(),
      executionId: this.createId(),
      tenantId: context.tenantId,
      subjectId: context.subjectId,
      lifecycleId: intent.lifecycleId,
      capability: "cosmos.lifecycle",
      action,
      targetScope: [`lifecycle:${intent.lifecycleId}`],
      fromStage,
      toStage: intent.targetStage,
      reason: intent.reason,
      evidenceRefs: intent.evidenceRefs ?? [],
      policyVersion: context.policyVersion,
      traceId: context.traceId,
    };
  }

  async create(
    context: TrustedLifecycleContext,
    input: { lifecycleId: string; objective: string },
  ): Promise<LifecycleRecord> {
    const intent: LifecycleIntent = {
      lifecycleId: input.lifecycleId,
      targetStage: "DISCOVERY",
      reason: "lifecycle_created",
    };
    const request = this.request(context, intent, "create", null);
    const outcome = await authorizeLifecycle(this.warpGate, request);
    if (!outcome.authorized) throw new LifecycleAuthorizationError(outcome.reason);
    return this.store.create({
      lifecycleId: input.lifecycleId,
      tenantId: context.tenantId,
      subjectId: context.subjectId,
      objective: input.objective,
    });
  }

  async advance(
    context: TrustedLifecycleContext,
    intent: LifecycleIntent,
    expectedVersion: number,
  ): Promise<LifecycleRecord> {
    const current = await this.store.get(context.tenantId, intent.lifecycleId);
    if (!current) throw new Error("lifecycle_not_found");
    if (current.subjectId !== context.subjectId) throw new LifecycleAuthorizationError("lifecycle_subject_mismatch");
    if (current.version !== expectedVersion) throw new Error("lifecycle_version_conflict");

    const request = this.request(context, intent, "advance", current.stage);
    const outcome = await authorizeLifecycle(this.warpGate, request);
    if (!outcome.authorized) throw new LifecycleAuthorizationError(outcome.reason);

    return this.store.transition({
      tenantId: context.tenantId,
      lifecycleId: intent.lifecycleId,
      expectedVersion,
      targetStage: intent.targetStage,
      actor: context.subjectId,
      reason: intent.reason,
      evidenceRefs: intent.evidenceRefs ?? [],
    });
  }
}
