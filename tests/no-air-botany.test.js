import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createOceanBotany,botanicalPlacementSafe} from '../src/games/no-air/botany.js'
import {floorHeight} from '../src/games/no-air/config.js'
import {createOceanSchools} from '../src/games/no-air/schools.js'
import {sampleFishRoute,FISH_LOOP_SECONDS} from '../src/games/no-air/fish.js'
test('four distinct opaque botanical batches share one material with a conservative geometry budget',()=>{
 const b=createOceanBotany(new THREE.Scene()),s=b.stats();assert.equal(s.instances,116);assert.deepEqual(s.families.map(f=>f.count),[30,20,48,18]);assert.equal(s.draws,4);assert.equal(s.materials,1);assert.ok(s.triangles<22000);assert.equal(s.textures,0);assert.equal(s.transparentDraws,0)
 const shapes=new Set();for(const f of b.families){assert.ok(f.mesh.isInstancedMesh);shapes.add(f.mesh.geometry.attributes.position.count);assert.equal(f.mesh.material.transparent,false);assert.equal(f.mesh.material.depthWrite,true);assert.ok(!f.mesh.castShadow);for(const n of f.mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(n))}assert.equal(shapes.size,4)
})
test('authored patches root to existing floor, preserve sand corridor and avoid fish route envelopes',()=>{
 const b=createOceanBotany(new THREE.Scene()),schools=createOceanSchools(new THREE.Scene()),paths=[],v=new THREE.Vector3()
 for(let i=0;i<240;i++){sampleFishRoute(i/240*FISH_LOOP_SECONDS,v);paths.push({x:v.x,y:v.y,z:v.z,r:.4})}
 for(const s of schools.schools)for(let i=0;i<240;i++){s.curve.getPointAt(i/240,v);paths.push({x:v.x,y:v.y,z:v.z,r:s.spec.spread*1.65+.45})}
 for(const f of b.families)for(const p of f.placements){assert.equal(p.y,floorHeight(p.x,p.z)-.035);assert.ok(botanicalPlacementSafe(p.x,p.z,p.height,p.radius,paths),f.spec.id+' corridor clearance');assert.ok(f.spec.zones.some(([x,z,r])=>Math.hypot(x-p.x,z-p.z)<=r+.001));if(f.spec.id==='kelp')assert.ok(p.height>=1.5&&p.height<=3);if(f.spec.id==='tubes')assert.ok(p.y<-18)}
})
test('sway changes only shared time, keeps roots/matrices fixed and stops on disposal',()=>{
 const scene=new THREE.Scene(),b=createOceanBotany(scene),before=b.families.map(f=>f.mesh.instanceMatrix.array.slice())
 b.update(8);for(const [i,f] of b.families.entries()){assert.equal(f.mesh.material.uniforms.time.value,8);assert.deepEqual(f.mesh.instanceMatrix.array,before[i]);assert.ok(f.mesh.geometry.attributes.botanical.getX(0)<=.13)}
 b.dispose();b.update(20);assert.equal(b.families[0].mesh.material.uniforms.time.value,8);assert.equal(scene.children.length,1)
})
