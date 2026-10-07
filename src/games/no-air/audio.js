// One private media element. Suspension/exit pauses without seeking; only disposal releases it.
export function createOceanAudio(src=null,factory=()=>new Audio()){
 let element=null,disposed=false,wanted=true,active=false,pending=false,status='Paused'
 function play(){
  if(disposed||!src)return;active=true
  if(!element){element=factory();element.src=src;element.preload='metadata';element.volume=.65;element.loop=false}
  if(pending||element.paused===false)return
  pending=true;status='Starting'
  try{Promise.resolve(element.play()).then(()=>{pending=false;if(disposed||!active||!wanted){element?.pause();return}status='Playing'},()=>{pending=false;if(active&&wanted)status='Paused — select Play'})}catch{pending=false;status='Paused — select Play'}
 }
 return {
  start(){wanted=true;if(element?.ended)element.currentTime=0;play()},
  resume(){if(wanted&&!element?.ended)play()},
  pause(){wanted=false;active=false;element?.pause();status='Paused'},
  reset(){active=false;element?.pause();status='Paused'},
  toggle(){if(element?.paused===false||pending){this.pause()}else this.start()},
  dispose(){disposed=true;active=false;if(element){element.pause();element.removeAttribute('src');element.load();element=null}},
  get state(){return element?.error?'Unavailable — select Play':element?.ended?'Ended — select Play':element?.paused===false?'Playing':status==='Playing'?'Paused':status},
  get available(){return Boolean(src)},
 }
}
