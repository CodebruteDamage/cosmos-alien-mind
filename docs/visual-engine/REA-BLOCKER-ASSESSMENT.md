# COSMOS Visual Engine — REA Blocker Assessment v1.0

Assessment date: 2026-11-25
Target: `CodebruteDamage/cosmos-alien-mind`
Working branch: `visual-engine/adoption-v1`
Assessment mode: read-only source inspection plus documentation update

## Executive decision

**Proceed to a constrained prototype after resolving two implementation gates. Do not merge or deploy yet.**

The repository is structurally suitable for an isolated browser-only visual component: it is Next.js 15 / React 19, its current dashboard entry point is already a client component, and TypeScript strict mode is enabled. The particle effect is presentation-only and can be kept outside the Neon/API and AI-provider layers.

The largest unresolved risks are not architectural incompatibility. They are runtime dependency/SSR behavior, lack of an existing automated test harness, and absence of measured performance limits.

## Evidence inspected

- `package.json`: Next.js `^15.5.4`, React/React DOM `^19.1.1`, TypeScript `^5.9.2`; no Three.js dependency and no test script.
- `app/page.tsx`: begins with `"use client"`; dashboard already uses React hooks and browser fetch calls.
- `app/layout.tsx`: standard root layout; no existing WebGL-specific setup.
- `tsconfig.json`: strict TypeScript enabled; DOM libraries available.
- `eslint.config.mjs`: Next.js Core Web Vitals and TypeScript ESLint presets.
- `app/globals.css`: existing responsive dark visual system; no particle/canvas styles.
- `README.md`: describes an MVP and flags authentication, per-user isolation, live inference, and production abuse controls as unimplemented.
- GitHub contents lookup did not find a root `package-lock.json` or repository-root `LICENSE`; the repository's package manager/lockfile state needs confirmation in the local build environment.
- Reference `MengTo/Skills` root LICENSE was fetched and is MIT, Copyright (c) 2026 Meng To. Preserve its notice if any substantial source is copied. A clean-room implementation is still preferred.

## Blocker register

### B1 — WebGL dependency and browser-only initialization
Severity: High before code; resolvable.

Evidence: Three.js is not in `package.json`; Next.js app router can render components on the server unless the browser-only boundary is enforced.

Resolution:
- Add Three.js only to the isolated prototype branch after pinning a compatible version.
- Put WebGL initialization in a dedicated client component; if browser globals are accessed during module evaluation, load the component with a client-side dynamic import and SSR disabled from a client boundary.
- Keep the parent dashboard free of WebGL imports and preserve a static fallback.
- Confirm the selected Three.js release and package provenance before installation.

### B2 — No automated test harness
Severity: High before claiming validation; resolvable.

Evidence: `package.json` has dev/build/start/lint scripts but no test script or test runner dependency.

Resolution:
- Introduce the smallest test setup compatible with the current toolchain, or keep math/lifecycle logic framework-independent and add focused tests with a selected runner.
- Test deterministic surface sampling and brush/exposure math separately from WebGL rendering.
- Add browser interaction tests only after the minimal prototype exists.
- Do not claim tests passed until they have actually run.

### B3 — GPU and mobile performance limits are undefined
Severity: High before broad dashboard integration; resolvable through measurement.

Evidence: the reference demo's 36,000-particle example is not evidence that this dashboard/device mix can sustain that count.

Resolution:
- Start with a conservative configurable particle budget and quality tiers; do not adopt 36,000 as a default.
- Add reduced-motion support, a static fallback, resize handling, and explicit disposal of buffers/materials/renderers/observers.
- Measure frame time and memory on representative desktop and mobile devices before raising the budget.
- Avoid rendering when off-screen or when the effect is idle if the architecture permits.

### B4 — Existing dashboard and data services must remain isolated
Severity: Medium; architecture can address it.

Evidence: dashboard's current job includes Neon-backed conversation storage. The README explicitly documents unfinished authentication and abuse controls.

Resolution:
- Implement as a decorative, opt-in visual surface only.
- No calls to Neon, conversation endpoints, model providers, credentials, or authorization state from the visual module.
- Do not expand the scope into user data or permissions.
- Keep a non-WebGL fallback for unsupported devices.

### B5 — License/provenance handling
Severity: Resolved with condition.

Evidence: reference root MIT license fetched successfully.

Resolution:
- Prefer clean-room code based on the observed interaction requirements.
- If source portions are reused, retain the MIT copyright and permission notice in the distributed source/notice file.
- Recheck any separately bundled demo assets or dependencies; the root license alone does not automatically establish third-party asset licensing.

## 12-GAP mini-cycle

1. Scope: presentation-only particle dissolve capability.
2. Source: reference skill and demo inspected; root MIT license verified.
3. Target: Next.js 15 / React 19 dashboard confirmed.
4. Compatibility: client component boundary available; WebGL must remain browser-only.
5. Dependency: Three.js absent; version selection pending.
6. Data boundary: no data-service integration required.
7. Governance: no privileged action; WARP GATE only governs future registration if required.
8. Performance: particle count must be measured; reference count is not a target.
9. Accessibility: reduced motion and keyboard-operable preview required.
10. Lifecycle: explicit cleanup and context-loss handling required.
11. Validation: test runner and acceptance tests not yet present.
12. Release: isolated branch only; merge/deploy blocked pending measured validation.

## COSMAXX optimization decisions

- Implement geometry sampling and brush math as pure, testable functions.
- Use a single renderer and a single animation loop per mounted visual instance.
- Reuse typed arrays and GPU buffers; avoid per-frame object allocation.
- Make particle count and pixel ratio configurable with device-aware caps.
- Keep the original mesh as the raycast target even while its visible surface is clipped.
- Keep visual engine APIs narrow: mount, update pointer/model, set quality, dispose.
- Use static fallback and disable the effect under reduced-motion preference.

## Readiness verdict

- Repository fit: **PASS**
- Client boundary: **PASS with browser-only initialization**
- License review: **PASS with attribution condition**
- Dependency readiness: **PENDING**
- Test readiness: **PENDING**
- Performance readiness: **PENDING**
- Data/governance isolation: **PASS by design**
- Merge/deployment readiness: **NOT READY**

## Next execution sequence

1. Confirm package manager and dependency lockfile in the working environment.
2. Select and pin Three.js; add the isolated client-side visual module.
3. Add deterministic math tests and lifecycle tests.
4. Build the smallest demo surface behind a feature flag/static fallback.
5. Run lint, type-check/build, automated tests, and browser interaction checks.
6. Measure desktop/mobile performance and tune the particle budget.
7. Only then integrate into the main dashboard surface and request merge approval.

No runtime implementation, dependency change, merge, or deployment was performed as part of this REA assessment.
