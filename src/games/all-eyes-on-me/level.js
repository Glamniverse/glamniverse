import { CONFIG as C } from './config.js'

// TEMPORARY TEST CHART: arrival times, NOT a final beat/lyric-authored map.
// Xing: 9112 frames at 48 kHz; 576 delay + 1681 padding samples trimmed.
// Browser-verified playback duration: 218.640979 s (untrimmed frames: 218.688 s).
// 129 BPM is a supplied design estimate, not a verified tempo analysis.
const rows = [
  [6,'L'],[7.4,'R'],[8.8,'L'],[10.2,'R'],[11.6,'LC'],[13,'RC'],
  [14.4,'LH'],[15.8,'RH'],[17.2,'LL'],[18.6,'RL'],[20,'L','R'],
  [29,'L'],[30.1,'L'],[31.2,'R'],[32.3,'R'],[33.4,'LH','RH'],
  [43,'LC'],[44.1,'RC'],[45.2,'LL'],[46.3,'RL'],[47.4,'L','R'],
]
export const LEVEL = {
  audio: '/audio/all-eyes-on-me/all-eyes-on-me.mp3', duration: 56, masterDuration: 218.640979,
  events: rows.flatMap(([hitAt,...lanes]) => lanes.map(lane => ({hitAt,lane,hand:lane.startsWith('L')?'left':'right'}))),
  obstacles: [{at:24.6,kind:'duck'}, {at:38,kind:'left'}, {at:52,kind:'right'}],
}
export const arrivalAt = e => e.hitAt + C.chartOffsetSeconds
export const spawnAt = e => arrivalAt(e) - C.travelSeconds
export const speed = () => (C.spawnDistance - C.hitDistance) / C.travelSeconds
export const missAt = e => arrivalAt(e) + (C.hitDistance + C.missBehind) / speed()
export const strikeAt = e => arrivalAt(e) - (C.strikeAreaDistance - C.hitDistance) / speed()
export const targetZ = (e,t) => -C.hitDistance + (t - arrivalAt(e)) * speed()
export const obstacleAt = e => e.at + C.chartOffsetSeconds
export const obstacleSpawn = e => obstacleAt(e) - C.obstacleTravelSeconds
export const obstacleEnd = e => obstacleAt(e) + C.obstacleClearSeconds
export function validateLevel(level = LEVEL) {
  let last = -Infinity
  for (const e of level.events) {
    if (!Number.isFinite(e.hitAt) || e.hitAt < last || !C.lanes[e.lane] || !['left','right'].includes(e.hand) || (e.lane.startsWith('L') ? 'left' : 'right') !== e.hand) throw Error('Invalid eye event')
    if (spawnAt(e) < 0 || missAt(e) > level.duration) throw Error('Eye outside demo')
    last = e.hitAt
  }
  for (let i=0;i<level.obstacles.length;i++) {
    const o=level.obstacles[i]
    if (!['duck','left','right'].includes(o.kind) || obstacleSpawn(o)<0 || obstacleEnd(o)>level.duration) throw Error('Invalid obstacle')
    if (level.events.some(e=>spawnAt(e)<obstacleEnd(o) && missAt(e)>obstacleSpawn(o))) throw Error('Eye/obstacle overlap')
    if (i && obstacleSpawn(o)<obstacleEnd(level.obstacles[i-1])) throw Error('Obstacle overlap')
  }
  // Check interval endpoints, not frame sampling, so narrow violations cannot hide.
  for (const e of level.events) {
    for (const [start,cap] of [[spawnAt,C.maxTargets],[strikeAt,C.maxStrikeTargets]]) {
      const t=start(e)
      if (level.events.filter(v=>start(v)<=t && missAt(v)>t).length>cap) throw Error('Eye pool/strike cap exceeded')
    }
  }
  return true
}
