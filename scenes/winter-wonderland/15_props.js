/* =====================================================================
   Animated props and particles, all pure functions of t: lamps, string
   lights, fairy lights, icicles, chimney smoke, snowfall, sparkle and the
   plume blowing off the peaks.
   ===================================================================== */
const SMOKE_K = [['#f4f0f0', '#7c88b4'], ['#c8c8dc', '#56649a'], ['#9ca0c4', '#3e4c80']].map(([a, b]) => CK([[0, a], [0.35, mixHex(a, b, 0.4)], [0.8, b], [1, b]]));
const GLOW = [P.glow0, P.glow1, P.glow2, P.glow3, P.glow4], HALO = CE('#ffd27a');
const FX_P = { sparkle: null, eave: [] };
const LANTERN_SPR = outl(smap(pad(['..k..', '.kkk.', '.kgk.', '.kgk.', '.kgk.', '.kkk.']), { k: '#2e2228', g: '#a89878' }, 3, 0));
const POST_SPR = outl(smap(pad(['..sss..', '.sssss.', 'kkkkkkk', '.kgggk.', '.kgggk.', '.kgggk.', '.kgggk.', '..kkk..']), { k: '#2e2a34', g: '#a89878', s: '#f0f4fb' }, 4, 9));
const BULB = ['#ffd27a', '#ff6a50', '#ffe9b0', '#5ee0a0', '#ffb040', '#70b8ff'].map(CE), BULB_OFF = ['#a88a50', '#a84a40', '#b0a080', '#3e8a6a', '#a87a30', '#4a7ab0'].map(C), WIRE = C('#2e2a34');
const ICE_GLINT = CE('#ffffff'), DROP_K = CE('#d8f0ff'), SPARK_K = CE('#ffffff');

function initProps() {
  /* sparkle: a sparse set of open snow pixels */
  const sp = [], sb = [];
  for (let p = 0; p < NPIX; p++) if ((S.flag[p] & F_SNOW) && hash2(p, 71) > 0.988) { sp.push(p); sb.push(hash2(p, 72)); }
  FX_P.sparkle = { p: Int32Array.from(sp), o: Float32Array.from(sb) };
  const r = mulberry32(91);
  /* icicles along the front eave */
  const zE = HS.ridge - (HS.y1 + HS.over - HS.yR) - 3;
  for (let x = HS.x0 - HS.over + 0.8; x < HS.x1 + HS.over; x += 1.2 + r() * 2.2) FX_P.eave.push({ i: Math.floor(isx(x, HS.y1 + HS.over + 0.1)), j: Math.floor(isy(x, HS.y1 + HS.over + 0.1, zE)), d: DEP(x, HS.y1 + HS.over + 0.1, zE) + 1, len: 2 + Math.floor(r() * r() * 8), off: r(), P: [6, 8, 10][Math.floor(r() * 3)] });
}
function icicle(q, t, w, c) {
  for (let k = 0; k < q.len; k++) {
    const tone = k < q.len * 0.4 ? 2 : k < q.len * 0.8 ? 1 : 0;
    dput(q.i, q.j + k, R.ice[tone], q.d, w, c);
    if (k < q.len * 0.45) dput(q.i + 1, q.j + k, R.ice[tone > 0 ? tone - 1 : 0], q.d, w, c);
  }
  if (phase(t, q.P, q.off) < 0.1) dput(q.i, q.j + Math.floor(phase(t, q.P, q.off) * 10 * q.len), ICE_GLINT, q.d + 0.1);
}
function drawIcicles(t) {
  if (!FX.icicles) return;
  const w = AMB_W * 0.8 + 40, c = AMB_C;
  for (const q of FX_P.eave) {
    icicle(q, t, w, c);
    const p = phase(t, 15, q.off * 7); if (q.len > 5 && p < 0.05) dput(q.i, q.j + q.len + Math.round((p / 0.05) ** 2 * 30), DROP_K, q.d + 12);
  }
}
function drawSparkle(t) {
  if (!FX.sparkle) return;
  const { p, o } = FX_P.sparkle, idx = FR.idx, a = 1 - CUR_N * 0.7;
  for (let k = 0; k < p.length; k++) if (o[k] < a && wave(t, 3 + (k % 3), o[k] * 3) > 0.9) idx[p[k]] = SPARK_K;
}
function drawGlow(sx, fc, d, R_, a, f) {
  for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) { const q = Math.hypot(dx, dy); if (q < 2.2 || q > R_) continue; if (a * f * (1 - q / R_) * 16 > bay(sx + dx, fc + dy)) dput(sx + dx, fc + dy, HALO, d + 1); }
}
function drawLamps(t) {
  if (!FX.lamps) return;
  const N = CUR_N, f = 0.7 + 0.12 * wave(t, 0.5) + 0.08 * wave(t, 0.3, 0.2) + 0.06 * wave(t, 1.5, 0.7);
  /* porch lantern, swinging a pixel in the gusts */
  { const Lp = LANTERN_POS, sx = Math.round(isx(Lp.x, Lp.y)), sy = Math.round(isy(Lp.x, Lp.y, Lp.z)), d = DEP(Lp.x, Lp.y, Lp.z) + 6, lw = lightAt(Lp.x, Lp.y, Lp.z, t), s = LANTERN_SPR;
    for (let r = 0; r < s.h; r++) for (let c = 0; c < s.w; c++) { const v = s.d[r * s.w + c]; if (v) dput(sx + c - s.ax, sy + r, v, d, lw); }
    const fc = sy + 4; dput(sx, fc, GLOW[clamp(Math.floor((f + 0.2) * 5), 0, 4)], d + 1); dput(sx, fc + 1, GLOW[clamp(Math.floor(f * 5), 0, 4)], d + 1); dput(sx, fc + 2, GLOW[1], d + 1);
    drawGlow(sx, fc, d, (4 + 3 * N) * 1.6, 0.24 + 0.2 * N, f); }
  /* street lamp by the snowman, lit once the sun has gone */
  { const Lp = LAMP_POST, s = POST_SPR, on = smooth01(0.12, 0.45, N), sx = Math.round(isx(Lp.x, Lp.y)), sy = Math.round(isy(Lp.x, Lp.y, Lp.z)), d = DEP(Lp.x, Lp.y, Lp.z) + 8, lw = lightAt(Lp.x, Lp.y, Lp.z - 4, t);
    stampS2(s, sx, sy, d, lw);
    if (on > 0) { for (let dy = -4; dy <= -1; dy++) for (let dx = -1; dx <= 1; dx++) dput(sx + dx, sy + dy, GLOW[clamp(Math.floor((on * (f + 0.3) - dy * 0.04) * 5), 0, 4)], d + 1); drawGlow(sx, sy - 2, d, 3 + 8 * on, 0.34 * on, f); } }
}
function drawStringLights(t) {
  if (!FX.stringlights) return;
  const y = HS.y1 + HS.over + 0.4, zE = HS.ridge - (HS.y1 + HS.over - HS.yR) - 4.4, span = 9.5, N = CUR_N, lw = AMB_W;
  for (let x = HS.x0 - 1; x <= HS.x1 + 1; x += 0.25) {
    const fr = mod(x - HS.x0 + 1, span) / span, z = zE - 3 * Math.sin(Math.PI * fr), i = Math.floor(isx(x, y)), j = Math.floor(isy(x, y, z)), d = DEP(x, y, z) + 1;
    dput(i, j, WIRE, d, lw);
  }
  for (let k = 0; k < 30; k++) {
    const x = HS.x0 - 0.2 + k * 1.75, fr = mod(x - HS.x0 + 1, span) / span, z = zE - 3 * Math.sin(Math.PI * fr) - 1, i = Math.floor(isx(x, y)), j = Math.floor(isy(x, y, z)), d = DEP(x, y, z) + 2, c = k % 6;
    const lit = clamp(0.25 + N * 1.2, 0, 1) * (wave(t, [2, 3, 5][k % 3], k * 0.137) > -0.6 ? 1 : 0.45);
    const col = lit > 0.5 ? BULB[c] : BULB_OFF[c];
    dput(i, j, col, d, 220); dput(i, j + 1, col, d, 220); if (lit > 0.8) { dput(i - 1, j, BULB[c], d - 0.5, 220); dput(i + 1, j, BULB[c], d - 0.5, 220); dput(i, j - 1, BULB[c], d - 0.5, 220); }
  }
}
function drawTreeLights(t) {
  if (!FX.treelights) return;
  const N = CUR_N, d = DEP(DECOR.x, DECOR.y, 0) + 60;
  for (const L of DECOR.lights) {
    const col = wave(t, L.P, L.off) > -0.3 - N * 0.5 ? BULB[L.c] : BULB_OFF[L.c];
    dput(L.i, L.j, col, d, 220);
  }
  /* the star on top */
  const sx = Math.round(isx(DECOR.x, DECOR.y)), sy = Math.round(isy(DECOR.x, DECOR.y, 0)) - DECOR.h - 1, g = wave(t, 3) > 0 ? P.glow4 : P.glow3;
  for (const [a, b] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) dput(sx + a, sy + b, g, d + 1);
}
function drawSmoke(t) {
  if (!FX.smoke) return;
  const hx = Math.round(isx(23, -27.5)), hy = Math.round(isy(23, -27.5, HS.ridge + 12));
  for (let i = 0; i < 12; i++) {
    const p = phase(t, 6, i / 12), y = hy - 1 - p * 62, x = hx + p * 34 + 2.5 * Math.sin(p * 6 + i), r = (1.2 + p * 7) * Math.min(1, (1 - p) / 0.35);
    if (r < 0.8) continue;
    const cx = Math.round(x), cy = Math.round(y), ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) {
      if (dx * dx + dy * dy > r * r + 0.5) continue;
      const n = -(dx * 0.7 + dy * 0.7) / Math.max(r, 1);
      dput(cx + dx, cy + dy, n > 0.2 ? SMOKE_K[0] : p > 0.45 && n < -0.45 ? SMOKE_K[2] : SMOKE_K[1], 800 + i);
    }
  }
}
/* ---- snowfall: three depths. Each flake re-rolls its column every pass; heavier in the blue hour ---- */
const FLAKE_K = [CK([[0, '#ffffff'], [1, '#d8e4fc']]), CK([[0, '#eef1f8'], [1, '#a4b8e4']]), CK([[0, '#c8d0e8'], [1, '#6e86c0']])];
const FLAKES = (() => {
  const r = mulberry32(2026), out = [];
  for (let k = 0; k < 210; k++) { const layer = k < 80 ? 2 : k < 170 ? 1 : 0; out.push({ layer, P: [10, 15, 24][layer] * (0.85 + 0.3 * r()), off: r(), sw: r() * TAU, amp: 2 + r() * 5, f: 1.5 + r() * 2.5, k }); }
  return out;
})();
const snowDens = t => 0.42 + 0.58 * night(t);
function drawSnowfall(t, layerMin, layerMax) {
  if (!FX.snowfall) return;
  for (const F of FLAKES) {
    if (F.layer < layerMin || F.layer > layerMax) continue;
    const n = cyc(F.P), v = t * n / LOOP + F.off + EPS, c = Math.floor(v), p = v - c, cm = mod(c, n);
    if (hash2(F.k + 5, cm) > snowDens((cm - F.off) * LOOP / n)) continue;
    const x0 = hash2(F.k, cm) * (IW + 80) - 20, x = Math.round(x0 - p * 46 + F.amp * Math.sin(p * TAU * F.f + F.sw)), y = Math.round(-6 + p * (IH + 12));
    if (F.layer === 2) { bg(x, y, FLAKE_K[2]); continue; }
    if (F.layer === 1) { dput(x, y, FLAKE_K[1], 2e6); continue; }
    dput(x, y, FLAKE_K[0], 2e6); dput(x + 1, y, FLAKE_K[0], 2e6); dput(x, y + 1, FLAKE_K[0], 2e6); dput(x + 1, y + 1, FLAKE_K[0], 2e6);
  }
}
/* wind lifts a plume of snow off the summits every so often */
const PLUME_K = [CK([[0, '#ffffff'], [0.4, '#ffd0c4'], [1, '#a4b4e4']]), CK([[0, '#e4e4f0'], [0.4, '#f0a8a8'], [1, '#7c8cc8']])];
const PLUMES = [{ x: 420, y: 19, P: 40, off: 0.1 }, { x: 214, y: 37, P: 30, off: 0.6 }, { x: 548, y: 47, P: 48, off: 0.35 }];
function drawSpindrift(t) {
  if (!FX.spindrift) return;
  for (const Q of PLUMES) {
    const p = phase(t, Q.P, Q.off), vis = Math.sin(Math.PI * p); if (p > 0.5) continue;
    const a = Math.sin(Math.PI * p * 2);
    for (let k = 0; k < 40; k++) {
      const u = k / 40, x = Q.x + 2 + u * 44 * (0.4 + a * 0.6) + 2 * Math.sin(u * 9 + p * 40), y = Q.y + 1 + u * 8 + 3 * u * Math.sin(u * 14 + k + p * 30);
      if ((1 - u) * a * 16 * 1.2 > bay(Math.round(x), Math.round(y)) + hash2(k, 3) * 8) { const i = Math.round(x), j = Math.round(y); if (i >= 0 && j >= 0 && i < IW && j < IH) FR.idx[j * IW + i] = PLUME_K[u < 0.5 ? 0 : 1]; }
    }
  }
}
function drawProps(t) { drawSpindrift(t); drawSnowfall(t, 2, 2); drawSparkle(t); drawLamps(t); drawStringLights(t); drawTreeLights(t); drawIcicles(t); }
function drawFrontProps(t) { drawSmoke(t); }
function drawOverlay(t) { drawSnowfall(t, 0, 1); if (FX.emotes) drawEmotes(t); }
