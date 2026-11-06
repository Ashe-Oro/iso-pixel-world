/* =====================================================================
   Animated props and particles, all pure functions of t: roots, canopy
   shimmer, clothesline, lanterns, smoke, pond life, waterfall, leaves,
   motes and fireflies.
   ===================================================================== */
const ROPE = C('#4a2c30'), PIN = C('#d8b080'), ROOT_C = [C('#3a2232'), C('#5e3a3c')];
const LEAF_C = ['#c2322a', '#e0542c', '#f08434', '#f6b444', '#a8282c'].map(h => C(h));
const LAUNDRY = [
  { x: LINE.x0 + 7, off: 0, s: outl(smap(pad(['ttt..tttt..ttt', 'tttttttttttttt', 'tttttttttttttt', 'ttttTttttTtttt', 'TTT.tttttt.TTT', '....tttttt....', '....tttttt....', '....tttttt....', '....tttttt....', '....TTTTTT....']), { t: '#3e7aa8', T: '#2a5682' }, 0, 0)) },
  { x: LINE.x0 + 16.5, off: 0.45, s: outl(smap(pad(['yyyyyyyyyy', 'yyyyyyyyyy', 'yyyyyyyyyy', 'ssssssssss', 'yyyyyyyyyy', 'yyyyyyyyyy', 'ssssssssss', 'yyyyyyyyyy', 'yyyyyyyyyy', 'YYYYYYYYYY']), { y: '#f2bc4e', s: '#c8564a', Y: '#c88a30' }, 0, 0)) }
];
const ropeZ = x => LINE.z - LINE.sag * Math.sin(Math.PI * clamp((x - LINE.x0) / (LINE.x1 - LINE.x0), 0, 1));
const FALL_K = [['#7a4a82', '#0a2030'], ['#a8749a', '#123646'], ['#d4a2ae', '#1a4e5e'], ['#f2cec0', '#2c7480'], ['#fff6e8', '#86d6d0']].map(([a, b]) => CK([[0, a], [0.35, mixHex(a, b, 0.25)], [0.7, b], [1, b]]));
const MIST_K = [['#f8dcd0', '#3e6e7c'], ['#d8a6ac', '#1c3650']].map(([a, b]) => CK([[0, a], [0.7, b], [1, b]]));
const SMOKE_K = [['#ecc8c8', '#6a7096'], ['#bc94aa', '#4a5078'], ['#8a6890', '#343a60']].map(([a, b]) => CK([[0, a], [0.35, mixHex(a, b, 0.4)], [0.8, b], [1, b]]));
const FISH_K = [['#e8743a', '#a8603a'], ['#ffa448', '#c88a4a'], ['#ffd27a', '#f0c070']].map(([a, b]) => CK([[0, a], [0.7, b], [1, b]]));
const RIP_K = CK([[0, '#ffe4b0'], [0.7, '#c8fff0'], [1, '#c8fff0']]), SPLASH_K = CK([[0, '#fff6e8'], [0.7, '#d8fff4'], [1, '#d8fff4']]);
const GLOW = [P.glow0, P.glow1, P.glow2, P.glow3, P.glow4], HALO = CE('#ffd27a');
const FX_P = { roots: [], shimmer: null, glints: null, fall: null };
const CAMP_SPR = outl(smap(pad(['..kkk..', '.k...k.', '..kkk..', '.kgggk.', '.kgggk.', '.kgggk.', '.kgggk.', 'kkkkkkk']), { k: '#3a2a30', g: '#b8a890' }, 4, 9));
const LANTERN_SPR = outl(smap(pad(['..k..', '.kkk.', '.kgk.', '.kgk.', '.kgk.', '.kkk.']), { k: '#2e2228', g: '#a89878' }, 3, 0));
const FISH_SW = [{ cx: POND.x, cy: POND.y, rx: 9.5, ry: 4.6, P: 15, off: 0, dir: 1 }, { cx: POND.x + 2, cy: POND.y + 1, rx: 6.5, ry: 3.4, P: 20, off: 0.3, dir: -1 }, { cx: POND.x - 2, cy: POND.y - 1, rx: 8, ry: 3, P: 30, off: 0.6, dir: 1 }];
const SWIPES = [7.3, 22.3, 247.3, 262.3, 292.3];
const JUMPS = [{ t: 52, dur: 0.9, x0: 26, x1: 24 }, { t: 160, dur: 0.9, x0: 33, x1: 36 }, { t: 280, dur: 0.9, x0: 22, x1: 26 }];
const RIPPLE_AT = { x: 19, y: 21 };
const RIPPLES = [...SWIPES.map(s => ({ t: s + 0.15, x: RIPPLE_AT.x, y: RIPPLE_AT.y })), ...JUMPS.flatMap(J => [{ t: J.t, x: J.x0, y: POND.y }, { t: J.t + J.dur, x: J.x1, y: POND.y }])];
const inWater = (i, j) => i >= 0 && j >= 0 && i < IW && j < IH && (S.flag[j * IW + i] & F_WATER);
function waterPx(i, j, c) { if (!inWater(i, j)) return; const p = j * IW + i; if (FR.dep[p] <= S.dep[p] + 0.01) FR.idx[p] = c; }

function initProps() {
  /* roots hang from under the grass lip along the visible rim */
  const r = mulberry32(91);
  for (let a = 0.25; a < 3.05; a += 0.17 + r() * 0.1) {
    const rr = rimR(a) - 1.5, x = uvToX(rr * Math.cos(a), rr * Math.sin(a)), y = uvToY(rr * Math.cos(a), rr * Math.sin(a));
    FX_P.roots.push({ x, y, z: -8, len: 6 + Math.floor(r() * 14), off: r(), P: r() > 0.5 ? 5 : 6, amp: 1 + r(), leafy: r() > 0.4, c: Math.floor(r() * 5) });
  }
  /* a sparse set of canopy pixels catches the wind */
  const sp = [], sb = [], sa = [], sw = [], so = [];
  for (let p = 0; p < NPIX; p++) if (S.obj[p] >= TREE_OBJ[0] && S.obj[p] <= TREE_OBJ[1] && !SKYM[p] && hash2(p, 71) > 0.93) {
    const k = R.leaves.indexOf(S.idx[p]); if (k < 0) continue;
    sp.push(p); sb.push(S.idx[p]); sa.push(R.leaves[clamp(k + (hash2(p, 72) > 0.4 ? 1 : -1), 0, 7)]); sw.push([2, 2.5, 3, 5][Math.floor(hash2(p, 73) * 4)]); so.push(hash2(p, 74));
  }
  FX_P.shimmer = { p: Int32Array.from(sp), a: Uint16Array.from(sa), P: sw, o: so };
  /* sunset glints on the pond */
  const gl = [], go = [];
  for (let p = 0; p < NPIX; p++) if ((S.flag[p] & F_WATER) && inPond(S.wx[p], S.wy[p], -1) && hash2(p, 81) > 0.9) { gl.push(p); go.push(S.wx[p] * 0.1 + hash2(p, 82) * 0.5); }
  FX_P.glints = { p: Int32Array.from(gl), o: Float32Array.from(go) };
  /* the waterfall starts where the channel meets the rim */
  let fx = CHANNEL.x0, fy = (CHANNEL.y0 + CHANNEL.y1) / 2; while (rimDist(fx, fy) > 0) fx += 0.25;
  FX_P.fall = { x: fx + 0.5, y: fy, sx: Math.round(isx(fx, fy)), sy: Math.round(isy(fx, fy, 0)) };
}

function drawRoots(t) {
  if (!FX.roots) return;
  for (const q of FX_P.roots) {
    const sx = Math.round(isx(q.x, q.y)), sy = Math.round(isy(q.x, q.y, q.z)), d = DEP(q.x, q.y, q.z) + 8, lw = lerp(170, AMB_W, 0.5), lc = AMB_C * 0.6;
    for (let k = 1; k <= q.len; k++) {
      const sway = Math.round(q.amp * Math.pow(k / q.len, 1.5) * wave(t, q.P, q.off)), x = sx + sway, y = sy + k;
      dput(x, y, ROOT_C[k >= q.len - 1 ? 1 : 0], d, lw, lc);
      if (q.leafy && k % 4 === 1) dput(x + (k % 3 ? -1 : 1), y, LEAF_C[(k + q.c) % 5], d, lw, lc);
    }
  }
}
function drawCanopy(t) {
  if (!FX.canopy) return;
  const { p, a, P: Pr, o } = FX_P.shimmer, gust = 0.5 + 0.5 * wave(t, 10, 0.3), th = 0.92 - 0.42 * gust;
  for (let k = 0; k < p.length; k++) if (wave(t, Pr[k], o[k]) > th) FR.idx[p[k]] = a[k];
}
function drawClothesline(t) {
  if (!FX.laundry) { return; }
  const yL = LINE.y;
  for (let x = LINE.x0; x <= LINE.x1; x += 0.25) { const z = ropeZ(x); wpx(x, yL, z, ROPE, lightAt(x, yL, z, t), 0.2); }
  const gust = 0.8 + 0.6 * wave(t, 10, 0.3);
  for (const G of LAUNDRY) {
    const sway = gust * wave(t, 4, G.off) * 2.4, s = G.s, zT = ropeZ(G.x + s.w / 4) + 0.5, lw = lightAt(G.x, yL, zT - 6, t);
    decalYD(s, G.x, yL + 0.1, zT, lw, r => Math.round(sway * r / s.h));
    wpx(G.x + 0.8, yL + 0.2, zT - 0.6, PIN, lw, 1); wpx(G.x + s.w / 2 - 0.8, yL + 0.2, zT - 0.6, PIN, lw, 1);
  }
}
function drawLanterns(t) {
  if (!FX.lamps) return;
  const N = CUR_N, Lp = LANTERN_POS, sx = Math.round(isx(Lp.x, Lp.y)), sy = Math.round(isy(Lp.x, Lp.y, Lp.z)), d = DEP(Lp.x, Lp.y, Lp.z) + 6;
  const lw = lightAt(Lp.x, Lp.y, Lp.z, t), s = LANTERN_SPR;
  for (let r = 0; r < s.h; r++) for (let c = 0; c < s.w; c++) { const v = s.d[r * s.w + c]; if (v) dput(sx + c - s.ax, sy + r, v, d, lw); }
  const f = 0.7 + 0.12 * wave(t, 0.5) + 0.08 * wave(t, 0.3, 0.2) + 0.06 * wave(t, 1.5, 0.7), R_ = (4 + 3 * N) * 1.6, fc = sy + 4;
  dput(sx, fc, GLOW[clamp(Math.floor((f + 0.2) * 5), 0, 4)], d + 1); dput(sx, fc + 1, GLOW[clamp(Math.floor(f * 5), 0, 4)], d + 1); dput(sx, fc + 2, GLOW[1], d + 1);
  for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) { const q = Math.hypot(dx, dy); if (q < 2.2 || q > R_) continue; if ((0.32 + 0.2 * N) * f * (1 - q / R_) * 16 > bay(sx + dx, fc + dy)) dput(sx + dx, fc + dy, HALO, d + 1); }
  /* the boy's camping lantern lights up at dusk */
  const cx = CAMP.x, cy = CAMP.y;
  stampD(CAMP_SPR, cx, cy, 0, 0, lightAt(cx, cy, 2, t), false, 0, AMB_C);
  const on = smooth01(0.2, 0.55, N); if (on <= 0) return;
  const csx = Math.round(isx(cx, cy)), csy = Math.round(isy(cx, cy, 0)) - 4, g = 0.75 + 0.12 * wave(t, 0.6, 0.3) + 0.08 * wave(t, 0.4, 0.6), dc = DEP(cx, cy, 0) + 30;
  if (on * 2 * 16 > bay(0, 1)) for (let k = -1; k <= 1; k++) { dput(csx, csy + k, GLOW[clamp(Math.floor((g + 0.2 - k * 0.1) * 5), 0, 4)], dc); dput(csx - 1, csy + k, GLOW[3], dc); dput(csx + 1, csy + k, GLOW[2], dc); }
  const Rc = 3 + 7 * on; for (let dy = -11; dy <= 11; dy++) for (let dx = -11; dx <= 11; dx++) { const q = Math.hypot(dx, dy); if (q < 2.5 || q > Rc) continue; if (0.4 * on * g * (1 - q / Rc) * 16 > bay(csx + dx, csy + dy)) dput(csx + dx, csy + dy, HALO, dc); }
}
function drawSmoke(t) {
  if (!FX.smoke) return;
  const hx = Math.round(isx(17, -26)), hy = Math.round(isy(17, -26, HS.ridge + 16));
  for (let i = 0; i < 12; i++) {
    const p = phase(t, 6, i / 12), y = hy - 1 - p * 56, x = hx + p * 30 + 2.5 * Math.sin(p * 6 + i), r = (1.2 + p * 7) * Math.min(1, (1 - p) / 0.35);
    if (r < 0.8) continue;
    const cx = Math.round(x), cy = Math.round(y), ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) {
      if (dx * dx + dy * dy > r * r + 0.5) continue;
      const n = -(dx * 0.7 + dy * 0.7) / Math.max(r, 1);
      dput(cx + dx, cy + dy, n > 0.2 ? SMOKE_K[0] : p > 0.45 && n < -0.45 ? SMOKE_K[2] : SMOKE_K[1], 800 + i);
    }
  }
}
function drawPond(t) {
  if (!FX.water) return;
  const G = FX_P.glints; for (let k = 0; k < G.p.length; k++) if (wave(t, 3, G.o[k]) > 0.7) FR.idx[G.p[k]] = WATER[7];
  const JUMP = JUMPS.find(J => since(t, J.t) < J.dur);
  if (FX.fish) FISH_SW.forEach((f, n) => {
    if (JUMP && n === 0) return;
    const th = TAU * phase(t, f.P, f.off) * f.dir, x = f.cx + f.rx * Math.cos(th), y = f.cy + f.ry * Math.sin(th), i = Math.round(isx(x, y)), j = Math.round(isy(x, y, 0));
    const sdx = -Math.sin(th) * f.rx * f.dir * 2 + Math.cos(th) * f.ry * f.dir * -2, face = sdx >= 0 ? 1 : -1;
    waterPx(i, j, FISH_K[2]); waterPx(i - face, j, FISH_K[1]); waterPx(i - 2 * face, j, FISH_K[1]); waterPx(i - 3 * face, j, FISH_K[0]);
    waterPx(i - 4 * face, j + (phase(t, 0.5, f.off) < 0.5 ? -1 : 0), FISH_K[0]); waterPx(i, j + 1, FISH_K[1]); waterPx(i - 1 * face, j + 1, FISH_K[0]);
  });
  /* a maple leaf drifts round the pond */
  const lth = TAU * phase(t, 60, 0.2), lx = Math.round(isx(POND.x + 8 * Math.cos(lth), POND.y + 4 * Math.sin(lth))), ly = Math.round(isy(POND.x + 8 * Math.cos(lth), POND.y + 4 * Math.sin(lth), 0));
  waterPx(lx, ly, LEAF_C[0]); waterPx(lx + 1, ly, LEAF_C[1]); waterPx(lx + 1, ly + 1, LEAF_C[0]);
  for (const q of RIPPLES) {
    const dt = since(t, q.t); if (dt > 1.4) continue;
    const rx = 2 + dt * 11, ry = Math.max(1, rx * 0.46), a = 1 - dt / 1.4, ci = isx(q.x, q.y), cj = isy(q.x, q.y, 0);
    for (let k = 0; k < 52; k++) { const ang = k / 52 * TAU, x = Math.round(ci + rx * Math.cos(ang)), y = Math.round(cj + ry * Math.sin(ang)); if (a * 16 > bay(x, y)) waterPx(x, y, RIP_K); }
  }
  if (JUMP) {
    const u = since(t, JUMP.t) / JUMP.dur, wx = lerp(JUMP.x0, JUMP.x1, u), i = Math.round(isx(wx, POND.y)), j = Math.round(isy(wx, POND.y, 0) - 1 - 13 * Math.sin(Math.PI * u)), d = 500;
    const put_ = (x, y, c) => { dput(i + x, j + y, c, d, AMB_W, AMB_C); };
    const dots = u < 0.35 ? [[0, 0, 2], [0, 1, 1], [0, 2, 1], [1, 3, 0], [1, 4, 0]] : u < 0.65 ? [[-2, 0, 2], [-1, 0, 2], [0, 0, 1], [1, 0, 1], [2, -1, 0], [3, -1, 0], [-1, 1, 1], [0, 1, 1]] : [[0, 3, 2], [0, 2, 1], [0, 1, 1], [1, 0, 0], [1, -1, 0]];
    for (const [x, y, c] of dots) { for (const [a, b] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) put_(x + a, y + b, P.ink); }
    for (const [x, y, c] of dots) dput(i + x, j + y, FISH_K[c], d + 1, AMB_W, AMB_C);
    if (u > 0.9) { dput(i - 3, j + 11, SPLASH_K, d + 1); dput(i + 3, j + 11, SPLASH_K, d + 1); dput(i, j + 9, SPLASH_K, d + 1); }
  }
  /* the overflow channel shimmers on its way to the rim */
  const F = FX_P.fall;
  for (let k = 0; k < 11; k++) { const x = F.x - k * 1.0, u = phase(t, 1, -k * 0.09), i = Math.round(isx(x, F.y + Math.sin(k) * 1.2)), j = Math.round(isy(x, F.y + Math.sin(k) * 1.2, 0)); if (u < 0.45) { waterPx(i, j, WATER[6]); waterPx(i + 1, j, WATER[5]); } }
}
function drawWaterfall(t) {
  if (!FX.waterfall) return;
  const F = FX_P.fall, top = F.sy + 1, bottom = 336, sc = phase(t, 0.75), d0 = DEP(F.x, F.y, 0) + 6;
  for (let y = top; y < bottom; y++) {
    const fall = y - top, w = 7 + Math.floor(fall / 34), x0 = F.sx - (w >> 1), fade = y > 304 ? 1 - (y - 304) / 32 : 1, k = mod(Math.floor(y / 3 - 15 * sc), 15);
    for (let i = 0; i < w; i++) {
      let v = 0.55 + (hash2(i * 1013 + k * 7 + 3, w) - 0.5) * 0.7; if (i === 0) v += 0.3; else if (i === w - 1) v -= 0.3;
      v += (bay(i, y) / 16 - 0.5) * 0.3;
      if (fade < 1 && fade * 16 <= bay(i, y)) continue;
      dput(x0 + i, y, FALL_K[clamp(Math.floor(v * 5), 0, 4)], d0);
    }
  }
  for (let i = 0; i < 9; i++) if (wave(t, 0.5, i * 0.17) > 0.2) dput(F.sx - 4 + i, top - 1 + (i & 1), SPLASH_K, d0 + 1);
}
function drawMist(t) {
  if (!FX.mist) return;
  const F = FX_P.fall, cy0 = 311;
  for (let i = 0; i < 6; i++) {
    const r = 4 + 2 * wave(t, 2.5, i * 0.2) + (i % 2) * 1.6, cx = F.sx + (i - 2.5) * 6, cy = cy0 - (i % 2) * 3 - (i === 2 ? 3 : 0);
    for (let dy = -8; dy <= 8; dy++) for (let dx = -9; dx <= 9; dx++) if (dx * dx + dy * dy <= r * r) { const q = Math.round(cy + dy) * IW + Math.round(cx + dx); if (q >= 0 && q < NPIX) FR.idx[q] = dy < -r * 0.3 ? MIST_K[0] : MIST_K[1]; }
  }
}

/* ---- leaves, motes, fireflies ---- */
const TREE_LEAVES = (() => {
  const r = mulberry32(77), out = [];
  for (let i = 0; i < 16; i++) {
    const offEdge = i < 3;
    out.push({ offEdge, P: offEdge ? 15 : [5, 6, 7.5, 10][i % 4], off: r(), x: TREE.x + (r() - 0.5) * 34, y: TREE.y + (r() - 0.5) * 22, z: 30 + r() * 26,
      vx: offEdge ? -(3 + r()) : 1 + r() * 2.5, vy: offEdge ? 4.5 + r() : 0.8 + r() * 2.4, vz: 8 + r() * 5, sway: 1 + r() * 1.6, sf: 1.4 + r() * 1.6, c: Math.floor(r() * 5), s0: r() * 0.4 });
  }
  return out;
})();
function drawTreeLeaves(t) {
  if (!FX.leaves) return;
  for (const L of TREE_LEAVES) {
    const p = phase(t, L.P, L.off), s = p * L.P;
    let z = L.z - L.vz * s - (L.offEdge ? 0.3 * s * s : 0), landed = false, sl = s;
    if (!L.offEdge && z <= 0.2) { sl = L.z / L.vz; z = 0.2; landed = true; if (p > 0.93) continue; }
    const x = L.x + L.vx * sl + L.sway * Math.sin(sl * L.sf), y = L.y + L.vy * sl;
    const i = Math.floor(isx(x, y)), j = Math.floor(isy(x, y, z)), d = DEP(x, y, z) + 2, c = LEAF_C[L.c], lw = AMB_W + 8, f = landed ? 1 : Math.sin(s * L.sf * 2.3);
    dput(i, j, c, d, lw); if (f > 0.35) dput(i + 1, j, c, d, lw); else if (f < -0.35) dput(i, j + 1, c, d, lw);
  }
}
const WIND_LEAVES = [{ P: 50, off: 0.05, y: 47, amp: 15, c: 1 }, { P: 25, off: 0.55, y: 257, amp: 20, c: 2 }, { P: 20, off: 0.3, y: 143, amp: 12, c: 0 }, { P: 60, off: 0.8, y: 20, amp: 16, c: 3 }, { P: 30, off: 0.8, y: 327, amp: 13, c: 4 }];
function drawWindLeaves(t) {
  if (!FX.leaves) return;
  WIND_LEAVES.forEach((L, i) => {
    const p = phase(t, L.P, L.off), act = 0.62; if (p > act) return;
    const q = p / act, s = p * L.P, x = Math.round(lerp(-12, IW + 12, q)), y = Math.round(L.y + L.amp * Math.sin(q * TAU * 1.5 + i) + 23 * q), f = Math.sin(s * 5), c = LEAF_C[L.c];
    dput(x, y, c, 2e6); if (f > 0.35) dput(x + 1, y, c, 2e6); else if (f < -0.35) dput(x, y + 1, c, 2e6);
  });
}
const MOTE_C = CE('#ffe8b0');
const MOTES = (() => { const r = mulberry32(303), out = []; for (let i = 0; i < 26; i++) out.push({ x: 100 + r() * 460, y: 50 + r() * 170, off: r(), off2: r(), tw: [2, 3, 5][i % 3] }); return out; })();
function drawMotes(t) {
  if (!FX.motes) return;
  for (const m of MOTES) { if (wave(t, m.tw, m.off2) < 0.35 || m.off > 1 - CUR_N) continue; dput(Math.round(m.x + 10 * wave(t, 10, m.off)), Math.round(m.y + 7 * wave(t, 7.5, m.off2)), MOTE_C, 2e6); }
}
const FF_CORE = CE('#fff6b0'), FF_GLOW = CE('#f2b448'), FF_DIM = CE('#d89a40');
const FIREFLIES = (() => {
  const r = mulberry32(808), out = [];
  while (out.length < 21) { const x = -44 + r() * 100, y = -20 + r() * 64, z = 3 + r() * 13; if (rimDist(x, y) < 6 || (x > HS.x0 - 2 && x < HS.x1 + 2 && y < HS.y1 + 2 && y > HS.y0 - 2) || inPond(x, y)) continue; out.push({ x, y, z, th: out.length < 9 ? 0 : 0.35 + r() * 0.4, a: r(), b: r(), c: r(), P: [2, 2.5, 3][out.length % 3] }); }
  return out;
})();
function drawFireflies(t) {
  if (!FX.fireflies) return;
  for (const f of FIREFLIES) {
    if (f.th && CUR_N < f.th) continue;
    const g = wave(t, f.P, f.b); if (g < -0.25) continue;
    const x = f.x + 3 * wave(t, 10, f.a) + wave(t, 3, f.b), y = f.y + 2.4 * wave(t, 7.5, f.c), z = f.z + 2 * wave(t, 5, f.a), i = Math.round(isx(x, y)), j = Math.round(isy(x, y, z)), d = DEP(x, y, z) + 2;
    if (g > 0.7) { dput(i - 1, j, FF_GLOW, d); dput(i + 1, j, FF_GLOW, d); dput(i, j - 1, FF_GLOW, d); dput(i, j + 1, FF_GLOW, d); }
    dput(i, j, g > 0.3 ? FF_CORE : FF_DIM, d);
  }
}

function drawProps(t) { drawRoots(t); drawCanopy(t); drawPond(t); drawWaterfall(t); drawLanterns(t); drawClothesline(t); }
function drawFrontProps(t) { drawSmoke(t); drawTreeLeaves(t); drawFireflies(t); }
function drawOverlay(t) { drawMist(t); drawWindLeaves(t); drawMotes(t); if (FX.emotes) drawEmotes(t); }
