# COSMOS Particle Dissolve Engine v1.0

**Milestone 1 — dependency-free core foundation.** This package is isolated from the dashboard, database, model providers, and governance services.

## Implemented in this milestone

- Deterministic, area-weighted triangle sampling with barycentric placement.
- Interpolated/normalized normals and stable per-particle seeds.
- CPU reference erosion field and smooth particle reveal function.
- Frame-time-aware exponential damping.
- Explicit interaction state transitions for hit, miss, preview, reduced motion, and suspension.
- Capability manifest declaring zero permissions and zero data access.

## Deliberately not included yet

- Three.js/WebGL renderer or React canvas component.
- Runtime dependency changes.
- Browser integration, automated test harness, or device benchmarks.
- Dashboard integration, merge, or deployment.

The repository currently has no committed npm, pnpm, Yarn, or Bun lockfile, and the connected local workstation was offline at implementation time. This milestone therefore avoids guessing a package manager or silently introducing an unpinned renderer dependency.

## API

Import the pure functions from their source modules:

- `sampleSurface(geometry, count, seed)`
- `erosionField(home, brush, config)`
- `particleReveal(field, exposure, band)`
- `damp(current, target, rate, deltaSeconds)`
- `transitionInteraction(state, event)`

Sampling skips degenerate triangles and throws if no usable triangle remains. Geometry arrays use flat XYZ triples. Sampling is deterministic for a given geometry, count, and seed.

## Next gate

1. Confirm package manager and generate/commit its lockfile in an online build environment.
2. Select and pin the renderer version.
3. Add a client-only WebGL component with static fallback and full teardown.
4. Add executable unit tests and browser interaction tests.
5. Measure mobile and desktop frame time before dashboard integration.
