import type { SurfaceGeometry } from "../geometry/surface-sampling";

type Vec3=[number,number,number];
function subtract(a:Vec3,b:Vec3):Vec3{return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function cross(a:Vec3,b:Vec3):Vec3{return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a:Vec3,b:Vec3):number{return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

/** Orthographic camera ray against the original, never-hidden triangle geometry. */
export function raycastSurfaceXY(geometry:SurfaceGeometry,x:number,y:number):Vec3|null {
  const positions=geometry.positions,indices=geometry.indices;
  const corners=indices?.length??positions.length/3;
  const origin:Vec3=[x,y,4],direction:Vec3=[0,0,-1];
  let nearest=Number.POSITIVE_INFINITY,best:Vec3|null=null;
  for(let i=0;i+2<corners;i+=3){
    const ia=indices?Number(indices[i]):i,ib=indices?Number(indices[i+1]):i+1,ic=indices?Number(indices[i+2]):i+2;
    const a:Vec3=[Number(positions[ia*3]),Number(positions[ia*3+1]),Number(positions[ia*3+2])];
    const b:Vec3=[Number(positions[ib*3]),Number(positions[ib*3+1]),Number(positions[ib*3+2])];
    const c:Vec3=[Number(positions[ic*3]),Number(positions[ic*3+1]),Number(positions[ic*3+2])];
    const edge1=subtract(b,a),edge2=subtract(c,a),h=cross(direction,edge2),det=dot(edge1,h);
    if(Math.abs(det)<1e-8)continue;
    const inv=1/det,s=subtract(origin,a),u=inv*dot(s,h);
    if(u<0||u>1)continue;
    const q=cross(s,edge1),v=inv*dot(direction,q);
    if(v<0||u+v>1)continue;
    const distance=inv*dot(edge2,q);
    if(distance>0&&distance<nearest){nearest=distance;best=[x,y,4-distance];}
  }
  return best;
}
