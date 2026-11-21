# COSMOS API Foundation — T1

Status: foundation implementation on an isolated development branch.
This is not production authentication and does not make existing public routes
safe for multi-user use.

## Scope

- Versioned request envelope and API response/error contracts.
- Typed authenticated-principal contract.
- Fail-closed identity boundary that requires an injected trusted provider.
- Tenant-match helper for downstream data-access enforcement.

## Security boundary

The identity provider is responsible for cryptographic credential verification:
signature, issuer, audience, expiry and applicable revocation/session checks.
The identity module validates the shape and expiry of provider-returned claims;
it does not decode or verify JWTs itself.

No provider is configured by this change. With no provider, authentication
returns IDENTITY_PROVIDER_NOT_CONFIGURED. Provider failures and invalid or
expired claims are rejected.

WARP GATE remains the authorization authority. A valid principal is not
permission to perform every operation. Each protected operation still requires
a separate policy decision and scope check.

## Existing API limitation

The current conversation GET and POST handlers remain unchanged in T1.
They do not yet call this identity boundary and continue to lack user/tenant
isolation. Do not expose them as production multi-user endpoints or store
sensitive/private conversations until route integration, authorization,
tenant-scoped queries, rate limiting and abuse controls are implemented.

## T1 exit criteria

- [ ] TypeScript build and lint pass.
- [ ] Contract validation tests cover valid and invalid envelopes.
- [ ] Identity tests prove missing provider, provider exception, malformed
      claims and expired principal all fail closed.
- [ ] Tenant mismatch is rejected by protected route/data-access integration.
- [ ] No route is described as authenticated until provider and route guard
      are actually integrated.
- [ ] WARP GATE authorization remains a separate mandatory follow-on.

## Blocker register

| ID | Severity | Blocker | Dependency | Exit evidence | Status |
|---|---|---|---|---|---|
| BLK-001 | Critical | No configured identity provider or tenant-isolated route enforcement | Trusted identity provider, route guard, tenant-scoped data access | Cross-tenant isolation and unauthorized-request tests | OPEN |
| BLK-002 | Critical | WARP GATE runtime is not connected | Verified principal and policy adapter | Missing, expired, invalid and out-of-scope decisions denied | OPEN |
| BLK-003 | High | CUMI runtime contracts are not integrated | Versioned module envelope and validators | Compatibility tests between independent modules | OPEN |

## Explicit non-goals

- No production authentication provider or secrets.
- No migration or change to the Neon schema.
- No change to existing API route behavior.
- No deployment, merge or production endpoint exposure.
