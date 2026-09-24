import * as THREE from 'three'
import { makePanel } from './ui.js'
import { createMusicWaves } from './waves.js'
import { FULL_LEVEL } from './level.js'
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
  const radius = C.platformDiameter / 2
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.09, 48), basic(0x080812))
  platform.position.y = -1.3; group.add(platform)
  const colors = [0x952de0, 0xec35c6, 0x48bdd9]
  const floor = []; const portal = []
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(i ? radius * .72 : radius, i ? .009 : .018, 4, 64), basic(colors[i]))
    ring.rotation.x = -Math.PI / 2; ring.position.y = -1.25; group.add(ring); floor.push(ring)
  }
  for (let i = 0; i < 3; i++) {
    const gate = new THREE.Mesh(new THREE.TorusGeometry(1.35 + i * .12, .025, 5, 64), basic(colors[i]))
    gate.position.set(0, 0, -C.portalDistance); group.add(gate); portal.push(gate)
  }
  const title = makePanel(3.4, .48, 1024, 160)
  title.draw(['SMASH THE HATE']); title.mesh.position.set(0, 1.9, -C.portalDistance); group.add(title.mesh)
  const waves = createMusicWaves(group, FULL_LEVEL.waves)
  return {
    group,
    stats: () => ({ panoramaStatus, ...waves.stats() }),
    reset() { waves.reset() },
    // The world lifecycle owns meshes/materials; guard outstanding texture callbacks.
    dispose() { disposed = true; waves.reset(); if (!panoramaMaterial.map) texture?.dispose() },
    update(time, phase, countdown = 3) {
      const playing = phase === 'playing'
      waves.update(time, playing)
      const active = playing ? 3 : phase === 'countdown' ? 4 - countdown : phase === 'results' ? 3 : 0
      const pulse = 1 + C.portalPulseAmount * Math.sin(time * C.portalPulseSpeed)
      for (let i = 0; i < 3; i++) {
        const intensity = i < active ? 0.85 : 0.25
        if (floor[i]) floor[i].material.color.setHex(colors[i]).multiplyScalar(intensity)
        portal[i].material.color.setHex(colors[i]).multiplyScalar(intensity * pulse)
      }
    },
  }
}
