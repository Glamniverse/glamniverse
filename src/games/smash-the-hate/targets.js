import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { spawnAt, missAt, cardZ } from './level.js'

export function createTargets(root, level, onMiss) {
  // One pre-rendered atlas. Each pooled material gets a small texture view;
  // no canvas updates, text layout or geometry creation during the round.
  const strings = [...new Set(level.events.map(event => event.text))]
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 256 * strings.length
  const ctx = canvas.getContext('2d')
  strings.forEach((text, i) => {
    const y = i * 256
    ctx.fillStyle = '#10091e'; ctx.fillRect(0, y, 1024, 256)
    ctx.strokeStyle = i % 2 ? '#62cfff' : '#eb63ef'; ctx.lineWidth = 12; ctx.strokeRect(6, y + 6, 1012, 244)
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 72px sans-serif'
    ctx.fillText(text, 512, y + 128, 950)
  })
  const geometry = new THREE.PlaneGeometry(C.cardWidth, C.cardHeight)
  const entries = Array.from({ length: C.maxTargets }, () => {
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter
    texture.repeat.y = 1 / strings.length
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }))
    mesh.visible = false; root.add(mesh)
    return { mesh, event: null, position: mesh.position, previous: new THREE.Vector3() }
  })
  let next = 0
  return {
    entries,
    reset() { next = 0; for (const entry of entries) { entry.event = null; entry.mesh.visible = false } },
    hide() { for (const entry of entries) { entry.event = null; entry.mesh.visible = false } },
    consume(entry) { if (!entry.event) return false; entry.event = null; entry.mesh.visible = false; return true },
    update(time, head) {
      for (const entry of entries) {
        if (!entry.event) continue
        entry.previous.copy(entry.position)
        entry.position.z = cardZ(entry.event, time)
        // Yaw-only facing; travel remains on the calibrated straight lane.
        entry.mesh.rotation.y = Math.atan2(head.x - entry.position.x, head.z - entry.position.z)
        if (time >= missAt(entry.event)) { entry.event = null; entry.mesh.visible = false; onMiss() }
      }
      while (next < level.events.length && time >= spawnAt(level.events[next])) {
        const event = level.events[next++]
        if (time >= missAt(event)) { onMiss(); continue }
        const entry = entries.find(item => !item.event)
        if (!entry) throw new Error('Target pool exhausted; chart/config overlap is invalid')
        entry.event = event; entry.mesh.visible = true
        entry.position.set(event.lane * C.laneOffset, -C.targetBelowEyes, cardZ(event, time))
        entry.previous.copy(entry.position)
        entry.mesh.rotation.y = 0
        entry.mesh.material.map.offset.y = 1 - (strings.indexOf(event.text) + 1) / strings.length
      }
    },
  }
}
