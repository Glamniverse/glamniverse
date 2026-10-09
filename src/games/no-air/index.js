import * as THREE from 'three'
import { createOceanEnvironment } from './environment.js'
import { createOceanFish } from './fish.js'
import { createOceanSchools } from './schools.js'
import { createOceanBotany } from './botany.js'
import { createOceanJellyfish } from './jellyfish.js'
import { createOceanDolphin } from './dolphin.js'
import { createOceanDiscoveries } from './discoveries.js'
import { createOceanGrotto } from './grotto.js'
import { createSwimMotion } from './swimming.js'
import { createOceanAudio } from './audio.js'
import { createOceanMenu } from './menu.js'
import { AUDIO_SRC, SWIM } from './config.js'

// Dedicated world, using the site's renderer/session/controller/Back lifecycle.
// No animation loop, requestSession, shared audio or global gameplay state here.
export function createNoAir({audioFactory}={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x034665)
 const camera=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.08,650)
 camera.position.set(0,0,8);camera.lookAt(0,-5,-24)
 const environment=createOceanEnvironment(scene),fish=createOceanFish(scene),schools=createOceanSchools(scene),botany=createOceanBotany(scene),jellies=createOceanJellyfish(scene),dolphin=createOceanDolphin(scene),discoveries=createOceanDiscoveries(scene),grotto=createOceanGrotto(scene),motion=createSwimMotion(),music=createOceanAudio(AUDIO_SRC,audioFactory)
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256
 const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.fillStyle='#d6f4ff';ctx.font='300 94px sans-serif';ctx.fillText('NO AIR',512,115);ctx.font='28px sans-serif';ctx.fillText('but still breathing',512,175)
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter
 const title=new THREE.Mesh(new THREE.PlaneGeometry(5.5,1.375),new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));title.position.set(0,.4,0);scene.add(title)
 const head=new THREE.Vector3(),after=new THREE.Vector3(),q=new THREE.Quaternion(),forward=new THREE.Vector3(),step=new THREE.Vector3()
 const input={hands:Array.from({length:2},()=>({position:new THREE.Vector3(),valid:false,grip:false})),leftValid:false,rightValid:false,leftX:0,leftY:0,rightX:0,rightY:0,yaw:0,viewYaw:0,selecting:false}
 const keys=new Set();let xr=null,disposed=false,suspended=false,placed=false,last=null,intro=0,desktopAttached=false,visibility=null
 const reset=()=>{discoveries.resetInput();last=null;motion.reset();schools.reset();keys.clear();for(const hand of input.hands)hand.valid=false}
 const menu=createOceanMenu(scene,music,()=>{motion.reset();keys.clear();for(const h of input.hands)h.valid=false},()=>window.returnToPortal(),discoveries.progress)
 function keydown(e){if(e.target?.closest?.('input,textarea'))return;if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){keys.add(e.code);e.preventDefault()}}
 const keyup=e=>keys.delete(e.code)
 function desktop(on){if(on===desktopAttached)return;desktopAttached=on;const method=on?'addEventListener':'removeEventListener';window[method]('keydown',keydown);window[method]('keyup',keyup);window[method]('blur',reset)}
 function detach(pauseAudio=true){menu.detach();if(xr&&visibility)xr.session.removeEventListener('visibilitychange',visibility);visibility=null;xr=null;placed=false;reset();if(pauseAudio)music.reset()}
 desktop(true)
 function readInputs(frame,reference,pose){
  input.leftValid=false;input.rightValid=false;input.selecting=false
  input.leftX=input.leftY=input.rightX=input.rightY=0
  const p=pose.transform.position
  for(let i=0;i<2;i++){
   const hand=input.hands[i],entry=xr.interaction?.controllers?.[i],source=entry?.source;hand.valid=false;hand.grip=false
   if(!entry?.connected||!source?.gripSpace||source.gamepad?.mapping!=='xr-standard')continue
   const gripPose=frame.getPose(source.gripSpace,reference)
   if(!gripPose||gripPose.emulatedPosition)continue
   const g=gripPose.transform.position,pad=source.gamepad
   // Reference-space hand minus head cancels origin locomotion and room-scale translation.
   hand.position.set(g.x-p.x,g.y-p.y,g.z-p.z);hand.valid=true;hand.grip=(pad.buttons?.[1]?.value||0)>SWIM.gripThreshold
   input.selecting ||= (pad.buttons?.[0]?.value||0)>.1
   if(pad.axes?.length>=4&&Number.isFinite(pad.axes[2]+pad.axes[3])){
    if(source.handedness==='left'){input.leftValid=true;input.leftX=pad.axes[2];input.leftY=pad.axes[3]}
    if(source.handedness==='right'){input.rightValid=true;input.rightX=pad.axes[2];input.rightY=pad.axes[3]}
   }
  }
 }
 return {scene,camera,
  getDebugState:()=>({disposed,suspended,placed,audioAvailable:music.available,velocity:motion.velocity.toArray(),...environment.stats(),grotto:grotto.stats,schools:schools.stats(),botany:botany.stats(),discoveries:{shells:discoveries.progress.shells,pearls:discoveries.progress.pearls,complete:discoveries.progress.complete}}),
  update(time,frame){
   if(disposed||suspended)return
   const now=Number.isFinite(time)?time/1000:0;const dt=last===null?0:now-last;last=now
   discoveries.update(dt);environment.update(now);fish.update(now);botany.update(now);jellies.update(now)
   if(!xr){
    if(dt>0&&dt<.1){
     camera.rotation.order='YXZ';camera.rotation.y+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*.5
     camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt*.35,-1.3,1.3)
     input.yaw=camera.rotation.y;input.viewYaw=camera.rotation.y;input.leftValid=input.rightValid=true;input.selecting=false
     input.leftX=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));input.leftY=Number(keys.has('KeyS'))-Number(keys.has('KeyW'))
     input.rightX=0;input.rightY=Number(keys.has('KeyQ'))-Number(keys.has('KeyE'))
     for(const h of input.hands)h.valid=false
     grotto.collision.resolve(camera.position,motion.step(dt,camera.position,input).delta,step);camera.position.add(step)
    }
    schools.update(dt,camera.position);dolphin.update(dt,camera.position)
   }else{
    if(!frame||xr.attaching||xr.cancelled||xr.ended||xr.ending||xr.session.visibilityState!=='visible'){reset();menu.close();music.reset();return}
    const reference=xr.renderer.xr.getReferenceSpace(),pose=reference&&frame.getViewerPose(reference)
    if(!pose){reset();menu.close();music.reset();return}
    const p=pose.transform.position,r=pose.transform.orientation
    if(!placed){
     xr.origin.position.set(-p.x,-p.y,8-p.z);xr.origin.rotation.set(0,0,0);xr.origin.updateMatrixWorld(true)
     const exit=xr.origin.getObjectByName('xr-exit-to-portal');if(exit)exit.position.y=p.y-.7
     placed=true;intro=now;reset();music.resume()
     q.set(r.x,r.y,r.z,r.w);forward.set(0,0,-1).applyQuaternion(q);forward.y=0;forward.normalize()
     title.position.set(0,.4,8).addScaledVector(forward,7);title.rotation.y=Math.atan2(-forward.x,-forward.z)
    }
    readInputs(frame,reference,pose)
    xr.origin.updateWorldMatrix(true,false);head.set(p.x,p.y,p.z).applyMatrix4(xr.origin.matrixWorld)
    schools.update(dt,head);dolphin.update(dt,head)
    q.set(r.x,r.y,r.z,r.w);forward.set(0,0,-1).applyQuaternion(q).applyQuaternion(xr.origin.quaternion)
    menu.update(xr,head,q.premultiply(xr.origin.quaternion));discoveries.updateXR(xr,frame,reference,!menu.open&&!input.hands.some(h=>h.grip));if(menu.open){motion.reset();return}
    input.yaw=xr.origin.rotation.y;input.viewYaw=Math.atan2(-forward.x,-forward.z)
    if(!input.hands.some(h=>h.valid)){motion.reset();return}
    const result=motion.step(dt,head,input);grotto.collision.resolve(head,result.delta,step)
    if(result.yaw){
     xr.origin.rotation.y+=result.yaw;xr.origin.updateMatrixWorld(true)
     after.set(p.x,p.y,p.z).applyMatrix4(xr.origin.matrixWorld);xr.origin.position.add(head).sub(after)
    }
    xr.origin.position.add(step);xr.origin.updateMatrixWorld(true)
   }
   if(!intro)intro=now
   const age=now-intro;title.material.opacity=Math.max(0,Math.min(.65,age*.22,(9-age)*.22));title.visible=age<9
  },
  xrHooks:{stationary:true,ownsAudio:true,customUI:true,onUserGesture(){music.resume()},
   onEnter(state){detach(false);xr=state;menu.attach(state);suspended=false;desktop(false);intro=0;visibility=()=>{if(state.session.visibilityState!=='visible'){reset();menu.close();music.reset()}};state.session.addEventListener('visibilitychange',visibility)},
   onRequestExit(){reset();menu.close();music.reset();title.visible=false},
   onExit(){detach();if(!disposed&&!suspended)desktop(true)},
   suspend(){suspended=true;detach();desktop(false);title.visible=false},
   dispose(){if(disposed)return;disposed=true;suspended=true;detach();desktop(false);menu.dispose();music.dispose();environment.dispose();fish.dispose();schools.dispose();botany.dispose();jellies.dispose();dolphin.dispose();discoveries.dispose();grotto.dispose()},
  },
 }
}
