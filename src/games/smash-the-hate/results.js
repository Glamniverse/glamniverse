import { CONFIG as C } from './config.js'
// Weapon weighting never affects success. Missing/unplayed cards stay in denominator.
export function classifyResult(score, total, elapsed, duration) {
  const hitRate = total > 0 ? score.hits / total : 0
  const completionRate = Math.min(1, Math.max(0, elapsed / duration))
  const win = hitRate >= C.winHitRate && completionRate >= C.winCompletionRate
  return { win, hitRate, completionRate, characterState: win ? 'confident' : 'comedic-sad' }
}
// Small data interface for later supplied 2D artwork. No avatar dependency.
export const CHARACTER_STATES = {
  confident: { image: null, placeholder: 'GLAMNIVERSE: UNBOTHERED' },
  'comedic-sad': { image: null, placeholder: 'GLAMNIVERSE: COFFEE SPILLED' },
}
