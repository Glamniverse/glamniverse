import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import * as THREE from 'three'
import {REALITIES,CONFIG} from '../src/games/sky-loft/config.js'
import {LYRIC_LIMITS,LYRIC_PRESETS,validateLyricData,fillActiveEvents} from '../src/games/sky-loft/lyric-presets.js'
import {createSpatialLyrics,createLyricAtlas} from '../src/games/sky-loft/lyrics.js'
import {createSkyLoft} from '../src/games/sky-loft/index.js'
const bytes=readFileSync(new URL('../public/data/sky-loft/lyrics/paradise.json',import.meta.url)),data=JSON.parse(bytes)
const drawCalls={text:0}
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},clearRect(){},strokeText(){},fillText(){drawCalls.text++},measureText(t){return {width:t.length*32}}})})}
globalThis.window={innerWidth:1200,innerHeight:800}
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve()}
const state={activeReality:'paradise',requestedReality:'paradise',realityTransition:false}
const head=new THREE.Vector3(0,1.6,0),front=new THREE.Vector3(0,0,-1)
function setup(){
  const root=new THREE.Group();let loads=0
  const lyrics=createSpatialLyrics(root,{load:async()=>{loads++;return data}})
  return {root,lyrics,loads:()=>loads,async ready(){lyrics.prepare(REALITIES.paradise);await settle()},
    tick(seconds,playing=true,reality=state,h=head,f=front){lyrics.update({songId:'paradise',seconds,playing},reality,h,f)},
    visible(){return root.children[0].children.filter(m=>m.visible)}}
}

test('supplied Paradise data: 76 valid events, all 20 presets, bounded chronology and original bytes',()=>{
  assert.equal(validateLyricData(data,'paradise'),data)
  assert.equal(data.events.length,76);assert.equal(Object.keys(LYRIC_PRESETS).length,20)
  assert.equal(data.song.audioDurationSeconds,299.472)
  assert.equal(data.events[0].start,53);assert.equal(data.events.at(-1).end,280.88)
  assert.equal(new Set(data.events.map(e=>e.text)).size,37)
  for(const text of ['Ocean sunsets','Neon lights','Lost between the waves and sky','The world disappears','Paradise'])assert.ok(data.events.some(e=>e.text===text))
  // Immutable supplied prototype: editing timing is intentional and should update this provenance checksum.
  assert.equal(createHash('sha256').update(bytes.toString('utf8').replaceAll('\r\n','\n')).digest('hex'),'3ab204374acacaac9388d8922102555538288a0d92aa6d04abfa16f20b39f323')
  for(const change of [{start:-1},{end:400},{end:52},{preset:'UNKNOWN'}])assert.throws(()=>validateLyricData({...data,events:[{...data.events[0],...change}]},'paradise'))
})
test('timeline exact boundaries, overlapping phrases and forward/backward seek inspect current intervals only',()=>{
  const out=[];assert.equal(fillActiveEvents(data.events,52,out).length,0)
  assert.deepEqual(fillActiveEvents(data.events,53,out),[0]);assert.deepEqual(fillActiveEvents(data.events,56.88,out),[])
  assert.equal(fillActiveEvents(data.events,97.1,out).length,2)
  assert.deepEqual(fillActiveEvents(data.events,278,out),[75]);assert.deepEqual(fillActiveEvents(data.events,53.2,out),[0])
  assert.equal(fillActiveEvents(data.events,299.472,out).length,0)
  let peak=0;for(const e of data.events)peak=Math.max(peak,fillActiveEvents(data.events,e.start,out).length)
  assert.equal(peak,2);assert.ok(peak<=LYRIC_LIMITS.maxActive)
})
test('one cached atlas, 37 entries, tight hero UV and bounded GPU dimensions',()=>{
  const atlas=createLyricAtlas(data)
  assert.equal(atlas.entries.size,37);assert.equal(atlas.texture.image.width,2048);assert.equal(atlas.texture.image.height,2048)
  for(const e of atlas.entries.values()){assert.ok(e.u>=0&&e.v>=0&&e.u+e.w<=1&&e.v+e.h<=1);assert.ok(e.aspect>1)}
  assert.ok(atlas.entries.get('Paradise').w<.5);atlas.dispose()
})
test('activation/expiration use four pooled meshes without per-frame text drawing',async()=>{
  const h=setup();await h.ready();const initial=h.root.children[0].children.slice(),draws=drawCalls.text
  for(let i=0;i<30000;i++)h.tick(i/100)
  assert.deepEqual(h.root.children[0].children,initial);assert.equal(drawCalls.text,draws)
  assert.equal(h.loads(),1);assert.equal(h.visible().length,0)
  h.tick(97.1);assert.equal(h.visible().length,2);h.lyrics.dispose()
})
test('pause freezes opacity and transforms; resume continues at media time',async()=>{
  const h=setup();await h.ready();h.tick(110)
  const m=h.visible()[0],p=m.position.clone(),o=m.material.opacity
  for(let i=0;i<100;i++)h.tick(110,false)
  assert.deepEqual(m.position,p);assert.equal(m.material.opacity,o)
  h.tick(110.5);assert.ok(m.position.y>p.y);h.lyrics.dispose()
})
test('OFF clears immediately; ON at mid-song displays only currently relevant events',async()=>{
  const h=setup();await h.ready();h.tick(54);assert.equal(h.visible().length,1)
  h.lyrics.setEnabled(false);assert.equal(h.visible().length,0);h.tick(130);assert.equal(h.visible().length,0)
  h.lyrics.setEnabled(true);h.tick(278);assert.equal(h.visible().length,1)
  h.tick(290);assert.equal(h.visible().length,0);h.lyrics.dispose()
})
test('leaving Paradise clears even before transition starts; returning reuses the atlas',async()=>{
  const h=setup();await h.ready();h.tick(54)
  for(const song of ['daydream','neon-therapy']){
    h.lyrics.prepare(REALITIES[song]);h.tick(54,true,{...state,requestedReality:song});assert.equal(h.visible().length,0)
    h.tick(54,true,{...state,activeReality:song,requestedReality:song});assert.equal(h.visible().length,0)
    await h.ready();h.tick(54,true,{...state,realityTransition:true});assert.equal(h.visible().length,0)
    h.tick(54);assert.equal(h.visible().length,1)
  }
  assert.equal(h.loads(),1);h.lyrics.dispose()
})
test('world anchors freeze after creation and resolve safely after player relocation',async()=>{
  const h=setup();await h.ready();h.tick(54)
  const mesh=h.visible()[0],q=mesh.quaternion.clone(),p=mesh.position.clone()
  h.tick(54,true,state,new THREE.Vector3(5,1.2,4),new THREE.Vector3(1,0,0))
  assert.deepEqual(mesh.position,p);assert.ok(mesh.quaternion.equals(q))
  h.lyrics.hide();h.tick(54,true,state,new THREE.Vector3(5,1.2,4),new THREE.Vector3(1,0,0))
  assert.notDeepEqual(h.visible()[0].position,p)
  for(const e of data.events){h.lyrics.hide();h.tick(e.start+.05,true,state,new THREE.Vector3(6,1.2,5),new THREE.Vector3(0,0,1));for(const m of h.visible()){assert.ok(m.position.z<=-9.9);assert.ok(m.position.y>=3.8);assert.ok(m.position.distanceTo(head)>10)}}
  h.lyrics.dispose()
})
test('overlapping bridge declarations occupy distinct spatial anchors',async()=>{
  const h=setup();await h.ready();h.tick(237.5);h.tick(238.5)
  const [a,b]=h.visible();assert.ok(a&&b);assert.ok(a.position.distanceTo(b.position)>.5);h.lyrics.dispose()
})
test('failed lyric load is silent; disposal aborts late loads and frees each resource once',async()=>{
  const root=new THREE.Group();let resolve,signal,atlases=0
  const l=createSpatialLyrics(root,{load:(_,s)=>{signal=s;return new Promise(r=>resolve=r)},atlasFactory:()=>{atlases++;return createLyricAtlas(data)}})
  l.prepare(REALITIES.paradise);await settle();l.dispose();l.dispose();resolve(data);await settle()
  assert.equal(signal.aborted,true);assert.equal(atlases,0);assert.equal(root.children.length,0)
  const fail=createSpatialLyrics(root,{load:()=>Promise.reject(Error('offline'))});fail.prepare(REALITIES.paradise);await settle()
  assert.equal(fail.stats().lyricStatus,'error');fail.dispose()
  const h=setup();await h.ready();let releases=0
  h.root.children[0].children[0].material.map.addEventListener('dispose',()=>releases++)
  h.lyrics.dispose();h.lyrics.dispose();assert.equal(releases,1)
})
class Media extends EventTarget {
  paused=true;src='';currentTime=0;duration=299.472;plays=0
  getAttribute(){return this.src}removeAttribute(){this.src=''}load(){this.currentTime=0}pause(){this.paused=true}play(){this.paused=false;this.plays++;return Promise.resolve()}
}
function world(){
  const media=new Media(),registered=[],requests=[];let dogLoads=0,audioCount=0
  const loader={load(path,ok){requests.push(()=>ok(new THREE.Texture()))}}
  const game=createSkyLoft({back:()=>game.xrHooks.onRequestExit(),environmentLoader:loader,
    companionLoader:{load(path,ok){dogLoads++;ok({scene:new THREE.Group(),animations:['Idle','Trot','HappyHop'].map(name=>new THREE.AnimationClip(name,1,[]))})}},
    audioFactory:()=>{audioCount++;return media},lyricsOptions:{load:async()=>data}})
  const origin=new THREE.Group();origin.position.y=1.6;game.scene.add(origin)
  const session=Object.assign(new EventTarget(),{visibilityState:'visible'})
  const xr={origin,session,renderer:{xr:{getReferenceSpace:()=>({})}},interaction:{controllers:[],addTarget(object,select){const r={object,select};registered.push(r);return()=>registered.splice(registered.indexOf(r),1)}}}
  const frame={getViewerPose:()=>({transform:{position:{x:0,y:0,z:0},orientation:{x:0,y:0,z:0,w:1}}})}
  let time=0
  function tick(seconds=.02){for(let i=0;i<seconds*50;i++){time+=20;game.update(time,frame)}}
  function loaded(){requests.splice(0).forEach(f=>f())}
  function enter(){game.xrHooks.onEnter(xr);tick();loaded()}
  return {game,origin,media,registered,session,tick,loaded,enter,dogLoads:()=>dogLoads,audioCount:()=>audioCount}
}
test('Play/Pause controls use one player and exact time; new reality selected while paused starts normally',async()=>{
  const h=world();h.enter();h.registered[2].select();h.loaded();await settle();h.tick(3);await settle()
  h.media.currentTime=133.4;h.tick();h.registered[5].select()
  assert.equal(h.media.paused,true);h.tick(3);assert.equal(h.game.getPlaybackClock().seconds,133.4)
  h.registered[5].select();await settle();assert.equal(h.media.paused,false);assert.equal(h.media.currentTime,133.4)
  h.registered[5].select();h.registered[1].select();h.loaded();h.tick(3);await settle()
  assert.equal(h.game.getPlaybackClock().songId,'daydream');assert.equal(h.media.currentTime,0);assert.equal(h.media.paused,false)
  assert.equal(h.game.getDebugState().activeLyrics,0);assert.equal(h.audioCount(),1);h.game.xrHooks.dispose()
})
test('Lyrics control leaves media untouched; session reset defaults ON and one persistent dog/system',async()=>{
  const h=world();h.enter();h.registered[2].select();h.loaded();await settle();h.tick(3);await settle()
  h.media.currentTime=110;h.tick();assert.equal(h.game.getDebugState().activeLyrics,1)
  h.registered[6].select();assert.equal(h.game.getDebugState().lyricsEnabled,false);assert.equal(h.game.getDebugState().activeLyrics,0)
  assert.equal(h.media.currentTime,110);assert.equal(h.media.paused,false)
  h.registered[6].select();h.tick();assert.equal(h.game.getDebugState().activeLyrics,1)
  for(let i=0;i<5;i++){h.game.xrHooks.onExit();h.enter();assert.equal(h.registered.length,7);assert.equal(h.game.getDebugState().lyricsEnabled,true);assert.equal(h.game.getDebugState().activeLyrics,0)}
  assert.equal(h.dogLoads(),1);assert.equal(h.audioCount(),1)
  assert.equal(h.game.getDebugState().companionCount,1)
  assert.equal(h.game.scene.getObjectsByProperty('name','SkyLoft_SpatialLyrics').length,1)
  h.registered[3].select();assert.equal(h.registered.length,0);assert.equal(h.media.src,'')
  h.game.xrHooks.dispose();assert.equal(h.game.scene.getObjectsByProperty('name','SkyLoft_SpatialLyrics').length,0)
})
test('headset interruption freezes lyrics and explicit Play resumes; transitions block accidental toggles',async()=>{
  const h=world();h.enter();h.registered[2].select();h.loaded();await settle();h.tick(.5)
  h.registered[5].select();assert.equal(h.game.getDebugState().realityTransition,true)
  h.session.visibilityState='hidden';h.session.dispatchEvent(new Event('visibilitychange'));h.tick(2)
  const before=h.game.getPlaybackClock().seconds
  h.session.visibilityState='visible';h.tick();h.registered[5].select();h.tick(3);await settle()
  assert.equal(h.game.getDebugState().realityTransition,false);assert.equal(h.media.paused,false)
  h.media.currentTime=54;h.tick();const mesh=h.game.scene.getObjectByName('SkyLoft_SpatialLyrics').children.find(m=>m.visible),p=mesh.position.clone()
  h.session.visibilityState='hidden';h.session.dispatchEvent(new Event('visibilitychange'));h.tick(2)
  assert.deepEqual(mesh.position,p);assert.equal(h.media.currentTime,54)
  h.session.visibilityState='visible';h.tick();h.registered[5].select();await settle();assert.equal(h.media.currentTime,54)
  assert.ok(Number.isFinite(before));h.game.xrHooks.dispose()
})
test('seven controls do not overlap, remain above table and utility rays invoke only intended action',()=>{
  const h=world();h.enter();h.game.scene.updateMatrixWorld(true)
  const boxes=h.registered.map(r=>new THREE.Box3().setFromObject(r.object))
  for(let i=0;i<boxes.length;i++){
    assert.ok(boxes[i].min.y>.585+.16)
    for(let j=i+1;j<boxes.length;j++)assert.equal(boxes[i].intersectsBox(boxes[j]),false)
    const eye=new THREE.Vector3(0,1.6,0),point=h.registered[i].object.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(.02,0,0))
    const ray=new THREE.Raycaster(eye,point.sub(eye).normalize(),0,5)
    const hits=ray.intersectObjects(h.registered.map(r=>r.object));assert.equal(hits.length,1);assert.equal(hits[0].object,h.registered[i].object)
  }
  assert.equal(CONFIG.selectorDistance,2.4);h.game.xrHooks.dispose()
})


test('starting-position lyrics clear selector and overlap stays within comfortable front composition',async()=>{
  const h=world();h.enter();h.registered[2].select();h.loaded();await settle();h.tick(3);await settle()
  for(const seconds of [54,97.1,105.4,110.3,238.5]){
    h.media.currentTime=seconds;h.tick()
    const meshes=h.game.scene.getObjectByName('SkyLoft_SpatialLyrics').children.filter(m=>m.visible)
    for(const mesh of meshes){
      const p=mesh.getWorldPosition(new THREE.Vector3()),d=-p.z
      assert.ok((p.y-1.6)/d>.4) // selector's top is at slope .3875
      assert.ok((p.y-1.6)/d<.75) // don't stack phrases above the comfortable view
      assert.ok(Math.abs(p.x)/d<.8)
    }
  }
  h.game.xrHooks.dispose()
})
