# SMASH THE HATE - Milestone 2 Quest test

One shared renderer/session/scheduler, existing grip weapons and swept collision.
No changes to main.js or the four districts. This is a TEMPORARY TEST CHART, not
an authored musical beat map. Audio.currentTime remains the gameplay clock.

## Test

Run `npm.cmd run dev -- --host 0.0.0.0`. For ADB use
`adb reverse tcp:5173 tcp:5173`, then Quest Browser `http://localhost:5173`.
For wireless testing use the feature branch HTTPS Preview, outside the Vercel
Toolbar context. Enter 3D World > SMASH THE HATE > ENTER VR.
Sit/stand in a comfortable neutral pose before START. After 3-2-1, left grip is
the keyboard and right is the mouse. Gently swing at cards; duck below cyan
frames. No thumbstick movement. Misses never end the round. Results at 60s.
Check replay, Back, system exit, tracking loss/resume and all four districts.

## Exact temporary map

| Seconds | Event / arrival |
| --- | --- |
| 6 | WHO ASKED? left |
| 10 | CRINGE right |
| 18 | DUCK THE DRAMA crosses neutral head plane |
| 23 | NOBODY CARES left |
| 27 | TRY HARDER left + NOT GOOD ENOUGH right |
| 35 | TOUCH GRASS crosses neutral head plane |
| 41 | JUST QUIT right |
| 45 | CRINGE left |
| 53 | LOWER YOUR EXPECTATIONS crosses neutral head plane |
| 58 | WHO ASKED? right |
| 60 | Results, music pauses |

Cards spawn 2.3 seconds before arrival, wait 0.9s at 4m, then move at
2.4643 m/s for 1.4s to the 0.55m hit plane (twice Milestone 1 speed).
Misses retire 0.4058s after arrival, 0.45m behind the neutral plane.
Duck frames spawn 5.5s before crossing, wait 2.5s at 7m, then approach
at 2.3333 m/s for 3s. Judging spans crossAt +/-0.2s; retire at +0.7s.
Validator rejects any card/duck overlap, including warning and retirement.

## Duck calibration and comfort

START/REPLAY positions the fixed play root at the current headset pose; neutral
head Y is then zero in that frame. The frame never follows subsequent ducking.
Success requires tracked eyes at least 0.18m lower throughout the 0.4s crossing
window. No floor-space assumption: works with the existing local reference space.
This is a neutral-plane test, not anatomical body collision. Stay in the starting
area; leaning substantially forward/back is not compensated in the time window.
Failure records duckMisses and resets combo, but no damage, score deduction,
camera effect or loss of card points. Win classification still uses card hit rate.
Tracking/menu interruptions pause the song and judgement, preserving calibration.
Replay/session exit resets obstacles; resource disposal uses the world lifecycle.

## Visual budget and tuning

`config.js` centralizes panoramaYaw (radians), notes/streams/speed, portal pulse,
readSeconds/travelSeconds, duck amount/warning/travel/crossing window and combo
policy. Existing hit threshold remains 0.4m/s; keyboard/mouse score 150/100.

Panorama source is preserved: 1774x887 PNG, 2,499,722 bytes, about 6 MiB RGBA
without mipmaps. No derivative needed; resolution may look soft in Quest.
One 90m sphere, BackSide, unlit MeshBasicMaterial, no depth writes. Yaw is relative
to the calibrated front. A failed image load leaves a dark background and logs a
warning; late completion after world disposal cannot reattach the texture.

18m circular platform, luminous outer rim + two floor rings, three portal rings,
16 instanced radial accents. No lights, shadows, reflections or postprocessing.
48 notes across four streams (64 hard cap), five simple box parts each in ONE
instanced draw. Fixed depths 10/16/22/28m, lateral motion, no approach to player.
No per-frame vector/object allocation in arena animation. Notes hide during pause
and results. Rings stay calm after the song. Countdown progressively lights rings.

Smaller HUD at Y +0.73m, Z -2.2m; original large results/menu geometry retained.
One pooled duck frame: four bars and one reused text plane/texture.
getDebugState() on the game instance provides target/obstacle/note counts,
panorama status and renderer.info snapshot during XR, without an in-headset panel.
Renderer metrics are diagnostic actual render counters, not a promised Quest FPS.

## Checks

`node --check src/main.js`, syntax checks for game modules,
`node --test tests/smash-the-hate.test.js`, `npm.cmd run build`, `git diff --check`.
Tests stub canvas/media/XR and exercise real transforms; they do not establish
Quest framerate, panorama quality, HUD legibility, or comfortable duck amount.
No duck/card overlap, passive-hit rejection, replay and XR cleanup are tested.
No final full-song chart, leaderboard, hands, immersive Portal or other songs.
