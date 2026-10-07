import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createOceanSchools,bodyDistance} from '../src/games/no-air/schools.js'
import {createOceanFish} from '../src/games/no-air/fish.js'
import {floorHeight,ROCKS} from '../src/games/no-air/config.js'
const make=()=>createOceanSchools(new THREE.Scene())
const tick=(s,seconds,player=null)=>{for(let i=0;i<seconds*40;i++)s.update(.025,player)}
const difference=(a,b)=>a.members.reduce((sum,m,i)=>sum+m.position.distanceTo(b.members[i].position),0)/a.members.length

test('three distinct instanced silhouettes, exact populations, independent first resident and bounded resource cost',()=>{
 const scene=new THREE.Scene(),fish=createOceanFish(scene),s=createOceanSchools(scene)
 assert.deepEqual(s.schools.map(x=>x.mesh.count),[24,12,6]);assert.equal(scene.children.length,2);assert.equal(fish.root.name,'no-air-single-fish')
 const ratios=[]
 for(const x of s.schools){assert.ok(x.mesh.isInstancedMesh);assert.equal(x.mesh.material.transparent,false);assert.equal(x.mesh.material.uniforms.time.value,0)
 x.mesh.geometry.computeBoundingBox();const size=x.mesh.geometry.boundingBox.getSize(new THREE.Vector3());ratios.push(size.y/size.z)
 assert.equal(new Set(x.mesh.geometry.attributes.swim.array.filter((_,i)=>i%2===0)).size,x.mesh.count)
 assert.ok(x.mesh.geometry.attributes.position.count/3<350);assert.equal(x.mesh.geometry.attributes.uv,undefined)
 }
 assert.ok(ratios[1]>ratios[0]*1.7);assert.ok(ratios[2]>ratios[0]*1.25);assert.ok(s.schools[2].spec.length>s.schools[1].spec.length*1.8)
 assert.ok(s.stats().reduce((n,x)=>n+x.triangles,0)<15000)
})
test('Silver members split locally on both sides, retain bounded motion, and rejoin after passage',()=>{
 const s=make(),control=make(),silver=s.schools[0],p=new THREE.Vector3(),delta=new THREE.Vector3(),right=new THREE.Vector3(),ahead=new THREE.Vector3()
 let peak=0,left=0,rightCount=0,minDistance=100
 for(let frame=0;frame<320;frame++){
  const t=frame*.025;p.set(0,-.5,6-t*.9)
  const previous=silver.members.map(m=>m.position.clone());s.update(.025,p);control.update(.025,null)
  peak=Math.max(peak,difference(silver,control.schools[0]))
  silver.curve.getPointAt(((frame*.025)/silver.spec.period+.001)%1,ahead);right.crossVectors(new THREE.Vector3(0,1,0),ahead.sub(silver.center)).normalize()
  for(let i=0;i<silver.members.length;i++){const m=silver.members[i];assert.ok(m.position.distanceTo(previous[i])<=silver.spec.speed*.025+1e-8)
   if(m.avoidance>.02){const side=delta.subVectors(m.position,p).dot(right);if(side<0)left++;else rightCount++}
   minDistance=Math.min(minDistance,bodyDistance(m.position,p,delta))
  }
 }
 assert.ok(peak>.25,`response ${peak}`);assert.ok(left>0&&rightCount>0);assert.ok(minDistance>.35,`clearance ${minDistance}`)
 tick(s,24);tick(control,24);assert.ok(difference(silver,control.schools[0])<.08)
})
test('Tropical stays independent outside intimate contact; Deep Water retreats cohesively and releases',()=>{
 const s=make(),control=make(),deep=s.schools[2],player=deep.center.clone().add(new THREE.Vector3(0,0,2))
 tick(s,6,player);tick(control,6)
 assert.ok(deep.retreat.length()>1);assert.ok(deep.center.clone().add(deep.retreat).distanceTo(player)>deep.center.distanceTo(player))
 assert.ok(difference(s.schools[1],control.schools[1])<1e-8)
 for(const m of deep.members)assert.ok(m.position.distanceTo(deep.center.clone().add(deep.retreat))<5)
 const before=deep.retreat.length();tick(s,35,new THREE.Vector3(100,100,100));assert.ok(deep.retreat.length()<before*.03)
})
test('full authored patrols stay finite above terrain, clear near rock surfaces and retain counts',()=>{
 const s=make();let minimum=100
 for(let f=0;f<7200;f++){
  s.update(.025,null)
  if(f%8)continue
  for(const school of s.schools)for(const m of school.members){assert.ok(Number.isFinite(m.position.length()));const p=m.position;minimum=Math.min(minimum,p.y-floorHeight(p.x,p.z));
   for(const [x,z,sx,sy,sz] of ROCKS){const cy=floorHeight(x,z)+sy*.28;assert.ok(((p.x-x)/(sx*1.08+.2))**2+((p.y-cy)/(sy*1.08+.2))**2+((p.z-z)/(sz*1.08+.2))**2>1,school.spec.id+' rock clearance')}
  }
 }
 assert.ok(minimum>.5,`seabed clearance ${minimum}`);assert.deepEqual(s.schools.map(x=>x.members.length),[24,12,6])
})
test('tracking gaps, reset and disposal cannot launch, duplicate or retain retreat state',()=>{
 const s=make(),p=s.schools[2].center.clone();tick(s,2,p);s.reset()
 for(const x of s.schools){assert.equal(x.retreat.length(),0);assert.equal(x.retreating,false);for(const m of x.members)assert.equal(m.velocity.length(),0)}
 const before=s.schools[0].members[0].position.clone();s.update(10,p);assert.deepEqual(s.schools[0].members[0].position,before)
 s.dispose();s.update(.025,p);assert.deepEqual(s.schools[0].members[0].position,before);assert.equal(s.root.children.length,3)
})
