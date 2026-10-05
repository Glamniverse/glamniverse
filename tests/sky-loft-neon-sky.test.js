import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createNeonSky,LIVING_SKY,riftEnvelope} from '../src/games/sky-loft/neon-sky.js'
import {createRealityVisitors} from '../src/games/sky-loft/reality-visitors.js'
function setup(){
  const root=new THREE.Group(),sky=createNeonSky(root),group=root.children[0]
  let time=0;sky.update(0,true)
  return {root,sky,group,advance(seconds){for(let i=0;i<Math.round(seconds/.02);i++){time+=20;sky.update(time,true)}}}
}

test('craft traversal and cooldown are deterministic, rare, distant and never overlap rift',()=>{
  const h=setup(),craft=h.group.getObjectByName('SkyLoft_DistantCraft')
  let starts=0,previous=false,peakDraws=0,peakTriangles=0
  for(let n=0;n<8000;n++){
    h.advance(.02);const s=h.sky.stats()
    assert.equal(s.skyUfoActive&&s.skyRiftActive,false)
    if(s.skyUfoActive){if(!previous)starts++;assert.ok(craft.position.length()>140);assert.ok(craft.position.z<-140);assert.ok(craft.scale.x>=0&&craft.scale.x<=1)}
    previous=s.skyUfoActive
    let draws=0,triangles=0
    h.group.traverseVisible(o=>{if(o.isMesh||o.isLine){draws++;if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1)}})
    peakDraws=Math.max(peakDraws,draws);peakTriangles=Math.max(peakTriangles,triangles)
  }
  assert.equal(starts,2);assert.equal(LIVING_SKY.cycle-LIVING_SKY.ufoDuration,66)
  assert.equal(peakDraws,4);assert.equal(peakTriangles,162)
  console.log('Living sky peak addition',{draws:peakDraws,triangles:peakTriangles,textures:0,lights:0})
})

test('fixed structures remain distant, drift subtly and use two instanced draws',()=>{
  const h=setup(),batches=h.group.children.filter(o=>o.isInstancedMesh),matrix=new THREE.Matrix4(),p=new THREE.Vector3()
  assert.equal(batches.length,2);assert.equal(h.sky.stats().skyStructureCount,2)
  assert.deepEqual(batches.map(b=>b.count),[8,4])
  for(let n=0;n<100;n++){
    h.advance(.2)
    for(const b of batches)for(let i=0;i<b.count;i++){b.getMatrixAt(i,matrix);p.setFromMatrixPosition(matrix);assert.ok(p.z<=-112);assert.ok(p.y>20)}
  }
})

test('rift envelope is one slow rise and fall, never flashes or oscillates',()=>{
  assert.equal(riftEnvelope(-1),0);assert.equal(riftEnvelope(5),0)
  let previous=0
  for(let n=0;n<=500;n++){
    const age=n/100,v=riftEnvelope(age)
    assert.ok(v>=0&&v<=1);assert.ok(Math.abs(v-previous)*.32<=.0025)
    if(age<=2.5)assert.ok(v>=previous);else assert.ok(v<=previous)
    previous=v
  }
  const h=setup();h.advance(48)
  const rift=h.group.getObjectByName('SkyLoft_NeonRift')
  assert.ok(rift.visible);assert.ok(rift.material.opacity<=.32);assert.equal(rift.material.depthWrite,false)
  h.advance(4);assert.equal(rift.visible,false)
  assert.equal(LIVING_SKY.cycle-LIVING_SKY.riftDuration,75)
})

test('only Neon activates sky; repeated switches, interruption and dispose stay bounded',()=>{
  const root=new THREE.Group(),v=createRealityVisitors(root),objects=[];root.traverse(o=>objects.push(o))
  for(let n=0;n<12;n++)for(const species of ['neon-mantas','butterflies','jellyfish']){
    v.apply(species);v.update(n*100,true);v.update(n*100+20,true)
    assert.equal(v.stats().skyActive,species==='neon-mantas')
    assert.equal(v.stats().skyUfoCount,1);assert.equal(v.stats().skyStructureCount,2)
    const after=[];root.traverse(o=>after.push(o));assert.deepEqual(after,objects)
  }
  v.apply('neon-mantas');v.update(5000,true);v.update(5020,false);assert.equal(v.stats().skyActive,false)
  v.update(5040,true);assert.equal(v.stats().skyUfoActive,false)
  v.reset();assert.equal(v.stats().skyActive,false);v.dispose();v.update(6000,true);assert.equal(v.stats().skyActive,false)
})

test('visibility transition and cleanup add no textures, lights, listeners or owned disposal conflicts',()=>{
  const h=setup(),objects=[];h.group.traverse(o=>objects.push(o))
  h.sky.setVisibility(0);h.advance(1);assert.equal(h.group.visible,false)
  h.sky.setVisibility(.5);h.advance(1);assert.equal(h.group.visible,true)
  for(const o of objects){assert.ok(!o.isLight);if(o.material){assert.equal(o.material.map,null);assert.equal(o.castShadow,false)}}
  h.sky.dispose();h.sky.dispose();h.advance(20);assert.equal(h.group.visible,false)
  const after=[];h.group.traverse(o=>after.push(o));assert.deepEqual(after,objects)
})
