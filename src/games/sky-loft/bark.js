// Supply a licensed mono recording here later. Null means no request/audio context.
export const BARK = Object.freeze({src:null,expectedPath:'/audio/sky-loft/bichon-greeting.ogg',volume:.12,cooldown:12,refDistance:1,maxDistance:10,rolloff:1.5})
export function createBarkAudio({config=BARK,contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),fetchAudio=globalThis.fetch}={}){
 let ctx=null,buffer=null,voice=null,gain=null,panner=null,request=null,loading=false,disposed=false,epoch=0,lastGreeting=-Infinity
 function stop(){if(voice){voice.onended=null;try{voice.stop()}catch{}voice.disconnect();gain?.disconnect();panner?.disconnect()}voice=null;gain=null;panner=null}
 function position(node,p){if(node.positionX){node.positionX.value=p.x;node.positionY.value=p.y;node.positionZ.value=p.z}else node.setPosition(p.x,p.y,p.z)}
 return {
  activate(){
   if(disposed||!config.src)return
   try{
    ctx??=contextFactory();Promise.resolve(ctx.resume()).catch(()=>{})
    if(buffer||loading)return
    loading=true;const version=epoch;request=new AbortController()
    Promise.resolve(fetchAudio(config.src,{signal:request.signal})).then(r=>{if(!r.ok)throw Error('audio unavailable');return r.arrayBuffer()}).then(b=>ctx.decodeAudioData(b)).then(b=>{if(!disposed&&version===epoch)buffer=b}).catch(()=>{}).finally(()=>{if(version===epoch){loading=false;request=null}})
   }catch{loading=false}
  },
  greet(seconds,dog){
   if(disposed||!Number.isFinite(seconds)||seconds-lastGreeting<config.cooldown)return false
   lastGreeting=seconds
   if(!buffer||ctx?.state!=='running'||voice)return false
   try{
    voice=ctx.createBufferSource();gain=ctx.createGain();panner=ctx.createPanner()
    gain.gain.value=config.volume;panner.panningModel='HRTF';panner.distanceModel='inverse'
    panner.refDistance=config.refDistance;panner.maxDistance=config.maxDistance;panner.rolloffFactor=config.rolloff
    position(panner,dog);voice.buffer=buffer;voice.connect(gain);gain.connect(panner);panner.connect(ctx.destination)
    voice.onended=stop;voice.start();return true
   }catch{stop();return false}
  },
  update(head,forward,dog){
   if(!voice)return
   try{
    position(ctx.listener,head);position(panner,dog)
    const l=ctx.listener
    if(l.forwardX){l.forwardX.value=forward.x;l.forwardY.value=forward.y;l.forwardZ.value=forward.z;l.upX.value=0;l.upY.value=1;l.upZ.value=0}
    else l.setOrientation(forward.x,forward.y,forward.z,0,1,0)
   }catch{stop()}
  },
  pause:stop,
  reset(){epoch++;request?.abort();request=null;loading=false;lastGreeting=-Infinity;stop()},
  dispose(){if(disposed)return;this.reset();disposed=true;buffer=null;try{Promise.resolve(ctx?.close()).catch(()=>{})}catch{}ctx=null},
 }
}
