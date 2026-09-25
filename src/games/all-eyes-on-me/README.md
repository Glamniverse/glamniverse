# All Eyes On Me — Milestone 2 hardware tuning

A **56-second test slice**, not the final full-song workout. Entry exists only in Vite development or a build with `VITE_VERCEL_ENV === 'preview'`. Ordinary Production builds omit it. Existing production-host-only analytics excludes Preview and local testing.

## Run on Quest

Open the feature's HTTPS Vercel Preview in Quest Browser. On the homepage, scroll to **GLAMNIVERSE VR**, then select **ALL EYES ON ME — VR FITNESS TEST** below Explore Glamniverse VR. It is in normal page flow, not over the district controls. Select ENTER VR, then START with a controller ray. Start in a neutral, comfortable pose: front direction and headset height remain frozen for this round.

After 3–2–1, punch pink eyes with LEFT and cyan eyes with RIGHT. Side eyes have matching outward chevrons. DUCK / LEFT / RIGHT require approximately 16 cm crouch or lean; no sidestep is required. Keep your physical area clear. Do not chase targets. Results appear at 56 seconds; Replay resets pools and audio. Back or system XR exit stops playback through the existing shared lifecycle.

For local development: `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`. Desktop can view the arena and return; no desktop gameplay. Wireless headset testing uses the HTTPS Preview, not plain LAN HTTP.

## M2 values and chart

`config.js` centralizes tuning. `level.js` explicitly lists every beat/lane; no runtime beat detection or procedural workout generation.

- Working grid: **125.28 BPM**, beat-zero offset **0.005 s**. Arrival = offset + beat × 60 / BPM. Separate `chartOffsetSeconds` permits Quest tuning.
- **58 individual targets / 56 s** (~62.1 per minute across the entire slice). No simultaneous pairs. Shortest gap ~0.2395 s (half beat), validated against a 0.23 s minimum.
- Work groups: beats 12–44 (25 eyes), 57–72 (15), 85–102 (18). These include alternating hands, repeated-hand pairs, high/normal/side changes, recovery gaps and a final half-beat burst.
- DUCK crosses at **24.430287 s** (beat 51); LEFT at **37.840249 s** (79); RIGHT at **52.208065 s** (109). No eye exists during any obstacle's visibility interval.
- Eye spawn: **9 m** forward, **1.55 s before arrival**, continuous approach to **0.55 m** strike plane: **5.452 m/s** axial speed, ~1.81× M1. No read/stop phase. Expiry 0.25 m behind neutral head plane, ~0.147 s after arrival.
- Walls: **2.6 s** advance warning/travel from 9 m to head plane (**3.462 m/s**, ~1.54× M1). Judge throughout ±0.2 s crossing window; remove 0.65 s afterward. No recalibration while ducking/leaning.
- Normal lanes X ±0.34 m, centre ±0.18 m, high ±0.34 m. Normal/centre Y −0.20 m from neutral eyes; high −0.10 m. No low lanes.
- Side lanes arrive at X ±0.55 m, Z −0.55 m (~45 degrees), Y −0.20 m. They fan out on straight paths from the portal; no head chasing. Shared two-triangle pink/cyan chevrons identify direction.
- Pools remain six eyes, at most two near strike area, one obstacle, 32 fragments.

## Audio / beat analysis

Existing unchanged master: `public/audio/all-eyes-on-me/all-eyes-on-me.mp3`, 5,177,423 bytes, SHA-256 `2cf7b36b7d6aba55b319bbe721027a7380903b0e37e2873889da1aa89672cf8e`.
48 kHz VBR, 9112 MPEG frames; encoder trim gives **218.640979 s**, confirmed by browser metadata. This milestone uses only the first 56 seconds.

Offline analysis used the already-installed CapCut FFmpeg to decode mono 11025 Hz into memory, then NumPy spectral flux (1024 Hann FFT, 110-sample hop, positive log-magnitude differences, local baseline removal). Correlation across 1/2/4-beat lags over 110–145 BPM found 125.28 BPM independently in 8–32 and 32–56 s; full-song estimate ~125.3 BPM. Phase estimate ~0.005 s. This replaces the unverified 129 BPM estimate; it is a working rhythmic grid, not a claim of final hand-authored beat/lyric alignment. No “Still watching?” timestamp is claimed.

No local impact asset was available. `audio.js` synthesizes one reusable **180 ms padded impact** buffer: low filtered noise plus a downward low-frequency thump, soft attack/tail, peak bounded to 0.85. Gain 0.45; maximum three active voices; each hit allocates only source/gain nodes, released on end/pause/exit. Music stays at 0.7. Both hands use identical impact strength. Tune balance on Quest; no downloaded SFX or dependency.

## Arena / resources

The replacement `C:\Users\Ani\Downloads\all-eyes-on-me.png` was copied unchanged to `public/images/all-eyes-on-me/arena-360.png`: **1774 × 887 (2:1)**, **2,951,758 bytes**. SHA-256 `346d02b860a044870148d6bc58009a0818c6cf6361944b29753cc4c725b127c2` matches source.

One unlit inward-facing sphere, radius 90 m, yaw PI/2 puts image centre forward; sRGB texture, linear filtering, no mipmaps, depth-write disabled. Approximate RGBA texture residency **6.0 MiB**. No derivative, crop or artwork edit. Inspect rear seam/poles and image softness in Quest: this is modest-resolution stylized artwork, not a seamless photographic capture guarantee.

Removed placeholder skyline/decorative eyes. Retained small 4.2 m platform and simple 9 m portal. No new lights/shadows/postprocessing/transparency stacks. Conservative all-pools/menu allocation estimate: **41 draw calls, 4,940 triangles, 7 textures including panorama**, excluding shared rays. Actual visible gameplay is lower; this is not a measured Quest frame rate.

## Preserved mechanics

Orchestration, shared XR hooks, hands, obstacles, effects, menu registry and swept collision are unchanged. Existing pink/cyan boxing fists and instanced nail accents remain. Correct-hand speed ≥0.4 m/s (≤10 m/s tracking sanity limit) scores 100 and increments combo. Stationary overlap never scores; wrong hand does not destroy or penalize. Misses/failed obstacles break combo without game over. Headset baseline remains fixed, with no locomotion or snap turning.

Scene lifecycle disposes materials/textures/geometry, including late panorama loads. Grip resources, media/session listeners and pending playback reset on exit. Replay reuses target/effect pools; SFX voices stop on pause/exit. Smash modules and the four musical worlds remain unchanged.

## Checks / next hardware pass

`node --test tests/analytics.test.js tests/smash-the-hate.test.js tests/all-eyes-on-me.test.js`

Run `npm.cmd run build` for Production exclusion; separately build with `VITE_VERCEL_ENV=preview` to test the Preview entry. Tests cover timing, pool limits, hand matching, passive overlap, side cues, chart spacing, obstacles, reset/disposal, panorama late loading and bounded impact voices.

On Quest inspect: homepage entry accessibility; panorama forward orientation/rear seam/poles; faster target identification; 45-degree side reach and chevrons; no downward punches or simultaneous pairs; final burst readability; wall warning and safe lean/crouch; audio punch/music balance; wrong-hand/passive rejection; tracking interruption; pause/resume; Replay; Back and system XR exit. Full-song Milestone 3 waits for hardware approval.
