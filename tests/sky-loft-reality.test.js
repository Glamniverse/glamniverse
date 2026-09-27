import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {REALITIES,ENVIRONMENTS,TRANSITION_SECONDS,CONFIG} from '../src/games/sky-loft/config.js'
import {createRealityEngine} from '../src/games/sky-loft/reality.js'
import {createEnvironment} from '../src/games/sky-loft/environment.js'
import {createRealityVisitors} from '../src/games/sky-loft/reality-visitors.js'
import {BUTTERFLIES,createButterflies} from '../src/games/sky-loft/butterflies.js'
import {visitorPosition} from '../src/games/sky-loft/visitors.js'
import {createLoftAudio} from '../src/games/sky-loft/audio.js'
import {createLoft} from '../src/games/sky-loft/loft.js'
import {createSkyLoft} from '../src/games/sky-loft/index.js'

globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})}
globalThis.window={innerWidth:1200,innerHeight:800}
class Media extends EventTarget {
  paused=true;src='';currentTime=0;duration=244.56;plays=0;loads=0
  getAttribute(){return this.src} removeAttribute(){this.src=''}
  pause(){this.paused=true} load(){this.loads++;this.currentTime=0}
  play(){this.paused=false;this.plays++;return Promise.resolve()}
}
function loader(){
  const requests=[]
  return {requests,load(path,ok,_,fail){const texture=new THREE.Texture();requests.push({path,texture,ok,fail});return texture},
    complete(){for(const r of requests)if(!r.done){r.done=true;r.ok(r.texture)}}}
}
function setup(){
  const root=new THREE.Group(),images=loader(),environment=createEnvironment(root,images),
    visitors=createRealityVisitors(root),loft=createLoft(root),media=new Media(),music=createLoftAudio(media),messages=[]
  const engine=createRealityEngine({environment,loft,visitors,music,notify:m=>messages.push(m)})
  let time=0
  function advance(seconds){for(let i=0;i<Math.ceil(seconds/.02);i++){time+=20;engine.update(time,true);visitors.update(time,true)}}
  return {root,images,environment,visitors,media,music,engine,messages,advance}
}
test('declarative realities map exact preserved Neon and new Daydream assets/species, no lyrics',()=>{
  assert.equal(Object.keys(REALITIES).length,3)
  assert.equal(REALITIES['neon-therapy'].audioSrc,'/neon-therapy.mp3')
  assert.equal(ENVIRONMENTS[REALITIES['neon-therapy'].environmentId].panorama,'/images/sky-loft/neon-city-loft.png')
  assert.equal(ENVIRONMENTS[REALITIES['neon-therapy'].environmentId].visitors,'neon-mantas')
  assert.equal(ENVIRONMENTS[REALITIES.daydream.environmentId].visitors,'butterflies')
  for(const r of Object.values(REALITIES)){assert.ok(Object.isFrozen(r));assert.equal(r.lyrics,null);assert.ok(readFileSync(new URL('../public'+r.audioSrc,import.meta.url)).length>1000000)}
  const p=readFileSync(new URL('../public/images/sky-loft/daydream.png',import.meta.url))
  assert.equal(p.readUInt32BE(16),1774);assert.equal(p.readUInt32BE(20),887)
  assert.equal(createHash('sha256').update(p).digest('hex'),'74ef11dc788195aad56035da5807be54d5c554b71c0c04f6962381dec1469520')
})
test('transition waits for texture then fades one media element down, swaps at midpoint, fades up',async()=>{
  const h=setup();h.images.complete();h.engine.select('neon-therapy');await Promise.resolve()
  h.engine.select('daydream');h.advance(5)
  assert.equal(h.engine.stats().activeReality,'neon-therapy');assert.equal(h.media.volume,.65)
  h.images.complete();h.advance(TRANSITION_SECONDS/4)
  assert.ok(h.media.volume>0&&h.media.volume<.65);assert.equal(h.media.src,'/neon-therapy.mp3')
  h.advance(TRANSITION_SECONDS/4+.04);await Promise.resolve()
  assert.equal(h.engine.stats().activeReality,'daydream');assert.equal(h.media.src,REALITIES.daydream.audioSrc)
  assert.ok(h.media.volume<.01)
  h.advance(TRANSITION_SECONDS);await Promise.resolve()
  assert.equal(h.media.volume,.65);assert.equal(h.engine.stats().realityTransition,false)
  assert.equal(h.visitors.stats().visitorSpecies,'butterflies')
  h.media.currentTime=31.2;assert.equal(h.music.getClock().seconds,31.2);assert.equal(h.music.getClock().songId,'daydream')
  h.music.dispose();h.environment.dispose();h.visitors.dispose()
})
test('repeated selection is idempotent; rapid switching queues latest choice and restores Neon',async()=>{
  const h=setup();h.images.complete();h.engine.select('neon-therapy');await Promise.resolve()
  for(let i=0;i<8;i++)h.engine.select('neon-therapy')
  assert.equal(h.media.plays,1)
  h.engine.select('daydream');h.images.complete();h.advance(.8)
  h.engine.select('neon-therapy');h.engine.select('daydream');h.engine.select('neon-therapy');h.advance(6)
  assert.equal(h.engine.stats().activeReality,'neon-therapy');assert.equal(h.engine.stats().requestedReality,'neon-therapy')
  assert.equal(h.visitors.stats().visitorSpecies,'neon-mantas');assert.equal(h.environment.stats().environmentId,'sky-city')
  assert.equal(h.images.requests.length,2);assert.equal(h.root.children.filter(o=>o.name==='SkyLoft_Environment').length,1)
  h.engine.dispose();assert.equal(h.engine.select('daydream'),false)
  h.music.dispose();h.environment.dispose();h.visitors.dispose()
})
test('interruption freezes transition/audio; explicit reselection resumes; reset cancels pending change',()=>{
  const h=setup();h.images.complete();h.engine.select('daydream');h.images.complete();h.advance(.6)
  const volume=h.media.volume;h.engine.pause();h.advance(10)
  assert.equal(h.media.paused,true);assert.equal(h.media.volume,volume);assert.equal(h.engine.stats().activeReality,'neon-therapy')
  h.engine.select('daydream');h.advance(3);assert.equal(h.engine.stats().activeReality,'daydream')
  h.engine.select('neon-therapy');h.advance(.2);h.music.release();h.engine.reset();h.advance(5)
  assert.equal(h.engine.stats().activeReality,'daydream');assert.equal(h.engine.stats().requestedReality,'daydream')
  assert.equal(h.media.src,'');assert.equal(h.media.paused,true);assert.equal(h.media.volume,.65)
  h.music.dispose();h.environment.dispose();h.visitors.dispose()
})
test('failed panorama preserves current reality; retry reloads only failed texture',()=>{
  const h=setup();h.images.complete();h.engine.select('daydream')
  h.images.requests[1].fail();h.advance(1)
  assert.equal(h.engine.stats().activeReality,'neon-therapy');assert.match(h.messages.at(-1),/unavailable/)
  h.engine.select('daydream');assert.equal(h.images.requests.length,3);h.images.complete();h.advance(3)
  assert.equal(h.engine.stats().activeReality,'daydream');assert.equal(h.environment.stats().panoramaTextures,2)
  h.music.dispose();h.environment.dispose();h.visitors.dispose()
})
test('cached panoramas and visitor pools remain bounded across 40 switches and clean up',()=>{
  const h=setup();h.images.complete();const children=h.root.children.length
  for(let i=0;i<40;i++){
    h.engine.select(i%2?'neon-therapy':'daydream');h.images.complete();h.advance(3)
    assert.equal(h.root.children.length,children);assert.ok(h.visitors.stats().activeVisitors<=4)
    assert.equal(h.environment.stats().environmentSpheres,1)
  }
  assert.equal(h.images.requests.length,2)
  const releases=new Map();for(const r of h.images.requests){releases.set(r.texture,0);r.texture.addEventListener('dispose',()=>releases.set(r.texture,releases.get(r.texture)+1))}
  h.environment.dispose();h.environment.dispose();assert.deepEqual([...releases.values()],[1,1])
  h.visitors.dispose();h.visitors.update(999999,true);assert.equal(h.visitors.stats().activeVisitors,0)
  h.music.dispose();assert.equal(h.media.src,'');assert.equal(h.music.getClock().playing,false)
})
test('butterflies are distinct two-lobed geometry with visible wing motion, two draws, no alpha/textures',()=>{
  const root=new THREE.Group(),b=createButterflies(root),group=root.children[0]
  assert.equal(group.children.length,2);assert.equal(BUTTERFLIES.count,4)
  b.update(0,true);const before=group.children[0].instanceMatrix.array.slice()
  b.update(50,true);assert.notDeepEqual(group.children[0].instanceMatrix.array,before)
  let peak=0
  for(let i=0;i<6000;i++){b.update(i*20,true);peak=Math.max(peak,b.stats().activeButterflies)}
  assert.equal(peak,4);assert.equal(root.children.length,1)
  for(const m of group.children){assert.ok(m.isInstancedMesh);assert.equal(m.material.transparent,false);assert.equal(m.material.map,null)}
  b.reset();assert.equal(b.stats().activeButterflies,0);b.dispose();b.update(500,true);assert.equal(group.visible,false)
})
test('butterfly routes plus bob keep clear of the entire walkable terrace, not just initial player',()=>{
  const p=new THREE.Vector3()
  for(const route of BUTTERFLIES.routes)for(let i=0;i<=1000;i++){
    visitorPosition(i/1000,route,p)
    assert.ok(Math.abs(p.x)>CONFIG.width/2+1 || Math.abs(p.z)>CONFIG.depth/2+1)
    assert.ok(p.y>3)
  }
})
test('panorama centre faces forward; material stays opaque throughout transition',()=>{
  const h=setup();h.images.complete();h.engine.select('daydream');h.images.complete();h.advance(3)
  const sphere=h.root.children.find(o=>o.name==='SkyLoft_Environment')
  const centre=new THREE.Vector3(1,0,0).applyEuler(sphere.rotation)
  assert.ok(centre.z<-.99);assert.equal(sphere.material.transparent,false);assert.equal(sphere.material.depthWrite,false)
  h.music.dispose();h.environment.dispose();h.visitors.dispose()
})
test('real loaded Bichon and locomotion persist through switches, XR reset/re-entry has no duplicate systems',async()=>{
  const bytes=readFileSync(new URL('../public/models/sky-loft/bichon/bichon.glb',import.meta.url))
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
  const images=loader(),media=new Media(),registered=[];let dogLoads=0,audioCreated=0
  const game=createSkyLoft({back(){},environmentLoader:images,companionLoader:{load(path,ok){dogLoads++;ok(gltf)}},audioFactory:()=>{audioCreated++;return media}})
  const origin=new THREE.Group();origin.position.y=1.6;game.scene.add(origin)
  const left={connected:true,controller:{visible:true},source:{handedness:'left',gamepad:{mapping:'xr-standard',axes:[0,0,0,0]}}}
  const state={origin,session:Object.assign(new EventTarget(),{visibilityState:'visible'}),renderer:{xr:{getReferenceSpace:()=>({})}},interaction:{controllers:[left],addTarget(mesh,select){const e={mesh,select};registered.push(e);return()=>registered.splice(registered.indexOf(e),1)}}}
  const frame={getViewerPose:()=>({transform:{position:{x:0,y:0,z:0},orientation:{x:0,y:0,z:0,w:1}}})}
  let time=0;function tick(seconds){for(let i=0;i<seconds*50;i++){time+=20;game.update(time,frame)}}
  game.xrHooks.onEnter(state);tick(.1);images.complete()
  registered[4].select();tick(.1);left.source.gamepad.axes[2]=1;tick(1);left.source.gamepad.axes[2]=0;tick(.1)
  const position=origin.position.clone(),rotation=origin.quaternion.clone(),objects=[]
  game.scene.traverse(o=>objects.push(o))
  for(let i=0;i<9;i++){
    registered[i%3].select();images.complete();tick(3);await Promise.resolve()
    assert.deepEqual(origin.position,position);assert.ok(origin.quaternion.equals(rotation))
    assert.equal(game.getDebugState().movement,'slow');assert.equal(game.getDebugState().companionCount,1)
  }
  const after=[];game.scene.traverse(o=>after.push(o));assert.deepEqual(after,objects)
  assert.equal(dogLoads,1);assert.equal(audioCreated,1);assert.equal(images.requests.length,3)
  assert.equal(game.getDebugState().activeReality,'paradise')
  // Continuing to push reaches, but never crosses, the original X boundary.
  left.source.gamepad.axes[2]=1;tick(30);assert.ok(origin.position.x<=6.35)
  game.xrHooks.onExit();assert.equal(media.src,'');assert.equal(registered.length,0)
  for(let i=0;i<3;i++){game.xrHooks.onEnter(state);tick(.1);assert.equal(game.getDebugState().movement,'stationary');assert.equal(game.getDebugState().companionCount,1);game.xrHooks.onExit()}
  assert.equal(dogLoads,1);assert.equal(audioCreated,1);game.xrHooks.dispose();assert.equal(game.getDebugState().companionCount,0)
})

test('Daydream-first selection primes silently in user gesture, then rewinds at visual midpoint',async()=>{
  const h=setup();h.images.complete();h.engine.select('daydream')
  assert.equal(h.media.plays,1);assert.equal(h.media.volume,0);assert.equal(h.media.src,REALITIES.daydream.audioSrc)
  await Promise.resolve();h.media.currentTime=4.2;h.images.complete();h.advance(.7)
  assert.equal(h.media.volume,0);h.advance(.6)
  assert.equal(h.media.currentTime,0);h.advance(2);assert.equal(h.media.volume,.65)
  h.music.dispose();h.environment.dispose();h.visitors.dispose()
})

import {JELLYFISH,createJellyfish,jellyfishPosition} from '../src/games/sky-loft/jellyfish.js'
test('Paradise assets, theme, lyric placeholder and visitor mapping',()=>{
  const r=REALITIES.paradise,e=ENVIRONMENTS[r.environmentId]
  assert.equal(r.audioSrc,'/audio/sky-loft/paradise.mp3');assert.equal(e.panorama,'/images/sky-loft/paradise.png')
  assert.equal(e.visitors,'jellyfish');assert.equal(r.lyrics,null);assert.equal(e.yaw,Math.PI/2)
  const image=readFileSync(new URL('../public'+e.panorama,import.meta.url))
  assert.equal(image.readUInt32BE(16),1774);assert.equal(image.readUInt32BE(20),887)
  assert.equal(createHash('sha256').update(image).digest('hex'),'4dd196f80910dace9a966c686ebfa335ff07ae9be1dcdaF2f2ab6e0d75ee17b7'.toLowerCase())
  assert.equal(readFileSync(new URL('../public'+r.audioSrc,import.meta.url)).length,6981822)
})
test('all directed reality pairs, Paradise reselection, one track and mutually exclusive species',async()=>{
  const h=setup();h.images.complete()
  for(const from of Object.keys(REALITIES))for(const to of Object.keys(REALITIES)){
    for(const id of [from,to]){
      h.engine.select(id);h.images.complete();h.advance(3);await Promise.resolve()
      assert.equal(h.engine.stats().activeReality,id)
      assert.equal(h.visitors.stats().visitorSpecies,ENVIRONMENTS[REALITIES[id].environmentId].visitors)
      assert.equal(h.media.src,REALITIES[id].audioSrc)
      assert.equal(h.music.getClock().songId,id)
      assert.ok(h.visitors.stats().activeVisitors<=12)
      if(id!=='paradise')assert.equal(h.visitors.stats().activeJellyfish,0)
      if(id!=='daydream')assert.equal(h.visitors.stats().activeButterflies,0)
    }
  }
  h.engine.select('paradise');h.advance(3);await Promise.resolve()
  const plays=h.media.plays;h.media.currentTime=42.5;h.engine.select('paradise')
  assert.equal(h.media.plays,plays);assert.equal(h.music.getClock().seconds,42.5)
  const objects=h.root.children.length
  for(let i=0;i<30;i++){h.engine.select(Object.keys(REALITIES)[i%3]);h.advance(3)}
  assert.equal(h.root.children.length,objects);assert.equal(h.images.requests.length,3)
  h.engine.pause();assert.equal(h.media.paused,true);h.engine.select('paradise');h.advance(3)
  h.music.release();h.engine.reset();assert.equal(h.media.src,'')
  h.music.dispose();h.environment.dispose();h.visitors.dispose()
})
test('twelve jellyfish use three opaque instanced draws, bounded exterior current and clean reset',()=>{
  const root=new THREE.Group(),j=createJellyfish(root),group=root.children[0],p=new THREE.Vector3()
  assert.equal(group.children.length,3);let triangles=0
  for(const m of group.children){assert.ok(m.isInstancedMesh);assert.equal(m.instanceMatrix.count,12);assert.equal(m.material.transparent,false);assert.equal(m.material.map,null);triangles+=m.geometry.index.count/3*12}
  assert.ok(triangles<6500);console.log('Paradise jellyfish budget',{draws:3,triangles,count:12})
  j.update(0,true);const before=group.children[0].instanceMatrix.array.slice()
  j.update(50,true);assert.notDeepEqual(before,group.children[0].instanceMatrix.array)
  for(let t=0;t<300;t+=.5)for(let i=0;i<12;i++){
    jellyfishPosition(t,i,p)
    assert.ok(Math.abs(p.x)>CONFIG.width/2+1.5||Math.abs(p.z)>CONFIG.depth/2+1.5)
    assert.ok(p.y>4)
  }
  assert.equal(j.stats().activeJellyfish,12)
  j.update(100,false);assert.equal(j.stats().activeJellyfish,0)
  j.reset();j.update(200,true);assert.equal(root.children.length,1)
  j.dispose();j.update(300,true);assert.equal(j.stats().activeJellyfish,0);assert.equal(group.visible,false)
})
