/* =====================================================================
   House shell. Stepped cutaway: ground tier (living + kitchen) in front,
   upper tier (bedroom + attic loft) set back on top of the stair hall.
   ===================================================================== */
const HS = {
  W: 120, gy0: 32, gy1: 72, gh: 48, uz: 54, wt: 104, ridgeY: 16, rs: 1, ridgeZ: 120,
  divx0: 64, divx1: 67, divy1: 54, attx: 76, attz: 68,
  hole: { x0: 50, x1: 66, y0: 21, y1: 30 }, door: { x0: 4, x1: 13, h: 34 },
  isl: { x0: -6, x1: 132, y0: -6, y1: 78, z: -4, zb: -16 }
};
const PANES = [null];
const STAIR = { x0: 6, run: 3.75, rise: 54 / 16, n: 16, y0: 22, y1: 30 };
const stairZ = x => x <= STAIR.x0 ? 0 : x >= STAIR.x0 + STAIR.n * STAIR.run ? HS.uz : (Math.floor((x - STAIR.x0) / STAIR.run) + 1) * STAIR.rise;

/* ---------------- wallpapers & surfaces (col,row = face pixel units) ---------------- */
const MOTIF_FLOWER = ['..a..', '.aba.', 'abcba', '.aba.', '..a..'];
function motifAt(rows, c, r) { if (r < 0 || r >= rows.length || c < 0 || c >= rows[0].length) return ''; return rows[r][c]; }
const md = (a, m) => ((a % m) + m) % m;

function trimBand(row, top, c, cHi, cLo) {           // horizontal moulding helper
  if (row === top) return cHi; if (row === top - 1) return c; if (row === top - 2) return cLo; return 0;
}
function wpLiving(col, row) {
  if (row < 2) return row === 1 ? P.wd3 : P.wd2;                                      // skirting
  if (row < 15) {                                                                       // wainscot panels
    if (row === 14) return P.wd5; if (row === 13) return P.wd3;
    const pc = md(col, 14);
    if (row === 2 || row === 12) return P.wd2;
    if (pc === 0) return P.wd2; if (pc === 1) return P.wd5;
    if (row === 3 || pc === 2) return P.wd5;
    if (row === 11 || pc === 13) return P.wd2;
    return hash3(col >> 2, row, 3) > 0.9 ? P.wd3 : P.wd4;
  }
  if (row === 15) return P.wd2;
  if (row >= 45) return row === 47 ? P.cr3 : row === 46 ? P.cr2 : P.cr1;                // cornice
  const tr = Math.floor((row - 16) / 10), mc = md(col + (tr & 1) * 7, 14), mr = md(row - 16, 10);
  if (md(col, 14) === 0) return P.sg1;
  const m = motifAt(MOTIF_FLOWER, mc - 5, mr - 3);
  if (m === 'a') return P.sg3; if (m === 'b') return P.sg4; if (m === 'c') return P.pe1;
  if ((mc === 2 && mr === 8) || (mc === 9 && mr === 1)) return P.sg3;
  return P.sg2;
}
function wpKitchen(col, row, x) {
  if (row < 2) return row === 1 ? P.wd3 : P.wd2;
  if (row >= 19 && row < 34) {                                                           // tiled backsplash
    const tc = md(col, 6), tr = md(row - 19, 5), k = Math.floor(col / 6) + Math.floor((row - 19) / 5) * 3;
    if (tr === 0 || tc === 0) return P.cr0;
    const accent = md(k, 7) === 3 || md(k, 11) === 5;
    if (tr === 4 && tc === 1) return accent ? P.te4 : P.wh;
    return accent ? (tc < 3 && tr > 2 ? P.te3 : P.te2) : (tc === 5 || tr === 1 ? P.cr2 : P.cr3);
  }
  if (row >= 45) return row === 47 ? P.cr3 : row === 46 ? P.cr2 : P.cr1;
  const g = ((md(col, 8) < 4) ? 1 : 0) + ((md(row, 4) < 2) ? 1 : 0);                      // honey gingham
  return g === 2 ? P.hn3 : g === 1 ? P.cr2 : P.cr3;
}
function wpBed(col, row) {
  if (row < 2) return row === 1 ? P.cr1 : P.cr0;
  if (row < 13) { if (row === 12) return P.wh; if (row === 11) return P.cr1; return md(col, 4) === 0 ? P.cr1 : P.cr2; } // beadboard
  if (row === 13) return P.cr0;
  if (md(col, 16) === 0) return P.ro4;
  const mc = md(col + (Math.floor(row / 8) & 1) * 8, 16), mr = md(row, 8);
  if (mc === 8 && mr === 4) return P.cr3;                                                 // tiny stars
  if ((mc === 7 || mc === 9) && mr === 4) return P.ro4;
  if (mc === 8 && (mr === 3 || mr === 5)) return P.ro4;
  if (mc === 3 && mr === 1) return P.ro4;
  return P.ro3;
}
function wpAttic(col, row) {
  const pr = md(row, 5), plank = Math.floor(row / 5);
  if (pr === 0) return P.wd0;
  const off = Math.floor(hash2(plank, 9) * 40), seg = Math.floor((col + off) / 34);
  if (md(col + off, 34) === 0) return P.wd0;
  if (pr === 4) return P.wd1;
  const h = hash3(seg, plank, 4);
  if (md(col + off, 34) === 3 && pr === 2) return P.ow0;                                   // nail
  return h > 0.66 ? P.wd3 : h > 0.33 ? P.ow1 : P.wd2;
}
function wpHall(col, row) { if (row < 2) return P.wd1; return md(col, 10) === 0 ? P.te0 : (md(col, 10) === 5 && md(row, 6) === 3) ? P.gd1 : P.te1; }

function floorLiving(u, v) {
  const row = Math.floor(v / 3), fv = v - row * 3;
  if (fv < 0.35) return P.wd2;
  const off = hash2(row, 1) * 20, L = 16 + Math.floor(hash2(row, 2) * 8), k = Math.floor((u + off) / L), fu = (u + off) - k * L;
  if (fu < 0.5) return P.wd2;
  const h = hash3(k, row, 5);
  if (fv > 2.65) return P.wd3;
  if (hash3(Math.floor(u * 1.5), row, 8) > 0.93) return P.wd5;
  return h > 0.7 ? P.wd5 : h > 0.3 ? P.wd4 : mixC(P.wd4, P.wd3, 0.5);
}
function floorKitchen(u, v) {
  const s = 5, iu = Math.floor(u / s), iv = Math.floor(v / s), fu = u - iu * s, fv = v - iv * s;
  if (fu < 0.5 || fv < 0.5) return P.cr0;
  const dark = (iu + iv) & 1;
  if (fu < 1.3 && fv < 1.3) return dark ? P.tc3 : P.wh;
  return dark ? (fu > 4.2 || fv > 4.2 ? P.tc1 : P.tc2) : (fu > 4.2 || fv > 4.2 ? P.cr1 : P.cr2);
}
function floorBed(u, v) {
  const col = Math.floor(u / 3), fu = u - col * 3;
  if (fu < 0.4) return P.wd3;
  const off = hash2(col, 3) * 18, L = 14 + Math.floor(hash2(col, 4) * 8), k = Math.floor((v + off) / L), fv = (v + off) - k * L;
  if (fv < 0.5) return P.wd3;
  const h = hash3(col, k, 6);
  return fu > 2.6 ? P.wd4 : h > 0.6 ? P.wd6 : P.wd5;
}
function floorAttic(u, v) {
  const col = Math.floor(u / 4), fu = u - col * 4;
  if (fu < 0.5) return P.wd0;
  const h = hash3(col, Math.floor(v / 9), 7);
  if (hash3(Math.floor(u), Math.floor(v), 2) > 0.95) return P.wd1;
  return fu > 3.4 ? P.wd1 : h > 0.5 ? P.wd3 : P.ow1;
}
/* cut section (cream plaster + timber) for cutaway edges */
const cutCol = (a, b, A, B) => (a < 0.5 || a > A - 0.5 || b < 0.6 || b > B - 0.6) ? P.cr0 : P.cr2;

/* ---------------- windows ---------------- */
function windowAt(t, plane, a0, a1, z0, z1, room, opt = {}) {
  const id = PANES.length, U = a1 - a0, V = z1 - z0, fr = opt.frame || P.cr3, frD = dk(fr), round = opt.round;
  const inside = (u, v) => { if (round) { const du = (u - U / 2) * 1.83, dv = v - V / 2; return du * du + dv * dv < (V / 2) * (V / 2); } return true; };
  const isFrame = (u, v) => {
    if (round) { const du = (u - U / 2) * 1.83, dv = v - V / 2, d = Math.sqrt(du * du + dv * dv); return d > V / 2 - 1.6 || Math.abs(dv) < 0.6 || Math.abs(du) < 0.9; }
    if (u < 1 || u > U - 1 || v < 1.5 || v > V - 1.5) return true;
    if (Math.abs(u - U / 2) < 0.5) return true;
    if (opt.transom && Math.abs(v - V * 0.66) < 0.6) return true;
    return false;
  };
  ROOM = room; const oF = FLAG, oP = PANE_ID; OBJ = objNew();
  FLAG = F_PANE | F_NOOUT; PANE_ID = id;
  if (t === 'Y') face('Y', a0, plane + 0.03, z0, U, V, (u, v) => inside(u, v) && !isFrame(u, v) ? P.mb2 : 0);
  else face('X', plane + 0.03, a0, z0, U, V, (u, v) => inside(u, v) && !isFrame(u, v) ? P.mb2 : 0);
  FLAG = oF; PANE_ID = 0;
  const frameSh = (u, v) => { if (!inside(u, v) || !isFrame(u, v)) return 0;
    if (round) return (u + v) > (U + V) * 0.55 ? frD : fr;
    if (u < 1 || u > U - 1) return (t === 'Y' ? u > U - 1 : u < 1) ? frD : fr;
    return v < 1.5 ? frD : v > V - 1.5 ? lt(fr) : fr; };
  if (t === 'Y') face('Y', a0, plane + 0.05, z0, U, V, frameSh); else face('X', plane + 0.05, a0, z0, U, V, frameSh);
  if (!round && !opt.noSill) {                                                           // sill
    if (t === 'Y') box(a0 - 1, plane, z0 - 2, a1 + 1, plane + 2.5, z0, { t: lt(fr), y: fr, x: frD });
    else box(plane, a0 - 1, z0 - 2, plane + 2.5, a1 + 1, z0, { t: lt(fr), y: fr, x: frD });
  }
  PANES.push({ id, t, plane, a0, a1, z0, z1, room, round: !!round, ext: !!opt.ext, warm: !!opt.warm });
  PANE_ID = oP; FLAG = oF;
  return id;
}

/* ---------------- building ---------------- */
function buildIsland() {
  const I = HS.isl; ROOM = R_EXT; FLAG = F_EXT; OBJ = objNew();
  const puddles = [[24, 75.5, 5, 1.6], [92, 75, 7, 2], [128, 30, 2.2, 5], [127, 54, 2, 4], [-3, 66, 1.6, 4]];
  BG.puddles = puddles;
  const inPud = (x, y) => { for (const [px, py, rx, ry] of puddles) { const dx = (x - px) / rx, dy = (y - py) / ry; if (dx * dx + dy * dy < 1) return dx * dx + dy * dy; } return -1; };
  face('T', I.x0, I.y0, I.z, I.x1 - I.x0, I.y1 - I.y0, (u, v, x, y) => {
    const pd = inPud(x, y);
    if (pd >= 0) { FLAG = F_EXT | F_WATER; return pd > 0.7 ? P.mb3 : pd > 0.3 ? P.mb2 : P.mb1; }
    FLAG = F_EXT;
    const edge = Math.min(x - I.x0, y - I.y0, I.x1 - x, I.y1 - y);
    const n = hash3(Math.floor(x * 2), Math.floor(y * 2), 31);
    if (edge < 2.5 && n > 0.8) return pick2(n, [P.ro4, P.cr3, P.hn2, P.vi4]);
    if (x > 123 && x < 126 && y > 4 && y < 30) return n > 0.5 ? P.wd1 : P.ow0;           // flower bed soil
    const g = hash3(Math.floor(x), Math.floor(y * 1.5), 32);
    return g > 0.8 ? P.lf3 : g > 0.35 ? P.lf2 : P.lf1;
  });
  FLAG = F_EXT;
  const soil = (u, v, x, y, z, along) => {
    const depthR = HS.isl.z - z;                                                          // 0 at top
    if (depthR < 1.2) return P.lf3; if (depthR < 2.2) return hash2(Math.floor(along * 2), 3) > 0.4 ? P.lf2 : P.lf1;
    if (depthR < 3) return hash2(Math.floor(along * 2), 4) > 0.6 ? P.lf1 : P.wd1;
    const h = hash3(Math.floor(along * 1.2), Math.floor(z / 2), 9);
    if (h > 0.9) return P.ch3; if (h > 0.85) return P.ch4;
    if (md(Math.floor(along * 2) + Math.floor(z), 23) === 0 && h > 0.4) return P.wd2;      // roots
    return depthR > 9 ? P.ow0 : depthR > 6 ? P.wd1 : P.ow1;
  };
  face('Y', I.x0, I.y1, I.zb, I.x1 - I.x0, I.z - I.zb, (u, v, x, y, z) => soil(u, v, x, y, z, x));
  face('X', I.x1, I.y0, I.zb, I.y1 - I.y0, I.z - I.zb, (u, v, x, y, z) => soil(u, v, x, y, z, -y));
  // rocky underside: jagged screen-space polygon under the two bottom edges
  const A = [isx(I.x0, I.y1), isy(I.x0, I.y1, I.zb)], B = [isx(I.x1, I.y1), isy(I.x1, I.y1, I.zb)], Cc = [isx(I.x1, I.y0), isy(I.x1, I.y0, I.zb)];
  const pts = [A, B, Cc];
  const n = 26; const under = [];
  for (let k = n; k >= 0; k--) { const t = k / n, x = lerp(A[0], Cc[0], t); const baseY = t < 0.5 ? lerp(A[1], B[1], t * 2) : lerp(B[1], Cc[1], (t - 0.5) * 2);
    const bulge = Math.sin(t * Math.PI) * 16 * (0.6 + 0.4 * hash2(k, 99)) + (k % 2 ? 3 : 0); under.push([x, baseY + bulge]); }
  OBJ = objNew();
  fillPolyS(pts.concat(under), (i, j) => { const h = hash3(i >> 1, j >> 1, 41), dy = j - (OY + 210); return dy > 8 ? (h > 0.7 ? P.vi1 : P.ch1) : h > 0.8 ? P.ch3 : h > 0.3 ? P.ch2 : P.vi1; }, -1e7, F_EXT);
  BG.islandBottom = under;
}
const pick2 = (h, arr) => arr[Math.floor(hash2(Math.floor(h * 1000), 5) * arr.length)];

function buildShell() {
  const W = HS.W, g0 = HS.gy0, g1 = HS.gy1, gh = HS.gh, uz = HS.uz, wt = HS.wt, Hd = HS.door, Ho = HS.hole;
  const cut = { t: (u, v) => cutCol(u, v, 99, 99) };
  /* ---------- foundation & floor edges ---------- */
  ROOM = R_EXT; FLAG = F_EXT; OBJ = objNew();
  const found = (u, v, x, y, z, a) => { if (z > -0.6) return P.wd3; if (z > -1.3) return P.wd2;
    const r = Math.floor((z + 4) / 2), off = r & 1 ? 3 : 0; return md(Math.floor(a + off), 6) === 0 ? P.ch2 : hash3(Math.floor((a + off) / 6), r, 3) > 0.5 ? P.ch4 : P.ch3; };
  face('Y', -3, g1, -4, W + 3, 4, (u, v, x, y, z) => found(u, v, x, y, z, x));
  face('X', W, g0, -4, g1 - g0, 4, (u, v, x, y, z) => found(u, v, x, y, z, -y));
  /* ---------- ground floors ---------- */
  ROOM = R_LIV; FLAG = F_FLOOR | F_GLOSS; OBJ = objNew();
  face('T', 0, g0, 0, HS.divx0 + 1.5, g1 - g0, floorLiving);
  ROOM = R_KIT; OBJ = objNew();
  face('T', HS.divx0 + 1.5, g0, 0, W - HS.divx0 - 1.5, g1 - g0, floorKitchen);
  FLAG = 0;
  /* ---------- ground back wall (with stair doorway) ---------- */
  OBJ = objNew();
  const doorTrim = (x, z) => { const inX = x >= Hd.x0 - 1.5 && x < Hd.x1 + 1.5 && z < Hd.h + 2; if (!inX) return -1;
    if (x >= Hd.x0 && x < Hd.x1 && z < Hd.h) return 0; return z >= Hd.h + 1 ? P.wh : (x < Hd.x0 - 0.5 || x >= Hd.x1 + 0.5 || z >= Hd.h) ? P.cr2 : P.cr1; };
  face('Y', -3, g0, 0, W + 3, gh, (u, v, x, y, z) => {
    if (x < 0) return 0;
    const dt = doorTrim(x, z); if (dt >= 0) { ROOM = R_LIV; return dt; }
    const col = Math.floor(x * 2), row = Math.floor(z);
    if (x < HS.divx0 + 1.5) { ROOM = R_LIV; return wpLiving(col, row); }
    ROOM = R_KIT; return wpKitchen(col, row, x);
  });
  ROOM = R_LIV; OBJ = objNew();
  face('X', -3 + 3, g0, 0, g1 - g0, gh, (u, v) => wpLiving(Math.floor((g1 - g0 - u) * 2), Math.floor(v)));  // left wall interior
  // left wall cut cap + front cut
  ROOM = R_EXT; OBJ = objNew();
  face('T', -3, g0, gh, 3, g1 - g0 + 0, (u, v) => (u < 0.5 || u > 2.5) ? P.cr0 : P.cr2);
  face('Y', -3, g1, 0, 3, gh, (u, v) => (u < 0.5 || u > 2.5) ? P.cr0 : v > gh - 1 ? P.cr3 : hash2(Math.floor(v / 3), 2) > 0.5 ? P.cr2 : P.cr1);
  /* ---------- divider (living | kitchen) ---------- */
  ROOM = R_KIT; OBJ = objNew();
  box(HS.divx0, g0, 0, HS.divx1, HS.divy1, gh, {
    t: (u, v) => (u < 0.5 || u > 2.5 || v > 21.5) ? P.cr0 : P.cr2,
    y: (u, v) => v < 2 ? P.wd2 : (u < 0.6 || u > 2.4) ? P.cr1 : P.cr2,
    x: (u, v) => wpKitchen(Math.floor(u * 2) + 300, Math.floor(v))
  });
  /* ---------- stair hall (behind the back wall) ---------- */
  ROOM = R_STAIR; OBJ = objNew();
  face('T', 0, Ho.y0, 0, 20, g0 - Ho.y0, P.wd3);
  face('Y', 0, Ho.y0, 0, 70, uz, (u, v) => v > uz - 6 ? (v > uz - 0.8 ? P.wd5 : P.cr1) : wpHall(Math.floor(u * 2), Math.floor(v)));
  face('X', 0, Ho.y0, 0, 9, uz, (u, v) => wpHall(Math.floor(u * 2) + 5, Math.floor(v)));
  for (let k = 0; k < STAIR.n; k++) {
    const xa = STAIR.x0 + k * STAIR.run, za = (k + 1) * STAIR.rise; OBJ = objNew();
    box(xa, STAIR.y0, 0, xa + STAIR.run, STAIR.y1, za, { t: (u, v) => u > STAIR.run - 0.7 ? P.wd5 : v < 1 || v > 7 ? P.wd2 : P.ro2, y: (u, v) => v > za - 0.8 ? P.wd4 : P.cr1, x: P.wd2 });
  }
  // the open stair door leaf (swung into the hall)
  OBJ = objNew(); box(Hd.x0 - 0.5, Ho.y0 + 2, 0, Hd.x0 + 0.5, g0 - 3, Hd.h - 0.5, { t: P.wd4, y: P.wd3, x: (u, v) => (v > 20 && v < 22 && u > 2 && u < 3) ? P.gd2 : (u < 0.6 || u > 4.4 || md(Math.floor(v), 11) === 0) ? P.wd3 : P.wd4 });
  /* ---------- upper slab (with stair hole) ---------- */
  OBJ = objNew();
  const inHole = (x, y) => x >= Ho.x0 && x < Ho.x1 && y >= Ho.y0 && y < Ho.y1;
  FLAG = F_FLOOR;
  face('T', 0, 0, uz, W, g0, (u, v, x, y) => {
    if (inHole(x, y)) return 0;
    if (x < HS.attx) { ROOM = R_BED; return floorBed(u, v); }
    ROOM = R_ATT; return floorAttic(u, v);
  });
  FLAG = 0; ROOM = R_EXT; OBJ = objNew();
  face('Y', -3, g0, gh, W + 6, uz - gh, (u, v, x) => {                     // slab cut edge with joist ends
    if (v > 5) return P.wd4; if (v > 4.4) return P.wd2; if (v < 0.8) return P.cr1;
    const jc = md(Math.floor(x), 8); return jc < 2 ? (v > 3 ? P.wd3 : P.wd2) : P.cr0; });
  // hole inner edges
  ROOM = R_BED; OBJ = objNew();
  face('Y', Ho.x0, Ho.y0, gh, Ho.x1 - Ho.x0, uz - gh, (u, v) => v > 5 ? P.wd5 : P.cr1);
  face('X', Ho.x0, Ho.y0, gh - 14, Ho.y1 - Ho.y0, uz - gh + 14, (u, v) => v > 19 ? P.wd5 : wpHall(Math.floor(u * 2), Math.floor(v)));
  /* ---------- upper walls ---------- */
  OBJ = objNew();
  face('Y', 0, 0, uz, W, wt - uz, (u, v, x, y, z) => {
    const col = Math.floor(x * 2), row = Math.floor(z - uz);
    if (x < HS.attx) { ROOM = R_BED; return wpBed(col, row); }
    ROOM = R_ATT; if (z < HS.attz) return P.wd1; return wpAttic(col, Math.floor(z - HS.attz));
  });
  ROOM = R_BED; OBJ = objNew();
  const gable = (y, z) => z < wt || z < HS.ridgeZ - Math.abs(y - HS.ridgeY) * HS.rs;
  face('X', 0, 0, uz, g0, HS.ridgeZ + 4 - uz, (u, v, x, y, z) => {
    const top = wt + (HS.ridgeY - Math.abs(y - HS.ridgeY)) * HS.rs;
    if (z >= top + 3) return 0;
    if (z >= top) return z >= top + 2 ? P.ro0 : z >= top + 1 ? P.ro1 : P.wd2;           // front roof slope in section
    if (z >= top - 1.2 && y > HS.ridgeY) return P.wd3;
    return wpBed(Math.floor((g0 - y) * 2), Math.floor(z - uz));
  });
  // left wall front cut and top
  ROOM = R_EXT; OBJ = objNew();
  face('Y', -3, g0, uz - 6, 3, wt - uz + 6, (u, v) => (u < 0.5 || u > 2.5) ? P.cr0 : P.cr2);
  /* ---------- exterior right side (stair-hall block) ---------- */
  ROOM = R_EXT; FLAG = F_EXT; OBJ = objNew();
  face('X', W + 3, -3, -4, g0 + 3, uz + 4, (u, v, x, y, z) => {
    const yy = g0 - y;                                                                    // 0 at front edge
    if (z < 2) return found(0, 0, 0, 0, z < -1.3 ? z : -2, y);
    if (yy < 1.5 || y < -1.5) return yy < 0.5 || y < -2.5 ? P.cr0 : P.cr2;               // corner trims
    if (z > uz - 2) return z > uz - 0.7 ? P.cr2 : P.cr1;                                  // frieze
    const r = md(Math.floor(z - 2), 4);
    if (r === 3) return P.sg4; if (r === 0) return P.sg1;
    return hash3(Math.floor(y / 9), Math.floor((z - 2) / 4), 11) > 0.85 ? P.sg2 : P.sg3;
  });
  face('Y', W, g0, -4, 3, uz + 4, (u, v) => (u < 0.5 || u > 2.5) ? P.cr0 : P.cr2);        // cut edge
  face('T', W, -3, uz, 3, g0 + 3, (u, v) => u < 0.5 ? P.cr0 : P.cr2);
  windowAt('X', W + 3, 21, 29, 16, 38, R_EXT, { ext: true, warm: true, frame: P.cr3, transom: true });
  FLAG = 0;
  /* ---------- roof: back slope (visible from above) + ridge ---------- */
  ROOM = R_EXT; FLAG = F_EXT; OBJ = objNew();
  const rx0 = -5, rx1 = W + 5, ry0 = -6, zA = wt + (ry0) * HS.rs;
  slopeY(rx0, rx1, ry0, HS.ridgeY, zA + 2, HS.rs, (u, v, x, y) => {
    if (v < 1.2) return P.ch3;                                                            // gutter lip
    const row = Math.floor((v - 1.2) / 2.6), fr = (v - 1.2) - row * 2.6;
    const off = (row & 1) ? 2 : 0, tab = Math.floor((u + off) / 4), fu = (u + off) - tab * 4;
    const h = hash3(tab, row, 21);
    if (fr < 0.55) return P.ro0;
    if (fu < 0.5) return P.ro0;
    if (h > 0.9 && fr > 1.2) return P.sg2;                                               // moss
    if (fr > 2.0) return h > 0.5 ? P.ro4 : P.ro3;
    return h > 0.6 ? P.ro3 : h > 0.25 ? P.ro2 : mixC(P.ro2, P.tc2, 0.5);
  });
  OBJ = objNew();
  face('Y', rx0, HS.ridgeY, HS.ridgeZ - 1, rx1 - rx0, 4, (u, v) => v > 3 ? P.tc2 : v > 2 ? P.tc1 : v < 0.8 ? P.wd1 : P.wd2);   // ridge section
  face('X', rx1, ry0, zA - 1, HS.ridgeY - ry0, 30, (u, v, x, y, z) => { const top = wt + 2 + y * HS.rs; return (z <= top && z > top - 4) ? (z > top - 1 ? P.ro3 : z > top - 2.5 ? P.wd2 : P.wd1) : 0; });
  // gutter + downspout at the back-right corner
  OBJ = objNew(); box(rx0, ry0 - 1, zA, rx1, ry0 + 0.5, zA + 1.5, { t: P.ch4, y: P.ch3, x: P.ch2 });
  OBJ = objNew(); box(W + 3, -5.5, -4, W + 4.5, -4, zA + 1, { t: P.ch4, y: (u, v) => md(Math.floor(v), 18) === 0 ? P.ch2 : P.ch4, x: P.ch3 });
  FLAG = 0;
  /* ---------- chimney (breast in bedroom + stack above roof) ---------- */
  const brick = (u, v, x, y, z, a) => { const r = Math.floor(z / 2), off = (r & 1) ? 1.5 : 0; const k = Math.floor((a + off) / 3);
    if (md(Math.floor(z), 2) === 0 || md(Math.floor((a + off) * 2), 6) === 0) return P.bk0; const h = hash3(k, r, 17); return h > 0.8 ? P.bk3 : h > 0.4 ? P.bk2 : P.bk1; };
  ROOM = R_BED; OBJ = objNew();
  box(26, 0, uz, 36, 5, wt, { t: P.bk1, y: (u, v, x, y, z) => brick(u, v, x, y, z, x), x: (u, v, x, y, z) => dk(brick(u, v, x, y, z, y)) });
  ROOM = R_EXT; FLAG = F_EXT; OBJ = objNew();
  box(27, -2, wt - 2, 35, 5, 126, { t: P.ch1, y: (u, v, x, y, z) => z > 123 ? P.ch4 : brick(u, v, x, y, z, x), x: (u, v, x, y, z) => z > 123 ? P.ch3 : dk(brick(u, v, x, y, z, y)) });
  OBJ = objNew(); cyl(31, 1.5, 126, 1.7, 4, (a) => cylShade(a, P.tc2), P.ch0);
  BG.chimney = { x: 31, y: 1.5, z: 130 };
  FLAG = 0;
  /* ---------- attic loft platform ---------- */
  ROOM = R_ATT; OBJ = objNew();
  box(HS.attx, 0, uz, W, g0, HS.attz, {
    t: (u, v) => floorAttic(u, v),
    y: (u, v, x) => { const c = md(Math.floor(x - HS.attx), 11); if (v > 13) return P.wd4; if (v < 1) return P.wd1;
      if (c === 0) return P.wd1; if (v > 5 && v < 7 && c >= 4 && c <= 6) return P.gd2;             // drawer pulls
      return md(Math.floor(v), 6) === 0 ? P.wd2 : P.wd3; },
    x: (u, v) => v > 13 ? P.wd3 : P.wd1
  });
  foot(HS.attx - 0.5, 0, W, g0, uz, 0.6);
  /* ---------- windows ---------- */
  windowAt('X', 0, 45, 61, 22, 40, R_LIV, { frame: P.cr3, transom: true });
  windowAt('Y', 32, 92, 104, 24, 38, R_KIT, { frame: P.cr3 });
  windowAt('X', 0, 8, 24, 66, 92, R_BED, { frame: P.wh, transom: true, noSill: true });
  windowAt('Y', 0, 96, 106, 74, 90, R_ATT, { round: true, frame: P.wd2 });
  ROOM = R_EXT;
}
