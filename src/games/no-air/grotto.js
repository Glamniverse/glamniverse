import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { floorHeight } from './config.js'
import { resolveOceanStep } from './swimming.js'

// An enclosed vault beside the rear rock shelf, opening toward the swim area. No existing terrain is edited.
export const GROTTO=Object.freeze({x:-3.5,entranceZ:9.8,backZ:13.3,clearance:.28,thickness:.65})
export function grottoSection(t){return {z:GROTTO.entranceZ+(GROTTO.backZ-GROTTO.entranceZ)*t,width:1.5+.5*Math.sin(Math.PI*t),height:4.2+.4*Math.sin(Math.PI*t)}}
export function createGrottoGeometry(){
 const vertices=[],indices=[],rings=10,arches=16,layerSize=(rings+1)*(arches+1)
 for(let layer=0;layer<2;layer++)for(let j=0;j<=rings;j++){
  const t=j/rings,s=grottoSection(t),z=s.z+(layer&&j===rings?GROTTO.thickness:0)
  for(let i=0;i<=arches;i++){
   const a=i/arches*Math.PI,rough=(.13*Math.sin(i*1.8+j*1.3)+.075*Math.cos(j*2.4-i*.7))*Math.sin(a),x=GROTTO.x+(s.width+layer*GROTTO.thickness)*Math.cos(a)
   const y=floorHeight(x,z)-.85+(s.height+layer*(GROTTO.thickness+.65*Math.sin(Math.PI*t)))*Math.sin(a)+rough
   vertices.push(x,y,z+.14*Math.sin(a*3.1+j*.65)*Math.sin(a))
  }
 }
 const quad=(a,b,c,d,flip=false)=>indices.push(...(flip?[a,c,b,a,d,c]:[a,b,c,a,c,d]))
 for(let layer=0;layer<2;layer++)for(let j=0;j<rings;j++)for(let i=0;i<arches;i++){
  const a=layer*layerSize+j*(arches+1)+i;quad(a,a+1,a+arches+2,a+arches+1,layer===0)
 }
 // Thick entrance lip, buried foot seams, and a closed two-sided back wall.
 for(let i=0;i<arches;i++)quad(i,i+layerSize,i+1+layerSize,i+1)
 for(const i of [0,arches])for(let j=0;j<rings;j++){const a=j*(arches+1)+i;quad(a,a+arches+1,a+arches+1+layerSize,a+layerSize)}
 for(let layer=0;layer<2;layer++){
  const base=layer*layerSize+rings*(arches+1),z=vertices[base*3+2],c=vertices.length/3
  vertices.push(GROTTO.x,floorHeight(GROTTO.x,z)+.1,z+(layer?.15:.3))
  for(let i=0;i<arches;i++)indices.push(c,base+i+(layer?1:0),base+i+(layer?0:1))
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g
}

// Local two-sided triangle clearance, using the very same rock surface as rendering.
// No headset correction, stored velocity, new physics, or changes to ocean rules.
export function createGrottoCollision(geometry){
 const p=geometry.attributes.position,index=geometry.index,triangles=[]
 for(let i=0;i<index.count;i+=3)triangles.push(new THREE.Triangle(...[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(p,index.getX(i+k)))))
 const boxes=triangles.map(t=>new THREE.Box3().setFromPoints([t.a,t.b,t.c])),nearBoxes=boxes.map(b=>b.clone().expandByScalar(GROTTO.clearance))
 const bounds=geometry.boundingBox.clone().expandByScalar(.4),closest=new THREE.Vector3(),normal=new THREE.Vector3(),candidate=new THREE.Vector3(),current=new THREE.Vector3(),part=new THREE.Vector3(),projected=new THREE.Vector3(),ocean=new THREE.Vector3(),movement=new THREE.Vector3(),ray=new THREE.Ray(),hit=new THREE.Vector3(),end=new THREE.Vector3()
 function distance(point){let d=Infinity;for(const t of triangles){t.closestPointToPoint(point,closest);d=Math.min(d,point.distanceTo(closest))}return d}
 function crosses(a,b){movement.subVectors(b,a);const length=movement.length();if(length<1e-10)return false;ray.set(a,movement.multiplyScalar(1/length));for(let i=0;i<triangles.length;i++){const t=triangles[i],box=boxes[i];if(Math.max(a.x,b.x)<box.min.x||Math.min(a.x,b.x)>box.max.x||Math.max(a.y,b.y)<box.min.y||Math.min(a.y,b.y)>box.max.y||Math.max(a.z,b.z)<box.min.z||Math.min(a.z,b.z)>box.max.z)continue;if(ray.intersectTriangle(t.a,t.b,t.c,false,hit)&&hit.distanceTo(a)>1e-7&&hit.distanceTo(a)<length-1e-7)return true}return false}
 function safe(a,b){if(crosses(a,b))return false;for(let i=0;i<triangles.length;i++){if(!nearBoxes[i].containsPoint(b))continue;const t=triangles[i];t.closestPointToPoint(a,closest);const old=a.distanceTo(closest);t.closestPointToPoint(b,closest);if(b.distanceTo(closest)<Math.min(GROTTO.clearance,old)-1e-7)return false}return true}
 function resolve(position,delta,out){
  out.copy(delta);end.copy(position).add(delta)
  // Entirely outside this small box: exact original movement, zero triangle work.
  if(!bounds.containsPoint(position)&&!bounds.containsPoint(end)&&!newSegmentTouchesBounds(position,end))return out
  if(delta.lengthSq()<1e-16)return out
  current.copy(position);const steps=Math.max(1,Math.ceil(delta.length()/.06));part.copy(delta).multiplyScalar(1/steps)
  for(let s=0;s<steps;s++){
   candidate.copy(current).add(part)
   if(!safe(current,candidate)){
    projected.copy(part)
    for(let pass=0;pass<3;pass++)for(let i=0;i<triangles.length;i++){
     candidate.copy(current).add(projected);if(!nearBoxes[i].containsPoint(candidate))continue;const t=triangles[i];t.closestPointToPoint(current,closest);const old=current.distanceTo(closest);normal.subVectors(current,closest);t.closestPointToPoint(candidate,closest)
     if(candidate.distanceTo(closest)<Math.min(GROTTO.clearance,old)-1e-7&&normal.lengthSq()>1e-12){normal.normalize();const dot=projected.dot(normal);if(dot<0)projected.addScaledVector(normal,-dot)}
    }
    candidate.copy(current).add(projected)
    if(!safe(current,candidate))candidate.copy(current)
   }
   // Projection must also respect the untouched terrain/rock/outer-boundary resolver.
   projected.subVectors(candidate,current);resolveOceanStep(current,projected,ocean)
   if(safe(current,ocean))current.copy(ocean)
  }
  return out.subVectors(current,position)
 }
 function newSegmentTouchesBounds(a,b){movement.subVectors(b,a);const length=movement.length();if(!length)return false;ray.set(a,movement.multiplyScalar(1/length));return !!ray.intersectBox(bounds,hit)&&hit.distanceTo(a)<=length}
 return {resolve,distance,safe,bounds,triangles:triangles.length}
}
function rockMaterial(){return new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{},vertexShader:`varying vec3 w;varying vec3 n;void main(){w=(modelMatrix*vec4(position,1.)).xyz;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
 fragmentShader:`varying vec3 w;varying vec3 n;void main(){vec3 normal=normalize(n);if(!gl_FrontFacing)normal=-normal;float strata=sin(w.y*6.+sin(w.x*1.7+w.z)*1.8);float grain=sin(w.x*17.+w.z*13.)*sin(w.y*19.)*.09;float vein=pow(1.-abs(strata),6.);float light=.32+.68*abs(dot(normal,normalize(vec3(-.35,1.,.18))));vec3 c=mix(vec3(.035,.072,.095),vec3(.15,.22,.25),.5+.22*strata+grain)*light+vec3(.013,.023,.034)*vein;float sanctuary=exp(-distance(w,vec3(-3.5,-4.,12.2))*.5);c+=vec3(.025,.024,.09)*sanctuary;float haze=1.-exp(-max(0.,distance(w,cameraPosition)-4.)*.012);vec3 water=mix(vec3(.003,.04,.14),vec3(.012,.16,.34),clamp((w.y+32.)/68.,0.,1.));gl_FragColor=vec4(mix(c,water,haze),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`})}
export function createOceanGrotto(scene){
 const root=new THREE.Group();root.name='no-air-secret-grotto';scene.add(root)
 const geometry=createGrottoGeometry(),rock=new THREE.Mesh(geometry,rockMaterial());rock.name='grotto-solid-vault';root.add(rock)
 // One quiet mystery: a crescent of original branching, softly luminous coral.
 const parts=[]
 for(let branch=0;branch<3;branch++){
  const points=[new THREE.Vector3(0,0,0),new THREE.Vector3((branch-1)*.035,.16,.018),new THREE.Vector3((branch-1)*.11,.36+branch*.025,.04*Math.sin(branch*2)),new THREE.Vector3((branch-1)*.15,.48+branch*.04,.06*Math.sin(branch*2))]
  const stem=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),6,.018,5,false);parts.push(stem)
  const tip=new THREE.SphereGeometry(.026,5,3);tip.translate(...points[3].toArray());parts.push(tip)
 }
 const crystal=mergeGeometries(parts);for(const p of parts)p.dispose()
 const material=new THREE.MeshBasicMaterial({color:0x7190b6}),accents=new THREE.InstancedMesh(crystal,material,17),m=new THREE.Object3D()
 for(let i=0;i<17;i++){const a=.25+i/16*Math.PI*1.5,x=GROTTO.x+Math.cos(a)*.75,z=12.2+Math.sin(a)*.42,h=.75+.23*Math.sin(i*2.3);m.position.set(x,floorHeight(x,z)-.03,z);m.scale.set(.8,h,.8);m.rotation.set(.12*Math.sin(i),i*.9,.1*Math.cos(i));m.updateMatrix();accents.setMatrixAt(i,m.matrix)}
 accents.name='grotto-luminous-crescent';root.add(accents)
 const collision=createGrottoCollision(geometry)
 return {root,collision,stats:{draws:2,triangles:geometry.index.count/3+crystal.index.count/3*17,materials:2,textures:0,lights:0,transparentDraws:0,animatedElements:0},dispose(){}}
}
