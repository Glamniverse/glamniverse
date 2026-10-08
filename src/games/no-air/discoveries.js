import * as THREE from 'three'
import {floorHeight} from './config.js'

export const DISCOVERY_KEY='glamniverse.no-air.discoveries.v1'
// Five accessible, six sheltered, five shelf/drop-off and four deeper discoveries.
const sites=[[-2,5],[3,4],[-4,1],[1,0],[0,11],[6,3],[-7,5],[-7,-2],[7,-3],[-9,6.8],[5,-6],[-5,-10],[3,-12],[9,-14],[-9,-15],[0,-19],[-9,-18],[11,-17],[-7,-20],[4,-20]]
const pearls=new Set([1,4,7,10,13,16,19])
const palette=[0xe9dfcc,0xeedbdd,0xaecdd0,0xccb9d7,0xd9b697,0xbed3e5,0xe6e5dc,0xd6b9b2]
export const SHELLS=Object.freeze(sites.map(([x,z],i)=>Object.freeze({id:`shell-${String(i+1).padStart(2,'0')}`,x,z,pearl:pearls.has(i),family:i%3,scale:.45+(i%5)*.045,yaw:(i*2.399)% (Math.PI*2),ridges:9+(i%5)*2,tint:palette[i%palette.length]})))
export function createDiscoveries(storage){const ids=new Set(),valid=new Set(SHELLS.map(s=>s.id));let backend=storage;
 try{if(backend===undefined)backend=globalThis.localStorage;const saved=JSON.parse(backend?.getItem(DISCOVERY_KEY)||'null');if(saved?.version===1&&Array.isArray(saved.ids))for(const id of saved.ids)if(valid.has(id))ids.add(id)}catch{}
 return {has:id=>ids.has(id),get shells(){return ids.size},get pearls(){let n=0;for(const s of SHELLS)if(s.pearl&&ids.has(s.id))n++;return n},get complete(){return ids.size===20},collect(id){if(!valid.has(id)||ids.has(id))return false;ids.add(id);try{backend?.setItem(DISCOVERY_KEY,JSON.stringify({version:1,ids:[...ids].sort()}))}catch{}return true}}
}
// Three genuinely different solid cap silhouettes; upper/lower surfaces share a draw.
function shellGeometry(family){const positions=[],normals=[],uvs=[],upper=[],index=[],radial=6,around=24;
 for(let side=0;side<2;side++)for(let r=0;r<=radial;r++)for(let a=0;a<=around;a++){
  const t=r/radial,angle=a/around*Math.PI*2;let x,z,y;
  if(family===2){const warp=1+.13*Math.cos(angle*3+t*3);x=Math.cos(angle)*t*.25*warp;z=.23+Math.sin(angle)*t*.27; y=.035+Math.pow(1-t,1.3)*.22+.012*Math.sin(angle*3-t*18)*Math.sin(Math.PI*t)}
  else{const theta=(a/around-.5)*(family===0?2.85:2.1),width=family===0?.32:.26;x=Math.sin(theta)*t*width;z=Math.cos(theta)*t*(family===0?.36:.46);y=.022+Math.sin(Math.PI*t)*(.10+(family===0?.03:0))}
  if(!side)y=-.018-Math.sin(Math.PI*t)*.022;
  positions.push(x,y,z);uvs.push(angle,t);upper.push(side);normals.push(0,side?1:-1,0);
  if(r<radial&&a<around){const n=side*(radial+1)*(around+1)+r*(around+1)+a;if(side)index.push(n,n+around+1,n+1,n+1,n+around+1,n+around+2);else index.push(n,n+1,n+around+1,n+1,n+around+2,n+around+1)}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('upper',new THREE.Float32BufferAttribute(upper,1));g.setAttribute('shellFamily',new THREE.Float32BufferAttribute(upper.map(()=>family),1));g.setIndex(index);g.computeVertexNormals();return g
}
const vertex=`attribute float upper;attribute float shellFamily;varying vec2 surface;varying float ribs;varying float cap;varying float family;attribute vec3 shellData;attribute vec3 shellTint;varying vec3 world;varying vec3 tint;varying vec3 norm;varying float shine;
void main(){vec3 p=position;float age=shellData.x;float open=smoothstep(0.,.55,age);float phase=shellFamily>1.5?uv.x-uv.y*17.5:uv.x*shellData.z;p.y+=upper*.014*cos(phase)*sin(uv.y*3.14159);surface=uv;ribs=shellData.z;cap=upper;family=shellFamily;float angle=-.8*open*upper;float c=cos(angle),s=sin(angle);mat3 turn=mat3(1.,0.,0.,0.,c,s,0.,-s,c);p=turn*p;vec4 w=modelMatrix*instanceMatrix*vec4(p,1.);world=w.xyz;norm=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*turn*normal);tint=shellTint;shine=shellData.y*.10+sin(clamp(age/1.5,0.,1.)*3.14159)*.12;gl_Position=projectionMatrix*viewMatrix*w;}`
const fragment=`varying vec2 surface;varying float ribs;varying float cap;varying float family;varying vec3 world;varying vec3 tint;varying vec3 norm;varying float shine;
void main(){vec3 n=normalize(norm);if(!gl_FrontFacing)n=-n;vec3 sun=normalize(vec3(-.35,1.,.18));float light=.62+.38*max(dot(n,sun),0.);float sheen=pow(max(dot(n,normalize(sun+normalize(cameraPosition-world))),0.),24.)*.12;float phase=family>1.5?surface.x-surface.y*17.5:surface.x*ribs;float ridge=mix(.5,pow(.5+.5*cos(phase),3.),1.-smoothstep(.5,2.,fwidth(phase)));float relief=mix(1.,.76+.24*ridge,cap*smoothstep(0.,.15,surface.y));vec3 c=tint*light*relief+vec3(.55,.78,.9)*(sheen+shine);float haze=1.-exp(-max(0.,distance(cameraPosition,world)-4.)*.012);vec3 water=mix(vec3(.003,.04,.14),vec3(.012,.16,.34),clamp((world.y+32.)/68.,0.,1.));gl_FragColor=vec4(mix(c,water,haze),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
export function createOceanDiscoveries(scene,progress=createDiscoveries()){
 const root=new THREE.Group();root.name='no-air-discoveries';scene.add(root);const mat=new THREE.ShaderMaterial({side:THREE.DoubleSide,vertexShader:vertex,fragmentShader:fragment}),transform=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),normal=new THREE.Vector3(),yaw=new THREE.Quaternion(),ray=new THREE.Raycaster(),ground=scene.getObjectByName('no-air-environment')?.children[0],solids=scene.getObjectByName('no-air-environment')?.children.slice(0,4)||[],hits=[];
 const entries=[],batches=[];
 for(let f=0;f<3;f++){const specs=SHELLS.filter(s=>s.family===f),g=shellGeometry(f),data=new THREE.InstancedBufferAttribute(new Float32Array(specs.length*3),3),tints=new THREE.InstancedBufferAttribute(new Float32Array(specs.length*3),3);g.setAttribute('shellData',data);g.setAttribute('shellTint',tints);const mesh=new THREE.InstancedMesh(g,mat,specs.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.name=`no-air-shell-family-${f}`;root.add(mesh);batches.push(mesh);
  specs.forEach((spec,i)=>{let y=floorHeight(spec.x,spec.z);normal.set(-(floorHeight(spec.x+.05,spec.z)-floorHeight(spec.x-.05,spec.z))/.1,1,-(floorHeight(spec.x,spec.z+.05)-floorHeight(spec.x,spec.z-.05))/.1).normalize();
   if(ground){ground.updateWorldMatrix(true,false);ray.set(new THREE.Vector3(spec.x,20,spec.z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(ground,false)[0];if(hit){y=hit.point.y;normal.copy(hit.face.normal)}}
   transform.position.set(spec.x,y+.035,spec.z);transform.quaternion.setFromUnitVectors(up,normal);yaw.setFromAxisAngle(up,spec.yaw);transform.quaternion.multiply(yaw);transform.scale.setScalar(progress.has(spec.id)?0:spec.scale);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);const tint=new THREE.Color(spec.tint);tints.setXYZ(i,tint.r,tint.g,tint.b);data.setXYZ(i,0,0,spec.ridges);
   const centre=new THREE.Vector3(0,.08,.20).applyQuaternion(transform.quaternion).multiplyScalar(spec.scale).add(transform.position);entries.push({spec,mesh,index:i,position:transform.position.clone(),rotation:transform.quaternion.clone(),centre,age:progress.has(spec.id)?2:-1})
  });mesh.computeBoundingSphere();mesh.boundingSphere.radius+=1;
 }
 const pearlGeometry=new THREE.SphereGeometry(.065,12,8),pearlMat=new THREE.ShaderMaterial({vertexShader:`varying vec3 n;varying vec3 w;void main(){vec4 p=modelMatrix*instanceMatrix*vec4(position,1.);w=p.xyz;n=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*p;}`,fragmentShader:`varying vec3 n;varying vec3 w;void main(){float rim=1.-abs(dot(normalize(n),normalize(cameraPosition-w)));vec3 c=mix(vec3(.8,.88,.85),vec3(.57,.67,.86),rim*.65);c*=.7+.3*max(normalize(n).y,0.);gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});const pearlMesh=new THREE.InstancedMesh(pearlGeometry,pearlMat,7);pearlMesh.name='no-air-pearl-reveals';pearlMesh.frustumCulled=false;root.add(pearlMesh);transform.scale.setScalar(0);transform.updateMatrix();for(let i=0;i<7;i++)pearlMesh.setMatrixAt(i,transform.matrix);pearlMesh.visible=false;
 let disposed=false,hover=null;const held=[null,null],sources=[null,null],delta=new THREE.Vector3(),rotation=new THREE.Quaternion();
 function resetInput(){held.fill(null);sources.fill(null);hover=null}
 function pick(o,d){let best=null,nearest=2.6;for(const e of entries){if(progress.has(e.spec.id))continue;delta.subVectors(e.centre,o);const along=delta.dot(d);if(along<0||along>nearest)continue;const tolerance=.25;if(delta.lengthSq()-along*along<tolerance*tolerance){nearest=along;best=e}}return best}
 function collect(e){if(disposed||!e||!progress.collect(e.spec.id))return false;e.age=0;return true}
 function input(samples,enabled){if(disposed)return;hover=null;for(let i=0;i<2;i++){const s=samples?.[i];if(!enabled||!s?.valid){held[i]=null;sources[i]=null;continue}if(sources[i]!==s.source){sources[i]=s.source;held[i]=null}const edge=held[i]===false&&s.pressed;held[i]=s.pressed;const e=pick(s.origin,s.direction);if(e)hover=e;if(edge&&e){ray.set(s.origin,s.direction);ray.far=s.origin.distanceTo(e.centre);hits.length=0;ray.intersectObjects(solids,false,hits);if(!hits.length||hits[0].distance>=ray.far-.20)collect(e)}}}
 const samples=Array.from({length:2},()=>({valid:false,source:null,origin:new THREE.Vector3(),direction:new THREE.Vector3(),pressed:false}));
 function updateXR(state,frame,reference,enabled){for(let i=0;i<2;i++){const sample=samples[i],entry=state.interaction?.controllers?.[i],source=entry?.source;sample.valid=false;if(!enabled||!entry?.connected||source?.gamepad?.mapping!=='xr-standard'||!source.targetRaySpace)continue;const pose=frame.getPose(source.targetRaySpace,reference);if(!pose||pose.emulatedPosition)continue;const p=pose.transform.position,q=pose.transform.orientation;sample.origin.set(p.x,p.y,p.z).applyMatrix4(state.origin.matrixWorld);rotation.set(q.x,q.y,q.z,q.w).premultiply(state.origin.quaternion);sample.direction.set(0,0,-1).applyQuaternion(rotation).normalize();sample.pressed=source.gamepad.buttons?.[0]?.pressed===true;sample.source=source;sample.valid=true}input(samples,enabled)}
 function update(dt){if(disposed)return;const step=Number.isFinite(dt)&&dt>0&&dt<=.1?dt:0;let pearl=0,any=false;
  for(const e of entries){const {spec,mesh,index}=e;if(e.age>=0&&e.age<2)e.age=Math.min(2,e.age+step);const shrinking=1-THREE.MathUtils.smoothstep(e.age,1.25,2);transform.position.copy(e.position);transform.quaternion.copy(e.rotation);transform.scale.setScalar(spec.scale*(e.age<0?1:shrinking));transform.updateMatrix();mesh.setMatrixAt(index,transform.matrix);mesh.geometry.attributes.shellData.setXYZ(index,Math.max(0,e.age),hover===e?1:0,spec.ridges);
   if(spec.pearl){const visible=e.age>.18&&e.age<2;any ||=visible;transform.position.copy(e.centre);transform.position.y+=.12+Math.max(0,e.age)*.08;transform.quaternion.identity();transform.scale.setScalar(visible?Math.min(1,(e.age-.18)*4)*shrinking:0);transform.updateMatrix();pearlMesh.setMatrixAt(pearl++,transform.matrix)}
  }for(const m of batches){m.instanceMatrix.needsUpdate=true;m.geometry.attributes.shellData.needsUpdate=true}pearlMesh.visible=any;pearlMesh.instanceMatrix.needsUpdate=true;
 }
 return {root,entries,progress,input,updateXR,update,resetInput,stats:{shells:20,pearls:7,draws:3,revealDraws:1,materials:2,textures:0,lights:0,triangles:batches.reduce((n,m)=>n+m.geometry.index.count/3*m.count,0),pearlTriangles:pearlGeometry.index.count/3*7},dispose(){disposed=true;resetInput()}}
}
