import * as THREE from 'three'
import {createFaunaPresence,smooth,follow,exteriorSafety} from './fauna-presence.js'

export const RESONANCE=Object.freeze({radius:1.8,releaseRadius:2.3,limit:2,verticalSpeed:.18,
  horizontalSpeed:.06,damping:2.2,headClearance:1.4,handClearance:.85,front:-6.9})
export function createJellyfishResonance(parent){
  const presence=createFaunaPresence(parent),states=Array.from({length:12},()=>({position:new THREE.Vector3(),
    anchor:new THREE.Vector3(),ready:false,hand:-1,returning:false,strength:0}))
  const target=new THREE.Vector3(),near=new THREE.Vector3(),scratch=new THREE.Vector3()
  let engaged=0
  return {
    begin(dt,input){presence.begin(dt,input);engaged=0;for(const s of states)if(s.hand>=0)engaged++},
    reset(){presence.reset();engaged=0;for(const s of states){s.ready=false;s.hand=-1;s.returning=false;s.strength=0}},
    step(i,ambient,time,dt,out){
      const s=states[i],c=RESONANCE
      if(!s.ready){s.position.copy(ambient);s.ready=true}
      target.copy(ambient)
      // Two ambassadors make occasional near passes. Ten distant residents stay ambient.
      if(presence.active&&i<2){
        const phase=(time+i*12)%64,pass=smooth((phase-4)/14)*(1-smooth((phase-42)/18))
        near.set(i?1.6:-1.6,2.45+.08*Math.sin(time*.4+i),c.front-.15)
        target.lerp(near,pass)
      }
      if(s.hand>=0&&(!presence.hands[s.hand].valid||s.position.distanceTo(presence.hands[s.hand].position)>c.releaseRadius)){
        s.hand=-1;s.returning=true;engaged--
      }
      if(s.hand<0&&i<2&&engaged<c.limit){
        const hand=presence.nearest(s.position,c.radius)
        if(hand>=0){s.hand=hand;s.anchor.copy(s.position);s.returning=false;engaged++}
      }
      if(s.hand>=0){
        const h=presence.hands[s.hand].position
        target.set(THREE.MathUtils.clamp(h.x+(i?.3:-.3),s.anchor.x-.35,s.anchor.x+.35),
          THREE.MathUtils.clamp(h.y+.9,2.1,4.2),Math.min(c.front,THREE.MathUtils.clamp(h.z-1,s.anchor.z-.25,s.anchor.z+.25)))
        const factor=1-Math.exp(-dt/c.damping)
        s.position.y+=THREE.MathUtils.clamp((target.y-s.position.y)*factor,-c.verticalSpeed*dt,c.verticalSpeed*dt)
        target.y=s.position.y;follow(s.position,target,dt,c.horizontalSpeed,c.damping,scratch)
      }else if((presence.active&&i<2)||s.returning){
        follow(s.position,target,dt,s.returning?.4:.65,2,scratch)
        if(s.position.distanceTo(target)<.05)s.returning=false
      }else s.position.copy(ambient)
      if(i<2&&(presence.active||s.returning))exteriorSafety(s.position,presence,c.front,c.headClearance,c.handClearance,scratch)
      s.strength+=(Number(s.hand>=0)-s.strength)*(1-Math.exp(-dt/2))
      out.copy(s.position);return s.strength
    },
    stats:()=>({resonatingJellyfish:engaged}),
  }
}
