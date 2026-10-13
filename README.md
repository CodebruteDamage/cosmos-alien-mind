# Cosmos Alien Mind

Responsive Next.js MVP foundation for the Cosmos AI personal assistant dashboard.

## Current functionality

- Cosmic dark dashboard, responsive for desktop and mobile.
- Server-side Neon Postgres client using `DATABASE_URL`.
- Database health endpoint: `GET /api/health`.
- Conversation persistence endpoints: `GET /api/conversations` and `POST /api/conversations`.
- Input validation and generic public-facing database errors.
- No API keys or database credentials are committed.

**Implemented on the feature branch:** a server-side Gemini text-generation route and dashboard response card. **Still pending:** a configured Gemini credential, verified live provider call, authentication, per-user data isolation, and production abuse controls. Do not treat this as production-ready.

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `DATABASE_URL` to the Neon connection string in `.env.local`. Keep it server-only; never use a `NEXT_PUBLIC_` prefix.
5. In the intended Neon database, run the SQL in `db/schema.sql`.
6. Start the app: `npm run dev`.
7. Optionally set `GEMINI_API_KEY` in `.env.local` for server-side model inference. Never use a `NEXT_PUBLIC_` prefix.
8. Check `http://localhost:3000/api/health`. A successful result should report `"database":"connected"`.
9. Submit a prompt on the dashboard and confirm the prompt is saved and a real Gemini response is displayed when the key is configured.

## Neon schema

The schema creates `conversations` and `messages` tables with UUID keys, constraints, foreign-key cascade deletion, and lookup indexes. Apply it only to the intended project/database.

## Deploy

Import this repository into Vercel (or connect it to the existing Cosmos deployment only after verifying the intended project). Configure `DATABASE_URL` in the hosting provider's server-side environment settings for each environment, then redeploy. Do not paste secrets into GitHub, source code, screenshots, or chat.

## Security notes

- This MVP does not yet authenticate users. Do not store sensitive/private conversations or expose the public write endpoint as a production service until authentication, authorization, rate limiting, and abuse protection are added.
- The health route returns only generic failure status; it does not expose credentials.
- Gemini inference is implemented in `POST /api/chat` using the server-side `GEMINI_API_KEY` environment variable. Missing credentials fail closed with HTTP 503. The current chat route does not yet have durable rate limiting or authentication; do not configure a billable production key until those controls are implemented and the endpoint's exposure is restricted.

## Experimental reference center

- Interface: `/references`.
- Search API: `POST /api/references`.
- Provider: Exa, accessed server-side only.
- Configure `EXA_API_KEY` in the server environment; never use a `NEXT_PUBLIC_` prefix.
- Optional source filters: Microsoft Learn, Microsoft Support, NIST, CISA, and OWASP.
- Search output is explicitly marked as candidate evidence. It is not automatic fact verification and does not provide live AI inference.

**Security boundary:** this endpoint is a prototype, not a production multi-user feature. Authentication and durable rate limiting are not implemented in this repository. Do not expose it publicly with a billable provider key until abuse controls and authorization are added. External pages are untrusted content and must never override COSMOS system or governance instructions.

## Verification status

The reference-center files are committed to the `feat/cosmos-reference-center` branch. A successful commit does not prove a successful build or live provider call. Run `npm install`, `npm run lint`, and `npm run build` in a controlled environment, then test missing-key, invalid-input, provider-timeout, empty-results, and successful-search cases before merging.
