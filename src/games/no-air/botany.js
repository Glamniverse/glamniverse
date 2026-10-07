import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { floorHeight, ROCKS, seeded } from './config.js'
import { SCHOOL_SPECIES } from './schools.js'
import { sampleFishRoute, FISH_LOOP_SECONDS } from './fish.js'

export const BOTANY = Object.freeze([
 {id:'kelp',count:30,color:0x387565,height:2.4,sway:.13,rate:.34,radius:.65,zones:[[11,6,1.8],[-11,5,1.8],[-10,-6,1.5]]},
 {id:'fans',count:20,color:0xad829e,height:1.2,sway:.055,rate:.27,radius:.85,zones:[[-14,6,1.3],[4,8,1.4],[-4,-6,1.3]]},
 {id:'rosettes',count:48,color:0x448779,height:.85,sway:.075,rate:.42,radius:.7,zones:[[-14,8,1.7],[6,6,1.7],[-6,-6,1.6]]},
 {id:'tubes',count:18,color:0x7b91b2,height:.85,sway:.022,rate:.23,radius:.55,zones:[[-4,-18,1.3],[7,-20,2],[-12,-24,1.8]]},
])
function merge(parts){for(const g of parts)g.deleteAttribute('uv');const expanded=parts.map(g=>g.index?g.toNonIndexed():g),g=mergeGeometries(expanded);for(const p of new Set([...parts,...expanded]))p.dispose();return g}
function segment(a,b,r){const v=new THREE.Vector3().subVectors(b,a),g=new THREE.CylinderGeometry(r*.65,r,v.length(),5,1,true);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));g.translate((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);return g}
function leaf(height,width,bend,angle,base=0){
 const g=new THREE.PlaneGeometry(1,1,2,5),p=g.attributes.position
 for(let i=0;i<p.count;i++){const t=p.getY(i)+.5,x=p.getX(i);p.setXYZ(i,x*width*Math.pow(Math.sin(Math.PI*t),.65),base+t*height,bend*t*t+Math.abs(x)*.06*Math.sin(t*Math.PI))}
 g.rotateY(angle);g.computeVertexNormals();return g
}
function geometry(id){
 const parts=[]
 if(id==='kelp'){for(let i=0;i<3;i++)parts.push(leaf(1-i*.16,.09,.12+i*.04,i*2.2))}
 if(id==='rosettes'){for(let i=0;i<6;i++)parts.push(leaf(.75+(i%2)*.25,.48,.58,i*2.399))}
 if(id==='fans'){
  const origin=new THREE.Vector3(0,0,0),stem=new THREE.Vector3(0,.22,0);parts.push(segment(origin,stem,.026))
  for(let i=0;i<7;i++){const a=-1.18+i*.393,end=new THREE.Vector3(Math.sin(a)*.7,.24+Math.cos(a)*.7,.045*Math.sin(i));parts.push(segment(stem,end,.016))
   for(const side of [-1,1]){const mid=stem.clone().lerp(end,.62),tip=end.clone().add(new THREE.Vector3(side*.12,.075,.01));parts.push(segment(mid,tip,.009))}
  }
 }
 if(id==='tubes'){
  for(let i=0;i<5;i++){
   const a=i*2.399,r=i? .25:0,h=.48+(i%3)*.23,x=Math.cos(a)*r,z=Math.sin(a)*r
   // Open, flared tubes with a recessed dark interior, all opaque geometry.
   const tube=new THREE.CylinderGeometry(.085,.046,h,8,1,true);tube.translate(x,h/2,z);parts.push(tube)
   const lip=new THREE.TorusGeometry(.083,.011,3,8);lip.rotateX(Math.PI/2);lip.translate(x,h,z);parts.push(lip)
   const inside=new THREE.CircleGeometry(.076,8);inside.rotateX(-Math.PI/2);inside.translate(x,h-.075,z);parts.push(inside)
  }
 }
 return merge(parts)
}
// Sample unchanged authored routes once at creation; no per-frame fish/plant collision work.
function corridors(){const samples=[],p=new THREE.Vector3();for(let i=0;i<120;i++){sampleFishRoute(i/120*FISH_LOOP_SECONDS,p);samples.push({x:p.x,y:p.y,z:p.z,r:.4})}
 for(const s of SCHOOL_SPECIES){const curve=new THREE.CatmullRomCurve3(s.points.map(v=>new THREE.Vector3(...v)),true,'centripetal');for(let i=0;i<120;i++){curve.getPointAt(i/120,p);samples.push({x:p.x,y:p.y,z:p.z,r:s.spread*1.65+.5})}}
 return samples
}
export function botanicalPlacementSafe(x,z,height,radius,paths){
 const y=floorHeight(x,z)
 // Preserve the central sandy sightline and swim approach.
 if(Math.abs(x)<2.5&&z>-12&&z<10)return false
 for(const [rx,rz,sx,sy,sz] of ROCKS){if(((x-rx)/(Math.max(sx,sz)*1.15+radius))**2+((z-rz)/(Math.max(sx,sz)*1.15+radius))**2<1)return false}
 for(const p of paths){const dy=p.y-THREE.MathUtils.clamp(p.y,y,y+height+.25);if((p.x-x)**2+(p.z-z)**2+dy*dy<(p.r+radius+.25)**2)return false}
 // Avoid steep cliff faces: upright growth belongs on small shelves, not hovering off a wall.
 if(Math.abs(floorHeight(x+.25,z)-floorHeight(x-.25,z))>.8||Math.abs(floorHeight(x,z+.25)-floorHeight(x,z-.25))>.8)return false
 return true
}
function material(){return new THREE.ShaderMaterial({vertexColors:true,side:THREE.DoubleSide,uniforms:{time:{value:0}},
 vertexShader:`uniform float time;attribute vec3 botanical;varying vec3 wPos;varying vec3 tint;varying vec3 wNormal;
 void main(){vec3 p=position;float y=max(p.y,0.);float phase=instanceMatrix[3].x*.91+instanceMatrix[3].z*.57;p.x+=y*y*botanical.x*sin(time*botanical.y+phase+y*2.);p.z+=y*y*botanical.x*.55*cos(time*botanical.y*.79+phase+p.x*3.);vec4 w=modelMatrix*instanceMatrix*vec4(p,1.);wPos=w.xyz;wNormal=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);tint=color*(.8+.2*clamp(y,0.,1.));gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform float time;varying vec3 wPos;varying vec3 tint;varying vec3 wNormal;
 void main(){vec3 n=normalize(wNormal);if(!gl_FrontFacing)n=-n;float sun=max(dot(n,normalize(vec3(-.35,1.,.18))),0.);vec2 p=wPos.xz*.72+wPos.y*.16;float warp=sin(p.x*.73+p.y*.52+time*.17)*.7;float a=sin(p.x*2.3+warp+time*.23)+sin(p.y*2.5-warp-time*.19);float caustic=pow(max(0.,1.-abs(a)*1.9),4.)*.24*max(n.y*.7+.3,0.);vec3 c=tint*(.44+.56*sun)*vec3(.62,.83,1.)+vec3(.09,.32,.5)*caustic;float haze=1.-exp(-max(0.,distance(wPos,cameraPosition)-4.)*.012);vec3 water=mix(vec3(.003,.04,.14),vec3(.012,.16,.34),clamp((wPos.y+32.)/68.,0.,1.));gl_FragColor=vec4(mix(c,water,haze),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`})}
export function createOceanBotany(scene){
 const root=new THREE.Group();root.name='no-air-botany';scene.add(root)
 const shared=material(),random=seeded(2197),paths=corridors(),transform=new THREE.Object3D(),families=[]
 for(const spec of BOTANY){
  const g=geometry(spec.id),p=g.attributes.position,colors=[],motion=[],base=new THREE.Color(spec.color)
  for(let i=0;i<p.count;i++){const shade=spec.id==='tubes'&&p.getY(i)<.9?.86:1;colors.push(base.r*shade,base.g*shade,base.b*shade);motion.push(spec.sway,spec.rate,0)}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('botanical',new THREE.Float32BufferAttribute(motion,3))
  const mesh=new THREE.InstancedMesh(g,shared,spec.count);mesh.name='botany-'+spec.id;const placements=[]
  for(let i=0;i<spec.count;i++){
   let accepted=false
   for(let attempt=0;attempt<400;attempt++){
    const zone=spec.zones[i%spec.zones.length],angle=random()*Math.PI*2,r=Math.sqrt(random())*zone[2],x=zone[0]+Math.cos(angle)*r,z=zone[1]+Math.sin(angle)*r
    const scale=.78+random()*.38,h=spec.height*scale,width=spec.id==='kelp'?1.4*scale:spec.height*scale,radius=spec.radius*scale
    if(!botanicalPlacementSafe(x,z,h,radius,paths)||placements.some(p=>Math.hypot(p.x-x,p.z-z)<(spec.id==='rosettes'?.3:.42)))continue
    transform.position.set(x,floorHeight(x,z)-.035,z);transform.rotation.set(0,random()*Math.PI*2,0);transform.scale.set(width,h,width);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);placements.push({x,z,y:transform.position.y,height:h,radius});accepted=true;break
   }
   if(!accepted){g.dispose();throw Error('No safe botanical placement for '+spec.id+' '+i)}
  }
  mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.65;root.add(mesh);families.push({spec,mesh,placements})
 }
 let disposed=false
 return {root,families,update(seconds){if(!disposed)shared.uniforms.time.value=seconds},
  stats(){return {instances:families.reduce((n,f)=>n+f.mesh.count,0),draws:4,instancedDraws:4,triangles:families.reduce((n,f)=>n+f.mesh.geometry.attributes.position.count/3*f.mesh.count,0),materials:1,textures:0,lights:0,transparentDraws:0,families:families.map(f=>({id:f.spec.id,count:f.mesh.count,triangles:f.mesh.geometry.attributes.position.count/3*f.mesh.count}))}},
  dispose(){disposed=true}, // Shared world lifecycle owns GPU disposal, like the approved environment.
 }
}
