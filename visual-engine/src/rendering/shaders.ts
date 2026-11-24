export const SOLID_VERTEX = `
attribute vec3 a_position;
attribute vec3 a_normal;
uniform vec2 u_scale;
varying vec3 v_home;
varying vec3 v_normal;
void main() {
  v_home = a_position;
  v_normal = a_normal;
  gl_Position = vec4(a_position.xy * u_scale, a_position.z * 0.2, 1.0);
}`;

export const SOLID_FRAGMENT = `
precision mediump float;
uniform vec3 u_brush;
uniform float u_exposure;
varying vec3 v_home;
varying vec3 v_normal;
float erosion(vec3 p) {
  float grain = 0.038 * sin(dot(p, vec3(19.0,11.0,9.0)))
              + 0.023 * cos(dot(p, vec3(-14.0,29.0,23.0)));
  return clamp(0.08 + distance(p,u_brush)*0.69 + grain,0.04,1.5);
}
void main() {
  if (erosion(v_home) < u_exposure) discard;
  vec3 n = normalize(v_normal);
  float light = max(0.0,dot(n,normalize(vec3(-0.5,0.82,1.0))));
  float rim = 1.0 - abs(n.z);
  vec3 base = mix(vec3(0.08,0.15,0.24),vec3(0.42,0.68,0.75),light);
  base += vec3(0.16,0.22,0.25)*rim;
  gl_FragColor = vec4(base,1.0);
}`;

export const PARTICLE_VERTEX = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute float a_seed;
uniform vec3 u_brush;
uniform float u_exposure;
uniform float u_time;
uniform vec2 u_scale;
uniform float u_pixel_ratio;
varying float v_alpha;
varying float v_seed;
float erosion(vec3 p) {
  float grain = 0.038 * sin(dot(p, vec3(19.0,11.0,9.0)))
              + 0.023 * cos(dot(p, vec3(-14.0,29.0,23.0)));
  return clamp(0.08 + distance(p,u_brush)*0.69 + grain,0.04,1.5);
}
void main() {
  float field = erosion(a_position);
  float freed = smoothstep(field-0.045,field+0.13,u_exposure);
  float spread = a_seed < 0.65 ? 0.06 : (a_seed < 0.91 ? 0.28 : 0.77);
  vec3 flow = vec3(
    sin(a_position.y*3.0+u_time*1.3+a_seed*4.0),
    cos(a_position.z*4.0+u_time+a_seed*3.0),
    sin(a_position.x*3.0-u_time)
  );
  vec3 p = a_position + freed*spread*(normalize(a_normal)*0.12+flow*0.08+vec3(0.08,0.05,0.0));
  v_alpha = freed*smoothstep(0.0,0.06,u_exposure);
  v_seed = a_seed;
  gl_Position = vec4(p.xy*u_scale,p.z*0.2,1.0);
  gl_PointSize = clamp(u_pixel_ratio*(1.5+2.0*a_seed),1.0,7.0);
}`;

export const PARTICLE_FRAGMENT = `
precision mediump float;
varying float v_alpha;
varying float v_seed;
void main() {
  float radius = length(gl_PointCoord-vec2(0.5));
  if(radius>0.5 || v_alpha<0.01) discard;
  vec3 color = mix(vec3(0.34,0.56,0.72),vec3(0.82,0.93,0.96),v_seed);
  if(v_seed>0.95) color=vec3(0.98,0.70,0.43);
  gl_FragColor=vec4(color,v_alpha*(1.0-smoothstep(0.25,0.5,radius)));
}`;
