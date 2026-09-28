// Metres relative to the current player, resolved ONCE per event in loft space.
// All text stays beyond the front terrace, above furniture; no camera parenting.
export const LYRIC_LIMITS = Object.freeze({ maxActive: 4, atlasSize: 2048, cellWidth: 1024, cellHeight: 96, maxPhrases: 84 })
const preset=(distance,width,height,side=0,travel=0,color='#fff2dd',opacity=1,fade=.4,rise=.15)=>
  Object.freeze({distance,width,height,side,travel,color,opacity,fade,rise})
export const LYRIC_PRESETS=Object.freeze({
  VERSE_LEFT: preset(20,6,2.1,-.24),
  VERSE_RIGHT: preset(20,6,2.1,.24),
  PRECHORUS_LEFT: preset(24,8,2.8,-.22,-.5,'#ffe1a9'),
  PRECHORUS_RIGHT: preset(24,8,2.8,.22,-.5,'#ffe1a9'),
  CHORUS_NEAR: preset(16,6.5,2.2,-.22),
  CHORUS_FORWARD: preset(26,9,4,.18,3,'#daf7ff'),
  CHORUS_SIDE: preset(23,7,2.6,-.32),
  CHORUS_FADE: preset(28,8,4.5,.23,2,'#e8dafa',.8,1),
  CHORUS_SOFT: preset(24,8,4.2,.23,0,'#e8dafa',.9,.6),
  CHORUS_BUILD: preset(32,9,3.5,0,1,'#ffe1a9'),
  HORIZON_WIDE: preset(42,18,3.5,-.13,0,'#fff2dd'),
  HORIZON_GLOW: preset(40,12,7,.2,0,'#a9edff'),
  HERO_PARADISE: Object.freeze({...preset(60,26,11,0,0,'#ffe5ac',1,.45,.9),uppercase:true}),
  HERO_ECHO: Object.freeze({...preset(70,20,9,.12,2,'#bfeaff',.48,.8,.4),uppercase:true}),
  BRIDGE_INTIMATE: preset(18,6,2.7,0,0,'#f4e6f6',.9,.6),
  BETWEEN_WAVES_SKY: preset(38,14,3.5,0,0,'#e4f8ff',.95,.5,.12),
  BRIDGE_FLOAT: preset(26,9,4.4,.14,0,'#eadcfa',.85,.65,.35),
  BRIDGE_DECLARATION: preset(24,7,3.4,-.17,0,'#ffe1a9',1,.25),
  WORLD_DISAPPEARS: preset(32,11,5,0,4,'#e8dafa',.8,2,.25),
  HORIZON_TRAVEL: preset(38,14,4,0,5,'#daf7ff',.9,.5),
})

export function validateLyricData(data,songId){
  if(data?.schemaVersion!==1||data.song?.id!==songId||!Number.isFinite(data.song.audioDurationSeconds)||!Array.isArray(data.events))throw Error('Invalid lyric data')
  let previous=-1
  const unique=new Set()
  for(const e of data.events){
    if(!Number.isFinite(e.start)||!Number.isFinite(e.end)||e.start<previous||e.start<0||e.end<=e.start||e.end>data.song.audioDurationSeconds||typeof e.text!=='string'||!e.text.trim()||!LYRIC_PRESETS[e.preset])throw Error('Invalid lyric event')
    previous=e.start;unique.add(e.text)
    if(data.events.filter(other=>other.start<=e.start&&other.end>e.start).length>LYRIC_LIMITS.maxActive)throw Error('Too many overlapping lyrics')
  }
  if(unique.size>LYRIC_LIMITS.maxPhrases)throw Error('Lyric atlas capacity exceeded')
  return data
}

// No scheduler or accumulated time: seeking and toggling ON inspect current intervals only.
export function fillActiveEvents(events,seconds,out){
  out.length=0
  if(!Number.isFinite(seconds))return out
  for(let i=0;i<events.length;i++){
    const e=events[i];if(e.start>seconds)break
    if(seconds<e.end&&out.length<LYRIC_LIMITS.maxActive)out.push(i)
  }
  return out
}
