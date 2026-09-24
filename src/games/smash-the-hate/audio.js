import { CONFIG as C } from './config.js'

export function createGameAudio(audio, src) {
  let saved = null
  let context = null
  let noise = null
  const voices = new Set()
  function acquire() {
    if (!saved) saved = { loop: audio.loop, volume: audio.volume }
    audio.pause(); audio.loop = false; audio.volume = C.musicVolume
    if (audio.getAttribute('src') !== src) { audio.src = src; audio.preload = 'auto'; audio.load() }
  }
  function release() {
    audio.pause()
    if (saved) { audio.loop = saved.loop; audio.volume = saved.volume; saved = null }
  }
  acquire()
  return {
    element: audio, acquire, release,
    ready: () => audio.readyState >= 3 && !audio.error,
    retryLoad() { audio.load() },
    unlockEffects() {
      try {
        if (!context) {
          const Context = window.AudioContext || window.webkitAudioContext
          if (!Context) return
          context = new Context()
          noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.07), context.sampleRate)
          const data = noise.getChannelData(0)
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2
        }
        context.resume().catch(() => {})
      } catch { /* Optional procedural SFX; music/gameplay do not depend on it. */ }
    },
    impact(strong) {
      if (!context || context.state !== 'running' || voices.size >= 4) return
      const source = context.createBufferSource(); source.buffer = noise
      const gain = context.createGain(); gain.gain.value = C.sfxVolume * (strong ? 1 : 0.65)
      source.connect(gain); gain.connect(context.destination); voices.add(source)
      source.onended = () => { source.disconnect(); gain.disconnect(); voices.delete(source) }
      source.start()
    },
    dispose() {
      release()
      for (const source of voices) { try { source.stop() } catch { /* already ended */ } }
      if (context) context.close().catch(() => {})
      context = null
    },
  }
}
