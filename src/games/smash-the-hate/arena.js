import * as THREE from 'three'
import { makePanel } from './ui.js'
import { CONFIG as C } from './config.js'

export function createArena(scene) {
  scene.background = new THREE.Color(0x020109)
  const group = new THREE.Group(); scene.add(group)
  // BackSide preserves equirectangular longitude (no mirrored negative scale).
  const panoramaMaterial = new THREE.MeshBasicMaterial({ color: 0x020109, side: THREE.BackSide, depthWrite: false, toneMapped: false })
  const panorama = new THREE.Mesh(new THREE.SphereGeometry(C.panoramaRadius, 48, 24), panoramaMaterial)
  panorama.rotation.y = C.panoramaYaw; panorama.renderOrder = -10; group.add(panorama)
  let disposed = false
  let texture = null
  let panoramaStatus = 'loading'
  // Injectable browser capability guard permits headless logic tests without image IO.
  if (typeof document.createElementNS === 'function') {
    texture = new THREE.TextureLoader().load('/images/smash-the-hate/arena-360.png', loaded => {
      if (disposed) { loaded.dispose(); return }
      loaded.colorSpace = THREE.SRGBColorSpace
      loaded.generateMipmaps = false; loaded.minFilter = THREE.LinearFilter
      panoramaMaterial.color.setHex(0xffffff); panoramaMaterial.map = loaded; panoramaMaterial.needsUpdate = true
      panoramaStatus = 'ready'
    }, undefined, () => { panoramaStatus = 'failed'; console.warn('Arena panorama unavailable; dark environment retained.') })
  } else panoramaStatus = 'headless'
  const basic = color => new THREE.MeshBasicMaterial({ color, toneMapped: false })
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.16, 80), basic(0x080812))
  platform.position.y = -1.3; group.add(platform)
  const colors = [0x952de0, 0xec35c6, 0x48bdd9]
  const floor = []; const portal = []
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry([8.95, 6.5, 3.4][i], i ? 0.018 : 0.055, 5, 96), basic(colors[i]))
    ring.rotation.x = -Math.PI / 2; ring.position.y = -1.21; group.add(ring); floor.push(ring)
    const gate = new THREE.Mesh(new THREE.TorusGeometry(2.1 + i * 0.23, 0.032, 6, 80), basic(colors[i]))
    gate.position.set(0, 0.25, -7.8); group.add(gate); portal.push(gate)
  }
  const accents = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.012, 1.2), basic(0x543678), 16)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI / 8
    dummy.position.set(Math.sin(angle) * 7.7, -1.21, Math.cos(angle) * 7.7)
    dummy.rotation.set(0, angle, 0); dummy.updateMatrix(); accents.setMatrixAt(i, dummy.matrix)
  }
  group.add(accents)
  const title = makePanel(3.6, 0.5, 1024, 160)
  title.draw(['SMASH THE HATE']); title.mesh.position.set(0, 3, -7.8); group.add(title.mesh)

  // Opaque note silhouettes: heads, stems and beams share a single instanced draw.
  // No alpha cards, canvas text updates, separate per-note objects or materials.
  const streams = Math.max(1, Math.min(4, Math.floor(C.noteStreams)))
  const perStream = Math.max(1, Math.min(Math.floor(64 / streams), Math.floor(C.notesPerStream)))
  const count = streams * perStream
  const notes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), basic(0xffffff), count * 5)
  notes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); notes.frustumCulled = false; group.add(notes)
  const tint = new THREE.Color()
  for (let i = 0; i < count * 5; i++) notes.setColorAt(i, tint.setHex(colors[Math.floor(i / 5) % 3]))
  function updateNotes(time) {
    for (let i = 0; i < count; i++) {
      const stream = Math.floor(i / perStream)
      const x = ((i % perStream) * 30 / perStream + time * C.noteSpeed * (stream % 2 ? -1 : 1) + 3000) % 30 - 15
      const y = 3.8 + stream * 1.4 + 0.24 * Math.sin(x * 0.35 + stream)
      const z = -10 - stream * 6
      // Five boxes per note; alternating single/double-note silhouettes.
      for (let part = 0; part < 5; part++) {
        const second = i % 2 === 0
        const offsets = NOTE_PARTS[part]
        dummy.position.set(x + offsets[0], y + offsets[1], z)
        dummy.rotation.set(0, 0, part === 0 || part === 2 ? 0.25 : 0)
        dummy.scale.set(offsets[2], offsets[3], 0.035)
        if (!second && (part === 2 || part === 3)) dummy.scale.setScalar(0)
        dummy.updateMatrix(); notes.setMatrixAt(i * 5 + part, dummy.matrix)
      }
    }
    notes.instanceMatrix.needsUpdate = true
  }
  updateNotes(0)
  return {
    group,
    stats: () => ({ panoramaStatus, decorativeNotes: count, noteDrawCalls: 1 }),
    // The world lifecycle owns meshes/materials; guard outstanding texture callbacks.
    dispose() { disposed = true; if (!panoramaMaterial.map) texture?.dispose() },
    update(time, phase, countdown = 3) {
      const playing = phase === 'playing'
      notes.visible = playing
      if (playing) updateNotes(time)
      const active = playing ? 3 : phase === 'countdown' ? 4 - countdown : phase === 'results' ? 3 : 0
      const pulse = 1 + C.portalPulseAmount * Math.sin(time * C.portalPulseSpeed)
      for (let i = 0; i < 3; i++) {
        const intensity = i < active ? 0.85 : 0.25
        floor[i].material.color.setHex(colors[i]).multiplyScalar(intensity)
        portal[i].material.color.setHex(colors[i]).multiplyScalar(intensity * pulse)
      }
    },
  }
}
const NOTE_PARTS = [[0, 0, .15, .09], [.055, .17, .035, .34], [.24, .045, .15, .09], [.295, .215, .035, .34], [.175, .35, .27, .045]]
