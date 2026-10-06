# Bichon M3: Quest Preview evaluation only

The user visually approved `glamniverse-bichon-m3-standup-final-review.blend` in motion, then explicitly accepted these local deformation regressions **for Quest-only evaluation**:

| Edge | Original ratio | Candidate ratio | Original / candidate posed length |
| --- | --- | --- | --- |
| 5472 | 0.5599 | 2.5290 | 3.375 / 15.245 mm |
| 19789 | 1.5855 | 2.5893 | 12.341 / 20.154 mm |

This is not a global validator relaxation or Production approval. Visible stretching, pinching, tearing, chest distortion or unnatural forelegs in Quest require REJECT/TUNE. No additional deformation repair was performed for this integration. The 21 rear-region edges over 2.5, including the 2.8809 maximum at edge 6619, pre-exist in the approved original StandUp.

## Export verification

Candidate SHA-256: `398e65684de6c5c8c7fb45b55e7b4a082def35fd4283c92405f69276c237c052`.
M2: 753,672 bytes; M3: 791,368 bytes (+37,696).
Seven meshes, three materials, 23,088 triangles, no image textures, 27 joints including shoulder_R_deform and shoulder_L_deform, at most four influences.
Idle 4 s; Trot 0.8 s; HappyHop 1.6 s; StandUp 2.8 s.

Actual GLTFLoader/AnimationMixer CPU skinning was compared with Blender references across all 280 frames and all mesh vertices. Largest difference: 0.010868 mm (StandUp); rest/bind difference: 0.000098 mm. No meaningful export amplification was found. Full local reports/scripts remain in the Bichon authoring workspace; the previous runtime GLB remains recoverable from the parent Git commit and a separate authoring-workspace backup.

## Runtime

Successful pets alternate HappyHop, StandUp. Automatic greetings retain HappyHop. Fresh XR reset starts the alternation with HappyHop. One mixer, one target, unchanged 3.5 s pet cooldown and 3 s PET_REACTION window. StandUp uses 180 ms preparation to face the user, then holds body yaw during its existing clip; transitions blend over 180 ms. HappyHop keeps its existing tail overlay; StandUp uses its authored tail animation. Interruptions stop StandUp safely; reality switching retains the same companion instance. No movement or stopping-distance changes.

## Bark

Happy bark gain 0.24 -> 0.55; bark-only reference distance 1 -> 2 m; bark-only inverse-distance rolloff 1.5 -> 1.0. HRTF, world position, max distance 10 m, 12 s bark cooldown and single shared voice remain.
At horizontal separation 1.05 m, ear height 1.6 m and source height 0.3 m, distance is about 1.67 m. Estimated gain before HRTF/source level: about 0.119 -> 0.55 (4.6x, about +13.3 dB). Gain remains below unity; no source normalization or music-level changes. Actual perceived loudness and combined music/headset output require hardware review.
Whimper remains gain 0.075, reference distance 1 m, rolloff 1.5, 36 s cooldown, and the existing departure/affection behavior.

## Hardware gate

Inspect rise, upright hold and return from front/side at normal interaction distance. Confirm grounded hind paws, recovery, both reactions, bark audibility with music, whimper, reality persistence and locomotion. Production remains forbidden until explicit user approval and a separate release request.
