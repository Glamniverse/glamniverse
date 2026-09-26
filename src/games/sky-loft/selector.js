import * as THREE from 'three'
import { makePanel } from '../smash-the-hate/ui.js'
import { SONGS, CONFIG } from './config.js'

export function createSelector(parent, onSelect, back) {
  const group = new THREE.Group(); parent.add(group)
  const heading = makePanel(1.65,0.3,1024,192)
  heading.draw(['GLAMNIVERSE', 'CHOOSE YOUR REALITY'], '#ad8ec8')
  heading.mesh.position.set(0,0.3,-CONFIG.selectorDistance)
  const status = makePanel(1.65,0.25,1024,160)
  status.mesh.position.set(0,-0.49,-CONFIG.selectorDistance)
  const exit = makePanel(1.1,0.17,768,128)
  exit.draw(['BACK TO GLAMNIVERSE'], '#ad8ec8'); exit.mesh.position.set(0,-0.79,-CONFIG.selectorDistance)
  group.add(heading.mesh,status.mesh,exit.mesh)
  const buttons = SONGS.map((song,i) => {
    const panel = makePanel(0.79,0.29,512,192)
    panel.mesh.position.set((i-0.5)*0.86,-0.09,-CONFIG.selectorDistance)
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
    },
    unbind() {
      unregister.splice(0).forEach(remove=>remove());bound=false
      for(const b of buttons) {b.hover=false;b.panel.mesh.scale.setScalar(1);b.panel.mesh.material.color.setHex(0xffffff)}
    },
    stats:()=>({registeredTargets:bound?3:0,selected}),
  }
}
