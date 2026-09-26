import * as THREE from 'three'
import { ENVIRONMENTS } from './config.js'

// Private to this loft; one cached texture per visited environment, never per song.
// Scene geometry/materials are disposed by the shared world lifecycle.
export function createEnvironment(parent, loader = new THREE.TextureLoader()) {
  const material = new THREE.MeshBasicMaterial({ side: THREE.BackSide,
    depthWrite: false, toneMapped: false, color: 0x080917 })
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), material)
  sphere.renderOrder = -10; parent.add(sphere)
  const ambient = new THREE.AmbientLight(0xffffff, 1.7); parent.add(ambient)
  const cache = new Map()
  let current = null, disposed = false, status = 'idle'
  function show(record) {
    material.map = record?.ready ? record.texture : null
    material.color.setHex(record?.ready ? 0xffffff : ENVIRONMENTS[current].background)
    material.needsUpdate = true
    status = record?.ready ? 'ready' : record?.failed ? 'failed' : 'loading'
  }
  return {
    apply(id) {
      if (disposed || !ENVIRONMENTS[id]) return false
      const definition = ENVIRONMENTS[id]
      current = id; sphere.scale.setScalar(definition.radius); sphere.rotation.y = definition.yaw
      ambient.color.setHex(definition.ambient); ambient.intensity = definition.ambientIntensity
      let record = cache.get(id)
      if (!record) {
        record = { texture: null, ready: false, failed: false }; cache.set(id, record)
        record.texture = loader.load(definition.panorama, texture => {
          if (disposed) { texture.dispose(); return }
          texture.colorSpace = THREE.SRGBColorSpace
          texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter
          record.texture = texture; record.ready = true
          if (current === id) show(record)
        }, undefined, () => {
          if (disposed) return
          record.failed = true; if (current === id) show(record)
        })
      }
      show(record); return true
    },
    stats: () => ({ environmentId: current, panoramaStatus: status, panoramaTextures: cache.size }),
    dispose() {
      if (disposed) return
      disposed = true
      // Detach maps before the shared scene disposer; release cached/late textures here.
      material.map = null
      for (const record of cache.values()) record.texture?.dispose()
      cache.clear()
    },
  }
}
