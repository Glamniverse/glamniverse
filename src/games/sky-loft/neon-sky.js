import * as THREE from 'three'

export const LIVING_SKY=Object.freeze({cycle:80,ufoStart:10,ufoDuration:14,riftStart:46,
  riftDuration:5,riftIn:2,riftHold:.5,riftOut:2.5,
  structures:[[-48,23,-115],[64,30,-145]]})
const ease=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t)}
export function riftEnvelope(age){
  if(age<0||age>=5)return 0
  return age<2?ease(age/2):age<2.5?1:1-ease((age-2.5)/2.5)
}
// One fixed pool, autonomous elapsed time, no timers, audio clock or interactions.
export function createNeonSky(parent){
  const group=new THREE.Group();group.name='SkyLoft_NeonLivingSky';parent.add(group)
  const box=new THREE.BoxGeometry(1,1,1)
  const bodyMaterial=new THREE.MeshBasicMaterial({color:0x151b32,toneMapped:false})
  const accentMaterial=new THREE.MeshBasicMaterial({color:0x657fbc,toneMapped:false})
  const structures=new THREE.InstancedMesh(box,bodyMaterial,8)
  const accents=new THREE.InstancedMesh(box,accentMaterial,4)
  structures.frustumCulled=false;accents.frustumCulled=false
  structures.instanceMatrix.setUsage(THREE.DynamicDrawUsage);accents.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  group.add(structures,accents)
  const craft=new THREE.Group();craft.name='SkyLoft_DistantCraft';group.add(craft)
  const hull=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),bodyMaterial)
  hull.scale.set(7,.65,2.8);craft.add(hull)
  const rim=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-7,0,0),new THREE.Vector3(0,0,-2.8),new THREE.Vector3(7,0,0),new THREE.Vector3(0,0,2.8)]),
    new THREE.LineBasicMaterial({color:0x7896c8,toneMapped:false}))
  craft.add(rim)
  // Narrow branching ribbons, not a screen overlay. No bloom or light emission.
  const nodes=[[-4,-3],[-2.5,-1.2],[-1.7,.4],[.2,1.5],[1,3.5],[3.5,5],
    [-1.7,.4],[-3.5,1.4],[-4.5,3],[.2,1.5],[2,1.7],[3.4,3]]
  const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[6,7],[7,8],[9,10],[10,11]],vertices=[],indices=[]
  for(const [a,b] of edges){
    const [x,y]=nodes[a],[xx,yy]=nodes[b],length=Math.hypot(xx-x,yy-y),dx=-(yy-y)/length*.09,dy=(xx-x)/length*.09,k=vertices.length/3
    vertices.push(x+dx,y+dy,0,x-dx,y-dy,0,xx+dx,yy+dy,0,xx-dx,yy-dy,0)
    indices.push(k,k+1,k+2,k+1,k+3,k+2)
  }
  const fissureGeometry=new THREE.BufferGeometry();fissureGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));fissureGeometry.setIndex(indices)
  const riftMaterial=new THREE.MeshBasicMaterial({color:0x8592cd,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false})
  const rift=new THREE.Mesh(fissureGeometry,riftMaterial);rift.name='SkyLoft_NeonRift';rift.position.set(-24,39,-125);group.add(rift)
  const object=new THREE.Object3D()
  let elapsed=0,last=null,disposed=false,visibility=1
  const reset=()=>{elapsed=0;last=null;group.visible=false;craft.visible=false;rift.visible=false;riftMaterial.opacity=0}
  reset()
  return {
    reset,
    setVisibility(value){visibility=THREE.MathUtils.clamp(value,0,1);if(visibility===0)group.visible=false},
    update(time,enabled){
      if(disposed)return
      if(!enabled||!Number.isFinite(time)){reset();return}
      const dt=last===null?0:Math.min(.05,Math.max(0,(time-last)/1000));last=time;elapsed+=dt
      group.visible=visibility>0
      bodyMaterial.color.setHex(0x151b32).multiplyScalar(visibility)
      accentMaterial.color.setHex(0x657fbc).multiplyScalar(visibility)
      rim.material.color.setHex(0x7896c8).multiplyScalar(visibility)
      for(let i=0;i<2;i++){
        const [x,y,z]=LIVING_SKY.structures[i],drift=.18*Math.sin(elapsed*.08+i)
        // Slab and offset monoliths: city architecture, not natural floating islands.
        for(let j=0;j<4;j++){
          object.position.set(x+(j===0?0:(j-2)*2.4),y+drift+(j===0?0:j===2?2.9:1.6),z)
          object.rotation.set(0,.08*Math.sin(elapsed*.025+i),0)
          object.scale.set(j===0?12:1.3,j===0?.7:j===2?5.8:3.2,j===0?5:1.6)
          object.updateMatrix();structures.setMatrixAt(i*4+j,object.matrix)
        }
        for(let j=0;j<2;j++){
          object.position.set(x,y+drift+.4,z+(j?2.35:-2.35));object.scale.set(11,.07,.07)
          object.rotation.set(0,0,0);object.updateMatrix();accents.setMatrixAt(i*2+j,object.matrix)
        }
      }
      structures.instanceMatrix.needsUpdate=true;accents.instanceMatrix.needsUpdate=true
      const phase=elapsed%LIVING_SKY.cycle,ufoAge=phase-LIVING_SKY.ufoStart
      craft.visible=ufoAge>=0&&ufoAge<LIVING_SKY.ufoDuration
      if(craft.visible){
        const t=ufoAge/LIVING_SKY.ufoDuration
        craft.position.set(-110+220*t,29+1.5*Math.sin(Math.PI*t),-145-4*Math.sin(Math.PI*t))
        craft.rotation.set(.03*Math.sin(t*Math.PI),0,.06*Math.sin(t*Math.PI*2))
        craft.scale.setScalar(ease(ufoAge/2)*ease((LIVING_SKY.ufoDuration-ufoAge)/2))
      }
      const envelope=riftEnvelope(phase-LIVING_SKY.riftStart)
      rift.visible=envelope>0;riftMaterial.opacity=.32*envelope*visibility
      rift.scale.set(1,.85+.15*envelope,1)
    },
    stats:()=>({skyStructureCount:2,skyUfoCount:1,skyActive:group.visible,
      skyUfoActive:group.visible&&craft.visible,skyRiftActive:group.visible&&rift.visible}),
    dispose(){if(disposed)return;reset();disposed=true},
    // Attached graphics are released by the existing world resource disposer.
  }
}
