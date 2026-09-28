import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { CONFIG, SONGS, ENVIRONMENTS, createSelection } from '../src/games/sky-loft/config.js'
import { createSkyLoft } from '../src/games/sky-loft/index.js'
import { createEnvironment } from '../src/games/sky-loft/environment.js'

globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})}
globalThis.window={innerWidth:1200,innerHeight:800}
class FakeAudio extends EventTarget {
  paused=true;currentTime=0;duration=180;src='';plays=0
  getAttribute(){return this.src}
  removeAttribute(){this.src=''}
  load(){this.currentTime=0}
  pause(){this.paused=true}
  play(){this.plays++;this.paused=false;return Promise.resolve()}
}
function imageLoader(){
  const requests=[]
  return {requests,load(path,ok,progress,fail){
    const texture=new THREE.Texture();let releases=0;texture.addEventListener('dispose',()=>releases++)
    requests.push({path,texture,ok,fail,releases:()=>releases});return texture
  }}
}
function harness(){
  const loader=imageLoader();let backs=0
  const game=createSkyLoft({back:()=>backs++,environmentLoader:loader,companionLoader:{load(){}},audioFactory:()=>new FakeAudio()})
  const registered=[]
  const origin=new THREE.Group();origin.position.set(0,1.6,0);game.scene.add(origin)
  const state={origin,session:Object.assign(new EventTarget(),{visibilityState:'visible'}),renderer:{xr:{getReferenceSpace:()=>({})}},
    interaction:{addTarget(object,select,options){const entry={object,select,options};registered.push(entry)
      return()=>{options.onHover?.(false);const i=registered.indexOf(entry);if(i>=0)registered.splice(i,1)}}}}
  let position={x:0,y:0,z:0}
  const frame={getViewerPose:()=>({transform:{position,orientation:{x:0,y:0,z:0,w:1}}})}
  return {game,state,registered,loader,backs:()=>backs,
    tick(time=0){game.update(time,frame)},move(p){position=p},enter(){game.xrHooks.onEnter(state);game.update(0,frame)}}
}
test('two immutable prototype songs reference valid environment; verified Neon Therapy audio and no lyrics',()=>{
  assert.equal(SONGS.length,3)
  assert.equal(new Set(SONGS.map(s=>s.id)).size,3)
  for(const song of SONGS){assert.ok(ENVIRONMENTS[song.environmentId]);assert.equal(song.audioSrc,song.id==='neon-therapy'?'/neon-therapy.mp3':'/audio/sky-loft/'+song.id+'.mp3');assert.equal(song.lyrics,'/data/sky-loft/lyrics/'+song.id+'.json');assert.ok(Object.isFrozen(song))}
})
test('selection is validated, idempotent and disabled after disposal',()=>{
  const changes=[];const state=createSelection(song=>changes.push(song.id))
  assert.equal(state.select('missing'),false);assert.equal(state.select(SONGS[0].id),false)
  assert.equal(state.select(SONGS[1].id),true);assert.deepEqual(changes,[SONGS[1].id])
  state.dispose();assert.equal(state.select(SONGS[0].id),false)
})
test('one panorama reused across repeated selections; no duplicate texture requests',()=>{
  const h=harness();h.enter()
  for(let i=0;i<30;i++)h.registered[i%2].select()
  assert.equal(h.loader.requests.length,2);assert.equal(h.game.getDebugState().registeredTargets,7)
  h.game.xrHooks.dispose();assert.equal(h.registered.length,0)
})
test('selector targets ray-hit/miss, hover restoration and selection state',()=>{
  const h=harness();h.enter();h.game.scene.updateMatrixWorld(true)
  const eye=new THREE.Vector3(0,1.6,0)
  const target=h.registered[1],center=target.object.getWorldPosition(new THREE.Vector3())
  const ray=new THREE.Raycaster(eye,center.clone().add(new THREE.Vector3(.02,0,0)).sub(eye).normalize(),0,5)
  assert.equal(ray.intersectObjects(h.registered.map(e=>e.object)).length,1)
  for(let i=0;i<SONGS.length;i++){const p=h.registered[i].object.getWorldPosition(new THREE.Vector3());p.x+=.02;ray.ray.direction.copy(p.sub(eye).normalize());assert.equal(ray.intersectObjects(h.registered.map(e=>e.object)).length,1);h.registered[i].select();assert.equal(h.game.getDebugState().selected,SONGS[i].id)}
  ray.ray.direction.set(0,1,0);assert.equal(ray.intersectObjects(h.registered.map(e=>e.object)).length,0)
  target.options.onHover(true);assert.equal(target.object.scale.x,1.035)
  target.select();assert.equal(h.game.getDebugState().selected,'daydream')
  target.options.onHover(false);assert.equal(target.object.scale.x,1)
  h.game.xrHooks.dispose()
})
test('XR placement anchored once; physical head motion never moves room/menu/camera',()=>{
  const h=harness();h.enter()
  const camera=h.game.camera.position.clone(),matrix=h.registered[0].object.matrixWorld.clone()
  h.move({x:0.3,y:-0.2,z:0.1});h.tick();h.game.scene.updateMatrixWorld(true)
  assert.deepEqual(h.game.camera.position,camera);assert.deepEqual(h.registered[0].object.matrixWorld,matrix)
  assert.equal(h.game.xrHooks.stationary,true);assert.equal(h.game.xrHooks.ownsAudio,true)
  h.game.xrHooks.dispose()
})
test('invalid pose / pending XR / hidden session cannot select; recovery is clean',()=>{
  const h=harness();h.state.attaching=true;h.enter()
  assert.equal(h.registered[1].options.enabled(),false);h.registered[1].select()
  assert.equal(h.game.getDebugState().selected,SONGS[0].id)
  h.state.attaching=false;h.tick();assert.equal(h.registered[1].options.enabled(),true)
  h.state.session.visibilityState='hidden';h.registered[1].select()
  assert.equal(h.game.getDebugState().selected,SONGS[0].id)
  h.state.session.visibilityState='visible';h.registered[1].select()
  assert.equal(h.game.getDebugState().selected,SONGS[1].id);h.game.xrHooks.dispose()
})
test('Back, interrupted exit, repeated sessions and idempotent disposal unregister all targets',()=>{
  const h=harness()
  for(let i=0;i<10;i++){h.enter();h.game.xrHooks.onEnter(h.state);h.tick();assert.equal(h.registered.length,7)
    h.registered[3].select();h.game.xrHooks.onRequestExit();assert.equal(h.registered.length,0)
    h.game.xrHooks.onExit();assert.equal(h.game.getDebugState().placed,false)}
  assert.equal(h.backs(),10)
  h.enter();h.game.xrHooks.suspend();assert.equal(h.registered.length,0)
  h.game.xrHooks.dispose();h.game.xrHooks.dispose()
  assert.equal(h.loader.requests[0].releases(),1);assert.equal(h.game.getDebugState().disposed,true)
})
test('late/failed image loads never reattach after disposal; fallback remains usable',()=>{
  const parent=new THREE.Group(),loader=imageLoader(),env=createEnvironment(parent,loader)
  assert.equal(env.apply('bad'),false);env.apply('sky-city')
  loader.requests[0].fail();assert.equal(env.stats().panoramaStatus,'failed')
  env.dispose();loader.requests[0].ok(loader.requests[0].texture)
  assert.equal(parent.children[0].material.map,null);assert.equal(env.stats().panoramaTextures,0)
  assert.equal(env.apply('sky-city'),false)
})
test('successful texture is sRGB, no mipmaps, and clears on disposal',()=>{
  const parent=new THREE.Group(),loader=imageLoader(),env=createEnvironment(parent,loader)
  env.apply('sky-city');loader.requests[0].ok(loader.requests[0].texture)
  assert.equal(env.stats().panoramaStatus,'ready')
  assert.equal(loader.requests[0].texture.generateMipmaps,false)
  assert.equal(loader.requests[0].texture.colorSpace,THREE.SRGBColorSpace)
  env.dispose();assert.equal(parent.children[0].material.map,null)
})
test('geometry budget is bounded; no transparent materials, shadows or frame animation',()=>{
  const h=harness();let calls=0,triangles=0,textures=new Set(),lights=0
  h.game.scene.traverse(o=>{
    if(o.isMesh){calls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1)
      if(o.parent.name!=='SkyLoft_SpatialLyrics')assert.equal(o.material.transparent,false);if(o.material.map)textures.add(o.material.map)}
    if(o.isLight){lights++;assert.ok(!o.castShadow)}
  })
  assert.ok(calls<=25);assert.ok(triangles<9000);assert.equal(textures.size,9);assert.equal(lights,2)
  console.log('Sky Loft static budget', {calls,triangles,textures:textures.size+1,lights})
  assert.ok(CONFIG.selectorDistance<5);h.game.xrHooks.dispose()
})
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8')
test('public Sky Loft registers once without Preview flags, keeping capability checks and public games',()=>{
  const block=source.slice(source.indexOf('// Public Sky Loft release:'),source.indexOf('function showInHisMindRoom'))
  assert.ok(!block.includes('import.meta.env'))
  assert.equal(source.split("stationaryVRWorlds.add('skyLoft')").length-1,1)
  assert.equal(source.split("import('./games/sky-loft/index.js')").length-1,1)
  assert.ok(block.includes("entry.textContent = 'THE SKY LOFT'"))
  assert.ok(!block.includes('PREVIEW'))
  assert.ok(block.includes('Choose a song. Change your reality.'))
  assert.ok(block.includes("checkVRExperienceSupport('skyLoft'"))
  assert.ok(source.slice(0,source.indexOf('// Public Sky Loft release:')).includes('createAllEyesOnMe'))
})
test('shared warning blocks loft factory without XR and cancels pending Back',async()=>{
  const nodes=new Map()
  const document={querySelector(key){if(!nodes.has(key))nodes.set(key,{textContent:'',classList:{contains:()=>false,add(){},remove(){},toggle(){}},pause(){}});return nodes.get(key)},querySelectorAll:()=>[]}
  let resolve,created=0
  const window={isSecureContext:true}
  const code=source.slice(source.indexOf('let smashEntryRequest'),source.indexOf('window.openSmashTheHate = async'))
  const gate=Function('window','document','navigator','activeWorld',code+';return {check:checkVRExperienceSupport,dismiss:dismissSmashInfo}')(window,document,{xr:{isSessionSupported:()=>new Promise(r=>resolve=r)}},null)
  const openCode=source.slice(source.indexOf('    async function openLoft()'),source.indexOf('    entry.onclick = openLoft'))
  const open=Function('window','document','deferUntilVRExit','checkVRExperienceSupport','disposeCurrentWorld','createSkyLoft','createWorldLifecycle','startWorldAnimation',openCode+';return openLoft')(
    window,document,()=>false,gate.check,gate.dismiss,()=>{created++;return {}},()=>{},()=>{})
  let pending=open();resolve(false);await pending
  assert.equal(created,0);assert.match(nodes.get('#smash-support-message').textContent,/VR HEADSET REQUIRED/)
  assert.equal(nodes.get('#smash-info-title').textContent,'THE SKY LOFT')
  pending=open();gate.dismiss();resolve(true);await pending;assert.equal(created,0)
  pending=open();resolve(true);await pending;assert.equal(created,1)
})

import { createLoftAudio } from '../src/games/sky-loft/audio.js'
test('M2 panorama matches unchanged 2:1 source and uses its dedicated environment path',()=>{
  const path=ENVIRONMENTS['sky-city'].panorama
  assert.equal(path,'/images/sky-loft/neon-city-loft.png')
  const bytes=readFileSync(new URL('../public'+path,import.meta.url))
  assert.equal(bytes.readUInt32BE(16),1774);assert.equal(bytes.readUInt32BE(20),887)
  assert.ok(readFileSync(new URL('../public/neon-therapy.mp3',import.meta.url)).length>3000000)
})
test('audio switches on a single element, missing song stops previous, clock is media time',async()=>{
  const media=new FakeAudio(),messages=[],audio=createLoftAudio(media,m=>messages.push(m))
  audio.select(SONGS[0]);await Promise.resolve()
  assert.equal(media.src,'/neon-therapy.mp3');assert.equal(media.paused,false)
  media.currentTime=12.4;assert.equal(audio.getClock().seconds,12.4)
  audio.select(SONGS[0]);assert.equal(media.plays,1)
  audio.select({...SONGS[1],audioSrc:null});assert.equal(media.paused,true);assert.equal(media.src,'')
  assert.equal(audio.getClock().status,'unavailable');assert.match(messages.at(-1),/not available/)
  audio.select(SONGS[0]);await Promise.resolve();assert.equal(media.plays,2)
  audio.release();assert.equal(media.paused,true);assert.equal(media.src,'')
  audio.dispose();audio.dispose()
})
test('audio blocked playback, retry, late promises and disposal fail safely',async()=>{
  const media=new FakeAudio(),audio=createLoftAudio(media)
  media.play=()=>Promise.reject(Error('blocked'))
  audio.select(SONGS[0]);await Promise.resolve();await Promise.resolve()
  assert.equal(audio.getClock().status,'error');assert.equal(media.paused,true)
  let resolve
  media.play=()=>new Promise(r=>resolve=r)
  audio.select(SONGS[0]);audio.select({...SONGS[1],audioSrc:null});resolve();await Promise.resolve()
  assert.equal(audio.getClock().status,'unavailable')
  audio.select(SONGS[0]);audio.dispose();resolve();await Promise.resolve()
  assert.equal(media.src,'');assert.equal(audio.getClock().playing,false)
})
test('headset menu pauses music, explicit selection resumes; exit releases media',async()=>{
  const h=harness();h.enter();h.registered[0].select();await Promise.resolve()
  assert.equal(h.game.getPlaybackClock().playing,true)
  h.state.session.visibilityState='hidden';h.state.session.dispatchEvent(new Event('visibilitychange'))
  assert.equal(h.game.getPlaybackClock().playing,false)
  h.state.session.visibilityState='visible';h.registered[0].select();await Promise.resolve()
  assert.equal(h.game.getPlaybackClock().playing,true)
  h.game.xrHooks.onExit();assert.equal(h.game.getPlaybackClock().songId,null)
  h.game.xrHooks.dispose()
})

import { VISITOR_PROFILE, visitorPosition, createVisitors } from '../src/games/sky-loft/visitors.js'
test('visitor routes remain outside the loft and never enter the face/room corridor',()=>{
  const p=new THREE.Vector3()
  for(const route of VISITOR_PROFILE.routes)for(let i=0;i<=1000;i++){
    visitorPosition(i/1000,route,p)
    assert.ok(Math.abs(p.x)>CONFIG.width/2+1 || Math.abs(p.z)>CONFIG.depth/2+1)
    assert.ok(p.y>3)
  }
})
test('two visitors reuse shared resources across cycles and freeze/reset/dispose safely',()=>{
  const root=new THREE.Group(),visitors=createVisitors(root)
  assert.equal(root.children.length,2)
  assert.equal(root.children[0].children[0].geometry,root.children[1].children[0].geometry)
  let peak=0
  for(let i=0;i<18000;i++){visitors.update(i*1000/72,true);peak=Math.max(peak,visitors.stats().activeVisitors)}
  assert.equal(peak,2);assert.equal(root.children.length,2)
  visitors.update(999999,false);assert.equal(visitors.stats().activeVisitors,0)
  visitors.reset();assert.equal(visitors.stats().activeVisitors,0)
  visitors.apply(null);visitors.update(0,true);assert.equal(visitors.stats().activeVisitors,0)
  visitors.dispose();visitors.update(1,true);assert.equal(visitors.stats().activeVisitors,0)
})

test('exploration selector preserves song rays and resets movement/rig on XR re-entry',()=>{
  const h=harness()
  const left={connected:true,controller:{visible:true},source:{handedness:'left',gamepad:{mapping:'xr-standard',axes:[0,0,0,0]}}}
  h.state.interaction.controllers=[left];h.enter()
  assert.equal(h.game.getDebugState().movement,'stationary');assert.equal(h.registered.length,7)
  h.registered[4].select();assert.equal(h.game.getDebugState().movement,'slow');h.tick(16)
  left.source.gamepad.axes[2]=1
  for(let i=2;i<65;i++)h.tick(i*16)
  assert.ok(h.state.origin.position.x>.3);assert.equal(h.state.origin.position.y,1.6)
  h.registered[1].select();assert.equal(h.game.getDebugState().selected,'daydream')
  h.state.session.visibilityState='hidden';h.state.session.dispatchEvent(new Event('visibilitychange'))
  const x=h.state.origin.position.x;h.tick(2000);assert.equal(h.state.origin.position.x,x)
  h.state.session.visibilityState='visible';h.tick(2016);h.tick(2032);assert.equal(h.state.origin.position.x,x)
  h.game.xrHooks.onExit();assert.equal(h.state.origin.position.x,0);h.enter()
  assert.equal(h.game.getDebugState().movement,'stationary');assert.equal(h.registered.length,7)
  h.game.xrHooks.dispose();assert.equal(h.registered.length,0)
})

test('raised selector clears actual tabletop; all seven controls ray-hit and Back retains behavior',()=>{
  const h=harness();h.enter();h.game.scene.updateMatrixWorld(true)
  const solids=[],matrix=new THREE.Matrix4(),world=new THREE.Matrix4(),box=new THREE.Box3()
  let tableTop=null
  h.game.scene.traverse(o=>{
    if(!o.isInstancedMesh)return
    solids.push(o)
    for(let i=0;i<o.count;i++){
      o.getMatrixAt(i,matrix);world.multiplyMatrices(o.matrixWorld,matrix)
      const centre=new THREE.Vector3().setFromMatrixPosition(world)
      if(Math.abs(centre.x)<.001&&Math.abs(centre.y-.55)<.001&&Math.abs(centre.z+2.6)<.001){
        o.geometry.computeBoundingBox();box.copy(o.geometry.boundingBox).applyMatrix4(world);tableTop=box.max.y
      }
    }
  })
  assert.ok(tableTop!==null)
  const back=h.registered[3].object
  const bounds=new THREE.Box3().setFromObject(back)
  assert.ok(bounds.min.y-tableTop>=.169)
  assert.ok(Math.abs(back.getWorldPosition(new THREE.Vector3()).y-.84)<.0001)
  const ray=new THREE.Raycaster();ray.far=5
  for(const height of [.9,1.6,2])for(const x of [-.3,0,.3]){
    ray.ray.origin.set(x,height,0)
    for(const entry of h.registered){
      const point=entry.object.getWorldPosition(new THREE.Vector3());point.x+=.02
      ray.ray.direction.copy(point.sub(ray.ray.origin).normalize())
      const hits=ray.intersectObjects([...solids,...h.registered.map(e=>e.object)],false)
      assert.equal(hits[0]?.object,entry.object)
    }
  }
  for(let i=0;i<3;i++){h.registered[i].select();assert.equal(h.game.getDebugState().selected,SONGS[i].id)}
  h.registered[4].select();assert.equal(h.game.getDebugState().movement,'slow')
  h.registered[3].select();assert.equal(h.backs(),1)
  h.game.xrHooks.dispose()
})
