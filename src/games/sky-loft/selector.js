import * as THREE from 'three'
import { makePanel } from '../smash-the-hate/ui.js'
import { SONGS, CONFIG } from './config.js'

export function createSelector(parent, onSelect, back, onMovement=()=>{}, onPlayback=()=>{}, onLyrics=()=>{}) {
  const group = new THREE.Group(); parent.add(group)
  group.position.y = 0.30 // Keep the entire BACK panel above the 0.585m selector tabletop.
  const heading = makePanel(1.65,0.3,1024,192)
  heading.draw(['GLAMNIVERSE', 'CHOOSE YOUR REALITY'], '#ad8ec8')
  heading.mesh.position.set(0,0.48,-CONFIG.selectorDistance)
  const status = makePanel(1.65,0.18,1024,128)
  status.mesh.position.set(0,-0.20,-CONFIG.selectorDistance)
  const exit = makePanel(1.1,0.17,768,128)
  exit.draw(['BACK TO GLAMNIVERSE'], '#ad8ec8'); exit.mesh.position.set(0,-1.06,-CONFIG.selectorDistance)
  const movement=makePanel(1.65,.23,1024,160)
  movement.mesh.position.set(0,-.78,-CONFIG.selectorDistance)
  const playbackControl=makePanel(.82,.18,768,128),lyricsControl=makePanel(.82,.18,768,128)
  playbackControl.mesh.name='SkyLoft_PlayPause';lyricsControl.mesh.name='SkyLoft_LyricsToggle'
  playbackControl.mesh.position.set(-.44,-.44,-CONFIG.selectorDistance)
  lyricsControl.mesh.position.set(.44,-.44,-CONFIG.selectorDistance)
  group.add(playbackControl.mesh,lyricsControl.mesh)
  let canPlay=true,canLyrics=false,playLabel='',lyricsLabel=''
  let motion='stationary'
  function movementLabel(){movement.draw(motion==='slow'?['SLOW MOVE - SELECT TO STOP','LEFT STICK MOVE / RIGHT STICK SNAP']:['MOVEMENT OFF - SELECT TO EXPLORE','SLOW MOVEMENT + SNAP TURN'], '#ad8ec8')}
  movementLabel()
  group.add(heading.mesh,status.mesh,exit.mesh,movement.mesh)
  const buttons = SONGS.map((song,i) => {
    const panel = makePanel(0.79,0.29,512,192)
    panel.mesh.position.set((i-(SONGS.length-1)/2)*0.86,0.08,-CONFIG.selectorDistance)
    group.add(panel.mesh); return { song,panel,hover:false }
  })
  let selected = SONGS[0].id, unregister = [], bound = false, playback = 'Select a song to play'
  function refresh() {
    for (const b of buttons) {
      b.panel.draw([b.song.title, b.song.id===selected ? 'SELECTED' : 'SELECT'], b.song.theme.accent)
    }
    status.draw(['NOW SELECTED — '+SONGS.find(s=>s.id===selected).title, playback], '#ad8ec8')
  }
  refresh()
  return {
    group,
    setControls(clock,reality,lyrics){
      canPlay=!reality.realityTransition&&reality.activeReality===reality.requestedReality||reality.realityPaused
      canLyrics=Boolean(SONGS.find(s=>s.id===reality.requestedReality)?.lyrics)
      const nextPlay=canPlay?(clock.playing?'PAUSE MUSIC':'PLAY MUSIC'):'CHANGING REALITY'
      const nextLyrics=!canLyrics?'LYRICS: UNAVAILABLE':lyrics.lyricStatus==='error'?'LYRICS: UNAVAILABLE':lyrics.lyricStatus==='loading'?'LYRICS: LOADING':lyrics.lyricsEnabled?'LYRICS: ON':'LYRICS: OFF'
      if(nextPlay!==playLabel){playLabel=nextPlay;playbackControl.draw([playLabel],'#ad8ec8')}
      if(nextLyrics!==lyricsLabel){lyricsLabel=nextLyrics;lyricsControl.draw([lyricsLabel],'#ad8ec8')}
    },
    setMovement(mode){motion=mode;movementLabel()},
    select(song) { selected=song.id;refresh() },
    setPlayback(message) { if (message!==playback) {playback=message;refresh()} },
    bind(interaction, enabled) {
      this.unbind(); bound=true
      for (const b of buttons) unregister.push(interaction.addTarget(b.panel.mesh,()=>{
        if (enabled()) onSelect(b.song.id)
      },{owned:false,enabled,onHover(hover) {
        if(b.hover===hover)return
        b.hover=hover;b.panel.mesh.scale.setScalar(hover?1.035:1)
        b.panel.mesh.material.color.set(hover?0xddefff:0xffffff)
      }}))
      unregister.push(interaction.addTarget(exit.mesh,()=>{if(enabled())back()},{owned:false,enabled}))
      unregister.push(interaction.addTarget(movement.mesh,()=>{if(enabled()){motion=motion==='slow'?'stationary':'slow';movementLabel();onMovement(motion)}},{owned:false,enabled}))
      unregister.push(interaction.addTarget(playbackControl.mesh,()=>{if(enabled()&&canPlay)onPlayback()},{owned:false,enabled}))
      unregister.push(interaction.addTarget(lyricsControl.mesh,()=>{if(enabled()&&canLyrics)onLyrics()},{owned:false,enabled}))
    },
    unbind() {
      unregister.splice(0).forEach(remove=>remove());bound=false
      for(const b of buttons) {b.hover=false;b.panel.mesh.scale.setScalar(1);b.panel.mesh.material.color.setHex(0xffffff)}
    },
    stats:()=>({registeredTargets:bound?SONGS.length+4:0,selected}),
  }
}
