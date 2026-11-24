# COSMOS Particle Dissolve Engine — Build Milestone 2

Status: ISOLATED PROTOTYPE SOURCE COMMITTED; EXECUTABLE VALIDATION PENDING
Branch: `visual-engine/adoption-v1`
Target: `CodebruteDamage/cosmos-alien-mind`

## Delivered

### Renderer and interaction
- Added native WebGL1 shader programs for the solid mesh and particle cloud.
- Both shader passes use the same erosion field and rest-position coordinates.
- Added a React client component, `ParticleDissolveCanvas`, without adding a third-party dependency.
- Added pointer hit testing against the intact source triangles; visual fragment discard does not remove the picking geometry.
- Added surface sampling, stable seeds, adaptive particle count cap (256–12,000), brush smoothing, and exposure easing.
- Added button-operated preview, reduced-motion handling, pointer cancellation/leave, window blur, document visibility reset, and ResizeObserver sizing.
- Added static visual fallback and WebGL context-loss fallback messaging.
- Added explicit disposal for owned buffers/programs, animation frame, listeners, and observer.

### Core tests
Added a Node built-in test suite for:
- deterministic area-weighted triangle sampling;
- degenerate and invalid index handling;
- finite sample buffers and stable seeds;
- erosion, reveal, and damping behavior;
- interaction-state transitions;
- intact-mesh raycasting.

Added an `npm test` script using Node's built-in test runner and TypeScript type stripping. No test framework or renderer dependency was added.

## Important implementation boundary

The renderer is an isolated prototype, not a complete general-purpose 3D engine. It currently assumes normalized, origin-centered geometry and a fixed orthographic XY camera. It does not yet support rotating cameras/models, skinned or morphing meshes, multiple transformed meshes, textures, shadow clipping, or WebGL context restoration. The dashboard has not been changed to mount it.

## Corrections made during source review

- Expanded indexed geometry before WebGL drawArrays so triangle order matches the source index buffer.
- Ensured keyboard preview starts at a real sampled surface point rather than a centroid that may fall inside an empty region.
- Preview activation explicitly schedules the animation frame without destroying/recreating the WebGL context.
- Reduced-motion mode forces exposure to zero.
- Pointer-up now releases the brush as well as leave/cancel.

## Validation status

| Gate | Result |
|---|---|
| Source files committed and fetched back | PASS |
| Feature branch isolated from main | PASS |
| No third-party dependency added | PASS |
| Core test source added | PASS — source only |
| Node test execution | NOT RUN — connected workstation offline |
| TypeScript / Next build | NOT RUN |
| Browser WebGL interaction | NOT RUN |
| Mobile / desktop GPU benchmark | NOT RUN |
| Dashboard integration | NOT STARTED |
| Merge / deployment | NOT PERFORMED |

The connected Remote Desktop Commander workstation was offline at the time of this milestone. Therefore no test, lint, type-check, build, browser, or performance result is claimed.

## Next gates

1. Reconnect the authorized workstation and verify the repository checkout and branch.
2. Run `npm test`, lint, TypeScript checks, and Next production build.
3. Fix any compile/runtime failures.
4. Run browser tests for surface hit, empty-space miss, hole picking, stationary hover, quick exit, re-entry, reduced motion, preview, resize, context loss, and repeated mount/unmount.
5. Measure frame time and memory on desktop and mobile.
6. Integrate into the dashboard only after those gates pass.
7. Request merge approval; do not deploy automatically.

**Milestone 2 verdict:** the isolated WebGL/React prototype and core test source are committed. It is not yet verified as buildable or safe for dashboard integration.
