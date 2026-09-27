import * as THREE from 'three'
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
  const motor=createCompanionMotion(),localHead=new THREE.Vector3(),dogWorld=new THREE.Vector3()
  let disposed=false,requested=false,model=null,mixer=null,last=null,current=null,previousState=null,error=null,triangles=0,draws=0
  const actions={}
  const animate=name=>{
    const next=actions[name];if(!next||next===current)return
    next.reset().setEffectiveWeight(1).fadeIn(.18).play()
    if(current)current.fadeOut(.18)
    current=next
  }
  const reset=()=>{motor.reset();last=null;previousState=null;group.visible=false;mixer?.stopAllAction();current=null}
  return {
    load(){
      if(disposed||requested)return
      requested=true
      loader.load(C.modelSrc,gltf=>{
        if(disposed){release(gltf.scene);return}
        const names=new Set(gltf.animations.map(c=>c.name))
        if(!['Idle','Trot','HappyHop'].every(n=>names.has(n))){error='Missing companion animations';release(gltf.scene);return}
        model=gltf.scene;model.rotation.y=Math.PI // glTF dog faces +Z; loft movement uses -Z
        model.traverse(o=>{if(o.isMesh){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false}})
        group.add(model);mixer=new THREE.AnimationMixer(model)
        for(const clip of gltf.animations){actions[clip.name]=mixer.clipAction(clip)}
        actions.HappyHop.setLoop(THREE.LoopOnce,1);actions.HappyHop.clampWhenFinished=true
      },undefined,()=>{if(!disposed)error='Bichon unavailable; loft remains usable'})
    },
    reset,
    getWorldPosition(out){group.getWorldPosition(out);out.y+=.3;return Boolean(model&&group.visible)},
    update(time,headWorld,enabled){
      if(disposed)return
      if(!enabled||!model||!headWorld||!Number.isFinite(time)){group.visible=false;last=null;return}
      localHead.copy(headWorld);parent.worldToLocal(localHead)
      const dt=last===null?0:Math.min(.05,Math.max(0,(time-last)/1000));last=time
      motor.update(dt,localHead);group.position.set(motor.position.x,0,motor.position.z)
      group.visible=Math.hypot(group.position.x-localHead.x,group.position.z-localHead.z)>=C.hideDistance
      let turn=motor.yaw-group.rotation.y;turn=Math.atan2(Math.sin(turn),Math.cos(turn))
      group.rotation.y+=turn*Math.min(1,dt*5)
      if(motor.state==='HAPPY'&&previousState!=='HAPPY'){animate('HappyHop');group.getWorldPosition(dogWorld);dogWorld.y+=.3;onGreeting(time/1000,dogWorld)}
      else if(motor.state!=='HAPPY')animate(motor.moving?'Trot':'Idle')
      else if(current===actions.HappyHop&&current.time>=current.getClip().duration)animate('Idle')
      previousState=motor.state;mixer.update(dt)
    },
    stats:()=>({companionLoaded:Boolean(model),companionCount:model?1:0,companionState:motor.state,companionError:error,companionDraws:draws,companionTriangles:triangles}),
    dispose(){if(disposed)return;reset();disposed=true;motor.dispose();if(mixer){mixer.stopAllAction();mixer.uncacheRoot(model)}if(model)release(model);group.removeFromParent();model=null;mixer=null},
  }
}
