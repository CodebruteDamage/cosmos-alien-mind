# COS-ANDROID-004 — Authenticated Heartbeat Integration

## Delivered
- Server-side bearer-token validation in `lib/bridge-auth.ts`.
- Strictly validated POST endpoint at `/api/bridge/heartbeat`.
- Neon device registry migration at `db/migrations/20261125_android_bridge_devices.sql`.
- Outbound Termux heartbeat client at `android-bridge/src/heartbeat.mjs`.
- Provisioning instructions in `android-bridge/PROVISIONING.md`.

## Security boundary
This milestone provisions heartbeat only. It does not implement a task queue, shell execution, remote file access, or autonomous changes. The shared bearer secret is server-side and must not be committed or sent through chat. The Termux client requires HTTPS except localhost development.

## Existing runtime evidence
The user-provided Termux screenshot shows:
- Android ARM64.
- Node.js v24.22.3.
- npm 12.2.3.
- Python 3.14.10.
- Git 2.56.1.
- Runtime probe output with `isTermux: true`.
- Node test runner: 1 test, 1 pass, 0 failures.

## Not yet verified
- Neon migration has not been applied.
- `BRIDGE_SHARED_SECRET` has not been provisioned in hosting.
- Application branch has not been deployed.
- Termux heartbeat has not been sent.
- HTTP 401 negative test and database row verification remain pending.

## Acceptance criteria
1. Deploy preview over HTTPS with server-side environment variables.
2. Apply the migration to the intended Neon database.
3. Send heartbeat from Termux and receive `ok: true`.
4. Confirm missing/invalid bearer token returns HTTP 401.
5. Verify only the expected operational metadata is stored.

## Deferred
Per-device credentials and revocation, rate limiting, signed task envelopes, approval workflow, replay protection, task dispatch, and GPT execution integration remain separate milestones.
