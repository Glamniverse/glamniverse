import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { COMMENTS, selectComments } from './comments.js'
import { spawnAt, missAt, cardZ, laneX } from './level.js'

export function createTargets(root, level, onMiss) {
  // One compact atlas shared by ALL six cards, not six full-size texture copies.
  const columns = 4; const tileWidth = 512; const tileHeight = 128
  const rows = Math.ceil(COMMENTS.length / columns)
  const canvas = document.createElement('canvas'); canvas.width = columns * tileWidth; canvas.height = rows * tileHeight
  const ctx = canvas.getContext('2d')
  COMMENTS.forEach((text, i) => {
    const x = i % columns * tileWidth; const y = Math.floor(i / columns) * tileHeight
    ctx.fillStyle = '#10091e'; ctx.fillRect(x, y, tileWidth, tileHeight)
    ctx.strokeStyle = i % 2 ? '#62cfff' : '#eb63ef'; ctx.lineWidth = 6; ctx.strokeRect(x + 4, y + 4, tileWidth - 8, tileHeight - 8)
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 36px sans-serif'
    ctx.fillText(text, x + tileWidth / 2, y + tileHeight / 2, tileWidth - 30)
  })
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
  const entries = Array.from({ length: C.maxTargets }, () => {
    // Tiny private UV buffer; material and texture remain shared.
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(C.cardWidth, C.cardHeight), material)
    mesh.visible = false; root.add(mesh)
    return { mesh, event: null, position: mesh.position, previous: new THREE.Vector3() }
  })
  let selected = selectComments(level.events.length, 1)
  let next = 0
  return {
    entries,
    reset(seed = 1) { selected = selectComments(level.events.length, seed); next = 0; for (const entry of entries) { entry.event = null; entry.mesh.visible = false } },
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
        entry.position.set(laneX(event.lane), -C.targetBelowEyes, cardZ(event, time))
        entry.previous.copy(entry.position)
        entry.mesh.rotation.y = 0
        const tile = selected[next - 1]
        const u = (tile % columns) / columns; const v = 1 - (Math.floor(tile / columns) + 1) / rows
        const uv = entry.mesh.geometry.attributes.uv
        // Half-pixel inset prevents neighbouring text bleeding at tile edges.
        const dx = 0.5 / canvas.width; const dy = 0.5 / canvas.height
        uv.setXY(0, u + dx, v + 1 / rows - dy); uv.setXY(1, u + 1 / columns - dx, v + 1 / rows - dy)
        uv.setXY(2, u + dx, v + dy); uv.setXY(3, u + 1 / columns - dx, v + dy)
        uv.needsUpdate = true
      }
    },
  }
}
