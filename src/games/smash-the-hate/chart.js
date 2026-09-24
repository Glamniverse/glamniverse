// FULL SONG V1: hand-authored workout chart, not runtime beat detection.
// Seconds refer to card arrival at the hit plane. DOUBLE expands to two hits.
// Rough 117.45 BPM grid (0.510856s/beat), with supplied accent overrides.
// These are a first authored pass; musical alignment still needs Quest review.
export const SECTIONS = [
  { name: 'ARRIVAL', start: 0, end: 8, hits: [] },
  { name: 'WARM-UP', start: 8, end: 24, hits: [
    [10.95, 'L'], [12.48, 'R'], [14.01, 'L'], [15.54, 'R'],
    [17.07, 'L'], [18.60, 'R'], [19.69, 'L'], [20.71, 'R'],
    [21.73, 'L'], [22.69, 'R'],
  ] },
  { name: 'WORKOUT 1', start: 24, end: 48, hits: [
    [26.90, 'L'], [27.922, 'R'], [28.944, 'L_OUT'], [29.966, 'R_OUT'],
    [32.01, 'L'], [33.032, 'R'], [34.054, 'L_OUT'], [35.076, 'R_OUT'],
    [37.12, 'L'], [38.142, 'R'], [39.164, 'L_OUT'], [41.84, 'DOUBLE'],
    [43.068, 'R'], [45.09, 'DOUBLE'], [46.112, 'L'], [46.623, 'R'],
  ] },
  { name: 'RECOVERY / DUCK 1', start: 48, end: 56, hits: [] },
  { name: 'WORKOUT 2', start: 56, end: 72, hits: [
    [58.95, 'L'], [59.972, 'R'], [60.994, 'L'], [62.18, 'R'],
    [64.22, 'L'], [65.242, 'R'], [66.264, 'L_OUT'], [67.286, 'R_OUT'],
    [68.308, 'L'], [69.33, 'R'], [70.43, 'DOUBLE'],
  ] },
  { name: 'TRANSITION / DUCK 2', start: 72, end: 80, hits: [] },
  { name: 'WORKOUT 3', start: 80, end: 96, hits: [
    [82.95, 'L_OUT'], [83.972, 'R_OUT'], [84.994, 'L'], [86.016, 'R'],
    [87.548, 'DOUBLE'], [89.08, 'L_OUT'], [90.102, 'R_OUT'],
    [91.124, 'L'], [92.146, 'R'], [93.168, 'L'], [93.679, 'R'], [95.211, 'DOUBLE'],
  ] },
  { name: 'RECOVERY / DUCK 3', start: 96, end: 104, hits: [] },
  { name: 'BUILD / PEAK 1', start: 104, end: 120, hits: [
    [106.95, 'L'], [108.483, 'R'], [110.016, 'L_OUT'], [111.549, 'R_OUT'],
    [112.571, 'L'], [113.082, 'R'], [113.593, 'L'], [114.104, 'R'],
    [115.637, 'L_OUT'], [116.148, 'R_OUT'], [116.659, 'L'], [117.170, 'R'],
    [118.192, 'DOUBLE'], [119.50, 'DOUBLE'],
  ] },
  { name: 'SUSTAINED WORKOUT', start: 120, end: 136, hits: [
    [122.95, 'L'], [123.461, 'R'], [123.972, 'L_OUT'], [124.483, 'R_OUT'],
    [124.994, 'L'], [125.505, 'R'],
    [129.08, 'L_OUT'], [129.591, 'R_OUT'], [130.102, 'L'], [130.613, 'R'],
    [131.124, 'L'], [131.635, 'R'], [133.168, 'DOUBLE'],
  ] },
  { name: 'RECOVERY / DUCK 4', start: 136, end: 144, hits: [] },
  { name: 'FINAL BUILD', start: 144, end: 160, hits: [
    [146.95, 'L'], [147.972, 'R'], [148.994, 'L_OUT'], [150.016, 'R_OUT'],
    [151.038, 'L'], [151.549, 'R'], [152.060, 'L'], [152.571, 'R'],
    [153.99, 'DOUBLE'], [155.522, 'L_OUT'], [156.033, 'R_OUT'],
    [156.544, 'L'], [157.055, 'R'], [158.077, 'DOUBLE'], [159.45, 'DOUBLE'],
  ] },
  { name: 'DUCK / SECOND WIND', start: 160, end: 168, hits: [] },
  { name: 'FINAL COMBO', start: 168, end: 178, hits: [
    [170.95, 'L'], [171.972, 'R'], [173.00, 'L'], [174.022, 'R'],
    [175.044, 'L_OUT'], [175.555, 'R_OUT'], [177.50, 'DOUBLE'],
  ] },
  { name: 'RELEASE', start: 178, end: 182.4, hits: [] },
]

// crossAt: centre of frozen neutral head plane crossing. No cards during walls.
export const DUCKS = [
  { id: 'duck-1', crossAt: 54.1, text: 'DUCK THE DRAMA' },
  { id: 'duck-2', crossAt: 78.1, text: 'TOUCH GRASS' },
  { id: 'duck-3', crossAt: 102.1, text: 'LOWER YOUR EXPECTATIONS' },
  { id: 'duck-4', crossAt: 142.1, text: 'DODGE THE OPINIONS' },
  { id: 'duck-5', crossAt: 166.1, text: 'AVOID THE COMMENTS' },
]
// Explicit starts, NOT a continuously repeating timer. Stronger recovery arcs.
export const WAVES = [
  { at: 0.3, strength: 0.8 }, { at: 23.8, strength: 0.8 },
  { at: 48.2, strength: 1 }, { at: 55, strength: 0.8 },
  { at: 79, strength: 1 }, { at: 102.9, strength: 1 },
  { at: 120, strength: 0.8 }, { at: 142.9, strength: 1 },
  { at: 167, strength: 0.8 }, { at: 178.1, strength: 1 },
]
