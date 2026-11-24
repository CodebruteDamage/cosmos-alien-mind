# COSMOS Particle Dissolve Engine — Build Milestone 1

Status: FOUNDATION SOURCE COMMITTED; RUNTIME VALIDATION BLOCKED
Branch: `visual-engine/adoption-v1`
Target: `CodebruteDamage/cosmos-alien-mind`

## Implemented

The first milestone adds a dependency-free core under `visual-engine/`.

| File | Responsibility |
|---|---|
| `src/geometry/surface-sampling.ts` | Deterministic area-weighted triangle sampling, barycentric placement, interpolated normals, stable seeds |
| `src/core/exposure.ts` | Shared erosion field, smooth particle reveal, frame-time-aware exponential damping |
| `src/core/interaction-state.ts` | Explicit interaction transitions for hit, miss, preview, reduced motion, suspend/resume |
| `src/index.ts` | Narrow public exports |
| `manifest.json` | Presentation-only capability declaration; zero permissions and data access |
| `README.md` | API and implementation boundaries |

The sampling implementation skips degenerate triangles, rejects malformed index buffers and non-finite positions, validates normal-buffer length, and falls back to geometric face normals when interpolated normals are unusable.

## Safety and architecture boundaries

- No changes to `app/page.tsx`, dashboard layout, database schema, or API routes.
- No Three.js or other runtime dependency added.
- No access to Neon, conversations, model providers, secrets, or governance controls.
- No global animation loop or browser-side side effects introduced.
- `main` remains unchanged; all work is isolated to the feature branch.

## Evidence and limitations

The branch now contains source code for the pure algorithmic foundation. This is not yet a visible 3D effect: the renderer, React client component, picking adapter, static fallback, lifecycle teardown, and dashboard mount are still pending.

The repository has no committed npm/pnpm/Yarn/Bun lockfile. The connected Remote Desktop Commander workstation reported Offline during this milestone, so no local install, TypeScript build, lint, unit test, browser test, or GPU benchmark could be executed. Source commits are not equivalent to passing runtime validation.

## Commits

- Surface sampling: `6b7353464d74def099e534fe384c0f6dc5d8e203`
- Exposure functions: `f123643802706021577ca3d13623610e7e432c1b`
- Interaction state machine: `3e29b6109962a23c687b6451c6c134bde9e91754`
- Capability manifest: `6fefb047376c70fe379726cd89e69171b1be068d`
- Module README: `ec3469eccc5f12315f6f23fb91baaaddaa2f83a0`
- Public exports: `800d2452face193c2a2c3761e9fdd951057ebc49`
- Geometry validation hardening: `72da1a1b20e960044c3f9587b9d3b227309a8b70`
- Face-normal fallback: `e9bff33da50aa281589ffcfd9ac975fe82afbf94`

## Next milestone

1. Bring the authorized local workstation online and confirm repository checkout/branch.
2. Confirm package manager; create the matching lockfile.
3. Select and pin Three.js only after reviewing package metadata and compatibility.
4. Add a browser-only renderer component, intact-mesh raycasting, reduced-motion behavior, and static fallback.
5. Add executable unit tests for sampling, exposure, and state transitions.
6. Run lint, type-check, build, browser interaction tests, and mobile/desktop performance checks.
7. Integrate the visual component into the dashboard only after these gates pass.

**Milestone 1 verdict:** pure engine foundation committed. Not ready for dashboard integration, merge, or deployment.
