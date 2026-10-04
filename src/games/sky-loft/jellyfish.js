import * as THREE from 'three'
import { createJellyfishResonance } from './jellyfish-resonance.js'

// Twelve permanent pooled inhabitants. All drift envelopes stay outside the real floor.
export const JELLYFISH=Object.freeze({
  count:12,
  anchors:[[-10,5,-10],[0,7,-13],[11,6,-11],[-17,9,-22],[17,10,-26],
    [-25,13,-40],[8,14,-46],[-13,7,3],[14,8,2],[-22,11,19],[23,12,22],[0,16,40]],
})
export function jellyfishPosition(time,i,out){
  const a=JELLYFISH.anchors[i],phase=i*1.73
  return out.set(a[0]+.7*Math.sin(time*.12+phase),a[1]+.45*Math.sin(time*.23+phase),a[2]+.8*Math.cos(time*.1+phase))
}
export function createJellyfish(parent){
  const group=new THREE.Group();group.name='SkyLoft_Jellyfish';parent.add(group)
  const bell=new THREE.SphereGeometry(.55,16,6,0,Math.PI*2,0,Math.PI/2)
  const p=bell.attributes.position,colors=[],c=new THREE.Color()
  for(let i=0;i<p.count;i++){
    const y=p.getY(i);p.setY(i,y*.62)
    c.setRGB(.12+.3*y,.46+.45*y,.86+.1*y)
    colors.push(c.r,c.g,c.b)
  }
  bell.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));bell.computeVertexNormals()
  const ring=new THREE.TorusGeometry(.53,.022,4,24);ring.rotateX(Math.PI/2)
  // Six gently curved, tapered ribbon tentacles, merged into one shared geometry.
  const positions=[],indices=[]
  for(let arm=0;arm<6;arm++){
    const angle=arm*Math.PI/3,base=positions.length/3
    for(let j=0;j<=10;j++){
      const t=j/10,r=.26+.1*Math.sin(t*6+arm),sway=.1*Math.sin(t*7+arm)
      const x=Math.cos(angle)*r+sway,z=Math.sin(angle)*r+.08*Math.sin(t*5+arm),y=-t*(1.25+arm*.065),w=.018*(1-t*.8)
      positions.push(x-w,y,z,x+w,y,z)
      if(j<10){const k=base+j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}
    }
  }
  const tails=new THREE.BufferGeometry();tails.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));tails.setIndex(indices);tails.computeVertexNormals()
  const bells=new THREE.InstancedMesh(bell,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false}),JELLYFISH.count)
  const rims=new THREE.InstancedMesh(ring,new THREE.MeshBasicMaterial({color:0x83eaff,toneMapped:false}),JELLYFISH.count)
  const tendrils=new THREE.InstancedMesh(tails,new THREE.MeshBasicMaterial({color:0x65bde8,side:THREE.DoubleSide,toneMapped:false}),JELLYFISH.count)
  const meshes=[bells,rims,tendrils]
  for(const m of meshes){m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;group.add(m)}
  const tint=new THREE.Color()
  for(let i=0;i<JELLYFISH.count;i++){
    tint.setHex([0xb5edff,0xb5c8ff,0x9affee][i%3])
    bells.setColorAt(i,tint);rims.setColorAt(i,tint);tendrils.setColorAt(i,tint)
  }
  const o=new THREE.Object3D(),pos=new THREE.Vector3(),resonance=createJellyfishResonance(parent)
  let elapsed=0,last=null,active=0,disposed=false,waveAge=Infinity
  const reset=()=>{waveAge=Infinity;resonance.reset();elapsed=0;last=null;active=0;group.visible=false}
  reset()
  return {
    reset,
    heroPulse(){if(disposed||!group.visible||!active)return false;waveAge=0;return true},
    update(time,visible,input){
      if(disposed)return
      if(!visible||!Number.isFinite(time)){waveAge=Infinity;resonance.reset();last=null;active=0;group.visible=false;return}
      const dt=last===null?0:Math.min(.05,Math.max(0,(time-last)/1000));elapsed+=dt;waveAge+=dt;last=time
      resonance.begin(dt,input)
      group.visible=true;active=JELLYFISH.count
      for(let i=0;i<JELLYFISH.count;i++){
        jellyfishPosition(elapsed,i,pos)
        const response=resonance.step(i,pos,elapsed,dt,o.position)
        const waveTime=waveAge-i*.06
        const wave=waveTime>=0&&waveTime<1.2?Math.sin(Math.PI*waveTime/1.2)**2:0
        const phase=i*1.73,pulse=1+(.065+.035*response+.04*wave)*Math.sin(elapsed*1.6+phase),scale=i<3?1.05:.65+(i%4)*.18
        o.rotation.set(.035*Math.sin(elapsed*.3+phase),elapsed*.035+phase,.06*Math.sin(elapsed*.35+phase))
        o.scale.set(scale*pulse,scale*(2-pulse),scale*pulse);o.updateMatrix();bells.setMatrixAt(i,o.matrix);rims.setMatrixAt(i,o.matrix)
        // Whole trailing skirt sways slowly; no per-tentacle CPU vertex deformation.
        o.rotation.z+=.1*Math.sin(elapsed*.6+phase);o.scale.setScalar(scale);o.updateMatrix();tendrils.setMatrixAt(i,o.matrix)
      }
      for(const m of meshes)m.instanceMatrix.needsUpdate=true
    },
    stats:()=>({jellyfishPool:JELLYFISH.count,activeJellyfish:active,...resonance.stats()}),
    dispose(){if(disposed)return;reset();disposed=true},
  }
}
