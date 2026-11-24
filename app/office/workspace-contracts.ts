import { z } from "zod";

export const WorkerManifestSchema = z.object({
  workerId: z.string().min(1).max(100),
  displayName: z.string().min(1).max(120),
  workerType: z.enum(["human", "agent", "service"]),
  role: z.string().min(1).max(120),
  capabilityIds: z.array(z.string().min(1).max(120)).max(50),
  registryStatus: z.enum(["registered", "suspended", "retired"]),
  sourceId: z.string().min(1).max(120),
  sourceVersion: z.string().min(1).max(40),
});
export const WorkerLifecycleEventSchema = z.object({
  eventId: z.string().uuid(),
  workerId: z.string().min(1).max(100),
  type: z.enum(["worker.registered", "worker.available", "mission.assigned", "work.started", "work.progressed", "review.requested", "approval.pending", "work.completed", "work.failed", "worker.heartbeat"]),
  occurredAt: z.string().datetime(),
  sourceId: z.string().min(1).max(120),
  missionId: z.string().max(120).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});
export const AnalyzerManifestSchema = z.object({
  analyzerId: z.string().min(1).max(100),
  name: z.string().min(1).max(120),
  version: z.string().min(1).max(40),
  inputKinds: z.array(z.string()).max(40),
  outputKinds: z.array(z.string()).max(40),
  advisoryOnly: z.literal(true),
});
export const EvidenceReferenceSchema = z.object({
  evidenceId: z.string().min(1).max(120),
  source: z.string().min(1).max(300),
  capturedAt: z.string().datetime(),
  digest: z.string().optional(),
});
export const AnalysisResultSchema = z.object({
  analysisId: z.string().min(1).max(120),
  boardId: z.string().min(1).max(120),
  analyzerId: z.string().min(1).max(100),
  analyzerVersion: z.string().min(1).max(40),
  subject: z.string().min(1).max(300),
  observations: z.array(z.string()).max(100),
  inferences: z.array(z.string()).max(100),
  recommendations: z.array(z.string()).max(100),
  confidence: z.number().min(0).max(1),
  confidenceRationale: z.string().min(1).max(1000),
  evidence: z.array(EvidenceReferenceSchema).max(100),
  limitations: z.array(z.string()).max(100),
  status: z.enum(["draft", "review", "verified", "rejected"]),
  createdAt: z.string().datetime(),
});
export const BoardDefinitionSchema = z.object({
  boardId: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  analyzerIds: z.array(z.string().min(1).max(100)).max(40),
  evidenceIds: z.array(z.string().min(1).max(120)).max(500),
  visibility: z.enum(["private", "team", "organization"]),
  version: z.number().int().positive(),
});
export type WorkerManifest = z.infer<typeof WorkerManifestSchema>;
export type WorkerLifecycleEvent = z.infer<typeof WorkerLifecycleEventSchema>;
export type AnalyzerManifest = z.infer<typeof AnalyzerManifestSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type BoardDefinition = z.infer<typeof BoardDefinitionSchema>;

/** Static examples are intentionally marked demo-only. Never use as live workforce telemetry. */
export const DEMO_WORKERS: WorkerManifest[] = [
  { workerId: "demo-inspector", displayName: "Inspector", workerType: "agent", role: "Repository inspection", capabilityIds: ["repo.read", "evidence.collect"], registryStatus: "registered", sourceId: "demo-fixture", sourceVersion: "1.0" },
  { workerId: "demo-architect", displayName: "Architect", workerType: "agent", role: "System architecture", capabilityIds: ["architecture.review"], registryStatus: "registered", sourceId: "demo-fixture", sourceVersion: "1.0" },
  { workerId: "demo-analyst", displayName: "Analyst", workerType: "agent", role: "Evidence analysis", capabilityIds: ["analysis.read"], registryStatus: "registered", sourceId: "demo-fixture", sourceVersion: "1.0" },
  { workerId: "demo-builder", displayName: "Builder", workerType: "agent", role: "Implementation planning", capabilityIds: ["code.propose"], registryStatus: "registered", sourceId: "demo-fixture", sourceVersion: "1.0" },
];
