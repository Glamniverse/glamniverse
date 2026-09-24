import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { CONFIG as C } from '../src/games/smash-the-hate/config.js'
import { DEMO_LEVEL, validateLevel, spawnAt, missAt, cardZ, duckSpawnAt, duckEndAt, duckZ, cardSpeed } from '../src/games/smash-the-hate/level.js'
import { sweptCardHit, isSwing } from '../src/games/smash-the-hate/collision.js'
import { createTargets } from '../src/games/smash-the-hate/targets.js'
import { createWeapons } from '../src/games/smash-the-hate/weapons.js'
import { createSmashTheHate } from '../src/games/smash-the-hate/index.js'
import { createArena } from '../src/games/smash-the-hate/arena.js'
import { createDuckJudge, createDucks } from '../src/games/smash-the-hate/ducks.js'
import { pulseHaptic } from '../src/games/smash-the-hate/effects.js'

// No WebGL, browser or XR hardware: exercise real Three.js transforms/game logic
// with canvas drawing and media playback stubbed, not a claim of visual validation.
const ctx = { fillRect() {}, strokeRect() {}, fillText() {} }
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
globalThis.window = { innerWidth: 1200, innerHeight: 800 }
class FakeAudio extends EventTarget {
  paused = true; loop = true; volume = 0.43; readyState = 4; currentTime = 0; error = null; src = ''; plays = 0; rejectNext = false
  getAttribute() { return this.src }
  load() {}
  pause() { this.paused = true }
  play() { this.plays++; if (this.rejectNext) { this.rejectNext = false; return Promise.reject(new Error('Autoplay test')) } this.paused = false; return Promise.resolve() }
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
    if (!audio.paused) audio.currentTime += dt
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

test('demo map has eight events, correct approach and at most two active cards', () => {
  validateLevel(DEMO_LEVEL)
  assert.equal(DEMO_LEVEL.events.length, 8)
  for (let t = 0; t <= DEMO_LEVEL.duration; t += 1 / 90) {
    assert.ok(DEMO_LEVEL.events.filter(e => spawnAt(e) <= t && missAt(e) > t).length <= 2)
  }
  const e = DEMO_LEVEL.events[0]
  assert.equal(cardZ(e, spawnAt(e)), -C.spawnDistance)
  assert.ok(Math.abs(cardZ(e, e.hitAt) + C.hitDistance) < 1e-9)
  assert.ok(Math.abs(cardZ(e, missAt(e)) - C.missBehind) < 1e-9)
  assert.throws(() => validateLevel({ ...DEMO_LEVEL, events: [...DEMO_LEVEL.events, DEMO_LEVEL.events[0]] }))
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
  const targets = createTargets(root, DEMO_LEVEL, () => misses++)
  const head = new THREE.Vector3()
  targets.update(4, head); const target = targets.entries.find(t => t.event)
  assert.ok(target); assert.equal(targets.consume(target), true); assert.equal(targets.consume(target), false)
  for (let t = 4; t <= DEMO_LEVEL.duration; t += 1 / 72) targets.update(t, head)
  assert.equal(misses, 7); assert.equal(root.children.length, 2)
  targets.reset(); targets.update(4, head); assert.equal(targets.entries.filter(t => t.event).length, 1)
  assert.equal(root.children.length, 2)
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
  for (let i = 0; i < DEMO_LEVEL.duration * 72 + 2; i++) h.tick()
  const result = h.game.getDebugState()
  assert.equal(result.duckMisses, 3); assert.equal(result.activeObstacle, false); assert.equal(result.phase, 'results'); assert.equal(result.misses, 8); assert.equal(result.hits, 0)
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
  while (h.audio.currentTime < 5.9) h.tick()
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
  const e = DEMO_LEVEL.events[0]
  assert.equal(C.readSeconds, .9)
  assert.equal(C.travelSeconds, 1.4)
  assert.equal(cardZ(e, spawnAt(e) + C.readSeconds), -C.spawnDistance)
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
  validateLevel(DEMO_LEVEL)
  assert.equal(DEMO_LEVEL.ducks.length, 3)
  for (const d of DEMO_LEVEL.ducks) {
    assert.equal(duckZ(d, duckSpawnAt(d) + C.duckWarningSeconds), -C.duckSpawnDistance)
    assert.equal(duckZ(d, d.crossAt), 0)
    for (const c of DEMO_LEVEL.events) assert.ok(missAt(c) <= duckSpawnAt(d) || spawnAt(c) >= duckEndAt(d))
  }
  assert.throws(() => validateLevel({ ...DEMO_LEVEL, ducks: [{ ...DEMO_LEVEL.ducks[0], crossAt: 10 }] }), /overlap/)
})

test('pooled duck success/miss once, replay reset and hide', () => {
  const root = new THREE.Group(); const outcomes = []
  const ducks = createDucks(root, DEMO_LEVEL.ducks, success => outcomes.push(success))
  const head = new THREE.Vector3(0, -.25, 0)
  ducks.reset(0)
  for (let t = 0; t < 60; t += 1 / 72) ducks.update(t, head)
  assert.deepEqual(outcomes, [true, true, true])
  assert.equal(ducks.stats().activeObstacle, false)
  ducks.reset(0); head.y = 0
  for (let t = 0; t < 60; t += 1 / 72) ducks.update(t, head)
  assert.deepEqual(outcomes, [true, true, true, false, false, false])
  assert.equal(root.children.length, 1)
  ducks.reset(); ducks.update(duckSpawnAt(DEMO_LEVEL.ducks[0]), head)
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
    arena.update(10, 'playing')
    let calls = 0; let triangles = 0
    scene.traverseVisible(o => {
      if (!o.isMesh) return
      calls++
      triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1)
    })
    assert.equal(arena.stats().decorativeNotes, 48)
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
