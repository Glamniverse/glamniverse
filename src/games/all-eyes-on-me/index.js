import * as THREE from 'three'
import { CONFIG as C } from './config.js'
import { LEVEL as level, validateLevel } from './level.js'
import { createArena } from './arena.js'
import { createUI, makePanel } from '../smash-the-hate/ui.js'
import { createTargets } from './targets.js'
import { createObstacles } from './obstacles.js'
import { createHands } from './hands.js'
import { createGameAudio } from './audio.js'
import { createFragments, pulseHaptic } from './effects.js'

export function createAllEyesOnMe({ audio, back }) {
  validateLevel(level)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 120)
  camera.position.set(0, 1.6, 2.8)
  const root = new THREE.Group(); root.position.y = 1.6; scene.add(root)
  const arena = createArena(scene)
  const music = createGameAudio(audio, level.audio)
  const fragments = createFragments(root); fragments.reset()
  const hud = makePanel(0.64, 0.095, 768, 128)
  hud.mesh.position.set(0, 0.73, -2.2); hud.mesh.visible = false; root.add(hud.mesh)
  function updateScore() { hud.draw([`Score ${score.score} • Combo ${score.combo} • Hits ${score.hits}`]) }
  const score = { score: 0, hits: 0, misses: 0, combo: 0, maxCombo: 0, obstacles: 0, obstacleMisses: 0 }
  const targets = createTargets(root, level, () => { score.misses++; score.combo = 0; updateScore() })
  const obstacles = createObstacles(root, level.obstacles, success => {
    if (success) score.obstacles++
    else { score.obstacleMisses++; if (C.obstacleBreaksCombo) score.combo = 0 }
    updateScore()
  })
  let roundNumber = 0
  let result = null
  let phase = 'loading'
  let xr = null
  let weapons = null
  let disposed = false
  let token = 0
  let calibrated = false
  let healthy = false
  let lastTime = null
  let now = 0
  let countdownStart = 0
  let countdownNumber = null
  let pausedFrom = null
  let lastMessage = ''
  let songTime = 0
  const head = new THREE.Vector3()
  const headWorld = new THREE.Vector3()
  const facing = new THREE.Vector3()
  const orientation = new THREE.Quaternion()
  const parentOrientation = new THREE.Quaternion()
  const ui = createUI(root, action, back)

  function show(message, label) {
    const key = message.join('|') + '|' + label
    if (key === lastMessage) return
    lastMessage = key; ui.show(message, label)
  }
  function readyMenu() {
    if (!xr) {
      show(['ALL EYES ON ME', 'Powered by All Eyes On Me', 'All eyes on you. Keep moving. Select ENTER VR.'])
    } else if (phase === 'loading') {
      show(['ALL EYES ON ME', audio.error ? 'Audio could not load. Check connection.' : 'Loading All Eyes On Me…'], audio.error ? 'RETRY LOAD' : null)
    } else {
      show(['ALL EYES ON ME - VR FITNESS', 'PINK = LEFT | BLUE = RIGHT', 'DUCK • LEAN • PUNCH. Small moves; keep your space clear.', healthy ? 'Full song • 3:39. Misses are harmless. Stay in place.' : 'Track both controllers to begin.'], healthy ? 'START' : null)
    }
  }
  function pause(reason) {
    if (!['countdown', 'starting', 'playing'].includes(phase)) return
    pausedFrom = phase === 'countdown' ? 'countdown' : 'playing'
    phase = 'paused'; token++; audio.pause(); weapons?.reset()
    xr?.interaction.setMenuRays(true)
    show(['PAUSED', reason, 'Point and press trigger to resume.'], 'RESUME')
  }
  function finish() {
    if (!['playing', 'starting', 'paused'].includes(phase)) return
    token++; audio.pause(); weapons?.reset(); targets.hide(); obstacles.hide(); fragments.reset(); arena.reset()
    phase = 'results'; xr?.interaction.setMenuRays(true)
    // Any unjudged chart entries become misses if the source ends unexpectedly early.
    score.misses += Math.max(0, level.events.length - score.hits - score.misses)
    result = { completed: audio.currentTime >= level.duration - 0.1, hitRate: score.hits / level.events.length }
    show([result.completed ? 'ALL EYES ON YOU. YOU KEPT MOVING.' : 'AUDIO ENDED EARLY',
      'FULL-SONG RESULTS', `Score ${score.score} | Hits ${score.hits} | Misses ${score.misses}`,
      `Max combo ${score.maxCombo} | Moves ${score.obstacles}/${level.obstacles.length}`], 'PLAY AGAIN')
  }
  async function playAudio() {
    const attempt = ++token
    phase = 'starting'
    show(['Starting All Eyes On Me…'])
    try {
      await audio.play()
      if (disposed || attempt !== token || !xr) return
      phase = 'playing'; songTime = audio.currentTime; updateScore()
      weapons.reset(); lastMessage = ''; ui.hide(); xr.interaction.setMenuRays(false)
    } catch (error) {
      if (attempt !== token || disposed) return
      pausedFrom = 'playing'; phase = 'paused'; audio.pause()
      xr?.interaction.setMenuRays(true)
      show(['Music playback was blocked.', 'Press RESUME to retry directly.', String(error.message).slice(0, 80)], 'RESUME')
    }
  }
  function action() {
    if (!xr || disposed) return
    music.unlockEffects()
    if (phase === 'loading') { music.retryLoad(); readyMenu(); return }
    if (!healthy || xr.session.visibilityState !== 'visible') {
      show(['Both tracked controllers are required.', 'Keep the headset active and try again.'], phase === 'paused' ? 'RESUME' : 'START')
      return
    }
    if (phase === 'paused') {
      if (!music.ready()) { show(['Waiting for audio to buffer.', 'Try RESUME in a moment.'], 'RESUME'); return }
      weapons.reset()
      if (pausedFrom === 'countdown') beginCountdown()
      else playAudio() // Deliberate select gesture also retries autoplay failures.
      return
    }
    if (!['ready', 'results'].includes(phase) || !music.ready()) return
    for (const key of Object.keys(score)) score[key] = 0
    token++; audio.pause(); audio.currentTime = 0; songTime = 0
    result = null; targets.reset(++roundNumber); fragments.reset(); weapons.reset(); arena.reset()
    placePlayArea() // Fixed front direction for the whole round, never follows gaze.
    obstacles.reset() // root was just placed at neutral eyes; frozen for this round.
    beginCountdown()
  }
  function beginCountdown() {
    phase = 'countdown'; countdownStart = now; countdownNumber = null
    xr.interaction.setMenuRays(false)
    ui.hide(); lastMessage = ''
  }
  function placePlayArea() {
    root.position.copy(headWorld)
    root.rotation.set(0, Math.atan2(-facing.x, -facing.z), 0)
    root.updateMatrixWorld(true)
    arena.group.position.copy(root.position); arena.group.quaternion.copy(root.quaternion)
    head.set(0, 0, 0)
  }
  function hit(target, kind, source) {
    if (phase !== 'playing' || !targets.consume(target)) return
    const strong = kind === 'left'
    score.hits++; score.combo++; score.maxCombo = Math.max(score.combo, score.maxCombo)
    score.score += C.punchPoints
    updateScore()
    fragments.burst(target.position, strong); music.impact(strong); pulseHaptic(source, strong)
  }
  const onEnded = () => { if (['playing', 'starting', 'paused'].includes(phase)) finish() }
  const onWaiting = () => pause('Audio buffering. Progress is paused.')
  const onError = () => {
    if (['playing', 'starting', 'countdown'].includes(phase)) pause('Audio error. Exit and retry loading.')
    else if (phase === 'loading') readyMenu()
  }
  audio.addEventListener('ended', onEnded)
  audio.addEventListener('waiting', onWaiting)
  audio.addEventListener('error', onError)
  let onVisibility = null

  function exitXR() {
    token++; audio.pause()
    if (xr && onVisibility) xr.session.removeEventListener('visibilitychange', onVisibility)
    onVisibility = null
    ui.unbind(); weapons?.dispose(); weapons = null
    targets.reset(); obstacles.reset(); fragments.reset(); arena.reset(); result = null; hud.mesh.visible = false; music.release()
    xr = null; calibrated = healthy = false; lastTime = null
    if (!disposed) { phase = music.ready() ? 'ready' : 'loading'; readyMenu() }
  }
  return {
    scene, camera,
    // Read-only snapshot for tests/debugging; never called in the hot frame loop.
    getDebugState: () => ({ phase, ...score, songTime, healthy, result, roundNumber, activeTargets: targets.entries.filter(t => t.event).length, ...obstacles.stats(), ...arena.stats(), renderer: xr?.renderer.info ? { ...xr.renderer.info.render, ...xr.renderer.info.memory } : null }),
    update(time, frame) {
      if (disposed) return
      if (Number.isFinite(time)) now = time / 1000
      const dt = lastTime === null ? 0 : Math.min(0.05, Math.max(0, now - lastTime))
      if (lastTime !== null && now - lastTime > C.maxPoseGap) pause('Frame/tracking interruption. Resume when ready.')
      lastTime = now
      hud.mesh.visible = phase === 'playing'
      if (phase === 'loading' && music.ready()) { phase = 'ready'; readyMenu() }
      if (!xr || !frame || xr.attaching || xr.cancelled || xr.ended) { arena.update(now, phase, countdownNumber ?? 3); return }
      const reference = xr.renderer.xr.getReferenceSpace()
      const pose = frame.getViewerPose(reference)
      const visible = xr.session.visibilityState === 'visible'
      if (pose && visible) {
        xr.origin.updateWorldMatrix(true, true)
        const p = pose.transform.position; const q = pose.transform.orientation
        headWorld.set(p.x, p.y, p.z).applyMatrix4(xr.origin.matrixWorld)
        orientation.set(q.x, q.y, q.z, q.w)
        xr.origin.getWorldQuaternion(parentOrientation)
        facing.set(0, 0, -1).applyQuaternion(orientation).applyQuaternion(parentOrientation); facing.y = 0
        if (facing.lengthSq() < 0.001) facing.set(0, 0, -1).applyQuaternion(parentOrientation)
        facing.normalize()
        if (!calibrated) { placePlayArea(); calibrated = true }
        head.copy(headWorld); root.worldToLocal(head)
      }
      if (phase === 'playing' && pose && visible) {
        if (audio.ended) finish()
        else if (audio.paused || audio.readyState < 3) pause('Music paused or buffering.')
        else if (audio.currentTime + 0.05 < songTime) pause('Unexpected audio seek. Exit and restart the round.')
        else {
          songTime = audio.currentTime
          targets.update(songTime, head)
          obstacles.update(songTime, head)
          // Wait for HTMLAudioElement ended, including the encoded audio tail.
          // Chart duration never truncates playback or manufactures completion.
        }
      }
      const wasHealthy = healthy
      healthy = Boolean(pose && visible && weapons.sample(time, frame, reference, phase === 'playing', targets.entries))
      if (!healthy) { weapons.reset(); pause('Controller or headset tracking interrupted.') }
      if (phase === 'ready' && (wasHealthy !== healthy || !lastMessage)) readyMenu()
      if (phase === 'countdown' && healthy) {
        const count = Math.ceil(C.countdownSeconds - (now - countdownStart))
        if (count <= 0) { ui.hide(); playAudio() }
        else if (count !== countdownNumber) {
          countdownNumber = count; show([String(count), 'Stay in place • Small comfortable punches']);

        }
      }
      fragments.update(phase === 'playing' ? dt : 0)
      arena.update(phase === 'countdown' ? now : songTime, phase, countdownNumber ?? 3)
    },
    xrHooks: {
      stationary: true,
      ownsAudio: true,
      customUI: true,
      onEnter(state) {
        xr = state; calibrated = healthy = false; lastMessage = ''; lastTime = null
        music.acquire(); phase = music.ready() ? 'ready' : 'loading'
        ui.bind(state.interaction)
        weapons = createHands(state.interaction.controllers, root, hit)
        onVisibility = () => { if (state.session.visibilityState !== 'visible') pause('Headset menu opened. Progress is paused.') }
        state.session.addEventListener('visibilitychange', onVisibility)
        readyMenu()
      },
      onRequestExit() { pause('Leaving VR…'); token++; audio.pause() },
      onExit: exitXR,
      suspend() { token++; music.release() },
      dispose() {
        if (disposed) return
        disposed = true; exitXR(); phase = 'disposed'
        audio.removeEventListener('ended', onEnded); audio.removeEventListener('waiting', onWaiting); audio.removeEventListener('error', onError)
        arena.dispose(); targets.dispose(); fragments.dispose(); music.dispose()
      },
    },
  }
}
