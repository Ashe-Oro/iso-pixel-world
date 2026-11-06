/* =====================================================================
   Far layer: the cloud sea (four banks of crescent-shaded puffs), distant
   islands, drifting rocks, birds and the sky dragon. Colours are keyed to
   the time of day, so these sprites never need relighting.
   ===================================================================== */
const SUNRIM = CE('#fff0c8'), MOONRIM = CE('#e6eeff');
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
  for (let x = -50; x < IW + 50; x += spacing * SC * (0.7 + r() * 0.6)) {
    const big = r() > 0.8;
    puffs.push({ x, y: SY(yBase) + (r() - 0.5) * yJit * SC - (big ? rMax * SC * 0.4 : 0), rmax: (big ? rMax * 1.35 : lerp(rMin, rMax, r() * r())) * SC,
      P: periods[Math.floor(r() * periods.length)], off: r(), drift: drift * SC * (0.7 + r() * 0.6) });
  }
  puffs.sort((a, b) => a.y - b.y || a.x - b.x);
  const col = [1, 2, 3, 4].map(i => CK([[0, colours[i]], [0.5, twilight[i]], [1, nightCols[i]]]));
  const fillY = Math.round(SY(yBase + fillDrop)), row = new Int16Array(IW);
  for (let i = 0; i < IW; i++) row[i] = fillY + Math.round(5 * Math.sin(i * 0.031 + seed) + 3 * Math.sin(i * 0.083 + seed * 2));
  return { puffs, col, glow, fillY, row };
}
const CLOUDS = {
  far: makeClouds({ seed: 21, spacing: 5, yBase: 193, rMin: 3, rMax: 6, yJit: 3, drift: 12, periods: [60, 50], glow: 1.0, fillDrop: 1,
    colours: ['#c4727e', '#d8867e', '#ec9c84', '#ffc590', '#ffe2ae'], twilight: ['#6a4a7a', '#7a5486', '#8e6094', '#b07aa4', '#d4a0b4'], nightCols: ['#1e2850', '#26325e', '#2e3c6c', '#4a5c8c', '#8e9ec8'] }),
  mid: makeClouds({ seed: 33, spacing: 7, yBase: 208, rMin: 4, rMax: 9, yJit: 5, drift: 20, periods: [60, 50], glow: 0.8, fillDrop: 2,
    colours: ['#9a5078', '#b46480', '#d07c80', '#f0a086', '#ffcc98'], twilight: ['#523e6c', '#5e4678', '#6c5084', '#8a6898', '#b48aac'], nightCols: ['#162044', '#1c2850', '#22305c', '#3a4a7a', '#7080ae'] }),
  mid2: makeClouds({ seed: 39, spacing: 9, yBase: 227, rMin: 6, rMax: 12, yJit: 6, drift: 32, periods: [60], glow: 0.5, fillDrop: 3,
    colours: ['#6c3868', '#844674', '#a0587a', '#c8767e', '#eaa086'], twilight: ['#3a2c58', '#443264', '#4e3a70', '#664c84', '#8a6a9c'], nightCols: ['#10183a', '#141e44', '#1a2650', '#2c3c6a', '#56689a'] }),
  near: makeClouds({ seed: 47, spacing: 12, yBase: 253, rMin: 9, rMax: 16, yJit: 6, drift: 48, periods: [60], glow: 0.25, fillDrop: 4,
    colours: ['#3e2654', '#523060', '#6a3c6a', '#905072', '#ba6c7c'], twilight: ['#241c40', '#2a2048', '#302652', '#443466', '#5e4a7e'], nightCols: ['#0a1030', '#0e1638', '#121c42', '#1e2c58', '#36487a'] })
};
const CLOUD_ORDER = [CLOUDS.far, CLOUDS.mid, CLOUDS.mid2];
/* over = true paints across the island too (the near bank passes in front of the belly) */
function drawClouds(L, t, clip, over) {
  if (!FX.clouds) return;
  const M = moonAt(t), light = CUR_N < 0.45 ? { x: SUN.x, c: SUNRIM } : M && M.a > 0.3 ? { x: M.x, c: MOONRIM } : null;
  const plain = L.col, idx = FR.idx, dep = FR.dep;
  for (const p of L.puffs) {
    const ph = phase(t, p.P, p.off), r = Math.round(p.rmax * Math.pow(Math.sin(Math.PI * ph), 0.4));
    if (r < 1) continue;
    const cx = Math.round(p.x + p.drift * (ph - 0.5)), cy = Math.round(p.y - r * 0.45), st = cloudStamp(r);
    const sunny = light && L.glow * Math.exp(-(((cx - light.x) / 117) ** 2)) > 0.45;
    const lit = sunny ? plain[3] : plain[2], rim = sunny ? light.c : plain[3], body = plain[1], shade = plain[0];
    for (let k = 0; k < st.length; k += 3) {
      const i = cx + st[k], j = cy + st[k + 1]; if (i < 0 || i >= IW || j < 0 || j >= IH || (clip && j >= clip[i])) continue;
      const q = j * IW + i; if (!over && !SKYM[q]) continue;
      const tn = st[k + 2]; idx[q] = tn === 1 ? body : tn === 2 ? lit : tn === 3 ? rim : shade;
      if (over) dep[q] = 1e6;
    }
  }
}
function drawCloudSea(t) {
  drawClouds(CLOUDS.far, t, CLOUDS.mid.row, false);
  drawClouds(CLOUDS.mid, t, CLOUDS.mid2.row, false);
  drawClouds(CLOUDS.mid2, t, null, false);
}
function drawNearClouds(t) {
  const L = CLOUDS.near; for (let j = L.fillY; j < IH; j++) for (let i = 0; i < IW; i++) { FR.idx[j * IW + i] = L.col[1]; FR.dep[j * IW + i] = 1e6; }
  drawClouds(L, t, null, true);
}

/* ---- distant islands: small iso ovals, hazed toward the dusk sky ---- */
function farKeys(hex, haze, yWorld) {
  const a = mixHex(hex, skyHexAt(yWorld), haze), c = rgbOf(a);
  return CK([[0, a], [0.5, rgbHex(c[0] * 0.56 + 6, c[1] * 0.5 + 8, c[2] * 0.72 + 16)], [1, rgbHex(c[0] * 0.3 + 8, c[1] * 0.36 + 10, c[2] * 0.58 + 24)]]);
}
function buildFarIsland({ w, depth, seed, haze, yWorld, trees = [], ruins = false, grass = true }) {
  const ry = Math.max(2, Math.round(w / 5)), top = ruins ? 26 : trees.length ? 18 : 4, H = top + ry * 2 + depth + 6, W = w + 6, s = new Spr(W, H), cx = W / 2, cy = top + ry;
  const body = ['#2e1a3c', '#40264a', '#563254'].map(c => farKeys(c, haze, yWorld));
  const topC = farKeys('#8a5a4e', haze * 0.8, yWorld), topL = farKeys('#c49a58', haze * 0.7, yWorld), rim = farKeys('#f0946e', haze * 0.5, yWorld);
  for (let x = 0; x < W; x++) {
    const u = (x + 0.5 - cx) / (w / 2); if (Math.abs(u) >= 1) continue;
    const yT = cy + ry * Math.sqrt(1 - u * u), d = Math.max(2, Math.round(depth * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 1.4)), 1.5) + (hash2(Math.floor(x / 4), seed) - 0.5) * 6));
    for (let y = Math.round(yT); y <= yT + d; y++) {
      const v = 0.75 - 0.4 * u - 0.6 * (y - yT) / depth + (bay(x, y) / 16 - 0.5) * 0.5;
      s.px(x, y, y < yT + 1.5 && u < 0.3 ? rim : body[clamp(Math.floor(v * 3), 0, 2)]);
    }
  }
  s.ell(cx, cy, w / 2, ry, 0, (x, y, dx, dy) => grass && dx * 0.8 + dy * 0.6 + (hash3(x >> 1, y >> 1, seed) - 0.5) * 0.7 < -0.05 ? topL : topC);
  const treeC = ['#6e2a3a', '#a4443a', '#d0703e'].map(c => farKeys(c, haze * 0.75, yWorld));
  for (const [tx, r] of trees) {
    const x0 = cx + tx, y0 = cy - r * 0.6;
    s.rect(x0, y0, 2, r + 1, body[0]);
    s.ell(x0 + 1, y0 - r * 0.7, r + 1, r, 0, (x, y, dx, dy) => treeC[clamp(Math.floor((0.55 - (dx + dy) * 0.4) * 3 + bay(x, y) / 16 - 0.5), 0, 2)]);
  }
  if (ruins) {
    const L = farKeys('#e8c4a4', haze * 0.6, yWorld), D_ = farKeys('#8a6a7a', haze * 0.6, yWorld);
    const pillar = (x, h) => { for (let y = cy - h; y < cy + 2; y++) { s.px(cx + x, y, L); s.px(cx + x + 1, y, L); s.px(cx + x + 2, y, D_); } };
    pillar(-15, 18); pillar(-5, 18); pillar(9, 10);
    for (let x = -17; x <= -2; x++) { s.px(cx + x, cy - 19, L); s.px(cx + x, cy - 20, x < -8 ? L : D_); s.px(cx + x, cy - 21, D_); }
    s.ruinTop = cy;
  }
  s.ax = Math.round(cx); s.ay = cy; return s;
}
let FAR = [], ROCKS = [];
const RUNE = CE('#6af0e0'), FALL_FAR = [CE('#a8708e'), CE('#e8b4b4')];
function buildFar() {
  const list = [
    { sp: { w: 53, depth: 30, seed: 3, haze: 0.5, yWorld: 118, trees: [[-10, 5], [7, 4]] }, x: 53, y: 127, P: 10, off: 0.2, amp: 1 },
    { sp: { w: 74, depth: 40, seed: 9, haze: 0.42, yWorld: 94, trees: [[22, 5]], ruins: true }, x: 583, y: 87, P: 15, off: 0.6, amp: 1, fall: 8, runes: [[-14, -14], [-14, -9], [-4, -15], [-4, -10], [10, -8], [-11, -19], [-9, -19]] },
    { sp: { w: 24, depth: 13, seed: 17, haze: 0.55, yWorld: 146, trees: [[-3, 3]] }, x: 622, y: 173, P: 6, off: 0.1, amp: 1 },
    { sp: { w: 28, depth: 15, seed: 23, haze: 0.38, yWorld: 66 }, x: 153, y: 40, P: 7.5, off: 0.4, amp: 1 }
  ];
  FAR = list.map(f => ({ ...f, s: buildFarIsland(f.sp) }));
  const rocks = [[183, 262, 15, 12, 1, true, 6, 0.1, 3], [547, 213, 20, 15, 2, true, 7.5, 0.5, 3], [573, 260, 10, 8, 3, false, 5, 0.8, 2], [147, 297, 8, 7, 4, false, 10, 0.3, 2]];
  ROCKS = rocks.map(([x, y, w, depth, seed, grass, P_, off, amp]) => ({ x, y, P: P_, off, amp, s: buildFarIsland({ w, depth, seed, haze: 0.12, yWorld: 150, grass }) }));
}
function stampBG(s, x, y) {
  const x0 = x - s.ax, y0 = y - s.ay;
  for (let r = 0; r < s.h; r++) { const j = y0 + r; if (j < 0 || j >= IH) continue;
    for (let c = 0; c < s.w; c++) { const v = s.d[r * s.w + c]; if (!v) continue; const i = x0 + c; if (i < 0 || i >= IW) continue; const q = j * IW + i; if (SKYM[q]) FR.idx[q] = v; } }
}
function drawFar(t) {
  if (!FX.far) return;
  for (const d of FAR) {
    const oy = Math.round(d.amp * wave(t, d.P, d.off));
    stampBG(d.s, d.x, d.y + oy);
    if (d.fall) for (let k = 0; k < 72; k++) {
      const a = 0.85 * (1 - k / 72), c = mod(Math.floor(k / 4 - 3 * phase(t, 0.5)), 3) === 0 ? FALL_FAR[1] : FALL_FAR[0];
      if (a * 16 > bay(0, k)) { bg(d.x + d.fall, d.y + 14 + oy + k, c); bg(d.x + d.fall + 1, d.y + 14 + oy + k, c); }
    }
    if (d.runes) { const g = smooth01(0.4, 0.8, CUR_N); if (g > 0) d.runes.forEach(([x, y], i) => { if (g * (0.55 + 0.45 * wave(t, 4, i * 0.17)) * 16 > bay(0, i)) bg(d.x + x, d.y + y + oy, RUNE); }); }
  }
}
function drawRocks(t) { if (FX.rocks) for (const r of ROCKS) stampBG(r.s, r.x, r.y + Math.round(r.amp * wave(t, r.P, r.off))); }

/* ---- birds, daylight only ---- */
const BIRD_K = CK([[0, '#22102a'], [1, '#0a0c22']]), BIRD_SP = [[-14, 0], [-1, -5], [1, 7], [12, -10], [14, 12]];
const BIRD_FRAMES = [['x.....x', '.xx.xx.', '...x...'], ['.......', 'xxxxxxx', '...x...'], ['...x...', '.xx.xx.', 'x.....x'], ['.......', 'xxxxxxx', '...x...']];
const FLOCKS = [{ t: 30, dur: 20, dir: -1, y: 70 }, { t: 268, dur: 24, dir: 1, y: 37 }];
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

/* ---- sky dragon: a slim serpent gliding a lazy ellipse round the ruin island ---- */
const DRG = { cx: 580, cy: 90, rx: 80, ry: 20, segs: 46, gap: 0.0062 };
const DRG_C = { back: CK([[0, '#2a1638'], [0.6, '#1e1a48'], [1, '#26305e']]), belly: CK([[0, '#f09a7a'], [0.6, '#8a5a8a'], [1, '#5a78a8']]), mane: CE('#ffd27a'), horn: CE('#fff0c8') };
function dragonSeg(t, k) {
  const a = TAU * (phase(t, 60) - k * DRG.gap);
  return [Math.round(DRG.cx + DRG.rx * Math.cos(a)), Math.round(DRG.cy + DRG.ry * Math.sin(a) + 3 * wave(t, 2.5, -k * 0.035)), Math.sin(a) > 0];
}
function bgLine(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let k = 0; k <= n; k++) bg(Math.round(lerp(x0, x1, k / n)), Math.round(lerp(y0, y1, k / n)), c); }
function drawDragon(t, front) {
  if (!FX.dragon) return;
  const tailFrom = DRG.segs - 10; let [x0, y0] = dragonSeg(t, 0);
  for (let k = 1; k < DRG.segs; k++) {
    const [x, y, f] = dragonSeg(t, k);
    if (f === front) {
      const neck = k < 18;
      bgLine(x0, y0, x, y, DRG_C.back);
      if (k < tailFrom + 6) bgLine(x0, y0 + 1, x, y + 1, DRG_C.back);
      if (neck) bgLine(x0, y0 + 2, x, y + 2, DRG_C.back);
      if (k < tailFrom) { bgLine(x0, y0 + 2 + neck, x, y + 2 + neck, DRG_C.belly); }
      if (k < tailFrom && k % 4 === 1 && wave(t, 1, k * 0.13) > -0.3) bg(x, y - 1, DRG_C.mane);
      if (k === 9 || k === 26) { bg(x, y + 3, DRG_C.back); bg(x + 1, y + 4, DRG_C.back); bg(x + 1, y + 5, DRG_C.back); }
      if (k === DRG.segs - 1) { bg(x, y - 1, DRG_C.mane); bg(x, y + 1, DRG_C.mane); bg(x - 1, y, DRG_C.mane); }
    }
    x0 = x; y0 = y;
  }
  const [hx, hy, hf] = dragonSeg(t, 0); if (hf !== front) return;
  const dir = hx >= dragonSeg(t, 3)[0] ? 1 : -1;
  for (let i = 0; i <= 5; i++) { bg(hx + i * dir, hy, DRG_C.back); bg(hx + i * dir, hy + 1, DRG_C.back); bg(hx + i * dir, hy + 2, DRG_C.back); bg(hx + i * dir, hy + 3, i < 5 ? DRG_C.belly : DRG_C.back); }
  bg(hx + dir, hy - 1, DRG_C.back); bg(hx + 6 * dir, hy + 1, DRG_C.back); bg(hx + 6 * dir, hy + 2, DRG_C.back);
  bg(hx + 3 * dir, hy + 1, DRG_C.mane);
  bg(hx - dir, hy - 1, DRG_C.horn); bg(hx - 2 * dir, hy - 2, DRG_C.horn); bg(hx - 3 * dir, hy - 3, DRG_C.horn);
  bg(hx + 6 * dir, hy + 3, DRG_C.mane); bg(hx + 5 * dir, hy + 4, DRG_C.mane); bg(hx + 4 * dir, hy + 5, DRG_C.mane);
}
