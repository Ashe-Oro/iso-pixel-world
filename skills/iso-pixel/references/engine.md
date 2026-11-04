# iso-pixel engine reference

How the renderer works, with the core code. Read this before writing the engine files; copy the
snippets and adapt names. Everything here is scene-agnostic.

## Contents
1. File layout and build
2. Projection and depth
3. Buffers (static and per-frame)
4. Palette, ramps and the lighting LUT
5. Rasterizing the static world (faces, boxes, slopes, cylinders, decals, sprites)
6. Outline pass
7. Lighting bake: ambient, lights, AO, sparse dynamic maps
8. The per-frame pipeline and resolve
9. Performance notes

---

## 1. File layout and build

One `<script>` built by concatenating small files in name order, so no file exceeds a few
hundred lines and each can be written in one go:

```
src/00_head.html     doctype, <title>, <style>, canvas + overlay markup, opening <script>
src/01_core.js       config/URL params, FX toggles, RNG/hash, periodic helpers, palette+LUT, Spr class
src/02_raster.js     projection, static buffers, face/box/slope/cyl rasterizers, stamping, outline pass
src/03_bg.js         sky bands, moon/sun, tileable cloud layers, far hills/town (if the scene has a sky)
src/04_world.js      architecture / terrain shell
src/05_items.js      small hand-drawn item sprites + furniture helpers
src/06_*.js ...      one file per area of the scene (room, street, garden...)
src/08_light.js      light list, bake, sparse dynamic maps, reflections
src/09_render.js     per-frame buffers, dynamic stamping, sky/window passes, resolve
src/10_*.js          character rigs (one file per character or species)
src/12_props.js      animated props + particles + weather (pure functions of t)
src/14_behavior.js   seeded timelines / episodes, character evaluation and drawing
src/20_main.js       boot, timing, debug panel, keyboard, overlay, capture hook
src/99_tail.html     closing </script> (and </body></html>)
```

Put `main` last. Function declarations hoist across the concatenated script, but `const`/`let`
at top level do not: if boot code runs before a later file's `const` line, you get a TDZ
`ReferenceError`. Wrap the artifact-hostable part of the head/tail in
`<!--ARTIFACT-START-->` / `<!--ARTIFACT-END-->` so `scripts/build.sh` can emit a skeleton-free
variant too.

## 2. Projection and depth

2:1 pixel isometric. World x runs screen right-down, y runs left-down, z is up in whole pixels.

```js
let OX = 266, OY = 116;                         // screen position of world origin; tune to frame the scene
const isx = (x, y) => OX + 2 * (x - y);
const isy = (x, y, z) => OY + x + y - z;
const DEP = (x, y, z) => x + y + 2 * z;         // larger = closer to the camera
```

Why `x + y + 2z`: the view ray toward the camera is (1, 1, 2) in these units (moving along it
leaves the screen position unchanged), so depth is the dot product with it. Integer world
coordinates give perfectly clean 2-pixel stair-step edges. One xy unit is about 1.83 z-pixels of
real length; use that factor for distances (`dz / 1.83`) and for round things on walls.

**Screen budget.** A footprint W×D with top height Ztop occupies about `2(W+D)` px wide and
`(W+D) + Ztop` px tall. At 640×360 that means `W + D + Ztop ≈ 330` to fill the height with margins.
Compute this before designing; it decides how big everything can be.

**Cutaway occlusion (important for interiors).** Looking down at ~35°, a ceiling hides the back
of the room under it: a back-wall point at height z stays visible only if
`z <= H - 2·depth`. Stacked floors therefore hide the lower floor's back walls. Fixes that work:
- *Stepped cutaway*: set each upper tier back so it sits behind the lower tier's back wall
  (upper y-range ends where the lower room's back wall is). Both rooms show fully, and the screen
  reads as a normal stacked house.
- No ceilings over visible rooms; show the cut edges as cream/timber cross-section strips.
- Roof slopes: a slope steeper than 2 z-px per xy-unit is nearly edge-on (invisible); shallower
  slopes (~1) show their outer surface as a shingled band but hide the top of the wall under them.
- Divider walls hide a strip on their far side (`(H - z)/2` units). Keep them short, give them a
  doorway, or place nothing important right behind them.
- Anything on the camera-far side of a block (a ladder against a platform's back face) is
  invisible. Check with the ray `(x+t, y+t, z+2t)`.

## 3. Buffers

```js
const IW = 640, IH = 360, NPIX = IW * IH;
const S = {                                     // static scene, built once
  idx: new Uint16Array(NPIX), dep: new Float32Array(NPIX).fill(-1e9), flag: new Uint8Array(NPIX),
  obj: new Uint16Array(NPIX), room: new Uint8Array(NPIX), nrm: new Uint8Array(NPIX),
  wx: new Float32Array(NPIX), wy: new Float32Array(NPIX), wz: new Float32Array(NPIX),
  warm: new Uint8ClampedArray(NPIX), cool: new Uint8ClampedArray(NPIX), pane: new Uint8Array(NPIX)
};
const FR = { idx: new Uint16Array(NPIX), dep: new Float32Array(NPIX),          // per frame
             w: new Uint8ClampedArray(NPIX), c: new Uint8ClampedArray(NPIX) };
// flags: SKY, EXT (outdoors: rain allowed), PANE (window glass), GLOSS (reflective floor),
//        FLOOR, WATER (ripples), NOOUT (skip outline pass)
let OBJ = 1, ROOM = 0, FLAG = 0, PANE_ID = 0;   // "current" values stamped by put()
function put(p, c, d, x, y, z, n) {
  if (d < S.dep[p] - 0.0005) return;            // later draws win ties (decals)
  S.idx[p] = c; S.dep[p] = d; S.obj[p] = OBJ; S.room[p] = ROOM; S.flag[p] = FLAG;
  S.nrm[p] = n; S.wx[p] = x; S.wy[p] = y; S.wz[p] = z; S.pane[p] = PANE_ID;
}
```

`Uint8ClampedArray` for light lets `FR.w[p] += v` saturate for free.

## 4. Palette, ramps and the lighting LUT

Colours are palette indices created on demand. Lighting never invents arbitrary RGB per pixel:
each index has a precomputed ramp of 8 warm levels × 4 cool levels.

```js
const PAL = [{ r: 0, g: 0, b: 0, e: 0 }];       // index 0 = empty
const PALMAP = new Map();
function C(hex, e) { /* memoised: returns index for hex; e=1 marks emissive (ignores lighting) */ }
const CE = hex => C(hex, 1);
function dk(i, n = 1) { /* hue-shifted darker partner: r*.70+6, g*.66+4, b*.74+14 (memoised) */ }
function lt(i, n = 1) { /* lighter partner pushed toward warm white (memoised) */ }

const LV_B  = [0.20, 0.30, 0.42, 0.56, 0.72, 0.88, 1.00, 1.10];   // brightness per warm level
const LV_SH = [0.62, 0.50, 0.38, 0.26, 0.15, 0.06, 0, 0];        // mix toward violet shadow
const LV_WM = [0, 0, 0, 0, 0, 0.02, 0.08, 0.15];                 // honey highlight at the top
const CV    = [0, 0.13, 0.27, 0.45];                             // cool (moon / lightning) mix
function litRGB(p, w, c) {
  if (p.e) return [p.r, p.g, p.b];
  let r = p.r * LV_B[w], g = p.g * LV_B[w], b = p.b * LV_B[w];
  const sh = LV_SH[w]; r = r*(1-sh) + 30*sh; g = g*(1-sh) + 24*sh; b = b*(1-sh) + 62*sh;
  const wm = LV_WM[w]; r += (255-r)*wm; g += (205-g)*wm*0.9; b += (120-b)*wm*0.4;
  const k = CV[c];     r = r*(1-k) + 118*k; g = g*(1-k) + 146*k; b = b*(1-k) + 214*k;
  return [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))));
}
// LUT[(idx<<5)|(w<<2)|c] = packed ABGR; rebuild lazily when PAL grows (check PAL.length each resolve).
```

**Band-snapped dithering** is what makes the light look hand-made. Plain ordered dithering turns
every slowly varying surface into a checkerboard. Instead, steepen the fractional part so most
pixels snap to a flat band and only narrow transitions dither:

```js
const BAYER = new Uint8Array([0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]);
const WLV = new Uint8Array(256 * 16), CLV = new Uint8Array(256 * 16);
for (let v = 0; v < 256; v++) for (let b = 0; b < 16; b++) {
  const mk = (lv, max, k) => { const base = Math.floor(lv), f = lv - base,
    f2 = Math.min(1, Math.max(0, (f - 0.5) * k + 0.5)); return Math.min(max, base + (f2 * 16 > b + 0.5 ? 1 : 0)); };
  WLV[v * 16 + b] = mk(v / 32, 7, 2.6);   // warm light 0..255 -> level 0..7
  CLV[v * 16 + b] = mk(v / 64, 3, 2.2);   // cool light 0..255 -> level 0..3
}
```

Authored colours should look right at warm level 5-6; level ~2 is a dim corner.

## 5. Rasterizing the static world

**Faces.** Three face types cover almost everything: `'T'` (top, plane z=z0), `'Y'` (plane y=y0,
facing +y = screen left-front), `'X'` (plane x=x0, facing +x = screen right-front). Iterate the
screen bounding box, invert the projection at the pixel centre, test the local rectangle, call the
shader, depth-test.

```js
function face(t, x0, y0, z0, U, V, sh) {        // sh: palette index, or (u,v,x,y,z) => index|0
  /* bbox of the 4 projected corners, clamped to screen */
  for (let j = j0; j <= j1; j++) { const bb = j + 0.5 - OY;
    for (let i = i0; i <= i1; i++) { const a = (i + 0.5 - OX) / 2; let x, y, z, u, v;
      if (t === 'T')      { const b = bb + z0; x = (a + b) / 2; y = (b - a) / 2; z = z0; u = x - x0; v = y - y0; }
      else if (t === 'Y') { y = y0; x = a + y0; z = x + y0 - bb; u = x - x0; v = z - z0; }
      else                { x = x0; y = x0 - a; z = x0 + y - bb; u = y - y0; v = z - z0; }
      if (u < 0 || u >= U || v < 0 || v >= V) continue;
      const col = typeof sh === 'number' ? sh : sh(u, v, x, y, z); if (!col) continue;
      put(j * IW + i, col, x + y + 2 * z, x, y, z, t === 'T' ? 0 : t === 'Y' ? 1 : 2);
} } }
function box(x0, y0, z0, x1, y1, z1, m) {       // m = {t, y, x}; a falsy entry skips that face
  if (m.t) face('T', x0, y0, z1, x1 - x0, y1 - y0, m.t);
  if (m.y) face('Y', x0, y1, z0, x1 - x0, z1 - z0, m.y);
  if (m.x) face('X', x1, y0, z0, y1 - y0, z1 - z0, m.x);
}
```

Pixel centres never land exactly on integer or half-integer edges, so half-open tests tile faces
with no gaps. Interior walls are just `'Y'`/`'X'` faces at the wall plane; holes (doors, windows,
stairwells) are shaders returning 0, with the space behind rasterized as more faces.

**Shaders** work in face-local units. On Y/X faces one u unit is 2 screen columns and one v unit
is 1 row, so `col = floor(u*2), row = floor(v)` gives pixel-exact patterns that shear correctly
with the wall. Patterns worth having: wallpaper motifs from tiny string maps, wainscot panels,
skirting/cornice bands, plank floors (row seams + random-length butt joints + grain flecks),
checker tiles with grout and a highlight corner, beadboard, brick (offset rows + mortar), clapboard
siding, shingles (staggered tabs + dark row lip + occasional moss), cut-section edges (cream with
darker outline). An edge-aware box helper (lighter top with a highlighted front edge, base-colour
+y face, darker +x face, darker bottom row) makes furniture read instantly.

**Slopes** (roofs): ray-plane intersection from the z=0 base point:
`t = (zA + s*(yb - yA)) / (2 - s)`, then `x = xb + t, y = yb + t, z = 2t`. Only visible when s < 2.

**Cylinders** (pots, lamp shades, round tables, rugs): from the base point `(xb, yb, 0)` the ray
is `(xb+t, yb+t, 2t)`. Top disk: `t = zTop/2`, test the radius. Side: solve the quadratic and take
the larger root (front surface), keep it if `z0 <= 2t < zTop`. Shade the side by angle (lighter
toward the key light) and pattern by angle/height (stripes, staves, plaid).

**Decals.** Pictures, shelves of things on walls and posters are faces placed 0.03-0.06 units in
front of the wall plane, with a shader that samples a sprite at `(floor(u*2), V-1-floor(v))`. On
X faces columns run the other way: use `c = floor((yLeft - y) * 2)`. Flat things on floors
(rugs, papers) are top faces at z + 0.1 with the `NOOUT` flag.

**Billboard sprites** (small objects, characters):

```js
function stampS(spr, wx, wy, wz, slope = 0) {   // spr.ax/ay = pixel that sits on (wx,wy,wz)
  const sx0 = Math.round(isx(wx, wy)) - spr.ax, sy0 = Math.round(isy(wx, wy, wz)) - spr.ay, d0 = DEP(wx, wy, wz);
  for (let r = 0; r < spr.h; r++) for (let c = 0; c < spr.w; c++) { const col = spr.d[r * spr.w + c]; if (!col) continue;
    const h = spr.ay - r, dx = c - spr.ax;
    put((sy0 + r) * IW + sx0 + c, col, d0 + 2 * h + slope * dx, wx + dx / 4, wy - dx / 4, wz + h, 3); }
}
```

Depth per pixel is `d0 + 2·(rows above anchor) + slope·(columns from anchor)`. Slope encodes
which way the object extends: `+0.5` for something long along x (a dog walking ±x), `-0.5` along
y, `1.5` for limbs reaching toward +x and down (a seated figure's thighs and dangling shins).
Anchor seated figures at the hip on the seat, not at the floor.

## 6. Outline pass

After the static scene is built, darken every pixel whose neighbour lies well behind it and
belongs to another object. This gives selective, colour-matched outlines everywhere for free.

```js
for each non-sky pixel p with depth dp and object ob:
  if any 4-neighbour q has S.obj[q] !== ob and S.dep[q] < dp - 3.5 (use -6 for the pixel below):
    out[p] = dk(S.idx[p], 2)
```

Hand-drawn sprites carry their own outlines; mark them `NOOUT` only if the double edge looks heavy.

## 7. Lighting bake

Each pixel gets `warm` and `cool` (0-255). Light knowledge comes from the stored world position
and a normal code (0 top, 1 +y face, 2 +x face, 3 billboard/round, 4 background).

```js
function lightContrib(L, x, y, z, n) {          // L: {x,y,z,I,r,rooms:{roomId: weight}}
  const dx = x - L.x, dy = y - L.y, dz = (z - L.z) / 1.83, d2 = dx*dx + dy*dy + dz*dz, rr = L.r * L.r;
  if (d2 > rr * 2.6) return 0;
  const d = Math.sqrt(d2) + 1e-3;
  const lam = n === 0 ? 0.45 + 0.55 * Math.max(0, -dz / d) : n === 1 ? 0.45 + 0.55 * Math.max(0, -dy / d)
            : n === 2 ? 0.45 + 0.55 * Math.max(0, -dx / d) : 0.75;
  return L.I * 205 * lam / (1 + 3.2 * d2 / rr) * Math.max(0, 1 - d2 / (rr * 2.6));
}
```

- **Rooms** stop light leaking through walls: each light lists the rooms it reaches with weights
  (0.2-0.4 into an adjacent open room, ~0.35 onto the ground just outside a cutaway).
- **Ambient per room**: interiors ~80-88, outdoors ~46 warm plus ~85 cool (moonlight).
- **Ambient occlusion**: floor pixels darken within ~3.5 units of the room's back walls and within
  ~2 units of every furniture footprint registered with `foot(x0,y0,x1,y1,z,strength)`; wall
  pixels darken toward the floor and the inside corner. Multiply warm by `1 - ao*0.6`.
- **Cool spill**: interior pixels near windows get cool light, so lightning can flash them later.
- **Dynamic lights** (fire, candles, fairy bulbs, a flickering street lamp, a firefly jar) are not
  baked. Store a sparse map per light (`Int32Array` of pixel indices + `Uint8Array` values) and add
  `value * scale(t)` each frame.
- **Reflections**: for glossy floors, precompute a narrow vertical strip of floor pixels below each
  bright light's screen position (fading with distance); each frame add light with a
  `hash(column, row>>1, floor(t*10))` shimmer.
- Characters and other dynamic sprites call `lightAt(x, y, z, room, t)` (ambient + all lights,
  with dynamic scales) at their feet and head and interpolate per row.

## 8. Per-frame pipeline and resolve

```js
function renderFrame(t) {
  if (CFG.loop) t = ((t % LOOP) + LOOP) % LOOP;
  FR.idx.set(S.idx); FR.dep.set(S.dep); FR.w.set(S.warm); FR.c.set(S.cool);   // memcpy
  drawSky(t);          // precomputed list of sky pixels: base gradient + 2 scrolling tileable cloud maps,
                       // stars only where no cloud, lightning bolt + flash palette remap + cool boost
  drawPanes(t);        // window glass pixels -> outside view: night gradient, distant bokeh,
                       // downward-scrolling rain streaks, drops that wait then slide down
  applyDynLights(t);   // sparse maps * flicker, floor reflections
  drawProps(t);        // fire, steam, smoke, curtains, plants, pendulums, mobiles, bulbs, particles
  drawCharacters(t);   // shadow blob first (reduce FR.w on floor pixels), then stampD
  drawWeather(t);      // rain only on EXT pixels not covered by a dynamic pixel, splashes, ripples, drips
  resolve();
}
function resolve() {
  buildLUT();
  for (let j = 0; j < IH; j++) { const bj = (j & 3) << 2, row = j * IW;
    for (let i = 0; i < IW; i++) { const p = row + i, b = FX.dither ? BAYER[bj | (i & 3)] : 8;
      O32[p] = LUT[(FR.idx[p] << 5) | (WLV[(FR.w[p] << 4) | b] << 2) | CLV[(FR.c[p] << 4) | b]]; } }
  ctx640.putImageData(img, 0, 0);
  view.getContext('2d').imageSmoothingEnabled = false;
  view.getContext('2d').drawImage(canvas640, 0, 0, 1920, 1080);              // exact 3x nearest neighbour
}
```

Dynamic drawing uses `dput(i, j, col, depth, warm)` (depth-tested write to `FR`) and `stampD`
(the billboard stamp writing to `FR` with per-row light). Wall-plane animated sprites (curtains,
pendulums) map sprite pixel (c, r) to world `x = x0 + (c + shift(r) + 0.5)/2, z = zTop - r - 0.5`
and plot it. A per-row `shift(r)` gives cloth sway.

Window panes are registered during the static build (`PANE_ID` + `F_PANE` + a placeholder
index); at startup collect each pane's pixel list and screen bbox once.

Rain is drawn by setting `FR.idx` directly on pixels flagged `EXT` (sky, roof, lawn, exterior
walls). Leaving the open cutaway interior dry keeps the rooms readable. Drops near a lamp switch
to warm or bright colours, which makes a light cone appear in the rain.

## 9. Performance notes

- A full frame (two memcpys, a sky pass over ~150k pixels, sprites, resolve) runs at ~2 ms median
  in Chromium. Flash frames that boost every exterior pixel reach ~7-9 ms; still fine for 60 fps.
- Allocate nothing per frame. Particles are evaluated from `(index, t)` instead of being stored.
  The only caches are bounded (episode cache of ≤4, LUT rebuilt only when the palette grows).
- Building the static world takes ~0.3-0.4 s at startup; that is fine.
- Keep the palette under ~600 entries (each costs 32 LUT slots). Watch for runaway `mixC` calls in
  hot paths; memoise them.
