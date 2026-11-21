# COSMOS Better Auth Integration — T3

Status: implementation on an isolated feature branch. CI must pass before this
milestone is considered code-certified. No Neon migration, production secret,
deployment, or branch merge has been performed.

## Components

- Better Auth server configuration: `lib/auth.ts`.
- Next.js auth handler: `app/api/auth/[...all]/route.ts`.
- React client and organization plugin: `lib/auth-client.ts`.
- Sign-in and sign-up screen: `app/sign-in/page.tsx`.
- Organization onboarding and active-tenant selection:
  `app/onboarding/page.tsx`.
- COSMOS identity adapter: `lib/cosmos/identity-provider.ts`.

## Environment

Set these server-side variables in local `.env.local` and the hosting
environment:

- `DATABASE_URL`: Neon PostgreSQL connection string.
- `BETTER_AUTH_SECRET`: high-entropy secret, at least 32 characters.
- `BETTER_AUTH_URL`: exact canonical application origin.

Generate a secret with `openssl rand -base64 32`. Never commit secrets or
expose them through a `NEXT_PUBLIC_` variable.

The auth route and COSMOS identity adapter fail closed unless all three
variables are present. Build-only fallback values are not valid runtime
credentials and are not accepted by the route guard.

## Database schema

Better Auth's core and Organization plugin tables are not hand-written into
the existing COSMOS schema. Generate a reviewable SQL migration from the
configured Better Auth instance:

```bash
npm install
npm run auth:generate
```

The script invokes the Better Auth CLI with `lib/auth.ts` and writes
`db/migrations/20261121_002_better_auth.sql`. Review the generated SQL,
compare it with the intended Neon database, and apply it through a controlled
migration process. Do not run an automatic production migration from CI.

The existing tenant-isolation migration
`db/migrations/20261121_001_conversation_tenant_isolation.sql` is separate
and must also be reviewed/applied to an existing database. Legacy conversation
rows with unknown owner/tenant values remain inaccessible until there is a
verified mapping.

## Identity and tenant trust

- Better Auth validates the session server-side with
  `auth.api.getSession({ headers })`.
- The adapter also checks the active organization membership on each request
  using `auth.api.getActiveMember({ headers })`.
- Tenant ID is sourced only from the verified session's
  `activeOrganizationId`.
- User ID is sourced only from the verified Better Auth user.
- Client-supplied tenant/user headers and request body fields are ignored.
- A session without an active organization is rejected.
- The adapter emits only the generic `authenticated` role and no scopes.
  WARP GATE must independently authorize every protected COSMOS operation;
  Better Auth membership is not a substitute for WARP GATE permissions.

## Current product limitations

- Email/password sign-up and sign-in are enabled. Email verification and
  password-recovery delivery are not configured because no mail provider has
  been selected. Do not expose this as a production identity service until
  verified-email and recovery flows are configured.
- Organization self-service creation is enabled for the MVP. Organization
  membership is revalidated for each conversation request.
- WARP GATE policy enforcement, audit logging, abuse/rate-limit review,
  CSRF/origin review, and CUMI integration remain separate controls.
- No secrets have been added to repository settings.
- No Better Auth or tenant-isolation migration has been applied to Neon.

## T3 acceptance evidence

- [ ] CI: lint, unit tests, typecheck, production build.
- [ ] Better Auth schema generated and reviewed.
- [ ] Neon migrations applied only to the intended database with explicit
      operator approval.
- [ ] Sign-up/sign-in/session lifecycle tested against the intended Neon DB.
- [ ] Active organization membership is checked for every protected request.
- [ ] Tenant A cannot access Tenant B records.
- [ ] A removed member loses access on the next request.
- [ ] WARP GATE authorization and audit controls integrated and tested.
- [ ] Email verification and recovery provider configured before production.

No production deployment or merge is authorized by this milestone.
