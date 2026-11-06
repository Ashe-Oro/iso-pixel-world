/* =====================================================================
   The log cabin. The long +y wall is the front: a red door with the cat
   flap, the big window the cat sits in, a deck with rails. The +x gable
   faces right. Panes use keyed colours so the windows glow at any hour.
   ===================================================================== */
const HS = { x0: 8, x1: 56, y0: -34, y1: -10, wall: 40, over: 2, yR: -22, deckZ: 3, deck: 17, door: [14, 23], win: [31, 42], win2: [47.5, 54], sill: 10 };
HS.ridge = HS.wall - HS.over + (HS.y1 + HS.over - HS.yR);
HS.deckY = HS.y1 + HS.deck;
const FLAP = { x0: 16, x1: 21.5, z0: HS.deckZ + 0.6, z1: 14 };
const PANE = { lite: CK([[0, '#fff2c8'], [0.4, '#ffeab0'], [1, '#fff0b8']]), mid: CK([[0, '#ffe4a8'], [0.4, '#ffdc94'], [1, '#ffe298']]), deep: CK([[0, '#f8c880'], [0.4, '#fcc070'], [1, '#ffc870']]) };
const PANE_SET = [PANE.lite, PANE.mid, PANE.deep];
const WIN_MASK = new Uint8Array(NPIX);                 // pixels of the big window's glass, for the cat behind it
const CABIN_OBJ = { wall: 0 };
const DOORP = ramp(['#5a1c24', '#7c2428', '#9c302c', '#b84234']);
const SHUT = ramp(['#1c3a34', '#285044', '#366a54']);
const LOG_H = 3.4;
function logShade(along, z, seed) {
  const row = Math.floor(z / LOG_H), fr = z / LOG_H - row;
  if (fr < 0.17) return hash3(Math.floor(along * 2), row, seed) > 0.8 ? R.chink[0] : R.chink[1];         // chinking between logs
  const grain = noise2(along / 5.5 + row * 3.3, row * 1.7 + seed) - 0.5, shift = hash3(row, seed, 5) - 0.5, tone = (fr > 0.72 ? 4.6 : fr > 0.38 ? 3.6 : 2.4) + grain * 1.5 + shift * 0.9;
  if (hash3(Math.floor(along * 1.2), row, seed + 2) > 0.985) return R.log[1];                             // a knot
  return R.log[clamp(Math.floor(tone), 1, 6)];
}
const ringEnd = (u, v, r) => { const d = Math.hypot(u - r, v - r) / r; return d > 1 ? 0 : d > 0.8 ? R.log[2] : (Math.floor(d * 4) & 1 ? R.log[5] : R.log[6]); };
function wallY(u, v, x, y, z) { return logShade(x, z, 3); }
function wallX(u, v, x, y, z) {                        // the gable, cut to the roofline
  const top = HS.ridge - (y > HS.yR ? y - HS.yR : (HS.yR - y) * 0.7); if (z >= top) return 0;
  if (z > HS.wall - 2) { const c = Math.floor(y * 1.4); return (c & 3) === 0 ? R.log[1] : R.log[3 + (hash3(c, 1, 7) > 0.5 ? 1 : 0)]; }   // boards in the gable
  return logShade(y, z, 8);
}
function windowDecal(c0, r0, w, h, trans) {            // panes, a transom bar, curtains tied at the sides
  const frame = R.log[1];
  return { c0, r1: r0 + h - 1, w, h, fn: (c, r) => {
    if (c === 0 || r === 0 || c === w - 1 || r === h - 1) return frame;
    if (r === trans) return frame;
    if (r < trans && c === (w >> 1)) return frame;
    const curtain = r < h * 0.55 ? 3 : 1;
    if ((c < 1 + curtain || c > w - 2 - curtain) && r > trans) return (c + r) % 4 < 2 ? P.red : P.wh;
    return r < 4 ? PANE.lite : r > h - 5 ? PANE.deep : PANE.mid;
  } };
}
function shutterDecal(c0, r0, w, h) {
  const heartR = ['.x.x.', 'xxxxx', '.xxx.', '..x..'];
  return { c0, r1: r0 + h - 1, w, h, fn: (c, r) => {
    if (r === 0 || r === h - 1 || c === 0 || c === w - 1) return SHUT[0];
    const hx = c - ((w - 5) >> 1), hy = r - 4;
    if (hx >= 0 && hx < 5 && hy >= 0 && hy < 4 && heartR[hy][hx] === 'x') return PANE.mid;
    return c % 2 ? SHUT[2] : SHUT[1];
  } };
}
function planks(u, v) {
  const row = Math.floor(v / 2.2), seam = v / 2.2 - row < 0.18, h = hash3(row, Math.floor(u / 7 + row * 1.7), 11);
  return seam ? R.wood[0] : R.wood[h > 0.7 ? 3 : 2];
}
function roofSnow(u, v, x, y) {
  const span = HS.y1 + HS.over - HS.yR, i = Math.floor(u * 2), j = Math.floor(v * 2), n = noise2(u / 8 + 2, v / 4 + 7) * 0.65 + noise2(u / 3 + 9, v / 1.8) * 0.35;
  if (v < 1.1) return R.snow[6];
  if (noise2(u / 13 + 11, v / 1.5 + 3) > 0.79 && v > 3 && v < span - 2.2) {                       // a few shingles showing through
    const row = Math.floor(v / 1.8), c = Math.floor(u / 2 + (row & 1) * 0.5), lip = v / 1.8 - row > 0.72;
    return R.wood[clamp(Math.round(1.6 + (hash3(c, row, 8) - 0.5) * 2 - (lip ? 1 : 0)), 0, 3)];
  }
  const tone = 3.6 + (n - 0.5) * 2.2 + (v / span) * 0.7 + (bay(i, j) / 16 - 0.5) * 0.5;
  return R.snow[clamp(Math.floor(tone), 1, 6)];
}
function stoneShade(u, v) {
  const r = Math.floor(v / 2.6), c = Math.floor(u / 1.9 + (r & 1) * 0.5), fu = (u / 1.9 + (r & 1) * 0.5) - c, fv = v / 2.6 - r;
  if (fu < 0.14 || fv < 0.16) return R.stone[0];
  return R.stone[1 + Math.floor(hash3(c, r, 12) * 3.2)];
}
const LAMP_POST = { x: 24, y: 18, z: 33 };
const LANTERN_POS = { x: 12, y: HS.y1 + 0.8, z: 25 };
function buildCabin() {
  const H = HS, W_ = H.x1 - H.x0, D_ = H.y1 - H.y0, wc = (a) => (a - H.x0) * 2;
  OBJ = objNew(); CABIN_OBJ.wall = OBJ;
  const trans = 3, winH = 19, winW = (H.win[1] - H.win[0]) * 2;
  const winMain = windowDecal(wc(H.win[0]), H.sill, winW, winH, trans);
  const win2 = windowDecal(wc(H.win2[0]), H.sill + 2, (H.win2[1] - H.win2[0]) * 2, 17, 5);
  const doorC = wc(H.door[0]), doorW = (H.door[1] - H.door[0]) * 2, doorH = 26, doorTop = H.deckZ + doorH - 1;
  const fc0 = wc(FLAP.x0) - doorC, fc1 = wc(FLAP.x1) - doorC, fr0 = doorTop - Math.ceil(FLAP.z1), fr1 = doorTop - Math.floor(FLAP.z0);
  const wreath = (c, r) => { const d = Math.hypot(c - (doorW >> 1) + 0.5, r - 7.5); if (d > 5.2 || d < 2.6) return 0; if (r === 12 && Math.abs(c - (doorW >> 1) + 0.5) < 2) return P.berry; return hash3(c, r, 44) > 0.8 ? P.berry : hash3(c, r, 45) > 0.5 ? P.holly : dk(P.holly); };
  const door = { c0: doorC, r1: doorTop, w: doorW, h: doorH, fn: (c, r) => {
    if (c === 0 || c === doorW - 1 || r === 0) return R.log[1];
    const wr = wreath(c, r); if (wr) return wr;
    if (c >= fc0 && c <= fc1 && r >= fr0 && r <= fr1) { if (c === fc0 || c === fc1 || r === fr0 || r === fr1) return R.log[0]; return r === fr0 + 1 ? R.log[2] : (c + (r >> 1)) % 5 === 0 ? R.log[3] : R.log[4]; }
    if (c === doorW - 3 && r === 13) return R.chink[2];
    if (c === doorW - 3 && r === 14) return R.log[6];
    return c % 4 === 1 ? DOORP[0] : r === 3 || r === 22 ? DOORP[1] : DOORP[2 + (hash3(c >> 2, 1, 46) > 0.6 ? 1 : 0)];
  } };
  const decals = [door, winMain, win2, shutterDecal(wc(H.win[0]) - 5, H.sill, 5, winH), shutterDecal(wc(H.win[1]), H.sill, 5, winH), shutterDecal(wc(H.win2[0]) - 3, H.sill + 2, 3, 17), shutterDecal(wc(H.win2[1]), H.sill + 2, 3, 17)];
  face('Y', H.x0, H.y1, 0, W_, H.wall, layered(wallY, decals));
  const winX = windowDecal(14, 12, 24, 17, 5);
  const atticR = 7, attic = { c0: Math.round((H.yR - H.y0) * 2 - atticR), r1: 43, w: atticR * 2 + 1, h: atticR * 2 - 1, fn: (c, r) => {
    const d = Math.hypot(c - atticR, r - atticR + 1); if (d > atticR - 0.3) return 0; if (d > atticR - 2) return R.log[1];
    if (c === atticR || r === atticR - 1) return R.log[1]; return r < atticR - 2 ? PANE.lite : PANE.mid;
  } };
  face('X', H.x1, H.y0, 0, D_, H.ridge + 1, layered(wallX, [winX, attic]));
  /* log ends crossing at the corners */
  const ringY = (u, v) => ringEnd(u, v, LOG_H / 2) || R.log[2], sideY = (u, v, x, y, z) => logShade(x, z, 3), sideX = (u, v, x, y, z) => logShade(y, z, 8);
  for (let k = 0; k * LOG_H < H.wall - 2; k++) {
    const z0 = k * LOG_H, z1 = z0 + LOG_H;
    OBJ = objNew();
    if (k & 1) {
      box(H.x1 - 2.4, H.y1 - 0.2, z0, H.x1 + 0.2, H.y1 + 2.6, z1, { y: ringY, x: sideX, t: R.log[4] });
      box(H.x0 - 0.2, H.y1 - 0.2, z0, H.x0 + 2.4, H.y1 + 2.6, z1, { y: ringY, x: sideX, t: R.log[4] });
    } else {
      box(H.x1 - 0.2, H.y1 - 2.4, z0, H.x1 + 2.6, H.y1 + 0.2, z1, { x: ringY, y: sideY, t: R.log[4] });
      box(H.x1 - 0.2, H.y0 - 0.2, z0, H.x1 + 2.6, H.y0 + 2.4, z1, { x: ringY, y: sideY, t: R.log[4] });
    }
  }
  /* the roof, snow on shingles, with a thick drifted edge along the eave and the rake */
  OBJ = objNew(); FLAG = F_NOOUT;
  const span = H.y1 + H.over - H.yR;
  slopeY(H.x0 - H.over, H.x1 + H.over, H.yR, H.y1 + H.over, H.ridge, -1, roofSnow);
  const yB = H.y0 - H.over; slopeY(H.x0 - H.over, H.x1 + H.over, yB, H.yR, H.ridge - 0.7 * (H.yR - yB), 0.7, () => R.snow[3]);
  FLAG = 0;
  const eaveZ = H.ridge - span, lip = (u) => 1.2 + 1.7 * noise2(u / 3.1, 4.4) + 0.8 * Math.abs(Math.sin(u * 0.9));
  OBJ = objNew();
  face('Y', H.x0 - H.over, H.y1 + H.over, eaveZ - 3.6, W_ + 2 * H.over, 4.4, (u, v) => { const l = 3.6 - lip(u); if (v < l - 0.9) return 0; if (v < l) return R.ice[0]; return R.snow[v > 3.2 ? 6 : v > 2 ? 5 : 4]; });
  const rakeTop = y => H.ridge - (y > H.yR ? y - H.yR : (H.yR - y) * 0.7);
  face('X', H.x1 + H.over, yB, eaveZ - 6, D_ + 2 * H.over, H.ridge - eaveZ + 8, (u, v, x, y, z) => { const top = rakeTop(y) + 0.8, d = top - z; if (d < 0) return 0; const l = 2.2 + 1.2 * noise2(y / 2.7, 8); if (d > l + 1.3) return 0; if (d > l) return R.log[1]; return R.snow[d < 0.8 ? 4 : d < 1.6 ? 3 : 2]; });
  /* stone chimney behind the ridge, with a snow cap */
  OBJ = objNew();
  box(19, -31, H.ridge - 12, 27, -24, H.ridge + 12, { t: (u, v) => (u > 1.6 && u < 6.4 && v > 1.4 && v < 5.6) ? P.ink : R.snow[5], y: (u, v, x, y, z) => (z > H.ridge + 10.6 ? R.snow[5] : stoneShade(u, v)), x: (u, v, x, y, z) => (z > H.ridge + 10.6 ? R.snow[3] : dk(stoneShade(u, v))) });
  /* the deck */
  OBJ = objNew();
  const dx0 = H.x0 - 1, dx1 = H.x1 + 3, deckEdge = (u, v, x) => { const n = noise2(x / 4, 5.1); return v > 2 - n * 0.9 ? R.snow[4] : R.wood[v > 1 ? 3 : 1]; };
  const deckTop = (u, v) => { const n = noise2(u / 6 + 5, v / 3.4), edge = Math.min(v, H.deck - v, u * 2, (dx1 - dx0 - u) * 2); if (edge + n * 4 < 2 && v > 1) return R.snow[3 + (n > 0.5 ? 1 : 0)]; return planks(u, v); };
  box(dx0, H.y1, 0, dx1, H.deckY, H.deckZ, { t: deckTop, y: deckEdge, x: R.wood[1] });
  foot(dx0, H.y1, dx1, H.deckY, 0, 0.6);
  OBJ = objNew();
  box(H.door[0] - 3, H.deckY, 0, H.door[1] + 3, H.deckY + 2.2, 2, { t: planks, y: R.wood[2], x: R.wood[1] });
  box(H.door[0] - 3, H.deckY + 2.2, 0, H.door[1] + 3, H.deckY + 4.4, 1, { t: planks, y: R.wood[2], x: R.wood[1] });
  /* doormat, and the rail along the front of the deck with a gap at the steps */
  OBJ = objNew(); face('T', H.door[0] + 0.4, H.y1 + 0.8, H.deckZ + 0.05, H.door[1] - H.door[0] - 0.8, 4.2, (u, v) => (Math.floor(u) + Math.floor(v * 1.4)) % 2 ? P.redD : P.red);
  const rail = (x0, y0, x1, y1) => { box(x0, y0, H.deckZ + 6, x1, y1, H.deckZ + 7, { t: R.snow[6], y: R.wood[3], x: R.wood[2] }); };
  const post = (x, y) => { OBJ = objNew(); box(x - 0.6, y - 0.6, H.deckZ, x + 0.6, y + 0.6, H.deckZ + 8, { t: R.snow[6], y: R.wood[3], x: R.wood[1] }); };
  const ry = H.deckY - 0.8;
  for (const x of [H.door[1] + 3, H.door[1] + 12, H.door[1] + 21, H.door[1] + 30, H.x1 + 2.4, H.door[0] - 3, H.x0]) post(x, ry);
  OBJ = objNew(); rail(H.door[1] + 3, ry - 0.4, H.x1 + 2.4, ry + 0.4); rail(H.x0, ry - 0.4, H.door[0] - 3, ry + 0.4);
  for (const y of [H.y1 + 6]) post(H.x1 + 2.4, y); OBJ = objNew(); box(H.x1 + 2, H.y1 + 1, H.deckZ + 6, H.x1 + 2.8, ry, H.deckZ + 7, { t: R.snow[6], y: R.wood[3], x: R.wood[2] });
  /* window sills with a little snow, a planter of pine sprigs under the second window */
  OBJ = objNew(); box(H.win[0] - 0.6, H.y1, H.sill - 1, H.win[1] + 0.6, H.y1 + 1.4, H.sill, { t: R.snow[6], y: R.log[2], x: R.log[1] });
  OBJ = objNew(); box(H.win2[0], H.y1, H.sill - 1, H.win2[1], H.y1 + 2, H.sill + 1.4, { t: (u, v) => hash3(Math.floor(u * 2), Math.floor(v * 2), 13) > 0.72 ? P.berry : hash3(Math.floor(u * 2), Math.floor(v * 2), 14) > 0.5 ? P.holly : dk(P.holly), y: R.log[3], x: R.log[1] });
  /* a little table at the end of the deck: a flask and a plate of cookies */
  const tb = [56.4, -5];
  OBJ = objNew(); cyl(tb[0], tb[1], H.deckZ, 0.7, 7, R.wood[2], 0);
  OBJ = objNew(); cyl(tb[0], tb[1], H.deckZ + 7, 3.2, 0.8, R.wood[1], (r, a) => (r > 0.8 ? R.wood[2] : R.wood[3]));
  OBJ = objNew(); cyl(tb[0] - 1, tb[1] + 0.6, H.deckZ + 7.8, 1, 5, (a, v) => (v > 3.4 ? R.stone[4] : Math.cos(a) > 0 ? P.redL : P.red), R.stone[3]);
  OBJ = objNew(); cyl(tb[0] + 1.2, tb[1] - 0.4, H.deckZ + 7.8, 1.5, 0.4, R.snow[6], (r, a) => (r < 0.6 && a > -2 ? R.log[2] : R.snow[6]));
  /* lantern bracket */
  OBJ = objNew(); face('Y', LANTERN_POS.x - 1.5, H.y1 + 0.5, 27.5, 3, 1, R.log[0]);
  /* firewood against the gable, under the eave */
  OBJ = objNew();
  for (let k = 0; k < 10; k++) { const row = k < 4 ? 0 : k < 7 ? 1 : k < 9 ? 2 : 3, y = -31 + (k < 4 ? k : k < 7 ? k - 3.5 : k < 9 ? k - 6 : 1.5) * 3.2, z = 1.8 + row * 3; box(H.x1 + 3, y - 1.4, z - 1.6, H.x1 + 8, y + 1.4, z + 1.4, { t: row === 3 || k === 6 || k === 8 ? R.snow[5] : R.log[3], y: R.log[3], x: (u, v) => Math.hypot(u - 1.4, v - 1.5) < 1.1 ? R.log[5] : R.log[2] }); }
  foot(H.x1, -34, H.x1 + 8, -16, 0, 0.5);
  /* lamp post by the snowman */
  OBJ = objNew();
  box(LAMP_POST.x - 0.6, LAMP_POST.y - 0.6, 0, LAMP_POST.x + 0.6, LAMP_POST.y + 0.6, LAMP_POST.z - 3, { t: 0, y: R.stone[0], x: dk(R.stone[0]) });
  box(LAMP_POST.x - 1, LAMP_POST.y - 1, 0, LAMP_POST.x + 1, LAMP_POST.y + 1, 3, { t: R.snow[5], y: R.stone[1], x: R.stone[0] });
  foot(LAMP_POST.x - 1.2, LAMP_POST.y - 1.2, LAMP_POST.x + 1.2, LAMP_POST.y + 1.2, 0, 0.7);
  /* a split-rail fence running off to the right of the yard, snow along the rails */
  const rail2 = (x0, y0, x1, y1) => { const n = Math.hypot(x1 - x0, y1 - y0), k = Math.round(n / 7.5); for (let q = 0; q <= k; q++) { const x = lerp(x0, x1, q / k), y = lerp(y0, y1, q / k), z = GZ(x, y); OBJ = objNew(); box(x - 0.6, y - 0.6, z, x + 0.6, y + 0.6, z + 9, { t: R.snow[6], y: R.wood[3], x: R.wood[1] }); foot(x - 1, y - 1, x + 1, y + 1, 0, 0.5);
      if (q < k) { const xb = lerp(x0, x1, (q + 1) / k), yb = lerp(y0, y1, (q + 1) / k), zb = GZ(xb, yb); OBJ = objNew(); for (const dz of [4, 7.4]) box(Math.min(x, xb) - 0.3, Math.min(y, yb) - 0.3, Math.min(z, zb) + dz, Math.max(x, xb) + 0.3, Math.max(y, yb) + 0.3, Math.max(z, zb) + dz + 0.9, { t: R.snow[6], y: R.wood[3], x: R.wood[2] }); } } };
  rail2(H.x1 + 8, H.deckY + 2, H.x1 + 48, H.deckY + 2); rail2(H.x1 + 48, H.deckY + 2, H.x1 + 48, H.deckY - 44);
  SHADOW_BOX.push([H.x0, H.y0, H.x1, H.y1, H.wall], [H.x0, H.yR - 7, H.x1, H.yR + 7, H.ridge - 7], [dx0, H.y1, dx1, H.deckY, H.deckZ]);
  foot(H.x0, H.y0, H.x1, H.y1, 0, 1);
}
/* after the static world is drawn, remember which pixels are the big window's glass */
function bakeWindowMask() {
  for (let p = 0; p < NPIX; p++) if (S.obj[p] === CABIN_OBJ.wall && S.wx[p] > HS.win[0] && S.wx[p] < HS.win[1] && PANE_SET.includes(S.idx[p])) WIN_MASK[p] = 1;
}
