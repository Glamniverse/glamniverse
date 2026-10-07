import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createOceanJellyfish,JELLY_ANCHORS} from '../src/games/no-air/jellyfish.js'
import {floorHeight} from '../src/games/no-air/config.js'
test('exactly three jellyfish in one opaque batch with distinct phases and no new textures/lights',()=>{
 const scene=new THREE.Scene(),j=createOceanJellyfish(scene);assert.equal(scene.children.length,1);assert.equal(j.mesh.count,3);assert.ok(j.mesh.isInstancedMesh);assert.equal(j.mesh.material.transparent,false);assert.ok(j.stats.triangles<2500);assert.equal(j.stats.textures,0);assert.equal(new Set(j.mesh.geometry.attributes.jellyPhase.array).size,3)
 for(const v of j.mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(v))
})
test('bounded smooth midwater drift, terrain clearance and disposal freezes updates',()=>{
 const j=createOceanJellyfish(new THREE.Scene()),matrix=new THREE.Matrix4(),p=new THREE.Vector3(),previous=JELLY_ANCHORS.map(()=>new THREE.Vector3())
 for(let t=0;t<150;t+=.1){j.update(t);for(let i=0;i<3;i++){j.mesh.getMatrixAt(i,matrix);p.setFromMatrixPosition(matrix);assert.ok(p.distanceTo(new THREE.Vector3(...JELLY_ANCHORS[i]))<1.3);assert.ok(p.y-floorHeight(p.x,p.z)>3);if(t)assert.ok(p.distanceTo(previous[i])<.03);previous[i].copy(p)}}
 const before=j.mesh.instanceMatrix.array.slice();j.dispose();j.update(500);assert.deepEqual(j.mesh.instanceMatrix.array,before)
})
