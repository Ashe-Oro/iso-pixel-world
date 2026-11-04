# iso-pixel animation reference

Characters, props, weather and stories, all as pure functions of time so a loop is seamless and
every frame is reproducible.

## Contents
1. Periodic time: the rules that make loops seamless
2. Particles without particle objects
3. Character rigs (procedural pixel puppets)
4. Directions and mirroring
5. Behaviour: seeded timelines and episodes
6. Drawing characters each frame
7. Checks that catch the usual bugs

---

## 1. Periodic time

Pick a loop length (`LOOP = 120` s is a good default for video). Every time-varying thing must
repeat an **integer** number of times per loop.

```js
const TAU = Math.PI * 2;
const cyc   = sec => Math.max(1, Math.round(LOOP / sec));            // nearest whole cycles per loop
const wave  = (t, sec, ph = 0) => Math.sin(TAU * (t * cyc(sec) / LOOP + ph));
const phase = (t, sec, ph = 0) => { const v = t * cyc(sec) / LOOP + ph; return v - Math.floor(v); };
function vnoise(t, rate, key) {                                       // smooth value noise, lattice wraps every LOOP
  const N = Math.max(1, Math.round(LOOP * rate)), f = t * N / LOOP; let i = Math.floor(f); const fr = f - i;
  i = ((i % N) + N) % N; const a = hash2(key, i), b = hash2(key, (i + 1) % N), s = fr * fr * (3 - 2 * fr);
  return a + (b - a) * s;
}
```

Rules learned the hard way:
- **Scrolling patterns**: `offset = floor(t * speed) % period` loops only if `speed * LOOP` is a
  multiple of `period` (60 px/s with period 24 works at 120 s).
- **Direction of a scroll**: a pattern drawn where `(row - offset) % period < k` moves **down** as
  t grows; `(row + offset)` moves **up**. Rain streaks once scrolled upward because of this sign.
  Check every falling or rising effect with `scripts/motiondir.js`.
- **Per-cycle randomness**: when a particle re-rolls position each cycle via `hash(k, cycleIndex)`,
  take `cycleIndex % cyclesPerLoop`; otherwise the frame at t=LOOP differs from t=0.
- **Animations that span the loop boundary** must use global `phase(t, …)`, not time since the
  segment started. A tail-swish frame counter based on segment-local time jumped at the seam.
- Wrap t once at the top of `renderFrame` in loop mode so every system sees `[0, LOOP)`.
- Free (non-loop) mode can reuse the same functions; they repeat their ambience every LOOP while
  the stories change.

## 2. Particles without particle objects

Evaluate each particle from its index and t; nothing is stored, so memory never grows.

```js
for (let k = 0; k < N; k++) {
  const n = 40 + k * 3, T = LOOP / n;                       // this particle's lifetime divides LOOP
  const tt = ((t % LOOP) + LOOP) % LOOP, c = Math.floor(tt / T), f = (tt - c * T) / T;   // cycle, 0..1 age
  const x = x0 + hash2(k, c % n) * spread + Math.sin(f * 9 + k) * 0.8, z = z0 + f * rise;
  if (f < 0.85) wpx(x, y, z, f < 0.4 ? HOT : WARM, 255);
}
```

Recipes that work at 640×360:
- **Fire**: 8 procedurally grown flame frames (per-column height from overlapping sines + hash),
  colour by height fraction (white core, yellow, orange, red tips), two copies offset and
  mirrored, about 12 fps. Embers as 1 px emissive dots rising and wobbling.
- **Smoke / steam**: dithered puffs (Bayer threshold against density × radial falloff) that rise,
  drift, grow and thin out. Steam is 1-2 px wisps on a sine.
- **Rain**: 2-3 layers of short slanted streaks, each drop's x re-rolled per pass, speeds chosen
  as whole passes per loop. Brighten drops inside a lamp's radius. Add splashes (1-2 px flick for
  0.25 of a cycle), puddle ripple rings on `WATER` pixels, and drips from eaves and gutters.
- **Glass drops**: per pane a few drops that sit still for ~55% of their cycle, then accelerate
  down leaving a 1 px trail.
- **Light flicker**: `0.72 + 0.2*vnoise(t,7,k) + 0.12*vnoise(t,17,k+1)` for fire; faster, smaller
  noise for candles; an occasional brief dip for a street lamp.
- **Sway**: plants as leaf lists (angle, length, width) rotated by small sines; curtains and cloth
  as row shifts proportional to row index; pendulums and mobiles as rotations about a pivot.
- **Clouds**: tileable fbm maps (period = screen width) scrolled by whole screens per loop, two
  layers at different speeds, with a lighter rim on top edges.
- **Lightning**: 2-3 seeded strikes per loop; flash curve (1, 0.25, 0.85, decay); bolt as a jagged
  polyline with a branch; remap sky indices to brighter emissive variants and add cool light to
  exterior and near-window pixels.
- Tiny life: twinkling stars in cloud gaps, distant windows switching on/off, a car's headlights
  on a far road, a fish in a bowl, a mouse peeking from a hole, a moth circling a bulb, fireflies
  in a jar. These are what reward long viewing.

## 3. Character rigs

Draw characters procedurally into small palette-indexed sprite buffers (`Spr`) from parts, then
add an automatic outline. Parameterised poses give dozens of consistent frames cheaply; cache them
all at startup.

```js
class Spr {   // w,h, d: Uint16Array of palette indices (0 = transparent), ax/ay anchor pixel
  px(x, y, c) {}                  // rounded, bounds-checked
  ell(cx, cy, rx, ry, c, fn) {}    // filled ellipse; fn(x,y,dx,dy) can return a shaded colour
  line(x0, y0, x1, y1, c) {}       // Bresenham
  map(rows, legend, ox, oy, flip) {}  // paint from string rows ('.' = skip)
  outline(fn) {}                   // add 1 px outline around the silhouette
  flip() {}
}
```

Techniques:
- **Shaded ellipses** for heads, bodies, haunches: choose base / highlight / shadow by
  `dx*0.8 + dy` so the upper-left reads lit and the lower-right reads in shadow.
- **Thick lines** (3 px stamped along a segment) for limbs and sleeves, with a colour callback by
  position along the limb (cuff colour near the end, skin for the hand).
- **Faces as tiny hand-made string maps** (about 13×12 for a chibi head): eyes 2×2 with one
  white highlight pixel, a 1 px mouth, blush pixels. Make variants by replacing rows: blink,
  sleeping (closed lines), happy (curved), yawn.
- **Fur patterns** via a callback inside the ellipse fill: hash dapples, tabby stripes from
  `(x + y*0.4) % 3`, white bib on one side.
- **Long-haired details**: fringe pixels along the belly, feathered ears darker than the coat (an
  ear the same colour as the body disappears), plume tails drawn as a curve of dots with
  lighter strands hanging below.
- **Tails** as cubic Béziers whose control points animate (swish, curl, wag) with ring stripes.
- **Breathing** = 0.3-0.4 px change of a body radius, alternated slowly. Expression comes from
  1-pixel changes: blink, ear twitch, tongue, head tilt.
- Proportions: a big head (about 40% of height) for a cute child; 22-26 px tall when standing
  with 48 px rooms. Pets low and long, cats compact; side-view profiles read best in iso.
- Build a **sprite sheet viewer** page (`scripts/sheet.sh` + `scripts/sheet-viewer.js`) and look at
  every frame at 5× before putting characters in the scene. Fix silhouettes there, not in-scene.

Typical frame sets:
- person: stand, blink, walk ×4 front, walk ×4 back, carry-item walk, sit-read (feet swing ×3,
  page turn ×4), stretch/yawn, doze ×3, reach/pet ×3, sip ×3, kneel/back-view sit
- dog: trot ×4, stand + wag ×4, sniff ×2, sit, sit-tilt, beg ×3, lie, lie-sleep ×2, curl ×2, play bow
- cat: sit ×6 (tail), blink, ear twitch, back-view sit ×6, walk ×4, groom ×3, bat ×2, loaf ×2,
  curl ×2, stretch, crouch, leap

## 4. Directions and mirroring

Draw characters facing screen-right only, in two views: **front** (facing right-down, +x) and
**back** (facing right-up, −y). Then pick by screen motion:

```js
const sdx = 2 * (dx - dy), sdy = dx + dy;     // screen delta of the movement
const view = sdy < 0 ? 'back' : 'front';      // moving up the screen shows the back
const flip = sdx < 0;                         // moving left: mirror
```

+x → front, −x → back mirrored, +y → front mirrored, −y → back. Side-view animals only need
the flip. Mirroring moves asymmetric details (a side ponytail) to the other side, which is fine.

## 5. Behaviour: seeded timelines and episodes

Each actor has a **track**: a list of segments covering `[0, LOOP)` exactly.

```js
hold(tr, t0, t1, pos, anim, opts)                // stand/sit/sleep in place with a named animation
walk(tr, t0, path, speed, mode, opts) -> t1      // polyline path, constant speed, returns arrival time
arc(tr, t0, dur, from, to, height, anim) -> t1   // hops and leaps (parabola in z)
```

- An **episode** (one loop) is built by a function `(variant, seed)` that writes all tracks and
  any shared events (a kettle steaming, a mug on a table), using an RNG seeded from
  `seed * 1009 + episodeIndex * 7919`.
- Every episode **starts and ends in each actor's home pose** (someone reading, a pet asleep, a
  cat at the window). Loop mode repeats episode 0; free mode chains episodes whose variant comes
  from `hash(seed, index)`. Cache at most a few episodes so memory stays flat.
- Write stories as interlocking beats: one actor's segment end becomes another's start (the dog
  arrives, then the petting starts; she gets up, then the dog follows 1.5 s later). Jitter beats
  with `j(a) = (rng()*2-1)*a`, but clamp anything that must finish before a fixed later beat.
- Interaction placement: compute where hands and heads land on screen, not just in world space,
  and move positions or pose targets until they touch.
- Movement between floors through hidden spaces works well: walk into a doorway, follow a hidden
  stair path (z from a step function of x), rise out of a stairwell. The z-buffer hides the
  lower body behind the floor edge automatically.
- Speeds that feel calm: a child walks ~7-8 units/s, a dog trots ~10, a cat walks ~6.
- Keep it rare and gentle: 3-4 small stories per 120 s, long calm holds in between.

## 6. Drawing characters each frame

```js
const s = findSeg(track, lt), p = segPos(s, lt), a = animFrame(s, lt, t, who);   // a: {key, flip, slope, extras}
const room = roomAt(p.x, p.y, p.z);
const light = [lightAt(p.x, p.y, p.z + 2, room, t), lightAt(p.x, p.y, p.z + height, room, t)];
if (onFloor) shadowBlob(p.x, p.y, p.z, rx, 2, 0.5);    // reduce FR.w on floor pixels under them
stampD(FRAMES[a.key], p.x, p.y, p.z, a.slope, light, a.flip);
// extras: rising "z" bubbles while asleep, steam from a held mug, etc.
```

`animFrame` maps a named animation plus time to a frame key: blink windows from `phase(t, 3.75)`,
page turns from a 7.5 s phase, alternating pat frames every 0.38 s, breathing frames every ~1.6 s.

## 7. Checks that catch the usual bugs

- `scripts/validate.js`: every track of every episode (many seeds × several episodes) covers
  `[0, LOOP)` with no gaps, overlaps or negative segments. A gap makes an actor teleport to its
  last segment, which is easy to miss in screenshots.
- `scripts/seam.js`: `renderFrame(LOOP)` must equal `renderFrame(0)`, actors must match at both
  ends, and the pixel change across the seam should be within the range of ordinary frames that
  also contain a cloud-layer step.
- `scripts/motiondir.js`: falling things move down.
- Screenshot each story beat at its timestamp (`?t=` start time, or `renderAt(t)`) and look for
  overlapping sprites (two animals stacked on one spot), limbs inside furniture, and actors
  hidden behind walls.
