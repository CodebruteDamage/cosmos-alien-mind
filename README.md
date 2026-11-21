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

## Webhook security and worker foundation (branch-only)

The `feat/cosmos-webhook-gap-closure` branch contains a disabled-by-default
webhook ingress with per-integration identity, tenant-bound event policy, HMAC
verification, and ingress-time WARP GATE evaluation. The callable DB-backed
worker runtime re-resolves current policy, repeats authorization immediately
before dispatch, checks for an explicitly registered operation handler, writes
dispatch-stage audit records, and uses the event ID as an idempotency key.
Queue primitives provide bounded claims, lease recovery, retries, and
dead-letter transitions.

This is not a scheduled or deployed worker. No production handler registry or
trusted human-approval service is configured. SQL migrations remain unapplied,
no integration is enabled, and database-enforced audit immutability, secret
rotation/revocation, rate limiting, retention, replay controls, and operational
monitoring remain open gates. No deployment or production endpoint activation
is authorized by this branch.
