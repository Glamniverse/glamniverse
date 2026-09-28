import { REALITIES, ENVIRONMENTS, TRANSITION_SECONDS } from './config.js'

// Only this coordinator changes reality. No knowledge of dog, XR rig or locomotion.
// Latest selection queues behind an in-flight transition; no overlapping transitions.
export function createRealityEngine({environment,loft,visitors,music,onSelect=()=>{},notify=()=>{}}){
  let active=REALITIES['neon-therapy'],wanted=active,transition=null,last=null,paused=false,disposed=false,primed=false
  function install(reality){
    environment.apply(reality.environmentId);loft.setTheme(reality.theme)
    visitors.apply(ENVIRONMENTS[reality.environmentId].visitors)
  }
  install(active)
  const smooth=t=>t*t*(3-2*t)
  function reset(){
    transition=null;wanted=active;last=null;paused=false;primed=false
    install(active);environment.setBrightness(1);visitors.setVisibility(1);music.setGain(1);onSelect(active)
  }
  return {
    select(id){
      if(disposed||!REALITIES[id])return false
      const wasPaused=paused;paused=false;last=null
      wanted=REALITIES[id];onSelect(wanted)
      if(!transition&&wanted===active){primed=false;music.setGain(1);music.select(active);music.refreshStatus();return true}
      if(wasPaused)music.select(active)
      if(music.prime(wanted))primed=true
      environment.preload(wanted.environmentId);notify('Changing reality…')
      return true
    },
    update(time,enabled){
      if(disposed||!enabled||paused||!Number.isFinite(time)){last=null;return}
      const dt=last===null?0:Math.min(.1,Math.max(0,(time-last)/1000));last=time
      if(!transition&&wanted!==active){
        if(environment.failed(wanted.environmentId)){
          if(primed){music.release();primed=false}
          wanted=active;onSelect(active);notify('Environment unavailable • Select to retry');return
        }
        if(!environment.ready(wanted.environmentId))return
        transition={from:active,to:wanted,seconds:0,swapped:false}
      }
      if(!transition)return
      const tr=transition;tr.seconds+=dt
      const p=Math.min(1,tr.seconds/TRANSITION_SECONDS)
      const visibility=p<.5?1-smooth(p*2):smooth((p-.5)*2)
      environment.setBrightness(visibility);visitors.setVisibility(visibility)
      music.setGain(primed&&!tr.swapped?0:visibility)
      if(p>=.5&&!tr.swapped){
        tr.swapped=true;active=tr.to;install(active);music.restart(active);primed=false
        environment.setBrightness(visibility);visitors.setVisibility(visibility)
      }
      environment.blendAtmosphere(tr.from.environmentId,tr.to.environmentId,smooth(p))
      loft.blendTheme(tr.from.theme,tr.to.theme,smooth(p))
      if(p>=1){transition=null;environment.setBrightness(1);visitors.setVisibility(1);music.setGain(1);music.refreshStatus()}
    },
    // Manual Pause freezes only media/lyrics. Selecting a different reality starts its song normally.
    togglePlayback(){
      if(disposed)return false
      if(paused)return this.select(wanted.id) // resume an interrupted transition through its existing path
      if(transition||wanted!==active)return false
      if(music.getClock().playing)music.pause()
      else music.select(active)
      return true
    },
    pause(){paused=true;last=null;music.pause()},
    reset,
    stats(out={}){
      out.activeReality=active.id;out.requestedReality=wanted.id;out.realityTransition=transition!==null;out.realityPaused=paused
      return out
    },
    dispose(){disposed=true;transition=null;last=null},
  }
}
