import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { duckSpawnAt, duckEndAt, duckZ } from './level.js'
import { makePanel } from './ui.js'

// Baseline is a scalar copy, never the mutable tracked head vector.
export function createDuckJudge() {
  let baseline = 0; let failed = false; let observed = false
  return {
    calibrate(y) { baseline = y; failed = false; observed = false },
    begin() { failed = false; observed = false },
    sample(y) { observed = true; if (y > baseline - C.duckAmount) failed = true },
    success: () => observed && !failed,
    clearance: () => baseline - C.duckAmount,
  }
}

export function createDucks(root, events, onResult) {
  const judge = createDuckJudge()
  const group = new THREE.Group(); root.add(group); group.visible = false
  const material = new THREE.MeshBasicMaterial({ color: 0x49d6df, toneMapped: false })
  const edge = new THREE.Mesh(new THREE.BoxGeometry(C.duckWidth, 0.025, 0.025), material)
  group.add(edge)
  const top = edge.clone(); top.position.y = 0.7; group.add(top)
  for (const sign of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.7, 0.025), material)
    side.position.set(sign * C.duckWidth / 2, 0.35, 0); group.add(side)
  }
  const label = makePanel(2.5, 0.24, 1024, 128)
  label.mesh.position.y = 0.43; group.add(label.mesh)
  // A frame with an open lower area, not a full-screen opaque wall.
  let next = 0; let active = null; let judged = false
  function hide() { active = null; group.visible = false }
  return {
    reset(baseline = 0) { next = 0; hide(); judge.calibrate(baseline); judged = false },
    hide,
    stats: () => ({ activeObstacle: Boolean(active), duckClearance: judge.clearance() }),
    update(time, head) {
      if (!active && next < events.length && time >= duckSpawnAt(events[next])) {
        active = events[next++]; judged = false; judge.begin()
        group.visible = true; label.draw([active.text], '#55dddd')
      }
      if (!active) return
      group.position.set(0, judge.clearance(), duckZ(active, time))
      const start = active.crossAt - C.duckCrossingSeconds / 2
      const end = active.crossAt + C.duckCrossingSeconds / 2
      if (!judged && time >= start && time <= end) judge.sample(head.y)
      if (!judged && time > end) {
        judged = true; const success = judge.success()
        onResult(success)
        // Feedback once, with no flash or camera effect.
        label.draw([success ? 'DRAMA AVOIDED' : 'DRAMA FOUND YOU'], '#55dddd')
      }
      if (time >= duckEndAt(active)) hide()
    },
  }
}
