import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import * as THREE from 'three'
import {createSpatialLyrics} from '../src/games/sky-loft/lyrics.js'
import {createHeroInteraction,heroEnvelope,HERO_TOUCH} from '../src/games/sky-loft/hero-interaction.js'
import {createJellyfish} from '../src/games/sky-loft/jellyfish.js'
import {createRealityVisitors} from '../src/games/sky-loft/reality-visitors.js'
import {REALITIES} from '../src/games/sky-loft/config.js'
const data=JSON.parse(readFileSync(new URL('../public/data/sky-loft/lyrics/paradise.json',import.meta.url)))
const head=new THREE.Vector3(0,1.6,0),forward=new THREE.Vector3(0,0,-1)
const atlasFactory=d=>({texture:new THREE.Texture(),entries:new Map(d.events.map(e=>[e.text,{u:0,v:0,w:1,h:1,aspect:5}])),dispose(){this.texture.dispose()}})
async function lyricHarness(song='paradise'){
  const root=new THREE.Group(),source={...data,song:{...data.song,id:song}},lyrics=createSpatialLyrics(root,{load:async()=>source,atlasFactory})
  lyrics.prepare(REALITIES[song]);for(let i=0;i<8;i++)await Promise.resolve()
  const tick=seconds=>lyrics.update({songId:song,seconds,playing:false},{activeReality:song,requestedReality:song},head,forward)
  return {root,lyrics,tick}
}
function harness(blockers=[]){
  const root=new THREE.Group(),mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffe5ac}))
  mesh.position.set(0,0,-60);mesh.scale.set(26,5,1);root.add(mesh)
  const controller=new THREE.Group();root.add(controller)
  let target={mesh,index:1,heroEpoch:0},calls=0,time=0
  const interaction=createHeroInteraction({getHeroTarget:()=>target},blockers,()=>calls++)
  const entry={connected:true,controller}
  function tick(n=1){for(let i=0;i<n;i++){time+=20;interaction.update(time,[entry])}}
  return {root,mesh,controller,entry,interaction,tick,calls:()=>calls,setTarget:t=>target=t,target}
}

test('only visible Paradise HERO is eligible; OFF, other lyrics/reality, hide and disposal disable it',async()=>{
  const h=await lyricHarness();h.tick(54);assert.equal(h.lyrics.getHeroTarget(),null)
  h.tick(109.5);assert.equal(h.lyrics.getHeroTarget(),null)
  h.tick(110);const target=h.lyrics.getHeroTarget();assert.ok(target);assert.equal(target.mesh.position.z,-60);assert.equal(target.mesh.scale.x,26)
  h.lyrics.setEnabled(false);assert.equal(h.lyrics.getHeroTarget(),null)
  h.lyrics.setEnabled(true);h.tick(110);assert.ok(h.lyrics.getHeroTarget())
  h.lyrics.hide();assert.equal(h.lyrics.getHeroTarget(),null)
  h.tick(110);h.lyrics.update({songId:'paradise',seconds:110},{activeReality:'daydream',requestedReality:'daydream'},head,forward)
  assert.equal(h.lyrics.getHeroTarget(),null);h.lyrics.dispose();assert.equal(h.lyrics.getHeroTarget(),null)
  for(const song of ['daydream','neon-therapy']){const other=await lyricHarness(song);other.tick(110);assert.equal(other.lyrics.getHeroTarget(),null);other.lyrics.dispose()}
})

test('dwell activates once, held ray never repeats, distinct event/reset permits a new activation',()=>{
  const h=harness(),objects=h.root.children.slice();h.tick(25);assert.equal(h.calls(),0)
  h.tick(25);assert.equal(h.calls(),1);h.tick(150);assert.equal(h.calls(),1)
  h.setTarget(null);h.tick();h.setTarget(h.target);h.tick(50);assert.equal(h.calls(),1)
  h.target.index=2;h.tick(50);assert.equal(h.calls(),2)
  h.interaction.reset();h.tick(50);assert.equal(h.calls(),3)
  assert.deepEqual(h.root.children,objects);h.interaction.dispose();h.tick(100);assert.equal(h.calls(),3)
})

test('reaction envelope is smooth, bounded and restores exact material/scale without moving lyric',()=>{
  assert.equal(heroEnvelope(0),0);assert.equal(heroEnvelope(.35),1);assert.equal(heroEnvelope(1.2),0)
  const h=harness(),scale=h.mesh.scale.clone(),color=h.mesh.material.color.clone(),position=h.mesh.position.clone();let peak=1
  for(let i=0;i<160;i++){h.tick();peak=Math.max(peak,h.mesh.scale.x/scale.x);assert.ok(h.mesh.scale.x<=scale.x*HERO_TOUCH.peakScale+1e-8)}
  assert.ok(peak>1.059);assert.deepEqual(h.mesh.scale,scale);assert.deepEqual(h.mesh.material.color,color);assert.deepEqual(h.mesh.position,position)
})

test('forgiving ray rectangle, tracking loss and look-away require a fresh deliberate dwell',()=>{
  const h=harness();h.controller.rotation.y=-Math.atan(14/60);h.tick(50);assert.equal(h.calls(),1)
  const outside=harness();outside.controller.rotation.y=-Math.atan(15/60);outside.tick(50);assert.equal(outside.calls(),0)
  outside.controller.rotation.y=0;outside.tick(20);outside.entry.connected=false;outside.tick(20)
  outside.entry.connected=true;outside.tick(20);assert.equal(outside.calls(),0);outside.tick(25);assert.equal(outside.calls(),1)
})

test('UI, furniture and dog hit volumes occlude the distant HERO; hidden blockers do not',()=>{
  for(const name of ['UI','Furniture','SkyLoft_Bichon_Pet']){
    const blocker=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({visible:false}));blocker.name=name;blocker.position.z=-2
    const h=harness([blocker]);h.root.add(blocker);h.tick(60);assert.equal(h.calls(),0)
    blocker.visible=false;h.tick(50);assert.equal(h.calls(),1)
  }
})

test('haptic pulse is gentle/once; missing, throwing and rejected haptics are harmless',async()=>{
  let pulses=0
  for(const actuator of [undefined,{pulse:(gain,ms)=>{assert.equal(gain,.15);assert.equal(ms,50);pulses++;return Promise.resolve(true)}},{pulse:()=>{throw Error('unsupported')}},{pulse:()=>Promise.reject(Error('unsupported'))}]){
    const h=harness();h.entry.source={gamepad:{hapticActuators:actuator?[actuator]:[]}};assert.doesNotThrow(()=>h.tick(100));assert.equal(h.calls(),1)
  }
  await Promise.resolve();assert.equal(pulses,1)
})

test('world wave adds only a bounded scale pulse; jellyfish positions/resonance/resources stay identical',()=>{
  const a=new THREE.Group(),b=new THREE.Group(),ja=createJellyfish(a),jb=createJellyfish(b),controller=new THREE.Group()
  controller.position.set(-1.6,1.6,-5.7)
  const input={head:new THREE.Vector3(-1.6,1.6,-5),controllers:[{connected:true,controller}]},ma=new THREE.Matrix4(),mb=new THREE.Matrix4()
  for(let n=0;n<1500;n++){ja.update(n*20,true,input);jb.update(n*20,true,input)}
  assert.equal(ja.stats().resonatingJellyfish,1);assert.equal(jb.heroPulse(),true)
  const resources=b.children[0].children.slice();let changed=false
  for(let n=1500;n<1650;n++){
    ja.update(n*20,true,input);jb.update(n*20,true,input)
    assert.deepEqual(ja.stats(),jb.stats())
    for(let m=0;m<3;m++)for(let i=0;i<12;i++){
      a.children[0].children[m].getMatrixAt(i,ma);b.children[0].children[m].getMatrixAt(i,mb)
      for(const k of [12,13,14])assert.equal(ma.elements[k],mb.elements[k])
      if(!ma.equals(mb))changed=true
      if(n===1649)assert.ok(ma.equals(mb))
    }
  }
  assert.ok(changed);assert.deepEqual(b.children[0].children,resources);jb.reset();assert.equal(jb.heroPulse(),false)
  ja.dispose();jb.dispose()
})

test('only active Paradise visitor system accepts world pulses; switch/disposal cancels',()=>{
  const v=createRealityVisitors(new THREE.Group())
  for(const species of ['neon-mantas','butterflies']){v.apply(species);v.update(0,true);assert.equal(v.heroPulse(),false)}
  v.apply('jellyfish');v.update(0,true);assert.equal(v.heroPulse(),true)
  v.apply('butterflies');assert.equal(v.heroPulse(),false);v.dispose();assert.equal(v.heroPulse(),false)
})
