import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { isSwing, sweptCardHit } from './collision.js'

export function createWeapons(controllers, root, onHit) {
  const geometries = []; const materials = []; const textures = []
  const own = geometry => { geometries.push(geometry); return geometry }
  const black = new THREE.MeshBasicMaterial({ color: 0x171722 }); materials.push(black)
  const accent = new THREE.MeshBasicMaterial({ color: 0xd44ddd }); materials.push(accent)
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 192
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, 512, 192)
  ctx.fillStyle = '#a28bbd'
  for (let y = 0; y < 4; y++) for (let x = 0; x < 12; x++) ctx.fillRect(12 + x * 40, 12 + y * 36, 30, 25)
  ctx.fillRect(140, 157, 230, 20)
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture)
  const keyMaterial = new THREE.MeshBasicMaterial({ map: texture }); materials.push(keyMaterial)
  const inverse = new THREE.Matrix4()
  const items = controllers.map(entry => {
    const group = new THREE.Group(); entry.grip.add(group); group.visible = false
    const keyboard = new THREE.Group()
    keyboard.add(new THREE.Mesh(own(new THREE.BoxGeometry(0.28, 0.024, 0.12)), black))
    const keys = new THREE.Mesh(own(new THREE.PlaneGeometry(0.268, 0.11)), keyMaterial)
    keys.rotation.x = -Math.PI / 2; keys.position.y = 0.0125; keyboard.add(keys)
    keyboard.position.z = -0.065
    const mouse = new THREE.Group()
    const body = new THREE.Mesh(own(new THREE.SphereGeometry(1, 12, 8)), black)
    body.scale.set(0.037, 0.027, 0.057); body.position.z = -0.025; mouse.add(body)
    const wheel = new THREE.Mesh(own(new THREE.BoxGeometry(0.006, 0.006, 0.018)), accent)
    wheel.position.set(0, 0.027, -0.045); mouse.add(wheel)
    group.add(keyboard, mouse)
    const offsets = [-0.11, -0.055, 0, 0.055, 0.11].map(x => new THREE.Vector3(x, 0, -0.065))
    return { entry, group, keyboard, mouse, kind: null, source: null, tracked: false, ready: false,
      offsets, previous: offsets.map(() => new THREE.Vector3()), current: offsets.map(() => new THREE.Vector3()) }
  })
  let lastTime = null
  const reset = () => { lastTime = null; for (const item of items) { item.ready = false; item.group.visible = false } }
  return {
    reset,
    sample(time, frame, referenceSpace, active, targets) {
      const dt = lastTime === null || !Number.isFinite(time) ? 0 : (time - lastTime) / 1000
      lastTime = Number.isFinite(time) ? time : null
      root.updateWorldMatrix(true, false); inverse.copy(root.matrixWorld).invert()
      let left = false; let right = false
      for (const item of items) {
        const entry = item.entry
        const source = entry.source
        const kind = source?.handedness === C.weaponHands.keyboard ? 'keyboard' : source?.handedness === C.weaponHands.mouse ? 'mouse' : null
        const pose = source?.gripSpace && frame ? frame.getPose(source.gripSpace, referenceSpace) : null
        const tracked = Boolean(entry.connected && pose && !pose.emulatedPosition && kind)
        if (!tracked || source !== item.source || kind !== item.kind) item.ready = false
        item.source = source; item.kind = kind; item.tracked = tracked
        item.group.visible = false
        item.keyboard.visible = kind === 'keyboard'; item.mouse.visible = kind === 'mouse'
        if (!tracked) continue
        if (kind === 'keyboard') left = true
        if (kind === 'mouse') right = true
      }
      for (const item of items) {
        if (!item.tracked) continue
        const { entry, kind, source } = item
        const canHit = active && left && right
        item.group.visible = canHit
        entry.grip.updateWorldMatrix(true, true)
        const count = kind === 'keyboard' ? 5 : 1
        for (let i = 0; i < count; i++) {
          const point = item.current[i]
          if (kind === 'keyboard') point.copy(item.offsets[i])
          else point.set(0, 0, -0.025)
          point.applyMatrix4(entry.grip.matrixWorld).applyMatrix4(inverse)
          const speed = dt > 0 ? point.distanceTo(item.previous[i]) / dt : 0
          if (canHit && item.ready && isSwing(speed, dt, C)) {
            for (const target of targets) {
              if (!target.event) continue
              // Conservative broadphase for the card's slight horizontal facing.
              const yaw = target.mesh.rotation.y
              const halfWidth = Math.abs(Math.cos(yaw)) * C.cardWidth / 2 + Math.abs(Math.sin(yaw)) * C.cardDepth / 2
              const halfDepth = Math.abs(Math.sin(yaw)) * C.cardWidth / 2 + C.cardDepth / 2
              if (sweptCardHit(item.previous[i], point, target.previous, target.position, kind === 'keyboard' ? 0.042 : 0.04, halfWidth, C.cardHeight / 2, halfDepth)) onHit(target, kind, source)
            }
          }
          item.previous[i].copy(point)
        }
        item.ready = canHit && dt > 0 && dt <= C.maxPoseGap
      }
      return left && right
    },
    dispose() {
      reset(); for (const item of items) item.group.removeFromParent()
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
    },
  }
}
