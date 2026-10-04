import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createMantaCuriosity,MANTA_CURIOSITY as M} from '../src/games/sky-loft/manta-curiosity.js'
import {createJellyfishResonance,RESONANCE as J} from '../src/games/sky-loft/jellyfish-resonance.js'
import {createVisitors} from '../src/games/sky-loft/visitors.js'
import {createJellyfish} from '../src/games/sky-loft/jellyfish.js'
import {createRealityVisitors} from '../src/games/sky-loft/reality-visitors.js'
function input(x=0){
  const controller=new THREE.Group();controller.position.set(x,1.6,-5.7)
  return {head:new THREE.Vector3(x,1.6,-5),controllers:[{connected:true,controller}]}
}

test('manta remains ambient without controllers or eligible near pass',()=>{
  const h=createMantaCuriosity(new THREE.Group()),p=new THREE.Vector3(2,8,-30),out=new THREE.Vector3()
  h.begin(.02,null);h.step(0,p,20,.02,out);assert.deepEqual(out,p);assert.equal(h.stats().curiousMantas,0)
  h.begin(.02,input());h.step(0,p,20,.02,out);assert.equal(h.stats().curiousMantas,0)
})

test('manta arc is curved, finite, safely separated, and cooldown prevents immediate re-engagement',()=>{
  const h=createMantaCuriosity(new THREE.Group()),data=input(),p=new THREE.Vector3(0,2.2,-8.6),out=new THREE.Vector3(),samples=[]
  for(let n=0;n<300;n++){
    h.begin(.02,data);h.step(0,p,20+n*.02,.02,out)
    assert.ok(out.z<=M.front);assert.ok(out.distanceTo(data.head)>=M.headClearance-1e-8)
    assert.ok(out.distanceTo(data.controllers[0].controller.position)>=M.handClearance-1e-8)
    if(n===30||n===90||n===150)samples.push(out.clone())
    if(n>180)assert.equal(h.stats().curiousMantas,0)
  }
  const a=samples[1].clone().sub(samples[0]),b=samples[2].clone().sub(samples[1])
  assert.ok(a.cross(b).length()>.005)
})

test('manta captures one investigation point, never tracks a slow hand; fast movement cancels',()=>{
  const a=createMantaCuriosity(new THREE.Group()),b=createMantaCuriosity(new THREE.Group()),ia=input(),ib=input(),p=new THREE.Vector3(0,2.2,-8.6),oa=new THREE.Vector3(),ob=new THREE.Vector3()
  for(let n=0;n<100;n++){
    if(n>0)ib.controllers[0].controller.position.x+=.003
    a.begin(.02,ia);b.begin(.02,ib);a.step(0,p,20+n*.02,.02,oa);b.step(0,p,20+n*.02,.02,ob)
    assert.ok(oa.distanceTo(ob)<1e-9)
  }
  ia.controllers[0].controller.position.x+=.2;a.begin(.02,ia);a.step(0,p,22,.02,oa)
  assert.equal(a.stats().curiousMantas,0)
})

test('jellyfish eligibility is local and capped at two; ten distant residents remain ambient',()=>{
  const h=createJellyfishResonance(new THREE.Group()),data=input(),out=new THREE.Vector3(),near=new THREE.Vector3(0,2.4,-7),far=new THREE.Vector3(12,8,-20)
  h.begin(.02,null);h.step(0,far,20,.02,out);assert.deepEqual(out,far)
  h.reset();h.begin(.02,data)
  for(let i=0;i<12;i++){h.step(i,i<2?near:far,20,.02,out);if(i>=2)assert.deepEqual(out,far)}
  assert.equal(h.stats().resonatingJellyfish,2)
})

test('jellyfish follows vertical motion with lag and returns pulse gently after fast-hand release',()=>{
  const h=createJellyfishResonance(new THREE.Group()),data=input(),p=new THREE.Vector3(0,2.4,-7),out=new THREE.Vector3()
  let strength=0
  for(let n=0;n<150;n++){h.begin(.02,data);strength=h.step(0,p,20+n*.02,.02,out)}
  const before=out.clone()
  for(let n=0;n<100;n++){
    data.controllers[0].controller.position.y+=.004
    h.begin(.02,data);h.step(0,p,23+n*.02,.02,out)
  }
  assert.ok(out.y>before.y);assert.ok(out.y-before.y<.4)
  assert.ok(Math.abs(out.x-before.x)<.13);assert.ok(out.z<=J.front)
  assert.ok(out.distanceTo(data.head)>=J.headClearance-1e-8)
  data.controllers[0].controller.position.y+=.2;h.begin(.02,data)
  const released=h.step(0,p,25,.02,out);assert.equal(h.stats().resonatingJellyfish,0);assert.ok(released>0)
  data.controllers[0].connected=false
  for(let n=0;n<400;n++){h.begin(.02,data);strength=h.step(0,p,25+n*.02,.02,out)}
  assert.ok(strength<.025);h.reset();assert.equal(h.stats().resonatingJellyfish,0)
})

test('actual species reach front-edge controllers; counts and render resources stay fixed',()=>{
  for(const [create,key,x,count,draws] of [[createVisitors,'curiousMantas',0,2,4],[createJellyfish,'resonatingJellyfish',-1.6,12,3]]){
    const root=new THREE.Group(),system=create(root),data=input(x),objects=[]
    root.traverse(o=>{if(o.isMesh||o.isLine)objects.push(o)})
    assert.equal(objects.length,draws);const materials=new Set(objects.map(o=>o.material));let peak=0
    for(let n=0;n<3500;n++){system.update(n*20,true,data);peak=Math.max(peak,system.stats()[key]);assert.ok(system.stats()[key]<=2)}
    assert.ok(peak>0)
    const after=[];root.traverse(o=>{if(o.isMesh||o.isLine)after.push(o)})
    assert.deepEqual(after,objects);assert.equal(new Set(after.map(o=>o.material)).size,materials.size)
    let triangles=0
    for(const o of objects){assert.equal(o.material.map,null);if(o.isMesh)triangles+=o.geometry.index.count/3*(o.isInstancedMesh?o.count:1);if(count===12)assert.ok(o.isInstancedMesh)}
    console.log('M5.3 unchanged render budget',{count,draws,triangles})
    system.update(71000,false);assert.equal(system.stats()[key],0)
    system.dispose();system.update(72000,true,data);assert.equal(system.stats()[key],0)
  }
})

test('reality switching resets temporary resonance and material response without creating resources',()=>{
  const root=new THREE.Group(),v=createRealityVisitors(root),data=input(-1.6),objects=[]
  root.traverse(o=>objects.push(o))
  for(const species of ['jellyfish','neon-mantas','butterflies','jellyfish','neon-mantas']){
    v.apply(species);assert.equal(v.stats().resonatingJellyfish,0);assert.equal(v.stats().curiousButterflies,0)
    for(let n=0;n<1600;n++)v.update(n*20,true,data)
    const after=[];root.traverse(o=>after.push(o));assert.deepEqual(after,objects)
  }
  v.reset();assert.equal(v.stats().resonatingJellyfish,0)
  root.traverse(o=>{if(o.material?.isMeshStandardMaterial&&o.material.emissiveIntensity!==undefined&&o.geometry?.type==='ShapeGeometry')assert.equal(o.material.emissiveIntensity,.55)})
  v.dispose();v.update(90000,true,data);assert.equal(v.stats().activeVisitors,0)
})
