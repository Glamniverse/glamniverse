import './style.css'
import * as THREE from 'three'

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
          <a href="#neon-city" class="btn">🌆 Enter Neon City Beta</a>
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
      <h2>Neon City Beta</h2>

      <p class="section-text">
        The interactive Glamniverse world is currently under construction.
        360 navigation and VR access are coming later.
      </p>

      <div class="city-box">
        <h3>🌆 Enter the Glamniverse</h3>
        <p>
          Future districts: Neon Therapy, In His Mind, Late Night Drives and Almost Love.
        </p>
        <button onclick="openPortalWorld()">
          Enter 3D World
        </button>
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
  const audio = document.querySelector('#song-audio')

  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

window.closeSongExperience = function () {
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
let runtimeAnimationId = null
let runtimeRunning = false
let runtimeGeneration = 0

function resizeRuntime() {
  if (!sharedRenderer || !activeWorld) return

  const width = Math.max(1, window.innerWidth)
  const height = Math.max(1, window.innerHeight)
  activeWorld.camera.aspect = width / height
  activeWorld.camera.updateProjectionMatrix()
  sharedRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  sharedRenderer.setSize(width, height)
}

function renderActiveWorld() {
  const world = activeWorld
  if (!world || !sharedRenderer) return

  world.update()
  if (runtimeRunning && activeWorld === world) {
    sharedRenderer.render(world.scene, world.camera)
  }
}

function stopWorldAnimation() {
  runtimeRunning = false
  runtimeGeneration += 1
  if (runtimeAnimationId !== null) {
    cancelAnimationFrame(runtimeAnimationId)
    runtimeAnimationId = null
  }
  window.removeEventListener('resize', resizeRuntime)
}

function resumeRuntime() {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({ antialias: true })
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

  function animateFrame() {
    if (!runtimeRunning || generation !== runtimeGeneration) return

    runtimeAnimationId = requestAnimationFrame(animateFrame)
    renderActiveWorld()
  }

  animateFrame()
}

function startWorldAnimation(worldId, scene, camera, update) {
  activeWorld = { worldId, scene, camera, update }
  resumeRuntime()
}

function disposeRuntimeRenderer() {
  if (!sharedRenderer) return

  sharedRenderer.dispose()
  sharedRenderer.forceContextLoss()
  sharedRenderer.domElement.remove()
  sharedRenderer = null
}

let activeWorldLifecycle = null

function disposeCurrentWorld() {
  // Detach the outgoing update before disposing its scene and input.
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
    listen(target, type, handler, options) {
      const guardedHandler = (event) => {
        if (!suspended && !disposed) handler(event)
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
  stopWorldAnimation()
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
    camera.rotation.y = mouseX * 0.35
    camera.rotation.x = mouseY * -0.18
    const speed = 0.04

    if (keys['w']) camera.position.z -= speed
    if (keys['s']) camera.position.z += speed
    if (keys['a']) camera.position.x -= speed
    if (keys['d']) camera.position.x += speed

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3, 3)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -2, 8)
    
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
console.log(distanceToCore)

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
  startWorldAnimation('inHisMind', scene, camera, animateRoom)
}
window.closeMemory = function () {
  document.querySelector('#memory-modal').classList.add('hidden')
}
window.returnToPortal = function () {
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

    camera.rotation.y = mouseX * 0.35
    camera.rotation.x = mouseY * -0.18

    const speed = 0.04

    if (keys['w']) camera.position.z -= speed
    if (keys['s']) camera.position.z += speed
    if (keys['a']) camera.position.x -= speed
    if (keys['d']) camera.position.x += speed

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3, 3)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -8, 8)

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
  startWorldAnimation('neonTherapy', scene, camera, animateNeonTherapy)
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
  console.log('buildings added')
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

    camera.rotation.y = mouseX * 0.35
    camera.rotation.x = mouseY * -0.18

    const speed = 0.04

    if (keys['w']) camera.position.z -= speed
    if (keys['s']) camera.position.z += speed
    if (keys['a']) camera.position.x -= speed
    if (keys['d']) camera.position.x += speed

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3, 3)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -13, 8)

const distanceToDriveSign = camera.position.distanceTo(driveSign.position)

if (distanceToDriveSign < 4) {
  driveMemoryPrompt.style.display = 'block'
  nearDriveSign = true
} else {
  driveMemoryPrompt.style.display = 'none'
  nearDriveSign = false
}
  }

  startWorldAnimation('lateNightDrives', scene, camera, animateLateNightDrives)
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

    camera.rotation.y = mouseX * 0.35
    camera.rotation.x = mouseY * -0.18

    const speed = 0.04

    if (keys['w']) camera.position.z -= speed
    if (keys['s']) camera.position.z += speed
    if (keys['a']) camera.position.x -= speed
    if (keys['d']) camera.position.x += speed

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3, 3)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -5, 8)

    const distanceToCoffeeCup = camera.position.distanceTo(cup.position)

if (distanceToCoffeeCup < 4) {
  loveMemoryPrompt.style.display = 'block'
  nearCoffeeCup = true
} else {
  loveMemoryPrompt.style.display = 'none'
  nearCoffeeCup = false
}

  }

  startWorldAnimation('almostLove', scene, camera, animateAlmostLove)
}