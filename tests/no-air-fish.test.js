import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createOceanFish,sampleFishRoute,fishTailAngle,FISH_LOOP_SECONDS} from '../src/games/no-air/fish.js'
import {floorHeight,ROCKS} from '../src/games/no-air/config.js'
test('one 36 cm fish, two opaque draws, no textures/lights; tail swims and disposal stops updates',()=>{
 const scene=new THREE.Scene(),f=createOceanFish(scene);assert.equal(scene.children.length,1);assert.equal(f.stats.draws,2);assert.ok(f.stats.triangles<500)
 f.root.quaternion.identity();const box=new THREE.Box3().setFromObject(f.root);const size=box.getSize(new THREE.Vector3());assert.ok(size.z>.3&&size.z<.4);assert.ok(size.x<.17&&size.y<.21)
 f.update(.15);assert.ok(Math.abs(f.tail.rotation.y)>.1);const before=f.root.position.clone();f.dispose();f.update(20);assert.deepEqual(f.root.position,before)
 scene.traverse(o=>{assert.ok(!o.isLight);if(o.isMesh){assert.equal(o.material.transparent,false);assert.equal(o.material.map,null)}})
})
test('closed smooth shelf route clears terrain and authored near rocks with bounded swim speed',()=>{
 const a=new THREE.Vector3(),b=new THREE.Vector3();assert.ok(sampleFishRoute(0,a).distanceTo(sampleFishRoute(FISH_LOOP_SECONDS,b))<1e-8)
 for(let t=0;t<FISH_LOOP_SECONDS;t+=.1){sampleFishRoute(t,a);sampleFishRoute(t+.01,b);assert.ok(a.distanceTo(b)/.01<1);assert.ok(a.y>floorHeight(a.x,a.z)+1)
 for(const [x,z,sx,sy,sz] of ROCKS){const cy=floorHeight(x,z)+sy*.28;assert.ok(((a.x-x)/(sx*1.15+.2))**2+((a.y-cy)/(sy*1.15+.2))**2+((a.z-z)/(sz*1.15+.2))**2>1)}
 assert.ok(Math.abs(fishTailAngle(t))<=.28)
 }
})
