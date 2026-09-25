# All Eyes On Me — local Milestone 1

A **56-second mechanics test**, not the final full-song workout or final art.
No Production entry. `main.js` enables this game in Vite development or when Vercel supplies `VITE_VERCEL_ENV === 'preview'`. No URL allowlist or project setting is needed. An ordinary production build (or Vercel Production) keeps the entry disabled. Preview analytics remains excluded by the existing production-host-only analytics gate.

## Run / Quest test

1. From this repository run `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`.
2. For Quest use the existing ADB setup: `adb reverse tcp:5173 tcp:5173`.
3. Open `http://localhost:5173` in Quest Browser. Plain LAN HTTP is not a secure WebXR context.
4. Explore Glamniverse VR → ALL EYES ON ME — VR FITNESS TEST → ENTER VR.
5. Point a menu ray and select START. Stand/sit neutrally at START; this fixes front and head-height baseline for that round.
6. After 3–2–1, pink targets require the LEFT grip, cyan targets the RIGHT grip. Small punches suffice.
7. Duck about 16 cm for DUCK. Lean about 16 cm left/right for arrows; a sidestep is not required. Keep the physical play area clear. Do not chase targets.
8. At results, PLAY AGAIN restarts from zero. BACK ends XR through the existing Portal lifecycle. System XR exit also stops the song.

Desktop can view the lightweight arena and return; no mouse/keyboard gameplay.
No analytics initializes in Vite development mode. No deployment or settings change is needed.

## Architecture / ownership

- `index.js`: adapted Smash orchestration; loading/ready/countdown/starting/playing/paused/results/disposed. Existing `xrHooks` own audio, stationary mode, menu rays and session cleanup. Audio.currentTime drives all gameplay.
- `config.js`: metres/seconds, colours in rendering modules; tuning for speed, lanes, pool size, swing threshold, duck/lean amount and haptics.
- `level.js`: explicit temporary arrival timestamps and obstacle crossings; validation rejects pool overflow and ANY eye/obstacle coexistence.
- `targets.js`: six pooled stylized eye outlines/irises sharing geometry and two opaque materials. Straight motion; no read phase or chasing the player's position.
- `hands.js`: adapted grip sampling + swept collision. Source handedness determines colour/role, independent of controller index. Small unskinned boxing-glove silhouettes, cuffs and four instanced nail accents per hand.
- `obstacles.js`: one reused outline frame with label and crossed-out-eye symbol. Arrows indicate the open side. Head position is judged in the fixed play-area frame.
- `arena.js`: placeholder dark void, 4.2 m platform, distant 10 m portal, 24 instanced skyline blocks, eight distant instanced eye symbols. No panorama or lighting/postprocessing.
- `audio.js`, `effects.js`: small ownership-dependent copies from Smash, with this game's config. One existing site audio element, short procedural impact, capped instanced fragments, optional haptics.
- Unmodified shared imports: Smash `ui.js` (panel/registry menus) and `collision.js` (relative swept slabs + velocity gate). No shared-engine refactor. Smash files are unchanged.

Scene-attached resources are released by the existing `createWorldLifecycle`; removed grip meshes explicitly dispose their resources. Menu registrations, media/session listeners and in-flight playback tokens reset on exit. Replay resets existing pools rather than rebuilding them.

## Audio verification

Copied from the Windows Downloads known folder; original untouched. Destination:
`public/audio/all-eyes-on-me/all-eyes-on-me.mp3` (5,177,423 bytes).
SHA-256: `2cf7b36b7d6aba55b319bbe721027a7380903b0e37e2873889da1aa89672cf8e`.
48 kHz VBR MPEG Layer III; Xing reports 9112 frames, 218.688 encoded seconds.
Encoder trim (576 + 1681 samples) gives **218.640979 s**, confirmed by browser HTMLAudioElement metadata.
129 BPM remains a supplied estimate. No verified lyric alignment or “Still watching?” timestamp is claimed. Full waveform/lyric marking and tempo analysis are required before Milestone 2; no lyric-triggered effect exists here.

## Temporary test chart (seconds on the song clock)

These are **strike-plane arrival** times, not spawn times:

| Arrival | Target lanes |
| --- | --- |
| 6, 7.4, 8.8, 10.2 | L, R, L, R |
| 11.6, 13 | LC, RC |
| 14.4, 15.8 | LH, RH |
| 17.2, 18.6 | LL, RL |
| 20 | L + R |
| 24.6 | DUCK crossing |
| 29, 30.1, 31.2, 32.3 | L, L, R, R |
| 33.4 | LH + RH |
| 38 | LEFT lean crossing |
| 43, 44.1, 45.2, 46.3 | LC, RC, LL, RL |
| 47.4 | L + R |
| 52 | RIGHT lean crossing |
| 56 | Pause audio, show prototype results |

**18 singles + 3 pairs = 24 physical punch targets; three obstacles.** No final 220–280-target chart.
Targets spawn 2.8 s before arrival, 9 m forward; constant 3.018 m/s toward the 0.55 m strike plane, expire 0.25 m behind the neutral head plane (~0.265 s after arrival). The path never changes with gaze.
Obstacle visibility starts 4 s before crossing and ends 0.65 s after; the judge uses the whole ±0.2 s crossing window. Eyes and obstacles never coexist in this chart.
Normal X = ±0.34 m; centre X = ±0.18 m. Y relative to neutral eyes: normal −0.30 m, high −0.10 m, low −0.48 m. All remain in front.

## Rules / hardware tuning

Correct hand + sweep speed >= 0.4 m/s (and <= 10 m/s) awards 100 points and one combo increment. Wrong hand causes no destruction/penalty; the correct hand may still hit that eye. Misses and failed obstacles break combo, but never end the round. Obstacles track separately and award no points. Tracking gaps > 0.12 s reset pose history/pause; resume is deliberate. Both controllers must track to play. Haptics: 0.18 intensity / 25 ms, optional.

Test both colours with both hands; hold a fist still and let an eye pass (no hit); test a gentle valid swing; disconnect/reconnect; open Quest menu during countdown/game; resume; duck/lean correctly and incorrectly; stay still to miss; Replay after a round; Back/system exit mid-round; re-enter. Verify the baseline does not follow a duck or lean. Re-centering the system reference space mid-round is not a supported calibration workflow: exit and restart neutrally.

Budget is intentionally small: bounded six eyes, one obstacle, 32 fragments. The automated all-pools-and-menus allocation estimate is around 36 draws / 3.4k triangles / 6 textures, before shared rays; active gameplay is lower. Not a measured Quest FPS guarantee. No skinned hands, physics, shadows, transparent stacks, panorama or per-frame analytics.

## Checks

`node --test tests/analytics.test.js tests/smash-the-hate.test.js tests/all-eyes-on-me.test.js`

`npm.cmd run build` checks the Production route (test entry omitted). A Vercel Preview build includes the test entry. Open the supplied HTTPS Preview directly in Quest Browser → Explore Glamniverse VR → ALL EYES ON ME — VR FITNESS TEST → ENTER VR → START. No ADB is needed for Preview.

Milestone 2 should follow hardware acceptance: refine reach/speed/warning cues; verify tempo/sections/lyric timing offline; author the full song with recovery; then add separately approved arena artwork. Do not expand the chart automatically.
