'use strict';
/* =====================================================================
   RAINY NIGHT DOLLHOUSE — a living isometric pixel-art diorama
   ---------------------------------------------------------------------
   Pure JS + Canvas 2D, no external assets. Everything (architecture,
   furniture, characters, weather) is generated in code at startup.

   Rendering: a software 2:1 isometric rasterizer writes palette indices,
   per-pixel depth and world position into 640x360 buffers. Static scene
   is built once; each frame copies it, composites sky/windows/props/
   characters with depth testing, then resolves index + warm/cool light
   through palette ramps (band-snapped Bayer dither) and blits 3x
   nearest-neighbour to a 1920x1080 canvas.

   Determinism: every animation is a pure function of time; all periods
   divide the 120 s loop; behaviour timelines are built from a seed.

   URL params:  ?seed=N  (behaviour + lightning seed; seed%3==2 -> "upstairs" loop)
                ?loop=0  (free mode: endless seeded episodes)   ?loop=1 (default 120 s loop)
                ?debug=1 ?speed=X ?t=seconds ?fixed=1 (fixed 1/60 s step) ?int=1 (integer scaling)
   Keys:        D debug panel · L loop on/off · Space pause · ←/→ scrub · [ ] speed
   Capture:     window.renderAt(t) renders an exact frame synchronously.
   ===================================================================== */

const IW = 640, IH = 360, NPIX = IW * IH;
const LOOP = 120;               // seconds — every periodic system divides this
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
  characters: 1, lighting: 1, dither: 1, firelight: 1, fire: 1, embers: 1, smoke: 1,
  steam: 1, candle: 1, fairy: 1, dust: 1, curtains: 1, plants: 1, pendulum: 1,
  rain: 1, windowRain: 1, glassDrops: 1, splashes: 1, puddles: 1, drips: 1,
  lightning: 1, clouds: 1, town: 1, streetlamp: 1, bulb: 1, mobile: 1,
  fireflies: 1, mouse: 1, moth: 1, reflections: 1, fish: 1, zzz: 1, car: 1, breath: 1
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
/* art RNG is fixed so the house always looks the same; behaviour uses CFG.seed */
let ART = mulberry32(90210);
const rnd = (a, b) => a + (b - a) * ART();
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(ART() * arr.length)];

/* ---------- periodic time helpers (exactly periodic over LOOP) ---------- */
const TAU = Math.PI * 2;
const cyc = sec => Math.max(1, Math.round(LOOP / sec));          // integer cycles/loop
const wave = (t, sec, ph = 0) => Math.sin(TAU * (t * cyc(sec) / LOOP + ph));
const phase = (t, sec, ph = 0) => { const v = t * cyc(sec) / LOOP + ph; return v - Math.floor(v); };
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

/* ---------- palette ---------- */
const PAL = [{ r: 0, g: 0, b: 0, e: 0 }];  // 0 = transparent / empty
const PALMAP = new Map();
function C(hex, e) {
  const key = hex.toLowerCase() + (e ? '!' : '');
  let i = PALMAP.get(key);
  if (i !== undefined) return i;
  const n = parseInt(hex.slice(1), 16);
  i = PAL.length;
  PAL.push({ r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, e: e ? 1 : 0 });
  PALMAP.set(key, i);
  return i;
}
const CE = hex => C(hex, 1);               // emissive (ignores lighting)
const hex2 = v => (v < 16 ? '0' : '') + v.toString(16);
const rgbHex = (r, g, b) => '#' + hex2(clamp(Math.round(r), 0, 255)) + hex2(clamp(Math.round(g), 0, 255)) + hex2(clamp(Math.round(b), 0, 255));
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
const P = {};
function defPal(o, e) { for (const k in o) P[k] = C(o[k], e); }
defPal({
  ink: '#1c1424', ink2: '#2a1f30', ink3: '#3a2c3c',
  wd0: '#3a2318', wd1: '#55331f', wd2: '#744628', wd3: '#965c35', wd4: '#b67a46', wd5: '#d09a5e', wd6: '#e6bc84',
  ow0: '#4a2c1c', ow1: '#6a4026', ow2: '#8c5833',
  cr0: '#bfa784', cr1: '#dcc9a3', cr2: '#efe0c0', cr3: '#fbf1dc', wh: '#fffaf0',
  pe0: '#d08562', pe1: '#eaa982', pe2: '#f6cba8', pe3: '#fbe2c8',
  hn0: '#a85e24', hn1: '#d89236', hn2: '#efba5c', hn3: '#f8d991',
  ro0: '#5e2a3c', ro1: '#82404f', ro2: '#a75a68', ro3: '#c87f87', ro4: '#e3a9a8', ro5: '#f3cfc8',
  tc0: '#5e271d', tc1: '#843a29', tc2: '#ac5536', tc3: '#cb7550', tc4: '#e19d74',
  sg0: '#273629', sg1: '#3a4d3d', sg2: '#526a52', sg3: '#6f8a69', sg4: '#97ad86', sg5: '#bfcfa6',
  mb0: '#0c0f22', mb1: '#141a33', mb2: '#1d2546', mb3: '#29345f', mb4: '#3c4c80', mb5: '#5d72a8', mb6: '#8a9dcb',
  vi0: '#231d38', vi1: '#342a4f', vi2: '#4c3f6e', vi3: '#6c5d93', vi4: '#9688ba', vi5: '#c2b8dc',
  ch0: '#1a181f', ch1: '#28252e', ch2: '#393540', ch3: '#534e5b', ch4: '#76707f', ch5: '#a49eab',
  bk0: '#5a261f', bk1: '#7a352a', bk2: '#9a4a35', bk3: '#b8654a', bk4: '#d08a68',
  te0: '#1f3b3f', te1: '#2b5859', te2: '#467f78', te3: '#72a898', te4: '#a9cdbb',
  gd0: '#8a5f22', gd1: '#c08a32', gd2: '#e7bb5a', gd3: '#f8e09a',
  lf0: '#1f3524', lf1: '#2f5131', lf2: '#467341', lf3: '#6a9a50', lf4: '#9ec66b',
  sk0: '#c88068', sk1: '#e5a487', sk2: '#f5c7a6', sk3: '#fde0c7',
  ml0: '#6a6e8a', ml1: '#9aa0b8', ml2: '#c9cddc'
});
defPal({
  fire0: '#7a1f12', fire1: '#c2401a', fire2: '#ec7a22', fire3: '#fbb444', fire4: '#ffe38a', fire5: '#fff8d6',
  bulb: '#fff2c4', bulb2: '#ffd98a', glow: '#f9c66a', glowR: '#ff8a7a', glowG: '#9fe88a', glowB: '#8ac8ff', glowP: '#e3a0ff',
  winL: '#f5b453', winL2: '#e08a35', star: '#fff6d8', ffly: '#d8ff7a', ffly2: '#8fdc5a', ember: '#ff9b3d', ember2: '#ffd36b',
  sky0: '#090b1a', sky1: '#0e1226', sky2: '#141a33', sky3: '#1b2142', sky4: '#232a50', sky5: '#2c3260', sky6: '#3a3a6c',
  cl0: '#171a32', cl1: '#1f2340', cl2: '#2a2c4e', cl3: '#36365c', cl4: '#45426a', moon: '#e9e4cf', moon2: '#c9c6b8', moonG: '#3d4170',
  rain0: '#3b4778', rain1: '#5d6ea3', rain2: '#8496c6', rain3: '#b5c3e6', bolt: '#e8efff', bolt2: '#a9b9ff',
  town: '#f2b85a', town2: '#e7894a', town3: '#ffd98f', hill0: '#0d1022', hill1: '#121733', hill2: '#181e3e', hill3: '#1f2649',
  zzz: '#cfd6ff', head: '#fff3c0', tail: '#ff4a3a'
}, 1);

/* ---------- lighting LUT: palette ramps by warm (0..7) & cool (0..3) ---------- */
const LV_B = [0.20, 0.30, 0.42, 0.56, 0.72, 0.88, 1.00, 1.10];
const LV_SH = [0.62, 0.50, 0.38, 0.26, 0.15, 0.06, 0.0, 0.0];
const LV_WM = [0, 0, 0, 0, 0, 0.02, 0.08, 0.15];
const CV = [0, 0.13, 0.27, 0.45];
let LUT = new Uint32Array(0), LUTN = 0;
function litRGB(p, w, c) {
  if (p.e) return [p.r, p.g, p.b];
  const B = LV_B[w], sh = LV_SH[w], wm = LV_WM[w];
  let r = p.r * B, g = p.g * B, b = p.b * B;
  r = r * (1 - sh) + 30 * sh; g = g * (1 - sh) + 24 * sh; b = b * (1 - sh) + 62 * sh;   // violet shadows
  r += (255 - r) * wm; g += (205 - g) * wm * 0.9; b += (120 - b) * wm * 0.4;            // honey highlights
  const k = CV[c];
  r = r * (1 - k) + 118 * k; g = g * (1 - k) + 146 * k; b = b * (1 - k) + 214 * k;     // cool moon/lightning
  return [clamp(Math.round(r), 0, 255), clamp(Math.round(g), 0, 255), clamp(Math.round(b), 0, 255)];
}
function buildLUT() {
  if (LUTN === PAL.length) return;
  const n = PAL.length, L = new Uint32Array(n * 32);
  for (let i = 0; i < n; i++) for (let w = 0; w < 8; w++) for (let c = 0; c < 4; c++) {
    const [r, g, b] = litRGB(PAL[i], w, c);
    L[(i << 5) | (w << 2) | c] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  LUT = L; LUTN = n;
}
/* 4x4 ordered dither */
const BAYER = new Uint8Array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]);
/* band-snapped level tables: flat light bands with narrow dithered transitions */
const WLV = new Uint8Array(256 * 16), CLV = new Uint8Array(256 * 16);
(function () {
  for (let v = 0; v < 256; v++) for (let b = 0; b < 16; b++) {
    const mk = (lv, max, k) => { const base = Math.floor(lv), f = lv - base, f2 = clamp((f - 0.5) * k + 0.5, 0, 1); return Math.min(max, base + (f2 * 16 > b + 0.5 ? 1 : 0)); };
    WLV[v * 16 + b] = mk(v / 32, 7, 2.6); CLV[v * 16 + b] = mk(v / 64, 3, 2.2);
  }
})();

/* ---------- sprite buffer (palette-indexed) ---------- */
class Spr {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint16Array(w * h); this.ax = 0; this.ay = h - 1; }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
  pxo(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h && this.d[y * this.w + x]) this.d[y * this.w + x] = c; }
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
  recolor(m) { for (let i = 0; i < this.d.length; i++) { const v = m.get(this.d[i]); if (v !== undefined) this.d[i] = v; } return this; }
}
const outl = c => dk(c, 2);   // default selective outline colour
