import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export const FISH_LOOP_SECONDS = 85
// An independent shelf patrol: a readable near pass, then out over the canyon lip.
const route = new THREE.CatmullRomCurve3([
 new THREE.Vector3(-1,-.65,5),new THREE.Vector3(4,-1.2,2),
 new THREE.Vector3(6,-2,-5),new THREE.Vector3(2,-3,-13),
 new THREE.Vector3(-6,-2.8,-11),new THREE.Vector3(-7,-1.8,-3),
 new THREE.Vector3(-5,-1,3),
],true,'centripetal')
route.updateArcLengths()
export function sampleFishRoute(seconds,target){return route.getPointAt(((seconds/FISH_LOOP_SECONDS)%1+1)%1,target)}
export const fishTailAngle = seconds => Math.sin(seconds*8)*.28
function tint(g,hex){const c=new THREE.Color(hex),p=g.attributes.position,a=[];for(let i=0;i<p.count;i++)a.push(c.r,c.g,c.b);g.setAttribute('color',new THREE.Float32BufferAttribute(a,3));return g}
function fin(points,hex){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.computeVertexNormals();return tint(g,hex)}
export function createOceanFish(scene){
 const root=new THREE.Group();root.name='no-air-single-fish';scene.add(root)
 const body=new THREE.SphereGeometry(1,16,10);body.scale(.041,.069,.133);body.translate(0,0,.028)
 const p=body.attributes.position,colors=[]
 for(let i=0;i<p.count;i++){const c=new THREE.Color().lerpColors(new THREE.Color(0xd2e4e6),new THREE.Color(0x416e91),THREE.MathUtils.smoothstep(p.getY(i),-.02,.066));colors.push(c.r,c.g,c.b)}
 body.setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
 const pieces=[body,
 fin([0,.04,-.065,0,.108,-.043,0,.058,.072],0x688daa),
 fin([0,-.035,-.075,0,-.09,-.06,0,-.045,.025],0x91afbd)]
 for(const side of [-1,1]){
  pieces.push(fin([side*.028,-.005,.065,side*.078,-.034,-.007,side*.032,-.032,.025],0x9ab8c6))
  const eye=new THREE.SphereGeometry(.0033,6,4);eye.translate(side*.029,.018,.12);pieces.push(tint(eye,0x192d3c))
 }
 // All static features share one opaque, vertex-coloured draw. Tail is the second draw.
 for(const g of pieces)g.deleteAttribute('uv')
 const expanded=pieces.map(g=>g.index?g.toNonIndexed():g)
 const geometry=mergeGeometries(expanded);for(const g of new Set([...pieces,...expanded]))g.dispose()
 const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide})
 root.add(new THREE.Mesh(geometry,material))
 const tail=new THREE.Group();tail.position.z=-.094;root.add(tail)
 const tailGeometry=fin([0,0,0,0,.061,-.105,0,.009,-.077, 0,0,0,0,.009,-.077,0,-.009,-.077, 0,0,0,0,-.009,-.077,0,-.061,-.105],0x668da7)
 tail.add(new THREE.Mesh(tailGeometry,material))
 const ahead=new THREE.Vector3(),direction=new THREE.Vector3(),forward=new THREE.Vector3(0,0,1)
 let disposed=false
 function update(seconds){if(disposed)return;sampleFishRoute(seconds,root.position);sampleFishRoute(seconds+.025,ahead);direction.subVectors(ahead,root.position).normalize();root.quaternion.setFromUnitVectors(forward,direction);root.rotateZ(Math.sin(seconds*4)*.018);tail.rotation.y=fishTailAngle(seconds)}
 update(0)
 return {root,tail,update,stats:{creatures:1,draws:2,triangles:geometry.attributes.position.count/3+3,materials:1,textures:0,lights:0},
  dispose(){disposed=true}, // Shared world disposal owns geometry/materials, as for the environment.
 }
}
