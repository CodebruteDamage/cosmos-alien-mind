/**
 * Dependency-free, deterministic, area-weighted surface sampling.
 * Input positions/normals are flat XYZ arrays. Indices may be omitted.
 */
export type SurfaceGeometry = {
  positions: ArrayLike<number>;
  indices?: ArrayLike<number>;
  normals?: ArrayLike<number>;
};
export type SurfaceSamples = {
  positions: Float32Array;
  normals: Float32Array;
  seeds: Float32Array;
  sourceTriangles: Uint32Array;
};
type Triangle = { a:number; b:number; c:number; area:number; nx:number; ny:number; nz:number };

function vertexIndex(geometry: SurfaceGeometry, corner: number): number {
  return geometry.indices ? Number(geometry.indices[corner]) : corner;
}
function xyz(values:ArrayLike<number>, index:number):[number,number,number] {
  const offset=index*3;
  return [Number(values[offset]),Number(values[offset+1]),Number(values[offset+2])];
}
function randomSource(seed:number):()=>number {
  let state=(seed>>>0)||0x6d2b79f5;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state>>>0)/4294967296;
  };
}
function lowerBound(values:Float64Array,target:number):number {
  let low=0,high=values.length-1;
  while(low<high){const mid=(low+high)>>>1;if(values[mid]<target)low=mid+1;else high=mid;}
  return low;
}

export function sampleSurface(geometry:SurfaceGeometry,count:number,seed=722):SurfaceSamples {
  if(!Number.isInteger(count)||count<1)throw new RangeError("count must be a positive integer");
  if(geometry.positions.length%3!==0)throw new Error("positions must contain XYZ triples");
  const cornerCount=geometry.indices?.length ?? geometry.positions.length/3;
  if(cornerCount%3!==0)throw new Error("geometry must contain complete triangles");
  const triangles:Triangle[]=[];
  const cumulative:number[]=[];
  let total=0;
  for(let corner=0;corner<cornerCount;corner+=3){
    const ia=vertexIndex(geometry,corner),ib=vertexIndex(geometry,corner+1),ic=vertexIndex(geometry,corner+2);
    const [ax,ay,az]=xyz(geometry.positions,ia),[bx,by,bz]=xyz(geometry.positions,ib),[cx,cy,cz]=xyz(geometry.positions,ic);
    const abx=bx-ax,aby=by-ay,abz=bz-az,acx=cx-ax,acy=cy-ay,acz=cz-az;
    const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx;
    const twiceArea=Math.hypot(nx,ny,nz);
    if(!Number.isFinite(twiceArea)||twiceArea<=1e-12)continue;
    const length=Math.hypot(nx,ny,nz);
    total+=twiceArea*.5;
    triangles.push({a:ia,b:ib,c:ic,area:twiceArea*.5,nx:nx/length,ny:ny/length,nz:nz/length});
    cumulative.push(total);
  }
  if(!triangles.length||total<=0)throw new Error("geometry has no non-degenerate triangles");
  const random=randomSource(seed),weights=new Float64Array(3);
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3);
  const seeds=new Float32Array(count),sourceTriangles=new Uint32Array(count);
  const cumulativeArray=Float64Array.from(cumulative);
  for(let i=0;i<count;i++){
    const triIndex=lowerBound(cumulativeArray,random()*total),tri=triangles[triIndex];
    const root=Math.sqrt(random()),v=random();
    weights[0]=1-root;weights[1]=root*(1-v);weights[2]=root*v;
    const ids=[tri.a,tri.b,tri.c];
    for(let axis=0;axis<3;axis++){
      let p=0,n=0;
      for(let corner=0;corner<3;corner++){
        const id=ids[corner],w=weights[corner];
        p+=Number(geometry.positions[id*3+axis])*w;
        if(geometry.normals)n+=Number(geometry.normals[id*3+axis])*w;
      }
      positions[i*3+axis]=p;
      normals[i*3+axis]=geometry.normals?n:(axis===0?tri.nx:axis===1?tri.ny:tri.nz);
    }
    const nx=normals[i*3],ny=normals[i*3+1],nz=normals[i*3+2],length=Math.hypot(nx,ny,nz)||1;
    normals[i*3]/=length;normals[i*3+1]/=length;normals[i*3+2]/=length;
    seeds[i]=random();sourceTriangles[i]=triIndex;
  }
  return {positions,normals,seeds,sourceTriangles};
}
