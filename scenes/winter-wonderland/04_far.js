/* =====================================================================
   Far layer: three ranges of snow-capped mountains above the valley, with
   alpenglow on the peaks at sundown, mist lying along their feet and
   flocks crossing them.
   Colours are keyed to the time of day, so nothing here needs relighting.
   ===================================================================== */
const MOONRIM = CE('#e6eeff'), SUNRIM = CE('#fff4d8');
const ridged = (x, y) => { let a = 0.5, f = 1, v = 0; for (let k = 0; k < 4; k++) { v += a * (1 - Math.abs(2 * noise2(x * f, y * f) - 1)); a *= 0.5; f *= 2.13; } return v / 0.9375; };
/* tones by the time of day: N 0 gold, 0.35 alpenglow, 0.7 dusk, 1 blue hour */
const MT_TONE = {
  lit: ['#fff6e6', '#ffb4a0', '#ac9edc', '#92a4d8'],
  mid: ['#ecdce6', '#e68c9c', '#807cc0', '#7286c0'],
  shade: ['#b4bae2', '#9472ae', '#50569a', '#465aa0'],
  rock: ['#7a6a88', '#84507a', '#363868', '#2c3a6c'],
  rockD: ['#463f64', '#50305e', '#222650', '#1c2854']
};
const MT_N = [0, 0.35, 0.7, 1], MT_HAZE = ['#dcd4e4', '#eca8a8', '#6c5e94', '#44568a'];
const mtKeys = (tone, haze) => CK(MT_TONE[tone].map((h, k) => [MT_N[k], mixHex(h, MT_HAZE[k], haze)]));
const RANGES = [
  { haze: 0.56, seed: 11, slope: 0.82, snow: 0.8, peaks: [[20, 96], [138, 74], [262, 60], [356, 74], [486, 50], [612, 72]] },
  { haze: 0.2, seed: 23, slope: 1.02, snow: 0.56, peaks: [[86, 58], [214, 36], [340, 54], [420, 18], [548, 46], [650, 30]] },
  { haze: 0.04, seed: 37, slope: 0.62, snow: 0.3, peaks: [[-10, 92], [70, 122], [170, 112], [270, 132], [356, 122], [470, 128], [548, 104], [622, 86], [690, 108]] }
];
function buildRange(L) {
  const T = { lit: mtKeys('lit', L.haze), mid: mtKeys('mid', L.haze), shade: mtKeys('shade', L.haze), rock: mtKeys('rock', L.haze), rockD: mtKeys('rockD', L.haze) };
  for (let i = 0; i < IW; i++) {
    let ridge = 1e9, pk = null;
    for (const [x, top] of L.peaks) { const h = top + L.slope * Math.pow(Math.abs(i - x), 0.94) * 1.06; if (h < ridge) { ridge = h; pk = [x, top]; } }
    const dist = Math.abs(i - pk[0]), jag = (7 * (ridged(i / 30 + L.seed, L.seed) - 0.5) + 5 * (ridged(i / 9 + L.seed, 3) - 0.5)) * Math.min(1, dist / 14);
    ridge = Math.round(ridge + jag);
    for (let j = Math.max(0, ridge); j < 262; j++) {
      const p = j * IW + i; if (!SKYM[p]) continue;
      const dy = j - pk[1] + 7, fan = q => (q - pk[0]) / dy, e = q => ridged(fan(q) * 4.6 + L.seed + pk[0] * 0.13, dy / 58 + L.seed * 0.3);
      const g = (e(i + 2) - e(i - 2)) * 7, side = fan(i) + 0.14 * (noise2(j / 11, pk[0]) - 0.5);
      const dep = (j - pk[1]) / 150, lim = L.snow + 0.2 * (noise2(i / 15 + L.seed, j / 11) - 0.5);
      const tone = (side < 0 ? 0.7 : 0.24) + g * 0.8 + (bay(i, j) / 16 - 0.5) * 0.09;
      let c;
      if (dep > lim + 0.12 || (dep > 0.13 && Math.abs(g) > 0.66 && dep > lim * 0.4)) c = tone > 0.42 ? T.rock : T.rockD;
      else c = tone > 0.72 ? T.lit : tone > 0.4 ? T.mid : T.shade;
      if (j === ridge && side < 0.2) c = T.lit;
      S.idx[p] = c; SKYM[p] = 2;
    }
  }
}
/* the lowest range carries a belt of dark forest with snow on it */
function buildForestBelt() {
  const F = [CK([[0, '#3a4a68'], [0.35, '#3a3460'], [0.7, '#1a2448'], [1, '#141e44']]), CK([[0, '#566684'], [0.35, '#544876'], [0.7, '#28325a'], [1, '#202c54']]), CK([[0, '#e4e4ec'], [0.35, '#d8a0b0'], [0.7, '#5a5c98'], [1, '#4c5e9c']])];
  const r = mulberry32(431);
  for (let k = 0; k < 3200; k++) {
    const i = Math.floor(r() * IW), j = Math.floor(104 + r() * 96), p = j * IW + i, h = 5 + Math.floor(r() * 5);
    if (p < 0 || p >= NPIX || SKYM[p] !== 2) continue;
    for (let y = 0; y < h; y++) { const half = Math.floor(y / 2.2); for (let x = -half; x <= half; x++) { const q = (j + y) * IW + i + x; if (q >= 0 && q < NPIX && SKYM[q] === 2) S.idx[q] = x < 0 ? F[1] : F[0]; } }
    S.idx[j * IW + i] = F[2];
  }
}
function buildMountains() { for (const L of RANGES) buildRange(L); buildForestBelt(); }

/* ---- valley mist: low crescent-shaded puffs along the feet of the mountains ---- */
const STAMP = [];   // radius -> Int16Array of (dx, dy, tone): 0 shade, 1 body, 2 lit cap, 3 rim
function cloudStamp(r) {
  if (STAMP[r]) return STAMP[r];
  const out = [], rr = r * r + r * 0.7, k = Math.max(1, Math.round(r * 0.3)), kr = Math.max(1, Math.round(r * 0.12));
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy > rr) continue;
    let c = 1;
    if ((dx - kr * 0.6) ** 2 + (dy - kr) ** 2 > rr && dy < 0) c = 3;
    else if ((dx - k * 0.6) ** 2 + (dy - k) ** 2 > rr && dy < r * 0.3) c = 2;
    else if (dy > r * 0.55 && (dx + k * 0.4) ** 2 + (dy + k) ** 2 > rr) c = 0;
    out.push(dx, dy, c);
  }
  return (STAMP[r] = Int16Array.from(out));
}
function makeClouds({ seed, spacing, yBase, rMin, rMax, yJit, drift, periods, colours, twilight, nightCols, glow, fillDrop }) {
  const r = mulberry32(seed), puffs = [];
  for (let x = -50; x < IW + 50; x += spacing * (0.7 + r() * 0.6)) {
    const big = r() > 0.8;
    puffs.push({ x, y: yBase + (r() - 0.5) * yJit - (big ? rMax * 0.4 : 0), rmax: big ? rMax * 1.35 : lerp(rMin, rMax, r() * r()), P: periods[Math.floor(r() * periods.length)], off: r(), drift: drift * (0.7 + r() * 0.6) });
  }
  puffs.sort((a, b) => a.y - b.y || a.x - b.x);
  const col = [1, 2, 3, 4].map(i => CK([[0, colours[i]], [0.4, twilight[i]], [1, nightCols[i]]]));
  const fillY = Math.round(yBase + fillDrop), row = new Int16Array(IW);
  for (let i = 0; i < IW; i++) row[i] = fillY + Math.round(5 * Math.sin(i * 0.031 + seed) + 3 * Math.sin(i * 0.083 + seed * 2));
  return { puffs, col, glow, fillY, row };
}
const CLOUDS = {
  far: makeClouds({ seed: 21, spacing: 10, yBase: 134, rMin: 3, rMax: 7, yJit: 7, drift: 26, periods: [60, 48], glow: 1, fillDrop: 12,
    colours: ['#b8bcdc', '#ccd0e8', '#e4e4f0', '#f8f0e8', '#fffaf0'], twilight: ['#a07ab0', '#b888b8', '#d4a0bc', '#f4c0bc', '#ffe0c8'], nightCols: ['#26346c', '#2e3e7a', '#384a88', '#566aa4', '#9caed8'] })
};
const CLOUD_ORDER = [CLOUDS.far];
function drawClouds(L, t) {
  if (!FX.clouds) return;
  const M = moonAt(t), light = CUR_N < 0.45 ? { x: SUN.x, c: SUNRIM } : M && M.a > 0.3 ? { x: M.x, c: MOONRIM } : null;
  const plain = L.col, idx = FR.idx;
  for (const p of L.puffs) {
    const ph = phase(t, p.P, p.off), r = Math.round(p.rmax * Math.pow(Math.sin(Math.PI * ph), 0.4));
    if (r < 1) continue;
    const cx = Math.round(p.x + p.drift * (ph - 0.5)), cy = Math.round(p.y - r * 0.45), st = cloudStamp(r);
    const sunny = light && L.glow * Math.exp(-(((cx - light.x) / 170) ** 2)) > 0.45;
    const lit = sunny ? plain[3] : plain[2], rim = sunny ? light.c : plain[3], body = plain[1], shade = plain[0];
    for (let k = 0; k < st.length; k += 3) {
      const i = cx + st[k], j = cy + st[k + 1]; if (i < 0 || i >= IW || j < 0 || j >= IH) continue;
      const q = j * IW + i; if (!SKYM[q]) continue;
      const tn = st[k + 2]; idx[q] = tn === 1 ? body : tn === 2 ? lit : tn === 3 ? rim : shade;
    }
  }
}
function drawCloudSea(t) { drawClouds(CLOUDS.far, t); }

/* ---- birds, while the light lasts ---- */
const BIRD_K = CK([[0, '#2a2a4c'], [1, '#0e1438']]), BIRD_SP = [[-14, 0], [-1, -5], [1, 7], [12, -10], [14, 12]];
const BIRD_FRAMES = [['x.....x', '.xx.xx.', '...x...'], ['.......', 'xxxxxxx', '...x...'], ['...x...', '.xx.xx.', 'x.....x'], ['.......', 'xxxxxxx', '...x...']];
const FLOCKS = [{ t: 14, dur: 22, dir: -1, y: 60 }, { t: 208, dur: 24, dir: 1, y: 38 }];
function drawBirds(t) {
  if (!FX.birds) return;
  for (const F of FLOCKS) {
    const s = since(t, F.t); if (s > F.dur) continue;
    const p = s / F.dur, fx = Math.round(F.dir < 0 ? lerp(IW + 30, -40, p) : lerp(-40, IW + 30, p)), fy = Math.round(F.y + 13 * p + 5 * Math.sin(p * TAU));
    BIRD_SP.forEach(([bx, by], i) => {
      const f = BIRD_FRAMES[Math.floor(phase(t, 0.5, i * 0.21) * 4)], ox = fx - F.dir * bx, oy = fy + by + Math.round(Math.sin(s * 1.7 + i));
      for (let r = 0; r < f.length; r++) for (let c = 0; c < f[r].length; c++) if (f[r][c] === 'x') bg(ox + c, oy + r, BIRD_K);
    });
  }
}
