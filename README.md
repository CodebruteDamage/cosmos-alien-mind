# Cosmos Alien Mind

Responsive Next.js MVP foundation for the COSMOS AI personal assistant dashboard.

## Current functionality

- Cosmic dark dashboard, responsive for desktop and mobile.
- Server-side Neon Postgres connection using `DATABASE_URL`.
- Better Auth email/password sign-in and sign-up.
- Better Auth Organization plugin for workspace/tenant membership.
- Server-side session validation and active-organization membership checks.
- Conversation APIs scoped to the verified active organization and user.
- Fail-closed behavior when authentication environment is incomplete.
- Input validation and generic public-facing database errors.
- No API keys, auth secrets, or database credentials are committed.

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `DATABASE_URL` to the intended Neon connection string.
5. Generate a high-entropy secret (at least 32 characters) with
   `openssl rand -base64 32`, then set `BETTER_AUTH_SECRET`.
6. Set `BETTER_AUTH_URL` to the exact application origin, such as
   `http://localhost:3000` for local development.
7. Generate Better Auth's core and Organization plugin schema:
   `npm run auth:generate`.
8. Review the generated SQL at
   `db/migrations/20261121_002_better_auth.sql` and apply it only to the
   intended Neon database through a controlled migration process.
9. Review and apply `db/migrations/20261121_001_conversation_tenant_isolation.sql`
   to existing databases. For a new database, use the updated
   `db/schema.sql` for COSMOS conversations.
10. Start the app: `npm run dev`.
11. Open `/sign-in`, create an account, then create/select a workspace.
12. Run checks: `npm run lint`, `npm run test:cosmos`,
    `npm run typecheck`, and `npm run build`.

## Identity and tenant security

- Better Auth validates sessions on the server. The client cannot provide
  trusted user or tenant IDs.
- Each protected conversation request checks current membership in the
  active organization.
- Tenant identity comes only from Better Auth's verified active-organization
  session field.
- WARP GATE remains the independent authorization authority. Authentication
  and organization membership do not grant COSMOS capabilities or scopes.
- Legacy conversations with unknown ownership remain inaccessible until
  ownership is mapped using verified evidence.

## Current limitations

- Email verification and password-recovery delivery are not configured.
  Select and configure an email provider before production use.
- WARP GATE policy enforcement, audit logging, rate-limit/abuse review,
  and CUMI integration remain outstanding.
- Better Auth and tenant-isolation migrations have not been applied to Neon
  by this build process.
- No production deployment or branch merge has been performed.

## Deployment

Do not deploy until the auth schema and tenant-isolation migrations are
reviewed and applied, the email verification/recovery provider is configured,
WARP GATE controls are implemented, and security tests pass against the
intended database. Keep all secrets in server-side environment settings;
never commit them or use a `NEXT_PUBLIC_` prefix.
