/* =====================================================================
   Lighting. Each lit pixel holds a dusk bake and a night bake of warm and
   cool light; composeLight() blends them by the time of day. The low sun
   casts long shadows at dusk; the lamps only exist in the night bake.
   ===================================================================== */
/* ambient values sit mid-band on the snapped ramp, so open surfaces stay flat instead of checkered */
const AMB = { dusk: { w: 196, c: 0 }, night: { w: 60, c: 82 } };
const SUNV = (() => { const v = [-1, 1, 1.05], m = Math.hypot(...v); return v.map(c => c / m); })();
const BAKE = { list: null, dw: new Uint8ClampedArray(NPIX), dc: new Uint8ClampedArray(NPIX), nw: new Uint8ClampedArray(NPIX), nc: new Uint8ClampedArray(NPIX) };
const DYN = [];
const CAMP = { x: -20, y: 51, z: 0 };
const LAMPS = [
  { id: 'porch', x: LANTERN_POS.x, y: HS.y1 + 5, z: 20, I: 1.15, r: 26, flick: 1 },
  { id: 'win', x: 31, y: HS.y1 + 6, z: 16, I: 0.8, r: 20 },
  { id: 'gable', x: HS.x1 + 5, y: -21, z: 16, I: 0.7, r: 17 },
  { id: 'attic', x: HS.x1 + 3, y: HS.yR, z: 30, I: 0.35, r: 9 },
  { id: 'camp', x: CAMP.x, y: CAMP.y, z: CAMP.z + 8, I: 1.1, r: 24, flick: 2 }
];
function lightContrib(L, x, y, z, n) {
  const dx = x - L.x, dy = y - L.y, dz = (z - L.z) / 1.83, d2 = dx * dx + dy * dy + dz * dz, rr = L.r * L.r;
  if (d2 > rr * 2.6) return 0;
  const d = Math.sqrt(d2) + 1e-3;
  let lam = 0.75;
  if (n === 0) lam = 0.45 + 0.55 * Math.max(0, -dz / d);
  else if (n === 1) lam = 0.45 + 0.55 * Math.max(0, -dy / d);
  else if (n === 2) lam = 0.45 + 0.55 * Math.max(0, -dx / d);
  return L.I * 205 * lam / (1 + 3.2 * d2 / rr) * Math.max(0, 1 - d2 / (rr * 2.6));
}
const lampFlick = (L, t) => L.flick === 1 ? 0.82 + 0.26 * vnoise(t, 5, 41) : L.flick === 2 ? 0.8 + 0.3 * vnoise(t, 7, 42) : 1;
/* warm light at a world point, for dynamic sprites */
function lightAt(x, y, z, t) {
  let w = AMB_W; const N = CUR_N;
  if (N > 0.01) for (const L of LAMPS) w += lightContrib(L, x, y, z, 3) * N * (FX.lamps ? lampFlick(L, t) : 1);
  return Math.min(250, w);
}
/* does a ray from this point toward the low sun hit the house or the tree? */
function inSunShadow(x, y, z) {
  for (const [x0, y0, x1, y1, h] of SHADOW_BOX) {
    let t0 = 0.5, t1 = 200;
    const hit = (o, d, a, b) => { if (Math.abs(d) < 1e-6) return o >= a && o <= b; const p = (a - o) / d, q = (b - o) / d; t0 = Math.max(t0, Math.min(p, q)); t1 = Math.min(t1, Math.max(p, q)); return t0 <= t1; };
    if (hit(x, SUNV[0], x0, x1) && hit(y, SUNV[1], y0, y1) && hit(z, SUNV[2], 0, h)) return true;
  }
  for (const [cx, cy, cz, r] of SHADOW_SPH) {
    const ox = x - cx, oy = y - cy, oz = (z - cz) / 1.83, vz = SUNV[2] / 1.83, b = ox * SUNV[0] + oy * SUNV[1] + oz * vz, c = ox * ox + oy * oy + oz * oz - r * r;
    if (b < 0 && b * b > c) return true;
  }
  return false;
}
function footAO(x, y, z) {
  let ao = 0;
  for (const [x0, y0, x1, y1, fz, s] of FOOT) {
    if (Math.abs(z - fz) > 1) continue;
    const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1), d = Math.hypot(dx, dy);
    if (d < 3.2) ao = Math.max(ao, s * (1 - d / 3.2));
  }
  return ao;
}
function bakeLights() {
  const arr = [];
  for (let p = 0; p < NPIX; p++) {
    if (SKYM[p]) continue;
    arr.push(p);
    const x = S.wx[p], y = S.wy[p], z = S.wz[p], n = S.nrm[p], fl = S.flag[p];
    const face_ = n === 0 || n === 3 ? 1 : n === 1 ? 1.11 : 0.665, ao = z < 0.2 ? footAO(x, y, 0) : 0;
    let dw = AMB.dusk.w * face_ * (1 - ao * 0.45), nw = (n === 2 ? 40 : AMB.night.w) * (1 - ao * 0.5), nc = n === 0 ? AMB.night.c : 74;
    if (fl & F_ROCK) {                                  // the rock carries its own sun shading; moonlight falls off under the belly
      const a = Math.atan2(xyToV(x, y), xyToU(x, y));
      dw = AMB.dusk.w; nw = AMB.night.w * 0.95; nc = 100 * (0.42 + 0.26 * (0.5 + 0.5 * Math.cos(a - 2.2))) * clamp(1 + z / 200, 0.4, 1);
    }
    else if (n !== 2 && inSunShadow(x, y, z)) dw *= 0.64;
    let lamp = 0;
    for (const L of LAMPS) lamp += lightContrib(L, x, y, z, n);
    BAKE.dw[p] = dw; BAKE.dc[p] = n === 2 && !(fl & F_ROCK) ? 26 : 0; BAKE.nw[p] = nw + lamp; BAKE.nc[p] = nc * clamp(1 - lamp / 150, 0.15, 1);
  }
  BAKE.list = Int32Array.from(arr);
  /* the flickering lamps keep sparse maps of what they reach */
  for (const L of LAMPS) {
    if (!L.flick) continue;
    const I = [], V = [];
    for (let k = 0; k < arr.length; k++) { const p = arr[k], v = lightContrib(L, S.wx[p], S.wy[p], S.wz[p], S.nrm[p]); if (v > 6) { I.push(p); V.push(v); } }
    DYN.push({ L, idx: Int32Array.from(I), val: Float32Array.from(V) });
  }
}
function applyDynLights(t) {
  if (!FX.lamps || CUR_N < 0.02 || !FX.lighting) return;
  for (const D of DYN) { const s = (lampFlick(D.L, t) - 1) * CUR_N, idx = D.idx, val = D.val, W = FR.w; for (let k = 0; k < idx.length; k++) W[idx[k]] += val[k] * s; }
}
