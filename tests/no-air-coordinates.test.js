import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {COORDINATES_KEY,COORDINATES_OFFSET,createCoordinatesPreference,formatCoordinates,createOceanCoordinates} from '../src/games/no-air/coordinates.js'
import {createOceanMenu} from '../src/games/no-air/menu.js'
const mockCanvas=()=>{const text=[];globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(s){text.push(s)}})})};return text}
const pose=()=>({transform:{position:{x:1,y:1.6,z:2},orientation:{x:0,y:0,z:0,w:1}}})
function store(value=null){const writes=[];return {writes,getItem:key=>{assert.equal(key,COORDINATES_KEY);return value},setItem(key,v){assert.equal(key,COORDINATES_KEY);value=v;writes.push(v)}}}

test('coordinates default OFF; independent namespaced preference restores and tolerates blocked/corrupt storage',()=>{
 const storage=store(),a=createCoordinatesPreference(storage);assert.equal(a.enabled,false);a.set(true);assert.equal(createCoordinatesPreference(storage).enabled,true);a.set(false);assert.equal(createCoordinatesPreference(storage).enabled,false);assert.deepEqual(storage.writes,['on','off'])
 for(const value of ['true','{}','garbage','',null])assert.equal(createCoordinatesPreference(store(value)).enabled,false)
 const denied=createCoordinatesPreference({getItem(){throw Error()},setItem(){throw Error()}});assert.equal(denied.enabled,false);denied.set(true);assert.equal(denied.enabled,true)
})
test('two-decimal XYZ uses world-space viewer position with translated/rotated rig and physical headset offset',()=>{
 mockCanvas();const scene=new THREE.Scene(),origin=new THREE.Group(),pref=createCoordinatesPreference(null);pref.set(true);const hud=createOceanCoordinates(scene,pref),p=pose();origin.position.set(10,-20,3);origin.rotation.y=Math.PI/2;const before={...p.transform.position};hud.updateXR(0,p,origin)
 assert.equal(hud.text,'X: 12.00\nY: -18.40\nZ: 2.00');assert.deepEqual(p.transform.position,before);assert.equal(formatCoordinates({x:-3.519,y:-18.4,z:11.55}),'X: -3.52\nY: -18.40\nZ: 11.55');assert.equal(formatCoordinates({x:-.0001,y:0,z:0}),'X: 0.00\nY: 0.00\nZ: 0.00')
 const local=hud.root.position.clone().sub(new THREE.Vector3(12,-18.4,2)).applyQuaternion(origin.quaternion.clone().invert());assert.ok(local.distanceTo(new THREE.Vector3(COORDINATES_OFFSET.x,COORDINATES_OFFSET.y,COORDINATES_OFFSET.z))<1e-9)
 delete globalThis.document
})
test('HUD pose follows every frame while text uploads are capped at 8 Hz, hidden on exit and safely reused',()=>{
 const drawn=mockCanvas(),pref=createCoordinatesPreference(null),hud=createOceanCoordinates(new THREE.Scene(),pref),origin=new THREE.Group(),p=pose();hud.updateXR(0,p,origin);assert.equal(hud.root.visible,false);hud.toggle();hud.updateXR(0,p,origin);assert.equal(drawn.length,3)
 const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),.2);Object.assign(p.transform.orientation,{x:q.x,y:q.y,z:q.z,w:q.w});p.transform.position.x+=1;hud.updateXR(.01,p,origin);assert.ok(hud.root.quaternion.angleTo(q)<1e-7);assert.equal(drawn.length,3)
 hud.updateXR(.126,p,origin);assert.equal(drawn.length,6);hud.updateXR(.26,p,origin);assert.equal(drawn.length,6)
 hud.hide();assert.equal(hud.root.visible,false);assert.equal(hud.enabled,true);hud.updateXR(1,p,origin);assert.equal(hud.root.visible,true);hud.toggle();assert.equal(hud.root.visible,false);hud.updateXR(2,p,origin);assert.equal(hud.root.visible,false);hud.toggle();hud.dispose();hud.updateXR(3,p,origin);assert.equal(hud.root.visible,false);delete globalThis.document
})
test('existing Left Y menu adds only a persisted coordinates setting; music, resume and exit still work',()=>{
 const drawn=mockCanvas(),scene=new THREE.Scene(),pref=createCoordinatesPreference(store()),hud=createOceanCoordinates(scene,pref),targets=[];let exits=0,music=0
 const source={handedness:'left',profiles:['meta-quest-touch-plus'],gamepad:{mapping:'xr-standard',buttons:Array.from({length:8},()=>({pressed:false}))}},state={interaction:{controllers:[{connected:true,source}],setMenuRays(){},addTarget(mesh,action,options){targets.push({action,options});return ()=>{}}}}
 const menu=createOceanMenu(scene,{state:'Paused',toggle(){music++}},()=>{},()=>exits++,{shells:18,pearls:6,complete:false},hud);menu.attach(state);assert.equal(targets.length,4);assert.ok(drawn.includes('See Coordinates: OFF'));const head=new THREE.Vector3(),q=new THREE.Quaternion();menu.update(state,head,q);source.gamepad.buttons[5].pressed=true;menu.update(state,head,q);assert.equal(menu.open,true)
 targets[3].action();assert.equal(hud.enabled,true);assert.ok(drawn.includes('See Coordinates: ON'));assert.equal(createCoordinatesPreference(store('on')).enabled,true);targets[0].action();targets[1].action();assert.equal(music,1);assert.equal(exits,1);targets[3].action();assert.equal(hud.enabled,false);targets[2].action();assert.equal(menu.open,false);assert.ok(targets.every(t=>!t.options.enabled()));menu.dispose();delete globalThis.document
})
test('M5 collisions, navigation, collectibles/progress and Left Y mapping remain unchanged',()=>{
 const baseline='877da81eca01712cdc6ccbf9a1af8f1378e9f68d'
 for(const file of ['grotto.js','swimming.js','config.js','discoveries.js','environment.js','fish.js','schools.js','jellyfish.js','dolphin.js','botany.js','audio.js']){const path='src/games/no-air/'+file;assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'}).replaceAll('\r\n','\n'))}
 const path='src/games/no-air/menu.js',before=execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'}).replaceAll('\r\n','\n'),after=readFileSync(path,'utf8').replaceAll('\r\n','\n');assert.equal(after.split('export function createOceanMenu')[0],before.split('export function createOceanMenu')[0]);
 const code=readFileSync('src/games/no-air/index.js','utf8');assert.match(code,/xr.origin.position.add\(step\);xr.origin.updateMatrixWorld\(true\)\s+coordinates.updateXR\(now,pose,xr.origin\)/);assert.match(code,/if\(menu.open\)\{coordinates.updateXR/)
})
