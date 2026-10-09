import * as THREE from 'three'

export const COORDINATES_KEY='glamniverse.no-air.coordinates.v1'
export const COORDINATES_OFFSET=Object.freeze({x:.64,y:.4,z:-1.4})
export function createCoordinatesPreference(storage){
 if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
 let enabled=false
 try{enabled=storage?.getItem(COORDINATES_KEY)==='on'}catch{}
 return {get enabled(){return enabled},set(value){enabled=value===true;try{storage?.setItem(COORDINATES_KEY,enabled?'on':'off')}catch{};return enabled}}
}
const decimal=value=>{const s=value.toFixed(2);return s==='-0.00'?'0.00':s}
export const formatCoordinates=p=>`X: ${decimal(p.x)}\nY: ${decimal(p.y)}\nZ: ${decimal(p.z)}`

export function createOceanCoordinates(scene,preference=createCoordinatesPreference()){
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=224
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter
 const root=new THREE.Mesh(new THREE.PlaneGeometry(.32,.187),new THREE.MeshBasicMaterial({map:texture,toneMapped:false,depthTest:false,depthWrite:false}));root.name='no-air-coordinates';root.visible=false;root.renderOrder=10002;root.frustumCulled=false;scene.add(root)
 const world=new THREE.Vector3(),rotation=new THREE.Quaternion(),rigRotation=new THREE.Quaternion(),offset=new THREE.Vector3(COORDINATES_OFFSET.x,COORDINATES_OFFSET.y,COORDINATES_OFFSET.z)
 let nextText=-Infinity,lastText='',disposed=false
 function hide(){root.visible=false;nextText=-Infinity}
 return {root,preference,get enabled(){return preference.enabled},get text(){return lastText},
  toggle(){preference.set(!preference.enabled);hide()},hide,
  updateXR(seconds,pose,origin){
   if(disposed||!preference.enabled||!pose){hide();return}
   const p=pose.transform.position,q=pose.transform.orientation
   // Same reference-space viewer pose × origin matrix used by NO AIR navigation.
   // Called after artificial translation/snap-turn so rig and room-scale offsets agree.
   origin.updateWorldMatrix(true,false);world.set(p.x,p.y,p.z).applyMatrix4(origin.matrixWorld)
   if(!Number.isFinite(world.x+world.y+world.z)){hide();return}
   origin.getWorldQuaternion(rigRotation);rotation.set(q.x,q.y,q.z,q.w).premultiply(rigRotation)
   root.position.copy(offset).applyQuaternion(rotation).add(world);root.quaternion.copy(rotation);root.visible=true;root.updateMatrixWorld(true)
   // Pose follows every XR frame; only the canvas upload is throttled to 8 Hz.
   if(seconds<nextText)return;nextText=seconds+.125
   const text=formatCoordinates(world);if(text===lastText)return;lastText=text
   const c=canvas.getContext('2d');c.fillStyle='#0a2633';c.fillRect?.(0,0,384,224);c.fillStyle='#afc7ce';c.textAlign='left';c.textBaseline='middle';c.font='40px monospace'
   const lines=text.split('\n');for(let i=0;i<3;i++)c.fillText(lines[i],24,48+i*64);texture.needsUpdate=true
  },
  dispose(){hide();disposed=true}, // The existing world lifecycle owns GPU disposal.
 }
}
