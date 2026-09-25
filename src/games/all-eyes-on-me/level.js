import { CONFIG as C } from './config.js'

import { EVENTS, OBSTACLES, WAVES } from './chart.js'
export { GRID, beatTime, SECTIONS } from './chart.js'
export const LEVEL = {
  audio: '/audio/all-eyes-on-me/all-eyes-on-me.mp3', duration: 218.640979, masterDuration: 218.640979,
  events: EVENTS, obstacles: OBSTACLES, waves: WAVES,
}
export const isSideTarget = e => e.lane === 'LS' || e.lane === 'RS'
// A side eye fans out from the portal on a straight line; it never follows gaze.
const nearX = (e,t) => C.lanes[e.lane][0] * (isSideTarget(e) ? (t-nearSpawnAt(e))/C.travelSeconds : 1)
// Distant presentation blends into the EXACT M2 near trajectory and velocity.
function distant(t,e,start,end,velocity) {
  const u=Math.max(0,Math.min(1,(t-spawnAt(e))/C.distantLeadSeconds)),u2=u*u,u3=u2*u
  return (2*u3-3*u2+1)*start+(-2*u3+3*u2)*end+(u3-u2)*C.distantLeadSeconds*velocity
}
export const targetX = (e,t) => t<nearSpawnAt(e) ? distant(t,e,C.portalX,nearX(e,nearSpawnAt(e)),isSideTarget(e)?C.lanes[e.lane][0]/C.travelSeconds:0) : nearX(e,t)
export const targetY = (e,t) => t<nearSpawnAt(e) ? distant(t,e,C.portalY,C.lanes[e.lane][1],0) : C.lanes[e.lane][1]
export const arrivalAt = e => e.hitAt + C.chartOffsetSeconds
export const nearSpawnAt = e => arrivalAt(e) - C.travelSeconds
export const spawnAt = e => nearSpawnAt(e) - C.distantLeadSeconds
export const speed = () => (C.spawnDistance - C.hitDistance) / C.travelSeconds
export const missAt = e => arrivalAt(e) + (C.hitDistance + C.missBehind) / speed()
export const strikeAt = e => arrivalAt(e) - (C.strikeAreaDistance - C.hitDistance) / speed()
export const targetZ = (e,t) => t<nearSpawnAt(e) ? distant(t,e,-C.portalDistance,-C.spawnDistance,speed()) : -C.hitDistance + (t - arrivalAt(e)) * speed()
export const obstacleAt = e => e.at + C.chartOffsetSeconds
export const obstacleSpawn = e => obstacleAt(e) - C.obstacleTravelSeconds
export const obstacleEnd = e => obstacleAt(e) + C.obstacleClearSeconds
export function validateLevel(level = LEVEL) {
  let last = -Infinity
  for (const e of level.events) {
    if (!Number.isFinite(e.hitAt) || e.hitAt - last < C.minTargetGap || !C.lanes[e.lane] || !['left','right'].includes(e.hand) || (e.lane.startsWith('L') ? 'left' : 'right') !== e.hand) throw Error('Invalid eye event')
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
  for(let i=0;i<level.waves.length;i++) {
    const at=level.waves[i].at+C.chartOffsetSeconds
    if(!Number.isFinite(at)||at<0||at+C.waveDuration>level.duration)throw Error('Wave outside audio')
    if(i && at<level.waves[i-1].at+C.chartOffsetSeconds)throw Error('Wave ordering')
    if(level.waves.filter(w=>w.at+C.chartOffsetSeconds<=at && w.at+C.chartOffsetSeconds+C.waveDuration>at).length>C.maxWaves)throw Error('Wave pool exceeded')
  }
  return true
}
