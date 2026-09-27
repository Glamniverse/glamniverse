export const CONFIG = Object.freeze({
  width: 14, depth: 12, height: 4.8,
  selectorDistance: 2.4, // metres, inside the existing 5m controller ray range
  virtualEyeHeight: 1.6, // local reference space has no physical floor estimate
})

// Reality definitions own assets/themes; persistent room, dog and XR rig do not.
export const ENVIRONMENTS = Object.freeze({
  'daydream-sky': Object.freeze({ panorama:'/images/sky-loft/daydream.png',
    yaw:Math.PI/2, radius:180, background:0x242039,
    ambient:0xe5c5e9, ambientIntensity:1.55, visitors:'butterflies' }),
  'sky-city': Object.freeze({
    panorama: '/images/sky-loft/neon-city-loft.png',
    yaw: 0, radius: 180, background: 0x080917,
    ambient: 0xafa0da, ambientIntensity: 1.7, visitors: 'neon-mantas',
  }),
})
// Image centre (u=.5) faces -Z with this SphereGeometry yaw; painted foreground stays below the horizon.
export const TRANSITION_SECONDS = 2.4
export const SONGS = Object.freeze([
  Object.freeze({ id: 'neon-therapy', title: 'Neon Therapy', audioSrc: '/neon-therapy.mp3',
    environmentId: 'sky-city', theme: Object.freeze({ accent: '#66d9ef' }), lyrics: null }),
  Object.freeze({ id: 'daydream', title: 'Daydream', audioSrc: '/audio/sky-loft/daydream.mp3',
    environmentId: 'daydream-sky', theme: Object.freeze({ accent: '#edb4df' }), lyrics: null }),
])

export const REALITIES = Object.freeze(Object.fromEntries(SONGS.map(song=>[song.id,song])))

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

// Original Bichon M2; loader/motion configuration lives with the companion.
export { COMPANION_SETTINGS as COMPANION } from './companion-motion.js'
