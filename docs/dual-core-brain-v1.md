# COSMOS Dual-Core Brain v1 — Initial Runtime Slice

## Purpose

Introduce a controlled coordinator for COSMOS Core and Alien Mind without replacing either model adapter or changing the existing GPT response endpoint.

## Implemented in this milestone

- Runs two independently supplied provider functions against the same prompt.
- Requires each provider to return response text and a concise comparable decision.
- Compares normalized decision strings.
- Returns `aligned` only when both decisions match.
- Returns `needs_review` when decisions differ, a provider is unavailable, a decision is missing, or the coordinator times out.
- Aborts both providers on timeout when they honor the supplied AbortSignal.
- Explicitly reports that no tool execution or permission grant occurred.

## Governance boundary

Alignment is not authorization. This module does not call tools, execute recommendations, grant capabilities, bypass WARP GATE, or replace human approval. A downstream execution boundary must independently authorize each capability and action. Material disagreement must remain visible for human review.

## Not yet implemented

- A real Alien Mind provider adapter or provider credentials.
- Wiring into the existing `POST /api/runtime/respond` endpoint.
- A domain-aware decision schema or semantic disagreement evaluator.
- Durable dual-core audit storage and trace correlation.
- WARP GATE authorization integration and independent C-Inspector certification.
- End-to-end tests against live providers.

## Provider contract

Each provider receives the same prompt and a context object containing an AbortSignal and its role. It returns:

```js
{
  text: "Independent analysis...",
  decision: "concise comparable conclusion",
  model: "provider-model-id"
}
```

The decision string must be a compact conclusion suitable for exact normalized comparison. Free-form answer similarity is not treated as proof of agreement.

## Validation

Run:

```bash
node --test lib/runtime/tests/*.test.mjs
```

Passing unit tests validate the coordinator contract only. They do not prove live model connectivity, runtime integration, security certification, or production readiness.
