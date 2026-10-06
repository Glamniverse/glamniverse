import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { OCEAN, floorHeight, ROCKS, seeded } from './config.js'

const vertex=`
uniform float time; uniform float sway;
varying vec3 wPos; varying vec3 wNormal; varying vec3 tint;
void main(){
 vec3 p=position;
 #ifdef USE_INSTANCING
 float phase=instanceMatrix[3].x*.71+instanceMatrix[3].z*.37;
 p.x+=sway*pow(max(p.y,0.),2.)*.065*sin(time*.48+phase+p.y);
 p.z+=sway*max(p.y,0.)*.04*cos(time*.37+phase);
 vec4 w=modelMatrix*instanceMatrix*vec4(p,1.);
 wNormal=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
 #else
 vec4 w=modelMatrix*vec4(p,1.);
 wNormal=normalize(mat3(modelMatrix)*normal);
 #endif
 wPos=w.xyz; tint=color;
 gl_Position=projectionMatrix*viewMatrix*w;
}`
const fragment=`
uniform float time; uniform vec3 base; varying vec3 wPos; varying vec3 wNormal; varying vec3 tint;
void main(){
 vec3 n=normalize(wNormal);if(!gl_FrontFacing)n=-n;
 float sun=max(dot(n,normalize(vec3(-.35,1.,.18))),0.);
 vec2 p=wPos.xz*.72+wPos.y*.16;
 float warp=sin(p.x*.73+p.y*.52+time*.17)*.7;
 float a=sin(p.x*2.3+warp+time*.23)+sin(p.y*2.5-warp-time*.19);
 float caustic=pow(max(0.,1.-abs(a)*1.9),4.)*.24*max(n.y*.7+.3,0.);
 float ripples=.96+.04*sin(wPos.x*9.+sin(wPos.z*.6)*2.);
 vec3 c=base*tint*(.44+.56*sun)*ripples;
 c*=vec3(.62,.83,1.); c+=vec3(.09,.32,.5)*caustic;
 float d=length(wPos-cameraPosition);
 float haze=1.-exp(-max(0.,d-4.)*.012);
 vec3 water=mix(vec3(.003,.04,.14),vec3(.012,.16,.34),clamp((wPos.y+32.)/68.,0.,1.));
 c=mix(c,water,haze);
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`
function colors(g,fn){const p=g.attributes.position,a=[];for(let i=0;i<p.count;i++){const c=fn(p.getX(i),p.getY(i),p.getZ(i),i);a.push(...c)}g.setAttribute('color',new THREE.Float32BufferAttribute(a,3));return g}
function terrain(size,segments,far=false){
 const g=new THREE.PlaneGeometry(size,size,segments,segments);g.rotateX(-Math.PI/2)
 const p=g.attributes.position
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i);
  let y=floorHeight(x,z)
  if(far)y-=1.8 // overlap under near field; no coplanar surfaces
  y+=smoothRidge(x,z)
  p.setY(i,y)
 }
 g.computeVertexNormals()
 colors(g,(x,y,z)=>{const rock=THREE.MathUtils.smoothstep(Math.abs(Math.sin(x*.08+z*.05)),.65,1);return [1-rock*.27,1-rock*.22,.91-rock*.19]})
 return g
}
function smoothRidge(x,z){const beyond=THREE.MathUtils.smoothstep(Math.hypot(x,z),38,90);return beyond*(9*Math.sin(x*.029+z*.017)+6*Math.sin(z*.041-x*.025))}
function material(hex,sway=0){return new THREE.ShaderMaterial({uniforms:{time:{value:0},sway:{value:sway},base:{value:new THREE.Color(hex)}},vertexShader:vertex,fragmentShader:fragment,vertexColors:true,side:sway?THREE.DoubleSide:THREE.FrontSide})}
function rockGeometry(){
 const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const r=1+.08*Math.sin(x*7+y*4)*Math.sin(z*5-y*3);p.setXYZ(i,x*r,y*r,z*r)}
 g.deleteAttribute('normal');g.deleteAttribute('uv');const smooth=mergeVertices(g);g.dispose();smooth.computeVertexNormals();return colors(smooth,(x,y,z)=>{const band=.88+.12*Math.sin(y*13+x*2+z);return [band,band,band]})
}
function blades(){
 const pieces=[]
 for(const angle of [0,Math.PI/2]){
  const g=new THREE.PlaneGeometry(.12,1,1,5);g.translate(0,.5,0)
  const p=g.attributes.position
  for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)*(1-y*.82)+Math.sin(y*2)*.12);p.setZ(i,y*y*.13)}
  g.rotateY(angle);pieces.push(g)
 }
 const g=mergeGeometries(pieces);pieces.forEach(p=>p.dispose());g.computeVertexNormals();return colors(g,(x,y)=>[.65+y*.35,.7+y*.3,.75+y*.25])
}
function fan(){
 const pieces=[]
 function branch(a,b,r){const v=new THREE.Vector3().subVectors(b,a);const g=new THREE.CylinderGeometry(r*.55,r,v.length(),5,1);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());pieces.push(g)}
 const zero=new THREE.Vector3()
 branch(zero,new THREE.Vector3(0,.95,0),.06)
 for(let i=0;i<7;i++){const side=i%2?1:-1,y=.22+i*.095;const a=new THREE.Vector3(0,y,0),b=new THREE.Vector3(side*(.25+(i%3)*.12),y+.35,.04*Math.sin(i));branch(a,b,.035);branch(b,b.clone().add(new THREE.Vector3(side*.08,.19,.015)),.021)}
 const g=mergeGeometries(pieces);pieces.forEach(p=>p.dispose());return colors(g,(x,y)=>[.8+y*.1,.8+y*.1,.9])
}export function createOceanEnvironment(scene){
 const root=new THREE.Group();root.name='no-air-environment';scene.add(root)
 const animated=[],mats=[];const rand=seeded();const transform=new THREE.Object3D()
 const mat=(hex,sway=0)=>{const m=material(hex,sway);mats.push(m);animated.push(m);return m}
 const sand=mat(0xa8c5ba),stone=mat(0x638b8e),green=mat(0x3c7969,1),coral=mat(0x9c929e,1)
 root.add(new THREE.Mesh(terrain(110,144),sand),new THREE.Mesh(terrain(900,96,true),stone))
 const rock=rockGeometry(),rocks=new THREE.InstancedMesh(rock,stone,72);root.add(rocks)
 const put=(mesh,i,x,y,z,sx,sy,sz,yaw=0)=>{transform.position.set(x,y,z);transform.rotation.set(0,yaw,0);transform.scale.set(sx,sy,sz);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix)}
 ROCKS.forEach(([x,z,sx,sy,sz],i)=>put(rocks,i,x,floorHeight(x,z)+sy*.28,z,sx,sy,sz,i*.8))
 for(let i=ROCKS.length;i<72;i++){
  const a=rand()*Math.PI*2,r=32+rand()*210,x=Math.cos(a)*r,z=Math.sin(a)*r-35;
  const s=4+rand()*13;put(rocks,i,x,floorHeight(x,z)+smoothRidge(x,z)+s*.3,z,s,s*(.8+rand()),s*.7,rand()*6)
 }
 rocks.computeBoundingSphere()
 // Natural arch just beyond the explorable shelf: a continuous rock silhouette.
 const archPath=new THREE.CatmullRomCurve3(Array.from({length:9},(_,i)=>{const a=i/8*Math.PI;return new THREE.Vector3(-29+Math.cos(a)*8,-11+Math.sin(a)*12,-25+Math.sin(a)*2)}))
 const archG=new THREE.TubeGeometry(archPath,24,1.8,7,false);colors(archG,()=>[.84,.91,.94]);root.add(new THREE.Mesh(archG,stone))
 const grass=new THREE.InstancedMesh(blades(),green,480);root.add(grass)
 for(let i=0;i<480;i++){
  const cluster=i%12,a=rand()*6.283,r=Math.sqrt(rand())*3.7;
  const cx=Math.sin(cluster*2.4)*16,cz=Math.cos(cluster*2.4)*13-2;
  const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,h=.35+rand()*1.25;
  put(grass,i,x,floorHeight(x,z)-.05,z,.7+rand(),h,.7+rand(),rand()*6.28)
 }
 grass.computeBoundingSphere();grass.boundingSphere.radius+=1
 const fans=new THREE.InstancedMesh(fan(),coral,56);root.add(fans)
 for(let i=0;i<56;i++){const x=(rand()-.5)*35,z=rand()*22-8;put(fans,i,x,floorHeight(x,z),z,.5+rand()*.9,.5+rand()*.8,1,rand()*6.28)}
 fans.computeBoundingSphere();fans.boundingSphere.radius+=1
 // Distant water gradient; real terrain extends hundreds of metres inside this backdrop.
 const sky=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;varying vec3 dir;void main(){vec3 d=normalize(dir);float up=smoothstep(-.6,.95,d.y);vec3 c=mix(vec3(.002,.016,.065),vec3(.035,.3,.56),up);float sun=pow(max(dot(d,normalize(vec3(-.32,.92,-.2))),0.),15.);float wave=sin(d.x*76.+sin(d.z*53.+time*.15))*sin(d.z*61.-time*.12);c+=vec3(.24,.34,.33)*sun*(.94+.06*wave);gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`})
 root.add(new THREE.Mesh(new THREE.SphereGeometry(620,32,16),sky));mats.push(sky);animated.push(sky)
 // The overhead surface is an angular light field, not a visible finite ceiling plane. // One merged draw, narrow soft shafts. No true volumetrics, no full-screen additive pass.
 const shaftParts=[]
 for(let i=0;i<7;i++){
  const g=new THREE.PlaneGeometry(3+i*.15,50,1,1);g.translate(0,-25,0);g.rotateZ(-.24);g.rotateY((i%3-.8)*.7);g.translate(-15+i*5,40,-18-(i%3)*15);shaftParts.push(g)
 }
 const shaftG=mergeGeometries(shaftParts);shaftParts.forEach(g=>g.dispose())
 const shaftMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;varying vec2 v;void main(){float across=pow(max(0.,sin(v.x*3.14159)),2.);float ends=sin(v.y*3.14159);float a=across*ends*.052*(.9+.1*sin(time*.17+v.y*3.));gl_FragColor=vec4(.3,.72,.83,a);
#include <colorspace_fragment>
}`})
 root.add(new THREE.Mesh(shaftG,shaftMat));animated.push(shaftMat);mats.push(shaftMat)
 const dots=new THREE.BufferGeometry(),pos=[]
 for(let i=0;i<340;i++)pos.push((rand()-.5)*58,rand()*30-18,(rand()-.5)*64-3)
 dots.setAttribute('position',new THREE.Float32BufferAttribute(pos,3))
 const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`uniform float time;varying float fade;void main(){vec3 p=position;p.x+=.22*sin(time*.11+p.z);p.y+=.12*sin(time*.09+p.x);vec4 mv=modelViewMatrix*vec4(p,1.);float d=length(mv.xyz);fade=smoothstep(.6,2.,d)*(1.-smoothstep(12.,32.,d));gl_PointSize=clamp(22./max(d,1.),1.,2.5);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float fade;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.4,.68,.74,(1.-smoothstep(.12,.5,d))*.2*fade);
#include <colorspace_fragment>
}`})
 root.add(new THREE.Points(dots,dustMat));animated.push(dustMat);mats.push(dustMat)
 let disposed=false
 return {root,update(seconds){if(!disposed)for(const m of animated)m.uniforms.time.value=seconds},
  stats(){let draws=0,triangles=0,instancedDraws=0,transparentDraws=0;const materials=new Set();root.traverse(o=>{if(o.isMesh||o.isPoints){draws++;materials.add(o.material);if(o.material.transparent)transparentDraws++;if(o.isInstancedMesh)instancedDraws++;if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1)}});return {draws,triangles,materials:materials.size,textures:0,textureBytes:0,lights:0,transparentDraws,instancedDraws,particles:340,grass:480,coral:56,rocks:72}},
  dispose(){disposed=true}, // Shared world lifecycle owns/disposes geometry/materials once.
 }
}
