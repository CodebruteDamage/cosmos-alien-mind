# COSMOS Webhook — integration registry foundation

Status: feature-branch implementation only. Disabled by default; not deployed.

## Integration identity

The ingress route now requires `x-cosmos-key-id`. It resolves the key ID to a
server-controlled integration record in `cosmos_webhook_integrations`. The
record supplies integration ID, tenant ID, event-type allowlist, enabled flag,
and the name of a server-side secret environment variable.

The database stores the environment-variable reference, not the webhook secret.
Secret names must match `COSMOS_WEBHOOK_SECRET_<ID>`; the corresponding value
must contain at least 32 UTF-8 bytes. HMAC verification still signs the exact
raw body with a timestamp and a five-minute tolerance.

The event body and its `source` field are untrusted. Tenant and integration
identity are assigned only from the registry after signature verification.
Unknown, disabled, malformed, or unconfigured integrations fail closed.

## Database

Review `db/webhook-integration-registry.sql` and apply manually before testing
against a database. It creates the registry and adds tenant/integration
columns to the inbox. It does not enable any integration or activate the route.

## Remaining limitations

- Registry provisioning/rotation UI and secret manager integration are absent.
- Rate limiting and per-integration quotas are absent.
- WARP GATE runtime invocation and trusted approval-service integration are absent.
- Durable worker leases, bounded retries, dead-letter processing and replay controls
  are not implemented in this commit.
- The inbox still records receipt only; it does not imply authorization or execution.
- No endpoint is enabled, deployed, or exposed by this branch.
