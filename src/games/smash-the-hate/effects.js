import * as THREE from 'three'
import { CONFIG as C } from './config.js'

export function pulseHaptic(source, strong) {
  try {
    const actuator = source?.gamepad?.hapticActuators?.[0]
    const intensity = strong ? C.hapticKeyboard : C.hapticMouse
    if (actuator?.pulse) Promise.resolve(actuator.pulse(intensity, C.hapticDurationMs)).catch(() => {})
  } catch { /* Haptics are optional. */ }
}

export function createFragments(root) {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.035, 0.006), new THREE.MeshBasicMaterial({ color: 0xc563ff }), C.fragmentPool)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false
  root.add(mesh)
  const items = Array.from({ length: C.fragmentPool }, () => ({ age: -1, p: new THREE.Vector3(), v: new THREE.Vector3() }))
  const dummy = new THREE.Object3D()
  function update(dt) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.age >= 0) {
        item.age += dt
        if (item.age >= C.fragmentLifetime) item.age = -1
        else { item.p.addScaledVector(item.v, dt); item.v.y -= dt * 0.6 }
      }
      dummy.position.copy(item.p)
      dummy.scale.setScalar(item.age < 0 ? 0 : 1 - item.age / C.fragmentLifetime)
      dummy.rotation.set(i * 0.6, item.age * 3, i * 1.4)
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }
  return {
    update,
    reset() { for (const item of items) item.age = -1; update(0) },
    burst(position, strong) {
      let count = strong ? C.keyboardFragments : C.mouseFragments
      for (let i = 0; i < items.length && count > 0; i++) {
        const item = items[i]
        if (item.age >= 0) continue
        item.age = 0; item.p.copy(position)
        item.v.set(Math.sin(i * 2.4) * 0.9, 0.3 + (i % 4) * 0.15, Math.cos(i * 1.7) * 0.5)
        count--
      }
    },
  }
}
