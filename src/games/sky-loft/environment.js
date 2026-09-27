import * as THREE from 'three'
import { ENVIRONMENTS } from './config.js'

// Exactly one opaque panorama. Cached maps swap only at the dark transition midpoint.
// Geometry/material belong to shared world disposal; this module owns cached maps.
export function createEnvironment(parent, loader = new THREE.TextureLoader()) {
  const material = new THREE.MeshBasicMaterial({side:THREE.BackSide,depthWrite:false,toneMapped:false,color:0x080917})
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1,48,24),material)
  sphere.name='SkyLoft_Environment';sphere.renderOrder=-10;parent.add(sphere)
  const ambient=new THREE.AmbientLight(0xffffff,1.7);parent.add(ambient)
  const cache=new Map(),fromColor=new THREE.Color(),toColor=new THREE.Color()
  let current=null,disposed=false,status='idle',brightness=1
  function show(record){
    material.map=record?.ready?record.texture:null
    material.color.setHex(record?.ready?0xffffff:ENVIRONMENTS[current].background).multiplyScalar(brightness)
    material.needsUpdate=true
    status=record?.ready?'ready':record?.failed?'failed':'loading'
  }
  function preload(id){
    if(disposed||!ENVIRONMENTS[id])return
    if(cache.has(id)){if(!cache.get(id).failed)return;cache.get(id).texture?.dispose();cache.delete(id)}
    const record={texture:null,ready:false,failed:false};cache.set(id,record)
    record.texture=loader.load(ENVIRONMENTS[id].panorama,texture=>{
      if(disposed){texture.dispose();return}
      texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter
      record.texture=texture;record.ready=true
      if(current===id)show(record)
    },undefined,()=>{if(!disposed){record.failed=true;if(current===id)show(record)}})
  }
  return {
    preload,
    ready:id=>Boolean(cache.get(id)?.ready),
    failed:id=>Boolean(cache.get(id)?.failed),
    apply(id){
      if(disposed||!ENVIRONMENTS[id])return false
      current=id;const d=ENVIRONMENTS[id]
      sphere.scale.setScalar(d.radius);sphere.rotation.y=d.yaw
      ambient.color.setHex(d.ambient);ambient.intensity=d.ambientIntensity
      preload(id);show(cache.get(id));return true
    },
    setBrightness(value){
      brightness=Math.max(0,Math.min(1,value))
      material.color.setHex(material.map?0xffffff:ENVIRONMENTS[current].background).multiplyScalar(brightness)
    },
    blendAtmosphere(from,to,t){
      fromColor.setHex(ENVIRONMENTS[from].ambient);toColor.setHex(ENVIRONMENTS[to].ambient)
      ambient.color.lerpColors(fromColor,toColor,t)
      ambient.intensity=THREE.MathUtils.lerp(ENVIRONMENTS[from].ambientIntensity,ENVIRONMENTS[to].ambientIntensity,t)
    },
    stats:()=>({environmentId:current,panoramaStatus:status,panoramaTextures:cache.size,environmentSpheres:1}),
    dispose(){
      if(disposed)return;disposed=true;material.map=null
      for(const record of cache.values())record.texture?.dispose()
      cache.clear()
    },
  }
}
