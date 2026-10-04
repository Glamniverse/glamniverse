import * as THREE from 'three'

// Measurement logic extracted verbatim from the Quest-approved butterfly sampler.
// Only the active species samples; no new input listeners or competing clocks.
export function createFaunaPresence(parent,{fastSpeed=1.3,fastCooldown=1.5}={}){
  const hands=Array.from({length:2},()=>({position:new THREE.Vector3(),previous:new THREE.Vector3(),
    world:new THREE.Vector3(),valid:false,tracked:false,blocked:0}))
  const head=new THREE.Vector3()
  let xr=false
  return {hands,head,get active(){return xr},
    reset(){xr=false;for(const h of hands){h.valid=false;h.tracked=false;h.blocked=0}},
    begin(dt,input){
      xr=Boolean(input?.head&&input?.controllers)
      if(xr){head.copy(input.head);parent.worldToLocal(head)}
      for(let i=0;i<2;i++){
        const h=hands[i],entry=input?.controllers?.[i],controller=(entry?.grip?.visible?entry.grip:entry?.controller)
        h.valid=false;h.blocked=Math.max(0,h.blocked-dt)
        if(!xr||!entry?.connected||!entry.controller?.visible||!controller?.getWorldPosition){h.tracked=false;continue}
        controller.updateWorldMatrix(true,false);controller.getWorldPosition(h.world)
        if(!Number.isFinite(h.world.x+h.world.y+h.world.z)){h.tracked=false;continue}
        if(h.tracked&&dt>0&&h.world.distanceTo(h.previous)/dt>fastSpeed)h.blocked=fastCooldown
        h.previous.copy(h.world);h.tracked=true;h.position.copy(h.world);parent.worldToLocal(h.position)
        h.valid=h.blocked===0&&h.position.distanceTo(head)>=.55
      }
      xr=xr&&(hands[0].tracked||hands[1].tracked)
    },
    nearest(position,radius){
      let selected=-1
      for(let i=0;i<2;i++)if(hands[i].valid){const d=position.distanceTo(hands[i].position);if(d<radius){radius=d;selected=i}}
      return selected
    },
  }
}
export const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t)}
export function follow(position,target,dt,speed,damping,scratch){
  scratch.subVectors(target,position);const length=scratch.length()
  if(length>0)position.addScaledVector(scratch,Math.min(length*(1-Math.exp(-dt/damping)),speed*dt)/length)
}
// Front exterior corridor: sphere clearance keeps the whole creature off architecture.
export function exteriorSafety(position,presence,front,headClearance,handClearance,scratch){
  if(presence.active){
    scratch.subVectors(position,presence.head)
    if(scratch.length()<headClearance){if(scratch.lengthSq()<1e-8)scratch.set(0,0,-1);position.copy(presence.head).addScaledVector(scratch,headClearance/scratch.length())}
    for(const hand of presence.hands)if(hand.tracked){
      scratch.subVectors(position,hand.position)
      if(scratch.length()<handClearance){if(scratch.lengthSq()<1e-8)scratch.set(0,0,-1);position.copy(hand.position).addScaledVector(scratch,handClearance/scratch.length())}
    }
  }
  position.z=Math.min(front,position.z)
}
