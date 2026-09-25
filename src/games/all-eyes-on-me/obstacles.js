import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { obstacleAt, obstacleSpawn, obstacleEnd } from './level.js'
import { makePanel } from '../smash-the-hate/ui.js'
import { eyeGeometry } from './targets.js'

// Frozen START baseline. Only headset displacement is judged, never move the camera.
export function createObstacleJudge() {
  let x=0,y=0,kind='duck',observed=false,failed=false
  return {
    calibrate(head){x=head.x;y=head.y;observed=failed=false},
    begin(value){kind=value;observed=failed=false},
    sample(head){
      observed=true
      const safe=kind==='duck'?head.y<=y-C.duckAmount:kind==='left'?head.x<=x-C.dodgeAmount:head.x>=x+C.dodgeAmount
      if(!safe)failed=true
    },
    success:()=>observed&&!failed,
    baseline:()=>({x,y}),
  }
}
export function createObstacles(root,events,onResult){
  const group=new THREE.Group();root.add(group);group.visible=false
  const material=new THREE.MeshBasicMaterial({color:0xb681ff})
  const bar=new THREE.BoxGeometry(1,1,0.025)
  const bars=Array.from({length:4},()=>{const m=new THREE.Mesh(bar,material);group.add(m);return m})
  const label=makePanel(2.6,0.42,512,128);group.add(label.mesh)
  const icon=new THREE.Group();icon.position.y=-0.02;group.add(icon)
  const eye=new THREE.Mesh(eyeGeometry(),material);eye.scale.setScalar(0.5);icon.add(eye)
  const slash=new THREE.Mesh(bar,material);slash.scale.set(0.025,0.4,1);slash.rotation.z=-0.7;icon.add(slash)
  const judge=createObstacleJudge();let next=0,active=null,judged=false
  function hide(){active=null;group.visible=false}
  function layout(kind){
    icon.visible=kind==='duck'
    // Outline only: never an opaque wall across the player's view.
    // Duck's lower edge indicates clearance; dodge's inner edge indicates lean.
    const left=kind==='right'?-1.3:kind==='left'?-C.dodgeAmount:-1.3
    const right=kind==='right'?C.dodgeAmount:1.3
    const bottom=kind==='duck'?-C.duckAmount:-0.8,top=0.55
    bars[0].position.set((left+right)/2,bottom,0);bars[0].scale.set(right-left,0.02,1)
    bars[1].position.set((left+right)/2,top,0);bars[1].scale.set(right-left,0.02,1)
    bars[2].position.set(left,(bottom+top)/2,0);bars[2].scale.set(0.02,top-bottom,1)
    bars[3].position.set(right,(bottom+top)/2,0);bars[3].scale.set(0.02,top-bottom,1)
    label.mesh.position.set(0,0.38,0)
    label.draw([kind==='duck'?'↓ DUCK ↓':kind==='left'?'← LEAN LEFT':'LEAN RIGHT →'],'#ba8aff')
  }
  return {
    reset(){next=0;hide();judge.calibrate({x:0,y:0});judged=false},hide,
    stats:()=>({activeObstacle:active?.kind??null,obstacleBaseline:judge.baseline()}),
    update(time,head){
      if(!active && next<events.length && time>=obstacleSpawn(events[next])){
        active=events[next++];judged=false;judge.begin(active.kind);layout(active.kind);group.visible=true
      }
      if(!active)return
      group.position.z=(time-obstacleAt(active))*C.spawnDistance/C.obstacleTravelSeconds
      const start=obstacleAt(active)-C.obstacleCrossingSeconds/2,end=obstacleAt(active)+C.obstacleCrossingSeconds/2
      if(!judged && time>=start && time<=end)judge.sample(head)
      if(!judged && time>end){judged=true;onResult(judge.success());label.draw([judge.success()?'SMOOTH MOVE':'KEEP MOVING'],'#ba8aff')}
      if(time>=obstacleEnd(active))hide()
    },
  }
}
