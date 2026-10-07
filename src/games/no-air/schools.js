import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { floorHeight, ROCKS, seeded } from './config.js'

export const SCHOOL_SPECIES = Object.freeze([
 {id:'silver',count:24,length:.24,width:.020,height:.030,spread:1.45,period:106,speed:1.35,tailHz:2.1,pale:0xd5e8ed,dark:0x4c7796,fin:0x8bb9cb,
  points:[[0,-.8,3],[5,-1.6,-3],[3,-3,-13],[-5,-2.5,-12],[-7,-1.3,-4],[-4,-.6,4]]},
 {id:'tropical',count:12,length:.34,width:.031,height:.102,spread:1.05,period:139,speed:.8,tailHz:1.55,pale:0xd8c771,dark:0x388c9b,fin:0xd4ad50,
  points:[[-5,-2,7],[-3,-2.5,1],[-6,-2.6,-3],[-9,-1.6,2],[-7,-1.6,7]]},
 {id:'deep',count:6,length:.66,width:.072,height:.133,spread:1.7,period:173,speed:1.25,tailHz:1.05,pale:0x71a7b6,dark:0x173f59,fin:0x426d8c,
  points:[[-4,-9,-18],[7,-13,-24],[4,-16,-34],[-9,-15,-32],[-12,-11,-23]]},
])

function painted(g,fn){const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const v=fn(p.getX(i),p.getY(i),p.getZ(i));c.push(v.r,v.g,v.b)}g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.deleteAttribute('uv');return g}
function shape(s){
 const L=s.length,parts=[],belly=new THREE.Color(s.pale),back=new THREE.Color(s.dark),finColor=new THREE.Color(s.fin),color=new THREE.Color()
 const body=new THREE.SphereGeometry(1,12,8);body.scale(s.width,s.height,L*.34);body.translate(0,0,L*.12)
 painted(body,(x,y,z)=>{color.lerpColors(belly,back,THREE.MathUtils.smoothstep(y,-s.height*.5,s.height));if(s.id==='tropical'&&Math.abs(z)<L*.055)color.multiplyScalar(.58);return color});parts.push(body)
 function fin(p){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();parts.push(painted(g,()=>finColor))}
 const rear=-L*.22,tip=-L*.54,notch=-L*.42,tail=s.id==='deep'?L*.19:L*.16
 fin([0,0,rear, 0,tail,tip, 0,0,notch, 0,0,rear, 0,0,notch, 0,-tail,tip])
 // A slim triangular dorsal, tall sail-like tropical fins, and swept deep-water fins.
 const dorsal=s.id==='tropical'?s.height*1.55:s.height*1.65
 fin([0,s.height*.6,-L*.12, 0,dorsal,s.id==='deep'?-L*.06:0, 0,s.height*.65,L*.27])
 fin([0,-s.height*.6,-L*.12, 0,-s.height*(s.id==='tropical'?1.35:1.1),-L*.04, 0,-s.height*.6,L*.19])
 for(const side of [-1,1]){
  fin([side*s.width*.7,-s.height*.1,L*.18, side*s.width*2.3,-s.height*.6,-L*.1, side*s.width*.8,-s.height*.45,L*.03])
  const eye=new THREE.SphereGeometry(L*.008,6,4);eye.translate(side*s.width*.65,s.height*.19,L*.37);parts.push(painted(eye,()=>new THREE.Color(0x142831)))
 }
 const expanded=parts.map(g=>g.index?g.toNonIndexed():g),g=mergeGeometries(expanded)
 for(const p of new Set([...parts,...expanded]))p.dispose()
 return g
}
function surface(s){return new THREE.ShaderMaterial({vertexColors:true,side:THREE.DoubleSide,uniforms:{time:{value:0},fishLength:{value:s.length},frequency:{value:s.tailHz}},
 vertexShader:`uniform float time;uniform float fishLength;uniform float frequency;attribute vec2 swim;varying vec3 tint;varying vec3 normalWorld;varying vec3 world;
 void main(){vec3 p=position;float rear=1.-smoothstep(-fishLength*.44,fishLength*.17,p.z);float wave=sin(time*frequency*6.283185*swim.y+swim.x+p.z/fishLength*3.);p.x+=rear*rear*fishLength*.13*wave;
 vec4 w=modelMatrix*instanceMatrix*vec4(p,1.);world=w.xyz;normalWorld=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);tint=color;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`varying vec3 tint;varying vec3 normalWorld;varying vec3 world;
 void main(){vec3 n=normalize(normalWorld);if(!gl_FrontFacing)n=-n;float light=.60+.4*max(dot(n,normalize(vec3(-.35,1.,.18))),0.);float sheen=pow(max(dot(reflect(normalize(vec3(.35,-1.,-.18)),n),normalize(cameraPosition-world)),0.),18.)*.12;
 vec3 c=tint*vec3(.72,.9,1.)*light+vec3(sheen);float haze=1.-exp(-max(0.,distance(cameraPosition,world)-4.)*.012);vec3 water=mix(vec3(.003,.04,.14),vec3(.012,.16,.34),clamp((world.y+32.)/68.,0.,1.));gl_FragColor=vec4(mix(c,water,haze),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`})}
const up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(0,0,1)
// Conservative authored-rock envelopes, computed once; no scene raycasts.
const rocks=ROCKS.map(([x,z,sx,sy,sz])=>({x,y:floorHeight(x,z)+sy*.28,z,sx:sx*1.15+.65,sy:sy*1.15+.65,sz:sz*1.15+.65}))
function clearTarget(p){
 for(const r of rocks){const x=(p.x-r.x)/r.sx,y=(p.y-r.y)/r.sy,z=(p.z-r.z)/r.sz,d=Math.hypot(x,y,z);if(d<1){const k=1/Math.max(.001,d);p.set(r.x+x*k*r.sx,r.y+y*k*r.sy,r.z+z*k*r.sz)}}
 p.y=Math.max(p.y,floorHeight(p.x,p.z)+1.2)
}
// Vertical capsule approximates head + torso, not a hard collision surface.
export function bodyDistance(position,player,out){out.set(position.x-player.x,position.y-THREE.MathUtils.clamp(position.y,player.y-1.3,player.y+.15),position.z-player.z);return out.length()}
export function createOceanSchools(scene){
 const root=new THREE.Group();root.name='no-air-schools';scene.add(root)
 const rand=seeded(2718),transform=new THREE.Object3D(),goal=new THREE.Vector3(),ahead=new THREE.Vector3(),direction=new THREE.Vector3(),right=new THREE.Vector3(),away=new THREE.Vector3(),steer=new THREE.Vector3(),desired=new THREE.Quaternion()
 const schools=SCHOOL_SPECIES.map(s=>{
  const curve=new THREE.CatmullRomCurve3(s.points.map(p=>new THREE.Vector3(...p)),true,'centripetal');curve.updateArcLengths()
  const geometry=shape(s),material=surface(s),mesh=new THREE.InstancedMesh(geometry,material,s.count);mesh.name='school-'+s.id;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  // Tiny fixed batches; avoids recomputing an instance bounding sphere every frame.
  mesh.frustumCulled=false;root.add(mesh)
  const phases=new Float32Array(s.count*2)
  const members=Array.from({length:s.count},(_,i)=>{
   const angle=i*2.399963,r=Math.sqrt((i+.5)/s.count)*s.spread
   const offset=new THREE.Vector3(Math.cos(angle)*r,(rand()-.5)*s.spread*.8,Math.sin(angle)*r*1.3)
   phases[i*2]=rand()*Math.PI*2;phases[i*2+1]=.87+rand()*.26
   return {offset,phase:phases[i*2],scale:.88+rand()*.24,position:new THREE.Vector3(),velocity:new THREE.Vector3(),rotation:new THREE.Quaternion(),avoidance:0}
  })
  geometry.setAttribute('swim',new THREE.InstancedBufferAttribute(phases,2))
  return {spec:s,mesh,curve,members,center:new THREE.Vector3(),retreat:new THREE.Vector3(),retreating:false}
 })
 let elapsed=0,disposed=false
 function advance(dt,player,initial=false){
  for(const school of schools){
   const {spec:s,curve,center,members,retreat}=school,t=(elapsed/s.period)%1
   curve.getPointAt(t,center);curve.getPointAt((t+.001)%1,ahead);direction.subVectors(ahead,center).normalize();right.crossVectors(up,direction).normalize()
   if(player&&s.id==='deep'){
    away.copy(center).add(retreat).sub(player);const d=away.length()
    if(d<5)school.retreating=true;else if(d>8)school.retreating=false
    if(school.retreating){away.y*=.45;if(away.lengthSq()<.001)away.copy(right);away.normalize();retreat.addScaledVector(away,dt*.85).clampLength(0,6)}else retreat.multiplyScalar(Math.exp(-dt*.18))
   }else retreat.multiplyScalar(Math.exp(-dt*.18))
   const breath=1+.09*Math.sin(elapsed*.21+s.count)
   for(let i=0;i<members.length;i++){
    const m=members[i],o=m.offset
    goal.copy(center).add(retreat).addScaledVector(right,o.x*breath+.11*Math.sin(elapsed*.63+m.phase)).addScaledVector(direction,o.z+.16*Math.sin(elapsed*.4+m.phase))
    goal.y+=o.y+.13*Math.sin(elapsed*.52+m.phase)
    clearTarget(goal)
    if(initial){m.position.copy(goal);m.velocity.set(0,0,0);m.rotation.setFromUnitVectors(forward,direction)}
    if(dt>0){
     steer.subVectors(goal,m.position).multiplyScalar(s.id==='silver'?1.15:.72)
     m.avoidance=0
     if(player){
      // Anticipation and continuous local steering: no position snapping or global split cue.
      ahead.copy(m.position).addScaledVector(m.velocity,.6)
      const d=bodyDistance(ahead,player,away),radius=s.id==='silver'?2.3:s.id==='tropical'?.65:1.6
      if(d<radius){
       const strength=(1-d/radius)**2;m.avoidance=strength
       if(d<.001)away.copy(right).multiplyScalar(o.x>=0?1:-1);else away.divideScalar(d)
       if(s.id==='silver'){
        const side=away.dot(right),sign=Math.abs(side)>.08?Math.sign(side):Math.sign(o.x)||1
        // Keep forwards flow while members choose their own near side of the body.
        steer.addScaledVector(right,sign*strength*3.4).addScaledVector(away,strength*2.8)
       }else steer.addScaledVector(away,strength*(s.id==='deep'?2:1.5))
      }
     }
     steer.clampLength(0,s.speed)
     m.velocity.lerp(steer,1-Math.exp(-dt*(s.id==='silver'?3.6:2)))
     m.position.addScaledVector(m.velocity,dt)
     if(m.velocity.lengthSq()>.002){away.copy(m.velocity).normalize();desired.setFromUnitVectors(forward,away);m.rotation.slerp(desired,1-Math.exp(-dt*3))}
    }
    transform.position.copy(m.position);transform.quaternion.copy(m.rotation);transform.scale.setScalar(m.scale);transform.updateMatrix();school.mesh.setMatrixAt(i,transform.matrix)
   }
   school.mesh.instanceMatrix.needsUpdate=true;school.mesh.material.uniforms.time.value=elapsed
  }
 }
 advance(0,null,true)
 return {root,schools,
  update(dt,player){if(disposed||!Number.isFinite(dt)||dt<=0||dt>.15)return;const steps=Math.ceil(dt/.025),step=dt/steps;for(let i=0;i<steps;i++){elapsed+=step;advance(step,player)}},
  reset(){for(const s of schools){s.retreat.set(0,0,0);s.retreating=false;for(const m of s.members){m.velocity.set(0,0,0);m.avoidance=0}}},
  stats(){return schools.map(s=>({species:s.spec.id,count:s.spec.count,draws:1,trianglesPerFish:s.mesh.geometry.attributes.position.count/3,triangles:s.mesh.geometry.attributes.position.count/3*s.spec.count,materials:1,textures:0,lights:0}))},
  dispose(){disposed=true}, // Existing world disposal owns GPU resources once.
 }
}
