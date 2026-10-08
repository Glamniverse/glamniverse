import * as THREE from 'three'
// WebXR Input Profiles registry: meta-quest-touch-plus left layout (also Touch v3).
// https://github.com/immersive-web/webxr-input-profiles/blob/main/packages/registry/profiles/meta/meta-quest-touch-plus.json
const TOUCH_LEFT_BUTTONS=['xr-standard-trigger','xr-standard-squeeze',null,'xr-standard-thumbstick','x-button','y-button','thumbrest','menu']
const SUPPORTED=new Set(['meta-quest-touch-plus','oculus-touch-v3'])
export function leftYPressed(source){
 if(source?.handedness!=='left'||source.gamepad?.mapping!=='xr-standard'||!source.profiles?.some(p=>SUPPORTED.has(p)))return false
 return source.gamepad.buttons[TOUCH_LEFT_BUTTONS.indexOf('y-button')]?.pressed===true
}
export function createYEdge(){let held=null;return {reset(){held=null},step(pressed){if(held===null){held=pressed;return false}const edge=pressed&&!held;held=pressed;return edge}}}
export function createOceanMenu(scene,music,resetMotion,exit,discoveries=null){
 const root=new THREE.Group();root.name='no-air-menu';root.visible=false;scene.add(root)
 const edge=createYEdge(),facing=new THREE.Vector3(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),buttons=[]
 let interaction=null,removers=[],lastState='',lastProgress=-1,disposed=false
 function setOpen(open){if(disposed)return;root.visible=open;interaction?.setMenuRays(open);resetMotion()}
 function button(y,action){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.263),new THREE.MeshBasicMaterial({map:texture,toneMapped:false,depthTest:false,depthWrite:false}));mesh.position.y=y;mesh.renderOrder=10001;root.add(mesh)
  function draw(top,bottom=''){const c=canvas.getContext('2d');c.fillStyle='#092637';c.fillRect?.(0,0,768,192);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#d7edf2';c.font='30px sans-serif';c.fillText(top,384,bottom?61:96);if(bottom){c.font='40px sans-serif';c.fillText(bottom,384,132)}texture.needsUpdate=true}
  const item={mesh,action,draw};buttons.push(item);return item
 }
 const musicButton=button(discoveries ? .12 : .3,()=>{music.toggle();refresh()});button(discoveries?-.18:0,()=>exit()).draw('EXIT EXPERIENCE');button(discoveries?-.48:-.3,()=>setOpen(false)).draw('RESUME')
 let discoveryCanvas=null,discoveryTexture=null
 if(discoveries){discoveryCanvas=document.createElement('canvas');discoveryCanvas.width=1024;discoveryCanvas.height=448;discoveryTexture=new THREE.CanvasTexture(discoveryCanvas);discoveryTexture.colorSpace=THREE.SRGBColorSpace;discoveryTexture.generateMipmaps=false;discoveryTexture.minFilter=THREE.LinearFilter;const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.46),new THREE.MeshBasicMaterial({map:discoveryTexture,toneMapped:false,depthTest:false,depthWrite:false}));panel.name='ocean-discoveries-menu';panel.position.y=.62;panel.renderOrder=10001;root.add(panel)}
 function refreshDiscoveries(){if(!discoveries||lastProgress===discoveries.shells)return;lastProgress=discoveries.shells;const c=discoveryCanvas.getContext('2d');c.fillStyle='#092637';c.fillRect?.(0,0,1024,448);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#d7edf2';c.font='34px sans-serif';c.fillText('OCEAN DISCOVERIES',512,44);c.font='36px sans-serif';c.fillText(`Shells discovered: ${discoveries.shells} / 20`,512,106);c.fillText(`Pearls collected: ${discoveries.pearls} / 7`,512,158);c.font='25px sans-serif';c.fillText('Explore the ocean and discover 20 hidden seashells.',512,221);c.fillText('Some contain pearls. Aim nearby and press either trigger.',512,259);c.fillText('Release swimming grips to collect. Left Y closes this menu.',512,297);
  if(discoveries.complete){const gradient=c.createRadialGradient?.(172,363,2,183,375,33);if(gradient){gradient.addColorStop(0,'#fff9e6');gradient.addColorStop(.4,'#d7e9e6');gradient.addColorStop(.75,'#aeb6de');gradient.addColorStop(1,'#d5b985');c.fillStyle=gradient;c.beginPath();c.arc(183,375,33,0,Math.PI*2);c.fill()}c.fillStyle='#ece0ba';c.font='30px sans-serif';c.fillText('THE GLAMNIVERSE PEARL — UNLOCKED',576,376)}else{c.font='26px sans-serif';c.fillStyle='#a6c1ca';c.fillText('The Glamniverse Pearl awaits all 20 discoveries.',512,378)}discoveryTexture.needsUpdate=true
 }
 function refresh(){refreshDiscoveries();const state=music.state;if(state===lastState)return;lastState=state;musicButton.draw('MUSIC: '+state.toUpperCase(),state==='Playing'||state==='Starting'?'PAUSE':'PLAY')}
 function detach(){setOpen(false);for(const remove of removers)remove();removers=[];interaction=null;edge.reset()}
 refresh()
 return {root,
  attach(state){detach();interaction=state.interaction;interaction?.setMenuRays(false);for(const b of buttons)if(interaction)removers.push(interaction.addTarget(b.mesh,b.action,{owned:false,enabled:()=>root.visible}))},
  update(state,head,viewQuaternion){
   if(disposed)return;const controller=state.interaction?.controllers?.find(e=>e.connected&&e.source?.handedness==='left')
   if(!controller)edge.reset()
   else if(edge.step(leftYPressed(controller.source))){
    if(!root.visible){position.copy(head);rotation.copy(viewQuaternion);facing.set(0,0,-1).applyQuaternion(rotation);facing.y=0;if(facing.lengthSq()<.001)facing.set(0,0,-1);facing.normalize();root.position.copy(position).addScaledVector(facing,1.65);root.position.y-=.08;root.rotation.set(0,Math.atan2(-facing.x,-facing.z),0);root.updateMatrixWorld(true)}
    setOpen(!root.visible)
   }
   if(root.visible)refresh()
  },
  get open(){return root.visible},close(){setOpen(false);edge.reset()},detach,
  dispose(){detach();disposed=true}, // Scene lifecycle disposes the menu planes and canvas textures.
 }
}
