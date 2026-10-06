// User-approved mono recordings, copied unchanged from Downloads. One shared voice/listener.
export const BARK = Object.freeze({src:'/audio/sky-loft/bichon-greeting.ogg',whimperSrc:'/audio/sky-loft/bichon-whimper.ogg',whimperVolume:.075,whimperCooldown:36,expectedPath:'/audio/sky-loft/bichon-greeting.ogg',volume:.55,barkRefDistance:2,barkRolloff:1,cooldown:12,refDistance:1,maxDistance:10,rolloff:1.5})
export function createBarkAudio({config=BARK,contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),fetchAudio=globalThis.fetch}={}){
 let ctx=null,buffer=null,whimperBuffer=null,voice=null,gain=null,panner=null,request=null,loading=false,disposed=false,epoch=0,lastGreeting=-Infinity,lastWhimper=-Infinity
 function stop(){if(voice){voice.onended=null;try{voice.stop()}catch{}voice.disconnect();gain?.disconnect();panner?.disconnect()}voice=null;gain=null;panner=null}
 function position(node,p){if(node.positionX){node.positionX.value=p.x;node.positionY.value=p.y;node.positionZ.value=p.z}else node.setPosition(p.x,p.y,p.z)}
 function play(sound,volume,dog,refDistance=config.refDistance,rolloff=config.rolloff){
   if(!sound||ctx?.state!=='running'||voice)return false
   try{
    voice=ctx.createBufferSource();gain=ctx.createGain();panner=ctx.createPanner()
    gain.gain.value=volume;panner.panningModel='HRTF';panner.distanceModel='inverse'
    panner.refDistance=refDistance;panner.maxDistance=config.maxDistance;panner.rolloffFactor=rolloff
    position(panner,dog);voice.buffer=sound;voice.connect(gain);gain.connect(panner);panner.connect(ctx.destination)
    voice.onended=stop;voice.start();return true
   }catch{stop();return false}
 }
 return {
  activate(){
   if(disposed||(!config.src&&!config.whimperSrc))return
   try{
    ctx??=contextFactory();Promise.resolve(ctx.resume()).catch(()=>{})
    if(loading||(buffer||!config.src)&&(whimperBuffer||!config.whimperSrc))return
    loading=true;const version=epoch;request=new AbortController()
    const load=(url,assign)=>Promise.resolve().then(()=>fetchAudio(url,{signal:request.signal})).then(r=>{if(!r.ok)throw Error('audio unavailable');return r.arrayBuffer()}).then(b=>ctx.decodeAudioData(b)).then(b=>{if(!disposed&&version===epoch)assign(b)}).catch(()=>{})
    const pending=[]
    if(config.src&&!buffer)pending.push(load(config.src,b=>{buffer=b}))
    if(config.whimperSrc&&!whimperBuffer)pending.push(load(config.whimperSrc,b=>{whimperBuffer=b}))
    Promise.all(pending).finally(()=>{if(version===epoch){loading=false;request=null}})
   }catch{loading=false}
  },
  greet(seconds,dog){
   if(disposed||!Number.isFinite(seconds)||seconds-lastGreeting<config.cooldown)return false
   lastGreeting=seconds
   return play(buffer,config.volume,dog,config.barkRefDistance??config.refDistance,config.barkRolloff??config.rolloff)
  },
  whimper(seconds,dog){
   if(disposed||!Number.isFinite(seconds)||seconds-lastWhimper<config.whimperCooldown)return false
   lastWhimper=seconds
   return play(whimperBuffer,config.whimperVolume,dog)
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
  reset(){epoch++;request?.abort();request=null;loading=false;lastGreeting=-Infinity;lastWhimper=-Infinity;stop()},
  dispose(){if(disposed)return;this.reset();disposed=true;buffer=null;whimperBuffer=null;try{Promise.resolve(ctx?.close()).catch(()=>{})}catch{}ctx=null},
 }
}
