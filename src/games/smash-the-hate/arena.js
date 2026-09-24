import * as THREE from 'three'
import { makePanel } from './ui.js'

export function createArena(scene) {
  scene.background = new THREE.Color(0x020109)
  const group = new THREE.Group()
  scene.add(group)
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.18, 64), new THREE.MeshBasicMaterial({ color: 0x090819 }))
  platform.position.y = -1.25
  group.add(platform)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.025, 6, 80), new THREE.MeshBasicMaterial({ color: 0x8222aa }))
  ring.rotation.x = -Math.PI / 2; ring.position.y = -1.15
  group.add(ring)
  const portal = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.035, 6, 64), new THREE.MeshBasicMaterial({ color: 0x442277 }))
  portal.position.set(0, 0.65, -7)
  group.add(portal)
  const title = makePanel(3.3, 0.55, 1024, 160)
  title.draw(['SMASH THE HATE']); title.mesh.position.set(0, 2.5, -7)
  group.add(title.mesh)
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x14132a }), 24)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < 24; i++) {
    const angle = i * Math.PI * 2 / 24
    dummy.position.set(Math.sin(angle) * 26, -2, Math.cos(angle) * 26)
    dummy.scale.set(1.5, 3 + (i * 7 % 9), 1.5); dummy.updateMatrix()
    buildings.setMatrixAt(i, dummy.matrix)
  }
  group.add(buildings)
  const positions = new Float32Array(240 * 3)
  for (let i = 0; i < 240; i++) {
    positions[i * 3] = Math.sin(i * 17.3) * 45
    positions[i * 3 + 1] = 3 + (i * 13 % 29)
    positions[i * 3 + 2] = Math.cos(i * 8.7) * 45
  }
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3))
  group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.045, color: 0x8173aa })))
  return {
    group,
    update(time, playing) {
      const pulse = playing ? 0.8 + 0.2 * Math.sin(time * 2) : 0.2
      ring.material.color.setRGB(pulse * 0.7, 0.03, pulse)
      portal.material.color.setRGB(pulse * 0.4, 0.06, pulse * 0.8)
    },
  }
}
