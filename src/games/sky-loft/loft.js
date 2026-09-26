import * as THREE from 'three'
import { CONFIG as C } from './config.js'

export function createLoft(parent) {
  const stone = new THREE.MeshStandardMaterial({ color: 0x1b1b27, roughness: 0.64, metalness: 0.12 })
  const trim = new THREE.MeshStandardMaterial({ color: 0x555363, roughness: 0.34, metalness: 0.45 })
  const fabric = new THREE.MeshStandardMaterial({ color: 0x635567, roughness: 0.94 })
  const accent = new THREE.MeshBasicMaterial({ color: 0x66d9ef, toneMapped: false })
  const box = new THREE.BoxGeometry(1, 1, 1)
  // A batch per material, even for furniture/architecture; no shadow maps.
  const batches = [[], [], [], []]
  const add = (batch, x, y, z, w, h, d) => batches[batch].push([x,y,z,w,h,d])
  add(0, 0,-0.13,0,C.width,0.26,C.depth)
  // Floating ceiling island leaves wide 360 window bays and sky views.
  add(0, 0,C.height,1,10,0.16,7)
  add(0, 0,1.1,5.6,8,2.2,0.16)
  for (const x of [-6.8,6.8]) {
    for (const z of [-5.7,5.7]) add(1,x,C.height/2,z,0.12,C.height,0.12)
    add(1,x,0.06,0,0.08,0.08,11.5)
    add(3,x,0.11,0,0.025,0.025,11.5)
  }
  for (const z of [-5.7,5.7]) {
    add(1,0,0.06,z,13.6,0.08,0.08)
    add(3,0,0.11,z,13.6,0.025,0.025)
  }
  // Low lounge behind the start area; no clutter between selector and city.
  add(2,0,0.46,3.8,5.2,0.28,1.1)
  add(2,0,0.9,4.25,5.2,0.75,0.22)
  for (const x of [-2.6,2.6]) add(2,x,0.67,3.8,0.24,0.66,1.1)
  add(1,0,0.22,3.8,4.8,0.18,0.9)
  add(0,0,0.38,2.2,2.1,0.12,0.8)
  add(1,0,0.18,2.2,1.4,0.3,0.45)
  // Calm inlaid floor lines, ceiling coves, selector pedestal.
  add(3,-3.7,4.7,1,0.025,0.025,6.4)
  add(3,3.7,4.7,1,0.025,0.025,6.4)
  add(1,0,0.55,-2.6,1.5,0.07,0.42)
  add(0,0,0.25,-2.6,0.16,0.5,0.22)
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(), rotation = new THREE.Quaternion()
  batches.forEach((items, index) => {
    const mesh = new THREE.InstancedMesh(box, [stone,trim,fabric,accent][index], items.length)
    for (let i=0;i<items.length;i++) {
      const [x,y,z,w,h,d]=items[i];position.set(x,y,z);scale.set(w,h,d)
      mesh.setMatrixAt(i,matrix.compose(position,rotation,scale))
    }
    mesh.computeBoundingSphere();parent.add(mesh)
  })
  const light = new THREE.DirectionalLight(0xffe6f4, 2.4)
  light.position.set(-4,7,-3); parent.add(light)
  return { setTheme(theme) { accent.color.set(theme.accent) }, instances: batches.reduce((n,b)=>n+b.length,0) }
}
