// World units are metres. Tune on Quest; these are prototype starting values.
export const CONFIG = {
  minSwingSpeed: 0.4,       // m/s of weapon motion; card motion alone cannot score
  maxTrackingSpeed: 10,    // reject pose jumps instead of awarding phantom hits
  maxPoseGap: 0.12,        // seconds; reset sweep history after long frames
  weaponHands: { keyboard: 'left', mouse: 'right' },
  keyboardPoints: 150,
  mousePoints: 100,
  cardWidth: 0.64,
  cardHeight: 0.28,
  cardDepth: 0.035,
  maxTargets: 6,          // total visible/pooled cards, including distant previews
  maxStrikeTargets: 2,    // independent cap; validated assuming every card misses
  strikeAreaDistance: 1.1, // near zone begins this far forward, ends at miss plane
  portalLeadSeconds: 0.6, // extra distant preview; read/physical approach unchanged
  chartOffsetSeconds: 0,  // positive shifts cards, ducks and waves later in the audio
  chartBpm: 117.45,       // design grid only; timestamps live in chart.js
  platformDiameter: 4.5,
  portalDistance: 18,
  outerLaneOffset: 0.58, // gentle extension; hardware-tune for seated reach
  lanePositions: { L: -0.36, R: 0.36 }, // OUT lanes use +/- outerLaneOffset
  spawnDistance: 4,
  hitDistance: 0.55,
  missBehind: 0.45,
  targetBelowEyes: 0.30,
  readSeconds: 0.9,
  travelSeconds: 1.4,
  // Panorama is an unlit sphere; yaw is radians relative to round-start front.
  panoramaYaw: 0,
  panoramaRadius: 90,
  waveNotes: 32,
  maxWaveNotes: 48,       // hard upper bound also enforced by implementation
  waveWidth: 9,          // half-width of distant arc
  waveClearance: 1.6,    // note CENTRES remain outside +/- this X corridor
  waveTravelSeconds: 4,
  waveMinimumGap: 4.5,   // frequency guard; explicit wave starts in chart.js
  waveBehindDistance: 3,
  portalPulseAmount: 0.08,
  portalPulseSpeed: 1.5,
  duckAmount: 0.18, // eye centre must lower 18cm from frozen START pose
  duckWarningSeconds: 2.5,
  duckTravelSeconds: 3,
  duckCrossingSeconds: 0.4, // total window around neutral head plane
  duckSpawnDistance: 7,
  duckWidth: 3.6,
  duckBreaksCombo: true,
  countdownSeconds: 3,
  musicVolume: 0.7,
  sfxVolume: 0.06,
  winHitRate: 0.6,
  winCompletionRate: 0.95, // early/truncated playback cannot win solely on points
  fragmentPool: 48,
  keyboardFragments: 10,
  mouseFragments: 6,
  fragmentLifetime: 0.45,
  hapticKeyboard: 0.25,
  hapticMouse: 0.14,
  hapticDurationMs: 35,
}
