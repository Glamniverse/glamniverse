import test from 'node:test'
import assert from 'node:assert/strict'
import { createAnalyticsInitializer, OPT_OUT_KEY } from '../src/analytics.js'

function fixture(href = 'https://www.glamniverse.music/', values = new Map()) {
  const messages = [], calls = [], replacements = []
  const browser = {
    location: { href }, document: { querySelector: () => null },
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) },
    history: { state: { retained: true }, replaceState(state, title, path) { replacements.push({ state, path }); browser.location.href = new URL(path, href).href } },
  }
  let loads = 0
  const options = { load: async () => { loads++; return { inject: o => calls.push(o) } }, notify: (doc, message) => messages.push(message) }
  return { browser, values, messages, calls, replacements, options, loads: () => loads, run: createAnalyticsInitializer(options) }
}

test('production initializes once; only pageviews allowed; opt-out checked again before send', async () => {
  const f = fixture()
  await Promise.all([f.run({ production: true, browser: f.browser }), f.run({ production: true, browser: f.browser })])
  assert.equal(f.loads(), 1); assert.equal(f.calls.length, 1)
  const event = { type: 'pageview', url: f.browser.location.href }
  assert.equal(f.calls[0].beforeSend(event), event)
  assert.equal(f.calls[0].beforeSend({ type: 'event' }), null)
  f.values.set(OPT_OUT_KEY, 'true')
  assert.equal(f.calls[0].beforeSend(event), null)
})
test('all non-production hosts, IP addresses and HTTP are excluded', async () => {
  for (const href of ['http://localhost:5174', 'https://localhost', 'http://127.0.0.1:5174', 'https://192.168.1.12', 'https://10.0.0.2', 'https://[::1]', 'https://preview.vercel.app', 'https://glamniverse.music', 'http://www.glamniverse.music', 'https://www.glamniverse.music:5174']) {
    const f = fixture(href); await f.run({ production: true, browser: f.browser }); assert.equal(f.loads(), 0, href)
  }
  const f = fixture(); await f.run({ production: false, browser: f.browser }); assert.equal(f.loads(), 0)
})
test('off persists before loading, preserves URL/hash/state, and survives a new page initialization', async () => {
  const f = fixture('https://www.glamniverse.music/?analytics=off&utm_source=test#vibes')
  await f.run({ production: true, browser: f.browser })
  assert.equal(f.loads(), 0); assert.equal(f.values.get(OPT_OUT_KEY), 'true')
  assert.deepEqual(f.replacements, [{ state: { retained: true }, path: '/?utm_source=test#vibes' }])
  assert.equal(f.messages[0], 'Analytics disabled on this browser.')
  await createAnalyticsInitializer(f.options)({ production: true, browser: f.browser })
  assert.equal(f.loads(), 0)
})
test('on clears stored preference before initializing and removes only control parameter', async () => {
  const f = fixture('https://www.glamniverse.music/?analytics=on#music', new Map([[OPT_OUT_KEY, 'true']]))
  await f.run({ production: true, browser: f.browser })
  assert.equal(f.values.has(OPT_OUT_KEY), false); assert.equal(f.loads(), 1)
  assert.equal(f.browser.location.href, 'https://www.glamniverse.music/#music')
})
test('preference controls work locally but do not enable dev collection', async () => {
  const f = fixture('http://localhost:5174/?analytics=on')
  await f.run({ production: false, browser: f.browser }); assert.equal(f.loads(), 0); assert.equal(f.messages.length, 1)
})
test('storage failures fail closed, including off/on; history failures cannot send control URL', async () => {
  for (const query of ['', '?analytics=on', '?analytics=off']) {
    const f = fixture('https://www.glamniverse.music/' + query)
    Object.defineProperty(f.browser, 'localStorage', { get() { throw Error('blocked') } })
    await f.run({ production: true, browser: f.browser }); assert.equal(f.loads(), 0)
  }
  const f = fixture('https://www.glamniverse.music/?analytics=on')
  f.browser.history.replaceState = () => { throw Error('blocked') }
  await f.run({ production: true, browser: f.browser }); assert.equal(f.loads(), 0)
})
test('module/injection failures are swallowed and not retried', async () => {
  for (const load of [async () => { throw Error('blocked module') }, async () => ({ inject() { throw Error('blocked script') } })]) {
    const f = fixture(), run = createAnalyticsInitializer({ ...f.options, load })
    await assert.doesNotReject(run({ production: true, browser: f.browser }))
    await assert.doesNotReject(run({ production: true, browser: f.browser }))
  }
})
test('opt-out during asynchronous module load prevents injection', async () => {
  const f = fixture(); let resolve
  const run = createAnalyticsInitializer({ ...f.options, load: () => new Promise(r => { resolve = r }) })
  const pending = run({ production: true, browser: f.browser })
  f.values.set(OPT_OUT_KEY, 'true'); resolve({ inject: o => f.calls.push(o) })
  await pending; assert.equal(f.calls.length, 0)
})
test('conflicting controls prefer off; unknown values do not change preference', async () => {
  const f = fixture('https://www.glamniverse.music/?analytics=on&analytics=off')
  await f.run({ production: true, browser: f.browser }); assert.equal(f.loads(), 0); assert.equal(f.values.get(OPT_OUT_KEY), 'true')
  const g = fixture('https://www.glamniverse.music/?analytics=anything', new Map([[OPT_OUT_KEY, 'true']]))
  await g.run({ production: true, browser: g.browser }); assert.equal(g.loads(), 0); assert.equal(g.replacements.length, 0)
})
