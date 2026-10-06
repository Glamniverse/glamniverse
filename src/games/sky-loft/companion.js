import * as THREE from 'three'
import { createAffection } from './companion-affection.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { COMPANION_SETTINGS as C, createCompanionMotion } from './companion-motion.js'

// Companion owns its loaded resources, including skeleton textures, and removes
// its group before the shared world disposer runs. Late loads are also released.
function release(model){
  const resources=new Set()
  model.traverse(o=>{
    if(o.geometry)resources.add(o.geometry)
    if(o.skeleton)resources.add(o.skeleton)
    const materials=o.material?(Array.isArray(o.material)?o.material:[o.material]):[]
    for(const m of materials){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v)}
  })
  resources.forEach(r=>r.dispose())
}
export function createCompanion(parent,loader=new GLTFLoader(),onGreeting=()=>{}) {
  const group=new THREE.Group();group.name='SkyLoft_Bichon';group.visible=false;parent.add(group)
  const affection=createAffection(),motor=createCompanionMotion(),localHead=new THREE.Vector3(),dogWorld=new THREE.Vector3()
  let disposed=false,requested=false,model=null,mixer=null,last=null,current=null,previousState=null,error=null,triangles=0,draws=0
  const actions={}
  // One invisible, forgiving target; no raycasts against the 23k-triangle skin.
  const hit=new THREE.Mesh(new THREE.BoxGeometry(.42,.52,.72),new THREE.MeshBasicMaterial({visible:false}))
  hit.name='SkyLoft_Bichon_Pet';hit.position.y=.26;group.add(hit)
  const rawRaycast=hit.raycast,hitTests=[],blocked=[]
  let unregister=null,occluders=[],ready=false,tail=null,tailApplied=false,petCount=0
  let nextStandUp=false,petReaction='HappyHop',standFacing=0,standPending=false
  const tailBase=new THREE.Quaternion(),wag=new THREE.Quaternion(),wagAxis=new THREE.Vector3(0,0,1)
  function restoreTail(){if(tailApplied){tail.quaternion.copy(tailBase);tailApplied=false}}
  hit.raycast=function(raycaster,results){
    if(!ready||!group.visible)return
    hitTests.length=0;rawRaycast.call(this,raycaster,hitTests)
    if(!hitTests.length)return
    for(const object of occluders)object.updateWorldMatrix(true,false)
    blocked.length=0;raycaster.intersectObjects(occluders,false,blocked)
    if(blocked.length&&blocked[0].distance<hitTests[0].distance)return
    results.push(hitTests[0])
  }
  const unbind=()=>{unregister?.();unregister=null;ready=false;restoreTail();motor.cancelPet();standPending=false;mixer?.stopAllAction();current=null}

  const animate=name=>{
    const next=actions[name];if(!next||next===current)return
    next.reset().setEffectiveWeight(1).fadeIn(.18).play()
    if(current)current.fadeOut(.18)
    current=next
  }
  const reset=()=>{unbind();affection.reset();motor.reset();nextStandUp=false;petReaction='HappyHop';last=null;previousState=null;group.visible=false;mixer?.stopAllAction();current=null}
  return {
    bind(interaction,enabled,blockers=[],activate=()=>{}){
      unbind();occluders=blockers
      unregister=interaction.addTarget(hit,()=>{
        if(!enabled()||!ready||!group.visible)return
        activate()
        if(motor.pet(localHead)){
          petCount++;petReaction=nextStandUp?'StandUp':'HappyHop';nextStandUp=!nextStandUp
          standFacing=motor.yaw
        }
      },{owned:false,enabled:()=>enabled()&&ready&&group.visible,onHover:()=>{}})
    },
    unbind,
    load(){
      if(disposed||requested)return
      requested=true
      loader.load(C.modelSrc,gltf=>{
        if(disposed){release(gltf.scene);return}
        const names=new Set(gltf.animations.map(c=>c.name))
        if(!['Idle','Trot','HappyHop','StandUp'].every(n=>names.has(n))){error='Missing companion animations';release(gltf.scene);return}
        model=gltf.scene;model.rotation.y=Math.PI // glTF dog faces +Z; loft movement uses -Z
        model.traverse(o=>{if(o.isMesh){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false}})
        tail=model.getObjectByName('tail_0');group.add(model);mixer=new THREE.AnimationMixer(model)
        for(const clip of gltf.animations){actions[clip.name]=mixer.clipAction(clip)}
        for(const name of ['HappyHop','StandUp']){actions[name].setLoop(THREE.LoopOnce,1);actions[name].clampWhenFinished=true}
      },undefined,()=>{if(!disposed)error='Bichon unavailable; loft remains usable'})
    },
    reset,
    getWorldPosition(out){group.getWorldPosition(out);out.y+=.3;return Boolean(model&&group.visible)},
    update(time,headWorld,enabled){
      if(disposed)return
      if(!enabled||!model||!headWorld||!Number.isFinite(time)){group.visible=false;ready=false;last=null;restoreTail();motor.cancelPet();affection.cancel();previousState=null;if(current===actions.StandUp||standPending){mixer?.stopAllAction();current=null}standPending=false;return}
      ready=true;restoreTail()
      localHead.copy(headWorld);parent.worldToLocal(localHead)
      const dt=last===null?0:Math.min(.05,Math.max(0,(time-last)/1000));last=time
      motor.update(dt,localHead);group.position.set(motor.position.x,0,motor.position.z)
      group.visible=Math.hypot(group.position.x-localHead.x,group.position.z-localHead.z)>=C.hideDistance
      const standing=motor.state==='PET_REACTION'&&petReaction==='StandUp'
      // Orient during the first 180 ms while still on four paws, then hold the
      // world yaw so head movement cannot slide the planted hind paws.
      if(!standing||standPending||motor.petElapsed<=.18){
        let turn=(standing?standFacing:motor.yaw)-group.rotation.y
        turn=Math.atan2(Math.sin(turn),Math.cos(turn))
        const blend=standing?Math.min(1,dt/Math.max(dt,.18-motor.petElapsed+dt)):Math.min(1,dt*5)
        group.rotation.y+=turn*blend
      }
      const happy=motor.state==='HAPPY'||motor.state==='PET_REACTION'
      if(happy&&previousState!==motor.state){
        const name=motor.state==='PET_REACTION'?petReaction:'HappyHop'
        standPending=name==='StandUp'
        if(standPending)animate('Idle')
        else if(current===actions[name])current.reset().play()
        else animate(name)
        group.getWorldPosition(dogWorld);dogWorld.y+=.3;onGreeting(time/1000,dogWorld,motor.state)
        if(motor.state==='PET_REACTION')affection.pet()
      }else if(!happy){standPending=false;animate(motor.moving?'Trot':'Idle')}
      if(standPending&&motor.petElapsed>=.18){animate('StandUp');standPending=false}
      if(happy&&!standPending&&(current===actions.HappyHop||current===actions.StandUp)&&current.time>=current.getClip().duration)animate('Idle')
      if(affection.update(dt,localHead,motor.position,motor.state==='PET_REACTION')){group.getWorldPosition(dogWorld);dogWorld.y+=.3;onGreeting(time/1000,dogWorld,'whimper')}
      previousState=motor.state;mixer.update(dt)
      if(tail&&motor.state==='PET_REACTION'&&petReaction==='HappyHop'){
        const t=motor.petElapsed,envelope=Math.min(1,t/.3,(C.petDuration-t)/.5)
        tailBase.copy(tail.quaternion)
        wag.setFromAxisAngle(wagAxis,Math.sin(t*Math.PI*3)*.16*Math.max(0,envelope))
        tail.quaternion.multiply(wag);tailApplied=true
      }
    },
    stats:()=>({companionPetTargets:unregister?1:0,companionPetReaction:petReaction,companionAnimation:current?.getClip().name??null,companionPets:petCount,companionTailWag:Boolean(tail),companionLoaded:Boolean(model),companionCount:model?1:0,companionState:motor.state,companionError:error,companionDraws:draws,companionTriangles:triangles}),
    dispose(){if(disposed)return;reset();disposed=true;motor.dispose();if(mixer){mixer.stopAllAction();mixer.uncacheRoot(model)}if(model)release(model);hit.geometry.dispose();hit.material.dispose();occluders=[];group.removeFromParent();model=null;mixer=null},
  }
}
