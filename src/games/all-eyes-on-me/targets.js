import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { spawnAt, missAt, targetZ, targetX, isSideTarget } from './level.js'

// One shared stylized eye outline + iris geometry; opaque, no anatomical eyeballs.
export function eyeGeometry() {
  const s=new THREE.Shape()
  s.moveTo(-0.5,0); s.quadraticCurveTo(0,0.58,0.5,0)
  s.quadraticCurveTo(0,-0.58,-0.5,0)
  const h=new THREE.Path()
  h.moveTo(-0.37,0); h.quadraticCurveTo(0,-0.38,0.37,0)
  h.quadraticCurveTo(0,0.38,-0.37,0); s.holes.push(h)
  return new THREE.ShapeGeometry(s,12)
}
export function createTargets(root,level,onMiss) {
  const outline=eyeGeometry(), iris=new THREE.RingGeometry(0.075,0.14,16)
  const arrow = new THREE.BufferGeometry()
  arrow.setAttribute('position', new THREE.Float32BufferAttribute([
    0.02,0,0, -0.09,0.08,0, -0.05,0,0,
    0.02,0,0, -0.05,0,0, -0.09,-0.08,0,
  ],3))
  const materials={left:new THREE.MeshBasicMaterial({color:0xff40b9,side:THREE.DoubleSide}),right:new THREE.MeshBasicMaterial({color:0x38d9ff,side:THREE.DoubleSide})}
  const entries=Array.from({length:C.maxTargets},()=>{
    const mesh=new THREE.Group(); mesh.visible=false; root.add(mesh)
    const eye=new THREE.Mesh(outline,materials.left), centre=new THREE.Mesh(iris,materials.left)
    const cue=new THREE.Mesh(arrow,materials.left);cue.visible=false;mesh.add(cue)
    mesh.add(eye,centre); eye.scale.set(C.cardWidth,C.cardHeight/0.58,1); centre.scale.setScalar(C.cardWidth)
    return {mesh,eye,centre,cue,position:mesh.position,previous:new THREE.Vector3(),event:null}
  })
  let next=0
  const hide=()=>{for(const t of entries){t.event=null;t.mesh.visible=false}}
  return {
    dispose() { outline.dispose(); iris.dispose(); arrow.dispose(); Object.values(materials).forEach(m=>m.dispose()) },
    entries, hide, reset(){next=0;hide()},
    consume(t){if(!t.event)return false;t.event=null;t.mesh.visible=false;return true},
    update(time,head){
      for(const t of entries){
        if(!t.event)continue
        t.previous.copy(t.position);t.position.z=targetZ(t.event,time);t.position.x=targetX(t.event,time)
        t.mesh.rotation.y=Math.atan2(head.x-t.position.x,head.z-t.position.z)
        if(time>=missAt(t.event)){t.event=null;t.mesh.visible=false;onMiss()}
      }
      while(next<level.events.length && time>=spawnAt(level.events[next])){
        const event=level.events[next++]
        if(time>=missAt(event)){onMiss();continue}
        const t=entries.find(v=>!v.event)
        if(!t)throw Error('Validated eye pool exhausted')
        t.event=event;t.mesh.visible=true;t.mesh.rotation.y=0
        const [,y]=C.lanes[event.lane];t.position.set(targetX(event,time),y,targetZ(event,time));t.previous.copy(t.position)
        t.eye.material=t.centre.material=t.cue.material=materials[event.hand]
        const sign=event.hand==='left'?-1:1
        t.cue.visible=isSideTarget(event);t.cue.position.x=sign*0.28;t.cue.scale.x=sign
      }
    },
  }
}
