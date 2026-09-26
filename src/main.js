import './style.css'
import { initializeAnalytics } from './analytics.js'
import * as THREE from 'three'
import { createSmashTheHate } from './games/smash-the-hate/index.js'

document.querySelector('#app').innerHTML = `
  <main class="page">

    <section class="hero">
      <div class="overlay"></div>

      <div class="hero-content">
        <p class="eyebrow">WELCOME TO</p>
        <h1>GLAMNIVERSE</h1>
        <p class="subtitle">A cinematic AI-assisted music universe.</p>

        <div class="main-buttons">
          <a href="#music" class="btn primary">🎵 Listen Now</a>
          <a href="#vibes" class="btn">✨ Check the Glamniverse Vibes</a>
          <a href="#neon-city" class="btn">🌌 Enter Glamniverse VR</a>
        </div>
      </div>
    </section>

    <section id="music" class="section">
      <h2>Listen to Glamniverse</h2>

      <p class="section-text">
        Stream Glamniverse on your favorite platform.
      </p>

      <div class="platform-grid">
        <a class="platform-card" href="https://open.spotify.com/artist/2jGmlSRyCYy06OOtvn9cEf?si=_1H8oS9fTm6035qMZx2oew" target="_blank">
          🎵 Listen on Spotify
        </a>

        <a class="platform-card" href="https://music.apple.com/ro/artist/glamniverse/6771870759?l=ro" target="_blank">
          🍎 Listen on Apple Music
        </a>

        <a class="platform-card" href="https://youtube.com/@glamniverse?si=hhJgxYC5AsBKEqMR" target="_blank">
          ▶ Watch on YouTube
        </a>
      </div>
    </section>

    <section id="vibes" class="section dark">
      <h2>Check the Glamniverse Vibes</h2>

      <p class="section-text">
        Choose a song and enter its mood.
      </p>

      <div class="song-grid">
        <article class="song-card pink">
          <h3>Neon Therapy</h3>
          <p>Healing through lights, rhythm and escape.</p>
          <button class="play-song-btn" onclick="openSongExperience('neonTherapy')">
            Play song
          </button>
        </article>

        <article class="song-card neon">
          <h3>In His Mind</h3>
          <p>Obsession, fantasy and neon thoughts.</p>
          <button class="play-song-btn" onclick="openSongExperience('inHisMind')">
            Play song
          </button>
        </article>

        <article class="song-card violet">
          <h3>Almost Love</h3>
          <p>A story that almost became forever.</p>
          <button class="play-song-btn" onclick="openSongExperience('almostLove')">
            Play song
          </button>
        </article>

        <article class="song-card orange">
          <h3>Late Night Drives</h3>
          <p>Fast roads, city lights and emotional freedom.</p>
          <button class="play-song-btn" onclick="openSongExperience('lateNightDrives')">
            Play song
          </button>
        </article>
      </div>
    </section>

    <section id="neon-city" class="section neon-city">
      <h2>GLAMNIVERSE VR</h2>

      <p class="section-text">
        Enter the music. Explore the worlds.
      </p>

      <div class="city-box">
        <h3>Musical worlds to explore.</h3>
        <p>
          Explore Neon Therapy, In His Mind, Late Night Drives and Almost Love.
        </p>
        <button onclick="openPortalWorld()">
          Explore the musical worlds
        </button>
      </div>
      <div class="vr-experiences" aria-labelledby="vr-experiences-title">
        <h3 id="vr-experiences-title">GLAMNIVERSE VR EXPERIENCES</h3>
        <p>Step inside the music.</p>
        <div id="vr-experience-grid" class="vr-experience-grid">
          <article class="vr-experience-card">
            <h4>SMASH THE HATE</h4>
            <p>Smash the hate. Feel the music.</p>
            <button onclick="openSmashTheHate()">SMASH THE HATE</button>
          </article>
        </div>
      </div>
    </section>

    <section class="section socials">
      <h2>Connect with Glamniverse</h2>

      <div class="platform-grid">
        <a class="platform-card" href="https://www.tiktok.com/@glamniverse?_r=1&_t=ZN-970rsKo1U4E" target="_blank">
          🎬 TikTok
        </a>

        <a class="platform-card" href="https://www.instagram.com/glamniverse?igsh=MTRyN2NsNWk5Z2J2Nw%3D%3D&utm_source=qr" target="_blank">
          📸 Instagram
        </a>

        <a class="platform-card" href="https://www.youtube.com/@Glamniverse" target="_blank">
          ▶ YouTube Channel
        </a>
      </div>
    </section>

    <div id="song-modal" class="song-modal hidden">
      <video id="song-video" loop playsinline muted preload="auto"></video>

      <div class="song-modal-overlay"></div>

      <div class="song-modal-content">
        <h2 id="song-title">Neon Therapy</h2>
        <p id="song-description">Healing through neon lights.</p>

        <div class="song-controls">
          <button onclick="toggleSong()">Play / Stop</button>
          <button onclick="closeSongExperience()">Back</button>
        </div>
      </div>

      <audio id="song-audio" loop preload="auto"></audio>
    </div>

    <div id="portal-world" class="portal-world hidden">
      <button class="portal-back" onclick="closePortalWorld()">← Back</button>
      <button class="district-exit hidden" id="district-exit" onclick="returnToPortal()">
  ← Exit to Portal
</button>
      <div id="portal-canvas"></div>
      <div class="control-hint">
      WASD to move • Move mouse to look around
      </div>
      <button class="portal-label label-neon" onclick="enterDistrict('neonTherapy')">
      🌆 Neon Therapy
      </button>
      <button class="portal-label label-mind" onclick="enterDistrict('inHisMind')">
      🧠 In His Mind
      </button>
      <button class="portal-label label-love" onclick="enterDistrict('almostLove')">
      ☕ Almost Love
      </button>
      <button class="portal-label label-drive" onclick="enterDistrict('lateNightDrives')">
      🚗 Late Night Drives
      </button>
      <section id="smash-info" class="smash-info hidden" aria-labelledby="smash-info-title">
        <h2 id="smash-info-title">SMASH THE HATE</h2>
        <p id="vr-info-tagline">Smash the hate. Feel the music.</p>
        <p id="vr-info-track">A Glamniverse VR experience powered by I Am Confident.</p>
        <p id="smash-support-message" role="status"></p>
        <button onclick="dismissSmashInfo()">Back to worlds</button>
      </section>
      <div id="district-confirm" class="district-confirm hidden">
      <h2 id="district-confirm-title">Enter In His Mind?</h2>
      <div class="district-confirm-buttons">
      <button onclick="confirmEnterDistrict()">Yes</button>
      <button onclick="closeDistrictConfirm()">No</button>
        </div>
        <div id="memory-modal" class="district-confirm hidden">
        <h2>Memory Unlocked</h2>

        <p id="memory-text">
         Now he can't stop listening.
        </p>

          <div class="district-confirm-buttons">
          <button onclick="closeMemory()">Close</button>
          </div>
        </div>
      </div>
    </div>

  </main>
`

// Optional, non-blocking; owner preference is checked before any analytics loads.
void initializeAnalytics({ production: import.meta.env.PROD })

const songs = {
  neonTherapy: {
    title: 'Neon Therapy',
    description: 'Healing through neon lights, futuristic roads and cinematic escape.',
    video: '/neon-therapy.mp4',
    image: '',
    audio: '/neon-therapy.mp3'
  },

  inHisMind: {
    title: 'In His Mind',
    description: 'Obsession, memory and neon thoughts inside a restless mind.',
    video: '',
    image: '/in-his-mind.png',
    audio: '/in-his-mind.mp3'
  },

  almostLove: {
    title: 'Almost Love',
    description: 'A story that almost became forever.',
    video: '',
    image: '/almost-love.png',
    audio: '/almost-love.mp3'
  },

  lateNightDrives: {
    title: 'Late Night Drives',
    description: 'Fast roads, city lights and emotional freedom.',
    video: '',
    image: '/late-night-drives.png',
    audio: '/late-night-drives.mp3'
  }
}

window.openSongExperience = function (songId) {
  if (xrState) return
  const song = songs[songId]

  const modal = document.querySelector('#song-modal')
  const video = document.querySelector('#song-video')
  const audio = document.querySelector('#song-audio')
  const title = document.querySelector('#song-title')
  const description = document.querySelector('#song-description')

  title.textContent = song.title
  description.textContent = song.description

  audio.pause()
  audio.currentTime = 0
  audio.src = song.audio
  audio.load()

  if (song.video) {
    video.style.display = 'block'
    video.src = song.video
    video.poster = ''
    video.load()
    video.play()
  } else {
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.poster = song.image
    video.style.display = 'block'
  }

  modal.classList.remove('hidden')
  audio.play()
}

window.toggleSong = function () {
  if (xrState) return
  const audio = document.querySelector('#song-audio')

  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

window.closeSongExperience = function () {
  if (xrState) return
  const modal = document.querySelector('#song-modal')
  const video = document.querySelector('#song-video')
  const audio = document.querySelector('#song-audio')

  video.pause()
  audio.pause()

  video.currentTime = 0
  audio.currentTime = 0

  modal.classList.add('hidden')
}

let portalStarted = false
let sharedRenderer = null
let activeWorld = null
let runtimeRunning = false
let runtimeGeneration = 0

function resizeRuntime() {
  if (!sharedRenderer || !activeWorld || xrState) return

  const width = Math.max(1, window.innerWidth)
  const height = Math.max(1, window.innerHeight)
  activeWorld.camera.aspect = width / height
  activeWorld.camera.updateProjectionMatrix()
  sharedRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  sharedRenderer.setSize(width, height)
}

function renderActiveWorld(time, frame) {
  const world = activeWorld
  if (!world || !sharedRenderer) return
  if (xrState && !sharedRenderer.xr.isPresenting) return

  world.update(time, frame)
  xrState?.interaction?.update(time, frame)
  if (runtimeRunning && activeWorld === world) {
    sharedRenderer.render(world.scene, world.camera)
  }
}

function stopWorldAnimation() {
  runtimeRunning = false
  runtimeGeneration += 1
  sharedRenderer?.setAnimationLoop(null)
  window.removeEventListener('resize', resizeRuntime)
}

function resumeRuntime() {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({ antialias: true })
    sharedRenderer.xr.enabled = true
    sharedRenderer.xr.setReferenceSpaceType('local')
    detectVRSupport(sharedRenderer)
    document.querySelector('#portal-canvas').appendChild(sharedRenderer.domElement)
  }
  resizeRuntime()

  if (runtimeRunning) {
    // World switches retain the scheduler, including its one pending frame.
    renderActiveWorld()
    return
  }

  runtimeRunning = true
  const generation = ++runtimeGeneration
  window.addEventListener('resize', resizeRuntime)

  function animateFrame(time, frame) {
    if (!runtimeRunning || generation !== runtimeGeneration) return

    renderActiveWorld(time, frame)
  }

  sharedRenderer.setAnimationLoop(animateFrame)
  animateFrame()
}

function startWorldAnimation(worldId, scene, camera, update, xrMemory = null, xrHooks = null) {
  document.querySelector('.control-hint').classList.toggle('hidden', (worldId === 'smashTheHate' || worldId === 'allEyesOnMe' || worldId === 'skyLoft'))
  activeWorld = { worldId, scene, camera, update, xrMemory, xrHooks }
  resumeRuntime()
  updateVRControl()
}

function disposeRuntimeRenderer() {
  removeVRControl()
  vrSupported = false
  if (!sharedRenderer) return

  sharedRenderer.dispose()
  sharedRenderer.forceContextLoss()
  sharedRenderer.domElement.remove()
  sharedRenderer = null
}

// Stationary XR uses the shared runtime; the portal remains browser-only.
const stationaryVRWorlds = new Set([
  'inHisMind', 'neonTherapy', 'lateNightDrives', 'almostLove', 'smashTheHate', 'allEyesOnMe'
])
let vrSupported = false
let vrButton = null
let xrState = null

function removeVRControl() {
  if (!vrButton) return
  vrButton.onclick = null
  vrButton.remove()
  vrButton = null
}

function updateVRControl() {
  const available = runtimeRunning && stationaryVRWorlds.has(activeWorld?.worldId) &&
    vrSupported && !xrState && !sharedRenderer?.xr.isPresenting
  if (!available) {
    removeVRControl()
    return
  }
  if (vrButton) return

  vrButton = document.createElement('button')
  vrButton.id = 'enter-vr-prototype'
  vrButton.textContent = 'ENTER VR'
  vrButton.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:10003;padding:12px 18px;border-radius:999px;border:1px solid white;background:#18002f;color:white;cursor:pointer;'
  vrButton.onclick = enterActiveWorldVR
  document.querySelector('#portal-world').appendChild(vrButton)
}

function detectVRSupport(renderer) {
  vrSupported = false
  if (!window.isSecureContext || !navigator.xr) return
  navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
    if (sharedRenderer !== renderer) return
    vrSupported = supported
    updateVRControl()
  }).catch(() => {
    if (sharedRenderer === renderer) {
      vrSupported = false
      updateVRControl()
    }
  })
}

// Borrow the existing stereo player only for the lifetime of this XR request/session.
function startVRSoundtrack(state) {
  try {
    const audio = document.querySelector('#song-audio')
    state.soundtrack = audio
    audio.pause()
    document.querySelector('#song-video').pause()
    document.querySelector('#song-modal').classList.add('hidden')

    const source = songs[state.world.worldId].audio
    if (audio.getAttribute('src') !== source) {
      audio.src = source
      audio.load()
    }
    // Stay inside the ENTER VR gesture; never await audio before requesting XR.
    audio.play()?.catch((error) => console.warn('VR soundtrack playback failed:', error))
  } catch (error) {
    console.warn('VR soundtrack playback failed:', error)
  }
}

function pauseVRSoundtrack(state) {
  state.soundtrack?.pause()
}

// Match desktop camera bounds; locomotion constrains the horizontal viewer position.
const xrLocomotionBounds = {
  inHisMind: { minZ: -2, maxZ: 8 },
  neonTherapy: { minZ: -8, maxZ: 8 },
  lateNightDrives: { minZ: -13, maxZ: 8 },
  almostLove: { minZ: -5, maxZ: 8 }
}

function createXRLocomotion(state) {
  const bounds = xrLocomotionBounds[state.world.worldId]
  const speed = 1 // world units per second; desktop movement is unchanged
  const deadzone = 0.20
  const snapAngle = THREE.MathUtils.degToRad(30)
  const headOffset = new THREE.Vector3()
  const beforeTurn = new THREE.Vector3()
  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()
  const orientation = new THREE.Quaternion()
  let lastTime = null
  let moveReady = false
  let turnReady = false

  function reset() {
    lastTime = null
    moveReady = false
    turnReady = false
  }

  function stick(controllers, hand) {
    const entry = controllers.find(entry => entry.connected && entry.controller.visible &&
      entry.source?.handedness === hand && entry.source.gamepad?.mapping === 'xr-standard')
    const axes = entry?.source.gamepad.axes
    if (!axes || !Number.isFinite(axes[2]) || !Number.isFinite(axes[3])) return null
    return { x: axes[2], y: axes[3] }
  }

  return {
    reset,
    update(time, frame, controllers, enabled) {
      if (!enabled || !frame || !Number.isFinite(time) || !bounds) { reset(); return }
      const pose = frame.getViewerPose(state.renderer.xr.getReferenceSpace())
      if (!pose) { reset(); return }
      const dt = lastTime === null ? 0 : Math.min(Math.max((time - lastTime) / 1000, 0), 0.05)
      lastTime = time
      const left = stick(controllers, 'left')
      const turn = stick(controllers, 'right')
      const origin = state.origin
      const head = pose.transform.position
      headOffset.set(head.x, head.y, head.z).applyQuaternion(origin.quaternion)

      if (!turn) turnReady = false
      else if (Math.hypot(turn.x, turn.y) < 0.25) turnReady = true
      else if (turnReady && Math.abs(turn.x) >= 0.70) {
        turnReady = false
        beforeTurn.copy(headOffset)
        origin.rotation.y -= Math.sign(turn.x) * snapAngle
        headOffset.set(head.x, head.y, head.z).applyQuaternion(origin.quaternion)
        // Pivot about the current headset, without changing origin/floor height.
        origin.position.x += beforeTurn.x - headOffset.x
        origin.position.z += beforeTurn.z - headOffset.z
      }

      if (!left) moveReady = false
      else {
        const magnitude = Math.hypot(left.x, left.y)
        if (magnitude <= deadzone) moveReady = true
        else if (moveReady) {
          const q = pose.transform.orientation
          orientation.set(q.x, q.y, q.z, q.w)
          forward.set(0, 0, -1).applyQuaternion(orientation).applyQuaternion(origin.quaternion)
          forward.y = 0
          // At a vertical gaze there is no reliable horizontal facing direction.
          if (forward.lengthSq() > 0.0001) {
            forward.normalize()
            right.set(-forward.z, 0, forward.x)
            const distance = speed * dt * (Math.min(magnitude, 1) - deadzone) / (1 - deadzone)
            const dx = (right.x * left.x - forward.x * left.y) / magnitude * distance
            const dz = (right.z * left.x - forward.z * left.y) / magnitude * distance
            const viewerX = origin.position.x + headOffset.x
            const viewerZ = origin.position.z + headOffset.z
            origin.position.x += THREE.MathUtils.clamp(viewerX + dx, -3, 3) - viewerX
            origin.position.z += THREE.MathUtils.clamp(viewerZ + dz, bounds.minZ, bounds.maxZ) - viewerZ
          }
        }
      }
      origin.updateMatrixWorld(true)
    }
  }
}

// Reuse desktop memory content, preserving explicit HTML line breaks in VR.
function xrMemoryFromOverlay(object, overlay) {
  return {
    object,
    title: overlay.querySelector('h2').textContent,
    text: Array.from(overlay.querySelector('p').childNodes,
      node => node.nodeName === 'BR' ? '\n' : node.textContent).join('')
  }
}

// Session-owned controller picking; targets are explicit, never the whole world.
function createXRControllerInteraction(state) {
  const targets = []
  const controllers = []
  const locomotion = createXRLocomotion(state)
  const resources = []
  const raycaster = new THREE.Raycaster()
  const rotation = new THREE.Matrix4()
  let disposed = false
  let memoryPanel = null
  let menuRays = true
  const enabled = () => !disposed && xrState === state && !state.cancelled &&
    !state.ended && !state.attaching && state.renderer.xr.isPresenting &&
    state.session.visibilityState === 'visible'

  function pick(entry) {
    if (!menuRays || !enabled() || !entry.connected || !entry.controller.visible) return null
    entry.controller.updateWorldMatrix(true, false)
    raycaster.ray.origin.setFromMatrixPosition(entry.controller.matrixWorld)
    rotation.extractRotation(entry.controller.matrixWorld)
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotation).normalize()
    raycaster.far = 5
    const objects = targets.filter(target => target.isEnabled()).map(target => target.object)
    for (const object of objects) object.updateWorldMatrix(true, false)
    return raycaster.intersectObjects(objects, false)[0] || null
  }

  const interaction = {
    controllers,
    setMenuRays(value) { menuRays = value },
    addTarget(object, onSelect, options = {}) {
      const baseColor = object.material.color.clone()
      const target = { object, onSelect, owned: options.owned !== false,
        isEnabled: () => object.visible && (options.enabled?.() ?? true),
        onHover: options.onHover || (hovered => object.material.color.copy(hovered ? new THREE.Color(0x66ffff) : baseColor)) }
      targets.push(target)
      return () => {
        const index = targets.indexOf(target)
        if (index !== -1) { target.onHover(false); targets.splice(index, 1) }
      }
    },
    update(time, frame) {
      locomotion.update(time, frame, controllers, enabled() && !memoryPanel?.visible && !state.world.xrHooks?.stationary)
      const hovered = new Set()
      for (const entry of controllers) {
        const hit = pick(entry)
        entry.ray.visible = menuRays && enabled() && entry.connected && entry.controller.visible
        entry.ray.scale.z = hit ? hit.distance : 5
        entry.ray.material.color.setHex(hit ? 0x66ffff : 0xffffff)
        if (hit) hovered.add(hit.object)
      }
      for (const target of targets) {
        target.onHover(hovered.has(target.object) && target.isEnabled())
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      locomotion.reset()
      for (const entry of controllers) {
        entry.controller.removeEventListener('connected', entry.onConnected)
        entry.controller.removeEventListener('disconnected', entry.onDisconnected)
        entry.controller.removeEventListener('select', entry.onSelect)
        entry.source = null
        entry.ray.removeFromParent()
        entry.controller.removeFromParent()
        entry.grip?.removeFromParent()
      }
      for (const target of targets) {
        target.onHover(false)
        if (target.owned) target.object.removeFromParent()
      }
      memoryPanel?.removeFromParent()
      memoryPanel = null
      resources.forEach(resource => resource.dispose())
      controllers.length = 0
      targets.length = 0
    }
  }
  // Register disposal before allocating, so interrupted/failed setup is cleaned too.
  state.interaction = interaction
  const own = resource => { resources.push(resource); return resource }
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const context = canvas.getContext('2d')
  context.fillStyle = '#160b2b'
  context.fillRect(0, 0, 1024, 256)
  context.strokeStyle = '#85ffff'
  context.lineWidth = 10
  context.strokeRect(5, 5, 1014, 246)
  context.fillStyle = '#ffffff'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = 'bold 66px sans-serif'
  context.fillText('EXIT TO PORTAL', 512, 105)
  context.font = '30px sans-serif'
  context.fillText('Point here and press trigger', 512, 182)
  const texture = own(new THREE.CanvasTexture(canvas))
  texture.colorSpace = THREE.SRGBColorSpace
  const button = new THREE.Mesh(own(new THREE.PlaneGeometry(1, 0.25)),
    own(new THREE.MeshBasicMaterial({ map: texture, transparent: true,
      depthTest: false, depthWrite: false, toneMapped: false })))
  button.name = 'xr-exit-to-portal'
  button.position.set(0, -0.35, -2)
  button.renderOrder = 10000
  state.origin.add(button)
  interaction.addTarget(button, () => window.returnToPortal())
  button.visible = !state.world.xrHooks?.customUI

  const memory = state.world.xrMemory
  if (memory) {
    const highlightColor = memory.object.material.emissive || memory.object.material.color
    const baseHighlight = highlightColor.clone()
    const closeMemoryPanel = () => {
      memoryPanel.visible = false
      locomotion.reset()
    }
    const openMemoryPanel = () => {
      if (memoryPanel?.visible) return
      if (!memoryPanel) {
        memoryPanel = new THREE.Group()
        memoryPanel.name = 'xr-memory-panel'
        memoryPanel.visible = false
        state.world.scene.add(memoryPanel)
        const makeCard = (width, height, draw, meshWidth, meshHeight) => {
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = 'rgba(16, 4, 32, 0.96)'
          ctx.fillRect(0, 0, width, height)
          ctx.strokeStyle = '#ff66ff'
          ctx.lineWidth = 6
          ctx.strokeRect(3, 3, width - 6, height - 6)
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          draw(ctx)
          const texture = own(new THREE.CanvasTexture(canvas))
          texture.colorSpace = THREE.SRGBColorSpace
          const card = new THREE.Mesh(own(new THREE.PlaneGeometry(meshWidth, meshHeight)),
            own(new THREE.MeshBasicMaterial({ map: texture, transparent: true,
              depthTest: false, depthWrite: false, toneMapped: false })))
          card.renderOrder = 10000
          memoryPanel.add(card)
          return card
        }
        const card = makeCard(1024, 512, ctx => {
          ctx.font = 'bold 64px sans-serif'
          ctx.fillText(memory.title, 512, 95)
          ctx.font = '48px sans-serif'
          const lines = memory.text.split('\n')
          lines.forEach((line, index) => {
            ctx.fillText(line, 512, 235 + (index - (lines.length - 1) / 2) * 64, 930)
          })
        }, 1.4, 0.7)
        card.name = 'xr-memory-content'
        const close = makeCard(512, 128, ctx => {
          ctx.font = 'bold 48px sans-serif'
          ctx.fillText('CLOSE', 256, 64)
        }, 0.5, 0.125)
        close.name = 'xr-memory-close'
        close.position.set(0, -0.24, 0.01)
        close.renderOrder = 10001
        interaction.addTarget(close, closeMemoryPanel, { enabled: () => Boolean(memoryPanel?.visible) })
      }
      const viewer = state.renderer.xr.getCamera()
      const position = viewer.getWorldPosition(new THREE.Vector3())
      const facing = new THREE.Vector3(0, 0, -1).applyQuaternion(viewer.getWorldQuaternion(new THREE.Quaternion()))
      facing.y = 0
      if (facing.lengthSq() < 0.0001) facing.set(0, 0, -1).applyQuaternion(state.origin.quaternion)
      facing.normalize()
      memoryPanel.position.copy(position).addScaledVector(facing, 1.8)
      memoryPanel.position.y += 0.15
      memoryPanel.rotation.y = Math.atan2(-facing.x, -facing.z)
      memoryPanel.visible = true
      memoryPanel.updateMatrixWorld(true)
      locomotion.reset()
    }
    interaction.addTarget(memory.object, openMemoryPanel, {
      owned: false,
      enabled: () => !memoryPanel?.visible,
      onHover: hovered => highlightColor.copy(hovered ? new THREE.Color(0xffaaff) : baseHighlight)
    })
  }

  for (let index = 0; index < 2; index++) {
    const controller = state.renderer.xr.getController(index)
    const geometry = own(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(), new THREE.Vector3(0, 0, -1)
    ]))
    const ray = new THREE.Line(geometry, own(new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.8,
      depthTest: false, depthWrite: false, toneMapped: false
    })))
    ray.name = 'xr-controller-ray'
    ray.visible = false
    ray.renderOrder = 10001
    const grip = state.world.xrHooks ? state.renderer.xr.getControllerGrip(index) : null
    if (grip) state.origin.add(grip)
    const entry = { controller, grip, ray, connected: false }
    entry.onConnected = event => {
      locomotion.reset()
      entry.source = event.data
      entry.connected = event.data.targetRayMode === 'tracked-pointer' && !event.data.hand
    }
    entry.onDisconnected = () => {
      entry.source = null
      entry.connected = false
      interaction.update()
    }
    entry.onSelect = () => {
      const hit = pick(entry)
      if (hit) targets.find(target => target.object === hit.object)?.onSelect()
    }
    controllers.push(entry)
    controller.addEventListener('connected', entry.onConnected)
    controller.addEventListener('disconnected', entry.onDisconnected)
    controller.addEventListener('select', entry.onSelect)
    controller.add(ray)
    state.origin.add(controller)
  }
  return interaction
}

function finishVR(state) {
  if (xrState !== state || state.attaching || (state.session && !state.ended)) return
  state.world.xrHooks?.onExit()
  state.interaction?.dispose()
  state.interaction = null
  pauseVRSoundtrack(state)
  state.soundtrack = null
  state.session?.removeEventListener('end', state.onEnd)

  if (state.origin) {
    state.origin.remove(state.world.camera)
    state.origin.removeFromParent()
    state.world.camera.copy(state.savedCamera, false)
    state.parent?.add(state.world.camera)
    state.world.camera.updateMatrixWorld(true)
  }
  xrState = null
  activeWorldLifecycle?.resetInput()

  // A failed/interrupted WebXR setup can leave Three's manager partially set up.
  // Recreate only that failed runtime, after the real session has ended.
  if (state.rebuildRenderer && sharedRenderer === state.renderer) {
    stopWorldAnimation()
    disposeRuntimeRenderer()
  }
  if (state.afterExit) {
    state.afterExit()
  } else if (sharedRenderer === state.renderer || state.rebuildRenderer) {
    if (!runtimeRunning) resumeRuntime()
    resizeRuntime()
  }
  updateVRControl()
}

async function endVR(state) {
  if (!state.session || state.attaching || state.ending || state.ended) return
  state.ending = true
  try {
    await state.session.end()
    state.ended = true
    finishVR(state)
  } catch (error) {
    state.ending = false
    if (state.ended) {
      finishVR(state)
    } else {
      state.afterExit = null
      window.alert(`VR could not exit. Use the headset/browser exit control. ${error.message}`)
    }
  }
}

function deferUntilVRExit(action) {
  if (!xrState) return false
  pauseVRSoundtrack(xrState)
  xrState.world.xrHooks?.onRequestExit()
  xrState.cancelled = true
  xrState.afterExit = action
  // A pending request/setup must settle before its session or renderer is released.
  endVR(xrState)
  return true
}

async function enterActiveWorldVR() {
  if (!runtimeRunning || !stationaryVRWorlds.has(activeWorld?.worldId) || !vrSupported || xrState) return
  const state = { world: activeWorld, renderer: sharedRenderer, session: null,
    attaching: false, ended: false, ending: false, cancelled: false,
    rebuildRenderer: false, afterExit: null }
  activeWorldLifecycle.resetInput()
  xrState = state
  updateVRControl()
  if (!state.world.xrHooks?.ownsAudio) startVRSoundtrack(state)

  try {
    state.session = await navigator.xr.requestSession('immersive-vr')
    state.onEnd = () => {
      if (xrState === state) pauseVRSoundtrack(state)
      state.ended = true
      if (state.attaching) state.rebuildRenderer = true
      // Let Three.js finish its own session-end listener before restoring desktop.
      queueMicrotask(() => finishVR(state))
    }
    state.session.addEventListener('end', state.onEnd)
    if (state.cancelled) {
      await endVR(state)
      return
    }

    const camera = state.world.camera
    state.savedCamera = camera.clone()
    state.parent = camera.parent
    state.origin = new THREE.Group()
    state.origin.position.copy(camera.position)
    // Keep the current heading with a level horizon; headset pose owns pitch/roll.
    state.origin.rotation.y = camera.rotation.y
    state.world.scene.add(state.origin)
    state.origin.add(camera)
    camera.position.set(0, 0, 0)
    camera.quaternion.identity()
    state.origin.updateMatrixWorld(true)

    createXRControllerInteraction(state)
    state.world.xrHooks?.onEnter(state)
    state.attaching = true
    await state.renderer.xr.setSession(state.session)
    state.attaching = false
    if (state.ended) finishVR(state)
    else if (state.cancelled) await endVR(state)
  } catch (error) {
    state.attaching = false
    state.rebuildRenderer = Boolean(state.origin)
    if (!state.cancelled) window.alert(`Unable to enter VR: ${error.message}`)
    if (state.session && !state.ended) await endVR(state)
    else finishVR(state)
  }
}

let activeWorldLifecycle = null

function disposeCurrentWorld() {
  dismissSmashInfo()
  // Detach the outgoing update before disposing its scene and input.
  activeWorld?.xrHooks?.dispose()
  activeWorld = null
  activeWorldLifecycle?.dispose()
  activeWorldLifecycle = null
  sharedRenderer?.renderLists.dispose()
}

function createWorldLifecycle(scene) {
  const listeners = []
  const nodes = new Set()
  const extraResources = new Set()
  const inputResets = []
  let suspended = false
  let disposed = false

  function resetInput() {
    inputResets.forEach((reset) => reset())
  }

  function releaseGraphics() {
    // Resources are private to this world; Sets deduplicate materials/textures
    // shared by several objects within the same scene.
    const resources = new Set()
    function collect(resource) {
      if (!resource || resources.has(resource)) return
      if (Array.isArray(resource)) {
        resource.forEach(collect)
      } else if (resource.isObject3D) {
        resource.traverse((object) => {
          collect(object.geometry)
          collect(object.material)
        })
      } else if (resource.isMaterial) {
        resources.add(resource)
        Object.values(resource).forEach((value) => {
          if (value?.isTexture) collect(value)
        })
      } else if (resource.isTexture || resource.isBufferGeometry) {
        resources.add(resource)
      }
    }
    collect(scene)
    collect(scene.background)
    collect(scene.environment)
    extraResources.forEach(collect)
    resources.forEach((resource) => resource.dispose())
  }

  const lifecycle = {
    resetInput,
    listen(target, type, handler, options) {
      const guardedHandler = (event) => {
        if (!suspended && !disposed && !xrState) handler(event)
      }
      listeners.push({ target, type, handler: guardedHandler, options })
      target.addEventListener(type, guardedHandler, options)
    },
    resetInputWith(reset) {
      inputResets.push(reset)
    },
    ownNode(node) {
      nodes.add(node)
    },
    ownResource(resource) {
      extraResources.add(resource)
    },
    suspend() {
      if (suspended || disposed) return
      suspended = true
      resetInput()
      listeners.forEach(({ target, type, handler, options }) => {
        target.removeEventListener(type, handler, options)
      })
      nodes.forEach((node) => {
        node.style.display = 'none'
        node.remove()
      })
      releaseGraphics()
    },
    resume() {
      if (!suspended || disposed) return
      // Retain the current CPU scene for Step 1's close/reopen behavior.
      nodes.forEach((node) => document.body.appendChild(node))
      resetInput()
      suspended = false
      listeners.forEach(({ target, type, handler, options }) => {
        target.addEventListener(type, handler, options)
      })
    },
    dispose() {
      if (disposed) return
      lifecycle.suspend()
      disposed = true
      nodes.forEach((node) => {
        node.querySelectorAll('*').forEach((child) => { child.onclick = null })
        node.onclick = null
      })
      scene.clear()
      nodes.clear()
      extraResources.clear()
      listeners.length = 0
      inputResets.length = 0
    }
  }

  lifecycle.listen(window, 'blur', resetInput)
  lifecycle.listen(document, 'visibilitychange', () => {
    if (document.hidden) resetInput()
  })
  activeWorldLifecycle = lifecycle
  return lifecycle
}

window.openPortalWorld = function () {
  const world = document.querySelector('#portal-world')

  world.classList.remove('hidden')

  if (portalStarted) {
    if (activeWorld && !runtimeRunning) {
      activeWorldLifecycle.resume()
      resumeRuntime()
      updateVRControl()
    }
    return
  }
  portalStarted = true
  disposeCurrentWorld()

  const scene = new THREE.Scene()
  const lifecycle = createWorldLifecycle(scene)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xff66ff, 30)
  pointLight.position.set(0, 2, 6)
  scene.add(pointLight)
  scene.background = new THREE.Color(0x050010)

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  camera.position.z = 8


  const portalGeometry = new THREE.TorusGeometry(2, 0.18, 32, 100)
  const portalMaterial = new THREE.MeshStandardMaterial({
  color: 0xff3df2,
  emissive: 0xff00ff,
  emissiveIntensity: 1.2,
  metalness: 0.4,
  roughness: 0.2
  })

  const portal = new THREE.Mesh(portalGeometry, portalMaterial)
  portal.rotation.x = -0.25
  portal.rotation.y = 0.25
  scene.add(portal)

  const centerGeometry = new THREE.CircleGeometry(1.6, 64)
  const centerMaterial = new THREE.MeshBasicMaterial({
    color: 0x220044,
    transparent: true,
    opacity: 0.75
  })

  const center = new THREE.Mesh(centerGeometry, centerMaterial)
  scene.add(center)

  const destinations = [
    { name: 'Neon Therapy', x: 0, y: 3.5, color: 0x00b7ff },
    { name: 'In His Mind', x: 4, y: 0, color: 0x8f5cff },
    { name: 'Almost Love', x: -4, y: 0, color: 0xff4fd8 },
    { name: 'Late Night Drives', x: 0, y: -3.5, color: 0xff8a3d }
  ]

  destinations.forEach((destination) => {
    const geometry = new THREE.SphereGeometry(0.35, 32, 32)
    const material = new THREE.MeshStandardMaterial({
    color: destination.color,
    emissive: destination.color,
    emissiveIntensity: 0.8,
    metalness: 0.3,
    roughness: 0.25
  })
    const sphere = new THREE.Mesh(geometry, material)

    sphere.position.set(destination.x, destination.y, 0)
    scene.add(sphere)
  })

const starGeometry = new THREE.BufferGeometry()
const starCount = 700
const starPositions = []

for (let i = 0; i < starCount; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 60,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40
  )
}

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starPositions, 3)
)

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.04
})

const stars = new THREE.Points(starGeometry, starMaterial)
scene.add(stars)

  function animate() {

    portal.rotation.z += 0.01
    center.rotation.z -= 0.006
    stars.rotation.y += 0.0008

  }

  startWorldAnimation('portal', scene, camera, animate)

}

window.closePortalWorld = function () {
  if (deferUntilVRExit(() => window.closePortalWorld())) return
  dismissSmashInfo()
  stopWorldAnimation()
  activeWorld?.xrHooks?.suspend()
  activeWorldLifecycle?.suspend()
  disposeRuntimeRenderer()
  selectedDistrict = null
  document.querySelector('#district-confirm').classList.add('hidden')
  document.querySelector('#memory-modal').classList.add('hidden')
  const world = document.querySelector('#portal-world')
  document.querySelector('#memory-overlay')?.style.setProperty('display', 'none')
  document.querySelector('#neon-memory-overlay')?.style.setProperty('display', 'none')
  world.classList.add('hidden')
}

let selectedDistrict = null

const districtData = {
  inHisMind: {
    title: 'In His Mind',
    background: 0x12002e
  },

neonTherapy: {
  title: 'Neon Therapy',
  background: 0x001a33
},

lateNightDrives: {
  title: 'Late Night Drives',
  background: 0x050010
},

almostLove: {
  title: 'Almost Love',
  background: 0x2a001c
}
}

window.enterDistrict = function (districtId) {
  selectedDistrict = districtId

  const district = districtData[districtId]
  const confirmBox = document.querySelector('#district-confirm')
  const confirmTitle = document.querySelector('#district-confirm-title')

  confirmTitle.textContent = `Enter ${district.title}?`
  confirmBox.classList.remove('hidden')
}

window.closeDistrictConfirm = function () {
  document.querySelector('#district-confirm').classList.add('hidden')
}

window.confirmEnterDistrict = function () {
  if (deferUntilVRExit(() => window.confirmEnterDistrict())) return
  closeDistrictConfirm()

  if (selectedDistrict === 'inHisMind') {
    showInHisMindRoom()
  }

  if (selectedDistrict === 'neonTherapy') {
    showNeonTherapyRoom()
  }

  if (selectedDistrict === 'lateNightDrives') {
  showLateNightDrivesRoom()
}

if (selectedDistrict === 'almostLove') {
  showAlmostLoveRoom()
}
}

// Check capability before creating the game or loading its audio/panorama.
// Invalidate pending checks on close/world changes so late answers cannot reopen it.
let smashEntryRequest = 0
function dismissSmashInfo() {
  smashEntryRequest++
  document.querySelector('#smash-info').classList.add('hidden')
  document.querySelector('.control-hint').classList.toggle('hidden', activeWorld?.worldId === 'smashTheHate')
}
window.dismissSmashInfo = dismissSmashInfo

// One capability check and warning surface; optional copy supports Preview experiences.
async function checkVRExperienceSupport(experience, copy = null) {
  // The public route always uses the established portal container/runtime.
  if (document.querySelector('#portal-world').classList.contains('hidden')) window.openPortalWorld()
  const attempt = ++smashEntryRequest
  const eyes = experience === 'allEyesOnMe'
  document.querySelector('#smash-info-title').textContent = copy?.title ?? (eyes ? 'ALL EYES ON ME — VR FITNESS' : 'SMASH THE HATE')
  document.querySelector('#vr-info-tagline').textContent = copy?.tagline ?? (eyes ? 'All eyes on you. Keep moving.' : 'Smash the hate. Feel the music.')
  document.querySelector('#vr-info-track').textContent = copy?.description ?? `A Glamniverse VR experience powered by ${eyes ? 'All Eyes On Me' : 'I Am Confident'}.`
  document.querySelector('#smash-info').classList.remove('hidden')
  document.querySelector('.control-hint').classList.add('hidden')
  const message = document.querySelector('#smash-support-message')
  message.textContent = 'Checking VR support…'
  let supported = false
  try {
    supported = !!(window.isSecureContext && navigator.xr && await navigator.xr.isSessionSupported('immersive-vr'))
  } catch (error) {
    console.warn('Unable to check immersive VR support:', error)
  }
  if (attempt !== smashEntryRequest) return false
  if (!supported) {
    message.textContent = (eyes || copy)
      ? 'VR HEADSET REQUIRED. Open Glamniverse in Meta Quest Browser for the full experience.'
      : 'VR headset required for the full experience. Open Glamniverse in Meta Quest Browser to play.'
    return false
  }
  return true
}

window.openSmashTheHate = async function () {
  if (deferUntilVRExit(() => window.openSmashTheHate())) return
  if (!await checkVRExperienceSupport('smashTheHate')) return
  disposeCurrentWorld()
  document.querySelectorAll('.portal-label').forEach(label => { label.style.display = 'none' })
  document.querySelector('#district-confirm').classList.add('hidden')
  document.querySelector('#district-exit').classList.remove('hidden')
  document.querySelector('#song-modal').classList.add('hidden')
  document.querySelector('#song-video').pause()
  const game = createSmashTheHate({ audio: document.querySelector('#song-audio'), back: () => window.returnToPortal() })
  createWorldLifecycle(game.scene)
  startWorldAnimation('smashTheHate', game.scene, game.camera, game.update, null, game.xrHooks)
}

// Public release: both games share capability gating before world creation.
{
  import('./games/all-eyes-on-me/index.js').then(({ createAllEyesOnMe }) => {
    const entry = document.createElement('button')
    entry.id = 'all-eyes-entry'
    const card = document.createElement('article')
    card.className = 'vr-experience-card'
    const title = document.createElement('h4'); title.textContent = 'ALL EYES ON ME — VR FITNESS'
    const description = document.createElement('p'); description.textContent = 'All eyes on you. Keep moving.'
    card.append(title, description, entry)
    entry.textContent = 'ALL EYES ON ME — VR FITNESS'
    async function openEyes() {
      if (deferUntilVRExit(openEyes)) return
      if (!await checkVRExperienceSupport('allEyesOnMe')) return
      disposeCurrentWorld()
      document.querySelectorAll('.portal-label').forEach(label => { label.style.display = 'none' })
      document.querySelector('#district-confirm').classList.add('hidden')
      document.querySelector('#district-exit').classList.remove('hidden')
      document.querySelector('#song-modal').classList.add('hidden')
      document.querySelector('#song-video').pause()
      const game = createAllEyesOnMe({ audio: document.querySelector('#song-audio'), back: () => window.returnToPortal() })
      createWorldLifecycle(game.scene)
      startWorldAnimation('allEyesOnMe', game.scene, game.camera, game.update, null, game.xrHooks)
    }
    entry.onclick = openEyes
    // Normal document flow: no overlay on any district or music control.
    document.querySelector('#vr-experience-grid').appendChild(card)
  }).catch(error => console.warn('All Eyes On Me entry unavailable:', error))
}


// Fail closed outside Vite dev / Vercel Preview. Rollup removes the loft import
// and entry from ordinary Production builds; no hostname guessing or settings changes.
if (import.meta.env.DEV || import.meta.env.VITE_VERCEL_ENV === 'preview') {
  stationaryVRWorlds.add('skyLoft')
  import('./games/sky-loft/index.js').then(({ createSkyLoft }) => {
    const card = document.createElement('article')
    card.className = 'vr-experience-card'
    const title = document.createElement('h4'); title.textContent = 'THE SKY LOFT'
    const description = document.createElement('p'); description.textContent = 'Choose a song. Change your reality.'
    const entry = document.createElement('button'); entry.id = 'sky-loft-entry'; entry.textContent = 'THE SKY LOFT — M1 PREVIEW'
    card.append(title, description, entry)
    async function openLoft() {
      if (deferUntilVRExit(openLoft)) return
      if (!await checkVRExperienceSupport('skyLoft', {
        title: 'THE SKY LOFT', tagline: 'Choose a song. Change your reality.',
        description: 'A Glamniverse VR loft. M1 music-selector preview.',
      })) return
      disposeCurrentWorld()
      document.querySelectorAll('.portal-label').forEach(label => { label.style.display = 'none' })
      document.querySelector('#district-confirm').classList.add('hidden')
      document.querySelector('#district-exit').classList.remove('hidden')
      document.querySelector('#song-modal').classList.add('hidden')
      document.querySelector('#song-video').pause()
      document.querySelector('#song-audio').pause()
      const loft = createSkyLoft({ back: () => window.returnToPortal() })
      createWorldLifecycle(loft.scene)
      startWorldAnimation('skyLoft', loft.scene, loft.camera, loft.update, null, loft.xrHooks)
    }
    entry.onclick = openLoft
    document.querySelector('#vr-experience-grid').appendChild(card)
  }).catch(error => console.warn('Sky Loft Preview entry unavailable:', error))
}
function showInHisMindRoom() {
  disposeCurrentWorld()
  document.querySelectorAll('.portal-label').forEach((label) => {
  label.style.display = 'none'
})

document.querySelector('#district-exit').classList.remove('hidden')
  const scene = new THREE.Scene()
  const lifecycle = createWorldLifecycle(scene)
  const skyTexture = new THREE.TextureLoader().load('/in-his-mind-360.png')

const skySphere = new THREE.Mesh(
  new THREE.SphereGeometry(100, 64, 64),
  new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    depthWrite: false
  })
)

scene.add(skySphere)

  scene.background = new THREE.Color(0x080014)
  const cosmicCanvas = document.createElement('canvas')
cosmicCanvas.width = 1024
cosmicCanvas.height = 1024

const cosmicCtx = cosmicCanvas.getContext('2d')

const gradient = cosmicCtx.createRadialGradient(512, 512, 80, 512, 512, 512)
gradient.addColorStop(0, '#4b006e')
gradient.addColorStop(0.35, '#18002f')
gradient.addColorStop(1, '#020008')

cosmicCtx.fillStyle = gradient
cosmicCtx.fillRect(0, 0, 1024, 1024)

for (let i = 0; i < 450; i++) {
  const x = Math.random() * 1024
  const y = Math.random() * 1024
  const size = Math.random() * 2.2

  cosmicCtx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.75})`
  cosmicCtx.beginPath()
  cosmicCtx.arc(x, y, size, 0, Math.PI * 2)
  cosmicCtx.fill()
}

const cosmicTexture = new THREE.CanvasTexture(cosmicCanvas)

const skyGeometry = new THREE.SphereGeometry(100, 64, 64)
const skyMaterial = new THREE.MeshBasicMaterial({
  map: cosmicTexture,
  side: THREE.BackSide
})

const cosmicSky = new THREE.Mesh(skyGeometry, skyMaterial)
// scene.add(cosmicSky)

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  camera.position.set(0, 1.5, 7)
  let mouseX = 0
  let mouseY = 0

lifecycle.listen(window, 'mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth - 0.5) * 2
  mouseY = (event.clientY / window.innerHeight - 0.5) * 2
})

const keys = {}
  lifecycle.resetInputWith(() => {
    Object.keys(keys).forEach((key) => { delete keys[key] })
  })
let memoryOpened = false
let nearCore = false

lifecycle.listen(window, 'keydown', (event) => {
  const key = event.key.toLowerCase()
  keys[key] = true

  if (key === 'e' && nearCore && !memoryOpened) {
    memoryOpened = true
    memoryOverlay.style.display = 'block'
  }
})

lifecycle.listen(window, 'keyup', (event) => {
  keys[event.key.toLowerCase()] = false
})



  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
  scene.add(ambientLight)

  const pinkLight = new THREE.PointLight(0xff3df2, 60)
  pinkLight.position.set(0, 4, 4)
  scene.add(pinkLight)

  const floorGeometry = new THREE.PlaneGeometry(14, 14)
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x12002e,
    metalness: 0.7,
    roughness: 0.18
  })

  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1
  scene.add(floor)

  const coreGeometry = new THREE.SphereGeometry(0.7, 32, 32)

const coreMaterial = new THREE.MeshStandardMaterial({
  color: 0xff66ff,
  emissive: 0xff00ff,
  emissiveIntensity: 2,
  metalness: 0.2,
  roughness: 0.1
})

const core = new THREE.Mesh(coreGeometry, coreMaterial)

core.position.set(0, 1, -4)

const memoryPrompt = document.createElement('div')

memoryPrompt.innerHTML = 'Press E to inspect memory'

memoryPrompt.style.position = 'fixed'
memoryPrompt.style.bottom = '40px'
memoryPrompt.style.left = '50%'
memoryPrompt.style.transform = 'translateX(-50%)'
memoryPrompt.style.padding = '14px 24px'
memoryPrompt.style.borderRadius = '999px'
memoryPrompt.style.background = 'rgba(10,0,25,0.75)'
memoryPrompt.style.color = 'white'
memoryPrompt.style.fontWeight = 'bold'
memoryPrompt.style.zIndex = '10002'
memoryPrompt.style.display = 'none'

document.body.appendChild(memoryPrompt)
  lifecycle.ownNode(memoryPrompt)
let memoryOverlay = document.querySelector('#memory-overlay')

if (!memoryOverlay) {
  memoryOverlay = document.createElement('div')
  memoryOverlay.id = 'memory-overlay'

  memoryOverlay.innerHTML = `
    <h2>Memory #001</h2>
    <p>Now he can't stop listening.</p>
    <button id="close-memory-overlay">Close</button>
  `

  memoryOverlay.style.position = 'fixed'
  memoryOverlay.style.top = '50%'
  memoryOverlay.style.left = '50%'
  memoryOverlay.style.transform = 'translate(-50%, -50%)'
  memoryOverlay.style.zIndex = '999999'
  memoryOverlay.style.padding = '34px'
  memoryOverlay.style.borderRadius = '28px'
  memoryOverlay.style.background = 'rgba(10, 0, 25, 0.92)'
  memoryOverlay.style.color = 'white'
  memoryOverlay.style.textAlign = 'center'
  memoryOverlay.style.boxShadow = '0 0 45px rgba(255, 61, 242, 0.7)'
  memoryOverlay.style.border = '1px solid rgba(255,255,255,0.25)'
  memoryOverlay.style.display = 'none'

  document.body.appendChild(memoryOverlay)
  lifecycle.ownNode(memoryOverlay)
}

memoryOverlay.querySelector('#close-memory-overlay').onclick = function () {
  memoryOverlay.style.display = 'none'
}

document.body.appendChild(memoryOverlay)
  lifecycle.ownNode(memoryOverlay)

document.querySelector('#close-memory-overlay').onclick = function () {
  memoryOverlay.style.display = 'none'
}

scene.add(core)
const particles = []

for (let i = 0; i < 150; i++) {

  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffffff
    })
  )

  particle.position.set(
    (Math.random() - 0.5) * 20,
    Math.random() * 6,
    (Math.random() - 0.5) * 20
  )

  scene.add(particle)

}

for (let i = 0; i < 150; i++) {

  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffffff
    })
  )

  particle.position.set(
    (Math.random() - 0.5) * 20,
    Math.random() * 6,
    (Math.random() - 0.5) * 20
  )

  scene.add(particle)

  particles.push({
    mesh: particle,
    speed: 0.001 + Math.random() * 0.003
  })
}
const memoryTexts = [
  'Welcome to my mind',
  'Some songs become memories instantly',
  'You were never supposed to find this world',
  'I made my own universe',
  'Neon thoughts never sleep'
]

const memoryShards = []

memoryTexts.forEach((text, index) => {
  const textCanvas = document.createElement('canvas')
  textCanvas.width = 1024
  textCanvas.height = 256

  const textCtx = textCanvas.getContext('2d')
  textCtx.fillStyle = 'white'
  textCtx.font = 'bold 54px serif'
  textCtx.textAlign = 'center'
  textCtx.fillText(text, 512, 140)

  const textTexture = new THREE.CanvasTexture(textCanvas)

  const textMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true
  })

  const textGeometry = new THREE.PlaneGeometry(4.5, 1.1)
  const textMesh = new THREE.Mesh(textGeometry, textMaterial)

  textMesh.position.set(
    Math.sin(index) * 4,
    2 + index * 0.25,
    -2 - index * 1.4
  )

  scene.add(textMesh)

  memoryShards.push({
    mesh: textMesh,
    offset: index
  })
})

const mirrorMemoryTexture = new THREE.TextureLoader().load('/mirror-memory-1.png')
const mirrorAlmostLove = new THREE.TextureLoader().load(
  '/mirror-almost-love.png'
)
const mirrorLateNight = new THREE.TextureLoader().load(
  '/mirror-late-night-drives.png'
)
const mirrorNeonTherapy = new THREE.TextureLoader().load(
  '/mirror-neon-therapy.png'
)
const mirrorPortal = new THREE.TextureLoader().load(
  '/mirror-glamniverse-portal.png'
)
const mirrorFutureAny = new THREE.TextureLoader().load(
  '/mirror-future-any.png'
)
const mirrorMemoryMaterial = new THREE.MeshBasicMaterial({
  map: mirrorMemoryTexture,
  side: THREE.DoubleSide
})

const mirrorAlmostLoveMaterial = new THREE.MeshBasicMaterial({
  map: mirrorAlmostLove,
  side: THREE.DoubleSide
})

const mirrorLateNightMaterial = new THREE.MeshBasicMaterial({
  map: mirrorLateNight,
  side: THREE.DoubleSide
})

const mirrorNeonTherapyMaterial = new THREE.MeshBasicMaterial({
  map: mirrorNeonTherapy,
  side: THREE.DoubleSide
})

const mirrorPortalMaterial = new THREE.MeshBasicMaterial({
  map: mirrorPortal,
  side: THREE.DoubleSide
})

const mirrorFutureAnyMaterial = new THREE.MeshBasicMaterial({
  map: mirrorFutureAny,
  side: THREE.DoubleSide
})

  const mirrorMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b003d,
    emissive: 0x8f5cff,
    emissiveIntensity: 0.35,
    metalness: 1,
    roughness: 0.05
  })

  const mirrors = []

const memoryMaterials = [
  mirrorAlmostLoveMaterial,
  mirrorLateNightMaterial,
  mirrorNeonTherapyMaterial,
  mirrorPortalMaterial,
  mirrorFutureAnyMaterial
]  

for (let i = 0; i < 5; i++) {

  const leftGeometry = new THREE.BoxGeometry(1.5, 4, 0.08)
const leftMirror = new THREE.Mesh(
  leftGeometry,
  memoryMaterials[i]
)

  leftMirror.position.set(-3, 1, -2 - i * 2)
  leftMirror.rotation.y = 0.4

  scene.add(leftMirror)

  mirrors.push({
    mirror: leftMirror,
    offset: i
  })

  const rightGeometry = new THREE.BoxGeometry(1.5, 4, 0.08)
  const rightMirror = new THREE.Mesh(
  rightGeometry,
  memoryMaterials[4 - i]
)

  rightMirror.position.set(3, 1, -2 - i * 2)
  rightMirror.rotation.y = -0.4

  scene.add(rightMirror)

  mirrors.push({
    mirror: rightMirror,
    offset: i + 10
  })
}

  const titleCanvas = document.createElement('canvas')
  titleCanvas.width = 1024
  titleCanvas.height = 256
  const ctx = titleCanvas.getContext('2d')

  ctx.fillStyle = 'white'
  ctx.font = 'bold 90px serif'
  ctx.textAlign = 'center'
  ctx.fillText('IN HIS MIND', 512, 145)

  const titleTexture = new THREE.CanvasTexture(titleCanvas)
  const titleMaterial = new THREE.MeshBasicMaterial({
    map: titleTexture,
    transparent: true
  })

  const titleGeometry = new THREE.PlaneGeometry(6, 1.5)
  const title = new THREE.Mesh(titleGeometry, titleMaterial)
  title.position.set(0, 3.5, -3)
  scene.add(title)

  function animateRoom() {

    title.rotation.y = Math.sin(Date.now() * 0.001) * 0.08
    const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.15

    core.scale.set(pulse, pulse, pulse)

    coreMaterial.emissiveIntensity =
      1.8 + Math.sin(Date.now() * 0.003) * 0.8
mirrors.forEach(({ mirror, offset }) => {
  mirror.rotation.y += 0.002
  mirror.position.y = 1 + Math.sin(Date.now() * 0.001 + offset) * 0.12

  const pulse = 1 + Math.sin(Date.now() * 0.002 + offset) * 0.03
  mirror.scale.set(pulse, pulse, 1)
})
    if (!xrState) {
      camera.rotation.y = mouseX * 0.35
      camera.rotation.x = mouseY * -0.18
      const speed = 0.04

      if (keys['w']) camera.position.z -= speed
      if (keys['s']) camera.position.z += speed
      if (keys['a']) camera.position.x -= speed
      if (keys['d']) camera.position.x += speed

      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3, 3)
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -2, 8)
    }
    
particles.forEach((particle) => {
  particle.mesh.position.y += particle.speed

  if (particle.mesh.position.y > 6) {
    particle.mesh.position.y = 0
  }
})
    cosmicSky.rotation.y += 0.0004
    memoryShards.forEach(({ mesh, offset }) => {
  mesh.rotation.y = Math.sin(Date.now() * 0.0008 + offset) * 0.35
  mesh.position.y += Math.sin(Date.now() * 0.001 + offset) * 0.0008
})

const distanceToCore = camera.position.distanceTo(core.position)


if (distanceToCore < 3) {
  memoryPrompt.style.display = 'block'
  nearCore = true
} else {
  memoryPrompt.style.display = 'none'
  nearCore = false
}

  }

  lifecycle.ownResource(cosmicSky)
  lifecycle.ownResource(mirrorMemoryMaterial)
  lifecycle.ownResource(mirrorMaterial)
  startWorldAnimation('inHisMind', scene, camera, animateRoom, {
    object: core,
    title: memoryOverlay.querySelector('h2').textContent,
    text: memoryOverlay.querySelector('p').textContent
  })
}
window.closeMemory = function () {
  document.querySelector('#memory-modal').classList.add('hidden')
}
window.returnToPortal = function () {
  if (deferUntilVRExit(() => window.returnToPortal())) return
  disposeCurrentWorld()
  selectedDistrict = null
  document.querySelector('#memory-overlay')?.style.setProperty('display', 'none')
  document.querySelector('#drive-memory-overlay')?.style.setProperty('display', 'none')
  document.querySelector('#neon-memory-overlay')?.style.setProperty('display', 'none')
  document.querySelector('#love-memory-overlay')?.style.setProperty('display', 'none')
  document.querySelector('#district-exit').classList.add('hidden')
  document.querySelector('#district-confirm').classList.add('hidden')

  document.querySelectorAll('.portal-label').forEach((label) => {
    label.style.display = ''
  })

  
  portalStarted = false

  openPortalWorld()
}

function showNeonTherapyRoom() {
  disposeCurrentWorld()
  document.querySelectorAll('.portal-label').forEach((label) => {
    label.style.display = 'none'
  })

  document.querySelector('#district-exit').classList.remove('hidden')

  const scene = new THREE.Scene()
  const lifecycle = createWorldLifecycle(scene)
const skyTexture = new THREE.TextureLoader().load(
  '/neon-therapy-360.png'
)

  const textureLoader = new THREE.TextureLoader()

const cityTexture = textureLoader.load(
  '/neon-therapy-city.png'
)
  scene.background = new THREE.Color(0x001a33)

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  camera.position.set(0, 1.6, 7)

  let mouseX = 0
  let mouseY = 0

  lifecycle.listen(window, 'mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2
  })

  const keys = {}
  lifecycle.resetInputWith(() => {
    Object.keys(keys).forEach((key) => { delete keys[key] })
  })

lifecycle.listen(window, 'keydown', (event) => {
  const key = event.key.toLowerCase()
  keys[key] = true

  if (key === 'e' && nearNeonSun && !neonMemoryOpened) {
    neonMemoryOpened = true
    neonMemoryOverlay.style.display = 'block'
  }
})

  lifecycle.listen(window, 'keyup', (event) => {
    keys[event.key.toLowerCase()] = false
  })



  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  const cyanLight = new THREE.PointLight(0x00d9ff, 80)
  cyanLight.position.set(0, 5, 5)
  scene.add(cyanLight)

  const pinkLight = new THREE.PointLight(0xff3df2, 50)
  pinkLight.position.set(-4, 3, 2)
  scene.add(pinkLight)

  const roadGeometry = new THREE.PlaneGeometry(8, 24)
const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x030010,
  metalness: 0.9,
  roughness: 0.08,
  emissive: 0x120033,
  emissiveIntensity: 0.25
})

  const road = new THREE.Mesh(roadGeometry, roadMaterial)
  road.rotation.x = -Math.PI / 2
  road.position.z = -4
  road.position.y = -1
  scene.add(road)

  const skySphere = new THREE.Mesh(
  new THREE.SphereGeometry(20, 64, 64),
  new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide
  })
)

scene.add(skySphere)

  const roadGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(2.2, 24),
  new THREE.MeshBasicMaterial({
    color: 0xff3df2,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide
  })
)

roadGlow.rotation.x = -Math.PI / 2
roadGlow.position.set(0, -0.97, -4)

scene.add(roadGlow)

const leftRoadLine = new THREE.Mesh(
  new THREE.PlaneGeometry(0.08, 24),
  new THREE.MeshBasicMaterial({
    color: 0x00d9ff,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  })
)

leftRoadLine.rotation.x = -Math.PI / 2
leftRoadLine.position.set(-2.1, -0.95, -4)
scene.add(leftRoadLine)

const rightRoadLine = new THREE.Mesh(
  new THREE.PlaneGeometry(0.08, 24),
  new THREE.MeshBasicMaterial({
    color: 0x00d9ff,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  })
)

rightRoadLine.rotation.x = -Math.PI / 2
rightRoadLine.position.set(2.1, -0.95, -4)
scene.add(rightRoadLine)

const carBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.25, 1.2),
  new THREE.MeshBasicMaterial({
    color: 0xff3df2
  })
)

carBody.position.set(0, -0.75, 2)
scene.add(carBody)

const carGlow = new THREE.Mesh(
  new THREE.CircleGeometry(0.7, 32),
  new THREE.MeshBasicMaterial({
    color: 0xff3df2,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  })
)

carGlow.rotation.x = -Math.PI / 2
carGlow.position.set(0, -0.94, 2)
scene.add(carGlow)

const leftHeadlight = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x00d9ff })
)

leftHeadlight.position.set(-0.25, -0.62, 1.45)
scene.add(leftHeadlight)

const rightHeadlight = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x00d9ff })
)

rightHeadlight.position.set(0.25, -0.62, 1.45)
scene.add(rightHeadlight)

  const neonBuilding1 = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 4, 1.2),

  new THREE.MeshStandardMaterial({
    color: 0x120033,
    emissive: 0x220066,
    emissiveIntensity: 1.2,
    metalness: 0.4,
    roughness: 0.3
  })
)

neonBuilding1.position.set(-3.2, 1, -6)

scene.add(neonBuilding1)
const window1 = new THREE.Mesh(
  new THREE.PlaneGeometry(0.18, 0.28),
  new THREE.MeshBasicMaterial({
    color: 0x00d9ff
  })
)

window1.position.set(-3.2, 1.6, -5.39)
scene.add(window1)

const window2 = new THREE.Mesh(
  new THREE.PlaneGeometry(0.18, 0.28),
  new THREE.MeshBasicMaterial({
    color: 0xff3df2
  })
)

window2.position.set(-3.2, 2.2, -5.39)
scene.add(window2)

const window3 = new THREE.Mesh(
  new THREE.PlaneGeometry(0.18, 0.28),
  new THREE.MeshBasicMaterial({
    color: 0x00d9ff
  })
)

window3.position.set(-3.2, 2.8, -5.39)
scene.add(window3)

const window5 = new THREE.Mesh(
  new THREE.PlaneGeometry(0.18, 0.28),
  new THREE.MeshBasicMaterial({
    color: 0x00d9ff
  })
)

window5.position.set(3.2, 2.5, -7.39)
scene.add(window5)

const window6 = new THREE.Mesh(
  new THREE.PlaneGeometry(0.18, 0.28),
  new THREE.MeshBasicMaterial({
    color: 0xff3df2
  })
)

window6.position.set(3.2, 3.2, -7.39)
scene.add(window6)

const window7 = new THREE.Mesh(
  new THREE.PlaneGeometry(0.18, 0.28),
  new THREE.MeshBasicMaterial({
    color: 0x00d9ff
  })
)

window7.position.set(3.2, 3.9, -7.39)
scene.add(window7)

const neonBuilding2 = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 6, 1.2),

  new THREE.MeshStandardMaterial({
    color: 0x120033,
    emissive: 0x220066,
    emissiveIntensity: 1.2,
    metalness: 0.4,
    roughness: 0.3
  })
)

neonBuilding2.position.set(3.2, 2, -8)

scene.add(neonBuilding2)

const neonBuilding3 = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 8, 1.2),

  new THREE.MeshStandardMaterial({
    color: 0x120033,
    emissive: 0x220066,
    emissiveIntensity: 1.2,
    metalness: 0.4,
    roughness: 0.3
  })
)

neonBuilding3.position.set(-3.2, 3, -11)

scene.add(neonBuilding3)

const neonBuilding4 = new THREE.Mesh(
  new THREE.BoxGeometry(1.3, 5, 1.2),

  new THREE.MeshStandardMaterial({
    color: 0x120033,
    emissive: 0x220066,
    emissiveIntensity: 1.2,
    metalness: 0.4,
    roughness: 0.3
  })
)

neonBuilding4.position.set(3.2, 1.5, -13)

scene.add(neonBuilding4)

const billboardCanvas = document.createElement('canvas')
billboardCanvas.width = 1024
billboardCanvas.height = 256

const billboardCtx = billboardCanvas.getContext('2d')

billboardCtx.fillStyle = 'rgba(20, 0, 40, 0.85)'
billboardCtx.fillRect(0, 0, 1024, 256)

billboardCtx.fillStyle = '#ffffff'
billboardCtx.font = 'bold 86px serif'
billboardCtx.textAlign = 'center'
billboardCtx.fillText('GLAMNIVERSE', 512, 150)

const billboardTexture = new THREE.CanvasTexture(billboardCanvas)

const billboard = new THREE.Mesh(
  new THREE.PlaneGeometry(4.8, 1.2),
  new THREE.MeshBasicMaterial({
    map: billboardTexture,
    transparent: true
  })
)

billboard.position.set(0, 2.8, -5.5)
scene.add(billboard)

const neonSignCanvas = document.createElement('canvas')
neonSignCanvas.width = 512
neonSignCanvas.height = 128

const neonCtx = neonSignCanvas.getContext('2d')

neonCtx.fillStyle = 'white'
neonCtx.font = 'bold 60px sans-serif'
neonCtx.textAlign = 'center'
neonCtx.fillText('OPEN 24/7', 256, 80)

const neonSignTexture = new THREE.CanvasTexture(neonSignCanvas)

const neonSign = new THREE.Mesh(
  new THREE.PlaneGeometry(1.8, 0.45),
  new THREE.MeshBasicMaterial({
    map: neonSignTexture,
    transparent: true
  })
)

  const titleCanvas = document.createElement('canvas')
  titleCanvas.width = 1024
  titleCanvas.height = 256
  const ctx = titleCanvas.getContext('2d')

  ctx.fillStyle = 'white'
  ctx.font = 'bold 90px serif'
  ctx.textAlign = 'center'
  ctx.fillText('NEON THERAPY', 512, 145)

  const titleTexture = new THREE.CanvasTexture(titleCanvas)
  const titleMaterial = new THREE.MeshBasicMaterial({
    map: titleTexture,
    transparent: true
  })

  const titleGeometry = new THREE.PlaneGeometry(7, 1.6)
  const title = new THREE.Mesh(titleGeometry, titleMaterial)
  title.position.set(0, 4, -5)
  scene.add(title)
 
  const sun = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 48, 48),

  new THREE.MeshStandardMaterial({
    color: 0xff66cc,
    emissive: 0xff3399,
    emissiveIntensity: 2.5
  })
)

sun.position.set(0, 3, -9)

let neonMemoryOpened = false
let nearNeonSun = false

const neonMemoryPrompt = document.createElement('div')

neonMemoryPrompt.innerHTML = 'Press E to inspect memory'

neonMemoryPrompt.style.position = 'fixed'
neonMemoryPrompt.style.bottom = '40px'
neonMemoryPrompt.style.left = '50%'
neonMemoryPrompt.style.transform = 'translateX(-50%)'
neonMemoryPrompt.style.padding = '14px 24px'
neonMemoryPrompt.style.borderRadius = '999px'
neonMemoryPrompt.style.background = 'rgba(0, 20, 40, 0.78)'
neonMemoryPrompt.style.color = 'white'
neonMemoryPrompt.style.fontWeight = 'bold'
neonMemoryPrompt.style.zIndex = '10002'
neonMemoryPrompt.style.display = 'none'

document.body.appendChild(neonMemoryPrompt)
  lifecycle.ownNode(neonMemoryPrompt)

let neonMemoryOverlay = document.querySelector('#neon-memory-overlay')

if (!neonMemoryOverlay) {
  neonMemoryOverlay = document.createElement('div')
  neonMemoryOverlay.id = 'neon-memory-overlay'

  neonMemoryOverlay.innerHTML = `
    <h2>Memory #001</h2>
    <p>Some cities heal better than people.</p>
    <button id="close-neon-memory-overlay">Close</button>
  `

  neonMemoryOverlay.style.position = 'fixed'
  neonMemoryOverlay.style.top = '50%'
  neonMemoryOverlay.style.left = '50%'
  neonMemoryOverlay.style.transform = 'translate(-50%, -50%)'
  neonMemoryOverlay.style.zIndex = '999999'
  neonMemoryOverlay.style.padding = '34px'
  neonMemoryOverlay.style.borderRadius = '28px'
  neonMemoryOverlay.style.background = 'rgba(0, 20, 40, 0.94)'
  neonMemoryOverlay.style.color = 'white'
  neonMemoryOverlay.style.textAlign = 'center'
  neonMemoryOverlay.style.boxShadow = '0 0 45px rgba(0, 217, 255, 0.7)'
  neonMemoryOverlay.style.border = '1px solid rgba(255,255,255,0.25)'
  neonMemoryOverlay.style.display = 'none'

  document.body.appendChild(neonMemoryOverlay)
  lifecycle.ownNode(neonMemoryOverlay)
}

neonMemoryOverlay.querySelector('#close-neon-memory-overlay').onclick = function () {
  neonMemoryOverlay.style.display = 'none'
}

scene.add(sun)

 function createPalmTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.16, 2.6, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff4fd8,
      emissive: 0xff00ff,
      emissiveIntensity: 0.7
    })
  )

  trunk.position.set(x, 0.2, z)
  scene.add(trunk)

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffd5,
    emissive: 0x00ffd5,
    emissiveIntensity: 1.3,
    side: THREE.DoubleSide
  })

  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 1.25),
      leafMaterial
    )

    leaf.position.set(x, 1.65, z)

    leaf.rotation.y = (Math.PI * 2 / 7) * i
    leaf.rotation.x = Math.PI / 2.8
    leaf.rotation.z = Math.sin(i) * 0.25

    scene.add(leaf)
  }

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x00ffd5,
      emissive: 0x00ffd5,
      emissiveIntensity: 1.4
    })
  )

  crown.position.set(x, 1.65, z)
  scene.add(crown)

  const baseGlow = new THREE.Mesh(
  new THREE.CircleGeometry(0.55, 32),
  new THREE.MeshBasicMaterial({
    color: 0xff3df2,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  })
)

baseGlow.rotation.x = -Math.PI / 2
baseGlow.position.set(x, -0.96, z)

scene.add(baseGlow)

}

  createPalmTree(-3, -2)
  createPalmTree(3, -3)
  createPalmTree(-3, -6)
  createPalmTree(3, -7)

  const particles = []

  for (let i = 0; i < 180; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x9ffcff })
    )

    particle.position.set(
      (Math.random() - 0.5) * 16,
      Math.random() * 6,
      (Math.random() - 0.5) * 24
    )

    scene.add(particle)

    particles.push({
      mesh: particle,
      speed: 0.001 + Math.random() * 0.003
    })
  }

  function animateNeonTherapy() {

    title.rotation.y = Math.sin(Date.now() * 0.001) * 0.08

    particles.forEach((particle) => {
      particle.mesh.position.y += particle.speed

      if (particle.mesh.position.y > 6) {
        particle.mesh.position.y = 0
      }
    })

    if (!xrState) {
      camera.rotation.y = mouseX * 0.35
      camera.rotation.x = mouseY * -0.18

      const speed = 0.04

      if (keys['w']) camera.position.z -= speed
      if (keys['s']) camera.position.z += speed
      if (keys['a']) camera.position.x -= speed
      if (keys['d']) camera.position.x += speed

      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3, 3)
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -8, 8)
    }

    const distanceToSun = camera.position.distanceTo(sun.position)

if (distanceToSun < 8) {
  neonMemoryPrompt.style.display = 'block'
  nearNeonSun = true
} else {
  neonMemoryPrompt.style.display = 'none'
  nearNeonSun = false
}

carBody.position.z -= 0.035
carGlow.position.z = carBody.position.z
leftHeadlight.position.z = carBody.position.z - 0.55
rightHeadlight.position.z = carBody.position.z - 0.55

if (carBody.position.z < -12) {
  carBody.position.z = 5
}

  }

  lifecycle.ownResource(cityTexture)
  lifecycle.ownResource(neonSign)
  startWorldAnimation('neonTherapy', scene, camera, animateNeonTherapy,
    xrMemoryFromOverlay(sun, neonMemoryOverlay))
}

function showLateNightDrivesRoom() {
  disposeCurrentWorld()
  document.querySelectorAll('.portal-label').forEach((label) => {
    label.style.display = 'none'
  })

  document.querySelector('#district-exit').classList.remove('hidden')

  const scene = new THREE.Scene()
  const lifecycle = createWorldLifecycle(scene)

  const skyTexture = new THREE.TextureLoader().load('/late-night-drives-360.png')

const skySphere = new THREE.Mesh(
  new THREE.SphereGeometry(100, 64, 64),
  new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    depthWrite: false
  })
)

scene.add(skySphere)

  scene.background = new THREE.Color(0x050010)

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  camera.position.set(0, 1.6, 7)

  let mouseX = 0
  let mouseY = 0

  lifecycle.listen(window, 'mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2
  })

  const keys = {}
  lifecycle.resetInputWith(() => {
    Object.keys(keys).forEach((key) => { delete keys[key] })
  })

lifecycle.listen(window, 'keydown', (event) => {
  const key = event.key.toLowerCase()
  keys[key] = true

  if (key === 'e' && nearDriveSign && !driveMemoryOpened) {
    driveMemoryOpened = true
    driveMemoryOverlay.style.display = 'block'
  }
})

  lifecycle.listen(window, 'keyup', (event) => {
    keys[event.key.toLowerCase()] = false
  })



  const ambientLight = new THREE.AmbientLight(0xffffff, 1.1)
  scene.add(ambientLight)

  const orangeLight = new THREE.PointLight(0xff8a3d, 80)
  orangeLight.position.set(0, 5, 5)
  scene.add(orangeLight)

  const pinkLight = new THREE.PointLight(0xff3df2, 50)
  pinkLight.position.set(-4, 3, 2)
  scene.add(pinkLight)

  const roadGeometry = new THREE.PlaneGeometry(7, 32)
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x070012,
    metalness: 0.65,
    roughness: 0.2
  })

  const road = new THREE.Mesh(roadGeometry, roadMaterial)
  road.rotation.x = -Math.PI / 2
  road.position.y = -1
  road.position.z = -6
  scene.add(road)

  const buildingMaterial = new THREE.MeshStandardMaterial({
  color: 0x120033,
  emissive: 0x220066,
  emissiveIntensity: 1.2,
  metalness: 0.4,
  roughness: 0.3
})

for (let i = 0; i < 8; i++) {
  const height = 2 + Math.random() * 4

  const leftBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, height, 1.2),
    buildingMaterial
  )

  leftBuilding.position.set(-3.2, height / 2 - 1, -2 - i * 2.2)
  scene.add(leftBuilding)

  const rightBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, height, 1.2),
    buildingMaterial
  )

  rightBuilding.position.set(3.2, height / 2 - 1, -2 - i * 2.2)
  scene.add(rightBuilding)

}

  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe6a8
  })

  for (let i = 0; i < 8; i++) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 1.2),
      lineMaterial
    )

    line.rotation.x = -Math.PI / 2
    line.position.set(0, -0.98, 4 - i * 3)
    scene.add(line)
  }

  function createPalmTree(x, z) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 2.2, 16),
      new THREE.MeshStandardMaterial({
        color: 0xff8a3d,
        emissive: 0xff3df2,
        emissiveIntensity: 0.5
      })
    )

    trunk.position.set(x, 0, z)
    scene.add(trunk)

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x00ffd5,
        emissive: 0x00ffd5,
        emissiveIntensity: 1.1
      })
    )

    leaves.position.set(x, 1.35, z)
    scene.add(leaves)
  }

  createPalmTree(-3.2, -2)
  createPalmTree(3.2, -3)
  createPalmTree(-3.2, -6)
  createPalmTree(3.2, -7)
  createPalmTree(-3.2, -10)
  createPalmTree(3.2, -11)

  let driveMemoryOpened = false
let nearDriveSign = false

const driveSign = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 0.8, 0.08),
  new THREE.MeshBasicMaterial({
    color: 0xff8a3d
  })
)

driveSign.position.set(0, 1.2, -9)
scene.add(driveSign)

const driveMemoryPrompt = document.createElement('div')
driveMemoryPrompt.innerHTML = 'Press E to inspect memory'

driveMemoryPrompt.style.position = 'fixed'
driveMemoryPrompt.style.bottom = '40px'
driveMemoryPrompt.style.left = '50%'
driveMemoryPrompt.style.transform = 'translateX(-50%)'
driveMemoryPrompt.style.padding = '14px 24px'
driveMemoryPrompt.style.borderRadius = '999px'
driveMemoryPrompt.style.background = 'rgba(30, 10, 0, 0.78)'
driveMemoryPrompt.style.color = 'white'
driveMemoryPrompt.style.fontWeight = 'bold'
driveMemoryPrompt.style.zIndex = '10002'
driveMemoryPrompt.style.display = 'none'

document.body.appendChild(driveMemoryPrompt)
  lifecycle.ownNode(driveMemoryPrompt)

let driveMemoryOverlay = document.querySelector('#drive-memory-overlay')

if (!driveMemoryOverlay) {
  driveMemoryOverlay = document.createElement('div')
  driveMemoryOverlay.id = 'drive-memory-overlay'

  driveMemoryOverlay.innerHTML = `
    <h2>Memory #001</h2>
    <p>The road knew where he was going.<br>He didn't.</p>
    <button id="close-drive-memory-overlay">Close</button>
  `

  driveMemoryOverlay.style.position = 'fixed'
  driveMemoryOverlay.style.top = '50%'
  driveMemoryOverlay.style.left = '50%'
  driveMemoryOverlay.style.transform = 'translate(-50%, -50%)'
  driveMemoryOverlay.style.zIndex = '999999'
  driveMemoryOverlay.style.padding = '34px'
  driveMemoryOverlay.style.borderRadius = '28px'
  driveMemoryOverlay.style.background = 'rgba(30, 10, 0, 0.94)'
  driveMemoryOverlay.style.color = 'white'
  driveMemoryOverlay.style.textAlign = 'center'
  driveMemoryOverlay.style.boxShadow = '0 0 45px rgba(255, 138, 61, 0.7)'
  driveMemoryOverlay.style.border = '1px solid rgba(255,255,255,0.25)'
  driveMemoryOverlay.style.display = 'none'

  document.body.appendChild(driveMemoryOverlay)
  lifecycle.ownNode(driveMemoryOverlay)
}

driveMemoryOverlay.querySelector('#close-drive-memory-overlay').onclick = function () {
  driveMemoryOverlay.style.display = 'none'
}

  const titleCanvas = document.createElement('canvas')
  titleCanvas.width = 1024
  titleCanvas.height = 256
  const ctx = titleCanvas.getContext('2d')

  ctx.fillStyle = 'white'
  ctx.font = 'bold 80px serif'
  ctx.textAlign = 'center'
  ctx.fillText('LATE NIGHT DRIVES', 512, 145)

  const titleTexture = new THREE.CanvasTexture(titleCanvas)
  const titleMaterial = new THREE.MeshBasicMaterial({
    map: titleTexture,
    transparent: true
  })

  const titleGeometry = new THREE.PlaneGeometry(8, 1.6)
  const title = new THREE.Mesh(titleGeometry, titleMaterial)
  title.position.set(0, 4, -6)
  scene.add(title)

  const particles = []

  for (let i = 0; i < 180; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb86b })
    )

    particle.position.set(
      (Math.random() - 0.5) * 16,
      Math.random() * 6,
      (Math.random() - 0.5) * 26
    )

    scene.add(particle)

    particles.push({
      mesh: particle,
      speed: 0.001 + Math.random() * 0.003
    })
  }

  function animateLateNightDrives() {

    title.rotation.y = Math.sin(Date.now() * 0.001) * 0.08

    particles.forEach((particle) => {
      particle.mesh.position.y += particle.speed

      if (particle.mesh.position.y > 6) {
        particle.mesh.position.y = 0
      }
    })

    if (!xrState) {
      camera.rotation.y = mouseX * 0.35
      camera.rotation.x = mouseY * -0.18

      const speed = 0.04

      if (keys['w']) camera.position.z -= speed
      if (keys['s']) camera.position.z += speed
      if (keys['a']) camera.position.x -= speed
      if (keys['d']) camera.position.x += speed

      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3, 3)
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -13, 8)
    }

const distanceToDriveSign = camera.position.distanceTo(driveSign.position)

if (distanceToDriveSign < 4) {
  driveMemoryPrompt.style.display = 'block'
  nearDriveSign = true
} else {
  driveMemoryPrompt.style.display = 'none'
  nearDriveSign = false
}
  }

  startWorldAnimation('lateNightDrives', scene, camera, animateLateNightDrives,
    xrMemoryFromOverlay(driveSign, driveMemoryOverlay))
}

function showAlmostLoveRoom() {
  disposeCurrentWorld()
  document.querySelectorAll('.portal-label').forEach((label) => {
    label.style.display = 'none'
  })

  document.querySelector('#district-exit').classList.remove('hidden')

  const scene = new THREE.Scene()
  const lifecycle = createWorldLifecycle(scene)
  const skyTexture = new THREE.TextureLoader().load('/almost-love-360.png')

const skySphere = new THREE.Mesh(
  new THREE.SphereGeometry(100, 64, 64),
  new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    depthWrite: false
  })
)

scene.add(skySphere)
  scene.background = new THREE.Color(0x2a001c)

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  camera.position.set(0, 1.6, 7)

  let mouseX = 0
  let mouseY = 0

  lifecycle.listen(window, 'mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2
  })

  const keys = {}
  lifecycle.resetInputWith(() => {
    Object.keys(keys).forEach((key) => { delete keys[key] })
  })

lifecycle.listen(window, 'keydown', (event) => {
  const key = event.key.toLowerCase()
  keys[key] = true

  if (key === 'e' && nearCoffeeCup && !loveMemoryOpened) {
    loveMemoryOpened = true
    loveMemoryOverlay.style.display = 'block'
  }
})

  lifecycle.listen(window, 'keyup', (event) => {
    keys[event.key.toLowerCase()] = false
  })



  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  const pinkLight = new THREE.PointLight(0xff4fd8, 80)
  pinkLight.position.set(0, 5, 5)
  scene.add(pinkLight)

  const warmLight = new THREE.PointLight(0xffb36b, 45)
  warmLight.position.set(-3, 3, 1)
  scene.add(warmLight)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 14),
    new THREE.MeshStandardMaterial({
      color: 0x160014,
      metalness: 0.45,
      roughness: 0.25
    })
  )

  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1
  floor.position.z = -2
  scene.add(floor)

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 0.12, 48),
    new THREE.MeshStandardMaterial({
      color: 0x2b001f,
      metalness: 0.6,
      roughness: 0.18
    })
  )

  table.position.set(0, -0.25, -2.5)
  scene.add(table)

  const tableLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 1.4, 24),
    new THREE.MeshStandardMaterial({
      color: 0xff4fd8,
      emissive: 0xff4fd8,
      emissiveIntensity: 0.5
    })
  )

  tableLeg.position.set(0, -0.9, -2.5)
  scene.add(tableLeg)

  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.42, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffc7f3,
      emissiveIntensity: 0.25
    })
  )

  cup.position.set(-0.35, 0.08, -2.5)
  scene.add(cup)

let loveMemoryOpened = false
let nearCoffeeCup = false

const loveMemoryPrompt = document.createElement('div')
loveMemoryPrompt.innerHTML = 'Press E to inspect memory'

loveMemoryPrompt.style.position = 'fixed'
loveMemoryPrompt.style.bottom = '40px'
loveMemoryPrompt.style.left = '50%'
loveMemoryPrompt.style.transform = 'translateX(-50%)'
loveMemoryPrompt.style.padding = '14px 24px'
loveMemoryPrompt.style.borderRadius = '999px'
loveMemoryPrompt.style.background = 'rgba(50, 0, 35, 0.78)'
loveMemoryPrompt.style.color = 'white'
loveMemoryPrompt.style.fontWeight = 'bold'
loveMemoryPrompt.style.zIndex = '10002'
loveMemoryPrompt.style.display = 'none'

document.body.appendChild(loveMemoryPrompt)
  lifecycle.ownNode(loveMemoryPrompt)

let loveMemoryOverlay = document.querySelector('#love-memory-overlay')

if (!loveMemoryOverlay) {
  loveMemoryOverlay = document.createElement('div')
  loveMemoryOverlay.id = 'love-memory-overlay'

  loveMemoryOverlay.innerHTML = `
    <h2>Memory #001</h2>
    <p>She never came.<br>He still ordered two coffees.</p>
    <button id="close-love-memory-overlay">Close</button>
  `

  loveMemoryOverlay.style.position = 'fixed'
  loveMemoryOverlay.style.top = '50%'
  loveMemoryOverlay.style.left = '50%'
  loveMemoryOverlay.style.transform = 'translate(-50%, -50%)'
  loveMemoryOverlay.style.zIndex = '999999'
  loveMemoryOverlay.style.padding = '34px'
  loveMemoryOverlay.style.borderRadius = '28px'
  loveMemoryOverlay.style.background = 'rgba(50, 0, 35, 0.94)'
  loveMemoryOverlay.style.color = 'white'
  loveMemoryOverlay.style.textAlign = 'center'
  loveMemoryOverlay.style.boxShadow = '0 0 45px rgba(255, 79, 216, 0.7)'
  loveMemoryOverlay.style.border = '1px solid rgba(255,255,255,0.25)'
  loveMemoryOverlay.style.display = 'none'

  document.body.appendChild(loveMemoryOverlay)
  lifecycle.ownNode(loveMemoryOverlay)
}

loveMemoryOverlay.querySelector('#close-love-memory-overlay').onclick = function () {
  loveMemoryOverlay.style.display = 'none'
}

  const rose = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff2f8a,
      emissive: 0xff2f8a,
      emissiveIntensity: 0.8
    })
  )

  rose.position.set(0.35, 0.1, -2.5)
  scene.add(rose)

  const windowFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4fd8,
    emissive: 0xff4fd8,
    emissiveIntensity: 0.7
  })

  for (let i = -2; i <= 2; i++) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 4, 0.08),
      windowFrameMaterial
    )

    frame.position.set(i * 1.2, 1.2, -5)
    scene.add(frame)
  }

  const titleCanvas = document.createElement('canvas')
  titleCanvas.width = 1024
  titleCanvas.height = 256
  const ctx = titleCanvas.getContext('2d')

  ctx.fillStyle = 'white'
  ctx.font = 'bold 90px serif'
  ctx.textAlign = 'center'
  ctx.fillText('ALMOST LOVE', 512, 145)

  const titleTexture = new THREE.CanvasTexture(titleCanvas)
  const titleMaterial = new THREE.MeshBasicMaterial({
    map: titleTexture,
    transparent: true
  })

  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 1.6),
    titleMaterial
  )

  title.position.set(0, 4, -5)
  scene.add(title)

  const particles = []

  for (let i = 0; i < 150; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb3ec })
    )

    particle.position.set(
      (Math.random() - 0.5) * 12,
      Math.random() * 6,
      (Math.random() - 0.5) * 14
    )

    scene.add(particle)

    particles.push({
      mesh: particle,
      speed: 0.001 + Math.random() * 0.002
    })
  }

  function animateAlmostLove() {

    title.rotation.y = Math.sin(Date.now() * 0.001) * 0.08
    rose.position.y = 0.1 + Math.sin(Date.now() * 0.002) * 0.05

    particles.forEach((particle) => {
      particle.mesh.position.y += particle.speed

      if (particle.mesh.position.y > 6) {
        particle.mesh.position.y = 0
      }
    })

    if (!xrState) {
      camera.rotation.y = mouseX * 0.35
      camera.rotation.x = mouseY * -0.18

      const speed = 0.04

      if (keys['w']) camera.position.z -= speed
      if (keys['s']) camera.position.z += speed
      if (keys['a']) camera.position.x -= speed
      if (keys['d']) camera.position.x += speed

      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3, 3)
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -5, 8)
    }

    const distanceToCoffeeCup = camera.position.distanceTo(cup.position)

if (distanceToCoffeeCup < 4) {
  loveMemoryPrompt.style.display = 'block'
  nearCoffeeCup = true
} else {
  loveMemoryPrompt.style.display = 'none'
  nearCoffeeCup = false
}

  }

  startWorldAnimation('almostLove', scene, camera, animateAlmostLove,
    xrMemoryFromOverlay(cup, loveMemoryOverlay))
}