import * as THREE from 'three'

export function makePanel(width, height, pixelWidth = 1024, pixelHeight = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = pixelWidth; canvas.height = pixelHeight
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }))
  function draw(lines, accent = '#d55cff') {
    ctx.fillStyle = '#080613'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = accent; ctx.lineWidth = 8; ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    const step = canvas.height / (lines.length + 1)
    ctx.font = `bold ${Math.min(48, step * 0.64)}px sans-serif`
    lines.forEach((line, index) => ctx.fillText(line, canvas.width / 2, step * (index + 1), canvas.width - 50))
    texture.needsUpdate = true
  }
  return { mesh, draw }
}

export function createUI(root, onAction, onBack) {
  const panel = makePanel(1.35, 0.68)
  panel.mesh.position.set(0, 0.12, -1.85)
  const action = makePanel(0.62, 0.17, 512, 128)
  action.mesh.position.set(-0.34, -0.39, -1.84)
  const back = makePanel(0.62, 0.17, 512, 128)
  back.mesh.position.set(0.34, -0.39, -1.84)
  back.draw(['BACK TO GLAMNIVERSE'])
  root.add(panel.mesh, action.mesh, back.mesh)
  const unregister = []
  return {
    bind(interaction) {
      unregister.push(interaction.addTarget(action.mesh, onAction, { owned: false }))
      unregister.push(interaction.addTarget(back.mesh, onBack, { owned: false }))
    },
    unbind() { unregister.splice(0).forEach(remove => remove()) },
    show(lines, label = null) {
      panel.draw(lines)
      panel.mesh.visible = true; back.mesh.visible = true
      action.mesh.visible = Boolean(label)
      if (label) action.draw([label], '#55ccff')
    },
    hide() { panel.mesh.visible = action.mesh.visible = back.mesh.visible = false },
  }
}
