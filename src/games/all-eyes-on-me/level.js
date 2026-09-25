import { CONFIG as C } from './config.js'

// M2 hardware chart: explicit beat positions, not runtime beat detection.
// Local FFT spectral-flux analysis: 125.28 BPM in both 8–32 and 32–56 s.
// The full-song estimate is ~125.3 BPM; offset includes analysis uncertainty.
export const GRID = { bpm: 125.28, offset: 0.005 }
export const beatTime = beat => GRID.offset + beat * 60 / GRID.bpm
// Normal / centre / high / side lanes; NO low lanes or simultaneous pairs.
const rows = [
  [12,'L'],
  [14,'R'],
  [16,'L'],
  [18,'R'],
  [20,'L'],
  [21,'R'],
  [22,'L'],
  [23,'R'],
  [24,'LS'],
  [26,'RS'],
  [28,'L'],
  [29,'L'],
  [30,'R'],
  [31,'R'],
  [32,'LH'],
  [33,'RH'],
  [34,'L'],
  [35,'R'],
  [36,'LS'],
  [38,'RS'],
  [40,'L'],
  [41,'R'],
  [42,'L'],
  [43,'R'],
  [44,'LH'],
  [57,'L'],
  [58,'R'],
  [59,'LS'],
  [60,'RS'],
  [61,'L'],
  [62,'L'],
  [63,'R'],
  [64,'R'],
  [66,'LH'],
  [67,'RH'],
  [68,'L'],
  [69,'R'],
  [70,'LS'],
  [71,'RS'],
  [72,'L'],
  [85,'L'],
  [86,'R'],
  [87,'LS'],
  [88,'RS'],
  [91,'L'],
  [92,'R'],
  [93,'LH'],
  [94,'RH'],
  [95,'L'],
  [96,'L'],
  [97,'R'],
  [98,'R'],
  [99,'LS'],
  [100,'RS'],
  [100.5,'L'],
  [101,'R'],
  [101.5,'L'],
  [102,'R'],
]
export const LEVEL = {
  audio: '/audio/all-eyes-on-me/all-eyes-on-me.mp3', duration: 56, masterDuration: 218.640979,
  events: rows.map(([beat,lane]) => ({beat,hitAt:beatTime(beat),lane,hand:lane.startsWith('L')?'left':'right'})),
  obstacles: [{at:beatTime(51),kind:'duck'}, {at:beatTime(79),kind:'left'}, {at:beatTime(109),kind:'right'}],
}
export const isSideTarget = e => e.lane === 'LS' || e.lane === 'RS'
// A side eye fans out from the portal on a straight line; it never follows gaze.
export const targetX = (e,t) => C.lanes[e.lane][0] * (isSideTarget(e) ? (t-spawnAt(e))/C.travelSeconds : 1)
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
  return true
}
