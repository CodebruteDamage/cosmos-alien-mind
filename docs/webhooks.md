# COSMOS Webhook Ingress — Security Foundation

Status: branch-only implementation proposal; not deployed or enabled.

## Current scope

This change adds a disabled-by-default inbound webhook route with:
- timestamped HMAC-SHA256 verification over the exact raw request body;
- a five-minute timestamp tolerance and constant-time digest comparison;
- a 64 KiB request-body limit;
- strict event-envelope validation;
- a durable PostgreSQL inbox insert with event-ID deduplication;
- fail-closed behavior when configuration or storage is unavailable.

## Activation guard

The route returns 404 unless the server-side environment variable
`COSMOS_WEBHOOK_ENABLED` is exactly `true`. A server-side
`COSMOS_WEBHOOK_SECRET` of at least 32 UTF-8 bytes is also required.
Do not enable this route in production from this branch.

## Signature contract

Headers:
- `x-cosmos-timestamp`: ten-digit Unix timestamp in seconds.
- `x-cosmos-signature`: `sha256=<hex digest>`.
- `content-type`: `application/json`.

The HMAC-SHA256 input is the UTF-8 timestamp, a literal period, then the exact raw
request bytes. The event body must contain `event_id`, `event_type`,
`occurred_at`, `source`, and object-valued `payload`.

The `source` property is untrusted event metadata. With this initial single-secret
baseline it is not a verified provider or tenant identity.

## Explicit limitations

- One shared secret only; no per-provider credential registry or tenant isolation.
- No rate limiter, outbound webhook sender, queue worker, event ordering, retry
  scheduler, dead-letter processor, or retention job is included.
- The database inbox status `received` means persisted, not authorized, queued,
  processed, or executed.
- No COSMOS Core or WARP GATE execution adapter is connected.
- The SQL migration must be reviewed and applied manually to the intended database.
- Do not store sensitive personal data in event payloads until data classification,
  access controls, and retention are implemented.

## Required next gates

1. Implement per-integration identity and tenant mapping before multi-tenant use.
2. Add explicit WARP GATE authorization before any processing or execution.
3. Add durable worker/queue semantics, bounded retries, dead-letter handling,
   and replay controls.
4. Add rate limiting, secret rotation, audit integration, and retention controls.
5. Run CI and security review; obtain human certification before production use.
