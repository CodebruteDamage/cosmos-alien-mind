import test from "node:test";
import assert from "node:assert/strict";
import { sampleSurface } from "../src/geometry/surface-sampling.ts";
import { damp, erosionField, particleReveal, smoothstep } from "../src/core/exposure.ts";
import { initialInteractionState, transitionInteraction } from "../src/core/interaction-state.ts";
import { raycastSurfaceXY } from "../src/rendering/raycast.ts";

const twoTriangles={
  positions:new Float32Array([
    0,0,0, 1,0,0, 0,1,0,
    10,0,0, 12,0,0, 10,2,0,
    20,0,0, 21,0,0, 22,0,0
  ])
};

test("surface sampling is deterministic and samples by triangle area",()=>{
  const first=sampleSurface(twoTriangles,10000,1234);
  const second=sampleSurface(twoTriangles,10000,1234);
  assert.deepEqual(first.positions,second.positions);
  assert.deepEqual(first.seeds,second.seeds);
  const counts=[0,0];
  for(const index of first.sourceTriangles)counts[index]++;
  const largeRatio=counts[1]/(counts[0]+counts[1]);
  assert.ok(largeRatio>.76&&largeRatio<.84,"expected about 80% large-triangle samples, got "+largeRatio);
  assert.ok(first.sourceTriangles.every(index=>index<2),"degenerate triangle must be skipped");
});

test("surface samples have finite normals and stable seeds",()=>{
  const result=sampleSurface(twoTriangles,256,9);
  for(const value of result.positions)assert.ok(Number.isFinite(value));
  for(const value of result.normals)assert.ok(Number.isFinite(value));
  for(const value of result.seeds)assert.ok(value>=0&&value<1);
});

test("invalid and degenerate geometry is rejected safely",()=>{
  assert.throws(()=>sampleSurface({positions:new Float32Array([0,0,0])},1),/complete triangles/);
  assert.throws(()=>sampleSurface({positions:new Float32Array([0,0,0,1,0,0,2,0,0])},1),/no non-degenerate/);
  assert.throws(()=>sampleSurface({positions:new Float32Array([0,0,0,1,0,0,0,1,0]),indices:new Uint16Array([0,1,8])},1),/outside/);
});

test("erosion field, reveal and damping remain bounded and monotonic",()=>{
  const brush=[0,0,0];
  const near=erosionField([0,0,0],brush,{radius:1});
  const far=erosionField([2,0,0],brush,{radius:1});
  assert.ok(near<far);
  assert.equal(smoothstep(0,1,0),0);
  assert.equal(smoothstep(0,1,1),1);
  assert.ok(particleReveal(.5,.6)>particleReveal(.5,.4));
  assert.ok(damp(0,1,8,.016)>0);
  assert.ok(damp(0,1,8,.016)<1);
});

test("interaction state handles hit, release, preview and reduced motion",()=>{
  let state=initialInteractionState;
  state=transitionInteraction(state,{type:"HIT"});
  assert.equal(state.mode,"brushing");
  state=transitionInteraction(state,{type:"EXPOSURE",value:.7});
  state=transitionInteraction(state,{type:"MISS"});
  assert.equal(state.mode,"releasing");
  state=transitionInteraction(state,{type:"PREVIEW",enabled:true});
  assert.equal(state.mode,"preview");
  state=transitionInteraction(state,{type:"REDUCED_MOTION",enabled:true});
  assert.equal(state.mode,"reduced-motion");
  assert.equal(state.exposure,0);
  assert.equal(transitionInteraction(state,{type:"HIT"}).mode,"reduced-motion");
});

test("raycaster hits intact mesh and misses empty space",()=>{
  const geometry={positions:new Float32Array([-1,-1,0,1,-1,0,0,1,0])};
  assert.ok(raycastSurfaceXY(geometry,0,0));
  assert.equal(raycastSurfaceXY(geometry,2,2),null);
});
