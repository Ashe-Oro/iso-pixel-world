/* =====================================================================
   The cottage and its yard. The long +y wall faces the yard (door, window,
   lantern, porch); the +x gable faces the pond. Windows use keyed colours:
   sunset glints at dusk, warm lamplight at night.
   ===================================================================== */
const HS = { x0: 4, x1: 46, y0: -36, y1: -8, wall: 33, over: 2, yR: -22, porchZ: 3, door: [11, 20], win: [25, 37] };
HS.ridge = HS.wall - HS.over + (HS.y1 + HS.over - HS.yR);
const PANE = { dusk: CK([[0, '#f6c07a'], [0.3, '#f0a860'], [0.6, '#ffcf74'], [1, '#ffcf74']]), lite: CK([[0, '#ffe6b0'], [0.3, '#f8c478'], [0.6, '#fff0b4'], [1, '#fff0b4']]), deep: CK([[0, '#a86a5e'], [0.3, '#b06a4a'], [0.6, '#f8ae52'], [1, '#f8ae52']]) };
const LANTERN_POS = { x: 8.6, y: HS.y1 + 0.8, z: 22 };
function plaster(col, row) {
  if (row < 4) { const b = Math.floor(row / 2), o = (col + b * 3) % 8; return o === 0 ? R.stone[0] : R.stone[1 + (hash3(Math.floor((col + b * 3) / 8), b, 5) > 0.5 ? 1 : 0)]; }   // stone footing
  const stain = noise2(col / 9, row / 7);
  return R.plaster[clamp(Math.floor(3.7 + (stain - 0.5) * 1.1 + (hash3(col, row, 6) > 0.95 ? -1 : 0)), 2, 5)];
}
function windowDecal(c0, r0, w, h, frame) {            // panes with muntins, a lit top band and a little curtain
  return { c0, r1: r0 + h - 1, w, h, fn: (c, r) => {
    if (c === 0 || r === 0 || c === w - 1 || r === h - 1) return frame;
    if (c === (w >> 1) || r === (h >> 1)) return frame;
    if ((c < 3 || c > w - 4) && r < h - 3 && (c + r) % 3 !== 0 && r > 0 && r < (h >> 1) + 2) return R.plaster[5];
    return r < 3 ? PANE.lite : r > h - 4 ? PANE.deep : PANE.dusk;
  } };
}
function wallY(u, v, x, y, z) {
  const col = Math.floor(u * 2), row = Math.floor(v), W_ = (HS.x1 - HS.x0) * 2;
  if (col < 2 || col >= W_ - 2) return R.wood[col === 0 || col === W_ - 1 ? 1 : 2];         // corner posts
  if (row >= HS.wall - 2) return R.wood[1];
  if (row === 13) return R.wood[2];
  return plaster(col, row);
}
function wallX(u, v, x, y, z) {                        // the gable, cut to the roofline
  const top = HS.ridge - (y > HS.yR ? y - HS.yR : (HS.yR - y) * 0.7); if (z >= top) return 0;
  const col = Math.floor(u * 2), row = Math.floor(v), W_ = (HS.y1 - HS.y0) * 2;
  if (col < 1 || col >= W_ - 1) return R.wood[1];
  if (top - z < 1.6) return R.wood[1];
  if (row === HS.wall - 1 || row === 13) return R.wood[2];
  return plaster(col, row);
}
function shingles(u, v, x, y) {
  const span = HS.y1 + HS.over - HS.yR, row = Math.floor((span - v) / 1.9), cell = Math.floor(u / 2 + (row & 1) * 0.5), fr = (span - v) / 1.9 - row;
  if (v < 0.8) return R.roof[6];                                                            // ridge cap
  if (span - v < 0.9) return R.roof[1];                                                     // eave shadow line
  const h = hash3(cell, row, 8), lip = fr > 0.72;
  if (h > 0.9 && noise2(x / 5, y / 3) > 0.5) return P.moss;
  const base = 3.4 + (v / span) * 0.9 + (h - 0.5) * 2 - (lip ? 1.4 : 0);
  return R.roof[clamp(Math.round(base), 1, 6)];
}
function planks(u, v) {
  const row = Math.floor(u / 2.5), seam = u / 2.5 - row < 0.18, h = hash3(row, Math.floor(v / 4 + row), 11);
  return seam ? R.wood[0] : R.wood[h > 0.7 ? 3 : 2];
}
function brick(u, v) {
  const r = Math.floor(v / 2), c = Math.floor(u * 2 + (r & 1) * 2);
  return v % 2 < 0.8 || c % 4 === 0 ? R.brick[0] : R.brick[1 + Math.floor(hash3(c >> 2, r, 12) * 3)];
}
const SHADOW_BOX = [], SHADOW_SPH = [];
const LINE = { x0: TREE.x + 3, x1: -1, y: -10, z: 31, sag: 4 };                 // clothesline, tied off on the maple
function buildHouse() {
  const H = HS, W_ = H.x1 - H.x0, D_ = H.y1 - H.y0;
  OBJ = objNew();
  const frame = R.wood[1];
  const winY = windowDecal(Math.round((H.win[0]) * 2), 12, (H.win[1] - H.win[0]) * 2, 14, frame);
  const doorC = H.door[0] * 2, doorW = (H.door[1] - H.door[0]) * 2;
  const door = { c0: doorC, r1: 25, w: doorW, h: 23, fn: (c, r) => {
    if (c === 0 || c === doorW - 1 || r === 0) return R.wood[0];
    if (r < 7 && r > 2 && c > 3 && c < doorW - 4) return (c === (doorW >> 1)) ? R.wood[1] : PANE.dusk;     // little door window
    if (c === doorW - 4 && r === 11) return R.brick[4];                                                   // knob
    return c % 4 === 1 ? R.wood[1] : (r === 8 ? R.wood[2] : R.wood[3]);
  } };
  face('Y', H.x0, H.y1, 0, W_, H.wall, layered(wallY, [door, winY]));
  const winX = windowDecal(17, 10, 20, 15, frame);
  const atticR = 7, attic = { c0: Math.round((H.yR - H.y0) * 2 - atticR), r1: 38, w: atticR * 2 + 1, h: atticR * 2 - 1, fn: (c, r) => {
    const d = Math.hypot(c - atticR, r - atticR + 1); if (d > atticR - 0.3) return 0; if (d > atticR - 2) return frame;
    if (c === atticR || r === atticR - 1) return frame; return r < atticR - 2 ? PANE.lite : PANE.dusk;
  } };
  face('X', H.x1, H.y0, 0, D_, H.ridge + 1, layered(wallX, [winX, attic]));
  OBJ = objNew();
  slopeY(H.x0 - H.over, H.x1 + H.over, H.yR, H.y1 + H.over, H.ridge, -1, shingles);
  const yB = H.y0 - H.over; slopeY(H.x0 - H.over, H.x1 + H.over, yB, H.yR, H.ridge - 0.7 * (H.yR - yB), 0.7, (u, v) => R.roof[1 + (Math.floor(u / 2 + Math.floor(v / 1.9) * 0.5) & 1) + (v > H.yR - yB - 1 ? 4 : 0)]);
  /* chimney, rising from the back of the ridge */
  OBJ = objNew();
  const brickY = (u, v) => v > 17 ? R.stone[3] : brick(u, v), brickX = (u, v) => v > 17 ? R.stone[2] : R.brick[0 + (brick(u, v) === R.brick[0] ? 0 : 1)];
  box(13, -29, H.ridge - 12, 21, -23, H.ridge + 15, { t: (u, v) => (u > 1.4 && u < 5.6 && v > 1.2 && v < 4.8) ? P.ink : R.stone[4], y: brickY, x: brickX });
  /* porch */
  OBJ = objNew();
  box(H.x0 + 2, H.y1, 0, H.x1 - 3, H.y1 + 9, H.porchZ, { t: planks, y: (u, v) => v > 2 ? R.wood[3] : R.wood[1], x: R.wood[1] });
  foot(H.x0 + 2, H.y1, H.x1 - 3, H.y1 + 9, 0, 0.6);
  OBJ = objNew();
  box(H.door[0] - 2, H.y1 + 9, 0, H.door[1] + 2, H.y1 + 13, 1.5, { t: planks, y: R.wood[2], x: R.wood[1] });
  /* lantern bracket and flower box */
  OBJ = objNew();
  face('Y', 7, H.y1 + 0.5, 24, 3, 1, R.wood[0]);
  const flowers = (u, v, x, y, z) => hash3(Math.floor(u * 2), Math.floor(v), 13) > 0.5 ? [P.flower, P.flower2, P.ivyL][Math.floor(hash3(Math.floor(u * 2), 2, 14) * 3)] : P.ivy;
  box(H.win[0] - 0.5, H.y1, 10, H.win[1] + 0.5, H.y1 + 2, 12, { t: flowers, y: R.wood[2], x: R.wood[1] });
  /* log pile against the gable */
  OBJ = objNew();
  for (let k = 0; k < 7; k++) { const row = k < 4 ? 0 : k < 6 ? 1 : 2, y = -32 + (k < 4 ? k : k < 6 ? k - 3.5 : 1.5) * 3.2, z = 1.8 + row * 3; box(H.x1, y - 1.4, z - 1.6, H.x1 + 6, y + 1.4, z + 1.4, { t: R.wood[2], y: R.wood[3], x: (u, v) => Math.hypot(u - 1.4, v - 1.5) < 1 ? R.wood[4] : R.wood[1] }); }
  foot(H.x1, -34, H.x1 + 6, -20, 0, 0.5);
  /* clothesline post, its partner is the maple */
  OBJ = objNew();
  box(LINE.x1 - 0.7, LINE.y - 0.7, 0, LINE.x1 + 0.7, LINE.y + 0.7, LINE.z + 2, { t: R.wood[3], y: R.wood[2], x: R.wood[1] });
  box(LINE.x1 - 0.5, LINE.y - 2.2, LINE.z, LINE.x1 + 0.5, LINE.y + 2.2, LINE.z + 1, { t: R.wood[3], y: R.wood[2], x: R.wood[1] });
  foot(LINE.x1 - 1.5, LINE.y - 1.5, LINE.x1 + 1.5, LINE.y + 1.5, 0, 0.5);
  /* pumpkins */
  const pum = (w, h) => { const s = new Spr(w + 2, h + 3); s.ell((w + 2) / 2, h / 2 + 2, w / 2, h / 2, 0, (x, y, dx, dy) => { const st = Math.abs(((dx * 1.4 + 2) % 0.5) - 0.25) < 0.07; return st ? P.pumpkinD : dx + dy < -0.3 ? P.pumpkinL : dx + dy > 0.7 ? P.pumpkinD : P.pumpkin; }); s.rect((w >> 1), 0, 2, 2, P.stem); s.outline(n => dk(n, 2)); s.ax = (w + 2) >> 1; s.ay = s.h - 2; return s; };
  for (const [x, y, w, h] of [[-8, 1, 10, 8], [-4, 5, 8, 6], [-12, 5, 7, 6], [47, 3, 8, 7]]) { OBJ = objNew(); stampS(pum(w, h), x, y, 0, 0); foot(x - 2, y - 2, x + 2, y + 2, 0, 0.5); }
  /* a bush at the far right */
  OBJ = objNew();
  const bush = new Spr(26, 18); for (const [cx, cy, r] of [[8, 11, 6], [15, 8, 7], [20, 12, 5]]) bush.ell(cx, cy, r, r * 0.85, 0, (x, y, dx, dy) => R.leaves[clamp(Math.floor(2.6 - (dx + dy) * 1.4 + hash3(x, y, 15) * 1.2), 0, 5)]);
  bush.outline(n => dk(n, 1)); bush.ax = 13; bush.ay = 17; stampS(bush, 52, -13, 0, 0); foot(48, -17, 57, -9, 0, 0.5);
  SHADOW_BOX.push([H.x0, H.y0, H.x1, H.y1, H.wall], [H.x0, H.yR - 7, H.x1, H.yR + 7, H.ridge - 7], [H.x0 + 2, H.y1, H.x1 - 3, H.y1 + 9, H.porchZ]);
  foot(H.x0, H.y0, H.x1, H.y1, 0, 1); 
}
