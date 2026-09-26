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
Dog deferred — suitable 3D asset required. COMPANION.modelSrc remains null, with a future
sofa-side anchor; nothing is downloaded or created.

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
