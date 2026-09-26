import test from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { CONFIG as C } from '../src/games/all-eyes-on-me/config.js'
import { LEVEL, validateLevel, spawnAt, missAt, targetZ, strikeAt, obstacleSpawn, obstacleEnd, GRID, beatTime, isSideTarget, targetX, targetY, nearSpawnAt, speed, SECTIONS } from '../src/games/all-eyes-on-me/level.js'
import { createTargets } from '../src/games/all-eyes-on-me/targets.js'
import { createHands } from '../src/games/all-eyes-on-me/hands.js'
import { createObstacleJudge, createObstacles } from '../src/games/all-eyes-on-me/obstacles.js'
import { createWaves } from '../src/games/all-eyes-on-me/waves.js'
import { createArena } from '../src/games/all-eyes-on-me/arena.js'
import { synthesizePaddedImpact, createGameAudio } from '../src/games/all-eyes-on-me/audio.js'
import { createAllEyesOnMe } from '../src/games/all-eyes-on-me/index.js'
const ctx = { fillRect() {}, strokeRect() {}, fillText() {} }
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
globalThis.window = { innerWidth: 1200, innerHeight: 800 }
class FakeAudio extends EventTarget {
  ended = false; duration = 218.688;
  paused = true; loop = true; volume = 0.43; readyState = 4; currentTime = 0; error = null; src = ''; plays = 0; rejectNext = false
  getAttribute() { return this.src }
  load() {}
  pause() { this.paused = true }
  play() { this.ended = false; this.plays++; if (this.rejectNext) { this.rejectNext = false; return Promise.reject(new Error('Autoplay test')) } this.paused = false; return Promise.resolve() }
}
const flush = () => new Promise(resolve => setImmediate(resolve))
function harness() {
  const audio = new FakeAudio()
  let backs = 0
  const game = createAllEyesOnMe({ audio, back: () => { backs++; game.xrHooks.onExit() } })
  const origin = new THREE.Group(); game.scene.add(origin)
  const controllers = ['left', 'right'].map(handedness => {
    const grip = new THREE.Group(); origin.add(grip)
    grip.position.set(handedness === 'left' ? -0.3 : 0.3, -0.3, -0.5)
    return { grip, connected: true, source: { handedness, gripSpace: {} } }
  })
  const registered = []
  const interaction = {
    controllers, rays: true,
    setMenuRays(value) { this.rays = value },
    addTarget(object, action) { const entry = { object, action }; registered.push(entry); return () => registered.splice(registered.indexOf(entry), 1) },
  }
  const session = new EventTarget(); session.visibilityState = 'visible'
  const xr = { session, origin, interaction, renderer: { xr: { getReferenceSpace: () => ({}) } } }
  const frame = {
    getViewerPose: () => ({ transform: { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } } }),
    getPose: () => ({ emulatedPosition: false }),
  }
  let time = 0
  function tick(dt = 1 / 72) {
    time += dt
    if (!audio.paused) {
      audio.currentTime += dt
      if (audio.currentTime >= audio.duration) {
        audio.currentTime = audio.duration; audio.ended = true; audio.paused = true
        audio.dispatchEvent(new Event('ended'))
      }
    }
    game.update(time * 1000, frame)
  }
  game.xrHooks.onEnter(xr); game.update(0, frame)
  return { audio, game, xr, registered, controllers, frame, tick, backs: () => backs,
    async start() {
      registered[0].action()
      assert.equal(audio.plays, 0, 'countdown must precede playback')
      for (let i = 0; i < 218; i++) tick()
      await flush()
    },
  }
}


test('Full-song chart has continuous targets, valid hands, caps and isolated obstacles',()=>{
  assert.equal(validateLevel(),true);assert.equal(LEVEL.events.length,235)
  assert.equal(LEVEL.obstacles.length,11);assert.equal(LEVEL.duration,LEVEL.masterDuration)
  for(const e of LEVEL.events){
    assert.ok(Math.abs(targetZ(e,spawnAt(e))+C.portalDistance)<1e-8)
    assert.ok(targetZ(e,spawnAt(e)+0.1)>targetZ(e,spawnAt(e)))
    assert.ok(Math.abs(targetZ(e,e.hitAt)+C.hitDistance)<1e-8)
    assert.ok(missAt(e)<LEVEL.duration)
  }
  for(let t=0;t<LEVEL.duration;t+=0.01){
    assert.ok(LEVEL.events.filter(e=>spawnAt(e)<=t&&missAt(e)>t).length<=C.maxTargets)
    assert.ok(LEVEL.events.filter(e=>strikeAt(e)<=t&&missAt(e)>t).length<=C.maxStrikeTargets)
    if(LEVEL.obstacles.some(o=>obstacleSpawn(o)<=t&&obstacleEnd(o)>=t))assert.equal(LEVEL.events.filter(e=>spawnAt(e)<=t&&missAt(e)>t).length,0)
  }
  assert.throws(()=>validateLevel({...LEVEL,events:[{hitAt:6,lane:'L',hand:'right'}]}))
  assert.throws(()=>validateLevel({...LEVEL,events:Array.from({length:7},()=>LEVEL.events[0])}))
})
test('eye pool consumes once, counts every missed eye once, and replays without growth',()=>{
  const root=new THREE.Group();let misses=0;const t=createTargets(root,LEVEL,()=>misses++),head=new THREE.Vector3()
  t.update(spawnAt(LEVEL.events[0]),head);const eye=t.entries.find(e=>e.event)
  assert.ok(eye);assert.equal(t.consume(eye),true);assert.equal(t.consume(eye),false)
  for(let x=0;x<LEVEL.duration;x+=1/72)t.update(x,head)
  assert.equal(misses,234);assert.equal(root.children.length,C.maxTargets)
  t.reset();t.update(spawnAt(LEVEL.events[0]),head);assert.equal(t.entries.filter(e=>e.event).length,1)
  t.dispose()
})
test('matching hand sweeps hit; wrong hand, passive overlap and tracking discontinuity do not',()=>{
  const root=new THREE.Group(),controllers=['right','left'].map(handedness=>({connected:true,source:{handedness,gripSpace:{}},grip:new THREE.Group()}))
  const frame={getPose:()=>({emulatedPosition:false})};let hits=0
  const hands=createHands(controllers,root,(target,hand)=>{hits++;assert.equal(hand,'left')})
  const target={event:{hand:'left'},mesh:new THREE.Group(),previous:new THREE.Vector3(-.3,0,-.5),position:new THREE.Vector3(-.3,0,-.5)}
  controllers.forEach(c=>c.grip.position.set(-.3,0,-.3))
  hands.sample(0,frame,{},true,[target]);hands.sample(20,frame,{},true,[target])
  assert.equal(hits,0)
  controllers[0].grip.position.z=-.65;hands.sample(60,frame,{},true,[target]);assert.equal(hits,0,'right hand cannot destroy pink eye')
  controllers[1].grip.position.z=-.65;hands.sample(100,frame,{},true,[target]);assert.equal(hits,1)
  hands.reset();controllers[1].grip.position.z=-.3;hands.sample(120,frame,{},true,[target]);assert.equal(hits,1)
  controllers[1].connected=false;hands.sample(140,frame,{},true,[target]);controllers[1].connected=true;controllers[1].grip.position.z=-.65
  hands.sample(160,frame,{},true,[target]);assert.equal(hits,1)
  hands.dispose();assert.ok(controllers.every(c=>c.grip.children.length===0))
})
test('duck/left/right judges use frozen neutral height and small signed lean',()=>{
  const j=createObstacleJudge(),head={x:1,y:1.7};j.calibrate(head);head.y=0.8
  assert.deepEqual(j.baseline(),{x:1,y:1.7})
  j.begin('duck');j.sample({x:1,y:1.7-C.duckAmount-.01});assert.equal(j.success(),true)
  j.sample({x:1,y:1.7});assert.equal(j.success(),false)
  j.begin('left');j.sample({x:1-C.dodgeAmount-.01,y:1.7});assert.equal(j.success(),true)
  j.begin('right');j.sample({x:1+C.dodgeAmount+.01,y:1.7});assert.equal(j.success(),true)
  j.begin('right');assert.equal(j.success(),false,'unobserved window fails safely')
  j.sample({x:1-C.dodgeAmount,y:1.7});assert.equal(j.success(),false)
})
test('pooled obstacle windows and reset judge once without camera changes',()=>{
  const root=new THREE.Group(),results=[],o=createObstacles(root,LEVEL.obstacles,s=>results.push(s)),head=new THREE.Vector3()
  o.reset()
  for(let t=0;t<LEVEL.duration;t+=1/72){const active=LEVEL.obstacles.find(v=>t>=obstacleSpawn(v)&&t<=obstacleEnd(v));head.set(active?.kind==='left'?-.2:.2,-.2,0);o.update(t,head)}
  assert.deepEqual(results,LEVEL.obstacles.map(()=>true));assert.equal(root.children.length,1)
  o.reset();assert.equal(o.stats().activeObstacle,null)
  for(let t=0;t<LEVEL.duration;t+=1/72)o.update(t,new THREE.Vector3())
  assert.deepEqual(results.slice(LEVEL.obstacles.length),LEVEL.obstacles.map(()=>false))
})
test('countdown, audio clock, full demo results, replay, exit and disposal',async()=>{
  const h=harness();assert.equal(h.game.xrHooks.stationary,true);assert.equal(h.registered.length,2)
  await h.start();assert.equal(h.game.getDebugState().phase,'playing');assert.equal(h.xr.interaction.rays,false)
  for(let i=0;i<Math.ceil(h.audio.duration*72)+2;i++)h.tick()
  assert.equal(h.game.getDebugState().phase,'results');assert.equal(h.game.getDebugState().misses,235)
  assert.equal(h.game.getDebugState().result.completed,true);assert.equal(h.audio.paused,true)
  h.registered[0].action();assert.equal(h.game.getDebugState().phase,'countdown');assert.equal(h.game.getDebugState().misses,0)
  h.game.xrHooks.onRequestExit();h.game.xrHooks.onExit();assert.equal(h.audio.paused,true);assert.equal(h.registered.length,0)
  assert.ok(h.controllers.every(c=>c.grip.children.length===0));assert.equal(h.audio.volume,.43)
  h.game.xrHooks.onEnter(h.xr);h.tick();assert.equal(h.registered.length,2)
  h.game.xrHooks.dispose();h.game.xrHooks.dispose();assert.equal(h.registered.length,0);assert.equal(h.game.getDebugState().phase,'disposed')
})
test('pause/reconnect resets sweeps and resumes same audio position',async()=>{
  const h=harness();await h.start();h.tick();const before=h.audio.currentTime
  h.xr.session.visibilityState='visible-blurred';h.xr.session.dispatchEvent(new Event('visibilitychange'))
  assert.equal(h.game.getDebugState().phase,'paused');for(let i=0;i<10;i++)h.tick();assert.equal(h.audio.currentTime,before)
  h.xr.session.visibilityState='visible';h.tick();h.registered[0].action();await flush();assert.equal(h.game.getDebugState().phase,'playing')
  h.controllers[0].connected=false;h.tick();assert.equal(h.game.getDebugState().phase,'paused')
  h.game.xrHooks.dispose()
})
test('playback rejection and interrupted startup cannot restart disposed world',async()=>{
  const h=harness();h.audio.rejectNext=true;await h.start();assert.equal(h.game.getDebugState().phase,'paused')
  h.game.xrHooks.dispose();h.audio.dispatchEvent(new Event('ended'));assert.equal(h.game.getDebugState().phase,'disposed')
  const k=harness();let resolve;k.audio.play=function(){this.paused=false;return new Promise(r=>resolve=r)}
  k.registered[0].action();for(let i=0;i<218;i++)k.tick();assert.equal(k.game.getDebugState().phase,'starting')
  k.game.xrHooks.dispose();resolve();await flush();assert.equal(k.game.getDebugState().phase,'disposed');assert.equal(k.audio.paused,true)
})
test('early media end reports incomplete results; Back is not completion',async()=>{
  const h=harness();await h.start();h.audio.dispatchEvent(new Event('ended'))
  assert.equal(h.game.getDebugState().result.completed,false);h.game.xrHooks.dispose()
  const k=harness();await k.start();k.registered[1].action();assert.equal(k.backs(),1);assert.equal(k.game.getDebugState().result,null);k.game.xrHooks.dispose()
})

test('conservative geometry budget remains bounded',()=>{
  const h=harness();let calls=0,triangles=0,textures=new Set()
  // Conservative upper bound: include all hidden pooled targets and all menu panels.
  h.game.scene.traverse(o=>{
    if(!o.isMesh)return
    calls++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1)
    for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.map)textures.add(m.map)
  })
  console.log('All Eyes On Me all-pools+menus upper bound (excludes shared rays):', {calls,triangles,textures:textures.size})
  assert.ok(calls<=45);assert.ok(triangles<15000);assert.ok(textures.size<=7)
  h.game.xrHooks.dispose()
})

test('real audio metadata matches verified gapless duration',()=>{
  const bytes=readFileSync(new URL('../public/audio/all-eyes-on-me/all-eyes-on-me.mp3',import.meta.url))
  const xing=bytes.indexOf('Xing'),tag=bytes.indexOf('Lavf',xing)
  assert.ok(xing>0&&tag>xing)
  const frames=bytes.readUInt32BE(xing+8),trim=bytes.readUIntBE(tag+21,3)
  const duration=(frames*1152-(trim>>>12)-(trim&4095))/48000
  assert.ok(Math.abs(duration-LEVEL.masterDuration)<0.000001)
})
test('real game sweep awards one correct-hand punch and combo only once',async()=>{
  const h=harness();await h.start()
  while(h.audio.currentTime<LEVEL.events[0].hitAt-0.1)h.tick()
  h.controllers[0].grip.position.set(-.34,-.20,-.3)
  h.tick();h.tick()
  h.controllers[0].grip.position.z=-.85;h.tick(.08)
  const score=h.game.getDebugState()
  assert.equal(score.hits,1);assert.equal(score.score,C.punchPoints);assert.equal(score.combo,1)
  h.tick();assert.equal(h.game.getDebugState().hits,1)
  h.game.xrHooks.dispose()
})

test('public All Eyes entry and XR eligibility are enabled without Preview flags',()=>{
  const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8')
  const eligibility=source.slice(source.indexOf('const stationaryVRWorlds'),source.indexOf('let vrSupported'))
  assert.ok(eligibility.includes("'allEyesOnMe'"))
  assert.ok(!source.slice(source.indexOf('// Public release:'),source.indexOf('// Fail closed')).includes('VITE_VERCEL_ENV'))
  assert.ok(source.includes("if (!await checkVRExperienceSupport('allEyesOnMe')) return"))
})

test('M2 uses measured beat grid, no simultaneous pairs or downward lanes',()=>{
  assert.equal(GRID.bpm,125.28)
  for(let i=0;i<LEVEL.events.length;i++){
    const e=LEVEL.events[i]
    assert.equal(e.hitAt,beatTime(e.beat));assert.ok(C.lanes[e.lane][1]>=-0.2)
    if(i)assert.ok(e.hitAt-LEVEL.events[i-1].hitAt>=C.minTargetGap)
  }
  assert.throws(()=>validateLevel({...LEVEL,events:[LEVEL.events[0],{...LEVEL.events[0],lane:'R',hand:'right'}]}))
  assert.throws(()=>validateLevel({...LEVEL,events:[{hitAt:6,lane:'LL',hand:'left'}]}))
  assert.equal(C.travelSeconds,1.55);assert.equal(C.obstacleTravelSeconds,2.6)
})
test('side eyes follow a fixed front-left/right line with pooled matching chevrons',()=>{
  const root=new THREE.Group(),e=LEVEL.events.find(e=>e.lane==='LS'),r=LEVEL.events.find(e=>e.lane==='RS')
  assert.equal(isSideTarget(e),true);assert.ok(Math.abs(targetX(e,spawnAt(e))-C.portalX)<1e-9)
  assert.ok(Math.abs(targetX(e,e.hitAt)+.55)<1e-9);assert.ok(Math.abs(targetX(r,r.hitAt)-.55)<1e-9)
  assert.ok(Math.abs(Math.atan2(targetX(e,e.hitAt),C.hitDistance))<=Math.PI/4+1e-9)
  const targets=createTargets(root,{events:[e]},()=>{})
  targets.update(spawnAt(e),new THREE.Vector3());const eye=targets.entries.find(t=>t.event)
  assert.equal(eye.cue.visible,true);assert.equal(eye.cue.scale.x,-1)
  const time=e.hitAt-.2;targets.update(time,new THREE.Vector3(1,0,0))
  assert.ok(Math.abs(eye.position.x-targetX(e,time))<1e-9)
  targets.reset();assert.equal(targets.entries.filter(t=>t.mesh.visible).length,0);targets.dispose()
})
test('approved panorama is 2:1; late load is discarded after world disposal',()=>{
  const bytes=readFileSync(new URL('../public/images/all-eyes-on-me/arena-360.png',import.meta.url))
  assert.equal(bytes.readUInt32BE(16),2*bytes.readUInt32BE(20))
  const old=THREE.TextureLoader.prototype.load;let loaded;const texture=new THREE.Texture();let disposed=0
  texture.addEventListener('dispose',()=>disposed++)
  document.createElementNS=()=>({})
  THREE.TextureLoader.prototype.load=function(url,onLoad){assert.equal(url,'/images/all-eyes-on-me/arena-360.png');loaded=onLoad;return texture}
  try{
    const scene=new THREE.Scene(),arena=createArena(scene);assert.equal(arena.stats().panoramaStatus,'loading')
    arena.dispose();loaded(texture);assert.ok(disposed>0)
    assert.equal(scene.children[0].children.filter(o=>o.material?.map===texture).length,0)
    const ready=createArena(new THREE.Scene());loaded(texture);assert.equal(ready.stats().panoramaStatus,'ready')
    assert.equal(texture.generateMipmaps,false);ready.dispose()
  }finally{THREE.TextureLoader.prototype.load=old;delete document.createElementNS}
})
test('padded impact is deterministic, bounded and short with a soft tail',()=>{
  const a=synthesizePaddedImpact(48000),b=synthesizePaddedImpact(48000)
  assert.deepEqual(a,b);assert.equal(a.length,8640)
  let peak=0;for(const v of a){assert.ok(Number.isFinite(v));peak=Math.max(peak,Math.abs(v))}
  assert.ok(peak<=.851);assert.ok(Math.abs(a[0])<1e-9);assert.ok(Math.abs(a.at(-1))<.001)
})
test('impact nodes are capped and stopped on release without changing music gain',()=>{
  const created=[];class Context {
    sampleRate=48000;state='running';destination={}
    createBuffer(channels,length){const data=new Float32Array(length);return{getChannelData:()=>data}}
    createBufferSource(){const voice={connect(){},disconnect(){},start(){},stop(){this.stopped=true;this.onended?.()}};created.push(voice);return voice}
    createGain(){return{gain:{value:0},connect(){},disconnect(){}}}
    resume(){return Promise.resolve()}close(){return Promise.resolve()}
  }
  window.AudioContext=Context
  try{
    const a=new FakeAudio(),music=createGameAudio(a,LEVEL.audio);music.unlockEffects()
    for(let i=0;i<10;i++)music.impact()
    assert.equal(created.length,C.maxImpactVoices);assert.equal(a.volume,C.musicVolume)
    music.release();assert.ok(created.every(v=>v.stopped));assert.equal(a.volume,.43);music.dispose()
  }finally{delete window.AudioContext}
})


test('distant portal matches artwork and joins M2 strike motion continuously',()=>{
  for(const e of LEVEL.events){
    assert.equal(targetY(e,spawnAt(e)),C.portalY)
    const join=nearSpawnAt(e),epsilon=0.00001
    assert.ok(Math.abs(targetZ(e,join)+C.spawnDistance)<1e-7)
    assert.ok(Math.abs((targetZ(e,join)-targetZ(e,join-epsilon))/epsilon-speed())<.01)
    assert.ok(Math.abs(targetX(e,join)-targetX(e,join-epsilon))<.001)
    assert.ok(Math.abs(targetY(e,join)-targetY(e,join-epsilon))<.001)
    for(let t=join;t<missAt(e);t+=.02)assert.ok(targetY(e,t)>=-.2)
  }
})
test('authored full-song sections have valid bounds, progression and isolated transitions',()=>{
  assert.equal(validateLevel(),true)
  assert.equal(LEVEL.events.filter(e=>e.hand==='left').length,118)
  assert.equal(LEVEL.events.filter(e=>isSideTarget(e)).length,48)
  assert.deepEqual(['duck','left','right'].map(kind=>LEVEL.obstacles.filter(o=>o.kind===kind).length),[4,4,3])
  for(const s of SECTIONS){
    for(const pair of s.punches.split(' ')){const b=Number(pair.split(':')[0]);assert.ok(b>=s.from&&b<s.to)}
  }
  assert.throws(()=>validateLevel({...LEVEL,events:[...LEVEL.events,{...LEVEL.events[0],hitAt:300}]}))
  assert.throws(()=>validateLevel({...LEVEL,waves:[{at:LEVEL.duration}]}))
  assert.throws(()=>validateLevel({...LEVEL,obstacles:[{kind:'duck',at:LEVEL.events[1].hitAt}]}))
})
test('energy rings stay outside the player, are capped, freeze on pause and dispose',()=>{
  const root=new THREE.Group(),waves=createWaves(root,LEVEL.waves),mesh=root.children[0],matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),scale=new THREE.Vector3(),q=new THREE.Quaternion()
  let peak=0
  for(let t=0;t<LEVEL.duration;t+=1/72){
    waves.update(t,true);peak=Math.max(peak,waves.stats().activeWaves)
    for(let i=0;i<C.maxWaves;i++){
      mesh.getMatrixAt(i,matrix);if(matrix.elements[0]===0)continue;matrix.decompose(pos,q,scale)
      if(scale.x>0 && Math.abs(pos.z)<2)assert.ok(scale.x>C.waveClearance && Math.abs(pos.x)<.001 && Math.abs(pos.y)<.001)
    }
  }
  assert.equal(peak,2);assert.equal(waves.stats().activeWaves,0)
  waves.reset();waves.update(2,true);assert.equal(waves.stats().activeWaves,1)
  waves.update(2,false);assert.equal(mesh.visible,false)
  waves.update(2,true);assert.equal(waves.stats().activeWaves,1)
  waves.reset();assert.equal(waves.stats().activeWaves,0)
  waves.dispose();waves.dispose();assert.equal(root.children.length,0)
})
test('audio tail, duplicate ended, mid-round pause and complete replay remain safe',async()=>{
  const h=harness();await h.start()
  while(h.audio.currentTime<110)h.tick()
  const before=h.game.getDebugState().misses
  h.xr.session.visibilityState='visible-blurred';h.xr.session.dispatchEvent(new Event('visibilitychange'))
  for(let i=0;i<200;i++)h.tick()
  assert.equal(h.game.getDebugState().misses,before)
  h.xr.session.visibilityState='visible';h.tick();h.registered[0].action();await flush()
  while(h.audio.currentTime<LEVEL.duration+.01)h.tick()
  assert.equal(h.game.getDebugState().phase,'playing','do not cut the encoded tail at chart duration')
  while(!h.audio.ended)h.tick()
  const result=h.game.getDebugState();h.audio.dispatchEvent(new Event('ended'));assert.deepEqual(h.game.getDebugState(),result)
  h.registered[0].action();for(let i=0;i<218;i++)h.tick();await flush()
  assert.equal(h.game.getDebugState().misses,0)
  while(!h.audio.ended)h.tick()
  assert.equal(h.game.getDebugState().misses,LEVEL.events.length)
  assert.equal(h.game.getDebugState().result.completed,true);h.game.xrHooks.dispose()
})
test('games layout keeps Smash public and all four world buttons separate',()=>{
  const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8')
  const publicHTML=source.slice(0,source.indexOf('let smashEntryRequest'))
  assert.ok(publicHTML.includes('GLAMNIVERSE VR EXPERIENCES'))
  assert.ok(publicHTML.includes('onclick="openSmashTheHate()"'))
  assert.equal((publicHTML.match(/class="portal-label/g)||[]).length,4)
  assert.ok(source.includes("document.querySelector('#vr-experience-grid').appendChild(card)"))
})

test('portal direction matches actual inward sphere UV orientation',()=>{
  const theta=Math.PI*400/887,phi=2*Math.PI*901/1774
  const artwork=new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)).applyAxisAngle(new THREE.Vector3(0,1,0),C.panoramaYaw)
  const portal=new THREE.Vector3(C.portalX,C.portalY,-C.portalDistance).normalize()
  assert.ok(portal.angleTo(artwork)<0.005,'less than 0.3 degree difference at neutral headset')
})
