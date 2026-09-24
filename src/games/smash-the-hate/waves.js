import * as THREE from 'three'
import { CONFIG as C } from './config.js'

// One pooled arc at a time; explicit chart starts. Geometry never enters body corridor.
export function createMusicWaves(root, events) {
  const count = Math.max(2, Math.min(48, C.maxWaveNotes, C.waveNotes))
  const notes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), count * 5)
  notes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); notes.frustumCulled = false
  notes.visible = false; root.add(notes)
  const dummy = new THREE.Object3D(); const tint = new THREE.Color()
  for (let i = 0; i < count * 5; i++) notes.setColorAt(i, tint.setHex([0x952de0, 0xec35c6, 0x48bdd9][Math.floor(i / 5) % 3]))
  let active = false
  return {
    reset() { notes.visible = active = false },
    stats: () => ({ activeWaveNotes: active ? count : 0, maxWaveNotes: count, waveDrawCalls: active ? 1 : 0 }),
    update(time, playing) {
      active = false
      if (playing) for (let waveIndex = 0; waveIndex < events.length; waveIndex++) {
        const wave = events[waveIndex]
        const progress = (time - wave.at - C.chartOffsetSeconds) / C.waveTravelSeconds
        if (progress < 0 || progress >= 1) continue
        active = true
        const opening = Math.min(1, progress * 2)
        for (let i = 0; i < count; i++) {
          const side = i % 2 ? 1 : -1
          const u = Math.floor(i / 2) / Math.max(1, Math.ceil(count / 2) - 1)
          const x = side * (C.waveClearance + .35 + u * C.waveWidth * (.45 + .55 * opening))
          const y = -.05 + Math.sin(u * Math.PI) * (1.2 + wave.strength) + .15 * Math.sin(i + waveIndex)
          // Curved front: outside notes trail slightly, still retire as one pool.
          const z = -C.portalDistance + progress * (C.portalDistance + C.waveBehindDistance) - Math.sin(u * Math.PI) * (1 - progress)
          for (let part = 0; part < 5; part++) {
            const p = PARTS[part]
            dummy.position.set(x + p[0], y + p[1], z)
            dummy.rotation.set(0, 0, part % 2 ? 0 : .2)
            dummy.scale.set(p[2] * wave.strength, p[3] * wave.strength, .025)
            if (i % 3 === 0 && (part === 2 || part === 3)) dummy.scale.setScalar(0)
            dummy.updateMatrix(); notes.setMatrixAt(i * 5 + part, dummy.matrix)
          }
        }
        notes.instanceMatrix.needsUpdate = true
        break
      }
      notes.visible = active
    },
  }
}
const PARTS = [[0, 0, .15, .09], [.055, .17, .035, .34], [.24, .045, .15, .09], [.295, .215, .035, .34], [.175, .35, .27, .045]]
