// M1 Preview only. No replacement music: populate only with a user-approved asset.
export const AUDIO_SRC = null
export const OCEAN = Object.freeze({ radiusX: 19, radiusZ: 20, centerZ: -3, ceiling: 10,
  floorClearance: 1.35, resistance: 3.5, surfaceY: 42, far: 650 })
export const SWIM = Object.freeze({ speed: 1.15, acceleration: 1.05, drag: 1.45,
  strokeThreshold: .18, trackingSpike: 3.5, gain: 1.3, gripThreshold: .55,
  stickSpeed: .65, verticalSpeed: .45, deadzone: .22, snapDegrees: 30, snapCooldown: .45 })
export const smooth = (a,b,x) => { const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t) }
// Sand shelf, winding canyon lip, sediment ridges and a deep continuation.
export function floorHeight(x,z) {
  const lip=-8+2.4*Math.sin(x*.15)
  const drop=22*(1-smooth(lip-9,lip+2,z))
  return -5.7-drop + .65*Math.sin(x*.22+z*.09)+.42*Math.sin(z*.37-x*.13)
    + 1.5*Math.exp(-(((x+11)/5)**2))*Math.sin(z*.12+.6)
}
export const ROCKS = Object.freeze([
  [-13,-1,3.6,3.2,4], [12,1,4,3.2,3.3], [-16,-10,4,5.3,5], [15,-13,4.2,5,4],
  [-9,11,3.2,2.1,3.2], [9,12,3,2.5,3], [-23,-20,6,9,6], [24,-27,7,11,7],
])
export function seeded(seed=714) { return () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296 } }
