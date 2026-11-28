# Cosmos Alien Mind

Responsive Next.js MVP foundation for the COSMOS assistant workspace.

## Runtime security status

The feature branch contains a Better Auth identity adapter and tenant-scoped conversation handlers. Authentication requires server-side `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. User and tenant identity are derived from a verified Better Auth session and active organization membership; caller-supplied identity fields are not trusted.

**WARP GATE is not yet connected.** Protected conversation operations therefore fail closed with HTTP 503 until a verified WARP GATE adapter is integrated. Authentication alone does not grant permissions.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure the server-only environment values. Never commit secrets.
5. Generate the Better Auth schema with `npm run auth:generate`, review the generated SQL, and apply it only to the intended Neon database with explicit operator approval.
6. Review and apply `db/migrations/20261128_001_conversation_tenant_isolation.sql` to an existing database. For a new database, use the tenant-aware `db/schema.sql`.
7. Run `npm run lint`, `npm run typecheck`, and `npm run test:cosmos`.
8. Start locally with `npm run dev`.

Legacy conversations with unknown ownership remain inaccessible. Do not assign legacy rows to users without a verified, auditable mapping.

## Security boundaries

- Better Auth verifies sessions; active organization membership is rechecked on each request.
- Tenant and owner values are taken only from the verified principal.
- Conversation reads are scoped by tenant and subject.
- Conversation creation requires a trusted Origin, bounded JSON body, and one-statement atomic insert.
- WARP GATE remains the sole authorization authority. No local allow fallback exists.
- No production migration, secret provisioning, deployment, or main-branch merge is authorized by this feature work.
- Email verification/recovery delivery, rate limiting, operational abuse controls, WARP GATE runtime integration, audit persistence, and production security review remain outstanding.

## Current functionality

- Cosmic dashboard and server-side Neon connectivity probe.
- Tenant-aware conversation persistence code, gated by authentication and WARP GATE.
- No live AI/model inference.
