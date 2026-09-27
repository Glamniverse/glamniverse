import * as THREE from 'three'
import { createVisitors } from './visitors.js'
import { createButterflies } from './butterflies.js'

// Species registry, deliberately separate from persistent companion and scene lifecycle.
export function createRealityVisitors(parent){
  const definitions={'neon-mantas':createVisitors,butterflies:createButterflies},systems={}
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
    update(time,enabled){if(!disposed&&selected)systems[selected].system.update(time,enabled)},
    reset(){for(const s of Object.values(systems))s.system.reset()},
    stats:()=>({visitorSpecies:selected,visitorPool:selected==='butterflies'?4:2,
      activeVisitors:selected==='butterflies'?systems.butterflies.system.stats().activeButterflies:systems['neon-mantas'].system.stats().activeVisitors,
      ...systems.butterflies.system.stats()}),
    dispose(){if(disposed)return;disposed=true;for(const s of Object.values(systems)){s.system.dispose();s.group.visible=false}},
  }
}
