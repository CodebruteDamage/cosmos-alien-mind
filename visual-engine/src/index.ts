export { sampleSurface } from "./geometry/surface-sampling";
export type { SurfaceGeometry, SurfaceSamples } from "./geometry/surface-sampling";
export { damp, erosionField, particleReveal, smoothstep } from "./core/exposure";
export type { ExposureConfig, Vec3 } from "./core/exposure";
export { initialInteractionState, transitionInteraction } from "./core/interaction-state";
export type { InteractionEvent, InteractionMode, InteractionState } from "./core/interaction-state";
export { raycastSurfaceXY } from "./rendering/raycast";
