import { CONFIG as C } from './config.js'

// Precompute a soft low-frequency thump + filtered fabric/noise transient.
// No downloads; no oscillator/filter graphs allocated per punch.
export function synthesizePaddedImpact(sampleRate) {
  const data=new Float32Array(Math.ceil(sampleRate*0.18))
  let phase=0,seed=12345,filtered=0,peak=0
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate
    seed=(Math.imul(seed,1664525)+1013904223)>>>0
    const white=seed/2147483648-1
    filtered+=Math.min(1,2*Math.PI*850/sampleRate)*(white-filtered)
    phase+=2*Math.PI*(62+95*Math.exp(-t*45))/sampleRate
    const attack=Math.min(1,t/0.003),tail=Math.min(1,(0.18-t)/0.025)
    data[i]=attack*tail*(0.8*Math.sin(phase)*Math.exp(-t*25)+0.6*filtered*Math.exp(-t*38)+0.08*white*Math.exp(-t*180))
    peak=Math.max(peak,Math.abs(data[i]))
  }
  for(let i=0;i<data.length;i++)data[i]*=0.85/Math.max(peak,1e-9)
  return data
}

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
    for(const source of voices){try{source.stop()}catch{/* already ended */}}
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
          noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.18), context.sampleRate)
          const data = noise.getChannelData(0)
          data.set(synthesizePaddedImpact(context.sampleRate))
        }
        context.resume().catch(() => {})
      } catch { /* Optional procedural SFX; music/gameplay do not depend on it. */ }
    },
    impact() {
      if (!context || context.state !== 'running' || voices.size >= C.maxImpactVoices) return
      const source = context.createBufferSource(); source.buffer = noise
      const gain = context.createGain(); gain.gain.value = C.sfxVolume
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
