export const CONFIG = Object.freeze({
  width: 14, depth: 12, height: 4.8,
  selectorDistance: 2.4, // metres, inside the existing 5m controller ray range
  virtualEyeHeight: 1.6, // local reference space has no physical floor estimate
})

// M1 selections share ONE placeholder view. No final song worlds or playback yet.
export const ENVIRONMENTS = Object.freeze({
  'sky-city': Object.freeze({
    panorama: '/images/smash-the-hate/arena-360.png',
    yaw: 0, radius: 180, background: 0x080917,
    ambient: 0xafa0da, ambientIntensity: 1.7,
  }),
})
export const SONGS = Object.freeze([
  Object.freeze({ id: 'neon-therapy', title: 'Neon Therapy', audioSrc: null,
    environmentId: 'sky-city', theme: Object.freeze({ accent: '#66d9ef' }), lyrics: null }),
  Object.freeze({ id: 'daydream', title: 'Daydream', audioSrc: null,
    environmentId: 'sky-city', theme: Object.freeze({ accent: '#d5a5ef' }), lyrics: null }),
])

// Pure state, separate from XR/graphics. Future audio/lyrics can subscribe here.
export function createSelection(onChange = () => {}) {
  let selected = SONGS[0]
  let disposed = false
  return {
    get: () => selected,
    select(id) {
      if (disposed) return false
      const song = SONGS.find(entry => entry.id === id)
      if (!song || song === selected) return false
      selected = song; onChange(song); return true
    },
    dispose() { disposed = true },
  }
}
