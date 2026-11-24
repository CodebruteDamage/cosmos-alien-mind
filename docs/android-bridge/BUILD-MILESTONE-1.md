# COS-ANDROID-003 — Termux Runtime Probe

## Objective
Establish a repeatable, local, read-only inventory of the Android Termux runtime before enabling any remote task dispatch.

## Delivered
- `android-bridge/src/probe.mjs`: reports a versioned JSON runtime record.
- `android-bridge/tests/probe.test.mjs`: checks the report schema and required fields.
- `android-bridge/README.md`: documents execution and security boundaries.

## Evidence
- User-provided Termux screenshots show Android ARM64, Node.js v24.22.3, npm 12.2.3, Python 3.14.10, and Git 2.56.1.
- GitHub compare confirms this branch is 4 commits ahead of `main`, 0 behind.
- Files are committed to `cosmos/android-bridge-v1`.
- The probe and tests have not yet been executed on the user's phone. No runtime pass is claimed.

## Security boundary
This milestone performs local inspection only. It opens no network listener, accepts no remote task, uploads no telemetry, and does not execute arbitrary shell input. Its subprocess calls are fixed version checks and a fixed Git status command.

## Acceptance criteria
1. User can run the probe from the repository root in Termux.
2. JSON output identifies schema `cosmos.termux.runtime.v1`.
3. Node test runner passes the probe schema test.
4. Repository status is reported without modifying files.

## Deferred
Authenticated device registration, outbound task polling, signed task envelopes, operation allowlists, approval workflow, audit transport, and GPT end-to-end connectivity remain future milestones.
