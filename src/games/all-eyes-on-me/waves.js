import * as THREE from 'three'
import { CONFIG as C } from './config.js'

// One draw call, two pooled opaque rings. No targets, collision or score hooks.
export function createWaves(root,events) {
  const geometry=new THREE.TorusGeometry(1,0.007,4,48)
  const material=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false})
  const mesh=new THREE.InstancedMesh(geometry,material,C.maxWaves);mesh.frustumCulled=false;root.add(mesh)
  const dummy=new THREE.Object3D(),color=new THREE.Color()
  const starts=new Float64Array(C.maxWaves);let next=0,active=0,disposed=false
  function reset(){next=0;active=0;starts.fill(-Infinity);mesh.visible=false}
  reset()
  return {
    reset,
    update(time,playing) {
      if(disposed)return
      if(!playing){mesh.visible=false;return}
      for(let i=0;i<C.maxWaves;i++)if(time-starts[i]>=C.waveDuration)starts[i]=-Infinity
      while(next<events.length && events[next].at+C.chartOffsetSeconds<=time){
        const at=events[next].at+C.chartOffsetSeconds;next++
        if(time-at>=C.waveDuration)continue
        const slot=starts.indexOf(-Infinity)
        if(slot>=0){starts[slot]=at;color.setHex(next%3===0?0xa679ff:next%2?0xff40b9:0x38d9ff);mesh.setColorAt(slot,color)}
      }
      active=0
      for(let i=0;i<C.maxWaves;i++){
        const age=time-starts[i]
        if(!Number.isFinite(age)){dummy.scale.setScalar(0)}
        else {
          active++;const u=Math.max(0,Math.min(1,age/C.waveDuration))
          const align=Math.min(1,u*2),ease=align*align*(3-2*align)
          dummy.position.set(C.portalX*(1-ease),C.portalY*(1-ease),-C.portalDistance+(C.portalDistance+4)*u)
          // Reach a >=2.2m open centre long before crossing the player; never face-sized.
          const radius=1.1+(C.waveRadius-1.1)*Math.min(1,u*2)
          dummy.scale.setScalar(Math.max(radius,u>.5?C.waveClearance:0))
        }
        dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.visible=active>0
    },
    stats:()=>({activeWaves:active,waveCapacity:C.maxWaves}),
    dispose(){if(disposed)return;disposed=true;reset();mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose()},
  }
}
