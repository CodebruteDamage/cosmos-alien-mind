# COSMOS Webhook — integration, policy, audit, and queue foundation

Status: feature-branch implementation only. Disabled by default; not deployed.

## Integration identity and credentials

The ingress route requires `x-cosmos-key-id`. It resolves that identifier to a
server-controlled integration record. The record supplies integration ID,
tenant ID, enabled state, event allowlist, server-side secret-variable reference,
and event-to-operation policy mapping.

The database stores the environment-variable reference, not the secret. Secret
names must match `COSMOS_WEBHOOK_SECRET_<ID>`; the corresponding server-side
value must contain at least 32 UTF-8 bytes. HMAC verification signs the exact raw
body with a timestamp and a five-minute tolerance.

The event body and its `source` field are untrusted. Tenant and integration
identity are assigned only from the registry after signature verification.
Event operation, target scope, and risk class are also resolved from the
server-controlled registry, not from event payload claims.

## WARP GATE policy boundary

The route now invokes the deny-by-default authorization evaluator after
authentication and schema validation. It checks integration identity, tenant,
event type, operation, target scope, and risk class. High/critical risk events
are denied because a trusted human-approval service is not connected.

Authorization decisions are recorded in `cosmos_webhook_authorization_audit`
without storing payloads, secrets, or signature values. The audit table is
insert-only by application convention; database-level immutability still
requires restricted database roles.

An allow decision permits receipt under the configured policy only. It does
not dispatch or execute an operation.

## Queue primitives

The inbox migration adds tenant binding, attempt counters, retry scheduling,
leases, and dead-letter state. `lib/webhooks/queue.ts` provides atomic bounded
claims using `SKIP LOCKED`, expired-lease recovery, capped exponential retry
delays, and dead-letter transition at the attempt ceiling.

These are queue primitives, not a running worker. No scheduler or dispatch
endpoint is included. Any future worker must re-evaluate WARP GATE policy and
obtain trusted approval before execution.

## Database

Apply `db/webhook-schema.sql` first, then review and manually apply
`db/webhook-integration-registry.sql` to the intended Neon database. Neither
migration is run by CI or deployment. No integration is enabled by default.

## Remaining limitations

- Registry administration and secret rotation/revocation workflow are absent.
- Rate limiting and per-integration quotas are absent.
- Trusted human-approval service is not connected.
- No scheduled worker or execution adapter is present.
- Database-enforced append-only audit permissions are not configured.
- Replay controls, retention, telemetry, and production deployment controls remain absent.
- Inbox receipt or queue claim does not mean downstream execution.
- No endpoint is enabled, deployed, or exposed by this branch.
