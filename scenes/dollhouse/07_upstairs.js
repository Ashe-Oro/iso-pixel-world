/* =====================================================================
   Upper floor: girl's bedroom (x 0..76) + attic loft (x 76..120, z 68),
   and exterior garden props.
   ===================================================================== */
function wallDecalY(x0, zTop, spr, y0 = 0.04) {      // decal on a +y facing wall at plane y0
  face('Y', x0, y0, zTop - spr.h, spr.w / 2, spr.h, (u, v) => { const c = Math.floor(u * 2), r = spr.h - 1 - Math.floor(v); return (c >= 0 && c < spr.w && r >= 0 && r < spr.h) ? spr.d[r * spr.w + c] : 0; });
}
function wallDecalX(yLeft, zTop, spr, x0 = 0.04) {   // decal on a +x facing wall; yLeft = y at the decal's screen-left edge
  face('X', x0, yLeft - spr.w / 2, zTop - spr.h, spr.w / 2, spr.h, (u, v, x, y) => { const c = Math.floor((yLeft - y) * 2), r = spr.h - 1 - Math.floor(v); return (c >= 0 && c < spr.w && r >= 0 && r < spr.h) ? spr.d[r * spr.w + c] : 0; });
}

function buildUpstairs() {
  const Z = HS.uz;
  ROOM = R_BED; FLAG = 0;
  /* ---- round rug ---- */
  OB(() => { FLAG = F_NOOUT; face('T', 19, 10, Z + 0.12, 20, 16, (u, v) => { const d = Math.hypot((u - 10) / 10, (v - 8) / 8); if (d > 1) return 0; const k = Math.floor(d * 6);
    return [P.cr3, P.vi4, P.ro4, P.vi4, P.cr2, P.vi3][k]; }); FLAG = 0; });
  /* ---- window seat ---- */
  OB(() => fbox(0, 6, Z, 8, 26, Z + 7, P.cr3, (f, u, v, x, y, z) => f === 'x' && (md(Math.floor((26 - y) * 2), 13) === 0 || z < Z + 1) ? P.cr1 : (f === 'x' && z > Z + 3 && z < Z + 4 && md(Math.floor((26 - y) * 2), 13) === 6) ? P.gd2 : 0));
  OB(() => fbox(0, 6, Z + 7, 8.4, 26, Z + 9.5, P.ro3, (f, u, v, x, y) => (f === 't' || f === 'x') && md(Math.floor(y), 4) < 2 ? P.cr2 : 0));
  OB(() => stampS(pillowSpr(P.te2, (x, y) => (x + y) % 3 === 0 ? P.te3 : 0), 2.5, 9.6, Z + 9.5, -0.4));
  OB(() => stampS(pillowSpr(P.hn2, (x, y) => (y === 3 || y === 4) && x > 1 && x < 6 ? P.cr3 : 0), 2.5, 22.6, Z + 9.5, 0.4));
  foot(0, 6, 8.4, 26, Z, 1);
  ANCH.windowSeat = { x: 9.5, y: 16, z: Z, seatZ: Z + 9.5 };
  ANCH.windowBed = { y0: 8, y1: 24, z0: 66, z1: 92 };
  /* ---- desk + chair ---- */
  for (const [lx, ly] of [[9.5, 0.5], [21.5, 0.5], [9.5, 6], [21.5, 6]]) OB(() => box(lx, ly, Z, lx + 1, ly + 1, Z + 12, { t: P.wd4, y: P.wd4, x: P.wd3 }));
  OB(() => fbox(9, 0, Z + 12, 23, 7.5, Z + 13.5, P.wd5));
  OB(() => fbox(10, 0, Z + 9, 22, 7, Z + 12, P.wd4, (f, u, v, x) => f === 'y' && Math.abs(x - 16) < 1 && v > 1 && v < 2 ? P.gd2 : 0));
  foot(9, 0, 23, 7.5, Z, 0.8);
  OB(() => stampS(SP.lampDesk, 20.6, 2.6, Z + 13.5)); ANCH.deskLamp = { x: 19.6, y: 3, z: Z + 20 };
  OB(() => stampS(SP.crayons, 11.6, 3, Z + 13.5));
  OB(() => face('T', 13.5, 2.2, Z + 13.56, 4.5, 4, (u, v) => { const k = hash3(Math.floor(u * 2), Math.floor(v * 2), 4); if (u < 0.3 || v < 0.3) return P.cr2; return k > 0.86 ? P.ro2 : k > 0.8 ? P.mb4 : k > 0.75 ? P.lf3 : P.wh; }));
  OB(() => stampS(SP.bookStack, 10.8, 5.6, Z + 13.5));
  const chairW = P.wd5;
  for (const [lx, ly] of [[13.6, 9], [17.6, 9], [13.6, 13], [17.6, 13]]) OB(() => box(lx, ly, Z, lx + 0.6, ly + 0.6, Z + 7, { t: chairW, y: chairW, x: P.wd4 }));
  OB(() => fbox(13.4, 8.8, Z + 7, 18.4, 13.8, Z + 8, chairW, (f, u, v) => f === 't' && u > 0.5 && v > 0.5 && u < 4.5 && v < 4.5 ? P.sg4 : 0));
  OB(() => box(13.4, 13.4, Z + 8, 18.4, 14, Z + 17, { t: chairW, y: (u, v) => (v > 6 || u < 0.6 || u > 4.4) ? chairW : (v > 3 && v < 4.5 ? P.wd4 : 0), x: P.wd4 }));
  foot(13.4, 8.8, 18.4, 14, Z, 0.5);
  /* ---- bed ---- */
  const bx0 = 38, bx1 = 63, by1 = 14;
  for (const [lx, ly] of [[39.5, 0.2], [60.5, 0.2], [39.5, 12.6], [60.5, 12.6]]) OB(() => box(lx, ly, Z, lx + 1.2, ly + 1.2, Z + 3, { t: P.cr2, y: P.cr2, x: P.cr1 }));
  OB(() => fbox(39.5, 0, Z + 3, 61.5, by1, Z + 6.5, P.cr2));
  const quiltCols = [P.ro3, P.hn2, P.sg4, P.te3, P.cr3, P.vi4, P.pe1, P.ro4, P.tc3];
  const patch = (a, b) => { const ia = Math.floor(a / 3), ib = Math.floor(b / 3), fa = a - ia * 3, fb = b - ib * 3;
    if ((fa < 0.35 || fb < 0.35) && md(Math.floor(a * 2 + b * 2), 2)) return P.wh;
    const c = quiltCols[Math.floor(hash2(ia * 7 + 3, ib * 13 + 1) * quiltCols.length)];
    if (md(ia + ib, 3) === 0 && Math.abs(fa - 1.5) + Math.abs(fb - 1.5) < 0.8) return P.cr3;
    return c; };
  OB(() => box(39.5, 0, Z + 6.5, 61.5, by1 + 0.6, Z + 10.5, {
    t: (u, v, x, y) => x < 45.5 ? P.cr3 : x < 47.4 ? (x < 46 ? P.cr1 : P.wh) : patch(x, y),
    y: (u, v, x, y, z) => { if (x < 45.5) return v > 3 ? P.cr2 : P.cr1; const sc = 0.4 + 0.6 * Math.abs(Math.sin(x * 1.1)); if (v < sc) return 0; if (v < sc + 0.7) return P.ro1; return dk(patch(x, z * 1.4)); },
    x: (u, v, x, y, z) => dk(patch(y + 40, z * 1.4))
  }));
  OB(() => fbox(40, 1.5, Z + 10.5, 45, 12.5, Z + 13, P.wh, (f, u, v) => f === 'y' && v < 0.8 ? P.cr2 : 0));
  OB(() => box(bx0, 0, Z, bx0 + 1.5, by1, Z + 19, {
    t: P.wh, x: (u, v) => { const r = Math.hypot((u - 7) * 1.8, v - 14.5); if (r < 2.2) return (u > 6) ? P.ro3 : P.ro2; if (v > 17.6) return P.wh; if (u < 0.6 || u > 13.4) return P.cr2; return md(Math.floor(u * 2), 5) === 0 ? P.cr1 : P.cr3; }, y: P.cr2 }));
  OB(() => box(61.5, 0, Z, 63, by1, Z + 12, { t: P.wh, x: (u, v) => (v > 10.5 || u < 0.6 || u > 13.4 || md(Math.floor(u * 2), 4) === 0) ? P.cr3 : P.cr1, y: P.cr2 }));
  foot(38, 0, 63, by1 + 0.6, Z, 1);
  OB(() => stampS(SP.bunny, 42.6, 4, Z + 12.5)); OB(() => stampS(SP.bear, 43.2, 9.6, Z + 12));
  ANCH.bed = { x: 50, y: 7, z: Z + 10.5 };
  /* ---- toy cubby shelf + night light ---- */
  OB(() => box(65, 0, Z, 74, 6, Z + 18, { t: P.wh,
    y: (u, v, x, y, z) => { const cx = md(x - 65, 4.5), cz = z - Z; if (cx >= 0.6 && cx <= 3.9 && cz >= 1 && cz <= 17 && md(cz, 8.5) >= 1) return 0; return cz > 17 ? P.wh : (cx < 0.6 ? P.cr3 : P.cr2); },
    x: P.cr1 }));
  OB(() => { face('Y', 65, 0.06, Z, 9, 18, P.cr0); face('T', 65, 0, Z + 1, 9, 6, P.cr1); face('T', 65, 0, Z + 9.5, 9, 6, P.cr1);
    face('X', 65.6, 0, Z, 6, 18, P.cr0); face('X', 70.1, 0, Z, 6, 18, P.cr0); });
  OB(() => stampS(SP.robot, 67.2, 4.5, Z + 1)); OB(() => stampS(SP.blocks, 71.6, 4.5, Z + 1));
  booksX(65.8, 69, 1, 5, Z + 9.5, 6, 31); OB(() => stampS(SP.ball, 71.6, 4, Z + 9.5));
  OB(() => stampS(SP.star, 69.5, 3, Z + 18)); ANCH.nightLight = { x: 69.5, y: 3, z: Z + 20 };
  foot(65, 0, 74, 6, Z, 1);
  /* ---- stair hole railing ---- */
  const Ho = HS.hole, rw = P.wd4;
  const post = (x, y) => OB(() => { box(x - 0.6, y - 0.6, Z, x + 0.6, y + 0.6, Z + 12, { t: P.wd5, y: rw, x: P.wd3 }); cyl(x, y, Z + 12, 0.8, 1.2, (a) => cylShade(a, P.wd5), P.wd6); });
  post(Ho.x0, Ho.y0); post(Ho.x1, Ho.y0); post(Ho.x0, Ho.y1 + 0.6);
  for (let x = Ho.x0 + 2; x < Ho.x1 - 0.5; x += 2) OB(() => box(x - 0.25, Ho.y0 - 0.25, Z, x + 0.25, Ho.y0 + 0.25, Z + 11, { t: rw, y: rw, x: P.wd3 }));
  for (let y = Ho.y0 + 2; y < Ho.y1; y += 2) OB(() => box(Ho.x0 - 0.25, y - 0.25, Z, Ho.x0 + 0.25, y + 0.25, Z + 11, { t: rw, y: rw, x: P.wd3 }));
  OB(() => box(Ho.x0, Ho.y0 - 0.5, Z + 11, Ho.x1, Ho.y0 + 0.5, Z + 12, { t: P.wd5, y: rw, x: P.wd3 }));
  OB(() => box(Ho.x0 - 0.5, Ho.y0, Z + 11, Ho.x0 + 0.5, Ho.y1 + 0.6, Z + 12, { t: P.wd5, y: rw, x: P.wd3 }));
  /* ---- floor toys ---- */
  OB(() => stampS(SP.bear, 21, 23, Z)); OB(() => stampS(SP.blocks, 33.5, 25, Z)); OB(() => stampS(SP.ball, 46, 18.6, Z));
  const dh = smap(['...rr...', '..rrrr..', '.rrRRrr.', 'rrrrrrrr', '.cchhcc.', '.cbccbc.', '.ccnncc.', '.ccnncc.'], { ...SP.L, b: P.mb5 }, 4);
  OB(() => stampS(dh, 6.5, 28.5, Z));
  /* ---- wall art: drawings, garland wire, mobile hook ---- */
  ROOM = R_BED;
  for (const [x, zt, s] of [[10.5, 84, SP.drawSun], [16.6, 82, SP.drawHouse], [41.5, 83, SP.drawDog], [48.2, 85, SP.drawCat], [53.6, 83, SP.drawRainbow], [59.8, 84, SP.drawGirl], [67, 85, SP.drawHouse]])
    OB(() => wallDecalY(x, zt, s));
  OB(() => wallDecalX(31, 88, SP.picFlower));
  ANCH.fairy = []; ANCH.fairyWire = [];
  { // swags along the back wall: sample a catenary-ish curve
    const pins = [2, 14, 25, 37, 50, 62, 74];
    for (let k = 0; k + 1 < pins.length; k++) { const a = pins[k], b = pins[k + 1];
      for (let x = a; x <= b; x += 0.5) { const t = (x - a) / (b - a), z = 88 - Math.sin(t * Math.PI) * 4; ANCH.fairyWire.push([x, z]); }
      for (let q = 1; q <= 3; q++) { const t = q / 4, x = a + (b - a) * t, z = 88 - Math.sin(t * Math.PI) * 4 - 1; ANCH.fairy.push({ x, y: 0.2, z, k: ANCH.fairy.length }); } }
    const wire = new Set(ANCH.fairyWire.map(([x, z]) => Math.floor(x * 2) + ',' + Math.floor(z)));
    OB(() => face('Y', 0, 0.05, 80, 76, 10, (u, v, x, y, z) => wire.has(Math.floor(x * 2) + ',' + Math.floor(z)) ? P.ink3 : 0));
  }
  ANCH.mobile = { x: 6, y: 16, z: 104 };
  /* ================= attic loft ================= */
  ROOM = R_ATT; const A = HS.attz;
  const cardboard = (x0, y0, z0, x1, y1, z1, label) => OB(() => fbox(x0, y0, z0, x1, y1, z1, P.wd5, (f, u, v, x, y, z, AA, BB) => {
    if (f === 't') return Math.abs(v - BB / 2) < 0.5 ? P.cr0 : (u > AA - 0.6 ? P.wd6 : P.wd5);
    if (f === 'y' && Math.abs(u - AA / 2) < 0.5 && v > BB - 3) return P.cr1;
    if (f === 'y' && label && v > 2 && v < 4 && u > 1.5 && u < AA - 2 && md(Math.floor(u * 2), 2)) return P.wd2;
    if (f === 'x' && Math.abs(u - AA / 2) < 0.5 && v > BB - 3) return P.cr0;
    return f === 'y' ? P.wd4 : f === 'x' ? P.wd3 : 0; }));
  cardboard(106, 2, A, 117, 12, A + 8, true); cardboard(107.5, 3, A + 8, 115, 10, A + 14, false); cardboard(109, 4.5, A + 14, 113.5, 8.5, A + 18, true);
  cardboard(77.5, 1.5, A, 85, 9, A + 6, true);
  OB(() => stampS(smap(['.s....', 'sss.n.', '.s..n.', '...nnn'], { s: P.sk2, n: P.wd3 }, 3), 81, 5, A + 6));
  foot(106, 2, 117, 12, A, 1); foot(77.5, 1.5, 85, 9, A, 1);
  // steamer trunk
  OB(() => fbox(87, 1.5, A, 98.5, 9, A + 8.5, P.te1, (f, u, v, x, y, z, AA, BB) => {
    const band = (q) => md(q, 4.5) < 0.6;
    if (f === 't') return (band(u + 1) ? P.wd3 : (u > AA - 0.6 || v > BB - 0.6) ? P.gd1 : P.te2);
    if (f === 'y') { if (band(u + 1)) return P.wd3; if ((u < 0.8 || u > AA - 0.8) && (v < 1 || v > BB - 1)) return P.gd2; if (v > 5.4 && v < 6) return P.gd1; if (Math.abs(u - AA / 2) < 0.6 && v > 4.2 && v < 5.6) return P.gd2; return 0; }
    if (f === 'x') return band(u + 1) ? P.wd2 : 0; return 0; }));
  foot(87, 1.5, 98.5, 9, A, 1);
  OB(() => stampS(SP.teddyOld, 90, 5, A + 8.5));
  ANCH.jar = { x: 95.6, y: 5.2, z: A + 8.5 };
  OB(() => stampS(smap(['.kkk.', 'a...a', 'a...a', 'a...a', 'a...a', '.aaa.'], { k: P.wd3, a: P.ml1 }, 2), 95.6, 5.2, A + 8.5, 0, F_NOOUT));
  // telescope + rocking horse + frames
  OB(() => stampS(SP.telescope, 102, 7.5, A));
  const horse = smap([
    '..hh............', '.hhhhr...........', 'hhohhrr.........', 'hhhhhhrr........', 'Hh.hhhhrr.......', '...hhhhhhhhhhh..', '...hhhhhhhhhhhhy', '....hhhhhhhhhh.y',
    '....hHhh..hhHh..', '....h.h....h.h..', '....h.h....h.h..', '...h...h..h...h.', 'nnnnnnnnnnnnnnnnn', '.nnnnnnnnnnnnnnn.'
  ], { h: P.cr2, H: P.cr0, o: P.ink, r: P.ro2, y: P.ro3, n: P.ro1 }, 8);
  OB(() => stampS(horse, 111, 22, A, -0.4));
  OB(() => fbox(96, 19, A, 105, 25, A + 3.2, P.tc1, (f, u, v) => f === 'y' && Math.abs(u - 4.5) < 0.5 ? P.gd1 : 0));
  OB(() => fbox(97, 19.5, A + 3.2, 104, 24.5, A + 6, P.te1, (f, u, v) => f === 'y' && v > 1 && v < 1.8 ? P.wd3 : 0));
  OB(() => box(99.5, 21.6, A + 6, 101.5, 22.2, A + 7, { t: P.wd2, y: P.wd2, x: P.wd1 }));
  foot(96, 19, 105, 25, A, 1);
  { const bunt = new Spr(84, 6); const cols = [P.ro3, P.hn2, P.te3, P.cr3, P.vi4];
    for (let x = 0; x < 84; x++) { const y = Math.round(Math.sin(x / 83 * Math.PI) * 2.5); bunt.px(x, y, P.ink3);
      if (x % 7 === 2) { const c = cols[(x / 7 | 0) % cols.length]; for (let k = 0; k < 3; k++) for (let q = -2 + k; q <= 2 - k; q++) bunt.px(x + 2 + q, y + 1 + k, c); } }
    OB(() => wallDecalY(77.5, 89, bunt)); }
  OB(() => stampS(smap(['nnnnnn.', 'nbbbbn.', 'nbccbnn', 'nbbbbnm', 'nnnnnnm', '.mmmmmm'], { ...SP.L, b: P.vi3, c: P.hn3 }, 3), 80.5, 12, A));
  // wall: mouse hole, treasure map, cobwebs
  OB(() => wallDecalY(81.6, A + 3, smap(['.oo.', 'oooo', 'oooo'], { o: P.ink })));
  ANCH.mouse = { x: 82.6, y: 0.3, z: A };
  OB(() => wallDecalY(84, A + 18, SP.map));
  const web = new Spr(10, 8); web.line(9, 0, 0, 7, P.cr0); web.line(9, 0, 4, 7, P.cr0); web.line(9, 0, 9, 7, P.cr0);
  for (let k = 2; k < 8; k += 2) { web.line(9 - k, Math.min(7, k * 0.8), 9, k, P.cr1); }
  OB(() => wallDecalY(109, 90, web)); OB(() => wallDecalY(76.5, 90, web.flip()));
  ANCH.bulb = { x: 97, y: 15, z: 120, len: 22 };
  ANCH.roundWin = { x0: 96, x1: 106, z0: 74, z1: 90 };
  ROOM = R_EXT;
}

function buildExterior() {
  ROOM = R_EXT; FLAG = F_EXT;
  const I = HS.isl;
  /* street lamp */
  OB(() => cyl(129, 13, I.z, 1.5, 2.2, (a) => cylShade(a, P.ch2), P.ch3));
  OB(() => box(128.6, 12.6, I.z + 2.2, 129.4, 13.4, 46, { t: P.ch2, y: P.ch2, x: P.ch1 }));
  OB(() => box(127.6, 11.6, 46, 130.4, 14.4, 52, { t: P.ch1, y: (u, v) => (u < 0.5 || u > 2.3 || v < 0.6) ? P.ch1 : CE('#ffd98a'), x: (u, v) => (u < 0.5 || u > 2.3 || v < 0.6) ? P.ch0 : CE('#f2b85a') }));
  OB(() => box(127.2, 11.2, 52, 130.8, 14.8, 53, { t: P.ch2, y: P.ch1, x: P.ch0 }));
  OB(() => box(128.5, 12.5, 53, 129.5, 13.5, 55, { t: P.ch2, y: P.ch1, x: P.ch0 }));
  ANCH.streetlamp = { x: 129, y: 13, z: 49 };
  /* rain barrel under the downspout */
  OB(() => cyl(126.5, -2.6, I.z, 2.5, 9, (a, v) => (Math.abs(v - 2) < 0.5 || Math.abs(v - 7) < 0.5) ? P.ch3 : (md(Math.floor(a * 8), 2) ? P.wd3 : cylShade(a, P.wd2)),
    (r) => { if (r > 0.85) return P.wd4; FLAG = F_EXT | F_WATER; return P.mb3; }));
  FLAG = F_EXT;
  /* flowers along the right wall */
  const flower = (c) => smap(['.c.', 'cyc', '.l.', '.l.'], { c, y: P.hn3, l: P.lf2 }, 1);
  const tulip = (c) => smap(['c.c', 'ccc', '.l.', 'll.'], { c, l: P.lf3 }, 1);
  const fl = [flower(P.ro4), tulip(P.ro2), flower(P.cr3), tulip(P.hn2), flower(P.vi4), tulip(P.tc3)];
  for (let k = 0; k < 9; k++) { const y = 6 + k * 2.8; OB(() => stampS(fl[k % fl.length], 124.6, y, I.z)); }
  /* ivy on the exterior wall */
  const ivy = new Spr(30, 40), r = mulberry32(5);
  let px = 22, py = 39; for (let k = 0; k < 60; k++) { px += Math.round((r() - 0.5) * 2); py -= r() < 0.7 ? 1 : 0; if (py < 2) break; ivy.px(px, py, P.lf1); if (r() < 0.5) { ivy.px(px + 1, py, P.lf2); ivy.px(px + 1, py - 1, P.lf3); } if (r() < 0.3) { ivy.px(px - 1, py, P.lf2); ivy.px(px - 2, py, P.lf1); } }
  OB(() => wallDecalX(33, 40, ivy, HS.W + 3.04));
  /* mailbox, gnome and mushrooms on the front lawn */
  OB(() => box(129.2, 73.6, I.z, 129.8, 74.2, I.z + 9, { t: P.wd3, y: P.wd3, x: P.wd2 }));
  OB(() => fbox(127.8, 72.6, I.z + 9, 131, 75.2, I.z + 12.5, P.ro1, (f, u, v) => f === 'y' && v > 1 && v < 2.5 && u > 0.8 && u < 2.4 ? P.ro0 : 0));
  OB(() => box(130.8, 72.9, I.z + 11, 131.2, 73.3, I.z + 15, { t: P.hn2, y: P.hn2, x: P.hn1 }));
  OB(() => stampS(SP.gnomeHat, -2.6, 75.2, I.z)); OB(() => stampS(SP.mushrooms, 3, 76, I.z)); OB(() => stampS(SP.mushrooms, 60, 76.4, I.z));
  OB(() => stampS(smap(['.l.l..', 'lLlLl.', '.l.l.l'], SP.L, 3), 40, 76.5, I.z)); OB(() => stampS(smap(['l.l.', 'lLlL', '.l.l'], SP.L, 2), 110, 76.2, I.z));
  FLAG = 0;
}
