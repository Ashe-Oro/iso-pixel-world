---
name: iso-pixel
description: Build living, animated isometric pixel-art scenes (dioramas, cutaway houses and rooms, cozy shops, gardens, tiny worlds with characters and pets, ambient lofi or stream backdrops, looping video backgrounds) as one self-contained HTML/Canvas file where every pixel of art is generated in code, and help people describe the scene they want through a short turn-by-turn interview that produces a full brief. Use this whenever someone asks for isometric or 2:1 pixel art, a pixel-art diorama or cutaway, a cozy animated pixel scene, a seamless looping pixel animation for a music video or stream, procedural pixel-art characters, or a canvas "tiny living world", or wants help writing or planning a prompt or description for one, even if they don't say "isometric" (e.g. "a little animated pixel café for my lofi channel", "a cozy rainy room loop", "help me figure out what my pixel scene should have").
---

# iso-pixel

Make a small isometric world that looks like a screenshot from a beautiful indie pixel-art game
and keeps living: characters with little stories, weather, flickering light, dozens of tiny
animated details. Everything is drawn by code: no images, sprite sheets, SVG, engines or
libraries. The result is a single HTML file that runs at 60 fps, is deterministic for a given
seed, and can loop seamlessly for hours.

Read these as you reach the matching phase:
- `references/brief-interview.md`: the turn-by-turn interview that turns a vague idea into a
  complete brief, plus the brief template
- `references/engine.md`: the renderer and its core code (projection, z-buffered palette
  rasterizer, lighting LUT, per-frame pipeline)
- `references/animation.md`: periodic time, particles, character rigs, seeded story timelines
- `references/aesthetic.md`: the look: palette ramps, light, composition, detail density
- `scripts/`: build and verification tools (Node + Playwright; Chromium must be available)

## How it works, in brief

1. A **software 2:1 isometric rasterizer** draws the static world once into 640×360 buffers of
   palette indices, depth (`x + y + 2z`), world position, room id and flags. Surfaces are faces,
   boxes, slopes and cylinders with **procedural pixel shaders** in face-local units, so
   wallpaper, planks, tiles and bricks shear correctly with the projection.
2. A **silhouette outline pass** darkens edges where depth jumps, giving colour-matched outlines.
3. **Lighting is palette-based**: each pixel carries warm and cool light values that pick a step
   on a precomputed hue-shifted ramp (violet shadows, honey highlights). **Band-snapped Bayer
   dithering** keeps light as flat bands with thin dithered edges. Static lights and ambient
   occlusion are baked; flickering lights use sparse per-light maps.
4. Each frame copies the static buffers, composites sky, window views, props, particles and
   characters with depth testing, then resolves through the LUT and scales 3× nearest-neighbour
   to 1920×1080.
5. **Everything animated is a pure function of time** whose periods divide the loop length.
   Characters follow **seeded timelines** that begin and end in the same home poses, so loop mode
   is seamless and free mode can chain endless varied episodes.

## Workflow

The output is large (thousands of lines), so write it as many small source files concatenated
by `scripts/build.sh`, one file per tool call. Look at the result after every phase; most of the
quality comes from fixing what the screenshots show.

### 0. Get a great brief

If the request is thin ("make me a cozy pixel room") or the person asks for help describing what
they want, run the interview in `references/brief-interview.md`: a few questions per turn with
clickable or lettered options, a running summary, and a finished brief they approve before you
build. Offer it in one line at the start, for example: "Want me to ask a few quick questions so
the scene is exactly yours, or should I just pick something lovely?" If the request is already
detailed (place, characters, mood, animations), skip it and ask only about real gaps.

### 1. Plan (before any code)

- Pin down the subject, areas or rooms, characters, mood and palette from the request. Respect
  the user's own direction over the defaults in `aesthetic.md`.
- **Budget the screen**: a footprint W×D with top height Ztop needs about `2(W+D)` × `(W+D)+Ztop`
  pixels; at 640×360 aim for `W + D + Ztop ≈ 330`. Size characters against walls (a child ~24 px,
  a room ~48 px tall).
- For interiors seen from above, **solve occlusion first** (engine.md §2): ceilings and upper
  floors hide lower back walls. Use a stepped cutaway with upper tiers set back, and keep tall
  objects off the open front edge.
- Choose the loop length (120 s default), the home pose of every character, and 2-4 gentle
  story beats per loop.

### 2. Engine skeleton

Write `00_head.html`, `01_core.js`, `02_raster.js`, `09_render.js`, `20_main.js` and
`99_tail.html` from engine.md. Include from the start:
- URL params `?seed=N ?loop=0|1 ?debug=1 ?speed=X ?t=sec ?fixed=1` and a `FX` object of
  per-effect toggles
- a debug panel (speed slider, time scrub, pause, loop toggle, seed apply/random, all FX
  checkboxes, live fps / frame ms / current actions) on key `D`
- keyboard shortcuts (L loop, Space pause, arrows scrub, [ ] speed), a `window.renderAt(t)`
  capture hook, and a fixed-step mode for recording
- small fading on-screen buttons ("Controls", "Fullscreen"; fullscreen optional and failure-
  tolerant) and a screen wake lock request, so touch and keyboard-less viewers can use it

### 3. Static world

Build the shell, then each area's furniture and decoration, then outdoor props. After each step:

```bash
scripts/build.sh src out/scene.html
node scripts/shot.js $PWD/out/scene.html out/full.png "t=5" 2
node scripts/zoom.js $PWD/out/scene.html out/zoom.png <x> <y> <w> <h> 3 "t=5"
```

Use flat lighting at first to judge geometry and patterns; zoom crops judge pixel quality. Fix
empty surfaces, objects that read as plain boxes, hidden items (check the view ray), and
anything floating or clipping.

### 4. Lighting

Bake ambient, lights and AO (engine.md §7); add the dynamic maps and reflections. Check that light
pools read as bands rather than checkerboards, that each room has a warm focal light, and that the
exterior stays cool, dark and moonlit without washing out (roofs and lawns tend to go flat grey-blue).

### 5. Characters

Write rig files (animation.md §3), then build a sprite sheet and look at it zoomed before using it:

```bash
scripts/sheet.sh src setup.js out/sheet.html 10_hero.js     # setup.js sets window.SHEETS
node scripts/shot-full.js $PWD/out/sheet.html out/sheet.png 1600 900
```

Iterate on silhouettes, signature traits (a pet's ears, a hairdo), contrast against the floors
they will stand on, and expression pixels.

### 6. Props, particles, weather

Add animated systems one group at a time (animation.md §2). Aim for 30+ independent micro-
animations, mostly slow and small, each behind its own `FX` toggle.

### 7. Stories

Write the episode builders and character drawing (animation.md §5-6). Then:

```bash
node scripts/validate.js $PWD/out/scene.html          # no gaps or overlaps in any track, many seeds
```

Screenshot every story beat at its timestamp and look for stacked sprites, limbs inside furniture,
and a hand that doesn't reach the head it is petting.

### 8. Verify, then deliver

```bash
node scripts/perf.js $PWD/out/scene.html              # ~2 ms median frame, flat heap
node scripts/seam.js $PWD/out/scene.html "seed=7" "seed=2"
node scripts/motiondir.js $PWD/out/scene.html "[P.rain1, P.rain2]" 0 0 640 360
```

Report real numbers. Then deliver the `.html` (it opens directly in a browser). `build.sh` also
writes `*.artifact.html`, the page without its document wrapper, for hosts such as claude.ai
Artifacts that supply their own skeleton; that variant should keep a 16px side gutter, safe-area
insets on fixed controls, and an explicit dark background.

For a long video, suggest recording one loop with `?fixed=1` (or stepping `renderAt(t)` at 1/60 s)
and repeating it.

## Pitfalls seen in practice

- **Concatenation order**: top-level `const` in a later file is not initialised when an earlier
  file's boot code runs. Keep main last.
- **Scroll sign**: `(row + offset)` scrolls up and `(row - offset)` scrolls down. Rain once fell
  upward in windows, and a downspout stream once flowed up.
- **Seam breakers**: per-cycle hashes not reduced modulo cycles-per-loop; animation frames
  counted from segment start in a segment that crosses the loop boundary.
- **Timeline gaps**: a hold that ends before the next walk begins makes the actor jump to its
  final pose for a moment. Validate contiguity rather than eyeballing.
- **Dithering**: plain ordered dither over smooth light looks like a filter; use band snapping.
- **Same-colour features vanish**: an ear the colour of the body, a dog on a matching floor.
- **Two actors on one spot** (two pets in one bed) need distinct screen offsets, not just world offsets.
- **Seated figures**: anchor at the hip on the seat with depth slope ~1.5 so legs draw in front
  of the seat edge.
- **Invisible from this camera**: anything on the far side (−x/−y faces) of a block.
