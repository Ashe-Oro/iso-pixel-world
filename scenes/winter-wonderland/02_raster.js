/* =====================================================================
   Software iso rasterizer (2:1), shared with the other scenes. World: x -> screen (+2,+1), y -> (-2,+1),
   z -> (0,-1). Depth toward camera = x + y + 2z. Static scene is built
   once into indexed buffers (+ per-pixel world position for lighting).
   ===================================================================== */
let OX = 322, OY = 222;
const isx = (x, y) => OX + 2 * (x - y);
const isy = (x, y, z) => OY + x + y - z;
const DEP = (x, y, z) => x + y + 2 * z;

/* pixel flags */
const F_SKY = 1, F_SNOW = 2, F_ICE = 32, F_NOOUT = 64;

const S = {
  idx: new Uint16Array(NPIX), dep: new Float32Array(NPIX).fill(-1e9), flag: new Uint8Array(NPIX),
  obj: new Uint16Array(NPIX), nrm: new Uint8Array(NPIX),
  wx: new Float32Array(NPIX), wy: new Float32Array(NPIX), wz: new Float32Array(NPIX)
};
let OBJ = 1, FLAG = 0;
const objNew = () => ++OBJ;
const FOOT = [];      // footprints for ground contact-shadow AO: [x0,y0,x1,y1,z,strength]
function foot(x0, y0, x1, y1, z = 0, s = 1) { FOOT.push([x0, y0, x1, y1, z, s]); }

function put(p, c, d, x, y, z, n) {
  if (d < S.dep[p] - 0.0005) return;
  S.idx[p] = c; S.dep[p] = d; S.obj[p] = OBJ; S.flag[p] = FLAG; S.nrm[p] = n;
  S.wx[p] = x; S.wy[p] = y; S.wz[p] = z;
}

/* --- flat face rasterizer. t: 'T' top (z=z0), 'Y' plane y=y0 (+y facing), 'X' plane x=x0 (+x facing)
   shader(u,v,x,y,z) -> palette index (0 = skip). u,v are local world units. --- */
function face(t, x0, y0, z0, U, V, sh) {
  let c;
  if (t === 'T') c = [[x0, y0, z0], [x0 + U, y0, z0], [x0 + U, y0 + V, z0], [x0, y0 + V, z0]];
  else if (t === 'Y') c = [[x0, y0, z0], [x0 + U, y0, z0], [x0 + U, y0, z0 + V], [x0, y0, z0 + V]];
  else c = [[x0, y0, z0], [x0, y0 + U, z0], [x0, y0 + U, z0 + V], [x0, y0, z0 + V]];
  let i0 = 1e9, i1 = -1e9, j0 = 1e9, j1 = -1e9;
  for (const q of c) { const a = isx(q[0], q[1]), b = isy(q[0], q[1], q[2]); i0 = Math.min(i0, a); i1 = Math.max(i1, a); j0 = Math.min(j0, b); j1 = Math.max(j1, b); }
  i0 = Math.max(0, Math.floor(i0) - 1); i1 = Math.min(IW - 1, Math.ceil(i1)); j0 = Math.max(0, Math.floor(j0) - 1); j1 = Math.min(IH - 1, Math.ceil(j1));
  const fixed = typeof sh === 'number', n = t === 'T' ? 0 : t === 'Y' ? 1 : 2;
  for (let j = j0; j <= j1; j++) {
    const bb = j + 0.5 - OY;
    for (let i = i0; i <= i1; i++) {
      const a = (i + 0.5 - OX) / 2;
      let x, y, z, u, v;
      if (t === 'T') { const b = bb + z0; x = (a + b) / 2; y = (b - a) / 2; z = z0; u = x - x0; v = y - y0; }
      else if (t === 'Y') { y = y0; x = a + y0; z = x + y0 - bb; u = x - x0; v = z - z0; }
      else { x = x0; y = x0 - a; z = x0 + y - bb; u = y - y0; v = z - z0; }
      if (u < 0 || u >= U || v < 0 || v >= V) continue;
      const col = fixed ? sh : sh(u, v, x, y, z);
      if (!col) continue;
      put(j * IW + i, col, x + y + 2 * z, x, y, z, n);
    }
  }
}
/* axis-aligned box: m = {t,y,x} shader or colour each (falsy = skip face) */
function box(x0, y0, z0, x1, y1, z1, m) {
  if (typeof m === 'number') m = { t: lt(m), y: m, x: dk(m) };
  if (m.t) face('T', x0, y0, z1, x1 - x0, y1 - y0, m.t);
  if (m.y) face('Y', x0, y1, z0, x1 - x0, z1 - z0, m.y);
  if (m.x) face('X', x1, y0, z0, y1 - y0, z1 - z0, m.x);
}
/* plane rising along y: z = zA + s*(y - yA), for x in [x0,x1), y in [yA,yB) (visible if s<2) */
function slopeY(x0, x1, yA, yB, zA, s, sh) {
  const pts = [[x0, yA], [x1, yA], [x1, yB], [x0, yB]];
  let i0 = 1e9, i1 = -1e9, j0 = 1e9, j1 = -1e9;
  for (const q of pts) { const z = zA + s * (q[1] - yA), a = isx(q[0], q[1]), b = isy(q[0], q[1], z); i0 = Math.min(i0, a); i1 = Math.max(i1, a); j0 = Math.min(j0, b); j1 = Math.max(j1, b); }
  i0 = Math.max(0, Math.floor(i0) - 1); i1 = Math.min(IW - 1, Math.ceil(i1)); j0 = Math.max(0, Math.floor(j0) - 1); j1 = Math.min(IH - 1, Math.ceil(j1));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const a = (i + 0.5 - OX) / 2, b = j + 0.5 - OY, xb = (a + b) / 2, yb = (b - a) / 2;
    const t = (zA + s * (yb - yA)) / (2 - s); const x = xb + t, y = yb + t, z = 2 * t;
    if (x < x0 || x >= x1 || y < yA || y >= yB) continue;
    const col = typeof sh === 'number' ? sh : sh(x - x0, y - yA, x, y, z); if (!col) continue;
    put(j * IW + i, col, x + y + 2 * z, x, y, z, 0);
  }
}
/* vertical cylinder (ray-cast). side(ang,v,x,y,z) top(r01,ang,x,y) */
function cyl(cx, cy, z0, r, h, side, top, ry) {
  ry = ry || r;
  const i0 = Math.max(0, Math.floor(isx(cx - r, cy + ry)) - 2), i1 = Math.min(IW - 1, Math.ceil(isx(cx + r, cy - ry)) + 2);
  const j0 = Math.max(0, Math.floor(isy(cx - r, cy - ry, z0 + h)) - 2), j1 = Math.min(IH - 1, Math.ceil(isy(cx + r, cy + ry, z0)) + 2);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const a = (i + 0.5 - OX) / 2, b = j + 0.5 - OY, xb = (a + b) / 2, yb = (b - a) / 2;
    const zt = z0 + h, tt = zt / 2, dxT = (xb + tt - cx) / r, dyT = (yb + tt - cy) / ry;
    if (top && dxT * dxT + dyT * dyT <= 1) {
      const col = typeof top === 'number' ? top : top(Math.sqrt(dxT * dxT + dyT * dyT), Math.atan2(dyT, dxT), xb + tt, yb + tt);
      if (col) { put(j * IW + i, col, xb + yb + 2 * tt + 2 * zt, xb + tt, yb + tt, zt, 0); continue; }
    }
    // side: ((xb+t-cx)/r)^2 + ((yb+t-cy)/ry)^2 = 1
    const dx = xb - cx, dy = yb - cy, A = 1 / (r * r) + 1 / (ry * ry), B = 2 * (dx / (r * r) + dy / (ry * ry)), Cc = dx * dx / (r * r) + dy * dy / (ry * ry) - 1;
    const disc = B * B - 4 * A * Cc; if (disc < 0) continue;
    const t = (-B + Math.sqrt(disc)) / (2 * A), z = 2 * t;
    if (z < z0 || z >= zt) continue;
    const x = xb + t, y = yb + t, ang = Math.atan2((y - cy) / ry, (x - cx) / r);
    const col = typeof side === 'number' ? side : side(ang, z - z0, x, y, z); if (!col) continue;
    put(j * IW + i, col, x + y + 2 * z, x, y, z, 3);
  }
}
/* height field: for every screen pixel, march the view ray (xb + t, yb + t, 2t) down from zMax to the
   first point under the ground, then bisect. H(x, y) -> z >= 0, or < 0 off the island. sh(x, y, z) -> colour. */
function hfield(H, zMax, sh) {
  for (let j = 0; j < IH; j++) {
    const b = j + 0.5 - OY;
    for (let i = 0; i < IW; i++) {
      const a = (i + 0.5 - OX) / 2, xb = (a + b) / 2, yb = (b - a) / 2;
      let hit = -1;
      for (let t = zMax / 2; t >= 0; t -= 0.5) if (2 * t <= H(xb + t, yb + t)) { hit = t; break; }
      if (hit < 0) continue;
      let lo = hit, hi = hit + 0.5;
      for (let k = 0; k < 5; k++) { const m = (lo + hi) / 2; if (2 * m <= H(xb + m, yb + m)) lo = m; else hi = m; }
      const x = xb + lo, y = yb + lo, z = 2 * lo, c = sh(x, y, z);
      if (c) put(j * IW + i, c, x + y + 2 * z, x, y, z, 0);
    }
  }
}
/* stamp a sprite as an upright billboard in world space (static scene) */
function stampS(spr, wx, wy, wz, slope = 0, flags) {
  const sx0 = Math.round(isx(wx, wy)) - spr.ax, sy0 = Math.round(isy(wx, wy, wz)) - spr.ay, d0 = DEP(wx, wy, wz);
  const oldF = FLAG; if (flags !== undefined) FLAG = flags;
  for (let r = 0; r < spr.h; r++) { const j = sy0 + r; if (j < 0 || j >= IH) continue;
    for (let c = 0; c < spr.w; c++) { const col = spr.d[r * spr.w + c]; if (!col) continue; const i = sx0 + c; if (i < 0 || i >= IW) continue;
      const h = spr.ay - r, dx = c - spr.ax;
      put(j * IW + i, col, d0 + 2 * h + slope * dx, wx + dx / 4, wy - dx / 4, wz + h, 3);
    } }
  FLAG = oldF;
}
/* wall decal helpers: build shader stacks. Decal = {u0,v0,w,h,fn(col,row)} in face-pixel units
   (1 column = 0.5 world units horizontally on Y/X faces, 1 row = 1 z unit). */
function layered(base, decals) {
  return (u, v, x, y, z) => {
    const col = Math.floor(u * 2), row = Math.floor(v);
    for (let k = decals.length - 1; k >= 0; k--) {
      const d = decals[k], cc = col - d.c0, rr = d.r1 - row;          // rr: rows from top of decal
      if (cc >= 0 && cc < d.w && rr >= 0 && rr < d.h) { const c = d.fn(cc, rr, u, v); if (c) return c; }
    }
    return typeof base === 'number' ? base : base(u, v, x, y, z);
  };
}
/* decal from a sprite: placed with its left column at wall-u (world) u0 and its top row at height vTop */
const decal = (spr, u0, vTop) => ({ c0: Math.round(u0 * 2), r1: Math.round(vTop) - 1, w: spr.w, h: spr.h, fn: (c, r) => spr.d[r * spr.w + c] });

/* silhouette outline pass: darken pixels whose neighbour lies well behind them */
function outlinePass() {
  const d = S.dep, o = new Uint16Array(S.idx);
  for (let j = 1; j < IH - 1; j++) for (let i = 1; i < IW - 1; i++) {
    const p = j * IW + i; if (S.flag[p] & (F_SKY | F_NOOUT)) continue; const dp = d[p]; if (dp < -1e8) continue;
    const ob = S.obj[p];
    const q1 = p - IW, q2 = p - 1, q3 = p + 1, q4 = p + IW;
    let hit = 0;
    if (S.obj[q1] !== ob && d[q1] < dp - 3.5) hit = 1;
    else if (S.obj[q2] !== ob && d[q2] < dp - 3.5) hit = 1;
    else if (S.obj[q3] !== ob && d[q3] < dp - 3.5) hit = 1;
    else if (S.obj[q4] !== ob && d[q4] < dp - 6) hit = 1;
    if (hit) o[p] = dk(S.idx[p], 2);
  }
  S.idx.set(o);
}

/* screen-aligned ground coordinates: u along the screen, v toward the camera */
const uvToX = (u, v) => (u + v) / Math.SQRT2, uvToY = (u, v) => (v - u) / Math.SQRT2;
const xyToU = (x, y) => (x - y) / Math.SQRT2, xyToV = (x, y) => (x + y) / Math.SQRT2;
