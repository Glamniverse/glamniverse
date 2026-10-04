import * as THREE from 'three'
import { createVisitors } from './visitors.js'
import { createButterflies } from './butterflies.js'
import { createJellyfish } from './jellyfish.js'

// Species registry, deliberately separate from persistent companion and scene lifecycle.
export function createRealityVisitors(parent){
  const definitions={'neon-mantas':createVisitors,butterflies:createButterflies,jellyfish:createJellyfish},systems={}
  for(const [id,create] of Object.entries(definitions)){
    const group=new THREE.Group();parent.add(group)
    const system=create(group),materials=new Map()
    group.traverse(o=>{
      const m=o.material
      if(m&&!materials.has(m))materials.set(m,{color:m.color?.clone(),emissive:m.emissive?.clone()})
    })
    group.visible=false;systems[id]={group,system,materials}
  }
  let selected=null,visibility=1,disposed=false
  function setVisibility(value){
    visibility=value
    for(const [id,s] of Object.entries(systems)){
      s.group.visible=id===selected&&value>0
      if(id!==selected)continue
      for(const [m,base] of s.materials){if(base.color)m.color.copy(base.color).multiplyScalar(value);if(base.emissive)m.emissive.copy(base.emissive).multiplyScalar(value)}
    }
  }
  return {
    apply(id){
      if(disposed||!systems[id])return false
      if(selected===id)return true
      if(selected)systems[selected].system.reset()
      selected=id;systems[id].system.reset()
      systems[id].system.apply?.(id);setVisibility(visibility);return true
    },
    setVisibility,
    heroPulse(){return !disposed&&selected==='jellyfish'&&visibility>0?systems.jellyfish.system.heroPulse():false},
    update(time,enabled,input){if(!disposed&&selected)systems[selected].system.update(time,enabled,input)},
    reset(){for(const s of Object.values(systems))s.system.reset()},
    stats:()=>{
      const stats=selected?systems[selected].system.stats():{}
      return {visitorSpecies:selected,visitorPool:stats.visitorPool??stats.butterflyPool??stats.jellyfishPool??0,
        activeVisitors:stats.activeVisitors??stats.activeButterflies??stats.activeJellyfish??0,
        ...systems.butterflies.system.stats(),...systems.jellyfish.system.stats()}
    },
    dispose(){if(disposed)return;disposed=true;for(const s of Object.values(systems)){s.system.dispose();s.group.visible=false}},
  }
}
