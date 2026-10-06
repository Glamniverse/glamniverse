# NO AIR — Ocean World M1 (Preview)

Baseline: e86bb1ec1267627cd0e1c753c92bee457203ae7e. Independent experience; no Sky Loft imports or state.

## Entry and lifecycle

The homepage card is enabled only in local development / Vercel Preview. ENTER NO AIR uses the existing capability warning; then ENTER VR uses the shared WebXR session, renderer, controller objects, resource disposal and EXIT TO PORTAL. No additional renderer or animation loop. Desktop Ocean Study bypasses only the headset capability gate for development and renders the same environment.

XR is calibrated to the first valid headset pose. Movement changes the player origin only. Visibility interruption, missing viewer tracking, long frames, exit and suspension clear velocity and input arming. Controller poses are read in reference space relative to the tracked head, so artificial locomotion cannot feed its own stroke velocity. No new controller listeners.

## Controls

Squeeze either/both grip buttons while sweeping hands backwards to move forward. Release grips while recovering the hands. Push down to rise; push up to descend. Use gentle strokes; there is no need to lie down or reach beyond your safe space. Grips must first be released after entry/tracking loss. Trigger selection stops propulsion.

Fallback: left stick = slow horizontal drift relative to horizontal gaze; right stick up/down = rise/descend; right stick left/right = 30-degree snap-turn (neutral to rearm). Maximum combined speed 1.15 m/s; stick horizontal .65 m/s, vertical .45 m/s; acceleration cap 1.05 m/s²; exponential drag 1.45/s. Hand jitter below .18 m/s is ignored; samples above 3.5 m/s cancel propulsion and briefly quarantine that hand.

Desktop: WASD drift, E rise, Q descend, arrow keys look. Back/Exit uses the existing site controls.

## Environment

38 × 40 m elliptical swim footprint, centered at z=-3; 3.5 m gradual boundary resistance. Ceiling y=10. Floor follows the actual procedural shelf/canyon height plus 1.35 m clearance. Approximately 22 m canyon drop; near terrain 110 m across, far terrain 900 m across, water backdrop radius 620 m. Eight nearby rock masses use inexpensive conservative ellipsoid clearance; distant formations/arch remain outside swimming volume. Physical room-scale excursions are not teleported back: further outward artificial motion is suppressed and inward/tangential recovery remains available.

Nine environment draws (upper bound before frustum culling): two terrain surfaces, one rock instance batch, one arch, one grass batch, one branching coral batch, one distant water gradient, one merged light-shaft mesh, one particle draw. 100,574 submitted triangles before culling, 7 materials, 0 textures, 0 lights. Three instanced draws: 72 rocks, 480 crossed grass blades, 56 branching coral fans. 340 low-opacity points. Two transparent environmental draws. Terrain: 41,472 near + 18,432 far triangles. No shadows, postprocessing, volumetric raymarch, reflections or dependencies.

Shared caustics use a few slow sine fields and a bounded highlight, with world-distance blue absorption. Grass/coral bend in the vertex shader with per-instance phase. Seven soft shafts share one merged geometry/material. Angular surface light ripples have no finite ceiling edge. No flashing.

One brief world-space title uses a 1024 × 256 RGBA canvas (1 MiB, no mipmaps), two triangles and one additional material/draw for nine seconds. Shared XR Back adds its existing 1024 × 256 texture (~1.33 MiB including mipmaps), two triangles and one draw. Two existing controller rays add two line draws. Maximum scene draw submissions including title/Back/rays: 13, falling to 12 after title; stereo cost is renderer/device dependent. Environment update only sets shader time; no per-instance CPU animation or per-frame textures. Empty world baseline: zero draws/triangles/textures/lights before environment construction.

These are geometry/resource counts, not a measured Quest frame-time result. Transparency fill rate, caustic aliasing, swimming comfort and perceived scale require physical Quest approval.

## Audio and scope

No approved NO AIR song was found. AUDIO_SRC is null; no element is created and no substitute song is fetched. audio.js owns one lazy private element when an approved path is eventually supplied. M1 is intentionally silent. No fauna placeholders or M2 systems.

Known M1 limits: procedural geology/coral rather than scanned assets; no true volumetrics; finite swim ellipse with soft resistance still needs headset judgment; no Quest FPS claim. The rock arch is distant scenery, not a swim-through tunnel. Existing experiences, SEO, Analytics, DNS, assets and tools/ remain untouched.

## Acceptance

Judge ocean presence, scale, drop-off, looking up, caustics, foliage motion, frame stability and comfort. Test both/alternating grips, vertical strokes, fallback controls, stopping, all boundary directions, snap-turn while pushing outward, controller tracking interruption, Back and re-entry. Do not start M2 or release Production before the user's Quest verdict.
