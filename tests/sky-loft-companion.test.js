import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {COMPANION_SETTINGS as C,COMPANION_STATES,createCompanionMotion} from '../src/games/sky-loft/companion-motion.js'
import {createCompanion} from '../src/games/sky-loft/companion.js'
const bytes=readFileSync(new URL('../public/models/sky-loft/bichon/bichon.glb',import.meta.url))
const asset=()=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')

test('M3 GLB: seven skinned meshes, 27 bones, three materials, required clips and real scale',async()=>{
 const g=await asset(),meshes=[],materials=new Set()
 g.scene.traverse(o=>{if(o.isMesh){meshes.push(o);materials.add(o.material);assert.ok(o.isSkinnedMesh);assert.equal(o.skeleton.bones.length,27)}})
 assert.equal(meshes.length,7);assert.equal(materials.size,3)
 assert.equal(meshes.reduce((n,m)=>n+m.geometry.index.count/3,0),23088)
 assert.deepEqual(g.animations.map(c=>c.name).sort(),['HappyHop','Idle','StandUp','Trot'])
 const size=new THREE.Box3().setFromObject(g.scene,true).getSize(new THREE.Vector3())
 assert.ok(size.y>.41&&size.y<.43);assert.equal(C.maxCount,1)
 assert.deepEqual(Object.fromEntries(g.animations.map(c=>[c.name,Number(c.duration.toFixed(3))])),{HappyHop:1.6,Idle:4,StandUp:2.8,Trot:.8})
 assert.ok(g.scene.getObjectByName('shoulder_R_deform'));assert.ok(g.scene.getObjectByName('shoulder_L_deform'))
 for(const m of meshes){
  assert.equal(m.geometry.attributes.skinWeight.itemSize,4)
  for(let i=0;i<m.geometry.attributes.skinWeight.count;i++){
   let sum=0;for(let j=0;j<4;j++){sum+=m.geometry.attributes.skinWeight.getComponent(i,j);assert.ok(m.geometry.attributes.skinIndex.getComponent(i,j)<27)}
   assert.ok(Math.abs(sum-1)<1e-6)
  }
  assert.equal(m.material.map,null)
 }
 const mixer=new THREE.AnimationMixer(g.scene)
 for(const clip of g.animations){
  mixer.stopAllAction();mixer.clipAction(clip).play()
  for(let i=0;i<=20;i++){
   mixer.setTime(clip.duration*i/20);g.scene.updateMatrixWorld(true)
   const b=new THREE.Box3().setFromObject(g.scene,true)
   assert.ok(b.min.y>-.003);assert.ok(b.max.y<(clip.name==='StandUp'?.63:.46));assert.ok(b.max.x-b.min.x<.24)
  }
 }
 mixer.stopAllAction();mixer.clipAction(g.animations.find(c=>c.name==='HappyHop')).reset().play();mixer.setTime(.736);g.scene.updateMatrixWorld(true)
 assert.ok(new THREE.Box3().setFromObject(g.scene,true).min.y>.02)
})

test('deterministic wander, approach, happy, departure stay inside clear floor and outside user radius',()=>{
 const m=createCompanionMotion(),head={x:0,z:0},seen=new Set()
 for(let i=0;i<18000;i++){
  m.update(1/60,head);seen.add(m.state)
  assert.ok(m.position.x>=C.bounds.minX&&m.position.x<=C.bounds.maxX)
  assert.ok(m.position.z>=C.bounds.minZ&&m.position.z<=C.bounds.maxZ)
  assert.ok(Math.hypot(m.position.x,m.position.z)>=C.stopDistance-.003)
 }
 assert.deepEqual([...seen].sort(),COMPANION_STATES.filter(s=>s!=='PET_REACTION').sort())
 m.reset();assert.equal(m.state,'IDLE');assert.deepEqual([m.position.x,m.position.z],C.anchors[0])
 const p={...m.position};m.dispose();m.update(.05,head);assert.deepEqual(m.position,p)
})

test('outside-room user never pulls dog outside safe region; bounded time delta',()=>{
 const m=createCompanionMotion()
 for(let i=0;i<8000;i++)m.update(.05,{x:20,z:20})
 assert.notEqual(m.state,'APPROACH_USER');assert.ok(m.position.x<=C.bounds.maxX)
 const p={...m.position};m.update(100,{x:0,z:0});assert.ok(Math.hypot(m.position.x-p.x,m.position.z-p.z)<=C.speed*.05+.0001)
})

test('single load/instance across resets; pause freezes; disposal removes model and skeleton resources',async()=>{
 const root=new THREE.Group();let done,loads=0
 const c=createCompanion(root,{load(path,ok){assert.equal(path,C.modelSrc);loads++;done=ok}})
 c.load();c.load();const g=await asset();done(g)
 assert.equal(c.stats().companionCount,1);assert.equal(loads,1)
 const head=new THREE.Vector3(0,1.6,0)
 c.update(0,head,true);c.update(16,head,true)
 assert.ok(root.children[0].visible)
 c.update(32,head,false);assert.equal(root.children[0].visible,false)
 for(let i=0;i<5;i++){c.reset();c.load();c.update(100+i,head,true)}
 assert.equal(loads,1);assert.equal(c.stats().companionCount,1)
 let released=0;g.scene.traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>released++)})
 c.dispose();c.dispose();assert.equal(root.children.length,0);assert.equal(released,7)
 assert.equal(c.stats().companionCount,0)
})

test('late model after exit is released, never attached; missing file is nonfatal',async()=>{
 let done,fail;const parent=new THREE.Group()
 const c=createCompanion(parent,{load(p,ok,progress,error){done=ok;fail=error}})
 c.load();c.dispose();const g=await asset();let released=0
 g.scene.traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>released++)})
 done(g);assert.equal(parent.children.length,0);assert.equal(released,7)
 const d=createCompanion(parent,{load(p,ok,progress,error){fail=error}});d.load();fail()
 assert.match(d.stats().companionError,/unavailable/);d.dispose()
})

test('actual Sky Loft XR entry/exit/re-entry reuses one dog and follows room-local headset pose',async()=>{
 const {createSkyLoft}=await import('../src/games/sky-loft/index.js')
 globalThis.window={innerWidth:1000,innerHeight:800}
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})}
 class AudioStub extends EventTarget {paused=true;currentTime=0;pause(){this.paused=true}load(){}removeAttribute(){}getAttribute(){return null}}
 let load,requests=0
 const game=createSkyLoft({companionLoader:{load(p,ok){requests++;load=ok}},environmentLoader:{load(){return new THREE.Texture()}},audioFactory:()=>new AudioStub()})
 const origin=new THREE.Group();origin.position.set(2,1.6,1)
 const state={origin,session:Object.assign(new EventTarget(),{visibilityState:'visible'}),renderer:{xr:{getReferenceSpace:()=>({})}},interaction:{addTarget(){return()=>{}}}}
 const frame={getViewerPose:()=>({transform:{position:{x:0,y:0,z:0},orientation:{x:0,y:0,z:0,w:1}}})}
 game.xrHooks.onEnter(state);game.update(0,frame);load(await asset())
 for(let i=1;i<1200;i++)game.update(i*16,frame)
 assert.equal(game.getDebugState().companionCount,1)
 game.xrHooks.onExit();game.xrHooks.onEnter(state);game.update(20000,frame);game.update(20016,frame)
 assert.equal(requests,1);assert.equal(game.getDebugState().companionCount,1)
 game.xrHooks.dispose();assert.equal(game.getDebugState().companionCount,0)
})


test('pet interrupts calmly, cooldown blocks repeats, then safe approach tracks relocated user',()=>{
 const m=createCompanionMotion(),head={x:0,z:0}
 assert.ok(m.pet(head));assert.equal(m.state,'PET_REACTION');assert.equal(m.moving,false)
 const initial={...m.position}
 for(let i=0;i<59;i++){assert.equal(m.pet(head),false);m.update(.05,head)}
 assert.deepEqual(m.position,initial)
 assert.ok(Math.abs(m.yaw-Math.atan2(m.position.x,m.position.z))<1e-8)
 head.x=.6;head.z=.3
 for(let i=0;i<1000&&m.state!=='HAPPY';i++)m.update(.05,head)
 assert.equal(m.state,'HAPPY');assert.ok(Math.abs(Math.hypot(m.position.x-head.x,m.position.z-head.z)-C.stopDistance)<.04)
 assert.ok(m.pet(head));m.cancelPet();assert.equal(m.state,'IDLE')
 m.reset();assert.ok(m.pet({x:20,z:20}))
 for(let i=0;i<65;i++)m.update(.05,{x:20,z:20})
 assert.equal(m.state,'IDLE');assert.deepEqual(m.position,initial)
})

async function petHarness(blockers=[]){
 const root=new THREE.Group(),targets=[];let ready,greetings=0,activated=0
 const c=createCompanion(root,{load(p,ok){ready=ok}},()=>greetings++)
 const interaction={addTarget(object,select,options){const t={object,select,options};targets.push(t);return()=>{const i=targets.indexOf(t);if(i>=0)targets.splice(i,1)}}}
 c.load();const g=await asset();ready(g)
 const head=new THREE.Vector3(0,1.6,0)
 c.bind(interaction,()=>true,blockers,()=>activated++);c.update(0,head,true);root.updateMatrixWorld(true)
 return {c,g,root,head,targets,interaction,greetings:()=>greetings,activated:()=>activated}
}

test('one forgiving ray target, furniture/UI occlusion, select cooldown and no held-trigger polling',async()=>{
 const block=new THREE.Mesh(new THREE.BoxGeometry(1,1,.1),new THREE.MeshBasicMaterial())
 const h=await petHarness([block]),t=h.targets[0],center=t.object.getWorldPosition(new THREE.Vector3())
 const ray=new THREE.Raycaster(center.clone().add(new THREE.Vector3(0,0,2)),new THREE.Vector3(0,0,-1),0,5)
 block.position.set(20,20,20)
 assert.equal(ray.intersectObject(t.object,false).length,1)
 block.position.copy(center).add(new THREE.Vector3(0,0,1))
 assert.equal(ray.intersectObject(t.object,false).length,0)
 block.position.set(20,20,20)
 t.select();assert.equal(h.c.stats().companionState,'PET_REACTION')
 for(let i=0;i<10;i++)t.select()
 assert.equal(h.c.stats().companionPets,1)
 for(let i=1;i<180;i++)h.c.update(i*20,h.head,true)
 assert.equal(h.c.stats().companionPets,1);assert.equal(h.greetings(),1)
 t.select();h.c.update(3600,h.head,true)
 assert.equal(h.c.stats().companionPets,2);assert.equal(h.greetings(),2)
 assert.equal(h.c.stats().companionCount,1);assert.ok(h.activated()>0)
 h.c.bind(h.interaction,()=>true,[],()=>{});assert.equal(h.targets.length,1)
 h.c.reset();assert.equal(h.targets.length,0);assert.equal(t.options.enabled(),false)
 h.c.dispose();block.geometry.dispose();block.material.dispose()
})

test('real tail overlay is bounded and restored on interruption; approved skin and HappyHop stay healthy',async()=>{
 const h=await petHarness(),tail=h.g.scene.getObjectByName('tail_0'),q=new THREE.Quaternion()
 h.targets[0].select()
 let maximum=0
 // Sample full pet cycles, stripping the overlay on interruption to measure its exact contribution.
 for(let sample=1;sample<=8;sample++){
   h.c.reset();h.c.bind(h.interaction,()=>true);h.c.update(0,h.head,true);h.targets[0].select()
   for(let i=1;i<=sample*15;i++)h.c.update(i*20,h.head,true)
   q.copy(tail.quaternion);h.root.updateMatrixWorld(true)
   const bounds=new THREE.Box3().setFromObject(h.g.scene,true)
   assert.ok(bounds.min.y>-.005);assert.ok(bounds.max.y<.47)
   h.c.update(sample*300+1,null,false)
   maximum=Math.max(maximum,q.angleTo(tail.quaternion))
   assert.ok(q.angleTo(tail.quaternion)<=.160001)
   q.copy(tail.quaternion);h.c.update(sample*300+2,null,false);assert.ok(q.angleTo(tail.quaternion)<1e-7)
   assert.equal(h.c.stats().companionState,'IDLE')
 }
 assert.ok(maximum>.06);h.c.dispose();assert.equal(h.targets.length,0)
})


test('pet alternates HappyHop and StandUp; planted orientation, completion and interruption remain safe',async()=>{
 const h=await petHarness();h.head.set(2.45,1.6,1.05)
 let time=0
 h.c.update(time,h.head,true)
 for(const expected of ['HappyHop','StandUp','HappyHop','StandUp']){
  h.targets[0].select();const pets=h.c.stats().companionPets
  const seen=new Set();let lockedYaw
  for(let i=1;i<=180;i++){
   time+=20;h.c.update(time,h.head,true);seen.add(h.c.stats().companionAnimation)
   if(i<100)h.targets[0].select() // rejected repeats during cooldown
   if(expected==='StandUp'&&i===20)lockedYaw=h.root.children[0].rotation.y
   if(expected==='StandUp'&&i>20&&i<125){
    h.head.z+=.001
    assert.ok(Math.abs(h.root.children[0].rotation.y-lockedYaw)<1e-10)
   }
  }
  assert.equal(h.c.stats().companionPets,pets)
  assert.ok(seen.has(expected));assert.equal(h.c.stats().companionPetReaction,expected)
  assert.notEqual(h.c.stats().companionState,'PET_REACTION')
  assert.notEqual(h.c.stats().companionAnimation,'StandUp')
  assert.equal(h.c.stats().companionCount,1)
 }
 assert.equal(h.greetings(),4)
 // Interrupt a new StandUp while upright, then recover without reloading.
 h.targets[0].select();for(let i=0;i<180;i++){time+=20;h.c.update(time,h.head,true)}
 h.targets[0].select();for(let i=0;i<60;i++){time+=20;h.c.update(time,h.head,true)}
 assert.equal(h.c.stats().companionAnimation,'StandUp')
 h.c.update(time+1,null,false);assert.equal(h.c.stats().companionAnimation,null)
 h.c.update(time+20,h.head,true);assert.equal(h.c.stats().companionAnimation,'Idle')
 h.c.reset();h.c.bind(h.interaction,()=>true);h.c.update(0,h.head,true);h.targets[0].select();h.c.update(20,h.head,true)
 assert.equal(h.c.stats().companionPetReaction,'HappyHop');assert.equal(h.targets.length,1)
 h.c.dispose()
})
