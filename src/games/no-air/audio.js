// Intentionally silent until the user supplies the approved NO AIR recording.
// One private media element, created lazily; shared music and Analytics untouched.
export function createOceanAudio(src=null,factory=()=>new Audio()){
 let element=null,disposed=false
 return {
  start(){if(disposed||!src)return;if(!element){element=factory();element.src=src;element.preload='metadata';element.volume=.65}try{element.play()?.catch(()=>{})}catch{}},
  pause(){element?.pause()},
  reset(){element?.pause();if(element)element.currentTime=0},
  dispose(){disposed=true;if(element){element.pause();element.removeAttribute('src');element.load();element=null}},
  get available(){return Boolean(src)},
 }
}
