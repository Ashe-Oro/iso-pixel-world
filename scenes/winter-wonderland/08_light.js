/* =====================================================================
   Lighting. Each lit pixel holds a golden-hour bake and a blue-hour bake
   of warm and cool light; composeLight() blends them by the time of day.
   The low sun casts long shadows; the lamps only exist in the blue bake.
   ===================================================================== */
/* ambient values sit mid-band on the snapped ramp, so open surfaces stay flat instead of checkered */
const AMB = { dusk: { w: 196, c: 0 }, night: { w: 98, c: 84 }, snowC: 190 };
const SUNV = (() => { const v = [-0.8, 1.05, 1.15], m = Math.hypot(...v); return v.map(c => c / m); })();
const BAKE = { list: null, dw: new Uint8ClampedArray(NPIX), dc: new Uint8ClampedArray(NPIX), nw: new Uint8ClampedArray(NPIX), nc: new Uint8ClampedArray(NPIX) };
const DYN = [];
const LAMPS = [
  { id: 'lantern', x: LANTERN_POS.x + 1, y: HS.y1 + 4, z: 22, I: 1, r: 20, flick: 1 },
  { id: 'win', x: 36.5, y: HS.y1 + 7, z: 15, I: 0.95, r: 20, flick: 2 },
  { id: 'win2', x: 50, y: HS.y1 + 7, z: 15, I: 0.6, r: 15 },
  { id: 'gable', x: HS.x1 + 8, y: -22, z: 14, I: 0.8, r: 17 },
  { id: 'post', x: LAMP_POST.x, y: LAMP_POST.y, z: 30, I: 1.3, r: 30 },
  { id: 'string', x: 30, y: HS.y1 + 10, z: 26, I: 0.35, r: 34 }
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
const lampFlick = (L, t) => L.flick === 1 ? 0.82 + 0.26 * vnoise(t, 5, 41) : L.flick === 2 ? 0.86 + 0.2 * vnoise(t, 3, 42) : 1;
/* warm light at a world point, for dynamic sprites */
function lightAt(x, y, z, t) {
  let w = AMB_W; const N = CUR_N;
  if (N > 0.01) for (const L of LAMPS) w += lightContrib(L, x, y, z, 3) * N * (FX.lamps ? lampFlick(L, t) : 1);
  return Math.min(250, w);
}
const SHADOW_BOX = [], SHADOW_SPH = [];
/* does a ray from this point toward the low sun hit the hill, the cabin or a tree? */
function inSunShadow(x, y, z) {
  for (let s = 3; s < 110; s += 3) { const px_ = x + SUNV[0] * s, py = y + SUNV[1] * s, pz = z + SUNV[2] * s; if (pz > HMAX) break; if (HT(px_, py) > pz + 0.3) return true; }
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
    const snow = fl & F_SNOW, base = snow ? z - GZ(x, y) : z, face_ = n === 0 || n === 3 ? 1 : n === 1 ? 1.11 : 0.665, ao = Math.abs(base) < 0.2 ? footAO(x, y, 0) : 0;
    let dw = AMB.dusk.w * face_ * (1 - ao * 0.45), dcool = n === 2 ? 26 : 0, nw = (n === 2 ? 66 : AMB.night.w) * (1 - ao * 0.5), nc = snow ? AMB.snowC : n === 0 ? AMB.night.c : 74;
    if (n !== 2 && inSunShadow(x, y, z)) { dw = Math.round(dw * 0.7 / 32) * 32 + 3; dcool = 64; }
    let lamp = 0;
    for (const L of LAMPS) lamp += lightContrib(L, x, y, z, n);
    /* a slow wander in the light, so band edges cross the open snow as contours, not all at once */
    if (snow) { const v = (noise2(x / 19 + 4, y / 13 + 2) - 0.5) * 16; dw += v; nw += v; nc += v; }
    BAKE.dw[p] = dw; BAKE.dc[p] = dcool; BAKE.nw[p] = nw + lamp; BAKE.nc[p] = nc * clamp(1 - lamp / 62, 0.08, 1);
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
