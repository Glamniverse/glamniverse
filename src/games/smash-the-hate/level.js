import { CONFIG as C } from './config.js'
import { SECTIONS, DUCKS, WAVES } from './chart.js'

// Expand only authored DOUBLE entries once on module load; no random timing.
export const FULL_LEVEL = {
  id: 'i-am-confident-full-song-v1',
  audio: '/audio/smash-the-hate/i-am-confident.mp3',
  duration: 182.4, // measured gapless MP3 duration; results wait for actual audio end
  sections: SECTIONS,
  events: SECTIONS.flatMap(section => section.hits.flatMap(([hitAt, lane], index) =>
    (lane === 'DOUBLE' ? ['L', 'R'] : [lane]).map(side => ({
      id: `${section.name}-${index}-${side}`, hitAt, lane: side, section: section.name,
    })))),
  ducks: DUCKS,
  waves: WAVES,
}
export const arrivalAt = event => event.hitAt + C.chartOffsetSeconds
export const spawnAt = event => arrivalAt(event) - C.portalLeadSeconds - C.readSeconds - C.travelSeconds
export const cardSpeed = () => (C.spawnDistance - C.hitDistance) / C.travelSeconds
export const missAt = event => arrivalAt(event) + (C.hitDistance + C.missBehind) / cardSpeed()
export const strikeAt = event => arrivalAt(event) - (C.strikeAreaDistance - C.hitDistance) / cardSpeed()
export const laneX = lane => lane === 'L_OUT' ? -C.outerLaneOffset : lane === 'R_OUT' ? C.outerLaneOffset : C.lanePositions[lane]
export function cardZ(event, time) {
  const age = time - spawnAt(event)
  if (age < C.portalLeadSeconds) return -C.portalDistance + (C.portalDistance - C.spawnDistance) * Math.max(0, age) / C.portalLeadSeconds
  return -C.spawnDistance + Math.max(0, age - C.portalLeadSeconds - C.readSeconds) * cardSpeed()
}
export const duckCrossAt = e => e.crossAt + C.chartOffsetSeconds
export const duckSpawnAt = e => duckCrossAt(e) - C.portalLeadSeconds - C.duckWarningSeconds - C.duckTravelSeconds
export const duckEndAt = e => duckCrossAt(e) + C.duckCrossingSeconds / 2 + 0.5
export function duckZ(e, t) {
  const age = t - duckSpawnAt(e)
  if (age < C.portalLeadSeconds) return -C.portalDistance + (C.portalDistance - C.duckSpawnDistance) * Math.max(0, age) / C.portalLeadSeconds
  return -C.duckSpawnDistance + Math.max(0, age - C.portalLeadSeconds - C.duckWarningSeconds) * C.duckSpawnDistance / C.duckTravelSeconds
}

function peak(events, start, end) {
  // Half-open lifetime intervals: a retired target frees its slot immediately.
  return Math.max(0, ...events.map(e => events.filter(other => start(other) <= start(e) && end(other) > start(e)).length))
}
export function chartLimits(level) {
  return { pooled: peak(level.events, spawnAt, missAt), near: peak(level.events, strikeAt, missAt) }
}
export function validateLevel(level) {
  if (!(C.portalLeadSeconds > 0 && C.portalDistance >= C.spawnDistance && C.spawnDistance > C.strikeAreaDistance && C.strikeAreaDistance >= C.hitDistance && C.travelSeconds > 0 && C.readSeconds >= 0 && Number.isFinite(C.chartOffsetSeconds))) throw new Error('Invalid card travel config')
  if (!(Number.isInteger(C.maxTargets) && C.maxTargets > 0 && C.maxTargets <= 6 && Number.isInteger(C.maxStrikeTargets) && C.maxStrikeTargets > 0 && C.maxStrikeTargets <= 2)) throw new Error('Invalid target caps')
  if (!(C.duckAmount > 0 && C.duckTravelSeconds > 0 && C.duckWarningSeconds >= 0 && C.duckCrossingSeconds > 0)) throw new Error('Invalid duck config')
  const ids = new Set()
  let priorDuckEnd = -Infinity
  for (const duck of level.ducks ?? []) {
    if (!Number.isFinite(duck.crossAt) || !duck.text || ids.has(duck.id) || duckSpawnAt(duck) < 0 || duckEndAt(duck) > level.duration || duckSpawnAt(duck) < priorDuckEnd) throw new Error('Invalid duck timing')
    ids.add(duck.id); priorDuckEnd = duckEndAt(duck)
    for (const card of level.events) {
      if (spawnAt(card) < duckEndAt(duck) && missAt(card) > duckSpawnAt(duck)) throw new Error('Duck/card overlap')
    }
  }
  let last = -Infinity
  for (const event of level.events) {
    if (!Number.isFinite(event.hitAt) || event.hitAt < last || spawnAt(event) < 0 || missAt(event) > level.duration || ids.has(event.id)) throw new Error('Invalid event timing/ID')
    if (!['L', 'R', 'L_OUT', 'R_OUT'].includes(event.lane) || !Number.isFinite(laneX(event.lane))) throw new Error('Invalid lane')
    last = event.hitAt; ids.add(event.id)
  }
  const limits = chartLimits(level)
  if (limits.pooled > C.maxTargets) throw new Error('Chart exceeds total target pool')
  if (limits.near > C.maxStrikeTargets) throw new Error('Chart exceeds near strike-area cap')
  let waveEnd = -Infinity
  for (const wave of level.waves ?? []) {
    const at = wave.at + C.chartOffsetSeconds
    if (!Number.isFinite(at) || at < 0 || at < waveEnd || at + C.waveTravelSeconds > level.duration || !(wave.strength > 0 && wave.strength <= 1)) throw new Error('Invalid wave timing/density')
    waveEnd = at + Math.max(C.waveMinimumGap, C.waveTravelSeconds)
  }
}
