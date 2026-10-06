import * as THREE from 'three'
import { createOceanEnvironment } from './environment.js'

export function createNoAir(){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x034665)
 const camera=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.08,650)
 camera.position.set(0,0,8);camera.lookAt(0,-5,-24)
 const environment=createOceanEnvironment(scene)
 let disposed=false
 return {scene,camera,update(time){if(!disposed)environment.update((time||0)/1000)},
  xrHooks:{stationary:true,ownsAudio:true,dispose(){disposed=true;environment.dispose()}},
  getDebugState:()=>environment.stats(),
 }
}
