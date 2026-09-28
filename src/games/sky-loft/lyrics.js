import * as THREE from 'three'
import {LYRIC_LIMITS as L,LYRIC_PRESETS,validateLyricData,fillActiveEvents} from './lyric-presets.js'

// One atlas per loaded song. Browser serif font, rasterized once; no font download.
// Tight UV crops keep short hero words large without stretching the typeface.
export function createLyricAtlas(data){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=L.atlasSize
  const ctx=canvas.getContext('2d'),entries=new Map()
  ctx.clearRect(0,0,canvas.width,canvas.height)
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round'
  let i=0
  for(const text of new Set(data.events.map(e=>e.text))){
    const displayText=data.events.some(e=>e.text===text&&LYRIC_PRESETS[e.preset].uppercase)?text.toUpperCase():text
    const x=(i%2)*L.cellWidth,y=Math.floor(i/2)*L.cellHeight;i++
    ctx.font='64px serif'
    const font=Math.min(64,64*(L.cellWidth-40)/Math.max(1,ctx.measureText(displayText).width))
    ctx.font=font+'px serif'
    const width=Math.min(L.cellWidth-8,Math.ceil(ctx.measureText(displayText).width)+24)
    ctx.strokeStyle='#171322';ctx.lineWidth=3;ctx.strokeText(displayText,x+L.cellWidth/2,y+L.cellHeight/2)
    ctx.fillStyle='#ffffff';ctx.fillText(displayText,x+L.cellWidth/2,y+L.cellHeight/2)
    entries.set(text,{u:(x+(L.cellWidth-width)/2)/L.atlasSize,v:1-(y+L.cellHeight)/L.atlasSize,w:width/L.atlasSize,h:L.cellHeight/L.atlasSize,aspect:width/L.cellHeight})
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace
  texture.anisotropy=1
  return {texture,entries,dispose:()=>texture.dispose()}
}

export function createSpatialLyrics(parent,{load=(url,signal)=>fetch(url,{signal}).then(r=>{if(!r.ok)throw Error('Lyrics unavailable');return r.json()}),atlasFactory=createLyricAtlas}={}){
  const group=new THREE.Group();group.name='SkyLoft_SpatialLyrics';parent.add(group)
  const slots=Array.from({length:L.maxActive},()=>{
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false}))
    mesh.visible=false;group.add(mesh)
    return {mesh,index:-1,anchor:new THREE.Vector3(),direction:new THREE.Vector3(),preset:null}
  })
  let enabled=true,disposed=false,song=null,data=null,atlas=null,version=0,status='unavailable',controller=null
  let occluder=null
  const menuBox=new THREE.Box3(),corner=new THREE.Vector3()
  const active=[],localHead=new THREE.Vector3(),localForward=new THREE.Vector3(),inverse=new THREE.Quaternion()
  function clear(){for(const s of slots){s.index=-1;s.mesh.visible=false}}
  function releaseData(){clear();for(const s of slots)s.mesh.material.map=null;atlas?.dispose();atlas=null;data=null}
  function prepare(reality){
    if(disposed)return
    if(!reality.lyrics){clear();return} // Keep the one cached atlas across non-lyric realities.
    if(song===reality.id&&status!=='error')return
    version++;controller?.abort();releaseData();song=reality.id;status=reality.lyrics?'loading':'unavailable'
    if(!reality.lyrics)return
    const attempt=version,request=new AbortController();controller=request
    Promise.resolve().then(()=>load(reality.lyrics,request.signal)).then(result=>{
      if(disposed||attempt!==version)return
      data=validateLyricData(result,reality.id);atlas=atlasFactory(data)
      for(const s of slots){s.mesh.material.map=atlas.texture;s.mesh.material.needsUpdate=true}
      status='ready'
    }).catch(()=>{if(!disposed&&attempt===version){releaseData();status='error'}})
  }
  function place(s,index,head,forward){
    const event=data.events[index],p=LYRIC_PRESETS[event.preset],entry=atlas.entries.get(event.text)
    s.index=index;s.preset=p
    // Constrain facing to the open front of the loft, never behind a wall or through the sofa.
    localHead.copy(head);parent.worldToLocal(localHead)
    parent.getWorldQuaternion(inverse).invert();localForward.copy(forward).applyQuaternion(inverse)
    const yaw=Math.max(-Math.PI/4,Math.min(Math.PI/4,Math.atan2(-localForward.x,-localForward.z)))
    s.direction.set(-Math.sin(yaw),0,-Math.cos(yaw))
    s.anchor.copy(localHead).addScaledVector(s.direction,p.distance)
    s.anchor.x+=Math.cos(yaw)*p.side*p.distance;s.anchor.z-=Math.sin(yaw)*p.side*p.distance
    s.anchor.z=Math.min(-10,s.anchor.z);s.anchor.y=Math.max(3.8,localHead.y+p.height)
    const textHeight=p.width/entry.aspect
    const dx=s.anchor.x-localHead.x,dz=s.anchor.z-localHead.z
    const depth=dx*s.direction.x+dz*s.direction.z
    const centre=(dx*Math.cos(yaw)-dz*Math.sin(yaw))/depth,half=p.width*.5/depth
    // Compare projected slopes at event creation only. Lift text above the selector
    // when it would be hidden, then above any overlapping live phrase. No HUD tracking.
    if(occluder){
      menuBox.setFromObject(occluder)
      let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity
      for(let i=0;i<8;i++){
        corner.set(i&1?menuBox.max.x:menuBox.min.x,i&2?menuBox.max.y:menuBox.min.y,i&4?menuBox.max.z:menuBox.min.z)
        parent.worldToLocal(corner);corner.sub(localHead)
        const d=corner.x*s.direction.x+corner.z*s.direction.z
        if(d<=.1)continue
        const x=(corner.x*Math.cos(yaw)-corner.z*Math.sin(yaw))/d,y=corner.y/d
        left=Math.min(left,x);right=Math.max(right,x);top=Math.max(top,y);bottom=Math.min(bottom,y)
      }
      const low=(s.anchor.y-localHead.y-textHeight*.5)/depth,high=(s.anchor.y-localHead.y+textHeight*.5)/depth
      if(centre+half>left&&centre-half<right&&low<top+.04&&high>bottom)
        s.anchor.y=Math.max(s.anchor.y,localHead.y+(top+.04)*depth+textHeight*.5)
    }
    for(const other of slots){
      if(other===s||other.index<0)continue
      const ox=other.anchor.x-localHead.x,oz=other.anchor.z-localHead.z,od=ox*s.direction.x+oz*s.direction.z
      if(od<=.1)continue
      const cx=(ox*Math.cos(yaw)-oz*Math.sin(yaw))/od,ow=other.mesh.scale.x*.5/od
      const top=(other.anchor.y-localHead.y+other.mesh.scale.y*.5)/od,bottom=(other.anchor.y-localHead.y-other.mesh.scale.y*.5)/od
      if(centre+half>cx-ow&&centre-half<cx+ow&&(s.anchor.y-localHead.y-textHeight*.5)/depth<top+.025&&(s.anchor.y-localHead.y+textHeight*.5)/depth>bottom){
        const next=p.side<0?cx-ow-.04-half:cx+ow+.04+half
        if(Math.abs(next)+half<.8){
          const shift=(next-centre)*depth
          s.anchor.x+=Math.cos(yaw)*shift;s.anchor.z-=Math.sin(yaw)*shift
        }else s.anchor.y=Math.max(s.anchor.y,localHead.y+(top+.025)*depth+textHeight*.5)
      }
    }
    s.mesh.position.copy(s.anchor);s.mesh.lookAt(head)
    const uv=s.mesh.geometry.attributes.uv
    uv.setXY(0,entry.u,entry.v+entry.h);uv.setXY(1,entry.u+entry.w,entry.v+entry.h)
    uv.setXY(2,entry.u,entry.v);uv.setXY(3,entry.u+entry.w,entry.v);uv.needsUpdate=true
    s.mesh.scale.set(p.width,p.width/entry.aspect,1);s.mesh.material.color.set(p.color)
  }
  return {
    prepare,
    setOccluder(object){occluder=object},
    setEnabled(value){enabled=Boolean(value);if(!enabled)clear()},
    toggle(){this.setEnabled(!enabled)},
    update(clock,reality,head,forward){
      if(disposed||!enabled||!data||status!=='ready'||reality.activeReality!==song||reality.requestedReality!==song||reality.realityTransition||clock.songId!==song){clear();return}
      fillActiveEvents(data.events,clock.seconds,active)
      for(const s of slots)if(!active.includes(s.index)){s.index=-1;s.mesh.visible=false}
      for(const index of active){
        let s=slots.find(slot=>slot.index===index)
        if(!s){s=slots.find(slot=>slot.index<0);if(!s)continue;place(s,index,head,forward)}
        const e=data.events[index],p=s.preset,t=clock.seconds-e.start,length=e.end-e.start,progress=t/length
        const fade=Math.min(p.fade,length*.35)
        const opacity=Math.min(1,t/fade,(length-t)/fade)*p.opacity
        s.mesh.position.copy(s.anchor).addScaledVector(s.direction,p.travel*progress);s.mesh.position.y+=p.rise*progress
        s.mesh.material.opacity=Math.max(0,opacity);s.mesh.visible=true
      }
    },
    hide:clear,
    reset(){clear();enabled=true},
    stats(out={}){
      let count=0;for(const s of slots)if(s.mesh.visible)count++
      out.lyricsEnabled=enabled;out.lyricStatus=status;out.lyricSong=song;out.activeLyrics=count;out.lyricPool=slots.length;out.lyricAtlases=atlas?1:0
      return out
    },
    dispose(){
      if(disposed)return;disposed=true;version++;controller?.abort();releaseData()
      for(const s of slots){s.mesh.geometry.dispose();s.mesh.material.dispose()}
      group.removeFromParent()
    },
  }
}
