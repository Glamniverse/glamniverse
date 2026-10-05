import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createBalconyPlants,PLANT_GROUPS} from '../src/games/sky-loft/balcony-plants.js'

test('three natural plant groups add three static batches, 364 triangles and no textures/lights',()=>{
  const root=new THREE.Group(),group=createBalconyPlants(root)
  assert.equal(PLANT_GROUPS.length,3);assert.equal(group.children.length,3)
  assert.deepEqual(group.children.map(o=>o.count),[3,23,6])
  let triangles=0
  group.traverse(o=>{
    assert.ok(!o.isLight)
    if(o.isMesh){assert.ok(o.isInstancedMesh);assert.equal(o.material.transparent,false);assert.equal(o.material.map,null);assert.equal(o.material.emissive.getHex(),0);assert.equal(o.castShadow,false);triangles+=o.geometry.index.count/3*o.count}
  })
  assert.equal(triangles,364)
})

test('entire plant geometry stays on floor, outside walkable footprint and away from selector/dog',()=>{
  const group=createBalconyPlants(new THREE.Group()),matrix=new THREE.Matrix4(),p=new THREE.Vector3()
  for(const mesh of group.children){
    const positions=mesh.geometry.attributes.position
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,matrix)
      for(let n=0;n<positions.count;n++){
        p.fromBufferAttribute(positions,n).applyMatrix4(matrix)
        assert.ok(Math.abs(p.x)<7&&Math.abs(p.z)<6)
        assert.ok(p.y>=-1e-7&&p.y<1.6)
        assert.ok(Math.abs(p.x)>6.35||p.z>5.15,`plant intrudes at ${p.toArray()}`)
      }
    }
  }
})
