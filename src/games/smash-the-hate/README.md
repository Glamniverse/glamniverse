# SMASH THE HATE: Quest vertical slice

This is a functional prototype, not final art or a final beat chart. It uses the
existing single renderer, XR session and animation loop. Back ends XR and returns
to the browser Portal. The four music districts retain their existing defaults.

## Run and test

From the repository in Windows PowerShell:

```powershell
npm.cmd run dev -- --host 0.0.0.0
```

For the previously used USB/ADB workflow (ADB must already be installed and Quest
USB debugging authorized), use the port printed by Vite, normally 5173:

```powershell
adb reverse tcp:5173 tcp:5173
```

In Quest Browser open `http://localhost:5173`, then **Enter 3D World → SMASH THE
HATE → ENTER VR**. A plain LAN HTTP IP usually is not a secure WebXR context.
Wireless testing requires a separate HTTPS Preview deployment; none is created by
this milestone. Use a direct Preview without the authenticated Vercel toolbar.

Point a controller ray at START and press trigger. Track both controllers.
The 3–2–1 countdown precedes music. Left grip: keyboard; right grip: mouse.
Swing gently, stay in place. No thumbstick movement or snap turning is enabled.
Misses are harmless. Menu rays return at results and pause. BACK TO GLAMNIVERSE
ends XR through the existing lifecycle. Quest system Exit also pauses music and
cleans weapons/menu targets; entering again starts a fresh round.

If autoplay is rejected, RESUME retries from the deliberate select gesture.
Tracking loss, buffering, a long frame interruption or the headset system menu
pauses the round. Return both controllers to tracking and select RESUME.

## Temporary chart

`level.js`: 36 seconds, **8 cards**. `hitAt` is arrival at the hit plane, not spawn.
The supplied final master is `/audio/smash-the-hate/i-am-confident.mp3`.

| Arrival seconds | Lane | Text |
| --- | --- | --- |
| 6 | left | WHO ASKED? |
| 10 | right | CRINGE |
| 14 | left | NOBODY CARES |
| 20 | left | TRY HARDER |
| 20 | right | NOT GOOD ENOUGH |
| 25 | right | JUST QUIT |
| 29 | left | CRINGE |
| 33 | right | WHO ASKED? |

These times are deliberately spaced testing events, **not musically authored
synchronization**. The song stops at 36 seconds for results (or earlier if the
media ends). Replay starts at zero. Events use `audio.currentTime`; no accumulated
frame clock drives card positions. Countdown uses XR frame timestamps.

## Tuning

Edit `config.js`, then reload before testing. Units are metres and seconds unless
named otherwise. Lower `minSwingSpeed` (initially 0.4 m/s) for gentler hits. Tune
`maxTrackingSpeed` / `maxPoseGap` conservatively to reject tracking discontinuities.
`weaponHands` swaps left/right roles; controller indices do not determine weapons.

`cardWidth`, `cardHeight`, `laneOffset` and `targetBelowEyes` control comfortable
presentation. `spawnDistance`, `hitDistance`, `missBehind`, `readSeconds` and
`travelSeconds` define the path; speed is derived, not independently specified.
Default anticipation is 0.9s and approach to the hit plane is 2.8s. Spawn is 4m
forward; the hit plane is 0.55m forward; missed cards retire 0.45m behind the start
plane. Targets are 0.64 × 0.28m, 0.30m below the calibrated eye level, in lanes
±0.36m. The fixed round frame is captured on START/REPLAY; targets do not chase you.
The decorative platform is eye-relative, not calibrated to the real floor.

Keep `maxTargets` at 2. The chart validator rejects overlaps exceeding the pool.
Keyboard/mouse award 150/100 points. Win rate is 0.6 of all chart cards; weighted
score does not determine winning. HUD tracks score/combo/hits; results add misses
and max combo. There is no failure/game-over mid-round.

`musicVolume`, `sfxVolume`, haptic strengths/duration and fragment limits are also
here. SFX is short generated noise with at most four simultaneous voices; it and
haptics may be absent without blocking gameplay. Fragments are a 48-instance
shared pool, with 10 per keyboard hit / 6 per mouse hit and 0.45s lifetime.

## Ownership and modules

- `index.js`: round state, fixed play frame, UI/audio/session lifecycle.
- `level.js`: temporary map, validation, analytic event timing.
- `targets.js`: pooled text cards; two shared-canvas texture views.
- `weapons.js` + `collision.js`: grip visuals and swept collision, speed gate.
- `arena.js`, `ui.js`, `effects.js`, `audio.js`: bounded presentation/media helpers.

Existing HTML song audio is borrowed, paused, set non-looping, and its volume/loop
settings restored on exit. No previous song auto-resumes. The game source remains
paused until normal site controls select another song. Scene resources are owned
by the existing world lifecycle; grip resources are disposed on every XR exit.
A read-only `getDebugState()` factory result supports automated tests; it is not a
global debug overlay. No network service, package, physics engine or backend.

## Checks and hardware limitations

```powershell
node --check src/main.js
node --test tests/smash-the-hate.test.js
npm.cmd run build
git diff --check
```

Tests stub canvas/media/XR poses, and use real Three.js transforms. They do not
validate WebGL rendering, Quest grip ergonomics, readability, actual haptics,
autoplay policies or frame rate. Collision uses expanded card bounds as a cheap
approximation while the card yaws toward the headset. It is not precise mesh
collision. First tune sensitivity, reach, weapon orientation and card readability
on hardware; test seated and standing. Also regression-test all four districts.

No duck walls, leaderboards, hand tracking, immersive Portal, final chart, detailed
hands, animated avatar, deployment or desktop game is included.
