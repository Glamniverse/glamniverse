import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { CONFIG, SONGS, ENVIRONMENTS, createSelection } from '../src/games/sky-loft/config.js'
import { createSkyLoft } from '../src/games/sky-loft/index.js'
import { createEnvironment } from '../src/games/sky-loft/environment.js'

globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})}
globalThis.window={innerWidth:1200,innerHeight:800}
function imageLoader(){
  const requests=[]
  return {requests,load(path,ok,progress,fail){
    const texture=new THREE.Texture();let releases=0;texture.addEventListener('dispose',()=>releases++)
    requests.push({path,texture,ok,fail,releases:()=>releases});return texture
  }}
}
function harness(){
  const loader=imageLoader();let backs=0
  const game=createSkyLoft({back:()=>backs++,environmentLoader:loader})
  const registered=[]
  const origin=new THREE.Group();origin.position.set(0,1.6,0);game.scene.add(origin)
  const state={origin,session:{visibilityState:'visible'},renderer:{xr:{getReferenceSpace:()=>({})}},
    interaction:{addTarget(object,select,options){const entry={object,select,options};registered.push(entry)
      return()=>{options.onHover?.(false);const i=registered.indexOf(entry);if(i>=0)registered.splice(i,1)}}}}
  let position={x:0,y:0,z:0}
  const frame={getViewerPose:()=>({transform:{position,orientation:{x:0,y:0,z:0,w:1}}})}
  return {game,state,registered,loader,backs:()=>backs,
    tick(){game.update(0,frame)},move(p){position=p},enter(){game.xrHooks.onEnter(state);game.update(0,frame)}}
}
test('two immutable prototype songs reference valid environment; no playback or lyrics',()=>{
  assert.equal(SONGS.length,2)
  assert.equal(new Set(SONGS.map(s=>s.id)).size,2)
  for(const song of SONGS){assert.ok(ENVIRONMENTS[song.environmentId]);assert.equal(song.audioSrc,null);assert.equal(song.lyrics,null);assert.ok(Object.isFrozen(song))}
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
  assert.equal(h.loader.requests.length,1);assert.equal(h.game.getDebugState().registeredTargets,3)
  h.game.xrHooks.dispose();assert.equal(h.registered.length,0)
})
test('selector targets ray-hit/miss, hover restoration and selection state',()=>{
  const h=harness();h.enter();h.game.scene.updateMatrixWorld(true)
  const eye=new THREE.Vector3(0,1.6,0)
  const target=h.registered[1],center=target.object.getWorldPosition(new THREE.Vector3())
  const ray=new THREE.Raycaster(eye,center.clone().sub(eye).normalize(),0,5)
  assert.equal(ray.intersectObjects(h.registered.map(e=>e.object)).length,1)
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
  for(let i=0;i<10;i++){h.enter();h.game.xrHooks.onEnter(h.state);h.tick();assert.equal(h.registered.length,3)
    h.registered[2].select();h.game.xrHooks.onRequestExit();assert.equal(h.registered.length,0)
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
      assert.equal(o.material.transparent,false);if(o.material.map)textures.add(o.material.map)}
    if(o.isLight){lights++;assert.ok(!o.castShadow)}
  })
  assert.ok(calls<=10);assert.ok(triangles<3000);assert.equal(textures.size,5);assert.equal(lights,2)
  console.log('Sky Loft static budget', {calls,triangles,textures:textures.size+1,lights})
  assert.ok(CONFIG.selectorDistance<5);h.game.xrHooks.dispose()
})
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8')
test('entry is fail-closed to Preview/development; public games remain outside gate',()=>{
  const gate="if (import.meta.env.DEV || import.meta.env.VITE_VERCEL_ENV === 'preview')"
  assert.ok(source.includes(gate))
  const block=source.slice(source.indexOf(gate),source.indexOf('function showInHisMindRoom'))
  assert.match(block,/stationaryVRWorlds.add\('skyLoft'\)/)
  assert.match(block,/import\('\.\/games\/sky-loft\/index.js'\)/)
  for(const [dev,env,want] of [[true,undefined,true],[false,'preview',true],[false,'production',false],[false,undefined,false]]){
    const condition=gate.slice(4,-1).replace('import.meta.env.DEV',String(dev)).replace('import.meta.env.VITE_VERCEL_ENV',JSON.stringify(env)??'undefined')
    assert.equal(Function('return '+condition)(),want)
  }
  assert.match(source.slice(0,source.indexOf(gate)),/createAllEyesOnMe/)
  assert.match(block,/checkVRExperienceSupport\('skyLoft'/)
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
