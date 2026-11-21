# COSMOS API Security — T2

Status: isolated development branch. No provider credentials, database migration,
deployment, merge, or production exposure has been performed.

## Implemented

- Shared API authentication boundary using the T1 trusted-provider contract.
- No identity provider is configured. The default adapter returns no provider,
  so conversation GET/POST requests fail closed with HTTP 503.
- Provider credential failures and invalid/expired claims return HTTP 401.
- Conversation reads are scoped by both authenticated tenant ID and subject.
- Conversation writes derive tenant ID and owner subject exclusively from the
  authenticated principal, never from request payload fields.
- Fresh-database schema requires tenant and owner values.
- Existing-database migration adds nullable ownership columns. Legacy rows with
  unknown ownership remain inaccessible through tenant-scoped reads.
- Identity validation rejects expired claims, expiry-before-issuance, and
  claims issued more than 60 seconds in the future.

## Trust boundary

The future provider adapter must cryptographically validate credentials,
including signature, issuer, audience, expiration and applicable session or
revocation policy, before returning claims to the identity boundary. Do not
decode a JWT and treat its payload as verified. Do not trust actor/tenant IDs
from request bodies, headers, query strings or browser state.

WARP GATE remains a separate authorization authority. Authentication alone
does not grant operation scopes or roles.

## Database migration

For an existing Neon database, review and apply:

`db/migrations/20261121_001_conversation_tenant_isolation.sql`

The migration deliberately does not assign existing conversations to users.
Legacy rows remain with NULL ownership and are excluded by scoped queries.
Do not backfill ownership without a verified, auditable mapping.

For a fresh database, use the updated `db/schema.sql`.

## Current limitations / blockers

- No concrete OIDC/session provider has been selected or configured.
- Conversation routes are intentionally unavailable until a trusted provider
  adapter is implemented and verified.
- Migration has not been applied to Neon.
- No end-to-end test against a live identity provider or database has run.
- WARP GATE policy enforcement and CUMI integration remain separate milestones.
- Rate limiting, CSRF/session protections (as applicable to the chosen
  provider), audit events and operational abuse controls remain outstanding.

## T2 exit evidence required

- [ ] Concrete provider selected and verified using official provider docs.
- [ ] Provider adapter tests cover signature, issuer, audience, expiry and
      revocation/session behavior as supported by that provider.
- [ ] Unauthorized and malformed credentials are rejected.
- [ ] Tenant A cannot list or read Tenant B's records.
- [ ] A user cannot access another subject's records within the same tenant.
- [ ] New writes take ownership only from verified principal claims.
- [ ] Migration is reviewed and applied only to the intended Neon database.
- [ ] CI passes and a human reviews the security diff.

No production deployment is authorized by this milestone.
