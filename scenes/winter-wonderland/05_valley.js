/* =====================================================================
   The valley floor: snow running to every edge of the frame, with the
   sledding hill on the left, a frozen pond in the foreground and the
   ground rising to a wooded ridge at the back. u runs along the screen
   horizontal and v toward the camera (see xyToU / xyToV).
   ===================================================================== */
/* the ground ends at the wooded ridge along the back of the valley */
const vBack = u => -42 - 20 * smooth01(-16, -84, u) - 5 * smooth01(70, 130, u) + 3 * Math.sin(u * 0.07 + 1) + 1.6 * Math.sin(u * 0.19 + 0.4);
const POND = { u: -46, v: 72, ru: 28, rv: 10.5 };
const pondQ = (u, v) => { const a = Math.atan2(v - POND.v, u - POND.u), k = 1 + 0.08 * Math.sin(3 * a + 1) + 0.05 * Math.sin(7 * a + 2); return Math.hypot((u - POND.u) / POND.ru, (v - POND.v) / POND.rv) / k; };
const inPond = (x, y) => pondQ(xyToU(x, y), xyToV(x, y)) < 1;

/* ---- ground height ---- */
const HILL = { x: -54, y: 16, r: 60, h: 54 };
const HMAX = 78;
const G_R = 200, G_S = 2, G_N = G_R * 2 * G_S + 1, HG = new Float32Array(G_N * G_N);
const CABIN_PAD = { x0: 2, x1: 62, y0: -42, y1: 14 };
function rawHeight(x, y) {
  const u = xyToU(x, y), v = xyToV(x, y); if (v < vBack(u)) return -1;
  const d = Math.hypot(x - HILL.x, (y - HILL.y) * 1.08) / HILL.r;
  let h = 16 * smooth01(-20, -62, v) + 20 * smooth01(70, 135, u);                                       // the ground rises to the ridge and the right-hand slope
  if (d < 1) h += HILL.h * (0.5 + 0.5 * Math.cos(Math.PI * d));
  const ox = Math.max(CABIN_PAD.x0 - x, 0, x - CABIN_PAD.x1), oy = Math.max(CABIN_PAD.y0 - y, 0, y - CABIN_PAD.y1);
  const pad = Math.min(smooth01(0, 14, Math.hypot(ox, oy)), smooth01(24, 46, Math.hypot(x - 26, y - 34)), smooth01(1, 1.8, pondQ(u, v)));   // cabin, yard and pond stay level
  const drift = 3.6 * (noise2(u / 30 + 3.1, v / 15 + 1.2) - 0.35) + 1.1 * (noise2(u / 11 + 9, v / 6 + 4) - 0.5);
  return Math.max(0, (h + drift * pad) * Math.min(1, pad + (d < 1 ? 1 : 0) + smooth01(-20, -40, v) + smooth01(60, 80, u)));
}
function buildHeights() {
  for (let q = 0; q < G_N; q++) for (let p = 0; p < G_N; p++) HG[q * G_N + p] = rawHeight(p / G_S - G_R, q / G_S - G_R);
}
/* bilinear lookup of the baked field */
function HT(x, y) {
  const fx = (x + G_R) * G_S, fy = (y + G_R) * G_S, ix = Math.floor(fx), iy = Math.floor(fy);
  if (ix < 0 || iy < 0 || ix >= G_N - 1 || iy >= G_N - 1) return -1;
  const a = HG[iy * G_N + ix], b = HG[iy * G_N + ix + 1], c = HG[(iy + 1) * G_N + ix], d = HG[(iy + 1) * G_N + ix + 1];
  if (a < 0 || b < 0 || c < 0 || d < 0) return Math.min(a, b, c, d);
  const u = fx - ix, v = fy - iy;
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
const GZ = (x, y) => Math.max(0, HT(x, y));            // ground height at a point, for actors
function slopeN(x, y) {                                // unit normal of the snow
  const e = 1.2, sx = (GZ(x + e, y) - GZ(x - e, y)) / (2 * e), sy = (GZ(x, y + e) - GZ(x, y - e)) / (2 * e), m = Math.hypot(sx, sy, 1);
  return [-sx / m, -sy / m, 1 / m];
}

/* ---- sled lanes and the climbing trail: smooth curves over the snow ---- */
function spline(pts, step = 1.5) {
  const out = [], n = pts.length, P_ = k => pts[clamp(k, 0, n - 1)];
  for (let k = 0; k < n - 1; k++) for (let u = 0; u < 1; u += step / Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1])) {
    const a = P_(k - 1), b = P_(k), c = P_(k + 1), d = P_(k + 2), u2 = u * u, u3 = u2 * u;
    out.push([0.5 * (2 * b[0] + (c[0] - a[0]) * u + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * u2 + (3 * b[0] - a[0] - 3 * c[0] + d[0]) * u3),
      0.5 * (2 * b[1] + (c[1] - a[1]) * u + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * u2 + (3 * b[1] - a[1] - 3 * c[1] + d[1]) * u3)]);
  }
  out.push(pts[n - 1].slice()); return out;
}
const LANE_A = spline([[-60, 25], [-40, 28], [-22, 32], [-6, 38], [8, 45], [18, 50]]);
const LANE_B = spline([[-54, 8], [-36, 8], [-18, 10], [-4, 15], [6, 21]]);
const TRAIL = spline([[-60, 26], [-54, 38], [-40, 48], [-24, 56], [-8, 60], [6, 58], [18, 50]]);
function distTo(L, x, y, maxD) {
  let best = 1e9;
  for (let k = 0; k < L.length; k += 2) { const dx = x - L[k][0], dy = y - L[k][1]; if (Math.abs(dx) > maxD || Math.abs(dy) > maxD) continue; const d = dx * dx + dy * dy; if (d < best) best = d; }
  return Math.sqrt(best);
}
const SNOW_MARK = new Uint8Array(G_N * G_N);           // 1 sled runner, 2 foot trail
function bakeMarks() {
  const mark = (L, fn) => { for (let k = 1; k < L.length; k++) { const dx = L[k][0] - L[k - 1][0], dy = L[k][1] - L[k - 1][1], m = Math.hypot(dx, dy), nx = -dy / m, ny = dx / m; for (let s = 0; s < 1; s += 0.2) fn(L[k - 1][0] + dx * s, L[k - 1][1] + dy * s, nx, ny, k, s); } };
  const at = (x, y, v) => { const p = Math.round((x + G_R) * G_S), q = Math.round((y + G_R) * G_S); if (p >= 0 && q >= 0 && p < G_N && q < G_N) SNOW_MARK[q * G_N + p] = v; };
  for (const L of [LANE_A, LANE_B]) mark(L, (x, y, nx, ny) => { at(x + nx * 1.6, y + ny * 1.6, 1); at(x - nx * 1.6, y - ny * 1.6, 1); });
  const r = mulberry32(17);
  for (let k = 0; k < TRAIL.length - 1; k += 1) { const [x, y] = TRAIL[k]; at(x + (k & 1 ? 1.2 : -1.2) + r() - 0.5, y + (k & 1 ? -0.8 : 0.8) + r() - 0.5, 2); }
}
const markAt = (x, y) => SNOW_MARK[Math.round((y + G_R) * G_S) * G_N + Math.round((x + G_R) * G_S)];

function snowShade(x, y, z) {
  const i = Math.floor(x * 2), j = Math.floor(y * 2), su = xyToU(x, y), sv = xyToV(x, y), n = noise2(su / 11 + 3.3, sv / 5 + 1.7) * 0.6 + noise2(su / 4.5 + 7.1, sv / 2.6 + 4.4) * 0.4;
  const N_ = slopeN(x, y), lit = N_[0] * -0.42 + N_[1] * 0.56 + N_[2] * 0.71;              // low light from the left
  let tone = 0.9 + 5.4 * lit + (n - 0.5) * 0.9 + (bay(i, j) / 16 - 0.5) * 0.42;
  const q = pondQ(su, sv); if (q < 1.25) tone -= 1.2 * (1.25 - q) / 0.25;                                // the bank dips down to the ice
  const m = markAt(x, y);
  if (m === 1) tone -= 1.3; else if (m === 2) tone -= 1.5;
  if (hash3(i, j, 25) > 0.975) tone += 1;
  return R.snow[clamp(Math.floor(tone), 0, 6)];
}
/* the ice takes its colour from the sky, so it keeps pace with the light */
const ICE_K = [['#8fb0dc', '#4a5ca0', '#1c2a60'], ['#b4cce8', '#7c78b8', '#2c3e7c'], ['#dce8f6', '#d8a8bc', '#4a60a0'], ['#ffffff', '#ffd8c8', '#8ea4dc']].map(([a, b, c]) => CK([[0, a], [0.4, b], [1, c]]));
function iceShade(u, v, x, y) {
  const su = xyToU(x, y), sv = xyToV(x, y), q = pondQ(su, sv); if (q >= 1) return 0;
  const i = Math.floor(x * 2), j = Math.floor(y * 2);
  if (q > 0.9) return ICE_K[hash3(i >> 1, j >> 1, 51) > 0.5 ? 3 : 2];                                       // snow blown onto the edge
  const crack = Math.abs(noise2(su / 7 + 2, sv / 3 + 8) - 0.5) < 0.012, n = noise2(su / 9, sv / 3.4 + 5), scuff = Math.abs(Math.sin(su * 0.11 + sv * 0.6 + 3 * n)) < 0.03;
  if (crack || scuff) return ICE_K[3];
  return ICE_K[clamp(Math.floor(0.4 + 2.3 * n + 0.9 * (sv - POND.v) / POND.rv + (bay(i, j) / 16 - 0.5) * 0.5), 0, 2)];
}
function buildGround() {
  buildHeights(); bakeMarks();
  OBJ = objNew(); FLAG = F_SNOW;
  hfield(HT, HMAX, snowShade);
  OBJ = objNew(); FLAG = F_ICE | F_NOOUT;
  face('T', -60, 30, 0.08, 150, 130, iceShade);
  FLAG = 0;
}
