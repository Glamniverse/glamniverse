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
  maxTargets: 2,
  spawnDistance: 4,
  hitDistance: 0.55,
  missBehind: 0.45,
  laneOffset: 0.36,
  targetBelowEyes: 0.30,
  readSeconds: 0.9,
  travelSeconds: 1.4,
  // Panorama is an unlit sphere; yaw is radians relative to round-start front.
  panoramaYaw: 0,
  panoramaRadius: 90,
  noteStreams: 4,
  notesPerStream: 12, // hard capped to 64 instances total
  noteSpeed: 0.55,   // lateral metres/second, never toward player
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
  fragmentPool: 48,
  keyboardFragments: 10,
  mouseFragments: 6,
  fragmentLifetime: 0.45,
  hapticKeyboard: 0.25,
  hapticMouse: 0.14,
  hapticDurationMs: 35,
}
