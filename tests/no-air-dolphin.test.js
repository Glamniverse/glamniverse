import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createOceanDolphin,dolphinFlex,dolphinPhase,sampleDolphinRoute,DOLPHIN_CYCLE} from '../src/games/no-air/dolphin.js'
import {floorHeight,ROCKS} from '../src/games/no-air/config.js'

test('one original opaque dolphin, horizontal flukes and bounded rendering cost',()=>{
 const scene=new THREE.Scene(),d=createOceanDolphin(scene);assert.equal(scene.children.length,1);assert.equal(d.stats.count,1);assert.equal(d.stats.draws,1);assert.ok(d.stats.triangles<7500);assert.equal(d.mesh.material.transparent,false);assert.equal(d.stats.textures+d.stats.lights,0);
 const p=d.mesh.geometry.attributes.position;let tailWidth=0,tailHeight=0;for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)));if(p.getZ(i)<-1.6){tailWidth=Math.max(tailWidth,Math.abs(p.getX(i)));tailHeight=Math.max(tailHeight,Math.abs(p.getY(i)))}}assert.ok(tailWidth>.6);assert.ok(tailHeight<.1);
})
test('vertical propulsion leaves head stable and remains continuous over a tail beat',()=>{
 for(let t=0;t<10;t+=.01){assert.ok(Math.abs(dolphinFlex(.9,t))<1e-12);assert.ok(Math.abs(dolphinFlex(-1.6,t))<=.18);assert.ok(Math.abs(dolphinFlex(-1.6,t+.01)-dolphinFlex(-1.6,t))<.008)}assert.ok(dolphinFlex(-1.6,0)*dolphinFlex(-1.6,1)<0);
})
test('authored cycle includes a long distant interval and continuous terrain-safe route',()=>{
 assert.deepEqual([0,45,80,110,150].map(dolphinPhase),['distant-travel','scenic-pass','curious','departure','distant-roaming']);const p=new THREE.Vector3(),prev=sampleDolphinRoute(0,new THREE.Vector3());
 for(let t=.1;t<=DOLPHIN_CYCLE;t+=.1){sampleDolphinRoute(t,p);assert.ok(p.distanceTo(prev)<.15);assert.ok(p.y-floorHeight(p.x,p.z)>3);for(const [x,z,sx,sy,sz] of ROCKS){const ry=floorHeight(x,z)+sy*.28;assert.ok(((p.x-x)/(sx+1.8))**2+((p.y-ry)/(sy+1.8))**2+((p.z-z)/(sz+1.8))**2>1,'route clears known rock masses')}prev.copy(p)}assert.ok(sampleDolphinRoute(0,p).distanceTo(sampleDolphinRoute(DOLPHIN_CYCLE,new THREE.Vector3()))<1e-8);
})
test('encounter remains smooth, clears stationary viewers and rejoins after departure',()=>{
 for(const head of [new THREE.Vector3(0,0,8),new THREE.Vector3(4,0,2),new THREE.Vector3(1,-2,-12)]){
 const d=createOceanDolphin(new THREE.Scene()),old=d.mesh.position.clone(),v=new THREE.Vector3(),oldV=new THREE.Vector3(),oldQ=d.mesh.quaternion.clone();let near=Infinity;
 for(let i=0;i<190*60;i++){d.update(1/60,head);v.subVectors(d.mesh.position,old).multiplyScalar(60);assert.ok(v.length()<=1.25001);assert.ok(v.distanceTo(oldV)<=.55/60+1e-7);assert.ok(d.mesh.quaternion.angleTo(oldQ)<=.5/60+1e-6);near=Math.min(near,d.mesh.position.distanceTo(head));assert.ok(d.mesh.position.y-floorHeight(d.mesh.position.x,d.mesh.position.z)>2);old.copy(d.mesh.position);oldV.copy(v);oldQ.copy(d.mesh.quaternion)}assert.ok(near>4.5,`centre clearance ${near}`);assert.ok(d.mesh.position.distanceTo(sampleDolphinRoute(d.elapsed,new THREE.Vector3()))<5);
 }
})
test('tracking gaps and disposal freeze encounter instead of jumping or accumulating time',()=>{
 const d=createOceanDolphin(new THREE.Scene()),p=d.mesh.position.clone();for(const dt of [NaN,Infinity,-1,0,2])d.update(dt,new THREE.Vector3());assert.ok(d.mesh.position.equals(p));assert.equal(d.elapsed,0);d.update(1/60,new THREE.Vector3());const elapsed=d.elapsed;d.dispose();const end=d.mesh.position.clone();d.update(1/60,new THREE.Vector3());assert.ok(d.mesh.position.equals(end));assert.equal(d.elapsed,elapsed);
})

test('full rock field remains clear and a swimming viewer does not draw the dolphin into contact',async()=>{
 const {createOceanEnvironment}=await import('../src/games/no-air/environment.js');const scene=new THREE.Scene();createOceanEnvironment(scene);const rocks=scene.children[0].children.find(m=>m.isInstancedMesh&&m.count===72),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),centre=new THREE.Vector3(),scale=new THREE.Vector3(),p=new THREE.Vector3(),local=new THREE.Vector3();
 const obstacles=[];for(let i=0;i<72;i++){rocks.getMatrixAt(i,matrix);matrix.decompose(centre,q,scale);obstacles.push({centre:centre.clone(),inverse:q.clone().invert(),scale:scale.clone().multiplyScalar(1.12).addScalar(1.8)})}
 for(let t=0;t<DOLPHIN_CYCLE;t+=.2){sampleDolphinRoute(t,p);for(const o of obstacles){local.copy(p).sub(o.centre).applyQuaternion(o.inverse).divide(o.scale);assert.ok(local.lengthSq()>1)}}
 const d=createOceanDolphin(new THREE.Scene()),head=new THREE.Vector3();for(let i=0;i<380*60;i++){const t=i/60;head.set(15*Math.sin(t*.045),-3,-3+12*Math.cos(t*.045));d.update(1/60,head);assert.ok(d.mesh.position.distanceTo(head)>4.5)}
})
