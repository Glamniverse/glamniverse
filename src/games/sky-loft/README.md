# Sky Loft M2 — Living Universe (Preview only)

## Stable foundation
Uses the existing shared renderer, XR controller registry, capability warning, safe exit
and resource disposer. Loft/sofa geometry and first-pose placement remain M1.
Virtual floor remains 1.6m below initial headset in local reference space: not a real floor
or guardian estimate. No locomotion, snap turning, collisions, scoring, or lyrics.

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
Neon Therapy reuses /neon-therapy.mp3 without copying. No Daydream file found.
Daydream is selectable and shows Audio not available yet; selecting it stops Neon Therapy.
A single private HTMLAudioElement prevents overlap. Selection starts/resumes in the
controller gesture. Switching stops/unloads old audio before loading new. No crossfade.
Errors/blocked playback show retry copy; late promises cannot change current selection.
Headset menu pauses; reselect to resume. Back/system exit releases the media source.
Re-entry waits for selection. No autoplay on entry. Same playing selection does not restart.
getPlaybackClock() exposes songId, seconds, duration, playing and status from media time.
Future lyrics can use that clock; there is no lyric subsystem or per-frame audio polling.

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
Therapy, Daydream, Neon Therapy rapidly; confirm one song, unavailable message and retry.
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
