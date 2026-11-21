# COSMOS Webhook — governed ingress and worker foundation

Status: feature-branch implementation only. Disabled by default; not deployed.

## Integration identity and credentials

The ingress route requires `x-cosmos-key-id`. It resolves that identifier to a
server-controlled integration record supplying integration ID, tenant ID,
enabled state, event allowlist, server-side secret-variable reference, and
event-to-operation policy mapping.

The database stores the environment-variable reference, not the secret. Secret
names must match `COSMOS_WEBHOOK_SECRET_<ID>`; the corresponding server-side
value must contain at least 32 UTF-8 bytes. HMAC verification signs the exact raw
body with a timestamp and a five-minute tolerance.

Tenant identity, operation, target scope, and risk class come from the registry,
not from event payload claims.

## WARP GATE policy boundary

Ingress invokes the deny-by-default evaluator after authentication and schema
validation. It records an `ingress` decision. High/critical risk events are
denied because a trusted human-approval service is not connected.

The worker resolves the current integration policy again immediately before
dispatch. It checks integration identity, tenant binding, event policy, risk,
approval, and the existence of an explicitly registered operation handler.
It writes a separate `dispatch` audit decision. Audit persistence failure
prevents execution. Missing approval or handler causes quarantine.

## Worker runtime foundation

`lib/webhooks/worker-runtime.ts` provides a one-batch DB-backed runtime:
- atomically claims a bounded inbox batch;
- re-resolves current integration and tenant policy;
- invokes the WARP GATE evaluator again;
- obtains approval through an injected trusted approval adapter when needed;
- dispatches only through an explicitly supplied operation-handler registry;
- records dispatch decisions, marks completion, quarantines denials, and schedules
  bounded retries for transient failures.

The runtime is a callable library function, not a scheduled worker. No cron,
HTTP dispatch endpoint, production handler registry, or approval service is
configured. A handler must be idempotent using the event ID passed as its key.

## Audit

Ingress and dispatch decisions use separate stages so the audit history can
retain multiple dispatch attempts. The schema is append-oriented; production
immutability still requires database roles that deny UPDATE/DELETE to worker
credentials. Approval references are metadata only; the trusted approval
adapter must validate approval authenticity and scope.

## Database

Apply `db/webhook-schema.sql` first, then review and manually apply
`db/webhook-integration-registry.sql` to the intended Neon database. Neither
migration is run by CI or deployment. No integration is enabled by default.

## Remaining limitations

- Registry administration and secret rotation/revocation workflow are absent.
- Rate limiting and per-integration quotas are absent.
- Trusted human-approval service is not connected.
- No scheduler or production operation-handler registry is configured.
- Database-enforced append-only audit permissions are not configured.
- Replay controls, retention, telemetry, and production deployment controls remain absent.
- Inbox receipt or queue claim does not mean downstream execution.
- No endpoint is enabled, deployed, or exposed by this branch.
