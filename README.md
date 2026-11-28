# Cosmos Alien Mind

Responsive Next.js foundation for the COSMOS AI personal assistant dashboard.

## Current functionality

- Responsive COSMOS dashboard and conversation capture UI.
- Server-side Neon Postgres connection using `DATABASE_URL`.
- Neon-managed authentication through `@neondatabase/auth`.
- Email/password sign-in and sign-up through the Neon Auth service.
- Organization-based tenant isolation.
- Server-side session validation and current active-membership checks.
- Conversation reads and writes scoped to the verified organization and user.
- Fail-closed behavior when authentication configuration is incomplete.
- No API keys, auth secrets, or database credentials are committed.

## Local setup (Termux)

1. Use Node.js 20.9 or newer (Node.js 24 is suitable).
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `DATABASE_URL` to the connection string for the Neon branch
   `cosmos-neon-auth-preview`.
5. Keep the preview value of `NEON_AUTH_BASE_URL` from `.env.example`.
6. Generate a private cookie secret with `openssl rand -base64 32` and set
   `NEON_AUTH_COOKIE_SECRET` in `.env.local`.
7. Start the local app: `npm run dev`.
8. Open `/sign-in`, create an account, then create or select a workspace.
9. Run checks: `npm run lint`, `npm run test:cosmos`,
   `npm run typecheck`, and `npm run build`.

The Neon Auth SDK is pinned to the beta release and uses its Next.js 16
adapter. The application therefore upgrades from Next.js 15 to Next.js 16.
No deployment is performed by this branch.

## Identity and tenant security

- Neon Auth validates the session server-side.
- Each protected conversation request checks current membership in the active
  organization.
- Tenant identity comes only from the verified session's active organization.
- User identity comes only from the verified Neon Auth user.
- Client-supplied tenant/user IDs are ignored.
- WARP GATE remains the independent authorization authority. Authentication
  and organization membership do not grant COSMOS capabilities or scopes.
- Legacy conversations with unknown ownership remain inaccessible until
  ownership is mapped using verified evidence.

## Current limitations

- Email/password sign-up is enabled on the preview Auth instance. Email
  verification is currently disabled; do not treat accounts as verified.
- Localhost is allowed on the preview Auth instance. No production origin has
  been added.
- WARP GATE policy enforcement, audit logging, abuse/rate-limit controls, and
  end-to-end tenant-isolation tests remain required before production.
- The Neon Auth SDK is beta and must be pinned and tested before upgrades.
- No production deployment or branch merge has been performed.

## Deployment gate

Do not deploy until email verification/recovery policy is configured, the
production origin is explicitly trusted, WARP GATE authorization and audit
controls are implemented, tenant-isolation tests pass against the intended
database, and a human reviews the security diff. Keep all secrets in local or
server-side environment settings; never commit them or use a
`NEXT_PUBLIC_` prefix.
