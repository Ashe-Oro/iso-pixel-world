/* =====================================================================
   Sky: palette-cycled gradient, sun glow, moon, stars, Milky Way, stratus
   wisps and shooting stars. All of it sits behind the static world, so it
   only ever touches pixels flagged in SKYM.
   ===================================================================== */
const SC = 5 / 3;                                   // art authored for the 384x216 view
const SX = x => (x - 58) * SC, SY = y => (y - 42) * SC;
const HORIZON = 188;
const SUN = { x: Math.round(SX(112)), y: Math.round(SY(173)), r: 21 };
const MOON_R = 13;
const SKYM = new Uint8Array(NPIX);                  // 1 where nothing static covers the background
function bg(i, j, c) { if (i < 0 || j < 0 || i >= IW || j >= IH) return; const p = j * IW + i; if (SKYM[p]) FR.idx[p] = c; }

const SKY_S = [0, 0.2, 0.4, 0.56, 0.68, 0.78, 0.87, 0.94, 1];
const SKY_KEYS = [
  [0.0, ['#1b1430', '#2c1b45', '#4c2558', '#782f60', '#a43f5f', '#cc5858', '#e97a51', '#f6a25c', '#fcd08a']],
  [0.35, ['#120e28', '#1c1640', '#2e1c50', '#4a2258', '#702a5a', '#983656', '#bc4a4c', '#d86448', '#ea8a52']],
  [0.65, ['#0a0c22', '#101632', '#182044', '#222a58', '#302f68', '#463872', '#5e4078', '#7a4c7e', '#94607e']],
  [1.0, ['#04061a', '#070a22', '#0a102c', '#0e1636', '#121c40', '#16224a', '#1c2a54', '#24345e', '#2e3e68']]
];
const NB = 24;
function skyStop(s) { let k = 1; while (k < SKY_S.length - 1 && s > SKY_S[k]) k++; return [k, (s - SKY_S[k - 1]) / (SKY_S[k] - SKY_S[k - 1])]; }
const SKYP = Array.from({ length: NB }, (_, b) => { const [k, u] = skyStop(b / (NB - 1)); return CK(SKY_KEYS.map(([n, h]) => [n, mixHex(h[k - 1], h[k], u)])); });
const skyHexAt = yWorld => { const [k, u] = skyStop(clamp(yWorld / HORIZON, 0, 1)), h = SKY_KEYS[0][1]; return mixHex(h[k - 1], h[k], u); };   // golden-hour sky, for hazing far things
/* band value in 1/16 steps + Bayer -> band, snapped so the gradient reads as flat bands with thin dithered edges */
const BANDQ = new Uint8Array((((NB - 1) * 16 + 2) * 16));
for (let v = 0; v < (NB - 1) * 16 + 2; v++) for (let b = 0; b < 16; b++) {
  const lv = v / 16, base = Math.floor(lv), f = clamp((lv - base - 0.5) * 1.8 + 0.5, 0, 1);
  BANDQ[v * 16 + b] = Math.min(NB - 1, base + (f * 16 > b + 0.5 ? 1 : 0));
}
const SB = { list: null, n: 0, base: null, ba: null, gi: null, px: null };
const GL = new Float32Array(IW * (IH + 80)), MG = new Float32Array(221 * 221);
const skyBand = (s, b) => SKYP[BANDQ[(Math.floor(clamp(s, 0, 1) * (NB - 1) * 16) << 4) | b]];

/* after the static world is drawn: everything still empty is sky */
function finishSky() {
  const arr = [], fill = CLOUDS.far.fillY + 8;
  for (let p = 0; p < NPIX; p++) if (S.dep[p] < -1e8) { SKYM[p] = 1; S.flag[p] = F_SKY; }
  for (let p = 0; p < fill * IW; p++) if (SKYM[p]) arr.push(p);
  SB.list = Int32Array.from(arr); SB.n = arr.length;
  SB.base = new Float32Array(SB.n); SB.ba = new Uint8Array(SB.n); SB.gi = new Int32Array(SB.n); SB.px = new Float32Array(NPIX);
  for (let p = 0; p < NPIX; p++) {
    if (!SKYM[p]) continue;
    const j = (p / IW) | 0, i = p - j * IW, s = Math.pow(clamp((42 + (j + 0.5) * 0.6) / HORIZON, 0, 1), 1.1);
    SB.px[p] = s; S.idx[p] = skyBand(s, bay(i, j));
    for (const L of CLOUD_ORDER) if (j >= L.row[i]) S.idx[p] = L.col[1];
  }
  const under = new Set(); for (let p = 0; p < fill * IW; p++) if (SKYM[p] && ((p / IW) | 0) >= CLOUDS.far.row[p % IW]) under.add(p);
  SB.list = SB.list.filter(p => !under.has(p)); SB.n = SB.list.length;
  for (let k = 0; k < SB.n; k++) { const p = SB.list[k], j = (p / IW) | 0, i = p - j * IW; SB.base[k] = SB.px[p]; SB.ba[k] = bay(i, j); SB.gi[k] = (j + 80) * IW + i; }
  for (let j = 0; j < IH + 80; j++) for (let i = 0; i < IW; i++) {
    const d = Math.hypot((i - SUN.x) * 0.75, (j - 80 - SUN.y) * 1.3);
    GL[j * IW + i] = 0.78 * Math.exp(-d / 43) + 0.4 * Math.exp(-d / 150);
  }
  for (let y = 0; y < 221; y++) for (let x = 0; x < 221; x++) MG[y * 221 + x] = 0.3 * Math.exp(-Math.hypot(x - 110, y - 110) / 40);
  buildMilkyWay();
}

function drawSkyGlow(t) {
  const gk = 1 - smooth01(0, 0.55, CUR_N); if (gk <= 0.001) return;
  const off = Math.round(60 * sunSink(t)) * IW, L = SB.list, base = SB.base, ba = SB.ba, gi = SB.gi, n = SB.n, idx = FR.idx, m = (NB - 1) * 16;
  for (let k = 0; k < n; k++) {
    const g = GL[gi[k] - off] * gk, s = 1 - (1 - base[k]) * (1 - (g > 1 ? 1 : g)), v = (s * m) | 0;
    idx[L[k]] = SKYP[BANDQ[(v << 4) | ba[k]]];
  }
}

const SUN_CORE = [['#ffd98c', '#ffe9ac', '#fff4cc', '#fffbea'], ['#e0583a', '#ec7444', '#f69458', '#ffb276']];
const SUN_PAL = Array.from({ length: 9 }, (_, k) => SUN_CORE[0].map((c, i) => CE(mixHex(c, SUN_CORE[1][i], k / 8))));
const SUN_HALO = Array.from({ length: 9 }, (_, k) => CE(mixHex('#ffe2a0', '#f08a5a', k / 8)));
function drawSun(t) {
  const sink = sunSink(t); if (sink >= 1) return;
  const sy = SUN.y + Math.round(60 * sink), lv = Math.round(sink * 8), core = SUN_PAL[lv], halo = SUN_HALO[lv], r = SUN.r;
  for (let dy = -r - 7; dy <= r + 7; dy++) for (let dx = -r - 7; dx <= r + 7; dx++) {
    const d = Math.hypot(dx, dy), x = SUN.x + dx, y = sy + dy;
    if (d <= r) {
      const v = d > r - 1 ? 0 : 0.9 - 0.5 * (Math.hypot(dx + 6, dy + 6) / (r * 1.6));
      bg(x, y, core[clamp(Math.floor(v * 4 + bay(x, y) / 16 - 0.5 + 0.5), 0, 3)]);
    } else if (d <= r + 7 && 0.55 * (1 - (d - r) / 7) * 16 > bay(x, y)) bg(x, y, halo);
  }
}

/* the full moon rises from the right-hand cloud horizon, arcs overhead and sets on the left */
function moonAt(t) {
  const m = (mod(t + EPS, LOOP) - 75) / 150;
  if (m <= 0 || m >= 1) return null;
  return { x: Math.round(SX(lerp(440, 90, m))), y: Math.round(SY(206 - 150 * Math.sin(Math.PI * m))), a: smooth01(0.5, 0.8, night(t)) };
}
const MOON_LIT = ['#aeaab0', '#d0ccc4', '#ebe7da', '#fbf8ee'].map(CE), MOON_CR = CE('#bab4ac'), MOON_HALO = CE('#6c78aa');
const CRATERS = [[-5, -3, 2.6], [3, 2, 3.6], [-2, 7, 2], [7, -7, 1.7], [-7, 4, 1.2]];
function drawMoon(t) {
  const M = moonAt(t); if (!M || M.a <= 0 || !FX.moon) return;
  /* glow lifts the gradient around the disc */
  for (let y = 0; y < 221; y += 1) { const j = M.y + y - 110; if (j < 0 || j >= IH) continue;
    for (let x = 0; x < 221; x++) { const i = M.x + x - 110; if (i < 0 || i >= IW) continue; const p = j * IW + i; if (!SKYM[p] || j >= CLOUDS.far.fillY) continue;
      const g = MG[y * 221 + x] * M.a; if (g < 0.012) continue; FR.idx[p] = skyBand(1 - (1 - SB.px[p]) * (1 - g), bay(i, j)); } }
  const R_ = MOON_R;
  for (let dy = -R_ - 7; dy <= R_ + 7; dy++) for (let dx = -R_ - 7; dx <= R_ + 7; dx++) {
    const d = Math.hypot(dx, dy), x = M.x + dx, y = M.y + dy;
    if (d <= R_) {
      if (M.a * 16 <= bay(dx + 40, dy + 40)) continue;
      const crater = CRATERS.some(([cx, cy, r]) => (dx - cx) ** 2 + (dy - cy) ** 2 <= r * r);
      const v = 0.9 - 0.5 * Math.hypot(dx + 5, dy + 5) / (R_ * 1.8);
      bg(x, y, crater ? MOON_CR : MOON_LIT[clamp(Math.floor(v * 4 + bay(dx + 40, dy + 40) / 16 - 0.5), 0, 3)]);
    } else if (d <= R_ + 7 && M.a * 0.45 * (1 - (d - R_) / 7) > hash2(dx * 13 + 7, dy * 7 + 3)) bg(x, y, MOON_HALO);
  }
}

/* a few early stars high up at dusk, then the whole night sky fills in star by star */
const STARS = (() => {
  const r = mulberry32(5), out = [], bottom = SY(196);
  while (out.length < 26) out.push({ x: Math.floor(r() * IW), y: Math.floor(3 + r() * 90), P: [2, 3, 5, 6][Math.floor(r() * 4)], off: r(), b: 0.45 + r() * 0.55, big: r() > 0.85, early: true });
  while (out.length < 300) out.push({ x: Math.floor(r() * IW), y: Math.floor(3 + r() * (bottom - 10)), P: [2, 3, 5, 6][Math.floor(r() * 4)], off: r(), b: 0.4 + r() * 0.6, big: r() > 0.93, th: 0.4 + r() * 0.5, cool: r() > 0.5 });
  return out;
})();
function drawStars(t) {
  if (!FX.stars) return;
  const N = CUR_N, bottom = SY(196);
  for (const s of STARS) {
    const vis = s.early ? Math.max(clamp(1.25 - s.y / 83, 0, 1), N) : smooth01(s.th, s.th + 0.15, N) * clamp((bottom - s.y) / 50, 0, 1);
    if (vis <= 0) continue;
    const a = s.b * vis * (0.6 + 0.4 * wave(t, s.P, s.off));
    if (a < 0.25) continue;
    const dim = s.cool ? P.star3 : P.star2;
    bg(s.x, s.y, a > 0.5 ? P.star : dim);
    if (s.big && a > 0.6) { bg(s.x - 1, s.y, dim); bg(s.x + 1, s.y, dim); bg(s.x, s.y - 1, dim); bg(s.x, s.y + 1, dim); }
  }
}

/* Milky Way: a faint diagonal band of star dust with a darker lane, only in deep night */
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), sx), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), sx), sy);
}
const MILKY = { p: null, c: null, h: null };
function buildMilkyWay() {
  const ax = SX(110), ay = SY(200), bx = SX(440), by = SY(40), len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
  const d1 = CE('#24285a'), d2 = CE('#41447e'), sp = CE('#d4d8f6'), P_ = [], C_ = [], H_ = [];
  for (let j = 0; j < SY(196); j++) for (let i = 0; i < IW; i++) {
    const p = j * IW + i; if (!SKYM[p]) continue;
    const d = (i - ax) * nx + (j - ay) * ny, along = ((i - ax) * (bx - ax) + (j - ay) * (by - ay)) / (len * len);
    const ends = smooth01(0, 0.15, along) * (1 - smooth01(0.85, 1, along));
    let v = Math.exp(-((d / 30) ** 2)) * (0.5 + 0.5 * noise2(i / 20, j / 20)) * ends;
    v -= 0.45 * Math.exp(-(((d + 5 + 13 * (noise2(i / 37 + 40, j / 37) - 0.5)) / 8) ** 2)) * ends;
    let c = 0;
    if (v > 0.3 && hash2(i * 7, j * 13) > 0.985) c = sp;
    else if (v > 0.25 && hash2(i * 3 + 1, j * 5 + 7) < v * 0.4) c = v > 0.6 ? d2 : d1;
    if (c) { P_.push(p); C_.push(c); H_.push(hash2(i * 11 + 5, j * 17 + 3)); }
  }
  MILKY.p = Int32Array.from(P_); MILKY.c = Uint16Array.from(C_); MILKY.h = Float32Array.from(H_);
}
function drawMilkyWay() {
  if (!FX.milkyway) return;
  const a = smooth01(0.7, 0.95, CUR_N); if (a <= 0) return;
  const { p, c, h } = MILKY; for (let k = 0; k < p.length; k++) if (a > h[k]) FR.idx[p[k]] = c[k];
}

/* thin stratus streaks, lit from below by the low sun: each grows, drifts and thins away */
function wispKeys(y) {
  const s = y / HORIZON;
  const sets = s < 0.42 ? [['#5a2a5a', '#843a6e', '#b25a7e'], ['#2a1840', '#3a2050', '#5a3068'], ['#0c1028', '#141a38', '#262e58']]
    : s < 0.74 ? [['#8a3c6a', '#c25c78', '#f08c84'], ['#3a2050', '#5a2c62', '#8a4474'], ['#101634', '#1a2244', '#323e6c']]
      : [['#cc6466', '#f59a72', '#ffd49a'], ['#5a2c5a', '#8a3c62', '#c06470'], ['#141a3a', '#22284e', '#46507e']];
  return [0, 1, 2].map(k => CK([[0, sets[0][k]], [0.5, sets[1][k]], [1, sets[2][k]]]));
}
const WISPS = [[70, 56, 90, 2, 60, 0.1, 36], [290, 50, 104, 2, 60, 0.55, 36], [150, 74, 120, 3, 60, 0.32, 40], [360, 86, 80, 3, 50, 0.8, 40], [56, 102, 110, 3, 60, 0.72, 44],
  [236, 96, 64, 2, 50, 0.2, 34], [104, 136, 90, 3, 60, 0.9, 40], [356, 128, 84, 3, 60, 0.42, 40], [60, 165, 104, 2, 50, 0.62, 46], [386, 166, 60, 2, 60, 0.05, 32]]
  .map(([x, y, len, th, P_, off, drift], i) => ({ x: SX(x), y: Math.round(SY(y)), len: Math.round(len * SC), th: th + 1, P: P_, off, drift: drift * SC, seed: i * 1.7, c: wispKeys(y) }));
function drawWisps(t) {
  if (!FX.wisps) return;
  for (const w of WISPS) {
    const p = phase(t, w.P, w.off), vis = clamp(3 * Math.sin(Math.PI * p), 0, 1);
    if (vis < 0.04) continue;
    const x0 = Math.round(w.x + w.drift * (p - 0.5));
    for (let i = 0; i < w.len; i++) {
      const u = i / (w.len - 1), e = 1 - Math.abs(u - 0.5) * 2;
      if (e < 1 - vis) continue;
      const shape = Math.pow(Math.sin(Math.PI * u), 0.5) * Math.min(1, (e - (1 - vis)) * 6);
      const th = Math.round(w.th * shape + 0.45 * Math.sin(i * 0.19 + w.seed));
      if (th <= 0) continue;
      const yy = w.y + Math.round(2 * Math.sin(i * 0.05 + w.seed)) - (th >> 1);
      for (let k = 0; k < th; k++) bg(x0 + i, yy + k, k === th - 1 ? w.c[2] : k === 0 && th > 2 ? w.c[0] : w.c[1]);
    }
  }
}

/* shooting stars, with a shower at the deepest point of the night that the children look up at */
const SHOOTING = [[112.0, 0.7, 334, 47, 268, 70], [147.6, 0.6, 300, 50, 250, 72], [148.9, 0.5, 380, 60, 340, 80], [150.2, 0.7, 222, 46, 162, 70], [151.6, 0.5, 330, 70, 290, 88],
  [152.8, 0.6, 150, 50, 96, 74], [154.1, 0.5, 410, 48, 372, 66], [155.4, 0.7, 182, 60, 126, 84], [232.0, 0.6, 176, 50, 120, 70]]
  .map(([t, dur, x0, y0, x1, y1]) => ({ t, dur, x0: SX(x0), y0: SY(y0), x1: SX(x1), y1: SY(y1) }));
function drawMeteors(t) {
  if (!FX.meteors) return;
  for (const M of SHOOTING) {
    const s = since(t, M.t); if (s >= M.dur) continue;
    const p = s / M.dur, hx = lerp(M.x0, M.x1, p), hy = lerp(M.y0, M.y1, p), dx = M.x1 - M.x0, dy = M.y1 - M.y0, len = Math.hypot(dx, dy), n = Math.round(26 * Math.sin(Math.PI * Math.min(1, p * 1.3)) + 3);
    for (let k = 0; k < n; k++) { const u = k / n; bg(Math.round(hx - dx / len * k), Math.round(hy - dy / len * k), u < 0.25 ? P.star : u < 0.6 ? P.star2 : P.star3); }
  }
}
