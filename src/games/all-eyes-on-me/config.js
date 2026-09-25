// Metres and seconds; conservative starting values pending Quest hardware testing.
export const CONFIG = {
  minSwingSpeed: 0.4, maxTrackingSpeed: 10, maxPoseGap: 0.12,
  cardWidth: 0.38, cardHeight: 0.24, cardDepth: 0.04,
  maxTargets: 6, maxStrikeTargets: 2, strikeAreaDistance: 1.1,
  spawnDistance: 9, hitDistance: 0.55, missBehind: 0.25,
  travelSeconds: 1.55, chartOffsetSeconds: 0,
  // No reading/stop phase. These are headset-relative, frozen at START.
  lanes: {
    L: [-0.34, -0.20], R: [0.34, -0.20],
    LC: [-0.18, -0.20], RC: [0.18, -0.20],
    LH: [-0.34, -0.1], RH: [0.34, -0.1],
    LS: [-0.55, -0.20], RS: [0.55, -0.20],
  },
  punchPoints: 100, platformDiameter: 4.2, portalDistance: 22,
  // Image eye centre approximately (901,400) in the unchanged 1774x887 artwork.
  portalX: -1.1, portalY: 3.4, distantLeadSeconds: 0.65,
  waveDuration: 6, maxWaves: 2, waveClearance: 2.2, waveRadius: 5,
  panoramaRadius: 90, panoramaYaw: Math.PI / 2, // centre of artwork faces forward
  minTargetGap: 0.23, // never simultaneous; half-beat bursts remain readable,
  duckAmount: 0.16, dodgeAmount: 0.16,
  obstacleTravelSeconds: 2.6, obstacleCrossingSeconds: 0.4,
  obstacleClearSeconds: 0.65, obstacleBreaksCombo: true,
  countdownSeconds: 3, musicVolume: 0.7, sfxVolume: 0.45, maxImpactVoices: 3,
  fragmentPool: 32, hitFragments: 7,
  fragmentLifetime: 0.35, hapticStrength: 0.18,
  hapticDurationMs: 25,
}
