# COSMOS Android Bridge — Provisioning

This integration milestone provisions **device heartbeat only**. It does not enable remote shell, command dispatch, file access, or unattended changes.

## 1. Server prerequisites

- Deploy the application over HTTPS.
- Configure server-side `DATABASE_URL`.
- Generate a random secret of at least 32 characters and configure it as server-side `BRIDGE_SHARED_SECRET`.
- Apply `db/migrations/20261125_android_bridge_devices.sql` to the intended Neon database.
- Keep the secret out of Git, screenshots, chat, and client-visible `NEXT_PUBLIC_*` variables.

Generate a secret locally in Termux:

```bash
openssl rand -hex 32
```

Copy it directly into the hosting provider's server-side environment settings. Do not send it to ChatGPT.

## 2. Termux client configuration

From the repository root:

```bash
export COSMOS_BRIDGE_URL="https://YOUR-DEPLOYED-HOST"
export COSMOS_BRIDGE_DEVICE_ID="termux-android-primary"
read -s -p "Bridge token: " COSMOS_BRIDGE_TOKEN
echo
export COSMOS_BRIDGE_TOKEN
node android-bridge/src/heartbeat.mjs
unset COSMOS_BRIDGE_TOKEN
```

Use the real deployment hostname. The client rejects non-HTTPS URLs except localhost development.

## 3. Expected response

A successful response reports `ok: true`, the registered device ID, a server receipt timestamp, and the capability `heartbeat`.

## 4. Security model and limitations

- One shared bearer secret authenticates this initial private prototype. Rotate it immediately if exposed.
- The endpoint uses constant-time token comparison and strict payload validation.
- The server stores only device ID, platform, architecture, runtime versions, and last-seen timestamp.
- No task queue or remote command execution exists in this milestone.
- The endpoint must not be considered production-ready for multiple users until per-device credentials, revocation, rate limiting, audit retention, and stronger identity are implemented.
- Existing application conversation APIs are not authenticated. Do not treat the current application as a secure multi-user control plane.

## 5. Verification

1. Apply the migration.
2. Configure server environment variables.
3. Deploy the branch to a non-production preview.
4. Send one heartbeat from Termux.
5. Confirm the response and the row in `bridge_devices`.
6. Confirm a request without a token returns HTTP 401.

Do not enable remote task execution until authentication, authorization, approval, replay protection, and audit controls are independently reviewed.
