import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { LEVEL } from './level.js'
import { createWaves } from './waves.js'
import { makePanel } from '../smash-the-hate/ui.js'

export function createArena(scene){
  scene.background=new THREE.Color(0x070518)
  const group=new THREE.Group();scene.add(group)
  const dark=new THREE.MeshBasicMaterial({color:0x121020}),pink=new THREE.MeshBasicMaterial({color:0xce2589}),cyan=new THREE.MeshBasicMaterial({color:0x31b4da})
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(C.platformDiameter/2,C.platformDiameter/2,0.06,48),dark)
  floor.position.y=-1.55;group.add(floor)
  const rim=new THREE.Mesh(new THREE.TorusGeometry(C.platformDiameter/2,0.012,4,64),pink)
  rim.rotation.x=Math.PI/2;rim.position.y=-1.515;group.add(rim)
  const portal=new THREE.Mesh(new THREE.TorusGeometry(1.1,0.03,6,48),cyan)
  portal.position.set(C.portalX,C.portalY,-C.portalDistance);group.add(portal)
  const name=makePanel(3.1,0.5,1024,128);name.draw(['ALL EYES ON ME']);name.mesh.position.set(C.portalX,C.portalY+1.8,-C.portalDistance);group.add(name.mesh)
  const material=new THREE.MeshBasicMaterial({color:0x070518,side:THREE.BackSide,depthWrite:false,toneMapped:false})
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(C.panoramaRadius,48,24),material)
  sphere.rotation.y=C.panoramaYaw;sphere.renderOrder=-10;group.add(sphere)
  const waves=createWaves(group,LEVEL.waves)
  let disposed=false,texture=null,status='headless'
  if(typeof document.createElementNS==='function'){
    status='loading'
    texture=new THREE.TextureLoader().load('/images/all-eyes-on-me/arena-360.png',loaded=>{
      if(disposed){loaded.dispose();return}
      loaded.colorSpace=THREE.SRGBColorSpace;loaded.generateMipmaps=false;loaded.minFilter=THREE.LinearFilter
      material.color.setHex(0xffffff);material.map=loaded;material.needsUpdate=true;status='ready'
    },undefined,()=>{if(!disposed){status='failed';console.warn('All Eyes panorama unavailable; dark fallback retained.')}})
  }
  return {group,reset(){portal.scale.setScalar(1);waves.reset()},update(t,phase){waves.update(t,phase==='playing');portal.scale.setScalar(1+(phase==='playing'?0.018:0.008)*Math.sin(t*1.3))},dispose(){disposed=true;waves.dispose();if(!material.map)texture?.dispose()},stats:()=>({panoramaStatus:status,...waves.stats()})}
}
