# COSMOS Particle Dissolve Engine v1.0

**Status: isolated browser prototype source committed; runtime validation pending.**

## Implemented

- Deterministic, area-weighted triangle sampling with barycentric placement.
- Interpolated/normalized normals and stable per-particle seeds.
- CPU reference erosion field, smooth particle reveal, and frame-time-aware damping.
- Explicit interaction state transitions for hit, miss, preview, reduced motion, and suspension.
- WebGL1 shaders for the solid mesh and matching particle cloud.
- Browser-only React component with intact-source-mesh pointer raycasting.
- Static visual fallback, reduced-motion handling, keyboard-operated preview, visibility/blur handling, and WebGL context-loss fallback.
- Resource ownership and cleanup for buffers, programs, animation frames, event listeners, and ResizeObserver.
- Capability manifest declaring zero permissions and zero data access.
- Dependency-free Node test suite for pure geometry, math, state, and raycast behavior.

## API

Import the component and stylesheet:

    import "visual-engine/src/components/particle-dissolve.css";
    import { ParticleDissolveCanvas } from "visual-engine/src/components";

The component accepts indexed or non-indexed flat XYZ triangle geometry. Geometry should be normalized and origin-centered. Default particle count is 4,000, clamped between 256 and 12,000.

Pure functions:
- sampleSurface(geometry, count, seed)
- erosionField(home, brush, config)
- particleReveal(field, exposure, band)
- damp(current, target, rate, deltaSeconds)
- transitionInteraction(state, event)
- raycastSurfaceXY(geometry, x, y)

## Current renderer limitations

The initial renderer uses a fixed orthographic XY view and no external renderer dependency. It does not yet support model rotation, skinned meshes, morph targets, multiple mesh transforms, textures, shadow clipping, camera animation, or context restoration without remount/reload. The caller must supply a normalized mesh geometry. The CSS is imported by the consuming component/app.

## Test command

Node.js 22.18+ / 24+:

    npm test

The test command uses Node's built-in test runner and TypeScript type stripping. Browser/WebGL tests and device performance tests remain separate release gates.

## Integration boundary

This module does not access Neon, conversations, provider credentials, secrets, or governance controls. It is not mounted in the dashboard yet. No runtime dependency was added. No merge or deployment has occurred.
