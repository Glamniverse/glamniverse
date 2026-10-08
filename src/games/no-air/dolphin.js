import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Original Glamniverse model, authored in metres. +Z is the rostrum; flukes span X.
// No downloaded geometry, textures, skeleton or animation clips.
const sections = [
 [-1.58,.025,.035,-.035],[-1.42,.055,.065,-.025],[-1.18,.085,.105,-.01],
 [-.9,.135,.17,0],[-.55,.21,.245,.012],[-.15,.285,.315,.015],
 [.25,.31,.335,.018],[.55,.28,.30,.025],[.79,.235,.255,.035],
 [.98,.185,.225,.045],[1.10,.135,.175,.025],[1.18,.09,.093,-.042],
 [1.28,.073,.061,-.075],[1.48,.056,.043,-.08],[1.60,.014,.024,-.079],
 [1.615,.001,.001,-.079],
]
function colour(g,hex){const c=new THREE.Color(hex),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g}
// Smooth longitudinal Hermite interpolation, with separately authored width/height/melon.
function profile(z,column){let i=0;while(i<sections.length-2&&z>sections[i+1][0])i++;const a=sections[i],b=sections[i+1],prev=sections[Math.max(0,i-1)],next=sections[Math.min(sections.length-1,i+2)],h=b[0]-a[0],t=(z-a[0])/h;const m0=(b[column]-prev[column])/(b[0]-prev[0]),m1=(next[column]-a[column])/(next[0]-a[0]);return (2*t**3-3*t*t+1)*a[column]+(t**3-2*t*t+t)*h*m0+(-2*t**3+3*t*t)*b[column]+(t**3-t*t)*h*m1}
function body(){const p=[],idx=[],c=[],dark=new THREE.Color(0x567687),light=new THREE.Color(0xb2c7ca),rings=80,sides=32;
 for(let j=0;j<=rings;j++){const z=sections[0][0]+(sections.at(-1)[0]-sections[0][0])*j/rings,w=Math.max(.001,profile(z,1)),h=Math.max(.001,profile(z,2)),cy=profile(z,3);
  for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2,x=Math.cos(a)*w,y=Math.sin(a)*h;p.push(x,y+cy,z);const t=THREE.MathUtils.smoothstep(Math.sin(a),-.65,.4),tint=light.clone().lerp(dark,t);c.push(tint.r,tint.g,tint.b);if(j<rings&&k<sides){const n=j*(sides+1)+k;idx.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1)}}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();return g
}
// A tapered, swept solid foil. Each station is [x,y,z,chord,thickness].
function foil(controls,axis,hex){const stations=[];
 for(let j=0;j<=12;j++){const u=j/12*(controls.length-1),i=Math.min(controls.length-2,Math.floor(u)),t=u-i,a=controls[Math.max(0,i-1)],b=controls[i],c=controls[i+1],d=controls[Math.min(controls.length-1,i+2)];stations.push(b.map((v,k)=>{const value=.5*((2*v)+(-a[k]+c[k])*t+(2*a[k]-5*v+4*c[k]-d[k])*t*t+(-a[k]+3*v-3*c[k]+d[k])*t*t*t);return k>=3?Math.max(.001,value):value}))}
 const p=[],idx=[],sides=12;for(let j=0;j<stations.length;j++){const [x,y,z,chord,thickness]=stations[j];for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2;p.push(x+(axis==='vertical'?Math.sin(a)*thickness:0),y+(axis==='horizontal'?Math.sin(a)*thickness:0),z+Math.cos(a)*chord);if(j<stations.length-1&&k<sides){const n=j*(sides+1)+k;idx.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1)}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return colour(g,hex)}
export function createDolphinGeometry(){const pieces=[body(),foil([[0,.20,-.13,.28,.065],[0,.34,-.18,.255,.048],[0,.48,-.24,.18,.033],[0,.64,-.36,.095,.018],[0,.74,-.46,.012,.002]],'vertical',0x547485)];
 for(const side of [-1,1]){
  pieces.push(foil([[side*.20,-.12,.55,.20,.05],[side*.35,-.19,.44,.18,.04],[side*.53,-.28,.26,.13,.027],[side*.70,-.34,.045,.075,.018],[side*.80,-.35,-.07,.006,.002]],'horizontal',0x718e9b));
  pieces.push(foil([[0,-.035,-1.50,.095,.025],[side*.15,-.033,-1.58,.19,.033],[side*.33,-.022,-1.65,.20,.026],[side*.51,0,-1.73,.14,.017],[side*.65,.018,-1.83,.005,.002]],'horizontal',0x668391));
  const eye=new THREE.SphereGeometry(.016,12,8);eye.scale(.45,1,1);eye.translate(side*.194,.037,.975);pieces.push(colour(eye,0x122933));
  const points=Array.from({length:9},(_,i)=>{const z=1.01+i*.065;return new THREE.Vector3(side*(Math.max(.001,profile(z,1))*.94),-.085-.009*Math.sin(i/8*Math.PI),z)});
  pieces.push(colour(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.003,4,false),0x405966));
 }
 const blowhole=new THREE.SphereGeometry(.019,10,6);blowhole.scale(1,.1,1.8);blowhole.translate(0,.270,.955);pieces.push(colour(blowhole,0x3b5664));
 for(const g of pieces)g.deleteAttribute('uv');const flat=pieces.map(g=>g.toNonIndexed()),g=mergeGeometries(flat);for(const p of [...pieces,...flat])p.dispose();g.computeBoundingSphere();g.boundingSphere.radius+=.3;return g
}
// The head remains stable; increasing caudal displacement supplies vertical propulsion.
export function dolphinFlex(z,time){const b=THREE.MathUtils.clamp((.35-z)/1.95,0,1);return .18*b*b*Math.sin(time*3.8+b*1.15)}
const vertex=`uniform float time;varying vec3 world;varying vec3 norm;varying vec3 tint;
void main(){vec3 p=position;float b=clamp((.35-p.z)/1.95,0.,1.);float phase=time*3.8+b*1.15;float flex=.18*b*b*sin(phase);float derivative=(p.z<.35&&p.z> -1.6)?-.18/1.95*(2.*b*sin(phase)+1.15*b*b*cos(phase)):0.;p.y+=flex;vec3 n=normal;n.z-=derivative*n.y;float fin=smoothstep(.25,.8,abs(p.x))*smoothstep(-.6,.1,p.z);p.y+=.018*fin*sin(time*1.9+p.z);vec4 w=modelMatrix*vec4(p,1.);world=w.xyz;norm=normalize(mat3(modelMatrix)*n);tint=color;gl_Position=projectionMatrix*viewMatrix*w;}`
const fragment=`varying vec3 world;varying vec3 norm;varying vec3 tint;
void main(){vec3 n=normalize(norm);if(!gl_FrontFacing)n=-n;vec3 sun=normalize(vec3(-.35,1.,.18));float diffuse=.52+.48*max(dot(n,sun),0.);vec3 halfLight=normalize(sun+normalize(cameraPosition-world));float sheen=pow(max(dot(n,halfLight),0.),35.)*.14;vec3 c=tint*diffuse+vec3(.7,.9,1.)*sheen;float haze=1.-exp(-max(0.,distance(cameraPosition,world)-4.)*.012);vec3 water=mix(vec3(.003,.04,.14),vec3(.012,.16,.34),clamp((world.y+32.)/68.,0.,1.));gl_FragColor=vec4(mix(c,water,haze),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
export const DOLPHIN_CYCLE=190
const route=new THREE.CatmullRomCurve3([
 new THREE.Vector3(-12,-9,-46),new THREE.Vector3(-5,-6,-29),new THREE.Vector3(1,-2,-12),
 new THREE.Vector3(4,0,2),new THREE.Vector3(7,1,1),new THREE.Vector3(7,-5,-19),
 new THREE.Vector3(10,-10,-43),new THREE.Vector3(0,-12,-62),new THREE.Vector3(-19,-10,-60),
],true,'centripetal');route.arcLengthDivisions=600;route.updateArcLengths()
export function sampleDolphinRoute(seconds,target){return route.getPointAt(((seconds/DOLPHIN_CYCLE)%1+1)%1,target)}
export function dolphinPhase(seconds){const t=((seconds%DOLPHIN_CYCLE)+DOLPHIN_CYCLE)%DOLPHIN_CYCLE;return t<40?'distant-travel':t<75?'scenic-pass':t<94?'curious':t<130?'departure':'distant-roaming'}
export function createOceanDolphin(scene){const geometry=createDolphinGeometry(),material=new THREE.ShaderMaterial({vertexColors:true,side:THREE.DoubleSide,uniforms:{time:{value:0}},vertexShader:vertex,fragmentShader:fragment});const mesh=new THREE.Mesh(geometry,material);mesh.name='no-air-hero-dolphin';scene.add(mesh);
 const velocity=new THREE.Vector3(),target=new THREE.Vector3(),desired=new THREE.Vector3(),change=new THREE.Vector3(),away=new THREE.Vector3(),direction=new THREE.Vector3(),forward=new THREE.Vector3(0,0,1),q=new THREE.Quaternion(),bankQ=new THREE.Quaternion();let elapsed=0,disposed=false,bank=0;
 sampleDolphinRoute(0,mesh.position);sampleDolphinRoute(1,target);q.setFromUnitVectors(forward,direction.subVectors(target,mesh.position).normalize());mesh.quaternion.copy(q);
 function update(dt,head){if(disposed||!Number.isFinite(dt)||dt<=0||dt>.1)return;elapsed+=dt;material.uniforms.time.value=elapsed;sampleDolphinRoute(elapsed+2,target);
  const validHead=head&&Number.isFinite(head.x+head.y+head.z);if(validHead){
   away.subVectors(target,head);const distance=away.length();if(distance<7){if(distance<.001)away.set(1,0,0);else away.divideScalar(distance);target.copy(head).addScaledVector(away,7)}
   // A restrained acknowledgement only during the outgoing pass, never a follow mode.
   else if(dolphinPhase(elapsed)==='curious'&&distance<15){const envelope=Math.sin((elapsed% DOLPHIN_CYCLE-75)/19*Math.PI);target.addScaledVector(away,-.045*Math.max(0,envelope))}
  }
  desired.subVectors(target,mesh.position).multiplyScalar(.6).clampLength(0,1.25);
  if(validHead){away.subVectors(mesh.position,head);const d=away.length();if(d<8&&d>.001){away.divideScalar(d);const inward=desired.dot(away);if(inward<0)desired.addScaledVector(away,-inward*(1-THREE.MathUtils.smoothstep(d,4.5,8)));desired.addScaledVector(away,.9*(1-THREE.MathUtils.smoothstep(d,3.5,7)));desired.clampLength(0,1.25)}}
  change.subVectors(desired,velocity).clampLength(0,.55*dt);velocity.add(change);mesh.position.addScaledVector(velocity,dt);
  if(velocity.lengthSq()>.0025){direction.copy(velocity).normalize();
   away.copy(forward).applyQuaternion(mesh.quaternion);const turn=away.z*direction.x-away.x*direction.z;const targetBank=THREE.MathUtils.clamp(-turn*1.3,-.22,.22);bank+=(targetBank-bank)*(1-Math.exp(-dt*1.8));q.setFromUnitVectors(forward,direction);bankQ.setFromAxisAngle(forward,bank);q.multiply(bankQ);mesh.quaternion.rotateTowards(q,.5*dt)}
 }
 return {mesh,update,get state(){return dolphinPhase(elapsed)},get elapsed(){return elapsed},stats:{count:1,draws:1,triangles:geometry.attributes.position.count/3,materials:1,textures:0,lights:0,transparentDraws:0},dispose(){disposed=true;velocity.set(0,0,0)}}
}
