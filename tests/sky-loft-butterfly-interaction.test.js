import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createButterflyCuriosity,CURIOSITY} from '../src/games/sky-loft/butterfly-curiosity.js'
import {createButterflies} from '../src/games/sky-loft/butterflies.js'
import {createRealityVisitors} from '../src/games/sky-loft/reality-visitors.js'

function harness(){
  const parent=new THREE.Group(),helper=createButterflyCuriosity(parent),controller=new THREE.Group()
  controller.position.set(-.5,1.3,-.9)
  const input={head:new THREE.Vector3(0,1.6,0),controllers:[{connected:true,controller}]}
  const out=new THREE.Vector3(),ambient=new THREE.Vector3(-.5,1.5,-2)
  let time=0
  function tick(n=1,data=input){for(let i=0;i<n;i++){time+=.02;helper.begin(.02,data);helper.step(0,ambient,12,time,.02,out)}}
  return {parent,helper,controller,input,out,ambient,tick}
}

test('without tracked XR controllers, butterfly positions remain exactly ambient',()=>{
  const h=harness()
  for(const input of [null,{head:h.input.head,controllers:[]},{head:h.input.head,controllers:[{connected:false,controller:h.controller}]}]){
    h.tick(5,input);assert.deepEqual(h.out,h.ambient);assert.equal(h.helper.stats().curiousButterflies,0)
  }
})

test('either controller attracts smoothly; one hero hovers 8Ã¢â‚¬â€œ15 cm away with natural lag',()=>{
  const h=harness();h.input.controllers.unshift({connected:false})
  h.tick();const before=h.out.clone();h.tick()
  assert.equal(h.helper.stats().curiousButterflies,1)
  assert.ok(h.out.distanceTo(before)<=CURIOSITY.followSpeed*.02+1e-8)
  h.tick(400);assert.ok(h.out.distanceTo(h.controller.position)>.08&&h.out.distanceTo(h.controller.position)<.15)
  const settled=h.out.clone();h.controller.position.x+=.015;h.tick()
  assert.ok(h.out.x-settled.x<.015);assert.equal(h.helper.stats().curiousButterflies,1)
})

test('four distinct hand offsets prevent stacking; hand swap uses one target per butterfly',()=>{
  const h=harness(),outputs=Array.from({length:4},()=>new THREE.Vector3())
  for(let n=0;n<400;n++){
    h.helper.begin(.02,h.input)
    for(let i=0;i<4;i++)h.helper.step(i,h.ambient,12,n*.02,.02,outputs[i])
  }
  assert.equal(h.helper.stats().curiousButterflies,4)
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)assert.ok(outputs[i].distanceTo(outputs[j])>.14)
  const other=new THREE.Group();other.position.copy(h.controller.position)
  h.input.controllers.push({connected:true,controller:other});h.helper.begin(.02,h.input)
  for(let i=0;i<4;i++)h.helper.step(i,h.ambient,12,8,.02,outputs[i])
  assert.equal(h.helper.stats().curiousButterflies,4)
})

test('fast hand and release radius disengage without snapping; lost tracking clears attraction',()=>{
  const h=harness();h.tick(200);const before=h.out.clone()
  h.controller.position.x+=.2;h.tick()
  assert.equal(h.helper.stats().curiousButterflies,0);assert.ok(h.out.distanceTo(before)<=.020001)
  h.tick(40);assert.equal(h.helper.stats().curiousButterflies,0)
  h.tick(200);assert.equal(h.helper.stats().curiousButterflies,1)
  h.controller.position.x+=4;h.tick(100);assert.equal(h.helper.stats().curiousButterflies,0)
  const previous=h.out.clone();h.tick(1,null);assert.ok(h.out.distanceTo(previous)<=.020001)
  h.helper.reset();assert.equal(h.helper.stats().curiousButterflies,0)
})

test('headset clearance rejects face-adjacent hands and keeps rendered centres outside face zone',()=>{
  const h=harness();h.controller.position.copy(h.input.head);h.ambient.copy(h.input.head)
  h.tick();assert.equal(h.helper.stats().curiousButterflies,0)
  assert.ok(h.out.distanceTo(h.input.head)>=CURIOSITY.headClearance-1e-8)
})

test('actual XR instancing reaches an extended controller, retains four butterflies/two draws, and resets',()=>{
  const h=harness(),b=createButterflies(h.parent),group=h.parent.children[0]
  let peak=0
  for(let n=0;n<3000;n++){b.update(n*20,true,h.input);peak=Math.max(peak,b.stats().curiousButterflies)}
  assert.equal(peak,4);assert.equal(b.stats().butterflyPool,4);assert.equal(group.children.length,2)
  let triangles=0
  for(const mesh of group.children){assert.ok(mesh.isInstancedMesh);assert.equal(mesh.material.map,null);triangles+=mesh.geometry.index.count/3*mesh.count}
  console.log('Butterfly render budget unchanged',{draws:2,triangles,textures:0,butterflies:4})
  b.update(30020,false);assert.equal(b.stats().curiousButterflies,0)
  b.update(30040,true);assert.equal(b.stats().curiousButterflies,0)
  b.dispose();b.update(30060,true,h.input);assert.equal(b.stats().activeButterflies,0)
})

test('reality switches and disposal clear curiosity without duplicating visitors or controller listeners',()=>{
  const h=harness(),v=createRealityVisitors(h.parent);v.apply('butterflies')
  const children=h.parent.children.length
  for(let n=0;n<1500;n++)v.update(n*20,true,h.input)
  assert.ok(v.stats().curiousButterflies>0)
  for(const id of ['jellyfish','butterflies','neon-mantas','butterflies']){
    v.apply(id);assert.equal(v.stats().curiousButterflies,0);assert.equal(h.parent.children.length,children)
    v.update(31000,true,h.input);assert.equal(v.stats().butterflyPool,4)
  }
  v.dispose();assert.equal(v.stats().curiousButterflies,0);assert.equal(v.stats().activeVisitors,0)
})


test('comfortable controller extension works in translated/rotated loft space',()=>{
  const h=harness();h.parent.position.set(4,0,-3);h.parent.rotation.y=1.1;h.parent.updateMatrixWorld(true)
  h.input.head.set(0,1.6,0).applyMatrix4(h.parent.matrixWorld)
  h.controller.position.set(0,1.3,-.6).applyMatrix4(h.parent.matrixWorld)
  h.ambient.set(0,1.3,-1.5);h.tick(200)
  assert.equal(h.helper.stats().curiousButterflies,1)
  assert.ok(h.out.distanceTo(new THREE.Vector3(0,1.6,0))>=CURIOSITY.headClearance-1e-8)
})
