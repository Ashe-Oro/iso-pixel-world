'use strict';
/* =====================================================================
   WINTER WONDERLAND — a living isometric pixel-art diorama
   ---------------------------------------------------------------------
   Pure JS + Canvas 2D, no external assets. A snowy valley below a wall of
   mountains. Children sled down the hill and build a snowman, a big dog
   knocks it over and they build it again, and a couple rock on the porch
   of a log cabin with cocoa while their orange tabby comes out through
   the cat flap to snuggle.

   Rendering: the 2:1 isometric rasterizer of the other scenes, with a
   height-field pass for the hill. The static world is built once at
   640x360 and lit by two baked layers (golden hour and blue hour) that are
   blended each frame. Sky, mountains and clouds are palette-cycled.

   Determinism: every animation is a pure function of time and every
   period divides the 240 s loop.

   URL params:  ?seed=N  ?loop=0 (free running)  ?debug=1  ?speed=X  ?t=seconds
                ?fixed=1 (fixed 1/60 s step)  ?int=1 (integer scaling)
   Keys:        D debug panel · L loop on/off · Space pause · ←/→ scrub · [ ] speed
   Capture:     window.renderAt(t) renders an exact frame synchronously.
   ===================================================================== */

const IW = 640, IH = 360, NPIX = IW * IH;
const LOOP = 240;               // seconds — every periodic system divides this
const CFG = { seed: 7, loop: true, speed: 1, debug: false, t0: 0, paused: false, intScale: false };
(() => {
  const q = new URLSearchParams(location.search);
  if (q.has('seed')) CFG.seed = (parseInt(q.get('seed'), 10) | 0) || 1;
  if (q.has('loop')) CFG.loop = q.get('loop') !== '0';
  if (q.has('debug')) CFG.debug = q.get('debug') !== '0';
  if (q.has('speed')) CFG.speed = Math.max(0, parseFloat(q.get('speed')) || 1);
  if (q.has('t')) CFG.t0 = parseFloat(q.get('t')) || 0;
  if (q.has('int')) CFG.intScale = q.get('int') !== '0';
})();

/* Individually toggleable effect systems (debug panel). */
const FX = {
  characters: 1, lighting: 1, dither: 1, clouds: 1, stars: 1, aurora: 1, moon: 1, wisps: 1,
  birds: 1, snowfall: 1, sparkle: 1, spindrift: 1, smoke: 1, lamps: 1, stringlights: 1, treelights: 1,
  icicles: 1, breath: 1, spray: 1, steam: 1, trails: 1, cardinal: 1, hare: 1, deer: 1, emotes: 1
};

/* ---------- deterministic hashing / RNG ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x9e3779b9, 0x165667b1);
  h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const hash3 = (a, b, c) => hash2(Math.imul(a | 0, 31337) + (c | 0) * 7919, b);
let ART = mulberry32(90210);       // art RNG is fixed so the island always looks the same
const rnd = (a, b) => a + (b - a) * ART();
const rndi = (a, b) => Math.floor(rnd(a, b + 1));

/* ---------- periodic time helpers (exactly periodic over LOOP) ---------- */
const TAU = Math.PI * 2, EPS = 1e-9;
const mod = (a, b) => ((a % b) + b) % b;
const cyc = sec => Math.max(1, Math.round(LOOP / sec));          // integer cycles/loop
const wave = (t, sec, ph = 0) => Math.sin(TAU * (t * cyc(sec) / LOOP + ph));
const phase = (t, sec, ph = 0) => { const v = t * cyc(sec) / LOOP + ph + EPS; return v - Math.floor(v); };
const since = (t, start) => mod(t - start + EPS, LOOP);          // seconds since a once-per-loop event
function vnoise(t, rate, key) {            // value noise, lattice wraps every LOOP
  const N = Math.max(1, Math.round(LOOP * rate));
  const f = t * N / LOOP; let i = Math.floor(f); const fr = f - i;
  i = ((i % N) + N) % N; const j = (i + 1) % N;
  const a = hash2(key, i), b = hash2(key, j), s = fr * fr * (3 - 2 * fr);
  return a + (b - a) * s;
}
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const smooth01 = (a, b, x) => smooth((x - a) / (b - a));

/* ---------- time of day ----------
   N = how far the light has gone: 0 = golden afternoon (t = 0 and t = LOOP), 1 = blue hour. It stops
   at twilight, since the children are still out playing. Symmetric about the middle of the loop, so
   the light closes seamlessly. */
const fromMidnight = t => Math.abs(mod(t + EPS, LOOP) - LOOP / 2);
const night = t => 1 - smooth01(26, 92, fromMidnight(t));
const sunSink = t => 1 - smooth01(52, 112, fromMidnight(t));     // 0 high in the gap, 1 once behind the peaks

/* ---------- palette ---------- */
const PAL = [{ r: 0, g: 0, b: 0, e: 0 }];  // 0 = transparent / empty
const PALMAP = new Map(), KEYED = [];
const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function C(hex, e) {
  const key = hex.toLowerCase() + (e ? '!' : '');
  let i = PALMAP.get(key);
  if (i !== undefined) return i;
  const [r, g, b] = rgbOf(hex);
  i = PAL.length;
  PAL.push({ r, g, b, e: e ? 1 : 0 });
  PALMAP.set(key, i);
  return i;
}
const CE = hex => C(hex, 1);               // emissive (ignores lighting)
/* keyed entry: self-lit colour that follows the time of day. keys = [[N, '#hex'], ...] sorted by N */
function CK(keys) {
  const key = 'k' + keys.map(k => k[0] + k[1]).join(), hit = PALMAP.get(key);
  if (hit !== undefined) return hit;
  const i = PAL.length, c0 = rgbOf(keys[0][1]);
  PAL.push({ r: c0[0], g: c0[1], b: c0[2], e: 1, keys: keys.map(([n, h]) => [n, rgbOf(h)]) });
  PALMAP.set(key, i); KEYED.push(i);
  return i;
}
const hex2 = v => (v < 16 ? '0' : '') + v.toString(16);
const rgbHex = (r, g, b) => '#' + hex2(clamp(Math.round(r), 0, 255)) + hex2(clamp(Math.round(g), 0, 255)) + hex2(clamp(Math.round(b), 0, 255));
const mixHex = (a, b, k) => { const p = rgbOf(a), q = rgbOf(b); return rgbHex(lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)); };
function mixC(i, j, t, e) {
  const a = PAL[i], b = PAL[j];
  return C(rgbHex(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t)), e === undefined ? a.e : e);
}
const _dk = new Map(), _lt = new Map();
/* hue-shifted darker / lighter partners (pixel-art style ramps) */
function dk(i, n = 1) {
  if (n <= 0 || !i) return i;
  let k = i * 8 + n, v = _dk.get(k);
  if (v !== undefined) return v;
  const p = PAL[i];
  v = C(rgbHex(p.r * 0.70 + 6, p.g * 0.66 + 4, p.b * 0.74 + 14), p.e);
  v = dk(v, n - 1); _dk.set(k, v); return v;
}
function lt(i, n = 1) {
  if (n <= 0 || !i) return i;
  let k = i * 8 + n, v = _lt.get(k);
  if (v !== undefined) return v;
  const p = PAL[i];
  v = C(rgbHex(p.r + (255 - p.r) * 0.24 + 6, p.g + (255 - p.g) * 0.2 + 2, p.b + (255 - p.b) * 0.12), p.e);
  v = lt(v, n - 1); _lt.set(k, v); return v;
}
const ramp = list => list.map(h => C(h));
/* named ramps */
const R = {
  snow: ramp(['#7f8fc4', '#98a8d6', '#b0bfe4', '#c8d4ee', '#dee6f6', '#f0f4fb', '#ffffff']),
  log: ramp(['#3a1f18', '#5a3020', '#7c4628', '#9e6232', '#c08042', '#dca25a', '#f0c47c']),
  chink: ramp(['#a8987e', '#ccbc9e', '#e8dcc0']),
  wood: ramp(['#3e2428', '#5a3430', '#7a4a36', '#9a6440', '#bc8452']),
  stone: ramp(['#3a3044', '#58485c', '#786a78', '#9c8e94', '#c4b6b4']),
  pine: ramp(['#0e2830', '#14383a', '#1c4c46', '#286450', '#3a7e5c', '#5c9c6c']),
  trunk: ramp(['#2a1a28', '#422636', '#643a36', '#8a5440', '#b0704c']),
  ice: ramp(['#6e9cc8', '#94c0e0', '#bce0f0', '#e4f6fc'])
};
const P = {};
function defPal(o, e) { for (const k in o) P[k] = C(o[k], e); }
defPal({
  ink: '#2a1a30', ink2: '#3a2a40', wh: '#fff8f0', red: '#c8342e', redD: '#8e2230', redL: '#e8604a', coal: '#2a2630',
  carrot: '#f08030', carrotD: '#c05820', twig: '#5a3a2c', twigL: '#7c5438', holly: '#2e7a4c', berry: '#d8302e'
});
defPal({ glow0: '#c8683a', glow1: '#e68a42', glow2: '#f8ae52', glow3: '#ffcf74', glow4: '#fff0b4', star: '#fff4e2', star2: '#d8b4dc', star3: '#a8b8ec' }, 1);

/* ---------- lighting LUT ----------
   Palette ramps by warm level (0..7) and cool level (0..3), one table per time-of-day grade.
   Keyed palette entries take their colour from the grade, which is what cycles the sky. */
const LV_B = [0.22, 0.32, 0.44, 0.58, 0.74, 0.88, 1.00, 1.10];
const LV_SH = [0.62, 0.50, 0.38, 0.26, 0.15, 0.06, 0.0, 0.0];
const LV_WM = [0, 0, 0, 0, 0, 0.02, 0.08, 0.15];
const CV = [0, 0.26, 0.4, 0.55];
const GRADES = 64;
/* golden-hour tint on lit surfaces; the warm/cool blend does the dimming */
const TINT_KEYS = [[0, [1, 0.965, 0.9]], [0.35, [1, 0.8, 0.8]], [0.65, [0.84, 0.8, 0.98]], [1, [1, 1, 1]]];
const TINT_EASE = [1, 1, 1, 1, 1, 1, 0.6, 0];     // lamp-lit surfaces keep their own colour
function keyAt(keys, n) {
  let i = 1; while (i < keys.length - 1 && n > keys[i][0]) i++;
  const [n0, a] = keys[i - 1], [n1, b] = keys[i], u = clamp((n - n0) / (n1 - n0), 0, 1);
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}
const pack = (r, g, b) => (255 << 24) | (clamp(Math.round(b), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(r), 0, 255);
const LUTS = new Array(GRADES).fill(null); let LUTN = 0;
function buildLUT(gi) {
  const N = gi / (GRADES - 1), n = PAL.length, L = new Uint32Array(n * 32), T = keyAt(TINT_KEYS, N);
  for (let i = 0; i < n; i++) {
    const p = PAL[i];
    if (p.e) { const c = p.keys ? keyAt(p.keys, N) : [p.r, p.g, p.b]; L.fill(pack(c[0], c[1], c[2]), i << 5, (i + 1) << 5); continue; }
    for (let w = 0; w < 8; w++) {
      const B = LV_B[w], sh = LV_SH[w], wm = LV_WM[w], te = TINT_EASE[w];
      let r0 = p.r * B * (1 + (T[0] - 1) * te), g0 = p.g * B * (1 + (T[1] - 1) * te), b0 = p.b * B * (1 + (T[2] - 1) * te);
      r0 = r0 * (1 - sh) + 30 * sh; g0 = g0 * (1 - sh) + 24 * sh; b0 = b0 * (1 - sh) + 62 * sh;   // violet shadows
      r0 += (255 - r0) * wm; g0 += (205 - g0) * wm * 0.9; b0 += (120 - b0) * wm * 0.4;            // honey highlights
      const lamp = N * clamp((w - 2.6) / 2.4, 0, 1); g0 *= 1 - 0.1 * lamp; b0 *= 1 - 0.34 * lamp;  // lamplight on snow reads warm
      for (let c = 0; c < 4; c++) {
        const k = CV[c];
        L[(i << 5) | (w << 2) | c] = pack(r0 * (1 - k) + 100 * k, g0 * (1 - k) + 134 * k, b0 * (1 - k) + 232 * k);   // cool snow-light
      }
    }
  }
  return L;
}
function lutFor(gi) {
  if (LUTN !== PAL.length) { LUTS.fill(null); LUTN = PAL.length; }
  return LUTS[gi] || (LUTS[gi] = buildLUT(gi));
}
/* keyed colours are written fresh each frame, so the sky turns continuously between grades */
function applyKeyed(L, N) {
  for (let q = 0; q < KEYED.length; q++) {
    const i = KEYED[q], ks = PAL[i].keys; let k = 1; while (k < ks.length - 1 && N > ks[k][0]) k++;
    const a = ks[k - 1], b = ks[k], u = clamp((N - a[0]) / (b[0] - a[0]), 0, 1), A = a[1], B = b[1];
    L.fill(pack(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u), i << 5, (i + 1) << 5);
  }
}
/* 4x4 ordered dither */
const BAYER = new Uint8Array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]);
const bay = (i, j) => BAYER[((j & 3) << 2) | (i & 3)];
/* band-snapped level tables: flat light bands with narrow dithered transitions */
const WLV = new Uint8Array(256 * 16), CLV = new Uint8Array(256 * 16);
(function () {
  for (let v = 0; v < 256; v++) for (let b = 0; b < 16; b++) {
    const mk = (lv, max, k) => { const base = Math.floor(lv), f = lv - base, f2 = clamp((f - 0.5) * k + 0.5, 0, 1); return Math.min(max, base + (f2 * 16 > b + 0.5 ? 1 : 0)); };
    WLV[v * 16 + b] = mk(v / 32, 7, 5); CLV[v * 16 + b] = mk(v / 64, 3, 4);
  }
})();

/* ---------- sprite buffer (palette-indexed) ---------- */
class Spr {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint16Array(w * h); this.ax = 0; this.ay = h - 1; }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
  g(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.d[y * this.w + x] : 0; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  ell(cx, cy, rx, ry, c, fn) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1) this.px(x, y, fn ? fn(x, y, dx, dy, d) : c);
    }
  }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  /* paint from string rows; legend maps chars -> palette idx ('.' / ' ' skip) */
  map(rows, leg, ox = 0, oy = 0, flip = false) {
    for (let j = 0; j < rows.length; j++) { const r = rows[j]; for (let i = 0; i < r.length; i++) {
      const ch = r[i]; if (ch === '.' || ch === ' ') continue; const c = leg[ch]; if (c === undefined) continue;
      this.px(flip ? ox + r.length - 1 - i : ox + i, oy + j, c);
    } }
    return this;
  }
  blit(s, ox, oy, flip) { for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) { const c = s.d[j * s.w + i]; if (c) this.px(ox + (flip ? s.w - 1 - i : i), oy + j, c); } }
  /* 1px outer outline using a function of the neighbouring colour */
  outline(fn, diag = false) {
    const o = new Uint16Array(this.d), w = this.w, h = this.h;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (this.d[y * w + x]) continue;
      let n = this.g(x, y + 1) || this.g(x, y - 1) || this.g(x - 1, y) || this.g(x + 1, y);
      if (!n && diag) n = this.g(x - 1, y - 1) || this.g(x + 1, y - 1) || this.g(x - 1, y + 1) || this.g(x + 1, y + 1);
      if (n) o[y * w + x] = fn ? fn(n, x, y) : P.ink;
    }
    this.d = o; return this;
  }
  flip() { const s = new Spr(this.w, this.h); s.blit(this, 0, 0, true); s.ax = this.w - 1 - this.ax; s.ay = this.ay; return s; }
  clone() { const s = new Spr(this.w, this.h); s.d.set(this.d); s.ax = this.ax; s.ay = this.ay; return s; }
}
/* sprite from string rows + {char: hex} legend; anchor defaults to bottom centre */
function smap(rows, legend, ax, ay) {
  const leg = {}; for (const k in legend) leg[k] = typeof legend[k] === 'number' ? legend[k] : C(legend[k]);
  const s = new Spr(rows[0].length, rows.length); s.map(rows, leg);
  s.ax = ax === undefined ? s.w >> 1 : ax; s.ay = ay === undefined ? s.h - 1 : ay; return s;
}
const outl = s => { s.outline(() => P.ink); return s; };                    // 1px ink outline
const pad = rows => { const w = rows[0].length + 2; return ['.'.repeat(w), ...rows.map(r => '.' + r + '.'), '.'.repeat(w)]; };
