import * as THREE from 'three'
import { CONFIG, REALITIES } from './config.js'
import { createLoft } from './loft.js'
import { createEnvironment } from './environment.js'
import { createSelector } from './selector.js'
import { createLoftAudio } from './audio.js'
import { createRealityVisitors } from './reality-visitors.js'
import { createRealityEngine } from './reality.js'
import { createCompanion } from './companion.js'
import { createExploration } from './exploration.js'
import { createBarkAudio } from './bark.js'
import { createSpatialLyrics } from './lyrics.js'

// No renderer, requestSession, scheduler, controller listeners, or shared-site audio player here.
export function createSkyLoft({ back, environmentLoader, companionLoader, lyricsOptions, audioFactory = () => new Audio() } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x080917)
  const camera = new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,0.05,250)
  camera.position.set(0,CONFIG.virtualEyeHeight,0)
  const place = new THREE.Group(); scene.add(place)
  const loft = createLoft(place), environment = createEnvironment(place,environmentLoader)
  // Static loft batches also occlude the companion ray target; geometry stays unchanged.
  const petOccluders=place.children.filter(o=>o.isInstancedMesh)
  const visitors = createRealityVisitors(place)
  const lyrics = createSpatialLyrics(place,lyricsOptions)
  const bark=createBarkAudio(),exploration=createExploration(place)
  const companion = createCompanion(place,companionLoader,(time,position,kind)=>kind==='whimper'?bark.whimper(time,position):bark.greet(time,position))
  const menuAnchor = new THREE.Group(); scene.add(menuAnchor); menuAnchor.position.y=CONFIG.virtualEyeHeight
  let xr=null,disposed=false,placed=false
  const selector=createSelector(menuAnchor,id=>{bark.activate();lyrics.hide();lyrics.prepare(REALITIES[id]);reality.select(id);refreshControls()},back,mode=>{bark.activate();exploration.setMode(mode)},()=>{reality.togglePlayback();refreshControls()},()=>{lyrics.toggle();refreshControls()})
  lyrics.setOccluder(selector.group)
  petOccluders.push(...selector.group.children.filter(o=>o.isMesh))
  const music=createLoftAudio(audioFactory(),message=>selector.setPlayback(message))
  const reality=createRealityEngine({environment,loft,visitors,music,onSelect:song=>selector.select(song),notify:message=>selector.setPlayback(message)})
  // Reuse playback snapshots; the lyric renderer only animates occupied pool slots.
  const clockState={},realityState={},lyricState={}
  function refreshControls(){selector.setControls(music.getClock(clockState),reality.stats(realityState),lyrics.stats(lyricState))}
  refreshControls()
  // Reused temporaries; only first valid XR pose anchors room/UI. Never moves camera.
  const head=new THREE.Vector3(),forward=new THREE.Vector3(),q=new THREE.Quaternion(),originQ=new THREE.Quaternion(),dogPosition=new THREE.Vector3()
  const enabled=()=>!disposed&&placed&&xr&&!xr.attaching&&!xr.cancelled&&!xr.ended&&xr.session.visibilityState==='visible'
  let onVisibility = null
  const unbind=()=>{
    if(xr && onVisibility) xr.session.removeEventListener('visibilitychange',onVisibility)
    onVisibility=null;selector.unbind();lyrics.reset();music.release();reality.reset();visitors.reset();companion.reset();bark.reset();exploration.reset();selector.setMovement('stationary');xr=null;placed=false
  }
  return {
    scene,camera, getPlaybackClock: () => ({...music.getClock(),...reality.stats()}),
    getDebugState:()=>({disposed,placed,movement:exploration.mode,...reality.stats(),...selector.stats(),...lyrics.stats(),...environment.stats(),...visitors.stats(),...companion.stats(),loftInstances:loft.instances}),
    update(time,frame) {
      if(disposed)return
      reality.update(time, Boolean(frame && enabled()))
      visitors.update(time, Boolean(frame && enabled()))
      refreshControls()
      if(disposed||!xr||!frame||xr.attaching||xr.cancelled||xr.ended||xr.session.visibilityState!=='visible'){companion.update(time,null,false);exploration.pause();bark.pause();return}
      const reference=xr.renderer.xr.getReferenceSpace()
      if(!reference){companion.update(time,null,false);exploration.pause();bark.pause();return}
      const pose=frame.getViewerPose(reference)
      if(!pose){companion.update(time,null,false);exploration.pause();bark.pause();return}
      const p=pose.transform.position,r=pose.transform.orientation
      if(placed)exploration.update(time,pose,true)
      xr.origin.updateWorldMatrix(true,false)
      head.set(p.x,p.y,p.z).applyMatrix4(xr.origin.matrixWorld)
      if(placed){
        xr.origin.getWorldQuaternion(originQ);q.set(r.x,r.y,r.z,r.w)
        forward.set(0,0,-1).applyQuaternion(q).applyQuaternion(originQ)
        lyrics.update(clockState,realityState,head,forward)
        companion.update(time,head,true)
        if(companion.getWorldPosition(dogPosition)){
          xr.origin.getWorldQuaternion(originQ);q.set(r.x,r.y,r.z,r.w)
          forward.set(0,0,-1).applyQuaternion(q).applyQuaternion(originQ)
          bark.update(head,forward,dogPosition)
        }else bark.pause()
        return
      }
      xr.origin.getWorldQuaternion(originQ);q.set(r.x,r.y,r.z,r.w)
      forward.set(0,0,-1).applyQuaternion(q).applyQuaternion(originQ);forward.y=0
      if(forward.lengthSq()<0.001)return // wait for a level-enough gaze to choose front
      const yaw=Math.atan2(-forward.x,-forward.z)
      menuAnchor.position.copy(head);menuAnchor.rotation.y=yaw
      place.position.copy(head);place.position.y-=CONFIG.virtualEyeHeight;place.rotation.y=yaw
      menuAnchor.updateMatrixWorld(true);place.updateMatrixWorld(true);placed=true
    },
    xrHooks:{
      stationary:true,ownsAudio:true,customUI:true,
      onEnter(state){
        unbind();xr=state;placed=false;exploration.bind(state);bark.activate();companion.load();selector.bind(state.interaction,enabled);companion.bind(state.interaction,enabled,petOccluders,()=>bark.activate())
        onVisibility=()=>{if(state.session.visibilityState!=='visible'){reality.pause();bark.pause();exploration.pause()}}
        state.session.addEventListener('visibilitychange',onVisibility)
      },
      onRequestExit(){lyrics.reset();music.release();reality.reset();selector.unbind();companion.reset();bark.reset();exploration.reset();selector.setMovement('stationary');placed=false},
      onExit:unbind,
      suspend:unbind,
      dispose(){
        if(disposed)return
        disposed=true;unbind();lyrics.dispose();reality.dispose();music.dispose();visitors.dispose();companion.dispose();bark.dispose();environment.dispose()
        // Shared createWorldLifecycle disposes all remaining scene graphics exactly once.
      },
    },
  }
}
