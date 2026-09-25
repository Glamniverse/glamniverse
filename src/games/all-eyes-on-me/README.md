# All Eyes On Me — M3 full-song Preview

Quest-approved M2 remains commit `53edc53e24190a9b137053de05112e74f0e264b3`. M3 is a new hardware candidate, not a Production release.

## Entry and controls

Homepage → GLAMNIVERSE VR EXPERIENCES → ALL EYES ON ME — VR FITNESS TEST → ENTER VR → START. Both games now have their own homepage cards. Explore the musical worlds opens only the existing four districts. Smash remains available in ordinary Production builds; All Eyes is gated by Vite DEV or `VITE_VERCEL_ENV === 'preview'`. Existing Analytics excludes Preview/local hosts. No Vercel settings change.

Start neutrally with room for small punches and leans. Pink = left, cyan = right. Side eyes retain outward chevrons; no low lanes or simultaneous punches. No thumbstick movement or snap turning. Correct-hand swept punch ≥0.4 m/s required; stationary overlap and wrong-hand contact cannot score. M2 fists/nails, 100 points/hit, haptics and padded thump are unchanged. Music volume 0.7; impact gain 0.45, three voices maximum. Misses/failed obstacles break combo but never end the workout.

## Full song and authored choreography

Unchanged master `public/audio/all-eyes-on-me/all-eyes-on-me.mp3`: **218.640979 s**, 5,177,423 bytes, SHA-256 `2cf7b36b7d6aba55b319bbe721027a7380903b0e37e2873889da1aa89672cf8e`.

`chart.js` holds human-readable explicit beat:lane pairs grouped into workout sections, 11 obstacle beats and 27 wave beats. Parsing happens once, not per frame. `level.js` owns timing/validation. Change chart rows to tune choreography; change config values for reach, presentation, offset and pool caps.

**235 punches: 118 pink/left, 117 cyan/right, including 48 side punches.** Overall ~64.5 punches/minute including recovery. Shortest gap ~0.2382 s; no exact simultaneous hits. All targets are within the song and safe pool limits (six total, at most two near strike plane).

| Workout section | Seconds approximately | Punches | Punches/min including gaps |
|---|---|---:|---:|
| Arrival | 0–7.668 | 4 | 31.3 |
| Warm up | 7.668–22.994 | 16 | 62.6 |
| Build | 22.994–38.319 | 16 | 62.6 |
| First energy lift | 38.319–53.645 | 18 | 70.5 |
| Sustained chorus | 53.645–76.633 | 29 | 75.7 |
| Breathing phrase | 76.633–91.837 | 9 | 35.5 |
| Second work block | 91.837–114.705 | 29 | 76.1 |
| Recovery and restart | 114.705–129.950 | 9 | 35.4 |
| Rebuild | 129.950–145.195 | 16 | 63.0 |
| Long confidence block | 145.195–168.063 | 28 | 73.5 |
| Final lift | 168.063–190.931 | 29 | 76.1 |
| Final drive | 190.931–209.988 | 24 | 75.6 |
| Last phrase and release | 209.988–218.641 | 8 | 55.5 |

These labels describe fitness/energy choreography, not verified vocal section names. Density follows measured energy: lighter opening, higher energy around 38–76 s, recovery around 76–92 and 115–130 s, renewed work, lighter transition before the strong 168+ s final section. It is not repetition of the 56-second slice.

### Local audio evidence / uncertainty

Rechecked actual MP3 using preinstalled CapCut FFmpeg and bundled NumPy, no downloads or dependencies: 11025 Hz mono decode; 1024-point Hann FFT; 110-sample hop; positive log spectral flux with local baseline removal; autocorrelation across 1/2/4-beat lags. Decoded duration 218.640998 s (resampling rounding), browser metadata 218.640979 s.

8–56 s supports **125.28 BPM**; 56–112 s whole-window estimate 125.30. Shorter later windows (90–110, 110–130, 130–150, 150–170, 170–190, 190–214) support **125.94 BPM**. Pulse anchors include 90.407, 110.429, 130.439, 150.443, 170.423 and 190.395 s. Use a working two-segment grid: beat 0 at 0.005 s / 125.28 BPM; beat 176 at 84.214 s / 125.94 BPM. The transition is placed in a breathing phrase. This is approximate signal-derived alignment; hardware fine tuning is still required. `chartOffsetSeconds` shifts all gameplay and waves together.

Energy measured per 16 beats supports the workout arc: opening RMS ~0.13–0.19, first lift ~0.315, 61–76 s ~0.31–0.33, 115–122 s ~0.189, 160–169 s ~0.202, final sustained portions ~0.29–0.34.

**Still watching? omitted.** Signal analysis does not identify words; no reliable timestamped lyric/transcription was available. No guessed vocal event, no blinking/video panorama. A later verified lyric cue can schedule an ordinary wave/portal pulse without changing the arena asset.

## Portal alignment and target motion

Approved panorama remains unchanged: 1774×887, `public/images/all-eyes-on-me/arena-360.png`, SHA-256 `346d02b860a044870148d6bc58009a0818c6cf6361944b29753cc4c725b127c2`. One unlit inward sphere at 90 m, yaw PI/2, no mipmaps (~6 MiB decoded).

Artwork eye centre measured approximately pixel (901,400). Inward sphere UV orientation maps this to **portal (-1.1, +3.4, -22) m relative to neutral round-start headset**: ~2.86 degrees left and 8.77 degrees up. The 3D ring aligns with the inner eye feature, not a replacement full background circle. Automated direction check is within 0.3 degrees. Actual Quest visual alignment remains the acceptance test.

Targets now appear **2.20 s before intended strike**: 0.65 s of distant Hermite presentation from that shared portal origin, then the unchanged **1.55 s / 5.452 m/s** M2 near approach starting 9 m away. Position and velocity join continuously; there is no stop/teleport. Distant X/Y curves settle into the exact M2 near lane trajectory; final side reach stays ±0.55 m at Z −0.55 m (~45 degrees), normal/high Y −0.20/−0.10 m. Audio.currentTime remains authoritative throughout. No changes to punch collision thresholds or headset ownership.

## Obstacles

4 DUCK, 4 LEAN LEFT, 3 LEAN RIGHT. Crossings in seconds:
- DUCK: 22.036, 75.675, 128.997, 189.979.
- LEFT: 37.361, 90.884, 144.243, 209.035.
- RIGHT: 52.687, 113.752, 167.111.

Existing 2.6 s approach from 9 m, 0.4 s crossing window and 0.65 s clearance unchanged. Frozen neutral height/lean baseline; 16 cm movement. Validation excludes *all* active punch targets from the whole obstacle visibility interval, with several beats of choreography recovery on both sides. No random body reversals.

Large high-contrast `↓ DUCK ↓`, `← LEAN LEFT`, `LEAN RIGHT →` sit in the frame, using the existing canvas panel mechanism enlarged to 2.6×0.42 m with more of its texture occupied by text. One opaque label, clear lower/body opening, no giant full-screen sheet.

## Environmental waves and budget

`waves.js`: 27 scheduled 6-second neon rings from portal to 4 m behind the player. One instanced draw call, shared geometry/material, **two pooled instances maximum**, 384 triangles each. Rings expand from 1.1 m to 5 m radius; X/Y centre settles before reaching the body zone. Their open centre exceeds 2.2 m well before crossing the player. Pure decoration: no collision, score or input hooks. Pink/cyan/violet, no flashing, transparency stacks, lights or per-frame object allocation. Selected accents use two spaced waves, recovery phrases are sparse.

Conservative all-pools/all-menus allocation: **42 draws, 5,708 triangles, 7 textures with panorama**, excluding shared rays. Compared with M2: +1 draw, +768 triangles, no new textures; the smaller obstacle label reduces texture area. Actual simultaneously visible cost is lower. Peak active eyes 6 (2 near), waves 2, wall 1, fragments 32. No measured Quest FPS claim.

## Completion / cleanup

Results wait for the audio ended lifecycle, never a fixed 56/218-second cutoff. Early-ended audio reports incomplete; abandonment is not completion. Score/hits/misses/max combo and successful obstacles remain. Duplicate ended cannot re-finish. Replay resets full chart indices, obstacle judge, rings, fragments, counters and audio. Pauses freeze song time and wave presentation; resume cannot duplicate events. Back/system exit clears listeners, controllers, pools and audio ownership. Late texture load is discarded after disposal. Scene lifecycle owns panorama/panel resource disposal; waves explicitly release instancing resources.

## Validation and Quest acceptance

`node --test tests/all-eyes-on-me.test.js tests/smash-the-hate.test.js tests/analytics.test.js`

Run syntax checks, `npm.cmd run build`, a separate build with `VITE_VERCEL_ENV=preview`, and `git diff --check`. Ordinary build must show Smash and omit All Eyes. Preview must show both cards. Smoke-test four districts, Back, audio/panorama loading, responsive layout, no console errors or analytics script locally.

On Quest: verify portal alignment after neutral START; distant-to-near motion continuity; full-song early/later beat alignment; fatigue/recovery balance; 45-degree side comfort; bold wall instructions and generous transitions; noninteractive wave clearance; final audio tail/results; Replay; mid-song system menu pause/resume; Back/system XR exit and re-entry. Keep M2 thump, hand matching and passive-overlap behavior. No Production release until separate approval.
