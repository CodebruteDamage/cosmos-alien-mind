# Cosmos Alien Mind

Responsive Next.js MVP foundation for the Cosmos AI personal assistant dashboard.

## Current functionality

- Cosmic dark dashboard, responsive for desktop and mobile.
- Server-side Neon Postgres client using `DATABASE_URL`.
- Database health endpoint: `GET /api/health`.
- Conversation persistence endpoints: `GET /api/conversations` and `POST /api/conversations`.
- Input validation and generic public-facing database errors.
- No API keys or database credentials are committed.

**Not implemented yet:** live AI/model inference, user authentication, per-user conversation isolation, and production abuse controls. Do not treat this as a production-ready multi-user service until these are implemented.

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `DATABASE_URL` to the Neon connection string in `.env.local`. Keep it server-only; never use a `NEXT_PUBLIC_` prefix.
5. In the intended Neon database, run the SQL in `db/schema.sql`.
6. Start the app: `npm run dev`.
7. Check `http://localhost:3000/api/health`. A successful result should report `"database":"connected"`.
8. Submit a prompt on the dashboard and confirm it appears in the memory log.

## Neon schema

The application schema creates `conversations` and `messages` tables with UUID keys, constraints, foreign-key cascade deletion, and lookup indexes. Apply it only to the intended project/database.

## Deploy

Import this repository into Vercel (or connect it to the existing Cosmos deployment only after verifying the intended project). Configure `DATABASE_URL` in the hosting provider's server-side environment settings for each environment, then redeploy. Do not paste secrets into GitHub, source code, screenshots, or chat.

## Security notes

- The main MVP does not yet authenticate users. Do not store sensitive/private conversations or expose the public write endpoint as a production service until authentication, authorization, rate limiting, and abuse protection are added.
- The health route returns only generic failure status; it does not expose credentials.
- Real AI inference should be added as a server-side provider adapter with secret keys held only in server environment variables.

## Webhook security foundation (branch-only)

The `feat/cosmos-webhook-gap-closure` branch contains a disabled-by-default
webhook ingress with per-integration key-ID lookup, server-side secret references,
tenant assignment from a trusted registry, event-to-operation policy mapping,
HMAC verification, and WARP GATE policy-evaluator checks. Authorization decisions
are recorded in a dedicated audit table. Inbox queue primitives provide bounded
claims, lease recovery, retries, and dead-letter state.

This remains a security foundation, not a complete production webhook service.
The SQL migrations are not applied, no integration is enabled, and there is no
scheduled worker or downstream execution adapter. Trusted human approval,
secret rotation/revocation, rate limiting, database-enforced audit immutability,
retention, and operational recovery remain open gates. No deployment or
production endpoint activation is authorized by this branch.
