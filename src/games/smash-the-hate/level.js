import { CONFIG as C } from './config.js'

// TEMPORARY FUNCTIONAL CHART. These timestamps are NOT a final musical beat map.
// hitAt = arrival at the comfortable hit plane; spawn is read+travel seconds earlier.
export const DEMO_LEVEL = {
  id: 'i-am-confident-temporary-test-02',
  audio: '/audio/smash-the-hate/i-am-confident.mp3',
  duration: 60,
  events: [
    { id: 'a', hitAt: 6, lane: -1, text: 'WHO ASKED?' },
    { id: 'b', hitAt: 10, lane: 1, text: 'CRINGE' },
    { id: 'c', hitAt: 23, lane: -1, text: 'NOBODY CARES' },
    { id: 'd', hitAt: 27, lane: -1, text: 'TRY HARDER' },
    { id: 'e', hitAt: 27, lane: 1, text: 'NOT GOOD ENOUGH' },
    { id: 'f', hitAt: 41, lane: 1, text: 'JUST QUIT' },
    { id: 'g', hitAt: 45, lane: -1, text: 'CRINGE' },
    { id: 'h', hitAt: 58, lane: 1, text: 'WHO ASKED?' },
  ],
  ducks: [
    { id: 'duck-a', crossAt: 18, text: 'DUCK THE DRAMA' },
    { id: 'duck-b', crossAt: 35, text: 'TOUCH GRASS' },
    { id: 'duck-c', crossAt: 53, text: 'LOWER YOUR EXPECTATIONS' },
  ],
}

export const spawnAt = event => event.hitAt - C.readSeconds - C.travelSeconds
export const cardSpeed = () => (C.spawnDistance - C.hitDistance) / C.travelSeconds
export const missAt = event => event.hitAt + (C.hitDistance + C.missBehind) / cardSpeed()
export function cardZ(event, time) {
  return -C.spawnDistance + Math.max(0, time - spawnAt(event) - C.readSeconds) * cardSpeed()
}

export function validateLevel(level) {
  if (!(C.spawnDistance > C.hitDistance && C.travelSeconds > 0 && C.readSeconds >= 0)) throw new Error('Invalid card travel config')
  if (!(C.duckAmount > 0 && C.duckTravelSeconds > 0 && C.duckWarningSeconds >= 0 && C.duckCrossingSeconds > 0)) throw new Error('Invalid duck config')
  let priorDuckEnd = -Infinity
  for (const duck of level.ducks ?? []) {
    if (!Number.isFinite(duck.crossAt) || !duck.text || duckSpawnAt(duck) < 0 || duckEndAt(duck) > level.duration || duckSpawnAt(duck) < priorDuckEnd) throw new Error('Invalid duck timing')
    priorDuckEnd = duckEndAt(duck)
    for (const card of level.events) {
      if (spawnAt(card) < duckEndAt(duck) && missAt(card) > duckSpawnAt(duck)) throw new Error('Duck/card overlap')
    }
  }
  const ids = new Set()
  let last = -Infinity
  for (const event of level.events) {
    if (!Number.isFinite(event.hitAt) || event.hitAt < last || spawnAt(event) < 0 || missAt(event) > level.duration || ids.has(event.id)) throw new Error('Invalid demo event timing/ID')
    if (![-1, 0, 1].includes(event.lane) || !event.text) throw new Error('Invalid lane/text')
    last = event.hitAt
    ids.add(event.id)
    const active = level.events.filter(other => spawnAt(other) <= spawnAt(event) && missAt(other) > spawnAt(event)).length
    if (active > C.maxTargets) throw new Error('Chart exceeds target pool: adjust spacing, read or travel time')
  }
}

// crossAt is arrival at the frozen neutral head plane (z=0).
export const duckSpawnAt = e => e.crossAt - C.duckWarningSeconds - C.duckTravelSeconds
export const duckEndAt = e => e.crossAt + C.duckCrossingSeconds / 2 + 0.5
export const duckZ = (e, t) => -C.duckSpawnDistance + Math.max(0, t - duckSpawnAt(e) - C.duckWarningSeconds) * C.duckSpawnDistance / C.duckTravelSeconds
