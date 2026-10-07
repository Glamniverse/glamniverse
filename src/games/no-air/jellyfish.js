import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'

export const JELLY_ANCHORS = Object.freeze([[8,-5,-16],[-8,-7,-21],[2,-10,-27]])
export function createOceanJellyfish(scene){
 const pieces=[],bell=new THREE.SphereGeometry(.36,16,8,0,Math.PI*2,0,Math.PI/2);bell.scale(1,.7,1);pieces.push(bell)
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,r=.19+(i%2)*.07,length=.9+(i%3)*.19
  const path=new THREE.CatmullRomCurve3(Array.from({length:5},(_,j)=>new THREE.Vector3(Math.cos(a)*r+Math.sin(j*.9+i)*.035,-j/4*length,Math.sin(a)*r)))
  pieces.push(new THREE.TubeGeometry(path,8,.012,4,false))
 }
 for(const g of pieces)g.deleteAttribute('uv')
 const expanded=pieces.map(g=>g.toNonIndexed()),geometry=mergeGeometries(expanded)
 for(const g of [...pieces,...expanded])g.dispose()
 geometry.setAttribute('jellyPhase',new THREE.InstancedBufferAttribute(new Float32Array([.2,2.4,4.7]),1))
 geometry.setAttribute('jellyTint',new THREE.InstancedBufferAttribute(new Float32Array([.57,.81,.88,.65,.73,.87,.48,.77,.83]),3))
 const material=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{time:{value:0}},
 vertexShader:`uniform float time;attribute float jellyPhase;attribute vec3 jellyTint;varying vec3 world;varying vec3 tint;varying vec3 norm;
 void main(){vec3 p=position;float pulse=sin(time*1.3+jellyPhase);if(p.y>=0.){p.xz*=1.+.065*pulse;p.y*=1.-.09*pulse;}else{float trailing=clamp(-p.y/1.4,0.,1.);p.x+=trailing*.09*sin(time*.65+jellyPhase+p.y*2.);p.z+=trailing*.06*cos(time*.51+jellyPhase+p.y*2.3);}vec4 w=modelMatrix*instanceMatrix*vec4(p,1.);world=w.xyz;tint=jellyTint;norm=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`varying vec3 world;varying vec3 tint;varying vec3 norm;
 void main(){vec3 n=normalize(norm);if(!gl_FrontFacing)n=-n;float light=.58+.42*max(dot(n,normalize(vec3(-.35,1.,.18))),0.);vec3 c=tint*light;float haze=1.-exp(-max(0.,distance(cameraPosition,world)-4.)*.012);vec3 water=mix(vec3(.003,.04,.14),vec3(.012,.16,.34),clamp((world.y+32.)/68.,0.,1.));gl_FragColor=vec4(mix(c,water,haze),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`})
 const mesh=new THREE.InstancedMesh(geometry,material,3);mesh.name='no-air-three-jellyfish';mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh)
 const transform=new THREE.Object3D();let disposed=false
 function update(time){if(disposed||!Number.isFinite(time))return;material.uniforms.time.value=time
  for(let i=0;i<3;i++){const a=JELLY_ANCHORS[i],phase=i*2.2,speed=.09+i*.012;transform.position.set(a[0]+.7*Math.sin(time*speed+phase),a[1]+.85*Math.sin(time*(speed*.8)+phase),a[2]+.5*Math.cos(time*speed*.7+phase));transform.rotation.set(.025*Math.sin(time*.2+phase),phase+.07*Math.sin(time*.12+phase),.04*Math.cos(time*.18+phase));transform.scale.setScalar(.9+i*.12);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix)}
  mesh.instanceMatrix.needsUpdate=true
 }
 update(0);mesh.computeBoundingSphere();mesh.boundingSphere.radius+=2
 return {mesh,update,stats:{count:3,draws:1,triangles:geometry.attributes.position.count,materials:1,textures:0,lights:0,transparentDraws:0},dispose(){disposed=true}} // Shared scene lifecycle owns GPU disposal.
}
