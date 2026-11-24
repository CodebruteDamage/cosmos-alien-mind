/** Shared CPU reference for solid and particle shader exposure. */
export type Vec3 = readonly [number,number,number];
export type ExposureConfig = { radius:number; noiseAmplitude?:number; noiseFrequency?:number };
export function smoothstep(edge0:number,edge1:number,value:number):number {
  const t=Math.max(0,Math.min(1,(value-edge0)/(edge1-edge0)));
  return t*t*(3-2*t);
}
export function erosionField(home:Vec3,brush:Vec3,config:ExposureConfig):number {
  if(!(config.radius>0))throw new RangeError("brush radius must be positive");
  const dx=home[0]-brush[0],dy=home[1]-brush[1],dz=home[2]-brush[2];
  const distance=Math.hypot(dx,dy,dz)/config.radius;
  const f=config.noiseFrequency??1;
  const noise=(Math.sin(home[0]*19*f+home[1]*11*f+home[2]*9*f)*.038+
    Math.cos(home[0]*-14*f+home[1]*29*f+home[2]*23*f)*.023);
  return Math.max(0,Math.min(1.5,.08+distance*.69+noise*(config.noiseAmplitude??1)));
}
export function particleReveal(field:number,exposure:number,band=.13):number {
  return smoothstep(field-band,field+band,exposure);
}
export function damp(current:number,target:number,rate:number,deltaSeconds:number):number {
  if(rate<0||deltaSeconds<0)throw new RangeError("rate and delta must be non-negative");
  return current+(target-current)*(1-Math.exp(-rate*deltaSeconds));
}
