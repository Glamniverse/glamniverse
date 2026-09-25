import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { makePanel } from '../smash-the-hate/ui.js'
import { eyeGeometry } from './targets.js'

export function createArena(scene){
  scene.background=new THREE.Color(0x070518)
  const group=new THREE.Group();scene.add(group)
  const dark=new THREE.MeshBasicMaterial({color:0x121020}),pink=new THREE.MeshBasicMaterial({color:0xce2589}),cyan=new THREE.MeshBasicMaterial({color:0x31b4da})
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(C.platformDiameter/2,C.platformDiameter/2,0.06,48),dark)
  floor.position.y=-1.55;group.add(floor)
  const rim=new THREE.Mesh(new THREE.TorusGeometry(C.platformDiameter/2,0.012,4,64),pink)
  rim.rotation.x=Math.PI/2;rim.position.y=-1.515;group.add(rim)
  const portal=new THREE.Mesh(new THREE.TorusGeometry(1.1,0.03,6,48),cyan)
  portal.position.set(0,-0.2,-C.portalDistance);group.add(portal)
  const name=makePanel(3.1,0.5,1024,128);name.draw(['ALL EYES ON ME']);name.mesh.position.set(0,1.2,-C.portalDistance);group.add(name.mesh)
  // One instanced skyline; placeholder only, no Smash panorama or heavy assets.
  const city=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),dark,24)
  const dummy=new THREE.Object3D()
  for(let i=0;i<24;i++){
    const angle=i/24*Math.PI*2,r=24+(i%3)*8
    dummy.position.set(Math.sin(angle)*r,-10,Math.cos(angle)*r)
    dummy.scale.set(2,7+i%7,2);dummy.updateMatrix();city.setMatrixAt(i,dummy.matrix)
  }
  group.add(city)
  const eyes=new THREE.InstancedMesh(eyeGeometry(),pink,8)
  for(let i=0;i<8;i++){
    const angle=(i+0.5)/8*Math.PI*2
    dummy.position.set(Math.sin(angle)*32,5+(i%2)*5,Math.cos(angle)*32)
    dummy.scale.set(3,3,3);dummy.rotation.y=angle+Math.PI;dummy.updateMatrix();eyes.setMatrixAt(i,dummy.matrix)
  }
  group.add(eyes)
  return {group,reset(){portal.scale.setScalar(1)},update(t,phase){portal.scale.setScalar(1+(phase==='playing'?0.018:0.008)*Math.sin(t*1.3))},dispose(){city.dispose();eyes.dispose()},stats:()=>({placeholderArena:true})}
}
