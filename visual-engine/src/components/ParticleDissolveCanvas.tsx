"use client";

import { useEffect, useRef, useState } from "react";
import { sampleSurface, type SurfaceGeometry } from "../geometry/surface-sampling";
import { damp } from "../core/exposure";
import { raycastSurfaceXY } from "../rendering/raycast";
import { PARTICLE_FRAGMENT, PARTICLE_VERTEX, SOLID_FRAGMENT, SOLID_VERTEX } from "../rendering/shaders";

export type ParticleDissolveCanvasProps = {
  geometry: SurfaceGeometry;
  particleCount?: number;
  className?: string;
  label?: string;
  enabled?: boolean;
};

type ProgramInfo={program:WebGLProgram;position:number;normal:number;seed?:number;brush:WebGLUniformLocation|null;exposure:WebGLUniformLocation|null;time:WebGLUniformLocation|null;scale:WebGLUniformLocation|null;pixelRatio:WebGLUniformLocation|null};

function compile(gl:WebGLRenderingContext,type:number,source:string):WebGLShader {
  const shader=gl.createShader(type);
  if(!shader)throw new Error("Unable to allocate WebGL shader");
  gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader)||"Shader compilation failed";gl.deleteShader(shader);throw new Error(message);}
  return shader;
}
function createProgram(gl:WebGLRenderingContext,vertex:string,fragment:string):ProgramInfo {
  const program=gl.createProgram();
  if(!program)throw new Error("Unable to allocate WebGL program");
  const vs=compile(gl,gl.VERTEX_SHADER,vertex),fs=compile(gl,gl.FRAGMENT_SHADER,fragment);
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const message=gl.getProgramInfoLog(program)||"Program link failed";gl.deleteProgram(program);throw new Error(message);}
  const position=gl.getAttribLocation(program,"a_position"),normal=gl.getAttribLocation(program,"a_normal");
  if(position<0||normal<0)throw new Error("Required shader attributes are unavailable");
  return {program,position,normal,seed:gl.getAttribLocation(program,"a_seed"),brush:gl.getUniformLocation(program,"u_brush"),exposure:gl.getUniformLocation(program,"u_exposure"),time:gl.getUniformLocation(program,"u_time"),scale:gl.getUniformLocation(program,"u_scale"),pixelRatio:gl.getUniformLocation(program,"u_pixel_ratio")};
}
function faceNormals(geometry:SurfaceGeometry):Float32Array {
  if(geometry.normals)return Float32Array.from(geometry.normals);
  const result=new Float32Array(geometry.positions.length),corners=geometry.indices?.length??geometry.positions.length/3;
  for(let i=0;i+2<corners;i+=3){
    const ids=[geometry.indices?Number(geometry.indices[i]):i,geometry.indices?Number(geometry.indices[i+1]):i+1,geometry.indices?Number(geometry.indices[i+2]):i+2];
    const p=geometry.positions,a=[p[ids[0]*3],p[ids[0]*3+1],p[ids[0]*3+2]],b=[p[ids[1]*3],p[ids[1]*3+1],p[ids[1]*3+2]],c=[p[ids[2]*3],p[ids[2]*3+1],p[ids[2]*3+2]];
    const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    let nx=ab[1]*ac[2]-ab[2]*ac[1],ny=ab[2]*ac[0]-ab[0]*ac[2],nz=ab[0]*ac[1]-ab[1]*ac[0],len=Math.hypot(nx,ny,nz)||1;
    nx/=len;ny/=len;nz/=len;
    for(const id of ids){result[id*3]=nx;result[id*3+1]=ny;result[id*3+2]=nz;}
  }
  return result;
}

export function ParticleDissolveCanvas({geometry,particleCount=4000,className,label="Interactive 3D surface that dissolves into particles",enabled=true}:ParticleDissolveCanvasProps){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const previewRef=useRef(false);
  const scheduleRef=useRef<()=>void>(()=>{});
  const [preview,setPreview]=useState(false);
  const [fallback,setFallback]=useState(false);
  const [error,setError]=useState("");
  const [reducedMotion,setReducedMotion]=useState(false);

  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>{setReducedMotion(media.matches);if(media.matches){previewRef.current=false;setPreview(false);}};
    update();media.addEventListener?.("change",update);
    return()=>media.removeEventListener?.("change",update);
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas||!enabled)return;
    let gl:WebGLRenderingContext|null=null,raf=0,observer:ResizeObserver|null=null,disposed=false;
    let solid:ProgramInfo|null=null,particles:ProgramInfo|null=null;
    const buffers:WebGLBuffer[]=[];
    const aim:[number,number,number]=[0,0,0],brush:[number,number,number]=[0,0,0];
    let active=false,exposure=0,last=0,previewPoint:[number,number,number]=[0,0,0];
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    const cappedCount=Math.max(256,Math.min(12000,Math.floor(particleCount)));
    let particleData:{positions:Float32Array;normals:Float32Array;seeds:Float32Array};
    try{
      particleData=sampleSurface(geometry,cappedCount,722);
      const vertexNormals=faceNormals(geometry);
      // Expand indexed geometry so WebGL1 drawArrays follows the original triangle index order.
      const cornerCount=geometry.indices?.length??geometry.positions.length/3;
      const meshPositions=new Float32Array(cornerCount*3),meshNormals=new Float32Array(cornerCount*3);
      for(let corner=0;corner<cornerCount;corner++){
        const vertex=geometry.indices?Number(geometry.indices[corner]):corner;
        for(let axis=0;axis<3;axis++){
          meshPositions[corner*3+axis]=Number(geometry.positions[vertex*3+axis]);
          meshNormals[corner*3+axis]=vertexNormals[vertex*3+axis];
        }
      }
      gl=canvas.getContext("webgl",{alpha:true,antialias:true,depth:true,powerPreference:"low-power"});
      if(!gl)throw new Error("WebGL is unavailable on this device");
      solid=createProgram(gl,SOLID_VERTEX,SOLID_FRAGMENT);
      particles=createProgram(gl,PARTICLE_VERTEX,PARTICLE_FRAGMENT);
      const makeBuffer=(data:BufferSource)=>{const buffer=gl!.createBuffer();if(!buffer)throw new Error("Unable to allocate GPU buffer");buffers.push(buffer);gl!.bindBuffer(gl!.ARRAY_BUFFER,buffer);gl!.bufferData(gl!.ARRAY_BUFFER,data,gl!.STATIC_DRAW);return buffer;};
      const pointPosition=particleData.positions,pointNormals=particleData.normals,pointSeeds=particleData.seeds;
      const meshPosBuffer=makeBuffer(meshPositions),meshNormalBuffer=makeBuffer(meshNormals);
      const pointPosBuffer=makeBuffer(pointPosition),pointNormalBuffer=makeBuffer(pointNormals),pointSeedBuffer=makeBuffer(pointSeeds);
      const vertexCount=meshPositions.length/3,pointCount=pointSeeds.length;
      // Preview starts on an actual sampled surface point, never at a possibly empty centroid.
      let frontIndex=0;
      for(let i=1;i<pointCount;i++)if(pointPosition[i*3+2]>pointPosition[frontIndex*3+2])frontIndex=i;
      previewPoint=[pointPosition[frontIndex*3],pointPosition[frontIndex*3+1],pointPosition[frontIndex*3+2]];
      const bind=(info:ProgramInfo,pos:WebGLBuffer,norm:WebGLBuffer,seed?:WebGLBuffer)=>{
        gl!.useProgram(info.program);
        gl!.bindBuffer(gl!.ARRAY_BUFFER,pos);gl!.enableVertexAttribArray(info.position);gl!.vertexAttribPointer(info.position,3,gl!.FLOAT,false,0,0);
        gl!.bindBuffer(gl!.ARRAY_BUFFER,norm);gl!.enableVertexAttribArray(info.normal);gl!.vertexAttribPointer(info.normal,3,gl!.FLOAT,false,0,0);
        if(seed&&info.seed!==undefined&&info.seed>=0){gl!.bindBuffer(gl!.ARRAY_BUFFER,seed);gl!.enableVertexAttribArray(info.seed);gl!.vertexAttribPointer(info.seed,1,gl!.FLOAT,false,0,0);}
      };
      const resize=()=>{
        if(disposed)return;
        const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5);
        const width=Math.max(1,Math.floor(rect.width*dpr)),height=Math.max(1,Math.floor(rect.height*dpr));
        if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
        gl!.viewport(0,0,width,height);
      };
      const draw=(now:number)=>{
        raf=0;if(disposed||!gl||!solid||!particles)return;
        const dt=Math.min(.05,(now-last)/1000||.016);last=now;
        const target=motion.matches?0:active||previewRef.current?1:0;
        exposure=motion.matches?0:damp(exposure,target,target>exposure?8:3.5,dt);
        const next=active?aim:previewRef.current?previewPoint:brush;
        const blend=1-Math.exp(-16*dt);
        for(let i=0;i<3;i++)brush[i]+=(next[i]-brush[i])*blend;
        const width=canvas.width,height=canvas.height,aspect=width/Math.max(1,height);
        const sx=aspect>=1?1/aspect:1,sy=aspect>=1?1:aspect;
        gl!.clearColor(0.025,0.04,0.065,0);gl!.clear(gl!.COLOR_BUFFER_BIT|gl!.DEPTH_BUFFER_BIT);
        gl!.enable(gl!.DEPTH_TEST);gl!.depthFunc(gl!.LEQUAL);
        gl!.useProgram(solid!.program);
        gl!.uniform2f(solid!.scale!,sx,sy);gl!.uniform3f(solid!.brush!,brush[0],brush[1],brush[2]);gl!.uniform1f(solid!.exposure!,exposure);
        bind(solid!,meshPosBuffer,meshNormalBuffer);
        gl!.drawArrays(gl!.TRIANGLES,0,vertexCount);
        gl!.useProgram(particles!.program);
        gl!.uniform2f(particles!.scale!,sx,sy);gl!.uniform3f(particles!.brush!,brush[0],brush[1],brush[2]);
        gl!.uniform1f(particles!.exposure!,exposure);gl!.uniform1f(particles!.time!,now/1000);
        gl!.uniform1f(particles!.pixelRatio!,Math.min(window.devicePixelRatio||1,1.5));
        gl!.depthMask(false);gl!.enable(gl!.BLEND);gl!.blendFunc(gl!.SRC_ALPHA,gl!.ONE_MINUS_SRC_ALPHA);
        bind(particles!,pointPosBuffer,pointNormalBuffer,pointSeedBuffer);
        gl!.drawArrays(gl!.POINTS,0,pointCount);
        gl!.depthMask(true);gl!.disable(gl!.BLEND);
        if(target>0||exposure>.002)raf=requestAnimationFrame(draw);
      };
      const schedule=()=>{if(!raf&&!disposed)raf=requestAnimationFrame(draw);};
      scheduleRef.current=schedule;
      const pointer=(event:PointerEvent)=>{
        const rect=canvas.getBoundingClientRect(),aspect=rect.width/Math.max(1,rect.height);
        const ndcX=((event.clientX-rect.left)/rect.width)*2-1,ndcY=1-((event.clientY-rect.top)/rect.height)*2;
        const sx=aspect>=1?1/aspect:1,sy=aspect>=1?1:aspect;
        const hit=raycastSurfaceXY(geometry,ndcX/sx,ndcY/sy);
        active=!!hit;
        if(hit){aim[0]=hit[0];aim[1]=hit[1];aim[2]=hit[2];}
        schedule();
      };
      const release=()=>{active=false;schedule();};
      const onVisibility=()=>{if(document.hidden){active=false;previewRef.current=false;setPreview(false);}schedule();};
      const onContextLost=(event:Event)=>{event.preventDefault();disposed=true;if(raf)cancelAnimationFrame(raf);setError("Graphics context lost. Reload this visual to try again.");setFallback(true);};
      canvas.addEventListener("pointermove",pointer);canvas.addEventListener("pointerdown",pointer);
      canvas.addEventListener("pointerleave",release);canvas.addEventListener("pointercancel",release);canvas.addEventListener("pointerup",release);
      window.addEventListener("blur",release);document.addEventListener("visibilitychange",onVisibility);
      canvas.addEventListener("webglcontextlost",onContextLost,false);
      observer=new ResizeObserver(()=>{resize();schedule();});observer.observe(canvas);
      resize();schedule();setFallback(false);setError("");
      return()=>{
        disposed=true;scheduleRef.current=()=>{};if(raf)cancelAnimationFrame(raf);
        observer?.disconnect();
        canvas.removeEventListener("pointermove",pointer);canvas.removeEventListener("pointerdown",pointer);
        canvas.removeEventListener("pointerleave",release);canvas.removeEventListener("pointercancel",release);canvas.removeEventListener("pointerup",release);
        window.removeEventListener("blur",release);document.removeEventListener("visibilitychange",onVisibility);
        canvas.removeEventListener("webglcontextlost",onContextLost);
        if(gl){for(const buffer of buffers)gl.deleteBuffer(buffer);if(solid)gl.deleteProgram(solid.program);if(particles)gl.deleteProgram(particles.program);}
      };
    }catch(cause){
      setFallback(true);setError(cause instanceof Error?cause.message:"Unable to initialize the visual engine");
    }
  },[geometry,particleCount,enabled]);

  const togglePreview=()=>{const next=!previewRef.current;previewRef.current=next;setPreview(next);scheduleRef.current();};
  return <section className={className??"cosmos-particle-dissolve"} aria-label={label}>
    <div className="cosmos-particle-stage">
      <canvas ref={canvasRef} aria-label={label} role="img" />
      {fallback&&<div className="cosmos-visual-fallback" role="img" aria-label="Static visual fallback"><span className="cosmos-fallback-orbit" /><span className="cosmos-fallback-core" /></div>}
      {error&&<p className="cosmos-visual-error" role="status">{error}</p>}
    </div>
    <div className="cosmos-visual-controls">
      <button type="button" onClick={togglePreview} aria-pressed={preview} disabled={reducedMotion||!enabled}>{preview?"Reform surface":"Preview dissolve"}</button>
      {reducedMotion&&<span>Reduced motion is enabled; animation is paused.</span>}
    </div>
  </section>;
}
