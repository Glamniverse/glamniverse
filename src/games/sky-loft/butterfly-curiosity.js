import * as THREE from 'three'

export const CURIOSITY = Object.freeze({radius:1.8,releaseRadius:2.1,fastSpeed:1.3,
  fastCooldown:1.5,followSpeed:.55,releaseSeconds:1.6,headClearance:.8})
// Loft-local near passes: no furniture changes, no controller-following ambient anchor.
const perches=[[-.7,1.5,-1.35],[.7,1.65,-1.5],[-1.15,1.8,-1.6],[1.15,1.55,-1.65]]
const offsets=[[0,.11,0],[-.25,.18,-.1],[.24,.22,-.08],[.03,.32,-.13]]
const ease=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t)}

// Positions only; the existing two InstancedMeshes still own all rendering.
export function createButterflyCuriosity(parent){
  const hands=Array.from({length:2},()=>({position:new THREE.Vector3(),previous:new THREE.Vector3(),
    world:new THREE.Vector3(),valid:false,tracked:false,blocked:0}))
  const states=perches.map(()=>({position:new THREE.Vector3(),ready:false,hand:-1,weight:0,recovering:false}))
  const head=new THREE.Vector3(),target=new THREE.Vector3(),delta=new THREE.Vector3(),away=new THREE.Vector3()
  let xr=false,disposed=false
  function reset(){xr=false;for(const h of hands){h.valid=false;h.tracked=false;h.blocked=0}
    for(const s of states){s.ready=false;s.hand=-1;s.weight=0;s.recovering=false}}
  return {
    reset,
    begin(dt,input){
      if(disposed)return
      xr=Boolean(input?.head&&input?.controllers)
      if(xr){head.copy(input.head);parent.worldToLocal(head)}
      for(let i=0;i<2;i++){
        const h=hands[i],entry=input?.controllers?.[i],controller=(entry?.grip?.visible?entry.grip:entry?.controller)
        h.valid=false;h.blocked=Math.max(0,h.blocked-dt)
        if(!xr||!entry?.connected||!entry.controller?.visible||!controller?.getWorldPosition){h.tracked=false;continue}
        controller.updateWorldMatrix(true,false);controller.getWorldPosition(h.world)
        if(!Number.isFinite(h.world.x+h.world.y+h.world.z)){h.tracked=false;continue}
        if(h.tracked&&dt>0&&h.world.distanceTo(h.previous)/dt>CURIOSITY.fastSpeed)h.blocked=CURIOSITY.fastCooldown
        h.previous.copy(h.world);h.tracked=true;h.position.copy(h.world);parent.worldToLocal(h.position)
        h.valid=h.blocked===0&&h.position.distanceTo(head)>=.55
      }
      xr=xr&&(hands[0].tracked||hands[1].tracked)
    },
    step(i,ambient,phase,elapsed,dt,out){
      const s=states[i]
      if(disposed){out.copy(ambient);return false}
      if(!s.ready){s.position.copy(ambient);s.ready=true}
      // A slow scheduled pass makes the small curiosity radius reachable without chasing.
      target.copy(ambient)
      if(xr){
        const pass=ease((phase-3)/8)*(1-ease((phase-19)/8))
        away.set(...perches[i]);away.x+=.16*Math.sin(elapsed*.65+i);away.y+=.08*Math.sin(elapsed+i)
        target.lerp(away,pass)
      }
      let hand=s.hand
      if(hand>=0&&(!hands[hand].valid||s.position.distanceTo(hands[hand].position)>CURIOSITY.releaseRadius))hand=-1
      if(hand<0){
        let nearest=CURIOSITY.radius
        for(let j=0;j<hands.length;j++)if(hands[j].valid){
          const distance=s.position.distanceTo(hands[j].position)
          if(distance<nearest){nearest=distance;hand=j}
        }
      }
      if(s.hand>=0&&hand<0)s.recovering=true
      if(hand>=0)s.recovering=false
      s.hand=hand
      s.weight+=(Number(hand>=0)-s.weight)*(1-Math.exp(-dt/(hand>=0?.65:CURIOSITY.releaseSeconds)))
      if(hand>=0){
        away.copy(hands[hand].position)
        away.x+=offsets[i][0]+.015*Math.sin(elapsed*1.7+i)
        away.y+=offsets[i][1]+.012*Math.sin(elapsed*2+i)
        away.z+=offsets[i][2]+.015*Math.cos(elapsed*1.3+i)
        target.copy(away)
      }
      if(xr||s.recovering||s.weight>.001){
        delta.subVectors(target,s.position)
        const speed=hand>=0?CURIOSITY.followSpeed:s.recovering||s.weight>.001?1:Math.min(6,Math.max(1,s.position.distanceTo(head)-2))
        const length=delta.length(),step=Math.min(length*(1-Math.exp(-dt/ .55)),speed*dt)
        if(length>0)s.position.addScaledVector(delta,step/length)
        if(xr){
          away.subVectors(s.position,head)
          if(away.length()<CURIOSITY.headClearance){
            if(away.lengthSq()<.000001)away.set(0,0,-1)
            s.position.copy(head).addScaledVector(away,CURIOSITY.headClearance/away.length())
          }
        }
        if(hand<0&&s.position.distanceTo(target)<.05)s.recovering=false
        out.copy(s.position)
      }else{s.position.copy(ambient);out.copy(ambient)}
      return hand>=0||s.recovering||s.weight>.01
    },
    stats:()=>({curiousButterflies:states.filter(s=>s.hand>=0).length}),
    dispose(){reset();disposed=true},
  }
}
