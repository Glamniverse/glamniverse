import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {readFileSync} from 'node:fs'
import {SHELLS,DISCOVERY_KEY,createDiscoveries,createOceanDiscoveries} from '../src/games/no-air/discoveries.js'
import {createOceanEnvironment} from '../src/games/no-air/environment.js'
import {createOceanBotany} from '../src/games/no-air/botany.js'
import {resolveOceanStep} from '../src/games/no-air/swimming.js'
import {OCEAN,ROCKS,floorHeight} from '../src/games/no-air/config.js'
import {createOceanMenu,leftYPressed} from '../src/games/no-air/menu.js'
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z)
function storage(value=null){return {getItem:()=>value,setItem(k,s){assert.equal(k,DISCOVERY_KEY);value=s}}}
function sample(entry){const origin=entry.centre.clone().add(v(0,1.2,0));return {valid:true,source:{},pressed:false,origin,direction:v(0,-1,0)}}
test('twenty stable distinct IDs, three shape families and seven fixed pearl locations',()=>{
 assert.equal(SHELLS.length,20);assert.equal(new Set(SHELLS.map(s=>s.id)).size,20);assert.equal(new Set(SHELLS.map(s=>s.family)).size,3);assert.deepEqual(SHELLS.filter(s=>s.pearl).map(s=>s.id),['shell-02','shell-05','shell-08','shell-11','shell-14','shell-17','shell-20']);assert.ok(Object.isFrozen(SHELLS));assert.equal(new Set(SHELLS.map(s=>`${s.x},${s.z}`)).size,20);
 const a=createOceanDiscoveries(new THREE.Scene(),createDiscoveries(null)),b=createOceanDiscoveries(new THREE.Scene(),createDiscoveries(null));assert.deepEqual(a.entries.map(e=>e.position.toArray()),b.entries.map(e=>e.position.toArray()));assert.equal(a.stats.triangles,11520);assert.equal(a.stats.draws,3);assert.equal(a.stats.textures+a.stats.lights,0);
})
test('all shells sit on actual terrain, clear rocks/plants, and can be approached using unchanged swim bounds',()=>{
 const scene=new THREE.Scene();createOceanEnvironment(scene);const plants=createOceanBotany(scene),hunt=createOceanDiscoveries(scene,createDiscoveries(null)),next=v(),delta=v();scene.updateMatrixWorld(true);
 for(const e of hunt.entries){const {x,z}=e.spec;assert.ok(Math.hypot(x/OCEAN.radiusX,(z-OCEAN.centerZ)/OCEAN.radiusZ)<.95);assert.ok(e.position.y-floorHeight(x,z)<.5);
  for(const f of plants.families)for(const p of f.placements)assert.ok(Math.hypot(x-p.x,z-p.z)>p.radius+.15,`${e.spec.id} botanical clearance`);
  const target=v(x,floorHeight(x,z)+1.65,z),p=v(0,5,8),high=v(x,5,z);
  for(const goal of [high,target]){for(let i=0;i<2000&&p.distanceTo(goal)>.025;i++){delta.subVectors(goal,p).clampLength(0,.035);resolveOceanStep(p,delta,next);p.copy(next)}assert.ok(p.distanceTo(goal)<.03,`${e.spec.id} reachable`)}
  assert.ok(target.distanceTo(e.centre)<2.2);const aim={valid:true,source:{},pressed:false,origin:target.clone(),direction:e.centre.clone().sub(target).normalize()};hunt.input([aim],true);aim.pressed=true;hunt.input([aim],true);assert.ok(hunt.progress.has(e.spec.id),`${e.spec.id} actual terrain line of sight`);for(const [rx,rz,sx,sy,sz] of ROCKS){assert.ok(((x-rx)/(sx*1.1+.5))**2+((target.y-floorHeight(rx,rz)-sy*.28)/(sy*1.1+.5))**2+((z-rz)/(sz*1.1+.5))**2>1)}
 }
})
test('fresh deliberate trigger, nearby aim and released-grip/menu eligibility required; holds cannot duplicate',()=>{
 const d=createOceanDiscoveries(new THREE.Scene(),createDiscoveries(null)),e=d.entries[0],s=sample(e);s.pressed=true;d.input([s],true);assert.equal(d.progress.shells,0);s.pressed=false;d.input([s],true);s.pressed=true;d.input([s],false);assert.equal(d.progress.shells,0);d.input([s],true);assert.equal(d.progress.shells,0);s.pressed=false;d.input([s],true);s.pressed=true;d.input([s],true);assert.equal(d.progress.shells,1);for(let i=0;i<20;i++)d.input([s],true);assert.equal(d.progress.shells,1);assert.equal(d.progress.collect(e.spec.id),false);
 const b=sample(d.entries[1]);b.origin.y+=4;d.input([b],true);b.pressed=true;d.input([b],true);assert.equal(d.progress.shells,1);b.pressed=false;b.origin.copy(d.entries[1].centre).add(v(0,1,0));b.direction.set(1,0,0);d.input([b],true);b.pressed=true;d.input([b],true);assert.equal(d.progress.shells,1);
})
test('rock/terrain occlusion prevents collecting through solid scenery',()=>{
 const scene=new THREE.Scene(),env=new THREE.Group();env.name='no-air-environment';for(let i=0;i<4;i++)env.add(new THREE.Mesh(new THREE.BoxGeometry(.01,.01,.01),new THREE.MeshBasicMaterial()));scene.add(env);const d=createOceanDiscoveries(scene,createDiscoveries(null)),e=d.entries[0],s=sample(e);const block=env.children[1];block.geometry=new THREE.BoxGeometry(1,.25,1);block.position.copy(e.centre).add(v(0,.6,0));scene.updateMatrixWorld(true);d.input([s],true);s.pressed=true;d.input([s],true);assert.equal(d.progress.shells,0);
})
test('saved IDs derive pearl count, filter corrupt data, prevent repeats and unlock a separate final reward',()=>{
 const store=storage(),p=createDiscoveries(store);for(const s of SHELLS){assert.equal(p.collect(s.id),true);assert.equal(p.collect(s.id),false)}assert.equal(p.shells,20);assert.equal(p.pearls,7);assert.equal(p.complete,true);const restored=createDiscoveries(store);assert.equal(restored.shells,20);assert.equal(restored.pearls,7);assert.equal(restored.complete,true);
 const filtered=createDiscoveries(storage(JSON.stringify({version:1,ids:['shell-02','shell-02','fake',3],pearls:999})));assert.equal(filtered.shells,1);assert.equal(filtered.pearls,1);for(const raw of ['{','null','[]','{"version":2,"ids":["shell-02"]}'])assert.equal(createDiscoveries(storage(raw)).shells,0);
 const unavailable=createDiscoveries({getItem(){throw Error()},setItem(){throw Error()}});assert.equal(unavailable.collect('shell-01'),true);assert.equal(unavailable.shells,1);
})
test('pearl reveal completes once, collected instances stay gone after restore, disposal freezes animation',()=>{
 const store=storage(),d=createOceanDiscoveries(new THREE.Scene(),createDiscoveries(store)),e=d.entries.find(e=>e.spec.pearl),s=sample(e);d.input([s],true);s.pressed=true;d.input([s],true);for(let i=0;i<30;i++)d.update(.02);assert.ok(d.root.getObjectByName('no-air-pearl-reveals').visible);for(let i=0;i<80;i++)d.update(.02);assert.equal(d.root.getObjectByName('no-air-pearl-reveals').visible,false);assert.equal(d.progress.pearls,1);
 const restored=createOceanDiscoveries(new THREE.Scene(),createDiscoveries(store)),r=restored.entries.find(x=>x.spec.id===e.spec.id),m=new THREE.Matrix4();r.mesh.getMatrixAt(r.index,m);assert.ok(Math.abs(m.elements[0])<1e-12);restored.dispose();const before=r.mesh.instanceMatrix.array.slice();restored.update(.05);assert.deepEqual(r.mesh.instanceMatrix.array,before);
})
test('existing three menu actions and Left Y mapping retained; discoveries are visible before first collection',()=>{
 const text=[];globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(s){text.push(s)}})})};const p=createDiscoveries(null),scene=new THREE.Scene(),menu=createOceanMenu(scene,{state:'Paused',toggle(){}},()=>{},()=>{},p);assert.equal(menu.open,false);assert.ok(text.includes('Shells discovered: 0 / 20'));assert.ok(text.some(x=>x.includes('trigger')));assert.ok(menu.root.getObjectByName('ocean-discoveries-menu'));let count=0;menu.attach({interaction:{setMenuRays(){},addTarget(){count++;return ()=>{}}}});assert.equal(count,3);
 const src={handedness:'left',profiles:['meta-quest-touch-plus'],gamepad:{mapping:'xr-standard',buttons:Array.from({length:8},()=>({pressed:false}))}};src.gamepad.buttons[5].pressed=true;assert.equal(leftYPressed(src),true);src.gamepad.buttons[5].pressed=false;src.gamepad.buttons[0].pressed=true;assert.equal(leftYPressed(src),false);menu.dispose();delete globalThis.document;
 const code=readFileSync(new URL('../src/games/no-air/index.js',import.meta.url),'utf8');for(const name of ['createOceanFish','createOceanSchools','createOceanJellyfish','createOceanDolphin','createOceanBotany'])assert.ok(code.includes(name));assert.match(code,/!menu.open&&!input.hands.some\(h=>h.grip\)/);
})

test('XR target rays use the current translated/rotated origin, and interrupted input must rearm',()=>{
 const d=createOceanDiscoveries(new THREE.Scene(),createDiscoveries(null)),e=d.entries[0],origin=new THREE.Group();origin.position.set(3,2,-4);origin.rotation.y=.8;origin.updateMatrixWorld(true);const source={targetRaySpace:{},gamepad:{mapping:'xr-standard',buttons:[{pressed:false}]}};const state={origin,interaction:{controllers:[{connected:true,source}]}};const worldPosition=e.centre.clone().add(v(0,1.3,0)),local=origin.worldToLocal(worldPosition.clone()),worldRotation=new THREE.Quaternion().setFromUnitVectors(v(0,0,-1),v(0,-1,0)),localRotation=origin.quaternion.clone().invert().multiply(worldRotation);const frame={getPose:()=>({transform:{position:local,orientation:localRotation}})};
 d.updateXR(state,frame,{},true);source.gamepad.buttons[0].pressed=true;d.updateXR(state,frame,{},false);d.updateXR(state,frame,{},true);assert.equal(d.progress.shells,0);source.gamepad.buttons[0].pressed=false;d.updateXR(state,frame,{},true);source.gamepad.buttons[0].pressed=true;d.updateXR(state,frame,{},true);assert.equal(d.progress.shells,1);d.resetInput();d.updateXR(state,frame,{},true);assert.equal(d.progress.shells,1);
})
