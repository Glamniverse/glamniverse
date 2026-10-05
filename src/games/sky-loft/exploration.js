import * as THREE from 'three'
import { CONFIG } from './config.js'

export const EXPLORATION = Object.freeze({speed:0.45,deadzone:0.22,snapDegrees:30,snapCooldown:0.45,clearance:0.35})
// Actual solids from loft.js, in anchored loft coordinates. Panorama is never floor.
export const FLOOR_OBSTACLES = Object.freeze([
 {name:'sofa',minX:-2.72,maxX:2.72,minZ:3.25,maxZ:4.36},
 {name:'coffee table',minX:-1.05,maxX:1.05,minZ:1.8,maxZ:2.6},
 {name:'rear wall',minX:-4,maxX:4,minZ:5.52,maxZ:5.68},
 {name:'selector pedestal',minX:-.75,maxX:.75,minZ:-2.81,maxZ:-2.39},
])
const edgeX=CONFIG.width/2-.65,edgeZ=CONFIG.depth/2-.85
export function isWalkable(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>edgeX||Math.abs(z)>edgeZ)return false
 const c=EXPLORATION.clearance
 return !FLOOR_OBSTACLES.some(b=>x>=b.minX-c&&x<=b.maxX+c&&z>=b.minZ-c&&z<=b.maxZ+c)
}
export function validMovement(ax,az,bx,bz){
 if(!isWalkable(ax,az)||!isWalkable(bx,bz))return false
 // Swept segment/slab test; never jump through a solid even after a long frame.
 const c=EXPLORATION.clearance,dx=bx-ax,dz=bz-az
 for(const b of FLOOR_OBSTACLES){
  let lo=0,hi=1
  if(Math.abs(dx)<1e-10){if(ax<b.minX-c||ax>b.maxX+c)continue}
  else{const a=(b.minX-c-ax)/dx,z=(b.maxX+c-ax)/dx;lo=Math.max(lo,Math.min(a,z));hi=Math.min(hi,Math.max(a,z))}
  if(Math.abs(dz)<1e-10){if(az<b.minZ-c||az>b.maxZ+c)continue}
  else{const a=(b.minZ-c-az)/dz,z=(b.maxZ+c-az)/dz;lo=Math.max(lo,Math.min(a,z));hi=Math.min(hi,Math.max(a,z))}
  if(lo<=hi)return false
 }
 return true
}
// Room-scale motion can put the headset just outside the artificial footprint.
// Keep that physical offset; allow only inward/tangential artificial steps, never
// snap it back. Project only the collision query onto the unchanged floor bounds.
export function resolveMovement(ax,az,bx,bz,out){
 if(!Number.isFinite(ax)||!Number.isFinite(az)||!Number.isFinite(bx)||!Number.isFinite(bz))return false
 const sx=THREE.MathUtils.clamp(ax,-edgeX,edgeX),sz=THREE.MathUtils.clamp(az,-edgeZ,edgeZ)
 const x=THREE.MathUtils.clamp(bx,Math.min(ax,-edgeX),Math.max(ax,edgeX))
 const z=THREE.MathUtils.clamp(bz,Math.min(az,-edgeZ),Math.max(az,edgeZ))
 const tx=THREE.MathUtils.clamp(x,-edgeX,edgeX),tz=THREE.MathUtils.clamp(z,-edgeZ,edgeZ)
 if(validMovement(sx,sz,tx,tz)){out.x=x;out.z=z;return true}
 // A blocked diagonal may still slide along one safe axis; swept furniture
 // checks remain authoritative, including when the origin was already invalid.
 if(x!==ax&&validMovement(sx,sz,tx,sz)){out.x=x;out.z=az;return true}
 if(z!==az&&validMovement(sx,sz,sx,tz)){out.x=ax;out.z=z;return true}
 return false
}
function stick(controllers,hand,out){
 for(const e of controllers||[]){
  if(!e.connected||!e.controller?.visible||e.source?.handedness!==hand||e.source.gamepad?.mapping!=='xr-standard')continue
  const a=e.source.gamepad.axes
  if(a?.length>=4&&Number.isFinite(a[2])&&Number.isFinite(a[3])){out.set(a[2],a[3]);return true}
 }
 out.set(0,0);return false
}
export function createExploration(place){
 const start=new THREE.Vector3(),startQ=new THREE.Quaternion(),head=new THREE.Vector3(),after=new THREE.Vector3(),local=new THREE.Vector3(),candidate=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3(),q=new THREE.Quaternion(),left=new THREE.Vector2(),turn=new THREE.Vector2()
 let state=null,mode='stationary',last=null,moveReady=false,turnReady=false,nextTurn=0
 const pause=()=>{last=null;moveReady=false;turnReady=false;nextTurn=0}
 const restore=()=>{if(state){state.origin.position.copy(start);state.origin.quaternion.copy(startQ);state.origin.updateMatrixWorld(true)}state=null;mode='stationary';pause()}
 return {
  bind(s){restore();state=s;start.copy(s.origin.position);startQ.copy(s.origin.quaternion)},
  setMode(m){mode=m==='slow'?'slow':'stationary';pause()},
  get mode(){return mode},pause,reset:restore,
  update(time,pose,enabled){
   if(!state||!enabled||mode!=='slow'||!pose||!Number.isFinite(time)){pause();return}
   const dt=last===null?0:Math.min(.05,Math.max(0,(time-last)/1000));last=time
   const origin=state.origin,p=pose.transform.position,r=pose.transform.orientation
   origin.updateWorldMatrix(true,false);head.set(p.x,p.y,p.z).applyMatrix4(origin.matrixWorld)
   local.copy(head);place.worldToLocal(local)
   if(!Number.isFinite(local.x)||!Number.isFinite(local.y)||!Number.isFinite(local.z))return
   const hasTurn=stick(state.interaction?.controllers,'right',turn)
   if(!hasTurn)turnReady=false
   else if(turn.length()<.25)turnReady=true
   else if(turnReady&&Math.abs(turn.x)>=.7&&time/1000>=nextTurn){
    turnReady=false;nextTurn=time/1000+EXPLORATION.snapCooldown
    origin.rotation.y-=Math.sign(turn.x)*THREE.MathUtils.degToRad(EXPLORATION.snapDegrees)
    origin.updateMatrixWorld(true);after.set(p.x,p.y,p.z).applyMatrix4(origin.matrixWorld)
    origin.position.x+=head.x-after.x;origin.position.z+=head.z-after.z;origin.updateMatrixWorld(true)
   }
   const hasLeft=stick(state.interaction?.controllers,'left',left),mag=left.length()
   if(!hasLeft)moveReady=false
   else if(mag<=EXPLORATION.deadzone)moveReady=true
   else if(moveReady){
    q.set(r.x,r.y,r.z,r.w);forward.set(0,0,-1).applyQuaternion(q).applyQuaternion(origin.quaternion);forward.y=0
    if(forward.lengthSq()<.0001)return
    forward.normalize();right.set(-forward.z,0,forward.x)
    const step=EXPLORATION.speed*dt*(Math.min(1,mag)-EXPLORATION.deadzone)/(1-EXPLORATION.deadzone)
    candidate.copy(head).addScaledVector(right,left.x/mag*step).addScaledVector(forward,-left.y/mag*step)
    after.copy(candidate);place.worldToLocal(after)
    if(resolveMovement(local.x,local.z,after.x,after.z,after)){
     candidate.copy(after);place.localToWorld(candidate)
     origin.position.x+=candidate.x-head.x;origin.position.z+=candidate.z-head.z;origin.updateMatrixWorld(true)
    }
   }
  },
 }
}
