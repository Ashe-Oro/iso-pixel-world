/* =====================================================================
   Sky: palette-cycled gradient, a low winter sun, moon, stars, aurora and
   thin high cloud. All of it sits behind the mountains and the valley,
   so it only touches pixels flagged 1 in SKYM (2 = mountain).
   ===================================================================== */
const HORIZON = 175;
const SUN = { x: 70, y: 62, r: 16 };
const MOON_R = 11;
const SKYM = new Uint8Array(NPIX);                  // 1 sky, 2 mountain, 0 world
function bg(i, j, c) { if (i < 0 || j < 0 || i >= IW || j >= IH) return; const p = j * IW + i; if (SKYM[p] === 1) FR.idx[p] = c; }

const SKY_S = [0, 0.2, 0.4, 0.56, 0.68, 0.78, 0.87, 0.94, 1];
const SKY_KEYS = [
  [0.0, ['#3e5aa4', '#4f70b8', '#6c8cc8', '#92a8d4', '#bcc0d8', '#e2ccc8', '#f8d4b0', '#fde2b4', '#fff0cc']],
  [0.35, ['#2c3484', '#423c94', '#6a489c', '#9458a0', '#bc689c', '#e08290', '#f8a07c', '#fcbc80', '#ffdca4']],
  [0.68, ['#141c54', '#1e2868', '#2c327c', '#3e3c8a', '#584a94', '#745698', '#90649c', '#ac7c9c', '#c498a0']],
  [1.0, ['#0a1238', '#0e1a4a', '#14245c', '#1a2e6c', '#223a7a', '#2c4686', '#385490', '#48649a', '#5c78a6']]
];
const NB = 24;
function skyStop(s) { let k = 1; while (k < SKY_S.length - 1 && s > SKY_S[k]) k++; return [k, (s - SKY_S[k - 1]) / (SKY_S[k] - SKY_S[k - 1])]; }
const SKYP = Array.from({ length: NB }, (_, b) => { const [k, u] = skyStop(b / (NB - 1)); return CK(SKY_KEYS.map(([n, h]) => [n, mixHex(h[k - 1], h[k], u)])); });
/* band value in 1/16 steps + Bayer -> band, snapped so the gradient reads as flat bands with thin dithered edges */
const BANDQ = new Uint8Array((((NB - 1) * 16 + 2) * 16));
for (let v = 0; v < (NB - 1) * 16 + 2; v++) for (let b = 0; b < 16; b++) {
  const lv = v / 16, base = Math.floor(lv), f = clamp((lv - base - 0.5) * 1.8 + 0.5, 0, 1);
  BANDQ[v * 16 + b] = Math.min(NB - 1, base + (f * 16 > b + 0.5 ? 1 : 0));
}
const SB = { list: null, n: 0, base: null, ba: null, gi: null, px: null };
const GL = new Float32Array(IW * (IH + 110)), MG = new Float32Array(221 * 221);
const skyBand = (s, b) => SKYP[BANDQ[(Math.floor(clamp(s, 0, 1) * (NB - 1) * 16) << 4) | b]];

/* after the static world is drawn: everything still empty is sky, then the ranges go on top of it */
function finishSky() {
  for (let p = 0; p < NPIX; p++) if (S.dep[p] < -1e8) { SKYM[p] = 1; S.flag[p] = F_SKY; }
  SB.px = new Float32Array(NPIX);
  for (let p = 0; p < NPIX; p++) {
    if (!SKYM[p]) continue;
    const j = (p / IW) | 0, i = p - j * IW, s = Math.pow(clamp((j + 0.5) / HORIZON, 0, 1), 1.1);
    SB.px[p] = s; S.idx[p] = skyBand(s, bay(i, j));
  }
  buildMountains();
  const fill = CLOUDS.far.fillY + 8;
  for (let p = 0; p < NPIX; p++) if (SKYM[p]) { const j = (p / IW) | 0, i = p - j * IW; for (const L of CLOUD_ORDER) if (j >= L.row[i]) S.idx[p] = L.col[1]; }
  const arr = []; for (let p = 0; p < fill * IW; p++) if (SKYM[p] === 1 && ((p / IW) | 0) < CLOUDS.far.row[p % IW]) arr.push(p);
  SB.list = Int32Array.from(arr); SB.n = arr.length;
  SB.base = new Float32Array(SB.n); SB.ba = new Uint8Array(SB.n); SB.gi = new Int32Array(SB.n);
  for (let k = 0; k < SB.n; k++) { const p = SB.list[k], j = (p / IW) | 0, i = p - j * IW; SB.base[k] = SB.px[p]; SB.ba[k] = bay(i, j); SB.gi[k] = (j + 110) * IW + i; }
  for (let j = 0; j < IH + 110; j++) for (let i = 0; i < IW; i++) {
    const d = Math.hypot((i - SUN.x) * 0.75, (j - 110 - SUN.y) * 1.3);
    GL[j * IW + i] = 0.62 * Math.exp(-d / 40) + 0.34 * Math.exp(-d / 150);
  }
  for (let y = 0; y < 221; y++) for (let x = 0; x < 221; x++) MG[y * 221 + x] = 0.22 * Math.exp(-Math.hypot(x - 110, y - 110) / 40);
}

function drawSkyGlow(t) {
  const gk = 1 - smooth01(0.1, 0.8, CUR_N); if (gk <= 0.001) return;
  const off = Math.round(100 * sunSink(t)) * IW, L = SB.list, base = SB.base, ba = SB.ba, gi = SB.gi, n = SB.n, idx = FR.idx, m = (NB - 1) * 16;
  for (let k = 0; k < n; k++) {
    const g = GL[gi[k] - off] * gk, s = 1 - (1 - base[k]) * (1 - (g > 1 ? 1 : g)), v = (s * m) | 0;
    idx[L[k]] = SKYP[BANDQ[(v << 4) | ba[k]]];
  }
}

const SUN_CORE = [['#ffe4a4', '#fff0c4', '#fff8e0', '#fffdf4'], ['#f07848', '#f88e58', '#fcaa70', '#ffc48c']];
const SUN_PAL = Array.from({ length: 9 }, (_, k) => SUN_CORE[0].map((c, i) => CE(mixHex(c, SUN_CORE[1][i], k / 8))));
const SUN_HALO = Array.from({ length: 9 }, (_, k) => CE(mixHex('#ffeec0', '#f8a070', k / 8)));
function drawSun(t) {
  const sink = sunSink(t); if (sink >= 1) return;
  const sy = SUN.y + Math.round(100 * sink), lv = Math.round(sink * 8), core = SUN_PAL[lv], halo = SUN_HALO[lv], r = SUN.r;
  for (let dy = -r - 7; dy <= r + 7; dy++) for (let dx = -r - 7; dx <= r + 7; dx++) {
    const d = Math.hypot(dx, dy), x = SUN.x + dx, y = sy + dy;
    if (d <= r) {
      const v = d > r - 1 ? 0 : 0.9 - 0.5 * (Math.hypot(dx + 5, dy + 5) / (r * 1.6));
      bg(x, y, core[clamp(Math.floor(v * 4 + bay(x, y) / 16), 0, 3)]);
    } else if (d <= r + 7 && 0.55 * (1 - (d - r) / 7) * 16 > bay(x, y)) bg(x, y, halo);
  }
}

/* the moon rises from behind the right-hand peaks during the blue hour */
function moonAt(t) {
  const m = (mod(t + EPS, LOOP) - 62) / 116;
  if (m <= 0 || m >= 1) return null;
  return { x: Math.round(lerp(590, 430, m)), y: Math.round(112 - 86 * Math.sin(Math.PI * m)), a: smooth01(0.45, 0.85, night(t)) };
}
const MOON_LIT = ['#aeb4c8', '#ccd0dc', '#e8e8ec', '#fbfaf4'].map(CE), MOON_CR = CE('#b8bccc'), MOON_HALO = CE('#6c84c0');
const CRATERS = [[-4, -3, 2.2], [3, 2, 3], [-2, 6, 1.7], [6, -6, 1.5], [-6, 3, 1]];
function drawMoon(t) {
  const M = moonAt(t); if (!M || M.a <= 0 || !FX.moon) return;
  for (let y = 0; y < 221; y++) { const j = M.y + y - 110; if (j < 0 || j >= IH) continue;
    for (let x = 0; x < 221; x++) { const i = M.x + x - 110; if (i < 0 || i >= IW) continue; const p = j * IW + i; if (SKYM[p] !== 1 || j >= CLOUDS.far.fillY) continue;
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

/* stars come out from the top of the sky down as the light goes */
const STARS = (() => {
  const r = mulberry32(5), out = [];
  while (out.length < 230) out.push({ x: Math.floor(r() * IW), y: Math.floor(3 + r() * 130), P: [2, 3, 5, 6][Math.floor(r() * 4)], off: r(), b: 0.4 + r() * 0.6, big: r() > 0.93, th: 0.36 + r() * 0.5, cool: r() > 0.5 });
  return out;
})();
function drawStars(t) {
  if (!FX.stars) return;
  const N = CUR_N;
  for (const s of STARS) {
    const vis = smooth01(s.th, s.th + 0.15, N) * clamp((140 - s.y) / 50, 0, 1);
    if (vis <= 0) continue;
    const a = s.b * vis * (0.6 + 0.4 * wave(t, s.P, s.off));
    if (a < 0.25) continue;
    const dim = s.cool ? P.star3 : P.star2;
    bg(s.x, s.y, a > 0.5 ? P.star : dim);
    if (s.big && a > 0.6) { bg(s.x - 1, s.y, dim); bg(s.x + 1, s.y, dim); bg(s.x, s.y - 1, dim); bg(s.x, s.y + 1, dim); }
  }
}

function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), sx), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), sx), sy);
}
/* aurora: two slow curtains in the top of the sky, deepest in the blue hour */
const AUR = [CE('#1a4a62'), CE('#227a7c'), CE('#38a890'), CE('#74d8ac'), CE('#5a4a9c')];
const AUR_R = [[0.27, 34, 12, 0.1], [0.62, 52, 16, 0.55]];
function drawAurora(t) {
  if (!FX.aurora) return;
  const a = smooth01(0.74, 1, CUR_N); if (a <= 0) return;
  for (const [cx, y0, amp, ph] of AUR_R) {
    const c0 = cx * IW + 18 * wave(t, 40, ph);
    for (let i = 0; i < IW; i += 1) {
      const u = (i - c0) / 170; if (Math.abs(u) > 1) continue;
      const fall = (1 - u * u) * a, top = y0 + amp * Math.sin(i * 0.016 + TAU * phase(t, 30, ph)) + 5 * Math.sin(i * 0.05 - TAU * phase(t, 20, ph));
      const rays = 0.55 + 0.45 * Math.sin(i * 0.33 + 4 * Math.sin(i * 0.021) + TAU * phase(t, 15, ph)), hgt = 9 + 28 * rays * (0.6 + 0.4 * fall);
      for (let k = -4; k < hgt; k++) {
        const v = k / hgt, j = Math.round(top + k), dens = (k < 0 ? (k + 4) / 4 * 0.5 : (1 - v) * (1 - v)) * fall * (0.4 + 0.6 * rays);
        if (dens * 16 * 1.05 <= bay(i, j)) continue;
        bg(i, j, k < 0 ? AUR[4] : dens > 0.62 ? AUR[3] : dens > 0.38 ? AUR[2] : dens > 0.16 ? AUR[1] : AUR[0]);
      }
    }
  }
}

/* thin high cloud, each streak grows, drifts and thins away */
function wispKeys(y) {
  const s = y / 150;
  const sets = s < 0.5 ? [['#7a90c8', '#a0b4dc', '#dce4f4'], ['#5a3c8a', '#8a509a', '#e08a9a'], ['#141e52', '#1e2a60', '#34426e']]
    : [['#d8bcc8', '#f0d4c8', '#fff4e0'], ['#a8588e', '#e07a84', '#ffc098'], ['#1e2860', '#2c3870', '#4a5a8c']];
  return [0, 1, 2].map(k => CK([[0, sets[0][k]], [0.4, sets[1][k]], [1, sets[2][k]]]));
}
const WISPS = [[120, 34, 150, 3, 60, 0.1, 50], [420, 22, 170, 3, 60, 0.55, 60], [270, 62, 130, 3, 40, 0.32, 44], [560, 72, 110, 3, 60, 0.8, 50], [36, 100, 120, 2, 60, 0.72, 44], [620, 120, 90, 2, 40, 0.2, 40]]
  .map(([x, y, len, th, P_, off, drift], i) => ({ x, y, len, th: th + 1, P: P_, off, drift, seed: i * 1.7, c: wispKeys(y) }));
function drawWisps(t) {
  if (!FX.wisps) return;
  for (const w of WISPS) {
    const p = phase(t, w.P, w.off), vis = clamp(3 * Math.sin(Math.PI * p), 0, 1);
    if (vis < 0.04) continue;
    const x0 = Math.round(w.x - w.len / 2 + w.drift * (p - 0.5));
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
