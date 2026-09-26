import * as THREE from 'three'

// Deterministic exterior-only flight paths, in the loft's anchored local space.
export const VISITOR_PROFILE = Object.freeze({
  cycleSeconds: 62, flightSeconds: 38, offsets: [0, 29],
  routes: [
    [[-25,14,-90],[-12,5,-12],[-6,3.2,-7.5],[18,6,-7.5]],
    [[45,16,-85],[15,6,-23],[10,3.6,0],[26,10,45]],
  ],
})
export function visitorPosition(t, route, out) {
  const a=1-t,b=3*a*a*t,c=3*a*t*t,d=t*t*t
  return out.set(a*a*a*route[0][0]+b*route[1][0]+c*route[2][0]+d*route[3][0],
    a*a*a*route[0][1]+b*route[1][1]+c*route[2][1]+d*route[3][1],
    a*a*a*route[0][2]+b*route[1][2]+c*route[2][2]+d*route[3][2])
}
export function createVisitors(parent) {
  // One continuous swept-wing silhouette, not a stack of primitives.
  const outline=[[0,-.9],[.22,-.5],[.85,-.3],[1.7,-.1],[2.1,.35],
    [1.45,.28],[.65,.16],[.28,.55],[.1,1.2],[0,2.1],
    [-.1,1.2],[-.28,.55],[-.65,.16],[-1.45,.28],[-2.1,.35],
    [-1.7,-.1],[-.85,-.3],[-.22,-.5]]
  const shape=new THREE.Shape(outline.map(([x,z])=>new THREE.Vector2(x,z)))
  const shell=new THREE.ShapeGeometry(shape)
  const positions=shell.attributes.position
  const lift=(x,z)=>0.16*(1-Math.min(1,Math.abs(x)/2.1))+0.06*Math.sin(z*2)
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),z=positions.getY(i);positions.setXYZ(i,x,lift(x,z),z)
  }
  shell.computeVertexNormals()
  const edge=new THREE.BufferGeometry().setFromPoints(outline.map(([x,z])=>new THREE.Vector3(x,lift(x,z)+.005,z)))
  const bodyMaterial=new THREE.MeshStandardMaterial({color:0x22294e,metalness:.6,roughness:.32,
    emissive:0x291958,emissiveIntensity:.55,side:THREE.DoubleSide})
  const glowMaterial=new THREE.LineBasicMaterial({color:0x93e6ff,toneMapped:false})
  const pool=VISITOR_PROFILE.offsets.map(()=>{
    const group=new THREE.Group()
    group.add(new THREE.Mesh(shell,bodyMaterial),new THREE.LineLoop(edge,glowMaterial))
    parent.add(group);group.visible=false;return group
  })
  const next=new THREE.Vector3()
  let disposed=false,enabled=true,elapsed=0,lastTime=null,active=0
  const reset=()=>{elapsed=0;lastTime=null;active=0;pool.forEach(g=>{g.visible=false})}
  return {
    apply(profile){enabled=profile==='neon-mantas';reset()},
    reset,
    update(time,visible) {
      if(disposed)return
      if(!visible||!Number.isFinite(time)){lastTime=null;pool.forEach(g=>{g.visible=false});active=0;return}
      const delta=lastTime===null?0:Math.min(.05,Math.max(0,(time-lastTime)/1000))
      lastTime=time;elapsed+=delta;active=0
      for(let i=0;i<pool.length;i++){
        const local=elapsed-VISITOR_PROFILE.offsets[i]
        const phase=local<0?-1:local%VISITOR_PROFILE.cycleSeconds
        const g=pool[i];g.visible=enabled&&phase>=0&&phase<VISITOR_PROFILE.flightSeconds
        if(!g.visible)continue
        active++
        const t=phase/VISITOR_PROFILE.flightSeconds,route=VISITOR_PROFILE.routes[i]
        visitorPosition(t,route,g.position);visitorPosition(Math.min(1,t+.001),route,next)
        g.rotation.set(0,Math.atan2(-(next.x-g.position.x),-(next.z-g.position.z)),.08*Math.sin(elapsed*.7+i))
        const scale=.9*Math.min(1,phase/3,(VISITOR_PROFILE.flightSeconds-phase)/3)
        g.scale.set(scale,scale*(1+.2*Math.sin(elapsed*1.8+i)),scale)
      }
    },
    stats:()=>({visitorPool:pool.length,activeVisitors:active}),
    dispose(){if(disposed)return;reset();disposed=true},
    // Graphics remain attached for the existing shared scene-resource disposer.
  }
}
