# COSMOS Visual Engine — Reverse Engineering Dossier v1.0

Status: STATIC SOURCE ANALYSIS COMPLETE; PORT/PROTOTYPE NOT IMPLEMENTED
Target: `CodebruteDamage/cosmos-alien-mind`
Working branch: `visual-engine/adoption-v1`

## 1. Scope and source boundary

This dossier reverse-engineers the supplied MengTo skill package for the hover-driven 3D particle dissolve interaction. It covers the skill specification, demo prompt, and demo HTML/JavaScript. It does not claim to reverse-engineer the full Saltmere product or the entire MengTo Skills repository.

Reference files:
- Skill: https://github.com/MengTo/Skills/blob/main/agent-skills/3d/hover-particle-dissolve/SKILL.md
- Demo prompt: https://github.com/MengTo/Skills/blob/main/agent-skills/3d/hover-particle-dissolve/demo/PROMPT.md
- Demo implementation: https://github.com/MengTo/Skills/blob/main/agent-skills/3d/hover-particle-dissolve/demo/index.html
- Repository license: https://github.com/MengTo/Skills/blob/main/LICENSE

The repository root license is MIT, Copyright (c) 2026 Meng To. Preserve the copyright and permission notice if any substantial source is reused. The preferred COSMOS route is a clean-room implementation of the documented behavior, with provenance recorded.

## 2. What the capability actually does

The object is represented simultaneously as:
1. A conventional shaded triangle mesh (the visual surface and persistent pointer-hit target).
2. A point cloud whose points are sampled from that mesh's original surface.

A pointer hit creates a brush location in mesh-local coordinates. A scalar exposure value grows while the pointer remains on the object. The mesh shader hides fragments in the brush region; the point shader reveals and displaces points from the same region. On pointer exit, the exposure scalar decays and the points return to their original positions while the solid mesh reappears.

The key invariant is that the mesh used for raycasting is never removed or replaced by the visible dissolve. The visual surface changes, but the picking surface remains intact. This is what allows the user to move through a region that appears visually empty without losing the interaction target.

## 3. Component and data-flow model

```text
Pointer / keyboard preview
          |
          v
   Input event handlers
          |
          v
   Raycaster against intact mesh
          |
          v
  World hit -> mesh-local brush
          |
          v
  Smoothed brush + exposure state
          |
          +-------------------------------+
          |                               |
          v                               v
   Solid mesh shader                Particle shader
   erosion(home)                    erosion(home)
   discard exposed                  reveal exposed
          |                               |
          v                               v
   Remaining surface             Displaced grains
          |                               |
          +---------------+---------------+
                          |
                          v
                    WebGL renderer
```

Static data:
- Original indexed geometry and vertex positions.
- Vertex normals.
- Per-particle rest positions.
- Per-particle interpolated normals.
- Per-particle deterministic seed.
- Cumulative triangle-area lookup table.

Dynamic data:
- Brush position.
- Exposure amount.
- Animation clock.
- Point-size / pixel-ratio density.
- Active pointer and preview flags.
- Viewport/camera dimensions.

## 4. Geometry sampling algorithm

The demo uses a torus-knot geometry. It assumes an indexed triangle mesh.

1. Iterate each triangle and calculate its surface area.
2. Build a cumulative sum of triangle areas.
3. Generate a deterministic pseudo-random value and select a triangle by binary search in the cumulative table. This makes selection probability proportional to triangle area.
4. Generate two uniform random values. Let (u=sqrt{r_1}) and (v=r_2).
5. Use barycentric weights:
   - (w_0=1-u)
   - (w_1=u(1-v))
   - (w_2=uv)
6. Interpolate the triangle's vertex positions and normals with those weights.
7. Save the result as a particle's immutable rest position, rest normal, and seed.

The square-root transform is what makes samples uniform over triangle area rather than clustering toward a vertex. The skill's guidance also requires UV/color interpolation for textured assets; the demo does not implement those attributes.

The sample count in the demo is 36,000. This is an example for its torus-knot scene, not a safe default for COSMOS or mobile devices.

## 5. Shared erosion field

Both materials evaluate the same spatial field at the particle/mesh rest position. In the demo, the field combines:
- Distance from the rest position to the brush.
- Small sinusoidal spatial variation that breaks up a perfectly circular edge.
- A clamped threshold value.

The solid fragment shader discards fragments whose erosion value falls below the current exposure amount.

The point shader compares the same erosion value with the exposure amount and uses a smooth transition band to fade points in. Using the same field is essential: if the mesh and particles use different thresholds, visible holes, doubled surfaces, or flicker can occur.

The demo's point shader also uses a seed-dependent spread tier:
- About 65% of points stay close to the original surface.
- About 26% move a moderate distance.
- About 9% move farther away.

A slow time-varying flow and a small normal-directed offset create motion. The displacement is multiplied by the point's exposure so the rest position is recovered when the effect resets.

## 6. Animation and input state machine

Conceptual states:
- REST: exposure is zero; solid visible; point cloud hidden.
- BRUSHING: a real raycast hit exists; brush follows the hit after smoothing; exposure approaches one.
- RELEASING: pointer no longer hits; exposure decays; points return and solid is restored.
- PREVIEW: keyboard/button preview uses a known surface point without a pointer hit.
- REDUCED_MOTION: animation is disabled and the intact model remains visible.
- SUSPENDED: document is hidden or window loses focus; active interaction is reset.

The demo smooths brush movement with an exponential interpolation factor based on a rate near 16 per second. Exposure rises at approximately 8 per second and falls at approximately 3.5 per second using a frame-time-aware damping function. The skill text recommends roughly 7–8 per second on exposure-up and 3–4 per second on exposure-down.

Frame scheduling is demand-driven: an animation frame is requested while the effect is active or while exposure is still returning to zero. This avoids an always-running render loop while idle.

## 7. Coordinate spaces and picking

The demo raycasts the original mesh. A successful world-space intersection is transformed back into mesh-local space before being assigned to the brush. Particle home positions are also stored in the mesh's local geometry coordinate space. This makes the comparison coherent for a rigid mesh under a parent pivot transform.

For multiple meshes, instancing, skinned meshes, or morph targets, a production implementation must explicitly define a common particle-home coordinate system and update sampled positions/normals to match the current pose. The demo does not implement those advanced cases.

The skill specification calls for re-running picking if the camera or model moves beneath a stationary pointer. The supplied demo is a static-camera/static-model study and does not fully demonstrate that behavior.

## 8. Rendering details

- One WebGL renderer and one scene.
- Perspective camera.
- A shader-driven solid surface.
- A shader-driven point cloud.
- Point depth testing remains enabled; depth writes are disabled for the transparent point material.
- Soft circular point sprites and color variation by seed.
- A radial scene background and responsive canvas.
- Device pixel ratio is capped at 2 in the demo.
- The canvas retains vertical page scrolling on touch via `touch-action: pan-y`.

The demo does not implement texture/UV color transfer, a shadow-caster clipping pass, multiple mesh aggregation, skinning, morphing, or a general-purpose asset loader.

## 9. Accessibility and resilience behavior present in source

Present:
- A button with `aria-pressed` for preview state.
- Visible focus styling for the button.
- Reduced-motion media query and runtime preference check.
- Preview disabled under reduced-motion.
- Canvas has a role and descriptive accessible label.
- Window blur and document visibility changes reset the interaction.
- Pointer leave/cancel releases the brush.
- ResizeObserver updates renderer size and camera aspect.
- A catch block disables the preview and changes the caption when WebGL setup fails.

Not fully implemented:
- A static visual fallback when WebGL is unavailable.
- Explicit WebGL context-lost/context-restored recovery.
- Complete teardown of observers, event listeners, frame callbacks, renderer, geometry, and materials.
- A reusable component mount/unmount API.
- Automated tests.

## 10. Source-level defects and adaptation risks

These are observations about the supplied demo, not claims that the underlying technique is defective.

1. **Lifecycle cleanup is missing.** The demo is a standalone page and does not expose a teardown function. A React component must cancel pending animation frames, remove every listener, disconnect ResizeObserver, and dispose renderer, geometries, and materials.
2. **ResizeObserver ownership is not retained.** It cannot be explicitly disconnected during component unmount in the current demo.
3. **WebGL context loss is not handled.** Production UI should handle `webglcontextlost` and restoration or show a stable fallback.
4. **Preview and pointer activity can overlap.** The preview toggle does not explicitly clear the active pointer state; the integrated component should define precedence and button state consistently.
5. **No dynamic-camera pointer refresh.** The skill requires stationary-pointer repicking when camera/model transforms change; the static demo does not provide this.
6. **Hard-coded 36,000 samples.** Use configurable budgets and device-quality tiers, validated by measurement.
7. **No automated test suite.** Geometry sampling, coordinate transforms, exposure field, state transitions, and lifecycle behavior need independent tests.
8. **No performance instrumentation.** The demo has no frame-time, GPU-memory, or device-tier reporting.
9. **Fallback is incomplete.** The catch block updates UI but does not provide a static model rendering.
10. **No pointer capture policy.** Pointer cancellation is handled, but a reusable component needs explicit decisions for touch, pointer capture, and page scrolling.
11. **No advanced geometry support.** Multiple meshes, instance transforms, UV/color sampling, skinning, morph targets, and shadow clipping are described as adaptation concerns rather than solved by the sample.
12. **No security or data layer is needed.** The effect should not be allowed to access COSMOS conversation APIs, Neon, provider credentials, or governance state.

## 11. COSMOS implementation architecture

Recommended module boundary:

```text
visual-engine/
  manifest.json
  README.md
  src/
    components/
      ParticleDissolveCanvas.tsx
      StaticVisualFallback.tsx
    core/
      create-scene.ts
      interaction-controller.ts
      render-loop.ts
    geometry/
      build-area-table.ts
      sample-surface.ts
      transform-samples.ts
    shaders/
      solid-dissolve.ts
      particle-cloud.ts
    lifecycle/
      dispose-scene.ts
      webgl-recovery.ts
    quality/
      quality-profile.ts
      performance-monitor.ts
    tests/
      sampling.test.ts
      exposure.test.ts
      interaction.test.ts
      lifecycle.test.ts
```

Public component contract should remain narrow:
- Inputs: model/geometry, enabled flag, quality profile, reduced-motion state, preview request.
- Outputs: lifecycle/error/performance events only; no user conversation or provider payloads.
- Operations: mount, resize, update model/camera, update pointer, preview, set quality, dispose.

The module should be imported only through a client-side boundary. Browser globals must not be accessed during server module evaluation.

## 12. COSMOS 12-GAP assessment

1. Capability intent: understood.
2. Reference provenance: identified.
3. License: MIT verified; retain notice for reused source.
4. Geometry model: understood for indexed rigid mesh.
5. Sampling: algorithm understood; needs unit tests.
6. Coordinate system: rigid single-mesh case understood; advanced cases out of scope.
7. Shader handoff: shared erosion field understood.
8. Interaction: state model understood; precedence needs implementation.
9. Accessibility: partial support exists; fallback needs work.
10. Lifecycle: important gaps identified.
11. Performance: no evidence yet; benchmark required.
12. Integration/release: isolated branch only; no merge or deploy.

## 13. COSMAXX optimization recommendations

- Use a worker for CPU-heavy area-table/sample generation only if profiling shows main-thread stalls; do not add worker complexity prematurely.
- Build area tables once per geometry revision and cache by geometry identity/version.
- Keep particle home positions and seeds immutable; update only dynamic uniforms.
- Reuse typed arrays and GPU buffers; avoid allocating vectors/arrays in each frame.
- Use one render loop per component and render only while active or recovering.
- Adapt particle count, pixel ratio, and point size by measured device capability.
- Support static fallback and reduced motion.
- Separate pure math from Three.js scene orchestration so tests run without WebGL.
- Keep the module independent of COSMOS data and policy services.

## 14. Acceptance criteria before integration

- Stable area-uniform sampling with deterministic seed tests.
- Mesh and particle passes use identical erosion function/coordinate inputs.
- Intact picking target works through full dissolve.
- Correct behavior for hit, empty space, hole, stationary hover, quick exit, re-entry, and model/camera movement.
- Reassembly returns every point to its original position.
- No duplicate animation loops or leaked listeners/observers/GPU resources after repeated mount/unmount.
- Reduced-motion and keyboard preview work.
- WebGL failure/context loss produces a safe fallback.
- Desktop and mobile performance measured against explicit frame-time and particle budgets.
- Lint, type-check, build, unit, and browser tests pass.

## 15. Current status

Completed:
- Source files fetched and reviewed.
- Geometry sampling and shader handoff analyzed.
- Interaction state machine reconstructed.
- Coordinate-space assumptions documented.
- Accessibility and lifecycle behavior inspected.
- Source limitations and integration risks recorded.
- Reference MIT license verified.

Not completed:
- Runtime code implementation.
- Three.js version selection and dependency install.
- Automated tests.
- Browser execution or performance measurement.
- Dashboard integration.
- Merge or deployment.

**Verdict:** the reference interaction is sufficiently understood to implement a clean, isolated COSMOS version. The source demo should be treated as a behavioral reference, not production-ready code to transplant wholesale.
