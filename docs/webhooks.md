# COSMOS Webhook — integration and queue foundation

Status: feature-branch implementation only. Disabled by default; not deployed.

## Integration identity

The ingress route requires `x-cosmos-key-id`. It resolves the key ID to a
server-controlled integration record in `cosmos_webhook_integrations`. The
record supplies integration ID, tenant ID, event-type allowlist, enabled flag,
and the name of a server-side secret environment variable.

The database stores the environment-variable reference, not the webhook secret.
Secret names must match `COSMOS_WEBHOOK_SECRET_<ID>`; the corresponding value
must contain at least 32 UTF-8 bytes. HMAC verification signs the exact raw body
with a timestamp and a five-minute tolerance.

The event body and its `source` field are untrusted. Tenant and integration
identity are assigned only from the registry after signature verification.
Unknown, disabled, malformed, or unconfigured integrations fail closed.

## Queue primitives

The inbox migration adds tenant binding, attempt counters, retry scheduling,
leases, and dead-letter state. `lib/webhooks/queue.ts` provides an atomic
bounded batch-claim operation using row locks with `SKIP LOCKED`, expired-lease
recovery, capped exponential retry delays, and dead-letter transition at the
attempt ceiling.

These are queue primitives, not a running worker. No scheduler or dispatch
endpoint is included. A worker must invoke WARP GATE authorization before any
operation and must not treat a claimed row as permission to execute it.

## Database

Apply `db/webhook-schema.sql` first, then review and manually apply
`db/webhook-integration-registry.sql` to the intended Neon database. Neither
migration is run by CI or deployment. No integration is enabled by default.

## Remaining limitations

- Registry provisioning and secret rotation workflow are not implemented.
- Rate limiting and per-integration quotas are absent.
- WARP GATE runtime invocation and trusted approval-service integration are absent.
- A scheduled worker, event dispatcher, audit integration, replay controls,
  and retention job are not implemented.
- Inbox receipt or queue claim does not mean authorization or execution.
- No endpoint is enabled, deployed, or exposed by this branch.
