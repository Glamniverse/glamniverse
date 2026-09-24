import { CONFIG as C } from './config.js'

// TEMPORARY FUNCTIONAL CHART. These timestamps are NOT a final musical beat map.
// hitAt = arrival at the comfortable hit plane; spawn is read+travel seconds earlier.
export const DEMO_LEVEL = {
  id: 'i-am-confident-prototype-01',
  audio: '/audio/smash-the-hate/i-am-confident.mp3',
  duration: 36,
  events: [
    { id: 'a', hitAt: 6, lane: -1, text: 'WHO ASKED?' },
    { id: 'b', hitAt: 10, lane: 1, text: 'CRINGE' },
    { id: 'c', hitAt: 14, lane: -1, text: 'NOBODY CARES' },
    { id: 'd', hitAt: 20, lane: -1, text: 'TRY HARDER' },
    { id: 'e', hitAt: 20, lane: 1, text: 'NOT GOOD ENOUGH' },
    { id: 'f', hitAt: 25, lane: 1, text: 'JUST QUIT' },
    { id: 'g', hitAt: 29, lane: -1, text: 'CRINGE' },
    { id: 'h', hitAt: 33, lane: 1, text: 'WHO ASKED?' },
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
