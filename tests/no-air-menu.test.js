import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createOceanAudio} from '../src/games/no-air/audio.js'
import {createOceanMenu,createYEdge,leftYPressed} from '../src/games/no-air/menu.js'
function source(){return {handedness:'left',profiles:['meta-quest-touch-plus'],gamepad:{mapping:'xr-standard',buttons:Array.from({length:8},()=>({pressed:false}))}}}
test('profile-mapped Left Y only; reserved Menu and right hand ignored; hold/reconnect cannot spam',()=>{
 const s=source(),edge=createYEdge();assert.equal(edge.step(false),false);s.gamepad.buttons[7].pressed=true;assert.equal(leftYPressed(s),false)
 s.gamepad.buttons[5].pressed=true;assert.equal(leftYPressed(s),true);assert.equal(edge.step(true),true);for(let i=0;i<20;i++)assert.equal(edge.step(true),false)
 edge.step(false);assert.equal(edge.step(true),true);edge.reset();assert.equal(edge.step(true),false)
 s.handedness='right';assert.equal(leftYPressed(s),false);s.handedness='left';s.profiles=['unknown'];assert.equal(leftYPressed(s),false)
})
test('one song, position preserved on pause/exit, no loop, rejected playback clear and retryable',async()=>{
 let made=0,calls=0,deny=true;const el={paused:true,ended:false,currentTime:47,play(){calls++;if(deny)return Promise.reject(Error('policy'));this.paused=false;return Promise.resolve()},pause(){this.paused=true},removeAttribute(){},load(){}}
 const a=createOceanAudio('/audio/no-air/no_air.mp3',()=>{made++;return el});a.resume();await Promise.resolve();assert.match(a.state,/select Play/)
 deny=false;a.start();await Promise.resolve();assert.equal(a.state,'Playing');a.start();assert.equal(calls,2);assert.equal(el.loop,false)
 a.pause();a.resume();assert.equal(el.paused,true);assert.equal(el.currentTime,47);a.start();await Promise.resolve();a.reset();assert.equal(el.currentTime,47);a.resume();await Promise.resolve();assert.equal(a.state,'Playing');assert.equal(made,1)
 el.ended=true;el.paused=true;const before=calls;a.resume();assert.equal(calls,before);a.start();assert.equal(el.currentTime,0);a.dispose();a.resume();assert.equal(made,1)
})
test('menu hidden by default, view-positioned once, selectable only when open, safe detach/reentry',()=>{
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})}
 const sourceLeft=source(),targets=[],rays=[];let resets=0,exits=0,toggles=0
 const state={interaction:{controllers:[{connected:true,source:sourceLeft}],setMenuRays:v=>rays.push(v),addTarget(object,action,options){const t={object,action,options};targets.push(t);return ()=>targets.splice(targets.indexOf(t),1)}}}
 const menu=createOceanMenu(new THREE.Scene(),{state:'Paused',toggle(){toggles++}},()=>resets++,()=>exits++)
 menu.attach(state);assert.equal(menu.open,false);assert.equal(rays.at(-1),false);assert.equal(targets.length,3);assert.ok(targets.every(t=>!t.options.enabled()))
 const head=new THREE.Vector3(3,2,-5),q=new THREE.Quaternion();menu.update(state,head,q);sourceLeft.gamepad.buttons[5].pressed=true;menu.update(state,head,q)
 assert.equal(menu.open,true);assert.ok(Math.abs(menu.root.position.distanceTo(head)-1.65)<.01);const anchor=menu.root.position.clone();head.x+=3;menu.update(state,head,q);assert.deepEqual(menu.root.position,anchor)
 targets[0].action();assert.equal(toggles,1);targets[1].action();assert.equal(exits,1);sourceLeft.gamepad.buttons[5].pressed=false;menu.update(state,head,q);sourceLeft.gamepad.buttons[5].pressed=true;menu.update(state,head,q);assert.equal(menu.open,false);assert.ok(resets>=3)
 menu.detach();assert.equal(targets.length,0);menu.attach(state);assert.equal(targets.length,3);menu.dispose();assert.equal(targets.length,0);delete globalThis.document
})
