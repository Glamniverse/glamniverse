import * as THREE from 'three'

export const LIVING_SKY=Object.freeze({cycle:80,ufoStart:10,ufoDuration:14,riftStart:46,
  riftDuration:5.8,riftIn:2,riftHold:.5,riftOut:2.5,riftDelays:[0,.4,.8],
  structures:[[-28,16,-58],[31,21,-72],[-60,25,-64],[63,28,-76]]})
const ease=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t)}
export function riftEnvelope(age){
  if(age<0||age>=5)return 0
  return age<2?ease(age/2):age<2.5?1:1-ease((age-2.5)/2.5)
}
// Local architectural components: platform, underslung core, asymmetric towers,
// bridge and spire. Four profiles share two draws, with irregular lit floors.
function cityParts(){
  const bodies=[],windows=[]
  const profiles=[[[ -3,4,2],[0,7,2],[3.5,3,1.6]],
    [[-4,6,1.7],[-.5,3,2.6],[3,8,1.5]],
    [[-3.5,3,2.5],[0,9,1.5],[3,5,2]],
    [[-4,7,1.5],[-1,5,2],[3.2,4,2.4]]]
  const add=(list,city,x,y,z,w,h,d=1)=>list.push({city,local:new THREE.Matrix4().makeScale(w,h,d).setPosition(x,y,z)})
  profiles.forEach((towers,i)=>{
    add(bodies,i,0,0,0,12,.7,5)
    add(bodies,i,i%2?2:-2,-1.3,0,4,2,2.8)
    add(bodies,i,i%2?-3:3,2.6,-.4,7,.3,.7)
    towers.forEach(([x,h,w],j)=>{
      const z=j===1?-.7:.4
      add(bodies,i,x,.35+h/2,z,w,h,1.8)
      // Sparse window bands; no uniform illuminated grid.
      for(let k=0;k<2;k++)add(windows,i,x+(k?-.15:.12),1.2+k*(h-1.4)*.7,z+.91,w*.7,.13)
      if(j===i%3)add(windows,i,x+w*.38,.7+h/2,z+.92,.09,h*.72)
    })
    const tallest=towers.reduce((a,b)=>a[1]>b[1]?a:b)
    add(bodies,i,tallest[0],tallest[1]+1.35,tallest===towers[1]?-.7:.4,.12,2,.12)
    add(windows,i,-1,.12,2.51,8,.08)
  })
  return {bodies,windows}
}
// One fixed pool, autonomous elapsed time, no timers, audio clock or interactions.
export function createNeonSky(parent){
  const group=new THREE.Group();group.name='SkyLoft_NeonLivingSky';parent.add(group)
  const box=new THREE.BoxGeometry(1,1,1)
  const bodyMaterial=new THREE.MeshBasicMaterial({color:0x151b32,toneMapped:false})
  const accentMaterial=new THREE.MeshBasicMaterial({color:0x657fbc,toneMapped:false})
  const parts=cityParts()
  const structures=new THREE.InstancedMesh(box,bodyMaterial,parts.bodies.length)
  const accents=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),accentMaterial,parts.windows.length)
  accentMaterial.side=THREE.DoubleSide
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
  const rifts=[[-24,95,-110,2.2,2],[-9,101,-113,1.9,1.7],[4,105,-116,1.6,1.5]].map(([x,y,z,sx,sy],i)=>{
    const rift=new THREE.Mesh(fissureGeometry,i?riftMaterial.clone():riftMaterial)
    rift.name=i?`SkyLoft_NeonRift_${i}`:'SkyLoft_NeonRift'
    rift.position.set(x,y,z);rift.scale.set(sx,sy,1);group.add(rift);return rift
  })
  const object=new THREE.Object3D(),matrix=new THREE.Matrix4()
  const cityMatrices=LIVING_SKY.structures.map(()=>new THREE.Matrix4())
  let elapsed=0,last=null,disposed=false,visibility=1
  const reset=()=>{elapsed=0;last=null;group.visible=false;craft.visible=false;for(const rift of rifts){rift.visible=false;rift.material.opacity=0}}
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
      for(let i=0;i<LIVING_SKY.structures.length;i++){
        const [x,y,z]=LIVING_SKY.structures[i]
        object.position.set(x,y+.18*Math.sin(elapsed*.08+i),z)
        object.rotation.set(0,.08*Math.sin(elapsed*.025+i),0)
        object.updateMatrix();cityMatrices[i].copy(object.matrix)
      }
      for(let i=0;i<parts.bodies.length;i++){
        const part=parts.bodies[i];matrix.multiplyMatrices(cityMatrices[part.city],part.local);structures.setMatrixAt(i,matrix)
      }
      for(let i=0;i<parts.windows.length;i++){
        const part=parts.windows[i];matrix.multiplyMatrices(cityMatrices[part.city],part.local);accents.setMatrixAt(i,matrix)
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
      for(let i=0;i<rifts.length;i++){
        const envelope=riftEnvelope(phase-LIVING_SKY.riftStart-LIVING_SKY.riftDelays[i])
        rifts[i].visible=envelope>0;rifts[i].material.opacity=.42*envelope*visibility
      }
    },
    stats:()=>({skyStructureCount:4,skyUfoCount:1,skyActive:group.visible,
      skyUfoActive:group.visible&&craft.visible,skyRiftActive:group.visible&&rifts.some(rift=>rift.visible)}),
    dispose(){if(disposed)return;reset();disposed=true},
    // Attached graphics are released by the existing world resource disposer.
  }
}
