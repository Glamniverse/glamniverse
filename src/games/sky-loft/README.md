# Sky Loft M3.1 — Paradise (Preview only)

## Stable foundation
Uses the existing shared renderer, XR controller registry, capability warning, safe exit
and resource disposer. Loft/sofa geometry and first-pose placement remain M1.
Virtual floor remains 1.6m below initial headset in local reference space: not a real floor
or guardian estimate. Optional bounded exploration remains M2.2; no scoring or lyrics.

## Exterior
Dedicated source copied unchanged from Downloads/neon-city-loft.png to
public/images/sky-loft/neon-city-loft.png. PNG 1774x887, 2:1, 2,921,775 bytes.
SHA256 AF13CB97E64617581DD36EFC8B857D5203FF609A073F145E59525F22CA594DE3.
Usable prototype wrap, not certified seamless: edge RGB difference 13.83/255
(adjacent-column difference 7.20). Upper/lower edge colors roughly agree, but cloud
and city structures may reveal a seam or pole pinching. Same pixel resolution as M1:
new art cannot create extra source detail. No fake upscale or recompression.
One sRGB unlit inward sphere, linear filtering, no mipmaps, ~6MiB decoded RGBA.
Environment definitions retain panorama/yaw/lighting/accent and visitor-profile hooks.

## Music
Neon Therapy reuses /neon-therapy.mp3 unchanged. Daydream uses the new
/audio/sky-loft/daydream.mp3. One private HTMLAudioElement prevents overlap.
During a reality change its volume fades out, source switches at the dark midpoint,
then fades in. Daydream-first selection silently primes this same element in the
controller gesture and rewinds at midpoint; no second player/context.
Errors/blocked playback show retry copy. Headset menu pauses music and transition;
explicit song selection resumes. Exit releases media, cancels pending transitions.
getPlaybackClock() retains songId, seconds, duration, playing, status from media time.
Silent first-selection priming may briefly advance the clock before midpoint rewind;
future lyrics must gate on the engine's activeReality/realityTransition state.
No lyrics, beat analysis or audio-analysis polling implemented.
## Visitors
visitors.js: two pooled luminous swept-wing mantas, opaque body plus neon outline each.
Shared shell/line geometry/materials, no new textures/lights.
38-second cubic-Bezier passes in a 62-second cycle, staggered 29 seconds.
Front route approaches from distant city toward the front window then passes across it;
second route passes along the exterior right side. All path points remain outside the
14x12m loft. Endpoints scale gently in/out, no transparency. Gentle bank/camber movement.
Hidden headset pauses their local elapsed time; sessions reset it. Max two active.
No per-frame allocations, spawning, picking or collisions for visitors.
Scene disposer owns geometry/materials; visitor module hides/resets on exit/disposal.
Original Bichon companion now loads through companion.js; see below.

## Validation / build
node --test tests/*.test.js
npm.cmd run build
Production must omit Sky Loft entry/chunk. Simulate Preview with VITE_VERCEL_ENV=preview.
No Vercel configuration changes. Existing Preview analytics exclusion remains.
M1: 10 draws / 2530 triangles excluding shared controller rays.
M2 maximum: 14 draws / 2562 triangles +36 line segments; same six owned textures.
Two existing lights only; no shadows/postprocessing. Render counts depend on view/culling.

## Quest check
Preview > Glamniverse VR Experiences > Sky Loft M2 > ENTER VR.
Inspect city all around including seam/poles and seated floor impression. Select Neon
Therapy, Daydream, Neon Therapy rapidly; confirm one song and the correct exterior/species.
Watch at least 90 seconds for both manta paths, nearby silhouette, depth and comfort.
Try headset menu/reselect, controller reconnect, Back, system exit/re-entry and reopening.
Compare frame stability with M1. No new Quest validation is claimed.

## Original Bichon M2 companion
One 753,672-byte GLB, seven skinned meshes, 23,088 triangles, three opaque materials,
25 bones, no image textures. Blender sources remain in the separate Bichon workspace.
Idle (4s), in-place diagonal Trot (0.8s), HappyHop (1.6s, ~2.8cm lift).
Model is kept at exported metre scale (~0.4175m crown height); no added lights/shadows.

companion-motion.js owns beginner-tunable speed (0.192m/s), anchors, bounds and distances.
A furniture-free floor rectangle x[-3.8,3.8], z[-1.1,1.1] avoids sofa, table and selector.
IDLE -> WANDER -> IDLE -> APPROACH_USER -> HAPPY -> WANDER_AWAY.
Approach stops 1.05m centre-to-headset-floor-projection (about 0.77m nose clearance).
Physical user movement can reduce that gap: locomotion stops, and the dog hides under
0.55m centre distance rather than clipping through the user. This is not physics.
Headset outside the safe rectangle does not attract the dog outside the loft.

companion.js loads once per world, blends actions over 0.18s, pauses/hides without a
valid visible XR pose, resets on session exit, reuses one model on session re-entry,
and releases geometry/materials/skeleton resources on world disposal. Late loads
are released; failed/missing assets never block the loft or music. No dog audio.
The same existing local-reference-space virtual floor limitation remains.

Upper scene estimate: 21 draws/eye, 25,650 triangles (+36 line segments), six existing
image/UI textures plus one shared skeleton data texture; same two lights.
No changes to panorama, songs, visitors or public/Production eligibility.
Quest review: watch two minutes for wandering/approach/hop/departure; inspect gait,
paw sliding, scale, distance, turning and frame stability; select songs and repeat
XR exit/re-entry plus Back/reopen. Animation polish still requires hardware review.

## M2.2 greeting audio and exploration
Bark recording still required. No suitable local licensed recording was found;
BARK.src=null deliberately prevents requests or AudioContext creation. No synthesized
stand-in is shipped. Supply a short gentle small-dog greeting (one/two barks, <1.5s),
mono Ogg Vorbis, 44.1/48kHz, no music/reverb, peak <= -6dBFS, preferably <100KB, at
public/audio/sky-loft/bichon-greeting.ogg. Supply source/author and explicit website
redistribution permission (or an original owner recording) before setting BARK.src.

Prepared audio path: one voice per HAPPY transition, >=12s between greetings,
0.12 gain, inverse distance attenuation, refDistance 1m, rolloff 1.5, maxDistance 10m.
Emitter follows the dog's mouth at +0.3m; listener follows the actual XR head.
Audio activation is attempted on XR entry/song selection/movement selection;
blocked playback or missing audio stays silent. Pause/exit stops voices; disposal
closes the private context. No shared music volume or playback changes. Actual
loudness/cuteness remains unverified until a suitable recording and Quest test.

Movement defaults OFF each entry. Select MOVEMENT OFF on the loft selector to opt
into slow exploration: left xr-standard axes[2,3] move relative to horizontal gaze,
right horizontal stick snaps 30 degrees. Speed <=0.45m/s, deadzone .22, snap threshold
.7, neutral release required, .45s snap cooldown. Invalid/tracking-lost/hidden states
require neutral before resuming. No vertical movement. Rig resets on exit/re-entry.
Shared district locomotion stays disabled for Sky Loft; its own movement module
moves only XR origin. Shared rays and song selection are unchanged.

The existing 14x12m floor is bounded to x +/-6.35, z +/-5.15 with 0.35m inflated
sofa/table/pedestal/rear-wall exclusions from loft.js. Swept segment tests block
crossing solids. Physical headset offset is included; turns pivot about the head.
Blocked steps stop rather than sliding. If physical walking leaves the valid region,
artificial movement stops until the user physically returns. Software cannot restrain
real walking: retain Quest Guardian and stay within the real safe play area.
Teleportation deferred; no new aim/button conflicts. Stationary mode is the comfort
fallback. Stop slow movement if uncomfortable; this is not a motion-sickness guarantee.

Dog approach re-targets the current head only within its original smaller clear floor
region. It will not follow onto all terrace areas or through furniture. Model/GLB,
clips, speed, happy behavior and close-distance hiding remain unchanged.
One added selector panel: +1 draw, +2 triangles, +1 canvas texture. Upper estimate
22 draws/eye, 25,652 triangles, seven existing/UI image textures plus one skeleton
texture, same two lights. Movement uses a handful of rectangle tests per moving frame;
no physics/raycast navigation, new lights or dependencies. Bark is silent until supplied.

## M3: declarative realities and transitions
config.js SONGS/REALITIES map song id/title/audio/environment/theme/lyrics:null.
ENVIRONMENTS maps panorama/yaw/background/ambient light/visitor species.
Add a future song + environment definition to extend the selector automatically.
Add a species factory to reality-visitors.js only if a new creature family is needed.
reality.js alone coordinates transitions; it never receives the Bichon or XR rig.

Transition is 2.4 seconds of visible animation after the panorama is ready:
1.2s smooth fade of the single opaque exterior sphere and old visitor materials,
swap at darkness, 1.2s fade up. Interior stays visible; no camera fade, black screen,
transparent overlapping spheres, extra lights or postprocessing.
Ambient light and loft accent interpolate throughout. Latest rapid selection queues
behind an in-flight change. Re-selecting an active playing reality is idempotent.
Images are requested asynchronously once per visited environment, cached until exit
disposal; failed requests can retry. No entire-world rebuild or player reposition.
First texture GPU upload can still briefly cost a frame; evaluate on Quest.

Daydream originals copied unchanged:
C:/Users/Ani/Downloads/daydream.png -> public/images/sky-loft/daydream.png
PNG 1774x887, exactly 2:1, 2,592,098 bytes.
SHA256 74EF11DC788195AAD56035DA5807BE54D5C554B71C0C04F6962381DEC1469520
C:/Users/Ani/Downloads/daydream.mp3 -> public/audio/sky-loft/daydream.mp3
5,770,229 bytes, Windows media duration 244.56s; title Daydream / artist glamniverse.
Source basename is daydream, not Daydream_V4(2); no track substitution.
SHA256 5688D683327FC56C7596EBE137556BD3099F1D02629D8E7EE8D26A2D371C3055
No image upscale/crop/recompression. Daydream yaw PI/2 places image centre forward.
Generated furniture/terrace below horizon is part of distant imagery, not walkable
geometry. Left/right content is not perfectly matched; poles can pinch; native
resolution limits sharpness. Usable prototype artwork, not certified seamless.

Daydream ambient #e5c5e9 at 1.55, accent #edb4df. Existing directional light untouched.
Neon ambient #afa0da at 1.7, accent #66d9ef, yaw 0 and original visitors unchanged.
Butterflies: four pooled individuals, two instanced draws (8 wing halves + 4 bodies).
Each wing has two curved lobes; vertex color inner gold/outer dark accents, per-instance
blue/lilac/pink/turquoise. Opaque double-sided wings, no textures, simple body.
27s curved exterior passes in a 32s cycle; offsets 0/5/10/15s, gentle bob/bank and
hinged flapping. No collisions or player targets. Paths tested outside entire terrace.
Only active species updates; resources shared and released by existing scene disposer.

Conservative unculled scene estimate (excluding existing controllers/rays):
Neon: 22 draws / 25,652 triangles + existing outline lines (unchanged).
Daydream: 20 draws / 26,236 triangles, four butterflies total 616 triangles.
Transition peak <=22 draws / 26,236 triangles: one sphere/species, no doubled scenery.
8 cached image/UI textures after both realities visited, plus existing skeleton texture.
Second 1774x887 RGBA panorama adds ~6.0 MiB GPU texture memory; both ~12.0 MiB,
no mipmaps. HTML media playback avoids decoding both complete tracks into WebAudio.
Same 2 lights, same Bichon mixer. No new dependencies. Hardware frame timing unmeasured.

## M3.1 Paradise — incremental third reality
Approved M3 coordinator/audio/transition, Neon and Daydream species, Bichon and
locomotion code are unchanged. SONGS + ENVIRONMENTS add Paradise; species registry
adds jellyfish. Selector keeps the same button dimensions, centred at x -0.86/0/0.86m,
at the existing 2.4m distance. Back/movement behavior is unchanged.

Sources copied byte-for-byte, originals preserved:
C:/Users/Ani/Downloads/paradise.png -> public/images/sky-loft/paradise.png
PNG 1774x887 (2:1), 2,801,150 bytes.
SHA256 4DD196F80910DACE9A966C686EBFA335FF07AE9BE1DCDAF2F2AB6E0D75EE17B7
C:/Users/Ani/Downloads/paradise.mp3 -> public/audio/sky-loft/paradise.mp3
6,981,822 bytes; Windows media duration 299.472s; no title/artist tags.
Identification is the exact user-specified Paradise basename + valid MP3 media metadata.
SHA256 7A1EB524C70B85D02E1BC3E6189680B658263296B1FDA05B077281C0AA5FD921

Panorama yaw PI/2 puts its centre/open ocean forward; source resolution retained.
Painted terrace/furniture and jellyfish remain distant imagery, not floor or extra models.
Not certified seamless; poles may pinch and edges differ. No crop/upscale/reconstruction.
Warm neutral pink-lilac ambient #e4cddd intensity 1.55; accent #f2c2a6.
Same directional light. Bichon material is untouched.

12 pooled jellyfish: three InstancedMesh draws, one shared dome, rim and merged
six-tentacle skirt geometry. Opaque unlit vertex-colored bell, cyan luminous rim,
blue ribbons; no textures/alpha/shaders/lights added. Total 5,856 visitor triangles.
Slow sinusoidal current, gentle bob/rotation, phase-varied bell pulse and skirt sway;
different anchor depths/scales, three nearer specimens. All drift envelopes tested
outside the entire 14x12m floor with clearance; no player interaction.
Only active species updates; existing fade dims species materials during the 2.4s
transition. Switching never accumulates geometry/instances.

Estimates excluding shared XR controllers/rays:
Neon 23 draws / 25,654 triangles; Daydream 21 draws / 26,238 triangles;
Paradise 22 draws / 31,478 triangles. Transition upper bound 23 draws / 31,478 triangles,
one environment/species at a time. The third selector panel adds one draw/two triangles.
All three panoramas cached: ~18.0 MiB RGBA without mipmaps. 10 image/UI textures after
all realities visited, plus existing skeleton texture; 2 lights, no new dependencies.
Actual GPU frame timing and jellyfish visibility remain for physical Quest testing.


## M4: Paradise spatial lyrics (feature branch R&D)

Runtime data: public/data/sky-loft/lyrics/paradise.json, copied byte-for-byte from
the supplied extracted Paradise package. 76 events, 37 unique phrases, 20 presets.
Approved TXT wording matches after normalizing curly/straight apostrophes and
whitespace. No lyric rewrites, transcription or timing regeneration. First event
53.00s; last expires 280.88s. CapCut timings have roughly one-second precision,
with supplied editorial splits. Edit event start/end/text/preset in JSON to tune;
update its provenance checksum test after an intentional edit.

SONGS[id].lyrics is a JSON URL (null for Neon/Daydream). lyric-presets.js defines
the small preset vocabulary, geometry/fades and four-object cap. lyrics.js loads
and validates data, builds one 2048x2048 atlas using the browser's generic serif
font, and maps tight UV crops onto four pooled planes. No font file, dependency,
DOM overlay, shader effect, timer or per-frame canvas generation. Atlas remains
cached across Neon/Daydream switches and is disposed with the world; future songs
with lyrics replace that single cache. Fetch failure is silent/retryable via song
selection; unavailable lyrics do not affect playback.

Lyrics use active media currentTime, active/requested reality and transition
state. Motion, rise and opacity also use media time, so Pause freezes everything
lyric-related. Seeking selects current intervals without replaying past events.
OFF hides immediately without touching audio; ON restores current intervals.
Fresh XR entry resets ON. All old lyrics hide on reality selection or exit.

Anchors resolve current headset world position/facing into loft space once per
event, constrained to the open front hemisphere (within 45 degrees of front) and
beyond z=-10m. They never follow subsequent head turns. Centre height is at least
3.8m above the floor; ordinary text is 16-42m distant. HERO_PARADISE is 26m wide
at 60m with a gentle 0.9m rise; echo is softer/farther. Repeated declarations stack
vertically during deliberate overlaps. All visual values still need Quest review,
especially after walking to the back of the loft or looking away from the ocean.

Play/Pause uses the existing single player without rewinding. Selecting another
reality starts its new song normally, even if the previous song was paused.
During a normal transition Play/Pause is temporarily unavailable; after headset
interruption PLAY resumes the existing transition. No whole-world pause: visitors
and the Bichon keep updating during manual music pause. Ended audio is not a new
restart feature; normal song reselection behavior remains the existing behavior.

Selector retains group y=+0.30m and Back centre y=0.84m / lower edge 0.755m
(0.170m above the 0.585m table). Heading/song/status shift up within the panel;
two utility buttons at local x +/-0.44, y=-0.44, 0.82x0.18m sit above movement.
Seven targets keep existing indices for songs/Back/movement; controls append.

Additional rendering cost: two utility draws / four triangles / two 768x128
textures, plus one draw/two triangles per visible lyric (supplied peak two; cap
four). One 2048x2048 RGBA atlas is 16MiB, approximately 21.3MiB with mipmaps, plus
CPU canvas backing; UI textures approximately 1MiB with mipmaps. No lights added.
Paradise estimate: 26 draws / 31,486 triangles at supplied lyric peak; hard cap
28 draws / 31,490 triangles, excluding controller rays. Transition hides lyrics,
so its upper bound is 25 draws / 31,482 triangles. Texture count grows by three
(13 image/UI textures after all realities cached, plus existing skeleton texture).

Quest timing checklist: first verse 0:53; overlapping chorus at 1:36/1:36.9;
Ocean/Neon at 1:44/1:45.2; hero at 1:49.5, 2:06.5, 3:04.5, 3:20.5, 4:20.5,
4:37.5; ad-libs 2:20 and 3:30; bridge 3:47-4:06; declarations 3:57/3:58.4.
No spatial lyrics are authored for Neon or Daydream. No new Production release
is authorized by this feature branch; only Preview deployment for hardware review.

Browser review found the starting-position selector could occlude horizon lyrics.
At event creation only, projected bounds now lift an occluded phrase above the
selector and above a simultaneously live phrase where needed. No furniture/UI
moves; walking aside can reveal the natural lower horizon anchor. The adjustment
remains frozen for the lifetime of the phrase. Quest must confirm vertical comfort.

Hero/echo use uppercase as a typography style; source text remains unchanged.
Overlapping phrases prefer a small lateral separation within the front composition
before vertical stacking, to avoid requiring upward neck turns for the second line.
