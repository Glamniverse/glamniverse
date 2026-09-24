# SMASH THE HATE - Milestone 3 full-song workout

Stationary Quest VR. Existing shared renderer/session/scheduler, grip weapons,
swept collision and 0.4m/s swing gate are preserved. main.js and districts unchanged.

## Run / hardware test

`npm.cmd run dev -- --host 0.0.0.0`. For USB: `adb reverse tcp:5173 tcp:5173`, then
Quest Browser `http://localhost:5173`. Wireless: use the feature branch HTTPS
Preview outside the authenticated Vercel Toolbar context.
Enter 3D World > SMASH THE HATE > ENTER VR. Sit/stand neutral and press START.
The countdown precedes the full song. Left grip = keyboard; right = mouse.
No locomotion or snap turn. Misses never end the round. Test all five ducks,
outer reach, fast bursts, final double, replay, Back, system exit and resume.

## Master / clock

Existing `/audio/smash-the-hate/i-am-confident.mp3`, 4,007,705 bytes, unchanged.
Measured MPEG frames: 7602 including Xing metadata frame; encoded span 182.448s.
Xing declares 7601 audio frames at 48kHz, 1152 samples/frame; Lavc delay/padding
are 576 samples each: **182.400 seconds** gapless duration. Tests verify metadata.
No duplicate audio. `audio.currentTime` drives cards, ducks and waves; actual
`ended` drives results, so the master is never truncated at a chart timestamp.
Countdown uses XR timestamps, as before. Pauses freeze the song and play timeline.

## Authored workout chart

All timestamps live in `chart.js`. They are explicit authored arrivals, not
runtime spawning rules. DOUBLE expands once to left + right (two physical hits).
117.45 BPM / 0.510856s is the design grid, with several supplied accent overrides.
This is a first full-song authored pass, NOT hardware-verified beat alignment.

| Section | Seconds | Singles | Doubles | Physical hits |
| --- | --- | ---: | ---: | ---: |
| Arrival | 0-8 | 0 | 0 | 0 |
| Warm-up | 8-24 | 10 | 0 | 10 |
| Workout 1 | 24-48 | 14 | 2 | 18 |
| Recovery / duck 1 | 48-56 | 0 | 0 | 0 |
| Workout 2 | 56-72 | 10 | 1 | 12 |
| Transition / duck 2 | 72-80 | 0 | 0 | 0 |
| Workout 3 | 80-96 | 10 | 2 | 14 |
| Recovery / duck 3 | 96-104 | 0 | 0 | 0 |
| Build / peak 1 | 104-120 | 12 | 2 | 16 |
| Sustained workout | 120-136 | 12 | 1 | 14 |
| Recovery / duck 4 | 136-144 | 0 | 0 | 0 |
| Final build | 144-160 | 12 | 3 | 18 |
| Duck / second wind | 160-168 | 0 | 0 | 0 |
| Final combo | 168-178 | 6 | 1 | 8 |
| Release | 178-182.4 | 0 | 0 | 0 |

Totals: **86 singles + 12 doubles = 110 hits**, five ducks, ten musical waves.
Important doubles: 41.84, 45.09, 70.43, 87.548, 95.211, 118.192, 119.50,
133.168, 153.99, 158.077, 159.45, 177.50 seconds.
Final six-hit pattern: L 173.00, R 174.022, L_OUT 175.044, R_OUT 175.555,
DOUBLE 177.50; final missed cards retire at 177.9058, before release.

Duck crossings: 54.1 DUCK THE DRAMA; 78.1 TOUCH GRASS;
102.1 LOWER YOUR EXPECTATIONS; 142.1 DODGE THE OPINIONS;
166.1 AVOID THE COMMENTS. Their warning periods start at recovery boundaries.

Wave starts: 0.3, 23.8, 48.2, 55, 79, 102.9, 120, 142.9, 167, 178.1.
Each lasts 4s; last wave completes at 182.1. There are deliberate quiet gaps.

## Tune in config.js

- `platformDiameter`: 4.5m. Thin rim + one subtle inner ring, no nearby structures.
- `portalDistance`: 18m. Three small concentric portal rings. Panorama stays 90m.
- `panoramaYaw`: radians relative to calibrated forward direction.
- `lanePositions`: L -0.36m, R +0.36m. `outerLaneOffset`: +/-0.58m for OUT.
  All cards stay 0.30m below neutral eyes. Outer lanes encourage modest extension.
- `maxTargets`: six total; `maxStrikeTargets`: two within the near zone beginning
  1.1m forward (`strikeAreaDistance`) through the 0.45m-behind retirement plane.
  Validation assumes ALL cards miss; it never relies on successful hits to free slots.
- `portalLeadSeconds`: extra 0.6s preview from 18m to 4m. Cards remain the same mesh
  size, so perspective makes upcoming targets small. Then the unchanged 0.9s read
  phase and 1.4s physical approach follow. At the hit plane, distance is 0.55m.
  Physical speed remains 2.4643m/s. Spawn = arrival -2.9s, miss = arrival +0.4058s.
  The near window is about 0.629s. Short beat bursts remain at most two nearby.
- `chartOffsetSeconds`: positive delays ALL authored events relative to audio;
  0 by default. Revalidate after tuning; offset must keep waves/events in the song.
  `chartBpm` documents the design grid; changing it does not retime authored seconds.
- `waveNotes`: 32; `maxWaveNotes`: 48 hard cap. `waveWidth`: 9m spread.
  `waveClearance`: 1.6m clear half-corridor plus geometry margin. Waves spread outward
  and pass at the sides, continuing 3m behind. Never intentionally enter body space.
  `waveTravelSeconds`: 4. `waveMinimumGap`: 4.5 is a validator frequency guard;
  tune actual start times in chart.js. One active wave pool, one instanced draw.
- Ducks preserve 0.18m required lowering, 2.5s read warning, 3s approach and +/-0.2s
  crossing window. Extra 0.6s portal lead makes spawn = crossing -6.1s. Retire +0.7s.
  START/REPLAY freezes eye baseline in local reference space; it never follows ducks.
  Judgement is at the neutral plane, not body physics. Do not step forward/back.
  Failure increments duckMisses and optionally breaks combo, with no point penalty.
- `winHitRate`: 0.60 (66 of 110 hits), plus `winCompletionRate`: 0.95 of the master.
  Keyboard/mouse still score 150/100; weighted score does NOT determine outcome.
- Existing volumes, haptic strengths, fragment cap and hit threshold remain tunable.

## Text / character feedback

43 supplied fictional short comments in comments.js. Seeded shuffled bags avoid
adjacent repetitions; replay increments seed. Only text varies, never lanes/times.
One 2048x1408 atlas (~11 MiB RGBA, no mipmaps) shared by all six cards; per-card
UVs select text without drawing new textures or changing the event map.

results.js supplies confident / comedic-sad states and text placeholders shown
ONLY on results, with null image slots for future supplied 2D artwork. No final
character mood images exist in this game's image folder. No Blender dependency.

## Performance / ownership

Original 1774x887 panorama PNG (2,499,722 bytes) remains unchanged; ~6 MiB RGBA,
no mipmaps, unlit BackSide sphere. Late load after disposal cannot reattach.
Arena with active wave: 9 draw estimate / 7,266 triangles per eye; down from
Milestone 2's 11 / 11,362. Wave alone: one draw, 1,920 submitted triangles at 32
notes (five small box parts per note). No per-frame object creation in wave update.
Conservative entire allocated scene: 33 mesh draws / 8,300 triangles / 9 textures,
INCLUDING mutually hidden menus, weapon variants, all cards/wall/fragments.
Actual submitted work is lower; shared controller rays are external to this estimate.
These are geometry estimates, NOT measured Quest frame time or an FPS guarantee.
No lights/shadows/reflections/bloom/transparency stacks/simulation/dependencies.

Scene geometry/materials/textures remain owned by the existing world lifecycle.
Replay resets pools without creating meshes/materials/textures. XR exit resets
waves/cards/walls and disposes grip objects as before. World close disposes scene
resources; pause freezes progress. getDebugState() retains optional renderer.info
snapshot and active counts with no normal-view debug panel.

## Checks

`node --check src/main.js`; syntax-check game modules;
`node --test tests/smash-the-hate.test.js`; `npm.cmd run build`; `git diff --check`.
Tests use real Three transforms and stub canvas/media/XR. Hardware must establish
readability, reach, perceived wave motion, workout intensity, exact sync and FPS.
