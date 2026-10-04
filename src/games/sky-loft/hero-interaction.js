import * as THREE from 'three'

export const HERO_TOUCH=Object.freeze({dwell:.75,duration:1.2,peakScale:1.06,tolerance:.55})
export function heroEnvelope(seconds){
  if(seconds<0||seconds>=HERO_TOUCH.duration)return 0
  const t=seconds<.35?seconds/.35:(HERO_TOUCH.duration-seconds)/.85
  return t*t*(3-2*t)
}
// Distant HERO-only dwell. Reuses XR controller poses, never registers a menu target.
export function createHeroInteraction(lyrics,occluders,onActivate){
  const raycaster=new THREE.Raycaster(),inverse=new THREE.Matrix4(),rotation=new THREE.Matrix4(),localRay=new THREE.Ray(),point=new THREE.Vector3(),worldPoint=new THREE.Vector3()
  const scale=new THREE.Vector3(),color=new THREE.Color(),hits=[],spent=new Set(),dwell=[0,0]
  let last=null,epoch=-1,event=-1,pulseEvent=-1,age=Infinity,applied=null,disposed=false
  function restore(){if(applied){applied.scale.copy(scale);applied.material.color.copy(color);applied=null}}
  function reset(){restore();last=null;epoch=-1;event=-1;pulseEvent=-1;age=Infinity;spent.clear();dwell.fill(0)}
  function visible(object){for(let p=object;p;p=p.parent)if(!p.visible)return false;return true}
  function aimed(entry,mesh){
    if(!entry?.connected||!entry.controller?.visible||!entry.controller?.updateWorldMatrix)return false
    entry.controller.updateWorldMatrix(true,false);mesh.updateWorldMatrix(true,false)
    raycaster.ray.origin.setFromMatrixPosition(entry.controller.matrixWorld)
    rotation.extractRotation(entry.controller.matrixWorld)
    raycaster.ray.direction.set(0,0,-1).applyMatrix4(rotation).normalize()
    inverse.copy(mesh.matrixWorld).invert();localRay.copy(raycaster.ray).applyMatrix4(inverse)
    if(localRay.origin.z<=0||localRay.direction.z>=-.00001)return false
    localRay.at(-localRay.origin.z/localRay.direction.z,point)
    if(Math.abs(point.x)>HERO_TOUCH.tolerance||Math.abs(point.y)>HERO_TOUCH.tolerance)return false
    worldPoint.copy(point).applyMatrix4(mesh.matrixWorld)
    raycaster.near=0;raycaster.far=raycaster.ray.origin.distanceTo(worldPoint)
    if(raycaster.far>150)return false
    for(const object of occluders)if(visible(object)){
      object.updateWorldMatrix(true,false);hits.length=0;raycaster.intersectObject(object,false,hits)
      if(hits.length)return false
    }
    return true
  }
  return {
    restore,reset,
    update(time,controllers){
      restore();if(disposed)return
      const dt=last===null?0:Math.min(.05,Math.max(0,(time-last)/1000));last=time
      const target=lyrics.getHeroTarget()
      if(!target){event=-1;pulseEvent=-1;age=Infinity;dwell.fill(0);return}
      if(epoch!==target.heroEpoch){epoch=target.heroEpoch;spent.clear();pulseEvent=-1;age=Infinity}
      if(event!==target.index){event=target.index;dwell.fill(0)}
      age+=dt
      if(!spent.has(event))for(let i=0;i<2;i++){
        const entry=controllers?.[i]
        dwell[i]=aimed(entry,target.mesh)?dwell[i]+dt:0
        if(dwell[i]>=HERO_TOUCH.dwell){
          spent.add(event);pulseEvent=event;age=0;dwell.fill(0);onActivate()
          try{const actuator=entry.source?.gamepad?.hapticActuators?.[0];if(actuator?.pulse)Promise.resolve(actuator.pulse(.15,50)).catch(()=>{})}catch{}
          break
        }
      }
      if(pulseEvent===event){
        const amount=heroEnvelope(age)
        if(amount>0){applied=target.mesh;scale.copy(applied.scale);color.copy(applied.material.color)
          applied.scale.multiplyScalar(1+.06*amount);applied.material.color.multiplyScalar(1+.12*amount)}
      }
    },
    dispose(){reset();disposed=true},
  }
}
