import * as THREE from 'three'
import { OCEAN as B, SWIM as C, ROCKS, floorHeight } from './config.js'
const clamp=THREE.MathUtils.clamp
const Y=new THREE.Vector3(0,1,0)
const radius=p=>Math.hypot(p.x/B.radiusX,(p.z-B.centerZ)/B.radiusZ)
const obstacles=ROCKS.map(([x,z,sx,sy,sz])=>({x,z,y:floorHeight(x,z)+sy*.28,sx:sx*1.1+.5,sy:sy*1.1+.5,sz:sz*1.1+.5}))

// Project proposed movement, not the tracked headset. Already-outside poses may
// always recover inward; no validity gate can suppress input or snap-turn.
export function resolveOceanStep(position,delta,out){
 out.copy(position).add(delta)
 const r=radius(position),next=radius(out),limit=Math.max(1,r)
 if(next>limit){out.x*=limit/next;out.z=B.centerZ+(out.z-B.centerZ)*limit/next}
 const floor=floorHeight(out.x,out.z)+B.floorClearance
 if(floor>out.y&&floor>position.y+.001){out.x=position.x;out.z=position.z}
 const safeFloor=floorHeight(out.x,out.z)+B.floorClearance
 out.y=clamp(out.y,Math.min(position.y,safeFloor),Math.max(position.y,B.ceiling))
 for(const b of obstacles){
  const ax=(position.x-b.x)/b.sx,ay=(position.y-b.y)/b.sy,az=(position.z-b.z)/b.sz
  const bx=(out.x-b.x)/b.sx,by=(out.y-b.y)/b.sy,bz=(out.z-b.z)/b.sz
  if(bx*bx+by*by+bz*bz>=Math.min(1,ax*ax+ay*ay+az*az))continue
  const nx=ax/b.sx,ny=ay/b.sy,nz=az/b.sz,nn=nx*nx+ny*ny+nz*nz
  if(nn<1e-12)continue
  const dot=((out.x-position.x)*nx+(out.y-position.y)*ny+(out.z-position.z)*nz)/nn
  if(dot<0){out.x-=nx*dot;out.y-=ny*dot;out.z-=nz*dot}
 }
 return out
}
export function createSwimMotion(){
 const velocity=new THREE.Vector3(),force=new THREE.Vector3(),delta=new THREE.Vector3(),next=new THREE.Vector3(),normal=new THREE.Vector3(),v=new THREE.Vector3()
 const previous=Array.from({length:2},()=>({position:new THREE.Vector3(),valid:false,armed:false,blocked:0}))
 let spike=false;let turnReady=false,leftReady=false,verticalReady=false,cooldown=0
 const result={delta:new THREE.Vector3(),yaw:0}
 function reset(){velocity.set(0,0,0);for(const h of previous){h.valid=false;h.armed=false;h.blocked=0}turnReady=false;leftReady=false;verticalReady=false;cooldown=0;result.delta.set(0,0,0);result.yaw=0}
 return {velocity,reset,
  step(dt,position,input={}){
   result.delta.set(0,0,0);result.yaw=0
   if(!Number.isFinite(dt)||dt<=0||dt>.1||!Number.isFinite(position.x+position.y+position.z)){reset();return result}
   dt=Math.min(dt,.05);cooldown=Math.max(0,cooldown-dt)
   const turn=input.rightX||0,vertical=input.rightY||0
   if(input.rightValid&&Math.abs(turn)<.25&&Math.abs(vertical)<.25)turnReady=true
   if(input.rightValid&&turnReady&&Math.abs(turn)>.7&&Math.abs(turn)>Math.abs(vertical)&&cooldown===0){
    result.yaw=-Math.sign(turn)*C.snapDegrees*Math.PI/180;turnReady=false;cooldown=C.snapCooldown
    velocity.applyAxisAngle(Y,result.yaw)
    for(const h of previous)h.valid=false
   }
   if(!input.rightValid){turnReady=false;verticalReady=false}
   // Trigger selection is never a swim stroke. Immediately float while using UI.
   if(input.selecting){velocity.set(0,0,0);for(const h of previous)h.valid=false;return result}
   force.set(0,0,0);spike=false
   const yaw=(input.yaw||0)+result.yaw
   for(let i=0;i<2;i++){
    const h=previous[i],sample=input.hands?.[i];h.blocked=Math.max(0,h.blocked-dt)
    if(!sample?.valid||!Number.isFinite(sample.position.x+sample.position.y+sample.position.z)){h.valid=false;h.armed=false;continue}
    if(!sample.grip)h.armed=true
    if(h.valid&&sample.grip&&h.armed&&h.blocked===0){
     v.subVectors(sample.position,h.position).divideScalar(dt)
     const speed=v.length()
     if(speed>C.trackingSpike){h.blocked=.35;spike=true;velocity.set(0,0,0)}
     else if(speed>C.strokeThreshold){
      v.multiplyScalar(-(speed-C.strokeThreshold)/speed*C.gain*.5).applyAxisAngle(Y,yaw)
      force.add(v)
     }
    }
    h.position.copy(sample.position);h.valid=true
   }
   if(spike)force.set(0,0,0);if(force.length()>C.acceleration)force.setLength(C.acceleration)
   velocity.multiplyScalar(Math.exp(-C.drag*dt)).addScaledVector(force,dt)
   if(velocity.length()>C.speed)velocity.setLength(C.speed)
   // Thumbsticks are an intentional accessibility fallback, neutral-armed on entry.
   const lx=input.leftX||0,ly=input.leftY||0,mag=Math.hypot(lx,ly)
   if(input.leftValid&&mag<C.deadzone)leftReady=true
   if(!input.leftValid)leftReady=false
   delta.copy(velocity).multiplyScalar(dt)
   if(leftReady&&mag>C.deadzone){v.set(lx,0,ly).multiplyScalar((Math.min(1,mag)-C.deadzone)/(1-C.deadzone)/mag*C.stickSpeed*dt).applyAxisAngle(Y,(input.viewYaw??input.yaw??0)+result.yaw);delta.add(v)}
   if(input.rightValid&&Math.abs(vertical)<C.deadzone)verticalReady=true
   if(verticalReady&&input.rightValid&&Math.abs(vertical)>C.deadzone&&Math.abs(turn)<.4)delta.y+=-Math.sign(vertical)*(Math.min(1,Math.abs(vertical))-C.deadzone)/(1-C.deadzone)*C.verticalSpeed*dt
   // Combined input never exceeds the same comfort speed cap.
   if(delta.length()>C.speed*dt)delta.setLength(C.speed*dt)
   const r=radius(position)
   normal.set(position.x/(B.radiusX*B.radiusX),0,(position.z-B.centerZ)/(B.radiusZ*B.radiusZ)).normalize()
   const outward=delta.dot(normal),soft=clamp((1-r)*Math.min(B.radiusX,B.radiusZ)/B.resistance,0,1)
   if(outward>0)delta.addScaledVector(normal,-outward*(1-soft))
   const low=floorHeight(position.x,position.z)+B.floorClearance
   if(delta.y>0)delta.y*=clamp((B.ceiling-position.y)/1.5,0,1)
   else delta.y*=clamp((position.y-low)/1.5,0,1)
   resolveOceanStep(position,delta,next);result.delta.subVectors(next,position)
   // Remove blocked velocity, preserving tangential/inward recovery next frame.
   for(const axis of ['x','y','z'])if(Math.abs(result.delta[axis])<Math.abs(delta[axis])*.2)velocity[axis]=0
   if(velocity.lengthSq()<1e-7)velocity.set(0,0,0)
   return result
  },
 }
}
