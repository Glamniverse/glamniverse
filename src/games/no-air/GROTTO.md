# Secret Grotto — M5

One additive enclosed rock vault beside the rear shelf. Centre x=-3.5, z≈11.55;
entrance z=9.8 faces the central swimming area; back wall z≈13.3.
The original proposed drop-off site was rejected after slope/visual review;
a lower candidate conflicted with protected shells and tube plants.

The adopted flat site leaves all 20 original shell approaches/rays clear.
No shell data, storage schema, menu, creature, terrain or swimming module changes.

## Geometry and collision

Original procedural double-shell rock mesh (744 triangles), buried feet,
closed back and thick open entrance. The chamber widens from ~3 m at the
entrance to ~4 m internally, with roughly 3.3–3.8 m of central headroom.
A crescent of 17 branching coral instances is the single quiet focal point.
Total: 4,824 triangles, two opaque draws, two materials, no lights/textures.

The grotto alone filters proposed artificial translation. Its rendered triangles
are also its two-sided collision surfaces, with 28 cm clearance. Short swept
steps prevent tunnelling; projection removes inward movement and allows sliding.
The unchanged ocean resolver rechecks projected movement. Snap-turn is independent.
No retained collision state, forced position correction or per-frame allocations.
World and per-triangle bounding boxes limit work near the cave.

Physical headset tracking is never clamped or overridden. Deliberate room-scale
walking/leaning through geometry can penetrate it; returning to free space remains
possible without a forced camera jump. This is not a physical safety boundary.

## Validation and hardware review

Tests cover both roof sides, walls, repeated pressure/recovery, entrance/chamber/
exit paths, tangential movement, slightly penetrating poses, large-step tunnelling,
unchanged controls, shell approaches/selection rays, botanical clearance and
creature-route envelopes. Baseline modules match M4 (normalizing checkout EOLs).
Desktop renders check entrance, interior, exit and exterior; they do not establish
Quest performance, stereoscopic quality or physical controller comfort.

Quest: enter from several heights, sweep both doorway edges, swim to back/corners,
press against walls/ceiling then retreat, snap-turn while blocked, exit repeatedly.
Inspect rock seams, shell accessibility, the coral crescent and frame stability.

Progress uses the unchanged browser localStorage key. Storage is origin-specific:
a new unique Preview URL does not inherit another Preview URL's collection.
No progress reset, migration, new pearl or completion-reward change is included.
