import * as THREE from 'three'
import {createFaunaPresence,smooth,follow,exteriorSafety} from './fauna-presence.js'

export const MANTA_CURIOSITY=Object.freeze({radius:3.2,releaseRadius:4.2,duration:3.5,cooldown:18,
  headClearance:2.5,handClearance:2.3,front:-8.5})
export function createMantaCuriosity(parent){
  const presence=createFaunaPresence(parent),states=Array.from({length:2},()=>({position:new THREE.Vector3(),
    anchor:new THREE.Vector3(),ready:false,hand:-1,age:0,cooldown:0,returning:false,pulse:0}))
  const target=new THREE.Vector3(),scratch=new THREE.Vector3(),near=new THREE.Vector3()
  return {
    begin:(dt,input)=>presence.begin(dt,input),
    reset(){presence.reset();for(const s of states){s.ready=false;s.hand=-1;s.age=0;s.cooldown=0;s.returning=false;s.pulse=0}},
    step(i,ambient,phase,dt,out){
      const s=states[i],c=MANTA_CURIOSITY
      if(!s.ready){s.position.copy(ambient);s.ready=true}
      s.cooldown=Math.max(0,s.cooldown-dt);target.copy(ambient)
      if(presence.active){
        const pass=smooth((phase-9)/7)*(1-smooth((phase-27)/8)),u=THREE.MathUtils.clamp((phase-16)/11,0,1)
        near.set((i?1:-1)*(4-8*u),2.15+.2*Math.sin(u*Math.PI),c.front-.3*Math.sin(u*Math.PI))
        target.lerp(near,pass);target.z=Math.min(c.front,target.z)
      }
      if(s.hand>=0){
        s.age+=dt
        const hand=presence.hands[s.hand]
        if(!hand.valid||s.age>=c.duration||s.position.distanceTo(hand.position)>c.releaseRadius){s.hand=-1;s.cooldown=c.cooldown;s.returning=true}
      }else if(s.cooldown===0&&presence.active&&phase>15&&phase<28){
        const hand=presence.nearest(s.position,c.radius)
        if(hand>=0){s.hand=hand;s.age=0;s.anchor.copy(presence.hands[hand].position);s.returning=false}
      }
      if(s.hand>=0){
        // Capture once. The manta investigates an arc, never follows the hand.
        const angle=-Math.PI/2+s.age/c.duration*Math.PI
        target.copy(s.anchor);target.x+=(i?1:-1)*1.25*Math.sin(angle)
        target.y+=.6+.15*Math.sin(angle+Math.PI/2);target.z-=2.7+.25*Math.cos(angle)
        target.z=Math.min(c.front,target.z)
      }
      const desired=s.hand>=0?Math.sin(Math.PI*s.age/c.duration):0
      s.pulse+=(desired-s.pulse)*(1-Math.exp(-dt/.4))
      if(presence.active||s.returning){
        follow(s.position,target,dt,s.hand>=0?1.1:s.returning?1.4:5,.65,scratch)
        exteriorSafety(s.position,presence,c.front,c.headClearance,c.handClearance,scratch)
        if(s.hand<0&&s.position.distanceTo(target)<.05)s.returning=false
      }else s.position.copy(ambient)
      out.copy(s.position);return s.pulse
    },
    stats:()=>({curiousMantas:states.filter(s=>s.hand>=0).length}),
  }
}
