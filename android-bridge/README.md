# COSMOS Android Bridge

The Android bridge currently supports a read-only runtime probe, authenticated outbound heartbeat, and authenticated text-only GPT requests.

## Runtime probe

```bash
node android-bridge/src/probe.mjs
```

The probe emits schema `cosmos.termux.runtime.v1`. Its subprocess calls are fixed version checks and a fixed Git status command.

## Authenticated heartbeat

See [PROVISIONING.md](./PROVISIONING.md). Heartbeat only registers operational metadata. It does not create a task queue or permit remote execution.

## GPT response from Termux

Configure `COSMOS_BRIDGE_URL` and `COSMOS_BRIDGE_TOKEN` in the Termux session, then run:

```bash
node android-bridge/src/assistant.mjs "Summarize the COSMOS runtime status"
```

The client sends a text prompt to `POST /api/runtime/respond` over HTTPS and prints the returned answer and lifecycle evidence. The OpenAI key remains on the server. The request is authenticated using the existing prototype bridge bearer secret.

## Security boundary

- No remote shell, arbitrary command execution, remote file access, package installation, or repository mutation.
- No model tool calls or MCP execution are enabled.
- The GPT endpoint returns one text response; it does not claim to execute external actions.
- The current shared bearer secret is a prototype credential, not a per-device identity system.
- Do not use the current application conversation APIs for sensitive multi-user data.

## Validation

```bash
node --test android-bridge/tests/*.test.mjs lib/runtime/tests/*.test.mjs
npm run lint
npm run build
```
