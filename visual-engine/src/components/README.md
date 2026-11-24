# Browser component

ParticleDissolveCanvas is a client-only WebGL1 component. Import its stylesheet from the consuming UI:

    import "visual-engine/src/components/particle-dissolve.css";
    import { ParticleDissolveCanvas } from "visual-engine/src/components";

Pass a non-indexed or indexed triangle geometry in flat XYZ arrays. Coordinates should be normalized to a roughly unit-sized, origin-centered object. The first renderer iteration uses a fixed orthographic XY camera and raycasts the intact source triangles; it does not yet support model rotation, skinned meshes, morph targets, multiple mesh transforms, textures, or shadows.

Particle budget is clamped to 256–12,000 and defaults to 4,000. The component owns its WebGL buffers, programs, event listeners, ResizeObserver, and animation frame; it releases them on unmount. WebGL context loss displays a static fallback and asks the user to reload the visual.
