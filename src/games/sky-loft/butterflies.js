import * as THREE from 'three'
import { visitorPosition } from './visitors.js'
import { createButterflyCuriosity } from './butterfly-curiosity.js'

// Four pooled butterflies; original distant routes plus XR curiosity. No ray targets or new graphics.
export const BUTTERFLIES=Object.freeze({
  count:4,cycle:32,flight:27,offsets:[0,5,10,15],
  colors:[0x67dfff,0xd799ff,0xffa4cf,0x87f4d7],
  routes:[
    [[-26,11,-45],[-14,7,-16],[-8.5,3.1,-7.5],[-15,7,18]],
    [[29,13,-44],[15,5,-16],[8.5,3.4,-6],[19,9,20]],
    [[-25,15,-60],[-3,9,-18],[6,5,-9],[30,12,-16]],
    [[35,12,18],[12,6,7],[9,3.5,-8],[21,10,-40]],
  ],
})
export function createButterflies(parent){
  const group=new THREE.Group();group.name='SkyLoft_Butterflies';parent.add(group)
  // Scalloped forewing + rounded hindwing form one deliberate two-lobed silhouette.
  const s=new THREE.Shape();s.moveTo(0,-.18)
  s.bezierCurveTo(.14,-.51,.48,-.65,.5,-.3)
  s.bezierCurveTo(.53,-.09,.29,.05,.2,.07)
  s.bezierCurveTo(.48,.14,.45,.49,.23,.44)
  s.bezierCurveTo(.09,.4,.03,.19,0,.16);s.closePath()
  const wing=new THREE.ShapeGeometry(s,9),p=wing.attributes.position,colors=[]
  const pale=new THREE.Color(0xffedb0),base=new THREE.Color(0xffffff),c=new THREE.Color()
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getY(i);p.setXYZ(i,x,0,z)
    // Golden inner veins/edge impression baked into vertex colors, not a shader/texture.
    c.copy(base).lerp(pale,Math.max(0,1-x/.23)*.7)
    if(x>.42)c.multiplyScalar(.46)
    colors.push(c.r,c.g,c.b)
  }
  wing.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));wing.computeVertexNormals()
  const wings=new THREE.InstancedMesh(wing,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false}),BUTTERFLIES.count*2)
  const bodyGeometry=new THREE.CapsuleGeometry(.026,.3,3,6);bodyGeometry.rotateX(Math.PI/2)
  const bodies=new THREE.InstancedMesh(bodyGeometry,new THREE.MeshStandardMaterial({color:0x352c48,roughness:.55,emissive:0x523a24,emissiveIntensity:.15}),BUTTERFLIES.count)
  wings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  // Small fixed pool has changing positions; no stale instancing bounds culling.
  wings.frustumCulled=false;bodies.frustumCulled=false;group.add(wings,bodies)
  for(let i=0;i<BUTTERFLIES.count;i++){wings.setColorAt(i*2,new THREE.Color(BUTTERFLIES.colors[i]));wings.setColorAt(i*2+1,new THREE.Color(BUTTERFLIES.colors[i]))}
  const object=new THREE.Object3D(),hinge=new THREE.Object3D(),matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),next=new THREE.Vector3()
  const curiosity=createButterflyCuriosity(parent),ambient=new THREE.Vector3()
  let elapsed=0,last=null,active=0,disposed=false
  const reset=()=>{curiosity.reset();elapsed=0;last=null;active=0;group.visible=false;wings.count=0;bodies.count=0}
  reset()
  return {
    reset,
    update(time,visible,input){
      if(disposed)return
      if(!visible||!Number.isFinite(time)){curiosity.reset();last=null;group.visible=false;active=0;return}
      const dt=last===null?0:Math.min(.05,Math.max(0,(time-last)/1000));last=time;elapsed+=dt
      active=0;curiosity.begin(dt,input)
      for(let i=0;i<BUTTERFLIES.count;i++){
        const phase=(elapsed+BUTTERFLIES.offsets[i])%BUTTERFLIES.cycle
        const t=Math.min(1,phase/BUTTERFLIES.flight),route=BUTTERFLIES.routes[i]
        visitorPosition(t,route,pos);visitorPosition(Math.min(1,t+.001),route,next)
        ambient.copy(pos);ambient.y+=.15*Math.sin(elapsed*1.5+i)
        ambient.x+=.12*Math.sin(elapsed*.8+i*2)
        const engaged=curiosity.step(i,ambient,phase,elapsed,dt,object.position)
        if(phase>=BUTTERFLIES.flight&&!engaged)continue
        object.rotation.set(0,Math.atan2(-(next.x-pos.x),-(next.z-pos.z)),.1*Math.sin(elapsed+i))
        const size=engaged?1:Math.min(1,phase/2,(BUTTERFLIES.flight-phase)/2)
        object.scale.setScalar(size);object.updateMatrix();bodies.setMatrixAt(active,object.matrix)
        const flap=.25+.8*Math.sin(elapsed*(7+i*.35)+i)
        for(let side=0;side<2;side++){
          hinge.rotation.z=side===0?flap:Math.PI-flap;hinge.updateMatrix()
          matrix.multiplyMatrices(object.matrix,hinge.matrix);wings.setMatrixAt(active*2+side,matrix)
          // Colors remain tied to individual even while compacting inactive slots.
          wings.instanceColor.setXYZ(active*2+side,...colorComponents[i])
        }
        active++
      }
      wings.count=active*2;bodies.count=active;group.visible=active>0
      wings.instanceMatrix.needsUpdate=true;bodies.instanceMatrix.needsUpdate=true;wings.instanceColor.needsUpdate=true
    },
    stats:()=>({butterflyPool:BUTTERFLIES.count,activeButterflies:active,...curiosity.stats()}),
    dispose(){if(disposed)return;reset();curiosity.dispose();disposed=true},
  }
}
const colorComponents=BUTTERFLIES.colors.map(hex=>{const c=new THREE.Color(hex);return [c.r,c.g,c.b]})
