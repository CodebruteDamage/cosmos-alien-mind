# COSMOS INSPECTOR v1.2 — Shaped Discovery Core

Definition: governed read-only discovery with strict authorization, explicit completeness, source provenance and deterministic failure dispositions.

Adapter contract: listFiles receives target, include/exclude scope, READ_ONLY mode, maxFiles and AbortSignal. It returns complete=true, sourceId, sourceRevision and entries [{path,content,isSymlink?}]. Adapter MUST enforce realpath containment, refuse symlink traversal, honor cancellation, avoid writes and identify exact source revision. The core cannot prove adapter filesystem behavior.

Authorization must verify exact target, include/exclude scope, permitted profile and mandatory expiry. A reference string alone is not authorization. Integrated deployment requires WARP GATE. This milestone does not implement WARP GATE, authentication, a real GitHub adapter, persistence, secret redaction or source authenticity verification.

Tests cover scoped inventory, traversal, missing verifier, exact exclusions, profile/expiry, incomplete inventory, symlink flags, timeout cancellation and report disposition. Runtime execution and independent security review remain required before VERIFIED or production use.
