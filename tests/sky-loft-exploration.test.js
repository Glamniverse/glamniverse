import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {BARK,createBarkAudio} from '../src/games/sky-loft/bark.js'
import {EXPLORATION as C,isWalkable,validMovement,createExploration} from '../src/games/sky-loft/exploration.js'
import {createCompanionMotion} from '../src/games/sky-loft/companion-motion.js'
import {createCompanion} from '../src/games/sky-loft/companion.js'
const flush=()=>new Promise(resolve=>setImmediate(resolve))
function audioHarness(){
 const sources=[],panners=[],gains=[]
 const point=()=>({positionX:{value:0},positionY:{value:0},positionZ:{value:0},forwardX:{value:0},forwardY:{value:0},forwardZ:{value:0},upX:{value:0},upY:{value:0},upZ:{value:0},connect(){},disconnect(){}})
 const ctx={state:'running',destination:{},listener:point(),closed:0,resume:()=>Promise.resolve(),decodeAudioData:()=>Promise.resolve({}),close(){this.closed++;return Promise.resolve()},
 createBufferSource(){const s={starts:0,stops:0,connect(){},disconnect(){},start(){this.starts++},stop(){this.stops++}};sources.push(s);return s},
 createGain(){const g={gain:{value:0},connect(){},disconnect(){}};gains.push(g);return g},
 createPanner(){const p=point();panners.push(p);return p}}
 const audio=createBarkAudio({config:{...BARK,src:'/test-bark.ogg'},contextFactory:()=>ctx,fetchAudio:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)})})
 return {audio,ctx,sources,panners,gains}
}
test('bark stays completely silent with missing asset, blocked activation or failed fetch',async()=>{
 let contexts=0;const a=createBarkAudio({contextFactory(){contexts++;throw Error('blocked')}})
 a.activate();assert.equal(contexts,0);assert.equal(a.greet(0,{x:0,y:0,z:0}),false);a.dispose()
 const b=createBarkAudio({config:{...BARK,src:'/missing'},contextFactory(){throw Error('blocked')}});b.activate();b.dispose()
 const h=audioHarness();h.ctx.resume=()=>Promise.reject(Error('denied'));h.audio.activate();await flush();h.ctx.state='suspended';assert.equal(h.audio.greet(0,{x:0,y:0,z:0}),false);h.audio.dispose()
 const f=createBarkAudio({config:{...BARK,src:'/missing'},contextFactory:()=>h.ctx,fetchAudio:async()=>({ok:false})});f.activate();await flush();assert.equal(f.greet(20,{}),false);f.dispose()
})
test('greeting bark cooldown, one voice, spatial tracking, conservative gain and cleanup',async()=>{
 const h=audioHarness(),dog={x:2,y:.2,z:-1};h.audio.activate();await flush()
 assert.equal(h.audio.greet(0,dog),true);assert.equal(h.gains[0].gain.value,.12)
 assert.equal(h.panners[0].positionX.value,2);assert.equal(h.panners[0].refDistance,1)
 assert.equal(h.audio.greet(1,dog),false);assert.equal(h.audio.greet(20,dog),false);assert.equal(h.sources.length,1)
 h.audio.update({x:1,y:1.6,z:0},{x:1,y:0,z:0},{x:3,y:.2,z:0})
 assert.equal(h.ctx.listener.positionX.value,1);assert.equal(h.panners[0].positionX.value,3)
 h.sources[0].onended();assert.equal(h.audio.greet(33,dog),true)
 h.audio.pause();assert.equal(h.sources[1].stops,1)
 h.audio.reset();assert.equal(h.audio.greet(0,dog),true);h.audio.dispose();h.audio.dispose();assert.equal(h.ctx.closed,1)
})
test('late decoded bark cannot survive exit/reset',async()=>{
 const h=audioHarness();let decode;h.ctx.decodeAudioData=()=>new Promise(r=>decode=r)
 h.audio.activate();await flush();h.audio.reset();decode({});await flush();assert.equal(h.audio.greet(100,{x:0,y:0,z:0}),false);h.audio.dispose()
})
function movement(){
 const place=new THREE.Group(),origin=new THREE.Group();origin.position.y=1.6
 const entry=hand=>({connected:true,controller:{visible:true},source:{handedness:hand,gamepad:{mapping:'xr-standard',axes:[0,0,0,0]}}})
 const left=entry('left'),right=entry('right'),state={origin,interaction:{controllers:[right,left]}}
 const pose={transform:{position:{x:0,y:0,z:0},orientation:{x:0,y:0,z:0,w:1}}}
 const motion=createExploration(place);motion.bind(state)
 let now=0
 return {motion,origin,pose,left,right,place,tick(n=1){for(let i=0;i<n;i++){now+=1000/60;motion.update(now,pose,true)}}}
}
test('stationary default, neutral latch, deadzone, delta-time speed and no vertical motion',()=>{
 const h=movement();h.left.source.gamepad.axes[3]=-1;h.tick(60);assert.equal(h.origin.position.z,0)
 h.motion.setMode('slow');h.tick(60);assert.equal(h.origin.position.z,0)
 h.left.source.gamepad.axes[3]=.1;h.tick();assert.equal(h.origin.position.z,0)
 h.left.source.gamepad.axes[3]=-1;h.tick(60);assert.ok(Math.abs(h.origin.position.z+C.speed)<1e-8);assert.equal(h.origin.position.y,1.6)
 h.motion.pause();h.tick(60);assert.ok(Math.abs(h.origin.position.z+C.speed)<1e-8)
 h.motion.reset();assert.equal(h.origin.position.z,0);assert.equal(h.motion.mode,'stationary')
})
test('headset-facing movement and rotated loft coordinates',()=>{
 const h=movement(),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2)
 Object.assign(h.pose.transform.orientation,{x:q.x,y:q.y,z:q.z,w:q.w});h.motion.setMode('slow');h.tick();h.left.source.gamepad.axes[3]=-1;h.tick(60)
 assert.ok(h.origin.position.x<-.44);assert.ok(Math.abs(h.origin.position.z)<1e-8)
})
test('snap turn pivots around physical headset offset; requires release and cooldown',()=>{
 const h=movement();h.pose.transform.position.x=.3;h.pose.transform.position.z=.2;h.motion.setMode('slow');h.tick()
 const before=new THREE.Vector3(.3,0,.2).applyMatrix4(h.origin.matrixWorld)
 h.right.source.gamepad.axes[2]=1;h.tick();assert.ok(Math.abs(h.origin.rotation.y+Math.PI/6)<1e-8)
 const after=new THREE.Vector3(.3,0,.2).applyMatrix4(h.origin.matrixWorld);assert.ok(before.distanceTo(after)<1e-8)
 h.tick(60);assert.ok(Math.abs(h.origin.rotation.y+Math.PI/6)<1e-8)
 h.right.source.gamepad.axes[2]=0;h.tick();h.right.source.gamepad.axes[2]=1;h.tick();assert.ok(Math.abs(h.origin.rotation.y+Math.PI/3)<1e-8)
 h.motion.reset();assert.equal(h.origin.rotation.y,0);assert.equal(h.origin.position.y,1.6)
})
test('real floor boundaries and every furniture exclusion, including swept crossing',()=>{
 assert.equal(isWalkable(6.36,0),false);assert.equal(isWalkable(0,-5.16),false);assert.equal(isWalkable(6,4.8),true)
 for(const [x,z] of [[0,3.8],[0,2.2],[0,5.6],[0,-2.6],[2.95,3.8]])assert.equal(isWalkable(x,z),false)
 assert.equal(validMovement(-2,2.2,2,2.2),false);assert.equal(validMovement(-3,0,3,0),true)
 assert.equal(isWalkable(NaN,0),false)
})
test('movement includes roomscale offset; no edge escape, tunnelling or furniture crossing',()=>{
 const h=movement();h.pose.transform.position.x=6.30;h.motion.setMode('slow');h.tick();h.left.source.gamepad.axes[2]=1;h.tick(120)
 assert.ok(h.origin.position.x+6.30<=6.35);assert.ok(h.origin.position.x<.051)
 h.motion.reset();h.pose.transform.position.x=0;h.motion.bind({origin:h.origin,interaction:{controllers:[h.left]}});h.motion.setMode('slow');h.left.source.gamepad.axes[2]=0;h.tick();h.left.source.gamepad.axes[3]=1;h.tick(1000)
 assert.ok(h.origin.position.z<1.45)
})
test('disconnect/reconnect cannot resume a held stick until neutral',()=>{
 const h=movement();h.motion.setMode('slow');h.tick();h.left.connected=false;h.left.source.gamepad.axes[3]=-1;h.tick(10);h.left.connected=true;h.tick(20);assert.equal(h.origin.position.z,0)
 h.left.source.gamepad.axes[3]=0;h.tick();h.left.source.gamepad.axes[3]=-1;h.tick();assert.ok(h.origin.position.z<0)
})
test('dog retargets relocated user and remains within approved region',()=>{
 const m=createCompanionMotion(),head={x:0,z:0}
 for(let i=0;i<10000&&m.state!=='APPROACH_USER';i++)m.update(1/60,head)
 assert.equal(m.state,'APPROACH_USER');head.x=.4;head.z=.35
 for(let i=0;i<5000&&m.state!=='HAPPY';i++)m.update(1/60,head)
 assert.equal(m.state,'HAPPY');assert.ok(Math.abs(Math.hypot(m.position.x-head.x,m.position.z-head.z)-1.05)<.04)
})
test('one greeting callback per happy cycle, not per hop frame or loop',()=>{
 const parent=new THREE.Group();let ready,count=0
 const c=createCompanion(parent,{load(p,ok){ready=ok}},()=>count++)
 c.load();ready({scene:new THREE.Group(),animations:['Idle','Trot','HappyHop'].map(n=>new THREE.AnimationClip(n,1,[]))})
 const head=new THREE.Vector3(0,1.6,0)
 for(let i=0;i<6000;i++)c.update(i*1000/60,head,true)
 assert.ok(count>0&&count<6);c.dispose()
})

test('room rotation uses loft-local boundaries, and rebind restores rig and stationary mode',()=>{
 const h=movement();h.place.rotation.y=Math.PI/2;h.place.updateMatrixWorld(true)
 h.motion.reset();h.origin.rotation.y=Math.PI/2;h.motion.bind({origin:h.origin,interaction:{controllers:[h.left,h.right]}})
 h.motion.setMode('slow');h.tick();h.left.source.gamepad.axes[3]=-1;h.tick(600)
 const local=h.place.worldToLocal(h.origin.position.clone());assert.ok(local.z>-2.04);assert.ok(local.z<-1.9)
 h.motion.reset();assert.equal(h.origin.position.x,0);assert.equal(h.origin.position.z,0);assert.ok(Math.abs(h.origin.rotation.y-Math.PI/2)<1e-9);assert.equal(h.motion.mode,'stationary')
})
