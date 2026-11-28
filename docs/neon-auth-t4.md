# COSMOS Neon Auth Integration — T4

Status: isolated implementation branch. Neon Auth has been provisioned on
the dedicated Neon preview branch. No production migration, deployment, or
branch merge has been performed.

## Provider and runtime

- Managed provider: Neon Auth, provisioned with the Better Auth-compatible
  Neon Auth backend.
- SDK: `@neondatabase/auth@0.7.0-beta`, pinned to avoid silent beta upgrades.
- Framework: Next.js 16, upgraded from Next.js 15 because the current Neon Auth
  Next.js adapter declares a Next.js 16 peer requirement.
- Browser requests are proxied through `/api/auth/*`; the upstream Auth URL
  remains server-side.
- `proxy.ts` protects application pages. API routes enforce their own
  authentication and authorization boundaries.

## Neon preview target

- Project: `Cosmos Cloud B one`
- Branch: `cosmos-neon-auth-preview`
- Branch ID: `br-gentle-union-b391p0wf`
- Database: `neondb`
- Auth schema: `neon_auth`
- Auth provider: `better_auth`
- Auth base URL:
  `https://ep-mute-butterfly-b3mcljt7.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth`

The production branch and the existing Android bridge preview branch were
not modified. The Android bridge preview contains different tables and is
not used by this app.

## Local environment

Set these server-only variables in `.env.local`:

- `DATABASE_URL`: connection string for the dedicated preview branch.
- `NEON_AUTH_BASE_URL`: the Auth base URL above.
- `NEON_AUTH_COOKIE_SECRET`: generate locally with
  `openssl rand -base64 32`.

Never commit `.env.local`, database credentials, or cookie secrets. Do not
expose these values with a `NEXT_PUBLIC_` prefix.

## Identity boundary

- Server-side Neon Auth session validation supplies the user identity.
- Active organization membership is re-checked for each protected conversation
  API request.
- Tenant identity is taken only from the verified session's
  `activeOrganizationId`.
- Request headers, query parameters, and JSON payloads cannot set tenant or
  owner identity.
- WARP GATE remains the independent authority for COSMOS permissions and
  capability grants. Authentication does not grant scopes.

## Current Auth settings and limitations

- Email/password sign-up is enabled on this preview instance.
- Email verification is currently disabled; accounts must not be represented as
  verified.
- Localhost access is enabled. No deployed application origin has been added.
- The SDK is beta and the Next.js adapter requires Next.js 16.
- WARP GATE policy enforcement, audit logging, abuse/rate-limit controls, and
  end-to-end tenant-isolation tests remain required before production.

## Acceptance evidence required

- [ ] Install dependencies and generate a lockfile in Termux.
- [ ] Lint, unit tests, typecheck, and production build pass.
- [ ] Sign-up, sign-in, sign-out, and session refresh pass against the preview.
- [ ] Requests without a session are rejected.
- [ ] Requests without active organization membership are rejected.
- [ ] Tenant A cannot read Tenant B conversations.
- [ ] WARP GATE authorization and audit tests pass.
- [ ] Email verification and recovery policy are configured before production.
- [ ] Human review approves the security diff before merge.

No production deployment or merge is authorized by this milestone.
