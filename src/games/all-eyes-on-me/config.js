// Metres and seconds; conservative starting values pending Quest hardware testing.
export const CONFIG = {
  minSwingSpeed: 0.4, maxTrackingSpeed: 10, maxPoseGap: 0.12,
  cardWidth: 0.38, cardHeight: 0.24, cardDepth: 0.04,
  maxTargets: 6, maxStrikeTargets: 2, strikeAreaDistance: 1.1,
  spawnDistance: 9, hitDistance: 0.55, missBehind: 0.25,
  travelSeconds: 2.8, chartOffsetSeconds: 0,
  // No reading/stop phase. These are headset-relative, frozen at START.
  lanes: {
    L: [-0.34, -0.3], R: [0.34, -0.3],
    LC: [-0.18, -0.3], RC: [0.18, -0.3],
    LH: [-0.34, -0.1], RH: [0.34, -0.1],
    LL: [-0.34, -0.48], RL: [0.34, -0.48],
  },
  punchPoints: 100, platformDiameter: 4.2, portalDistance: 10,
  duckAmount: 0.16, dodgeAmount: 0.16,
  obstacleTravelSeconds: 4, obstacleCrossingSeconds: 0.4,
  obstacleClearSeconds: 0.65, obstacleBreaksCombo: true,
  countdownSeconds: 3, musicVolume: 0.7, sfxVolume: 0.04,
  fragmentPool: 32, hitFragments: 7,
  fragmentLifetime: 0.35, hapticStrength: 0.18,
  hapticDurationMs: 25,
}
