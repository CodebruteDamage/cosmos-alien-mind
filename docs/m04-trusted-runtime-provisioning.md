# M04 — Trusted Runtime Provisioning Gate

## Status
Implementation package on `cosmos/m04-trusted-runtime-provisioning-v1`, based on M03 PR #19. This is a readiness gate, not a production host integration.

## Implemented
- Defines six required trusted host dependencies: authenticated identity, grant verifier, atomic nonce store, approval store, durable audit sink, and trusted provider registry.
- Requires each adapter to return a time-bounded attestation with implementation identity, environment, evidence reference, and required capabilities.
- Runs adapter health checks with bounded timeouts and cancellation signals.
- Blocks missing, unhealthy, expired, mismatched-environment, incomplete-capability, and timed-out dependencies.
- Returns `ready_for_review` only when all six dependencies pass. It always returns `productionActivationAllowed: false`.

## Security boundary
This code does not implement cryptography, identity, nonce persistence, approval storage, audit durability, provider registration, credentials, or infrastructure provisioning. Those must be implemented by trusted host services and independently reviewed. Test adapters are fakes and are not production evidence.

A readiness pass is not an execution grant, merge approval, deployment approval, or permission to dispatch work. No secrets are requested or stored by this package.

## Validation
Five tests cover a complete attested set, missing dependency, expired/incomplete attestation, unhealthy/mismatched environment, and timeout. CI remains the authoritative build/test result.
