import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {COMPANION_SETTINGS as C,COMPANION_STATES,createCompanionMotion} from '../src/games/sky-loft/companion-motion.js'
import {createCompanion} from '../src/games/sky-loft/companion.js'
const bytes=readFileSync(new URL('../public/models/sky-loft/bichon/bichon.glb',import.meta.url))
const asset=()=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')

test('original GLB: seven skinned meshes, 25 bones, three materials, required clips and real scale',async()=>{
 const g=await asset(),meshes=[],materials=new Set()
 g.scene.traverse(o=>{if(o.isMesh){meshes.push(o);materials.add(o.material);assert.ok(o.isSkinnedMesh);assert.equal(o.skeleton.bones.length,25)}})
 assert.equal(meshes.length,7);assert.equal(materials.size,3)
 assert.equal(meshes.reduce((n,m)=>n+m.geometry.index.count/3,0),23088)
 assert.deepEqual(g.animations.map(c=>c.name).sort(),['HappyHop','Idle','Trot'])
 const size=new THREE.Box3().setFromObject(g.scene,true).getSize(new THREE.Vector3())
 assert.ok(size.y>.41&&size.y<.43);assert.equal(C.maxCount,1)
 const mixer=new THREE.AnimationMixer(g.scene)
 for(const clip of g.animations){
  mixer.stopAllAction();mixer.clipAction(clip).play()
  for(let i=0;i<=20;i++){
   mixer.setTime(clip.duration*i/20);g.scene.updateMatrixWorld(true)
   const b=new THREE.Box3().setFromObject(g.scene,true)
   assert.ok(b.min.y>-.003);assert.ok(b.max.y<.46);assert.ok(b.max.x-b.min.x<.24)
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
 assert.deepEqual([...seen].sort(),[...COMPANION_STATES].sort())
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
