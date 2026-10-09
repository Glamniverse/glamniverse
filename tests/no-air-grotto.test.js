import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {sampleFishRoute,FISH_LOOP_SECONDS} from '../src/games/no-air/fish.js'
import {sampleDolphinRoute,DOLPHIN_CYCLE} from '../src/games/no-air/dolphin.js'
import {SCHOOL_SPECIES} from '../src/games/no-air/schools.js'
import {GROTTO,grottoSection,createOceanGrotto} from '../src/games/no-air/grotto.js'
import {floorHeight,OCEAN} from '../src/games/no-air/config.js'
import {resolveOceanStep,createSwimMotion} from '../src/games/no-air/swimming.js'
import {SHELLS,createDiscoveries,createOceanDiscoveries} from '../src/games/no-air/discoveries.js'
import {createOceanEnvironment} from '../src/games/no-air/environment.js'
import {createOceanBotany} from '../src/games/no-air/botany.js'
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z)
const cave=createOceanGrotto(new THREE.Scene()),c=cave.collision
function travel(p,goal){const d=v(),n=v(),out=v();for(let i=0;i<4000&&p.distanceTo(goal)>.02;i++){d.subVectors(goal,p).clampLength(0,.025);resolveOceanStep(p,d,n);d.subVectors(n,p);c.resolve(p,d,out);p.add(out)}return p.distanceTo(goal)}
test('grotto entrance, chamber and return are reachable with unchanged ocean constraints',()=>{
 const entrance=v(-3.5,floorHeight(-3.5,9)+2,9),p=entrance.clone()
 for(const z of [9.8,10.3,10.8,11.3,11.8,12.3,12.8]){const goal=v(-3.5,floorHeight(-3.5,z)+2,z);assert.ok(travel(p,goal)<.025,`enter ${z}: ${p.toArray()}`)}
 for(const z of [12.3,11.8,11.3,10.8,10.3,9.8,9])assert.ok(travel(p,v(-3.5,floorHeight(-3.5,z)+2,z))<.025,`exit ${z}`)
 assert.ok(p.distanceTo(entrance)<.03)
})
test('wall/roof pressure is bounded on both sides; releasing and retreating recover without correction jumps',()=>{
 const p=v(-3.5,floorHeight(-3.5,11.5)+2,11.5),out=v(),d=v(.03,0,0)
 for(let i=0;i<180;i++){c.resolve(p,d,out);assert.ok(out.length()<=d.length()+1e-6);p.add(out)}
 assert.ok(p.x<-.5);assert.ok(c.distance(p)>.27)
 c.resolve(p,v(),out);assert.equal(out.length(),0);c.resolve(p,v(0,.03,0),out);assert.ok(out.y>.02);p.add(out);c.resolve(p,v(-.01,.025,0),out);assert.ok(out.x<-.005)
 const inside=v(-3.5,floorHeight(-3.5,11.5)+2,11.5)
 for(let i=0;i<300;i++){c.resolve(inside,v(0,.03,0),out);inside.add(out)}
 assert.ok(inside.y<floorHeight(inside.x,inside.z)+5.5);assert.ok(c.distance(inside)>.27)
 c.resolve(inside,v(0,-.03,0),out);assert.ok(out.y<-.029)
 const outside=v(-3.5,1,11.5)
 for(let i=0;i<160;i++){c.resolve(outside,v(0,-.03,0),out);outside.add(out)}
 assert.ok(outside.y>floorHeight(outside.x,outside.z)+3.2);assert.ok(c.distance(outside)>.27)
 c.resolve(outside,v(0,.03,0),out);assert.ok(out.y>.029)
})
test('near-wall tangential motion, entrance edge recovery, no tunnelling and no stale collision state',()=>{
 const p=v(-3.5,floorHeight(-3.5,11.5)+2,11.5),out=v()
 c.resolve(p,v(8,0,0),out);assert.ok(out.x<3);p.add(out)
 c.resolve(p,v(0,.025,0),out);assert.ok(out.length()>.001);assert.ok(out.length()<=.025001)
 const lip=v(-2,floorHeight(-2,9.8)+.4,9.8)
 c.resolve(lip,v(),out);assert.equal(out.length(),0)
 // Recovery is possible along a wall normal even for a tracked pose within clearance.
 const triangle=cave.collision.triangles;assert.ok(triangle>0)
 const geom=cave.root.children[0].geometry,t=new THREE.Triangle(...[0,1,2].map(k=>v().fromBufferAttribute(geom.attributes.position,geom.index.getX(438+k)))),normal=v();t.getNormal(normal);const near=t.getMidpoint(v()).addScaledVector(normal,.08)
 c.resolve(near,normal.clone().multiplyScalar(.02),out);assert.ok(out.length()>.015)
 const far=v(0,0,8),delta=v(.02,.01,-.02);c.resolve(far,delta,out);assert.deepEqual(out,delta)
})
test('snap-turn remains independent of grotto rejection; no changes to movement tuning',()=>{
 const motion=createSwimMotion(),p=v(-3.5,floorHeight(-3.5,11.5)+2,11.5),input={rightValid:true,rightX:0,rightY:0};motion.step(.02,p,input);input.rightX=1;const r=motion.step(.02,p,input),angle=r.yaw;const out=v();c.resolve(p,r.delta,out);assert.equal(r.yaw,angle);assert.equal(Math.abs(angle),Math.PI/6)
})
test('grotto and its accessible chamber stay inside unchanged footprint; all shell approaches remain clear',()=>{
 const pos=cave.root.children[0].geometry.attributes.position;for(let i=0;i<pos.count;i++)assert.ok(Math.hypot(pos.getX(i)/OCEAN.radiusX,(pos.getZ(i)-OCEAN.centerZ)/OCEAN.radiusZ)<.9)
 const scene=new THREE.Scene();createOceanEnvironment(scene);const hunt=createOceanDiscoveries(scene,createDiscoveries(null));scene.add(cave.root);scene.updateMatrixWorld(true)
 for(const shell of hunt.entries){assert.ok(c.distance(shell.centre)>.8,`${shell.spec.id} uncovered`);const target=v(shell.spec.x,floorHeight(shell.spec.x,shell.spec.z)+1.65,shell.spec.z),p=v(0,5,8);assert.ok(travel(p,v(target.x,5,target.z))<.025);assert.ok(travel(p,target)<.025,`${shell.spec.id} original approach`);const ray=new THREE.Raycaster(target,shell.centre.clone().sub(target).normalize(),0,target.distanceTo(shell.centre));assert.equal(ray.intersectObject(cave.root.children[0]).length,0,`${shell.spec.id} collection ray`)}
 const botany=createOceanBotany(new THREE.Scene());for(const f of botany.families)for(const p of f.placements){const center=v(p.x,p.y+p.height/2,p.z);assert.ok(c.distance(center)>Math.min(p.radius,.35),`protected ${f.spec.id} ${p.x},${p.z}`)}
})
test('approved ocean, controls, collectibles, storage and creatures match M4 apart from checkout line endings',()=>{
 for(const file of ['config.js','swimming.js','environment.js','botany.js','fish.js','schools.js','jellyfish.js','dolphin.js','discoveries.js','audio.js']){const path='src/games/no-air/'+file;assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show','da0c0eed062ce01c706da2d06e6bac6379763efe:'+path],{encoding:'utf8'}).replaceAll('\r\n','\n'))}
 assert.equal(SHELLS.length,20);assert.equal(SHELLS.filter(s=>s.pearl).length,7)
})
test('original vault geometry is finite and remains within the rendering budget',()=>{
 assert.equal(cave.stats.draws,2);assert.equal(cave.stats.materials,2);assert.equal(cave.stats.textures+cave.stats.lights+cave.stats.transparentDraws,0);assert.ok(cave.stats.triangles<6000)
 const g=cave.root.children[0].geometry;for(const value of g.attributes.position.array)assert.ok(Number.isFinite(value));assert.ok(grottoSection(.5).width>grottoSection(0).width)
})

test('authored animal corridors remain clear of the cave, without editing any routes',()=>{
 const p=v();for(let i=0;i<400;i++){sampleFishRoute(i/400*FISH_LOOP_SECONDS,p);assert.ok(c.distance(p)>.5);sampleDolphinRoute(i/400*DOLPHIN_CYCLE,p);assert.ok(c.distance(p)>2)}
 for(const s of SCHOOL_SPECIES){const curve=new THREE.CatmullRomCurve3(s.points.map(p=>v(...p)),true,'centripetal');for(let i=0;i<400;i++){curve.getPointAt(i/400,p);assert.ok(c.distance(p)>s.spread*1.65+.5,s.id+' corridor')}}
})
