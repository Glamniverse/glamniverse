# Sky Loft M1 (Preview only)

- Shared renderer, local XR reference space, one animation loop and controller target registry.
- Stationary: no artificial movement/turning. Initial valid headset pose places the room
  and selector once. Selection uses either trigger and reversible hover; no new controller listeners.
- Start facing your chosen forward direction. The local reference space has no floor data:
  virtual floor is 1.6m below initial eye pose, also when seated. This is visual grounding,
  not a physical floor/guardian estimate. Respect your real play-space boundary.
- config.js: room dimensions, selector distance, immutable songs and environments.
  Both entries share the existing unmodified city panorama as a placeholder. Audio/lyrics
  are null intentionally. M1 does not play music or implement song transformations.
- environment.js: environment-ID lookup, one cached texture per visited environment,
  asynchronous-load/disposal guards, theme-independent exterior.
- loft.js: four instanced architectural/furniture batches, opaque materials, ambient
  plus one non-shadow directional light. No glass layers, particles or postprocessing.
- selector.js: five opaque text planes, updated only on selection. Shared makePanel
  helper; three registered targets (two songs, Back). Repeated bind unregisters first.
- index.js: XR hooks and selection coordinator. On Back, existing runtime ends XR
  before portal transition. System exit unbinds targets; re-entry recalibrates placement.
  World closure disposes cached images, then shared scene lifecycle releases graphics.
- Future song definitions may set audioSrc and lyric timing references. A future session-owned
  audio controller can react to the selection callback and expose audio.currentTime to an
  independent spatial lyric layer. No such player or lyric layer is built in M1.

## Build / test
Run node --test tests/*.test.js and npm.cmd run build.
Production build must contain no sky-loft chunk/entry.
Simulate Preview in PowerShell:
    $env:VITE_VERCEL_ENV='preview'
    npm.cmd run build
    Remove-Item Env:VITE_VERCEL_ENV
The existing Vercel Vite system variable exposes Preview eligibility. No project setting
or custom hostname allowlist is added. Missing environment data excludes the feature.
Analytics is unchanged and excludes Preview.

## Quest test
Preview homepage > Glamniverse VR Experiences > The Sky Loft > ENTER VR.
From seated and standing, check room scale/readability; point at Neon Therapy/Daydream,
trigger, check NOW SELECTED and hover reset. Repeat selection and disconnect/reconnect.
Check headset menu, system exit/re-entry, Back to Glamniverse, close/reopen, and no music.
Inspect front/side/back windows and floor. Room geometry is not a collision boundary.
This is a functional foundation, not final song art; headset performance/comfort unverified.
