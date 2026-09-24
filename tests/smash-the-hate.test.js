import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { CONFIG as C } from '../src/games/smash-the-hate/config.js'
import { FULL_LEVEL, validateLevel, spawnAt, missAt, cardZ, duckSpawnAt, duckEndAt, duckZ, cardSpeed, strikeAt, chartLimits, laneX, arrivalAt } from '../src/games/smash-the-hate/level.js'
import { sweptCardHit, isSwing } from '../src/games/smash-the-hate/collision.js'
import { createTargets } from '../src/games/smash-the-hate/targets.js'
import { createWeapons } from '../src/games/smash-the-hate/weapons.js'
import { createSmashTheHate } from '../src/games/smash-the-hate/index.js'
import { createArena } from '../src/games/smash-the-hate/arena.js'
import { createDuckJudge, createDucks } from '../src/games/smash-the-hate/ducks.js'
import { createMusicWaves } from '../src/games/smash-the-hate/waves.js'
import { COMMENTS, selectComments } from '../src/games/smash-the-hate/comments.js'
import { classifyResult } from '../src/games/smash-the-hate/results.js'
import { readFileSync } from 'node:fs'
import { pulseHaptic } from '../src/games/smash-the-hate/effects.js'

// No WebGL, browser or XR hardware: exercise real Three.js transforms/game logic
// with canvas drawing and media playback stubbed, not a claim of visual validation.
const ctx = { fillRect() {}, strokeRect() {}, fillText() {} }
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
globalThis.window = { innerWidth: 1200, innerHeight: 800 }
class FakeAudio extends EventTarget {
  ended = false; duration = 182.4;
  paused = true; loop = true; volume = 0.43; readyState = 4; currentTime = 0; error = null; src = ''; plays = 0; rejectNext = false
  getAttribute() { return this.src }
  load() {}
  pause() { this.paused = true }
  play() { this.ended = false; this.plays++; if (this.rejectNext) { this.rejectNext = false; return Promise.reject(new Error('Autoplay test')) } this.paused = false; return Promise.resolve() }
}
const flush = () => new Promise(resolve => setImmediate(resolve))
function harness() {
  const audio = new FakeAudio()
  let backs = 0
  const game = createSmashTheHate({ audio, back: () => { backs++; game.xrHooks.onExit() } })
  const origin = new THREE.Group(); game.scene.add(origin)
  const controllers = ['left', 'right'].map(handedness => {
    const grip = new THREE.Group(); origin.add(grip)
    grip.position.set(handedness === 'left' ? -0.3 : 0.3, -0.3, -0.5)
    return { grip, connected: true, source: { handedness, gripSpace: {} } }
  })
  const registered = []
  const interaction = {
    controllers, rays: true,
    setMenuRays(value) { this.rays = value },
    addTarget(object, action) { const entry = { object, action }; registered.push(entry); return () => registered.splice(registered.indexOf(entry), 1) },
  }
  const session = new EventTarget(); session.visibilityState = 'visible'
  const xr = { session, origin, interaction, renderer: { xr: { getReferenceSpace: () => ({}) } } }
  const frame = {
    getViewerPose: () => ({ transform: { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } } }),
    getPose: () => ({ emulatedPosition: false }),
  }
  let time = 0
  function tick(dt = 1 / 72) {
    time += dt
    if (!audio.paused) {
      audio.currentTime += dt
      if (audio.currentTime >= audio.duration) {
        audio.currentTime = audio.duration; audio.ended = true; audio.paused = true
        audio.dispatchEvent(new Event('ended'))
      }
    }
    game.update(time * 1000, frame)
  }
  game.xrHooks.onEnter(xr); game.update(0, frame)
  return { audio, game, xr, registered, controllers, frame, tick, backs: () => backs,
    async start() {
      registered[0].action()
      assert.equal(audio.plays, 0, 'countdown must precede playback')
      for (let i = 0; i < 218; i++) tick()
      await flush()
    },
  }
}

test('full chart has 110 hits with at most six total and two near cards', () => {
  validateLevel(FULL_LEVEL)
  assert.equal(FULL_LEVEL.events.length, 110)
  for (let t = 0; t <= FULL_LEVEL.duration; t += 1 / 90) {
    assert.ok(FULL_LEVEL.events.filter(e => spawnAt(e) <= t && missAt(e) > t).length <= C.maxTargets)
    assert.ok(FULL_LEVEL.events.filter(e => strikeAt(e) <= t && missAt(e) > t).length <= C.maxStrikeTargets)
  }
  const e = FULL_LEVEL.events[0]
  assert.equal(cardZ(e, spawnAt(e)), -C.portalDistance)
  assert.ok(Math.abs(cardZ(e, e.hitAt) + C.hitDistance) < 1e-9)
  assert.ok(Math.abs(cardZ(e, missAt(e)) - C.missBehind) < 1e-9)
  assert.throws(() => validateLevel({ ...FULL_LEVEL, events: [...FULL_LEVEL.events, FULL_LEVEL.events[0]] }))
})

test('swept collision catches crossing but speed gate rejects stationary, slow and tracking jumps', () => {
  const p = (x, z) => ({ x, y: 0, z })
  assert.ok(sweptCardHit(p(0, 0), p(0, -1), p(0, -0.5), p(0, -0.5), .04, .3, .15, .02))
  assert.equal(sweptCardHit(p(2, 0), p(2, -1), p(0, -.5), p(0, -.5), .04, .3, .15, .02), false)
  assert.equal(isSwing(0, 1 / 72, C), false)
  assert.equal(isSwing(.1, 1 / 72, C), false)
  assert.equal(isSwing(50, 1 / 72, C), false)
  assert.equal(isSwing(1, .5, C), false)
  assert.equal(isSwing(1, 1 / 72, C), true)
})

test('pooled cards miss once, consume once, and reset without growing scene', () => {
  const root = new THREE.Group(); let misses = 0
  const targets = createTargets(root, FULL_LEVEL, () => misses++)
  const head = new THREE.Vector3()
  targets.update(spawnAt(FULL_LEVEL.events[0]) + .01, head); const target = targets.entries.find(t => t.event)
  assert.ok(target); assert.equal(targets.consume(target), true); assert.equal(targets.consume(target), false)
  for (let t = spawnAt(FULL_LEVEL.events[0]) + .01; t <= FULL_LEVEL.duration; t += 1 / 72) targets.update(t, head)
  assert.equal(misses, 109); assert.equal(root.children.length, C.maxTargets)
  targets.reset(); targets.update(spawnAt(FULL_LEVEL.events[0]) + .01, head); assert.equal(targets.entries.filter(t => t.event).length, 1)
  assert.equal(root.children.length, C.maxTargets)
})

test('actual weapon pipeline rejects passive overlap, hits once and resets on tracking loss', () => {
  const root = new THREE.Group()
  const controllers = ['right', 'left'].map(handedness => {
    const grip = new THREE.Group(); root.add(grip)
    return { grip, connected: true, source: { handedness, gripSpace: {} } }
  })
  const frame = { getPose: () => ({ emulatedPosition: false }) }
  const target = { event: {}, mesh: { rotation: { y: 0 } }, previous: new THREE.Vector3(0, 0, -.5), position: new THREE.Vector3(0, 0, -.5) }
  let hits = 0; let kind
  const weapons = createWeapons(controllers, root, (t, k) => { if (!t.event) return; t.event = null; hits++; kind = k })
  weapons.sample(0, frame, {}, true, [target]); weapons.sample(16, frame, {}, true, [target])
  target.previous.z = -.5; target.position.z = 0
  weapons.sample(32, frame, {}, true, [target]); assert.equal(hits, 0, 'card moving into static weapon cannot score')
  target.previous.z = target.position.z = -.17
  controllers[1].grip.position.z = -.10
  weapons.sample(48, frame, {}, true, [target]); assert.equal(hits, 1); assert.equal(kind, 'keyboard', 'handedness, not index')
  target.event = {}; controllers[0].connected = false; controllers[1].grip.position.z = 0
  weapons.sample(64, frame, {}, true, [target]); assert.equal(hits, 1)
  controllers[0].connected = true; controllers[1].grip.position.z = -.10
  weapons.sample(80, frame, {}, true, [target]); assert.equal(hits, 1, 'reconnect must not sweep across stale pose')
  weapons.dispose(); assert.ok(controllers.every(c => c.grip.children.length === 0))
})

test('countdown, whole missed demo, results, replay, back and session cleanup', async () => {
  const h = harness(); assert.equal(h.game.getDebugState().phase, 'ready')
  await h.start(); assert.equal(h.game.getDebugState().phase, 'playing'); assert.equal(h.xr.interaction.rays, false)
  for (let i = 0; i < FULL_LEVEL.duration * 72 + 2; i++) h.tick()
  const result = h.game.getDebugState()
  assert.equal(result.duckMisses, 5); assert.equal(result.activeObstacle, false); assert.equal(result.phase, 'results'); assert.equal(result.misses, 110); assert.equal(result.hits, 0)
  assert.equal(h.audio.paused, true); assert.equal(h.xr.interaction.rays, true)
  h.registered[0].action(); assert.equal(h.game.getDebugState().phase, 'countdown'); assert.equal(h.game.getDebugState().misses, 0); assert.equal(h.game.getDebugState().duckMisses, 0)
  h.registered[1].action(); assert.equal(h.backs(), 1); assert.equal(h.registered.length, 0)
  assert.ok(h.controllers.every(c => c.grip.children.length === 0))
  assert.equal(h.audio.loop, true); assert.equal(h.audio.volume, .43)
  h.game.xrHooks.onEnter(h.xr); h.tick(); assert.equal(h.registered.length, 2)
  h.game.xrHooks.onExit(); h.game.xrHooks.dispose(); assert.equal(h.game.getDebugState().phase, 'disposed')
})

test('audio rejection, visibility pause, tracking pause and ended event are safe', async () => {
  const h = harness(); h.audio.rejectNext = true; await h.start()
  assert.equal(h.game.getDebugState().phase, 'paused')
  h.registered[0].action(); await flush(); assert.equal(h.game.getDebugState().phase, 'playing')
  h.xr.session.visibilityState = 'visible-blurred'; h.xr.session.dispatchEvent(new Event('visibilitychange'))
  assert.equal(h.game.getDebugState().phase, 'paused'); assert.equal(h.audio.paused, true)
  h.xr.session.visibilityState = 'visible'; h.tick(); h.registered[0].action(); await flush()
  h.controllers[0].connected = false; h.tick(); assert.equal(h.game.getDebugState().phase, 'paused')
  h.controllers[0].connected = true; h.tick(); h.registered[0].action(); await flush()
  h.audio.dispatchEvent(new Event('ended')); assert.equal(h.game.getDebugState().phase, 'results')
  h.game.xrHooks.onExit(); h.game.xrHooks.dispose()
})

test('optional haptics tolerate unsupported/rejected devices', async () => {
  assert.doesNotThrow(() => pulseHaptic(null, true))
  assert.doesNotThrow(() => pulseHaptic({ gamepad: { hapticActuators: [{ pulse: () => Promise.reject(new Error('unsupported')) }] } }, true))
  await flush()
})


test('game awards weighted keyboard points once and preserves combo in results', async () => {
  const h = harness(); await h.start()
  while (h.audio.currentTime < FULL_LEVEL.events[0].hitAt - .1) h.tick()
  h.controllers[0].grip.position.z -= .06
  h.tick()
  assert.equal(h.game.getDebugState().hits, 1)
  assert.equal(h.game.getDebugState().score, C.keyboardPoints)
  assert.equal(h.game.getDebugState().maxCombo, 1)
  h.tick(); assert.equal(h.game.getDebugState().hits, 1)
  h.game.xrHooks.onExit(); h.game.xrHooks.dispose()
})

test('buffering and long frame gaps pause; stale playback promise cannot restart ended XR', async () => {
  const h = harness(); await h.start()
  h.audio.dispatchEvent(new Event('waiting'))
  assert.equal(h.game.getDebugState().phase, 'paused')
  h.registered[0].action(); await flush()
  h.tick(.5); assert.equal(h.game.getDebugState().phase, 'paused')
  let resolve
  h.audio.play = () => new Promise(r => { resolve = r })
  h.registered[0].action(); assert.equal(h.game.getDebugState().phase, 'starting')
  h.game.xrHooks.onExit(); resolve(); await flush()
  assert.notEqual(h.game.getDebugState().phase, 'playing')
  assert.equal(h.audio.paused, true); assert.equal(h.registered.length, 0)
  h.game.xrHooks.dispose()
})


test('faster approach retains anticipation and doubles original speed', () => {
  const e = FULL_LEVEL.events[0]
  assert.equal(C.readSeconds, .9)
  assert.equal(C.travelSeconds, 1.4)
  assert.equal(cardZ(e, spawnAt(e) + C.portalLeadSeconds + C.readSeconds), -C.spawnDistance)
  assert.equal(cardSpeed(), 2 * (C.spawnDistance - C.hitDistance) / 2.8)
})

test('duck baseline freezes for seated/standing and requires whole window clearance', () => {
  const judge = createDuckJudge()
  for (const height of [0, 1.2, 1.8]) {
    judge.calibrate(height)
    judge.begin(); judge.sample(height - C.duckAmount - .01)
    assert.equal(judge.success(), true)
    assert.equal(judge.clearance(), height - C.duckAmount)
    judge.sample(height)
    assert.equal(judge.success(), false)
    judge.begin(); assert.equal(judge.success(), false, 'no observed tracking cannot count as success')
  }
})

test('all duck windows exclude cards; invalid overlap rejected', () => {
  validateLevel(FULL_LEVEL)
  assert.equal(FULL_LEVEL.ducks.length, 5)
  for (const d of FULL_LEVEL.ducks) {
    assert.ok(Math.abs(duckZ(d, duckSpawnAt(d) + C.portalLeadSeconds + C.duckWarningSeconds) + C.duckSpawnDistance) < 1e-8)
    assert.ok(Math.abs(duckZ(d, d.crossAt)) < 1e-8)
    for (const c of FULL_LEVEL.events) assert.ok(missAt(c) <= duckSpawnAt(d) || spawnAt(c) >= duckEndAt(d))
  }
  assert.throws(() => validateLevel({ ...FULL_LEVEL, ducks: [{ ...FULL_LEVEL.ducks[0], crossAt: 12 }] }), /overlap/)
})

test('pooled duck success/miss once, replay reset and hide', () => {
  const root = new THREE.Group(); const outcomes = []
  const ducks = createDucks(root, FULL_LEVEL.ducks, success => outcomes.push(success))
  const head = new THREE.Vector3(0, -.25, 0)
  ducks.reset(0)
  for (let t = 0; t < FULL_LEVEL.duration; t += 1 / 72) ducks.update(t, head)
  assert.deepEqual(outcomes, [true, true, true, true, true])
  assert.equal(ducks.stats().activeObstacle, false)
  ducks.reset(0); head.y = 0
  for (let t = 0; t < FULL_LEVEL.duration; t += 1 / 72) ducks.update(t, head)
  assert.deepEqual(outcomes, [true, true, true, true, true, false, false, false, false, false])
  assert.equal(root.children.length, 1)
  ducks.reset(); ducks.update(duckSpawnAt(FULL_LEVEL.ducks[0]), head)
  ducks.hide(); assert.equal(ducks.stats().activeObstacle, false)
})


test('late panorama load cannot reattach after disposal; environment budget stays bounded', () => {
  const original = THREE.TextureLoader.prototype.load
  let complete; const texture = new THREE.Texture(); let disposals = 0
  texture.addEventListener('dispose', () => disposals++)
  document.createElementNS = () => ({})
  THREE.TextureLoader.prototype.load = (url, done) => { complete = done; return texture }
  try {
    const scene = new THREE.Scene(); const arena = createArena(scene)
    arena.update(1, 'playing')
    let calls = 0; let triangles = 0
    scene.traverseVisible(o => {
      if (!o.isMesh) return
      calls++
      triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1)
    })
    assert.equal(arena.stats().activeWaveNotes, C.waveNotes)
    assert.ok(calls <= 12); assert.ok(triangles < 12000)
    console.log(`Arena-only upper estimate: ${calls} draws/eye, ${triangles} triangles/eye; 2 textures with panorama loaded.`)
    arena.dispose(); complete(texture)
    assert.ok(disposals >= 1)
    assert.equal(arena.group.children[0].material.map, null)
  } finally {
    THREE.TextureLoader.prototype.load = original
    delete document.createElementNS
  }
})


test('measured local master duration matches full chart (Xing frames and gapless trim)', () => {
  const bytes = readFileSync(new URL('../public/audio/smash-the-hate/i-am-confident.mp3', import.meta.url))
  const xing = bytes.indexOf('Xing'); assert.ok(xing > 0)
  const frames = bytes.readUInt32BE(xing + 8)
  const tag = bytes.indexOf('Lavc', xing); assert.ok(tag > xing)
  const trim = bytes.readUIntBE(tag + 21, 3)
  const seconds = (frames * 1152 - (trim >>> 12) - (trim & 4095)) / 48000
  assert.equal(seconds, FULL_LEVEL.duration)
})

test('physical chart is deterministic, section-bounded and independent of text seeds', () => {
  const snapshot = JSON.stringify(FULL_LEVEL)
  const a = selectComments(110, 1); const b = selectComments(110, 2)
  assert.deepEqual(a, selectComments(110, 1)); assert.notDeepEqual(a, b)
  for (let i = 1; i < a.length; i++) assert.notEqual(a[i], a[i - 1])
  assert.equal(JSON.stringify(FULL_LEVEL), snapshot)
  assert.equal(COMMENTS.length, 43)
  for (const section of FULL_LEVEL.sections) {
    const entries = FULL_LEVEL.events.filter(e => e.section === section.name)
    for (const e of entries) {
      assert.ok(spawnAt(e) >= section.start - 1e-8)
      assert.ok(missAt(e) <= section.end)
      assert.ok(Math.abs(laneX(e.lane)) <= .58)
    }
  }
  assert.deepEqual(chartLimits(FULL_LEVEL), { pooled: 6, near: 2 })
  assert.throws(() => validateLevel({ ...FULL_LEVEL, events: [{ ...FULL_LEVEL.events[0], lane: 'BEHIND' }] }), /lane/)
})

test('total and strike-area limits are independently enforced and chart offset moves every timeline', () => {
  const original = C.chartOffsetSeconds
  try {
    C.chartOffsetSeconds = .1
    validateLevel(FULL_LEVEL)
    const e = FULL_LEVEL.events[0]
    assert.equal(arrivalAt(e), e.hitAt + .1)
    assert.ok(Math.abs(cardZ(e, arrivalAt(e)) + C.hitDistance) < 1e-8)
    assert.ok(Math.abs(duckZ(FULL_LEVEL.ducks[0], FULL_LEVEL.ducks[0].crossAt + .1)) < 1e-8)
  } finally { C.chartOffsetSeconds = original }
  const three = ['L', 'R', 'L_OUT'].map((lane, i) => ({ id: 'near-' + i, lane, hitAt: 10 }))
  assert.throws(() => validateLevel({ duration: 182.4, events: three, ducks: [] }), /near strike/)
  const seven = Array.from({length: 7}, (_, i) => ({ id: 'total-' + i, lane: 'L', hitAt: 10 + i * .51 }))
  assert.throws(() => validateLevel({ duration: 182.4, events: seven, ducks: [] }), /total target/)
})

test('shared atlas stays bounded; six-card updates respect near limits even when every card misses', () => {
  const root = new THREE.Group(); const targets = createTargets(root, FULL_LEVEL, () => {})
  targets.reset(42)
  assert.equal(new Set(targets.entries.map(e => e.mesh.material)).size, 1)
  const map = targets.entries[0].mesh.material.map
  assert.equal(map.image.width, 2048); assert.equal(map.image.height, 1408)
  const head = new THREE.Vector3()
  for (let t = 0; t < FULL_LEVEL.duration; t += 1 / 72) {
    targets.update(t, head)
    const active = targets.entries.filter(e => e.event)
    assert.ok(active.length <= 6)
    assert.ok(active.filter(e => e.position.z >= -C.strikeAreaDistance).length <= 2)
  }
  assert.equal(targets.entries.filter(e => e.event).length, 0)
})

test('musical waves pool/reset and never enter the body corridor', () => {
  const root = new THREE.Group(); const waves = createMusicWaves(root, FULL_LEVEL.waves)
  const mesh = root.children[0]; const matrix = new THREE.Matrix4(); const point = new THREE.Vector3()
  for (let t = 0; t < FULL_LEVEL.duration; t += .1) {
    waves.update(t, true)
    assert.ok(waves.stats().activeWaveNotes <= C.maxWaveNotes)
    if (!mesh.visible) continue
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix); point.setFromMatrixPosition(matrix)
      const m = matrix.elements
      const halfX = (Math.abs(m[0]) + Math.abs(m[4]) + Math.abs(m[8])) / 2
      assert.ok(Math.abs(point.x) - halfX >= C.waveClearance - .001)
    }
  }
  waves.update(1, true); assert.equal(mesh.visible, true)
  waves.update(1, false); assert.equal(mesh.visible, false)
  waves.update(1, true); waves.reset(); assert.equal(mesh.visible, false)
  waves.update(1, true); assert.equal(mesh.visible, true); assert.equal(root.children.length, 1)
})

test('result success uses hit and completion rates, never weapon points', () => {
  assert.equal(classifyResult({hits: 66, score: 6600}, 110, 182.4, 182.4).win, true)
  assert.equal(classifyResult({hits: 65, score: 999999}, 110, 182.4, 182.4).win, false)
  assert.equal(classifyResult({hits: 110, score: 999999}, 110, 90, 182.4).win, false)
  assert.equal(classifyResult({hits: 66}, 110, 182.4, 182.4).characterState, 'confident')
})

test('audio tail is not cut at chart duration; early-ended state cannot win and replay is clean', async () => {
  const h = harness(); h.audio.duration = 183
  await h.start()
  while (h.audio.currentTime < 182.5) h.tick()
  assert.equal(h.game.getDebugState().phase, 'playing')
  while (!h.audio.ended) h.tick()
  assert.equal(h.game.getDebugState().phase, 'results')
  const seed = h.game.getDebugState().replaySeed
  h.registered[0].action()
  assert.equal(h.game.getDebugState().replaySeed, seed + 1)
  assert.equal(h.game.getDebugState().result, null)
  assert.equal(h.game.getDebugState().activeWaveNotes, 0)
  h.game.xrHooks.onExit(); h.game.xrHooks.onEnter(h.xr); h.tick()
  h.registered[0].action()
  for (let i = 0; i < 218; i++) h.tick()
  await flush()
  h.audio.currentTime = 30; h.audio.dispatchEvent(new Event('ended'))
  assert.equal(h.game.getDebugState().result.win, false)
  h.registered[0].action(); assert.equal(h.game.getDebugState().misses, 0)
  h.game.xrHooks.onExit(); h.game.xrHooks.dispose()
})


test('full-scene allocation budget is bounded and no content is allocated on replay', async () => {
  const h = harness()
  const count = () => {
    let draws = 0; let triangles = 0; const textures = new Set()
    h.game.scene.traverse(o => {
      if (o.isMesh) {
        draws++; triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1)
        if (o.material.map) textures.add(o.material.map)
      }
    })
    return { draws, triangles, textures: textures.size + 1 } // plus browser-loaded panorama
  }
  const before = count()
  await h.start()
  h.audio.dispatchEvent(new Event('ended')); h.registered[0].action()
  assert.deepEqual(count(), before)
  assert.ok(before.draws < 40); assert.ok(before.triangles < 12000); assert.ok(before.textures <= 10)
  console.log('Conservative allocated scene budget (includes mutually hidden menus/weapons/cards):', before)
  h.game.xrHooks.onExit(); h.game.xrHooks.dispose()
})
