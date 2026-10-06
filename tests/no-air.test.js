import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import * as THREE from 'three'
import {createSwimMotion,resolveOceanStep} from '../src/games/no-air/swimming.js'
import {createOceanEnvironment} from '../src/games/no-air/environment.js'
import {createOceanAudio} from '../src/games/no-air/audio.js'
import {createNoAir} from '../src/games/no-air/index.js'
import {OCEAN as B,SWIM as C,floorHeight} from '../src/games/no-air/config.js'
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z)
const input=()=>({hands:[{valid:true,grip:false,position:v(-.3,-.3,-.4)},{valid:true,grip:false,position:v(.3,-.3,-.4)}],leftValid:true,rightValid:true,leftX:0,leftY:0,rightX:0,rightY:0,yaw:0})
const radius=p=>Math.hypot(p.x/B.radiusX,(p.z-B.centerZ)/B.radiusZ)
function stroke(m,p,i,axis='z',sign=1){m.step(.02,p,i);for(const h of i.hands)h.grip=true;for(let f=0;f<25;f++){for(const h of i.hands)h.position[axis]+=.012*sign;p.add(m.step(.02,p,i).delta)}}

test('deliberate bilateral strokes propel opposite hand travel; ordinary pointing and tiny motion do not',()=>{
 const p=v(0,0,8),m=createSwimMotion(),i=input();stroke(m,p,i);assert.ok(p.z<7.97);assert.ok(m.velocity.z<0)
 for(const grip of [false,true]){m.reset();const q=v(0,0,8),j=input();m.step(.02,q,j);j.hands.forEach(h=>h.grip=grip);for(let n=0;n<20;n++){j.hands.forEach(h=>h.position.z+=grip?.001:.015);q.add(m.step(.02,q,j).delta)}assert.equal(q.z,8)}
})
test('grip held on entry requires release; selecting cancels propulsion',()=>{
 const m=createSwimMotion(),i=input(),p=v(0,0,8);i.hands.forEach(h=>h.grip=true);stroke(m,p,i);assert.equal(p.z,8)
 i.hands.forEach(h=>h.grip=false);stroke(m,p,i);assert.ok(m.velocity.length()>0)
 i.selecting=true;assert.equal(m.step(.02,p,i).delta.length(),0);assert.equal(m.velocity.length(),0)
})
test('vertical strokes ascend and descend without pitching camera',()=>{
 for(const sign of [-1,1]){const m=createSwimMotion(),p=v(0,0,8),i=input();stroke(m,p,i,'y',sign);assert.ok(p.y*sign<-.03)}
})
test('speed cap, drag and reset are deterministic',()=>{
 const m=createSwimMotion(),p=v(0,0,8),i=input();stroke(m,p,i);const before=m.velocity.length();i.hands.forEach(h=>h.grip=false)
 m.step(.05,p,i);assert.ok(m.velocity.length()<before)
 m.velocity.set(50,20,-50);assert.ok(m.step(.05,p,i).delta.length()<=C.speed*.05+1e-10)
 m.reset();assert.equal(m.velocity.length(),0);assert.equal(m.step(.02,p,input()).delta.length(),0)
})
test('tracking spikes, missing hands and long frames cannot inject propulsion',()=>{
 const m=createSwimMotion(),p=v(0,0,8),i=input();m.step(.02,p,i);i.hands[0].grip=true;i.hands[0].position.z+=2
 assert.equal(m.step(.02,p,i).delta.length(),0)
 i.hands.forEach(h=>h.valid=false);assert.equal(m.step(.02,p,i).delta.length(),0)
 m.velocity.set(1,0,0);assert.equal(m.step(2,p,i).delta.length(),0);assert.equal(m.velocity.length(),0)
})
test('left/right/front/rear and diagonal boundary pressure preserve inward and tangential recovery',()=>{
 for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI/4]){
  const p=v(Math.cos(a)*B.radiusX,5,B.centerZ+Math.sin(a)*B.radiusZ),out=v(),normal=v(Math.cos(a),0,Math.sin(a))
  for(let n=0;n<100;n++){resolveOceanStep(p,normal.clone().multiplyScalar(.04),out);p.copy(out);assert.ok(radius(p)<=1+1e-10)}
  const r=radius(p);resolveOceanStep(p,normal.clone().multiplyScalar(-.04),out);assert.ok(radius(out)<r)
  const tangent=v(-Math.sin(a)*.03,0,Math.cos(a)*.03);resolveOceanStep(p,tangent,out);assert.ok(out.distanceTo(p)>.01)
 }
})
test('microscopically outside ellipse recovers without teleport',()=>{
 const p=v(B.radiusX+.002,5,B.centerZ),out=v();resolveOceanStep(p,v(.1,0,0),out);assert.ok(out.distanceTo(p)<1e-8)
 resolveOceanStep(p,v(-.03,0,0),out);assert.equal(out.x,p.x-.03)
})
test('seabed and ceiling block outward motion but permit escape from slightly invalid pose',()=>{
 for(const [y,sign] of [[B.ceiling,1],[floorHeight(0,8)+B.floorClearance,-1]]){
  const p=v(0,y,8),out=v();resolveOceanStep(p,v(0,.1*sign,0),out);assert.equal(out.y,p.y)
  p.y+=.001*sign;resolveOceanStep(p,v(0,-.04*sign,0),out);assert.equal(out.y,p.y-.04*sign)
 }
})
test('snap-turn remains independent at blocked edge; hold cannot spam; neutral rearms',()=>{
 const m=createSwimMotion(),i=input(),p=v(B.radiusX+.001,5,B.centerZ);m.step(.02,p,i);i.rightX=1;i.leftX=1
 assert.equal(m.step(.02,p,i).yaw,-Math.PI/6)
 for(let n=0;n<35;n++)assert.equal(m.step(.02,p,i).yaw,0)
 i.rightX=0;m.step(.02,p,i);i.rightX=1;assert.equal(m.step(.02,p,i).yaw,-Math.PI/6)
})
test('accessibility controls arm on neutral and retain gentle combined speed',()=>{
 const m=createSwimMotion(),p=v(0,0,8),i=input();i.leftY=-1;assert.equal(m.step(.02,p,i).delta.length(),0)
 i.leftY=0;m.step(.02,p,i);i.leftY=-1;i.rightY=-1;const r=m.step(.02,p,i);assert.ok(r.delta.z<0&&r.delta.y>0);assert.ok(r.delta.length()<=C.speed*.02)
})
test('near rock collision permits retreat without crossing its inflated centre',()=>{
 const x=-13,z=-1,centre=v(x,floorHeight(x,z)+3.2*.28,z),p=centre.clone().add(v(5,0,0)),out=v()
 for(let n=0;n<80;n++){resolveOceanStep(p,v(-.03,0,0),out);p.copy(out)}
 assert.ok(p.x-centre.x>=3.6*1.1+.5-1e-5)
 resolveOceanStep(p,v(.03,0,0),out);assert.ok(out.x>p.x)
})
test('environment has bounded instanced budgets, real depth, finite geometry and no texture/light dependency',()=>{
 const scene=new THREE.Scene(),env=createOceanEnvironment(scene),s=env.stats();assert.equal(s.draws,9);assert.equal(s.instancedDraws,3);assert.equal(s.particles,340);assert.equal(s.grass,480);assert.equal(s.textures,0);assert.equal(s.lights,0);assert.ok(s.triangles<120000)
 assert.ok(floorHeight(0,8)-floorHeight(0,-24)>18)
 scene.traverse(o=>{if(o.geometry)for(const x of o.geometry.attributes.position.array)assert.ok(Number.isFinite(x))})
 env.update(10);env.dispose();assert.equal(scene.children.length,1)
})
test('missing approved song creates no audio; provided hook pauses/releases safely',()=>{
 let made=0;const silent=createOceanAudio(null,()=>{made++;throw Error('must not create')});silent.start();silent.reset();silent.dispose();assert.equal(made,0)
 const calls=[];const player={play(){calls.push('play');return Promise.resolve()},pause(){calls.push('pause')},removeAttribute(){},load(){}}
 const audio=createOceanAudio('/approved.ogg',()=>player);audio.start();audio.pause();audio.reset();audio.dispose();audio.start();assert.equal(calls.filter(c=>c==='play').length,1)
})
test('XR enter/exit/re-entry and suspension own no extra controllers or persistent input',()=>{
 const listeners=new Map();globalThis.window={innerWidth:1280,innerHeight:720,addEventListener(n,f){listeners.set(n,f)},removeEventListener(n){listeners.delete(n)}}
 globalThis.document={createElement(){return {width:0,height:0,getContext(){return {fillText(){}}}}}}
 const world=createNoAir(),session={visibilityState:'visible',addEventListener(n,f){this.listener=f},removeEventListener(){this.listener=null}}
 const origin=new THREE.Group();world.scene.add(origin)
 const state={origin,session,renderer:{xr:{getReferenceSpace:()=>({})}},interaction:{controllers:[]}}
 const frame={getViewerPose:()=>({transform:{position:{x:0,y:1.6,z:0},orientation:{x:0,y:0,z:0,w:1}}})}
 world.xrHooks.onEnter(state);world.update(1000,frame);assert.equal(world.getDebugState().placed,true);assert.equal(listeners.size,0)
 world.xrHooks.onRequestExit();world.xrHooks.onExit();assert.deepEqual(world.getDebugState().velocity,[0,0,0]);assert.equal(session.listener,null)
 world.xrHooks.onEnter(state);world.update(2000,frame);assert.equal(world.scene.children.filter(x=>x.name==='no-air-environment').length,1)
 session.visibilityState='hidden';session.listener();assert.deepEqual(world.getDebugState().velocity,[0,0,0])
 world.xrHooks.suspend();assert.equal(session.listener,null);assert.equal(listeners.size,0);world.xrHooks.dispose();world.xrHooks.dispose();assert.equal(world.getDebugState().disposed,true)
 delete globalThis.window;delete globalThis.document
})
test('Preview entry reuses capability gate; production cannot expose the new card',()=>{
 const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');const start=source.indexOf('// NO AIR M1'),end=source.indexOf('function showInHisMindRoom()',start);const block=source.slice(start,end)
 assert.match(block,/import\.meta\.env\.DEV \|\| import\.meta\.env\.VITE_VERCEL_ENV === 'preview'/)
 assert.match(block,/checkVRExperienceSupport\('noAir'/);assert.match(block,/createWorldLifecycle\(ocean.scene\)/);assert.match(block,/startWorldAnimation\('noAir'/)
 assert.doesNotMatch(block,/requestSession|new THREE.WebGLRenderer|sky-loft/)
})
