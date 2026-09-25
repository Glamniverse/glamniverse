import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { isSwing, sweptCardHit } from '../smash-the-hate/collision.js'

export function createHands(controllers, root, onHit) {
  const geometries = []; const materials = []; const textures = []
  const own = geometry => { geometries.push(geometry); return geometry }
  const black = new THREE.MeshBasicMaterial({ color: 0x171722 }); materials.push(black)
  const pink = new THREE.MeshBasicMaterial({ color: 0xff40b9 }); materials.push(pink)
  const cyan = new THREE.MeshBasicMaterial({ color: 0x38d9ff }); materials.push(cyan)
  const bodyGeometry = own(new THREE.SphereGeometry(1, 12, 8))
  const cuffGeometry = own(new THREE.BoxGeometry(0.08, 0.035, 0.055))
  const nailGeometry = own(new THREE.BoxGeometry(0.012, 0.008, 0.025))
  const inverse = new THREE.Matrix4()
  const items = controllers.map(entry => {
    const group = new THREE.Group(); entry.grip.add(group); group.visible = false
    const glove = new THREE.Mesh(bodyGeometry, black)
    glove.scale.set(0.055, 0.042, 0.068); glove.position.z = -0.04; group.add(glove)
    const cuff = new THREE.Mesh(cuffGeometry, pink); cuff.position.z = 0.018; group.add(cuff)
    const nails = new THREE.InstancedMesh(nailGeometry, pink, 4)
    const transform = new THREE.Object3D()
    for (let i=0;i<4;i++) { transform.position.set((i-1.5)*0.018,0.038,-0.055); transform.updateMatrix(); nails.setMatrixAt(i,transform.matrix) }
    group.add(nails)
    return { entry, group, cuff, nails, kind: null, source: null, tracked: false, ready: false,
      previous: [new THREE.Vector3()], current: [new THREE.Vector3()] }
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
        const kind = ['left','right'].includes(source?.handedness) ? source.handedness : null
        const pose = source?.gripSpace && frame ? frame.getPose(source.gripSpace, referenceSpace) : null
        const tracked = Boolean(entry.connected && pose && !pose.emulatedPosition && kind)
        if (!tracked || source !== item.source || kind !== item.kind) item.ready = false
        item.source = source; item.kind = kind; item.tracked = tracked
        item.group.visible = false
        item.cuff.material = item.nails.material = kind === 'left' ? pink : cyan
        if (!tracked) continue
        if (kind === 'left') left = true
        if (kind === 'right') right = true
      }
      for (const item of items) {
        if (!item.tracked) continue
        const { entry, kind, source } = item
        const canHit = active && left && right
        item.group.visible = canHit
        entry.grip.updateWorldMatrix(true, true)
        const count = 1
        for (let i = 0; i < count; i++) {
          const point = item.current[i]
          point.set(0, 0, -0.045)
          point.applyMatrix4(entry.grip.matrixWorld).applyMatrix4(inverse)
          const speed = dt > 0 ? point.distanceTo(item.previous[i]) / dt : 0
          if (canHit && item.ready && isSwing(speed, dt, C)) {
            for (const target of targets) {
              if (!target.event || target.event.hand !== kind) continue // Wrong hand passes through; no score/combo penalty.
              // Conservative broadphase for the card's slight horizontal facing.
              const yaw = target.mesh.rotation.y
              const halfWidth = Math.abs(Math.cos(yaw)) * C.cardWidth / 2 + Math.abs(Math.sin(yaw)) * C.cardDepth / 2
              const halfDepth = Math.abs(Math.sin(yaw)) * C.cardWidth / 2 + C.cardDepth / 2
              if (sweptCardHit(item.previous[i], point, target.previous, target.position, 0.05, halfWidth, C.cardHeight / 2, halfDepth)) onHit(target, kind, source)
            }
          }
          item.previous[i].copy(point)
        }
        item.ready = canHit && dt > 0 && dt <= C.maxPoseGap
      }
      return left && right
    },
    dispose() {
      reset(); for (const item of items) { item.nails.dispose(); item.group.removeFromParent() }
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
    },
  }
}
