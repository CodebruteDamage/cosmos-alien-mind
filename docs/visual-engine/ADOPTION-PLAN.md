# COSMOS Visual Engine — Adoption Plan v1.0

Status: DESIGN / LICENSE REVIEW PASSED; IMPLEMENTATION PENDING
Target repository: CodebruteDamage/cosmos-alien-mind
Base branch: main
Working branch: visual-engine/adoption-v1

## Decision

Adopt the hover-driven particle dissolve/reassembly interaction as a standalone visual capability. Do not import the reference demo wholesale and do not couple this effect to COSMOS reasoning, memory, persistence, or governance services.

The reference skill is:
- Repository: https://github.com/MengTo/Skills
- Path: agent-skills/3d/hover-particle-dissolve
- Reference behavior: particles disperse near the actual pointer-hit region and reassemble when the pointer leaves.

## Evidence from the target repository

- The project is a Next.js 15 / React 19 application.
- The current dashboard is implemented in app/page.tsx.
- Current dependencies include Next.js, React, Neon serverless, and Zod.
- Three.js is not currently listed as a dependency.
- The README describes this as an MVP and explicitly notes that authentication, per-user isolation, live inference, and production abuse controls are not implemented.
- The target repository has no root LICENSE file. The reference repository `MengTo/Skills` has a root MIT License (Copyright (c) 2026 Meng To), verified during this review. Any copied or adapted portions must retain the copyright and permission notice.

## Adoption boundary

Create an independent visual module. The dashboard may host it through a narrow component interface. The visual module must not:
- access Neon or conversation APIs;
- read secrets or environment variables;
- invoke model providers;
- grant or evaluate application permissions;
- execute imported skill instructions as code.

WARP GATE remains the authority for any future capability registration or privileged operation. This visual effect is presentation-only.

## Proposed module layout

```text
visual-engine/
  README.md
  manifest.json
  src/
    ParticleDissolve.tsx
    particle-sampling.ts
    shaders/
      dissolve.glsl
      particles.glsl
    adapters/
      three-adapter.ts
    lifecycle/
      resource-disposal.ts
  tests/
    sampling.test.ts
    lifecycle.test.ts
    interaction.test.ts
```

This is a proposed layout, not a claim that these files already exist.

## Implementation constraints

1. Use a clean-room implementation unless the reference repository's license is verified and permits the intended reuse.
2. Keep the original mesh available as the raycast target while its visible surface dissolves.
3. Sample mesh triangles proportional to surface area and use stable per-particle seeds.
4. Use the same exposure function for the solid surface and particle visibility to avoid gaps and flicker.
5. Smooth pointer movement and exposure changes; release the active brush on pointer leave, cancellation, blur, or model change.
6. Support reduced-motion preferences and a keyboard-accessible preview control.
7. Dispose geometries, materials, buffers, observers, and animation loops on unmount.
8. Apply a configurable particle ceiling and adaptive quality settings for mobile/low-power devices.
9. Do not add a global animation loop or modify the dashboard's persistence/API behavior.

## Validation gates

- [x] Verify the reference repository's root MIT License and attribution requirements.
- [ ] Review the exact Three.js version and dependency/security implications before adding it.
- [ ] Confirm compatibility with the existing Next.js client-component boundary.
- [ ] Unit-test area-weighted sampling and barycentric placement.
- [ ] Test hit detection, empty-space movement, stationary pointer, fast exit, re-entry, and model changes.
- [ ] Verify one intact surface at rest and stable particle reconstruction.
- [ ] Verify reduced-motion and keyboard operation.
- [ ] Verify cleanup after repeated mount/unmount cycles.
- [ ] Measure frame time and memory on desktop and mobile; enforce particle limits.
- [ ] Run the repository build and lint checks.
- [ ] Obtain explicit approval before merging to main or deploying.

## Current execution state

- [x] Target repository identified from connected GitHub repositories.
- [x] Existing README, package manifest, dashboard entry point, layout, Next.js config, database schema, and ignore rules inspected.
- [x] Isolated working branch created from main.
- [x] Adoption boundary and validation plan documented.
- [x] Reference root MIT license reviewed; attribution obligation recorded.
- [ ] Implementation complete.
- [ ] Tests and build passed.
- [ ] Dashboard integration complete.
- [ ] Deployment verified.

No runtime code has been added and no deployment has been performed.
