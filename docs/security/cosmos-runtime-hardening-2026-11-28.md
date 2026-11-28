# COSMOS Runtime Hardening — Feature Branch Record

Date: 2026-11-28
Repository: CodebruteDamage/cosmos-alien-mind
Branch: cosmos/m6-l4-l5-orchestration-provision
Scope: Identity boundary, tenant isolation, API ingress hardening, and authorization fail-closed behavior.

## Implemented in source

- Added Better Auth server/client configuration and Next.js auth route.
- Added sign-in and organization onboarding pages.
- Added a server-side identity adapter that resolves user and tenant from the verified Better Auth session and rechecks active organization membership.
- Added strict principal validation, expiry checks, and a shared API authentication boundary.
- Added a WARP GATE authorization interface. Missing, denying, malformed, or unavailable authorization results fail closed. No local allow policy exists.
- Protected conversation GET/POST with authentication and WARP GATE authorization.
- Scoped conversation reads by verified tenant and owner subject. Writes derive tenant and owner only from the verified principal.
- Added strict Origin validation for conversation creation and a streaming request-body byte limit.
- Changed conversation/message creation to one SQL statement so the pair is atomic.
- Updated fresh-database schema with required tenant and owner columns; added a separate existing-database migration that leaves legacy rows unowned.
- Added a Node test-runner script and initial identity/WARP GATE boundary tests.

## Runtime behavior

The Better Auth adapter is not considered configured unless:
- DATABASE_URL is present and uses a PostgreSQL URL scheme;
- BETTER_AUTH_SECRET is at least 32 characters;
- BETTER_AUTH_URL is a valid HTTP(S) URL; and
- production uses HTTPS.

**WARP GATE is not integrated.** The current conversation API intentionally returns HTTP 503 for missing/unavailable WARP GATE and HTTP 403 for policy denial. Authentication alone cannot authorize data access or execution.

## Required before enabling data access

1. Generate and review Better Auth core and Organization plugin schema using `npm run auth:generate`.
2. Review and apply the Better Auth schema and tenant-isolation migration only to the intended Neon database, with explicit operator approval.
3. Integrate the real WARP GATE adapter and durable decision/audit references.
4. Add rate limiting, abuse monitoring, email verification and account recovery delivery, and complete CSRF/session review.
5. Add/verify a lockfile and CI workflow; run lint, typecheck, tests, and production build.
6. Run integration tests against an isolated test database and verify cross-tenant and cross-user denial.
7. Obtain independent security review before production use.

## Verification status

Source files were committed to the feature branch and are to be re-fetched for integrity. No local dependency installation, lint, typecheck, automated test, production build, live database query, migration, deployment, or main-branch merge was performed during this operation.

This is a feature-branch security foundation, not a production-ready authentication service, not an operational WARP GATE integration, and not L4/L5 certification. Main remains untouched.
