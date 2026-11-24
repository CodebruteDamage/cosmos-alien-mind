import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { discoverGitHubRepositories } from "@/lib/inspector/github-adapter.mjs";
import { buildRepositoryOrganizationPlan } from "@/engines/inspector/src/v1.3/repository-organizer.mjs";
import { triageCraft } from "@/lib/craft/engine.mjs";
import { evaluateEvidence } from "@/lib/evidence-engine/engine.mjs";
import { generateBuildGuidance } from "@/lib/build-guidance/engine.mjs";
import { attachEvidenceAssessment } from "@/lib/build-guidance/evidence-adapter.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.COSMOS_INSPECTOR_ACCESS_TOKEN;
  if (!expected || expected.length < 24) return false;
  const supplied = request.headers.get("authorization") || "";
  const prefix = "Bearer ";
  if (!supplied.startsWith(prefix)) return false;
  const actual = supplied.slice(prefix.length);
  if (actual.length !== expected.length) return false;
  return createHash("sha256").update(actual).digest("hex") === createHash("sha256").update(expected).digest("hex");
}

function toCraftBlockers(findings: Array<Record<string, unknown>>, evidenceBySubject: Map<string, any>) {
  return findings.map((item, index) => {
    const evidence = evidenceBySubject.get(String(item.subject)) ?? null;
    const severity = item.severity;
    const impact = severity === "CRITICAL" ? 5 : severity === "HIGH" ? 4 : severity === "MEDIUM" ? 3 : 2;
    const category = String(item.category ?? "INSPECTOR_FINDING");
    const isFailure = category === "WORKFLOW_NOT_GREEN";
    return {
      id: String(item.id ?? `INS-${index + 1}`),
      title: `${category}: ${String(item.subject ?? "Repository finding")}`,
      description: String(item.recommendation ?? item.evidence ?? ""),
      impact,
      likelihood: isFailure ? 4 : 3,
      urgency: severity === "CRITICAL" || severity === "HIGH" ? 4 : 2,
      evidenceConfidence: evidence?.quality?.confidence ?? 0,
      evidenceStatus: evidence?.status ?? "UNVERIFIED"
    };
  });
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Inspector access denied or server access token is not configured." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
  try {
    const snapshot = await discoverGitHubRepositories();
    const organization = buildRepositoryOrganizationPlan(snapshot);
    if (!organization.ok) {
      return NextResponse.json({ ok: false, error: organization.message }, { status: 422 });
    }

    const artifact = JSON.stringify(snapshot);
    const digest = createHash("sha256").update(artifact).digest("hex");
    const collectedAt = snapshot.generatedAt;
    const evidence = evaluateEvidence({
      records: [{
        evidenceId: `GITHUB-INVENTORY-${digest.slice(0, 16)}`,
        source: "GitHub REST API authenticated read",
        sourceTier: "first_party",
        subject: "COSMOS allowlisted repository inventory",
        claim: "Repository, branch protection metadata and recent workflow run inventory captured.",
        claimKey: "cosmos-github-inventory",
        value: { repositoryCount: snapshot.repositories.length, branchCount: organization.branchCount },
        kind: "observation",
        collectedAt,
        artifact,
        digest,
        sourceReference: "https://api.github.com"
      }]
    });

    const evidenceBySubject = new Map(evidence.findings.map(item => [item.subject, item]));
    const blockers = toCraftBlockers(organization.findings as unknown as Array<Record<string, unknown>>, evidenceBySubject);
    const craft = blockers.length
      ? triageCraft({ blockers })
      : { schema: "cosmos.craft-triage.v1", recommendationOnly: true, executionAuthorized: false, summary: { total: 0, critical: 0, high: 0, needsEvidenceReview: 0 }, blockers: [], priorityOrder: [], governance: { authority: "WARP GATE", defaultDecision: "deny", humanApprovalRequired: true } };

    const guidanceBase = generateBuildGuidance({
      objective: "Integrate a read-only GitHub repository inspector, evidence assessment, deterministic CRAFT triage, and controlled dashboard recommendations.",
      buildTypes: ["BT-02", "BT-05"],
      profile: "INTEGRATION",
      repository: snapshot.repositories.map(repo => repo.name).join(", ")
    });
    const guidance = attachEvidenceAssessment(guidanceBase, evidence);

    return NextResponse.json({
      ok: true,
      generatedAt: snapshot.generatedAt,
      mode: "READ_ONLY",
      inventory: {
        repositoryCount: organization.repositoryCount,
        branchCount: organization.branchCount,
        repositories: organization.repositorySummaries
      },
      findings: organization.findings,
      evidence,
      craft,
      guidance,
      governance: {
        authority: "WARP GATE",
        executionAuthorized: false,
        writesPerformed: false,
        defaultDecision: "deny",
        limitations: [
          "GitHub data is limited to explicitly allowlisted repositories, branches and the latest 30 workflow runs per repository.",
          "Evidence is assessed in memory and is not persisted.",
          "Branch protection metadata is a GitHub API observation, not a complete branch-rule audit.",
          "CRAFT and Build Guidance are advisory only."
        ]
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repository inspection failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
