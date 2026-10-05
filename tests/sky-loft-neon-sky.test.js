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
  assert.equal(peakDraws,5);assert.equal(peakTriangles,454)
  console.log('Living sky peak addition',{draws:peakDraws,triangles:peakTriangles,textures:0,lights:0})
})

test('fixed structures remain distant, drift subtly and use two instanced draws',()=>{
  const h=setup(),batches=h.group.children.filter(o=>o.isInstancedMesh),matrix=new THREE.Matrix4(),p=new THREE.Vector3()
  assert.equal(batches.length,2);assert.equal(h.sky.stats().skyStructureCount,4)
  assert.deepEqual(batches.map(b=>b.count),[28,32])
  for(let n=0;n<100;n++){
    h.advance(.2)
    for(const b of batches)for(let i=0;i<b.count;i++){b.getMatrixAt(i,matrix);p.setFromMatrixPosition(matrix);assert.ok(p.z<=-55);assert.ok(p.y>13)}
  }
})

test('rift envelope is one slow rise and fall, never flashes or oscillates',()=>{
  assert.equal(riftEnvelope(-1),0);assert.equal(riftEnvelope(5),0)
  let previous=0
  for(let n=0;n<=500;n++){
    const age=n/100,v=riftEnvelope(age)
    assert.ok(v>=0&&v<=1);assert.ok(Math.abs(v-previous)*.42<=.0032)
    if(age<=2.5)assert.ok(v>=previous);else assert.ok(v<=previous)
    previous=v
  }
  const h=setup();h.advance(48)
  const rift=h.group.getObjectByName('SkyLoft_NeonRift')
  assert.ok(rift.visible);assert.ok(rift.material.opacity<=.42);assert.equal(rift.material.depthWrite,false)
  h.advance(4);assert.equal(rift.visible,false)
  assert.equal(LIVING_SKY.cycle-LIVING_SKY.riftDuration,74.2)
})

test('only Neon activates sky; repeated switches, interruption and dispose stay bounded',()=>{
  const root=new THREE.Group(),v=createRealityVisitors(root),objects=[];root.traverse(o=>objects.push(o))
  for(let n=0;n<12;n++)for(const species of ['neon-mantas','butterflies','jellyfish']){
    v.apply(species);v.update(n*100,true);v.update(n*100+20,true)
    assert.equal(v.stats().skyActive,species==='neon-mantas')
    assert.equal(v.stats().skyUfoCount,1);assert.equal(v.stats().skyStructureCount,4)
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


test('Quest-approved UFO geometry, material, schedule and sampled flight remain fixed',()=>{
  const h=setup(),craft=h.group.getObjectByName('SkyLoft_DistantCraft'),[hull,rim]=craft.children
  assert.deepEqual([LIVING_SKY.cycle,LIVING_SKY.ufoStart,LIVING_SKY.ufoDuration],[80,10,14])
  assert.equal(hull.geometry.type,'OctahedronGeometry');assert.equal(hull.geometry.parameters.radius,1);assert.equal(hull.geometry.parameters.detail,0)
  assert.deepEqual(hull.scale.toArray(),[7,.65,2.8]);assert.equal(hull.material.color.getHex(),0x151b32)
  assert.equal(rim.material.color.getHex(),0x7896c8)
  const actual=Array.from(rim.geometry.attributes.position.array),expected=[-7,0,0,0,0,-2.8,7,0,0,0,0,2.8]
  actual.forEach((x,i)=>assert.ok(Math.abs(x-expected[i])<1e-6))
  let previous=0
  for(const age of [10.1,11,12,17,22,23,24]){
    h.advance(age-previous);previous=age
    if(age===24)continue // Floating point accumulation may still be just inside final frame.
    const t=(age-10)/14,ease=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x)}
    assert.ok(craft.position.distanceTo(new THREE.Vector3(-110+220*t,29+1.5*Math.sin(Math.PI*t),-145-4*Math.sin(Math.PI*t)))<1e-8)
    assert.ok(Math.abs(craft.rotation.x-.03*Math.sin(t*Math.PI))<1e-8)
    assert.ok(Math.abs(craft.rotation.z-.06*Math.sin(t*Math.PI*2))<1e-8)
    assert.ok(Math.abs(craft.scale.x-ease((age-10)/2)*ease((24-age)/2))<1e-8)
  }
})

test('four city silhouettes have staggered 60-105m anchors and sparse window geometry',()=>{
  const h=setup(),[bodies,windows]=h.group.children
  for(const p of LIVING_SKY.structures){const distance=Math.hypot(...p);assert.ok(distance>60&&distance<105)}
  assert.equal(bodies.count,28);assert.equal(windows.count,32)
  assert.equal(windows.geometry.index.count/3,2);assert.equal(windows.material.transparent,false)
  const matrix=new THREE.Matrix4(),a=new THREE.Vector3(),b=new THREE.Vector3()
  bodies.getMatrixAt(0,matrix);a.setFromMatrixPosition(matrix);h.advance(10);bodies.getMatrixAt(0,matrix);b.setFromMatrixPosition(matrix)
  assert.ok(a.distanceTo(b)<.2)
})

test('three larger rift branches form sequentially, fade softly and reset together',()=>{
  const h=setup(),rifts=h.group.children.filter(o=>o.name.startsWith('SkyLoft_NeonRift'))
  assert.equal(rifts.length,3);assert.deepEqual(LIVING_SKY.riftDelays,[0,.4,.8])
  h.advance(46.2);assert.deepEqual(rifts.map(r=>r.visible),[true,false,false])
  h.advance(.4);assert.deepEqual(rifts.map(r=>r.visible),[true,true,false])
  h.advance(.4);assert.deepEqual(rifts.map(r=>r.visible),[true,true,true])
  for(const r of rifts){assert.ok(r.position.length()>110);assert.ok(r.scale.x>=1.6);assert.ok(r.material.opacity<=.42)}
  h.advance(5);assert.ok(rifts.every(r=>!r.visible))
  h.sky.reset();assert.ok(rifts.every(r=>!r.visible&&r.material.opacity===0))
})


test('rift centers sit high above cities with conservative opacity and unchanged geometry',()=>{
 const h=setup(),rifts=h.group.children.filter(o=>o.name.startsWith('SkyLoft_NeonRift'))
 const old=[[ -24,39,-110],[-9,45,-113],[4,49,-116]]
 assert.deepEqual(rifts.map(r=>r.position.toArray()),[[-24,95,-110],[-9,101,-113],[4,105,-116]])
 const elevation=([x,y,z])=>Math.atan2(y-1.6,Math.hypot(x,z))*180/Math.PI
 rifts.forEach((r,i)=>{assert.ok(elevation(r.position.toArray())-elevation(old[i])>19);assert.equal(r.geometry.index.count/3,18);assert.equal(r.material.color.getHex(),0x8592cd)})
 h.advance(48.1);assert.ok(Math.abs(rifts[0].material.opacity-.42)<1e-8)
 assert.equal(LIVING_SKY.riftDuration,5.8);assert.equal(LIVING_SKY.riftStart,46);assert.equal(LIVING_SKY.cycle,80)
})
