# COSMOS Android Bridge

Milestone: **COS-ANDROID-003 — Termux Runtime Probe**

This first implementation establishes a repeatable, read-only runtime inventory on an Android device running Termux.

## Run

From the repository root in Termux:

```bash
node android-bridge/src/probe.mjs
```

The probe emits JSON using schema `cosmos.termux.runtime.v1`. It reports OS/architecture, Termux prefix detection, Node version, a limited Git status check, and available storage.

## Security boundary

- The probe is local and read-only.
- It does not start a network listener.
- It does not accept remote commands.
- It does not execute arbitrary shell strings.
- Its only subprocess is a fixed `git status --short --branch` invocation when the current directory is a Git repository.
- No credentials, environment-variable values other than the Termux prefix, or file contents are uploaded.

## Bridge progression

1. Runtime discovery — this milestone.
2. Authenticated outbound device registration and heartbeat.
3. Signed task envelopes with operation allowlists and expiry.
4. Human approval for any operation that changes files, installs packages, or modifies repositories.
5. Audited result delivery and replay protection.

The future transport must be outbound-only from the phone, use TLS, bind device identity to a revocable credential, reject arbitrary shell payloads, and keep authorization separate from task planning.

## Validation

Run from the repository root:

```bash
node --test android-bridge/tests/*.test.mjs
```

Runtime output from a developer's phone is not proof that remote dispatch or end-to-end GPT connectivity is operational.
