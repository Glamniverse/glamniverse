// Segment/slab test in play-area coordinates, expanded by the weapon radius.
// Card movement participates in collision, but NEVER in the swing-speed gate.
export function sweptCardHit(previous, current, oldCard, card, radius, halfWidth, halfHeight, halfDepth) {
  let enter = 0
  let leave = 1
  for (const axis of ['x', 'y', 'z']) {
    const extent = radius + (axis === 'x' ? halfWidth : axis === 'y' ? halfHeight : halfDepth)
    const start = previous[axis] - oldCard[axis]
    const end = current[axis] - card[axis]
    const delta = end - start
    if (Math.abs(delta) < 1e-9) {
      if (Math.abs(start) > extent) return false
    } else {
      let a = (-extent - start) / delta
      let b = (extent - start) / delta
      if (a > b) { const swap = a; a = b; b = swap }
      enter = Math.max(enter, a)
      leave = Math.min(leave, b)
      if (enter > leave) return false
    }
  }
  return true
}

export function isSwing(speed, dt, config) {
  return dt > 0 && dt <= config.maxPoseGap && Number.isFinite(speed) && speed >= config.minSwingSpeed && speed <= config.maxTrackingSpeed
}
