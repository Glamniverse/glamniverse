// One private media element; never overlaps tracks or modifies the site player.
// Events drive UI; currentTime is the future lyric/environment synchronization clock.
export function createLoftAudio(element, notify = () => {}) {
  let current = null, status = 'idle', disposed = false, generation = 0
  element.loop = false; element.volume = 0.65; element.preload = 'metadata'
  const labels = {
    idle: 'Select a song to play', loading: 'Starting music…', playing: 'Playing',
    paused: 'Paused • Select song to resume', ended: 'Ended • Select song to replay',
    unavailable: 'Audio not available yet', error: 'Audio unavailable • Select song to retry',
  }
  function setStatus(value) {
    if (disposed || status === value) return
    status = value; notify(labels[value])
  }
  function clear() { element.pause(); element.removeAttribute('src'); element.load() }
  const events = {
    playing: () => { if (current?.audioSrc) setStatus('playing') },
    waiting: () => { if (current?.audioSrc && !element.paused) setStatus('loading') },
    ended: () => setStatus('ended'),
    error: () => { element.pause(); if (current?.audioSrc) setStatus('error') },
  }
  for (const [name,handler] of Object.entries(events)) element.addEventListener(name,handler)
  return {
    select(song) {
      if (disposed) return
      const same = current?.id === song.id && element.getAttribute('src') === song.audioSrc
      if (same && !element.paused && status === 'playing') return
      const attempt = ++generation
      element.pause()
      if (!same || status === 'error') {
        clear(); current = song
        if (!song.audioSrc) { setStatus('unavailable'); return }
        element.src = song.audioSrc; element.load()
      }
      setStatus('loading')
      try {
        Promise.resolve(element.play()).then(() => {
          if (!disposed && attempt === generation) setStatus('playing')
        }).catch(() => {
          if (!disposed && attempt === generation) { element.pause(); setStatus('error') }
        })
      } catch {
        if (!disposed && attempt === generation) { element.pause(); setStatus('error') }
      }
    },
    pause() { if (disposed) return; generation++; element.pause(); if (current?.audioSrc) setStatus('paused') },
    release() {
      if (disposed) return
      generation++; current = null; clear(); setStatus('idle')
    },
    getClock: () => ({ songId: current?.id ?? null, seconds: element.currentTime || 0,
      duration: Number.isFinite(element.duration) ? element.duration : null,
      playing: !disposed && !element.paused && status === 'playing', status }),
    dispose() {
      if (disposed) return
      generation++; disposed = true
      for (const [name,handler] of Object.entries(events)) element.removeEventListener(name,handler)
      current = null; clear()
    },
  }
}
