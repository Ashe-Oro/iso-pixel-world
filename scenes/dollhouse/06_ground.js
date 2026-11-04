/* =====================================================================
   Ground floor furnishing: living room + kitchen.
   Living: x 0..64, y 32..72 | Kitchen: x 67..120, y 32..72 | floor z=0
   ===================================================================== */
const ANCH = {};   // anchor points used by animated props & behaviours

function pillowSpr(base, pat) {
  const s = new Spr(8, 8), hi = lt(base), lo = dk(base);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const corner = (x === 0 || x === 7) && (y === 0 || y === 7); if (corner) continue;
    const edge = x === 0 || x === 7 || y === 0 || y === 7;
    let c = pat ? pat(x, y) : 0; if (!c) c = base;
    if (edge) c = (x === 7 || y === 7) ? dk(lo) : lo; else if (x + y < 4) c = hi;
    s.px(x, y, c);
  }
  s.ax = 3; s.ay = 7; return s;
}

function buildLiving() {
  ROOM = R_LIV; FLAG = 0;
  /* ---- rug ---- */
  OB(() => { FLAG = F_NOOUT; face('T', 18, 40, 0.12, 30, 28, (u, v) => {
    if (u < 1 || u >= 29) return (Math.floor(v * 2) & 1) ? P.cr2 : 0;              // fringe
    const e = Math.min(u - 1, 28 - (u - 1) - 0.001, v, 28 - v);
    if (e < 0.6) return P.tc1;
    if (e < 2.6) return (md(Math.floor(u + v), 4) === 0) ? P.cr2 : P.tc2;
    if (e < 3.2) return P.ro1;
    const du = Math.abs(u - 15) / 9, dv = Math.abs(v - 14) / 8, d = du + dv;
    if (d < 0.25) return P.sg3; if (d < 0.5) return P.tc3; if (d < 0.62) return P.ro2; if (d < 0.75) return P.cr1;
    const lu = md(u - 3, 6), lv = md(v - 3, 6);
    if (Math.abs(lu - 3) + Math.abs(lv - 3) < 1.1) return P.ro3;
    return P.cr2;
  }); FLAG = 0; });
  foot(18, 40, 48, 68, 0, 0.15);
  /* ---- sofa (against left wall, facing +x) ---- */
  const sb = P.ro2;
  for (const [fx, fy] of [[1.5, 41.5], [14.5, 41.5], [1.5, 63.5], [14.5, 63.5]]) OB(() => box(fx, fy, 0, fx + 1, fy + 1, 1.6, { t: P.wd2, y: P.wd1, x: P.wd0 }));
  OB(() => fbox(1.5, 41.5, 1.6, 15.5, 64.5, 7, P.ro1, (f, u, v, x, y, z, A, B) => f !== 't' && v > B - 1.2 ? P.ro2 : 0));
  OB(() => fbox(1.5, 44.5, 7, 5.5, 61.5, 22, sb, (f, u, v, x, y, z, A, B) => {
    if (f === 'x') { const tu = md(Math.floor(u * 2), 8), tv = md(Math.floor(v), 5); if (v > B - 1.5) return lt(sb); if (tu === 4 && tv === 2) return P.ro0; if ((tu === 3 || tu === 5) && tv === 2) return dk(sb); if (u < 0.5) return dk(sb); return 0; }
    if (f === 't') return u > 3 ? lt(sb, 2) : lt(sb); return 0; }));
  const arm = (y0, y1, throwBlanket) => OB(() => fbox(1.5, y0, 4, 15.5, y1, 15.5, sb, (f, u, v, x, y, z, A, B) => {
    if (throwBlanket && x > 6 && x < 13) {
      const cable = md(Math.floor(u * 2) + Math.floor(v), 4) === 0 ? P.cr1 : P.cr2;
      if (f === 't') return (u > A - 0.6) ? P.cr3 : cable;
      if (f === 'y') { if (v < 1.5) return md(Math.floor(x * 2), 2) ? P.cr1 : 0; return cable; }
    }
    if (f === 'x') { const cy = (y0 + y1) / 2, r = Math.hypot((y - cy) * 1.8, z - 12.5); if (r < 1.2) return P.ro0; if (r < 2.6) return dk(sb); if (r < 3.4) return lt(sb); if (v > B - 1) return sb; return 0; }
    if (f === 't') return (v > 0.6 && v < A - 0.6) ? lt(sb, 2) : lt(sb);
    return 0; }));
  arm(41.5, 44.5, false); arm(61.5, 64.5, true);
  const cushion = (y0, y1) => OB(() => fbox(5.5, y0, 7, 15.5, y1, 11, P.ro3, (f, u, v, x, y, z, A, B) => {
    if (f === 't') { if (u > A - 1.2) return lt(P.ro3); if (v < 0.5 || v > B - 0.5) return P.ro2; return (md(Math.floor(u * 2) + Math.floor(v * 2), 9) === 0) ? lt(P.ro3) : 0; }
    if (f === 'x') { if (v > B - 0.8) return lt(P.ro3, 2); if (v < 0.8) return P.ro1; return P.ro2; }
    return 0; }));
  cushion(44.5, 53); cushion(53, 61.5);
  foot(1.5, 41.5, 15.5, 64.5, 0, 1);
  OB(() => stampS(pillowSpr(P.tc2, (x, y) => (y === 2 || y === 5) ? P.cr2 : 0), 7.5, 47.8, 11, 0.5));
  OB(() => stampS(pillowSpr(P.sg3, (x, y) => (Math.abs(x - 3.5) + Math.abs(y - 3.5) < 1.6) ? P.cr2 : (x === 3 || x === 4) && (y === 3 || y === 4) ? P.hn2 : 0), 7.5, 58.6, 11, -0.5));
  ANCH.sofaSeat = { x: 15, y: 52.5, z: 0, seatZ: 11 };
  /* ---- floor lamp (back-left) ---- */
  OB(() => cyl(4, 37.5, 0, 2, 0.9, (a) => cylShade(a, P.gd1), P.gd2));
  OB(() => box(3.7, 37.2, 0.9, 4.3, 37.8, 30, { t: P.gd2, y: P.gd1, x: P.gd0 }));
  OB(() => cyl(4, 37.5, 29, 3.7, 7, (a, v) => (md(Math.floor(a * 6), 2) ? CE('#f4d79c') : CE('#e8bd7c')), (r) => r > 0.78 ? P.cr2 : CE('#fff0c8')));
  ANCH.floorLamp = { x: 4, y: 37.5, z: 32 };
  /* ---- fireplace ---- */
  const brick = (a, z) => { const r = Math.floor(z / 2), off = (r & 1) ? 1.5 : 0, k = Math.floor((a + off) / 3);
    if (md(Math.floor(z), 2) === 0 || md(Math.floor((a + off) * 2), 6) === 0) return P.bk0; const h = hash3(k, r, 71); return h > 0.8 ? P.bk3 : h > 0.4 ? P.bk2 : P.bk1; };
  const fbx0 = 25, fbx1 = 35, fbh = 13;
  const inOpen = (x, z) => x >= fbx0 && x < fbx1 && z < fbh - 2 + 2 * Math.sqrt(Math.max(0, 1 - ((x - 30) / 5) ** 2));
  OB(() => box(21, 32, 0, 39, 36, 26.5, {
    t: P.cr2,
    y: (u, v, x, y, z) => { if (inOpen(x, z)) return 0; if (inOpen(x, z - 1.2) || inOpen(x - 0.6, z) || inOpen(x + 0.6, z)) return P.bk0;
      if (z > 24.5) return P.cr3; if (z > 23.5) return P.cr1; if (x < 22 || x > 38) return P.cr1;
      if (x > 23 && x < 37 && z > 15 && z < 22 && (x < 23.6 || x > 36.4 || z < 15.8 || z > 21.2)) return P.cr1;
      return P.cr2; },
    x: (u, v) => v > 24.5 ? P.cr2 : P.cr1
  }));
  OB(() => { face('Y', fbx0, 33, 0, 10, fbh + 1, (u, v, x, y, z) => hash3(Math.floor(x), Math.floor(z), 5) > 0.75 ? P.ch2 : P.ch0);
    face('X', fbx0, 33, 0, 3, fbh + 1, (u, v, x, y, z) => dk(brick(y, z)));
    face('T', fbx0, 33, 0.4, 10, 3, (u, v) => hash3(Math.floor(u * 2), Math.floor(v * 2), 6) > 0.6 ? P.ch3 : P.ch1); });
  OB(() => fbox(19.5, 32, 26.5, 40.5, 37.5, 28.5, P.wd3));
  OB(() => box(22, 32, 28.5, 38, 35, 48, { t: P.bk1, y: (u, v, x, y, z) => brick(x, z), x: (u, v, x, y, z) => dk(brick(y, z)) }));
  OB(() => box(19, 36, 0, 41, 40, 1.2, { t: (u, v) => (md(Math.floor(u), 5) === 0 || v < 0.4) ? P.ch3 : (hash3(Math.floor(u / 5), 0, 9) > 0.5 ? P.cr1 : P.cr0), y: P.ch3, x: P.ch2 }));
  foot(19, 32, 41, 40, 0, 0.6);
  OB(() => face('Y', 26, 35.05, 34, 8, 11, layered(0, [decal(SP.picLandscape, 0, 11)])));
  ANCH.fire = { x: 30, y: 34.4, z: 0.6 };
  ANCH.mantel = [{ x: 22.5, y: 35, z: 28.5 }, { x: 37.8, y: 35, z: 28.5 }];
  OB(() => stampS(SP.candle, 22.5, 35, 28.5)); OB(() => stampS(SP.candle, 37.8, 35, 28.5));
  OB(() => stampS(SP.photo, 26.5, 34, 28.5)); OB(() => stampS(SP.succulent, 33.5, 34.5, 28.5));
  // logs + grate
  const logs = smap(['...nmmn....', '.nmNNNmnn..', 'nNNmNNmNNn.', 'oxoxoxoxoxo', 'o.o.o.o.o.o'], { ...SP.L, o: P.ch1, x: P.ch2 }, 5);
  OB(() => stampS(logs, 30, 34.5, 0.4));
  OB(() => { cyl(17, 37.6, 0, 2.2, 4, (a, v) => (md(Math.floor(a * 5) + Math.floor(v), 2) ? P.wd4 : P.wd3), (r) => r > 0.8 ? P.wd5 : 0);
    stampS(smap(['.nmn.mn', 'nNNnNNm', '.nmnnmn'], SP.L, 3), 17, 37.6, 3.5); });
  foot(15, 35.5, 19, 39.5, 0, 0.7);
  /* ---- low bookcase + wall clock ---- */
  const bw = P.wd3;
  OB(() => fbox(42, 32, 0, 43, 37, 22, bw)); OB(() => fbox(59, 32, 0, 60, 37, 22, bw));
  OB(() => fbox(43, 32, 0, 59, 37, 1.5, bw)); OB(() => fbox(43, 32, 10.5, 59, 37, 11.5, bw));
  OB(() => fbox(41.5, 32, 22, 60.5, 37.6, 23.5, P.wd4));
  OB(() => face('Y', 43, 32.05, 1.5, 16, 20.5, P.wd1));
  booksX(43.2, 52.5, 32.4, 36.2, 1.5, 8, 11); booksX(55.5, 58.8, 32.4, 36.2, 1.5, 7, 12);
  booksX(43.2, 49, 32.4, 36.2, 11.5, 8, 13); booksX(53.5, 58.8, 32.4, 36.2, 11.5, 8, 14);
  OB(() => stampS(SP.globe, 54, 34.5, 1.5)); OB(() => stampS(SP.boat, 51, 34.5, 11.5));
  pot(45.5, 34.5, 23.5, 1.6, 3, P.cr2);
  foot(41.5, 32, 60.5, 37.6, 0, 1);
  ANCH.clock = { x: 51, y: 32, z: 44 };
  const clk = new Spr(14, 17);
  clk.rect(1, 0, 12, 17, P.wd2); clk.rect(2, 1, 10, 15, P.wd3);
  clk.ell(7, 5.5, 4.6, 4.6, P.gd1); clk.ell(7, 5.5, 3.8, 3.8, P.cr3);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; clk.px(7 + Math.cos(a) * 3.2 - 0.5, 5.5 + Math.sin(a) * 3.2 - 0.5, k % 3 ? P.cr0 : P.ink); }
  clk.line(6.5, 5, 6.5, 2.5, P.ink); clk.line(6.5, 5, 8.5, 6, P.ink);
  clk.rect(4, 11, 6, 5, P.wd1); clk.rect(4, 11, 6, 1, P.wd0); clk.rect(0, 0, 14, 1, P.wd4); clk.rect(0, 16, 14, 1, P.wd1);
  OB(() => face('Y', 47.5, 32.06, 27, 7, 17, layered(0, [decal(clk, 0, 17)])));
  /* ---- dog bed ---- */
  ANCH.dogBed = { x: 48, y: 44.5, z: 1.9 };
  OB(() => cyl(48, 44.5, 0, 6, 4.2, (a, v) => { const k = md(Math.floor(a * 7), 3); return v < 0.8 ? P.ro0 : k === 0 ? P.tc2 : cylShade(a, P.ro2); },
    (r, a) => r > 0.66 ? (r > 0.9 ? lt(P.ro2) : (md(Math.floor(a * 9), 2) ? P.ro3 : P.ro2)) : 0));
  OB(() => cyl(48, 44.5, 0, 4.1, 1.9, P.cr1, (r, a, x, y) => hash3(Math.floor(x * 2), Math.floor(y * 2), 3) > 0.7 ? P.cr1 : P.cr2));
  foot(42, 38.5, 54, 50.5, 0, 0.7);
  /* ---- coffee table ---- */
  for (const [lx, ly] of [[22, 47], [31, 47], [22, 58], [31, 58]]) OB(() => box(lx, ly, 0, lx + 1, ly + 1, 6.5, { t: P.wd2, y: P.wd2, x: P.wd1 }));
  OB(() => fbox(22.5, 47.5, 2, 31.5, 58.5, 2.8, P.wd2));
  OB(() => fbox(21.5, 46.5, 6.5, 32.5, 59.5, 8, P.wd3, (f, u, v) => f === 't' && md(Math.floor(v * 2), 5) === 0 && u < 10.4 ? P.wd4 : 0));
  OB(() => stampS(smap(['rrrrrc.', 'eeeeeec', 'hhhhhc.'], SP.L, 3), 27, 53, 2.8));
  foot(21.5, 46.5, 32.5, 59.5, 0, 0.8);
  OB(() => stampS(SP.bookStack, 25, 50.5, 8)); OB(() => stampS(SP.clementines, 28, 56, 8));
  OB(() => stampS(SP.candleJar, 24.2, 56.8, 8)); OB(() => stampS(SP.mugHoney, 29.6, 49.4, 8));
  ANCH.candle = { x: 24.2, y: 56.8, z: 12.5 }; ANCH.mugTable = { x: 29.6, y: 49.4, z: 13 };
  /* ---- by the door: raincoat + umbrella ---- */
  const coat = smap(['..oo..', '.hhhh.', 'hhyhhh', 'hhyhhh', 'hhyhhh', 'hHyhHh', 'hHyhHh', 'HHHHHH'], { ...SP.L, o: P.wd1, y: P.hn3, h: P.hn2, H: P.hn1 }, 3, 0);
  OB(() => face('Y', 14, 32.04, 22, 6, 12, layered(0, [decalFn(0, 12, 12, 1, () => P.wd2), decal(coat, 2, 11)])));
  OB(() => stampS(smap(['.u.', 'rrr', 'rRr', '.r.', '.r.', '.r.', '.r.', '.r.', 'rr.'], { ...SP.L, r: P.mb4, R: P.mb3 }, 1), 16.5, 33.2, 0));
  /* ---- plants ---- */
  pot(5.2, 68.6, 0, 2.6, 6, P.tc2); ANCH.monstera = { x: 5.2, y: 68.6, z: 6 };
  pot(61.5, 38.5, 0, 2, 5, P.cr2); ANCH.fern = { x: 61.5, y: 38.5, z: 5 };
  /* ---- knitting basket ---- */
  OB(() => { cyl(19.5, 65, 0, 2.3, 3.4, (a, v) => (md(Math.floor(a * 6) + Math.floor(v * 1.4), 2) ? P.wd5 : P.wd4), (r) => r > 0.85 ? P.wd5 : P.wd1);
    stampS(smap(['.u....', '..u.ss', '.rrssr', 'rrRsRr', '.Rr...'], { ...SP.L, u: P.wd6 }, 3), 19.5, 65, 3.4); });
  foot(17, 62.5, 22, 67.5, 0, 0.7);
  /* ---- floor toys ---- */
  OB(() => stampS(SP.rope, 38, 62, 0.15)); OB(() => stampS(SP.yarn, 34.5, 44, 0.15));
  /* ---- wall pictures ---- */
  OB(() => face('X', 0.04, 62, 24, 6, 14, layered(0, [decal(SP.picFamily, 1, 13)])));
  OB(() => face('X', 0.04, 33, 26, 8, 14, layered(0, [decal(SP.picFlower, 2, 13)])));
  ANCH.windowLiv = { y0: 45, y1: 61, z0: 22, z1: 40 };
}

function buildKitchen() {
  ROOM = R_KIT; FLAG = 0;
  const sage = P.sg3;
  const cab = (x0, x1) => {
    OB(() => box(x0 + 0.5, 32, 0, x1 - 0.5, 39, 1.5, { t: P.wd1, y: P.wd1, x: P.wd0 }));
    OB(() => fbox(x0, 32, 1.5, x1, 40, 17.5, sage, (f, u, v, x, y, z, A, B) => {
      if (f !== 'y') return 0;
      const du = md(x - x0, 6), dz = z;
      if (dz > 13.5) { if (dz < 14.2 || dz > 17) return P.sg2; if (du > 2.6 && du < 3.4 && dz > 15 && dz < 16) return P.gd2; return sage; }
      if (du < 0.5) return P.sg2; if (du > 5.5) return P.sg1;
      if (du > 1.2 && du < 4.8 && dz > 3.5 && dz < 11.5 && (du < 1.7 || du > 4.3 || dz < 4 || dz > 11)) return P.sg2;
      if (du > 4.3 && du < 4.8 && dz > 7 && dz < 8.5) return P.gd2;
      return 0; }));
    OB(() => fbox(x0 - 0.5, 32, 17.5, x1 + 0.5, 40.5, 19.5, P.wd5, (f, u, v) => f === 't' ? (md(Math.floor(v * 2), 3) === 0 ? P.wd4 : 0) : 0));
    foot(x0, 32, x1, 40.5, 0, 1);
  };
  cab(68, 78); cab(88, 104);
  /* stove */
  OB(() => box(78, 32, 0, 88, 40.5, 19, {
    t: (u, v, x, y) => { const d1 = Math.hypot(x - 80.8, y - 36.6), d2 = Math.hypot(x - 85.4, y - 36.6);
      if ((d1 > 1.4 && d1 < 2) || (d2 > 1.2 && d2 < 1.8)) return P.ch3; return (u > 9.4 || v > 7.9) ? P.ch2 : P.ch1; },
    y: (u, v, x, y, z) => { if (z < 1.2) return P.ch1; if (z > 15.5 && z < 17.5) return (md(Math.floor(x * 2), 4) === 1) ? P.ch2 : P.cr2;
      if (z > 13.2 && z < 14 && x > 79.5 && x < 86.5) return P.ml2;
      if (x > 80 && x < 86 && z > 4 && z < 11.5) return (z > 10.8 || x > 85.4) ? P.ch3 : (x - 80 + (11 - z) * 0.5 < 2.2 && x - 80 + (11 - z) * 0.5 > 1.5) ? P.ch4 : P.ch1;
      return z > 18.2 ? P.wh : P.cr3; },
    x: (u, v) => v > 18.2 ? P.cr2 : P.cr1
  }));
  OB(() => box(78, 32, 19, 88, 33.2, 23, { t: P.cr2, y: (u, v) => (v > 1.5 && v < 2.5 && md(Math.floor(u * 2), 5) === 2) ? P.ch3 : P.cr3, x: P.cr1 }));
  foot(78, 32, 88, 40.5, 0, 1);
  const kettle = smap(['....oo....', '...o..o...', '...aaaa...', '..aeaeea..', '.aeeeeeeaa', '.aeeeeeeea', '.aEeeeeeE.', '..EEEEEE..'], { ...SP.L, o: P.wd2, a: P.te3, e: P.te2, E: P.te1 }, 4);
  OB(() => stampS(kettle, 80.8, 36.6, 19)); ANCH.kettle = { x: 80.8, y: 36.6, z: 19, spoutX: 84.5, spoutZ: 23.5 };
  OB(() => stampS(smap(['..ZZZ..', 'tTTTTTtz', 'tTttTTt.', '.TTTTT..'], { ...SP.L, t: P.tc3, T: P.tc2, Z: P.ch3, z: P.ch2 }, 3), 85.4, 36.6, 19));
  /* sink, faucet, dish rack */
  OB(() => face('T', 92.5, 33.5, 19.52, 8.5, 5.5, (u, v) => (u < 0.6 || v < 0.5) ? P.ml0 : (u > 7.9 || v > 5) ? P.ml2 : (Math.abs(u - 4.2) < 0.5 && Math.abs(v - 2.7) < 0.4) ? P.ch1 : P.ml1));
  OB(() => stampS(smap(['.uuu', 'u..u', 'u..u', 'u...', 'u...', 'uU..'], SP.L, 0), 96.5, 33, 19.5));
  OB(() => stampS(smap(['.c.a.s.c', 'crcaerc.', 'crcaerc.', 'zzzzzzzz', 'z.....z.'], SP.L, 4), 90.2, 36, 19.5));
  OB(() => stampS(SP.herbPot, 94.5, 33.4, 24)); OB(() => stampS(SP.succulent, 101, 33.4, 24));
  /* counter-top things */
  ANCH.fishbowl = { x: 70.8, y: 36, z: 19.5 };
  OB(() => stampS(smap(['.aaaaa.', 'a.....a', 'abbbbba', 'abbbbba', 'abbbbba', '.akkka.', '..aaa..'], { ...SP.L, a: P.ml2, b: P.te3, k: P.cr0 }, 3), 70.8, 36, 19.5, 0, F_NOOUT));
  OB(() => stampS(smap(['..mmmm..', '.mmmmmm.', 'mnmnmnnm', 'NNNNNNNN', 'dddddddd'], SP.L, 4), 74.8, 36.3, 19.5));
  OB(() => stampS(SP.jarCookie, 101.5, 35, 19.5));
  /* open shelves */
  for (const sz of [32, 40]) OB(() => fbox(68, 32, sz, 90, 35.6, sz + 1, P.wd3));
  OB(() => face('Y', 68, 32.04, 28, 22, 4, layered(0, [decalFn(1, 4, 3, 3, (c, r) => r >= c ? P.wd2 : 0), decalFn(41, 4, 3, 3, (c, r) => r >= 2 - c ? P.wd2 : 0)])));
  OB(() => stampS(SP.bowlStack, 70.6, 33.6, 33)); OB(() => stampS(SP.jarFlour, 74.2, 33.8, 33)); OB(() => stampS(SP.jarCookie, 77, 33.8, 33));
  OB(() => stampS(SP.jarHoney, 79.6, 33.8, 33)); OB(() => stampS(SP.teapot, 83.6, 33.8, 33)); OB(() => stampS(SP.plateUp, 87.6, 33, 33));
  OB(() => stampS(SP.plateUp2, 69.6, 33, 41)); OB(() => stampS(SP.plateUp, 72.2, 33, 41)); OB(() => stampS(SP.mugTeal, 75.6, 33.8, 41));
  OB(() => stampS(SP.mugRose, 78.6, 33.8, 41)); OB(() => stampS(SP.bookStack, 83.5, 33.8, 41)); OB(() => stampS(SP.succulent, 88.2, 33.8, 41));
  for (const [mx, sp] of [[71, SP.mugRose], [74.5, SP.mugTeal], [78, SP.mugHoney]]) OB(() => stampS(sp, mx, 33.6, 27.6));
  /* utensil rail on the divider (x=67 face). Screen-left = larger y. */
  const ut = new Spr(34, 18);
  ut.rect(0, 0, 34, 1, P.ml1); ut.rect(0, 1, 34, 1, P.ml0);
  const hang = (x, h, c, headFn) => { ut.line(x, 2, x, 2 + h, c); headFn(x, 2 + h); };
  hang(3, 6, P.wd4, (x, y) => { ut.ell(x + 0.5, y + 1.5, 1.6, 2, P.wd4); });                          // spoon
  hang(8, 5, P.ml1, (x, y) => { ut.ell(x + 0.5, y + 2, 2, 2, P.ml2); ut.px(x, y + 2, P.ml1); });      // ladle
  hang(13, 5, P.ch2, (x, y) => { ut.rect(x - 1, y, 3, 4, P.ch3); ut.px(x, y + 1, P.ch2); });          // spatula
  hang(18, 4, P.ml1, (x, y) => { ut.ell(x + 0.5, y + 2.5, 1.8, 3, P.ml2); ut.ell(x + 0.5, y + 2.5, 0.8, 2.2, 0); });  // whisk
  ut.ell(25, 9, 4.2, 4.2, P.tc3); ut.ell(25, 9, 3, 3, P.tc2); ut.px(23, 7, P.tc4); ut.line(25, 1, 25, 4, P.wd2);    // copper pan
  ut.ell(31, 10, 3.2, 3.4, P.ch2); ut.ell(31, 10, 2.2, 2.3, P.ch1); ut.line(31, 2, 31, 6, P.ch2);   // skillet
  ROOM = R_KIT; OB(() => face('X', 67.04, 33, 18, 20, 18, (u, v, x, y, z) => {                     // decal on X face
    const c = Math.floor((53 - y) * 2), r = Math.floor(36 - z); if (c < 0 || c >= ut.w || r < 0 || r >= ut.h) return 0; return ut.d[r * ut.w + c]; }));
  OB(() => face('X', 67.04, 32.6, 22, 4, 10, (u, v, x, y, z) => { const c = Math.floor((36.6 - y) * 2), r = Math.floor(31 - z); if (c < 0 || c >= SP.calendar.w || r < 0 || r >= SP.calendar.h) return 0; return SP.calendar.d[r * SP.calendar.w + c]; }));
  /* fridge */
  OB(() => box(106, 32, 0, 118.5, 42, 38, {
    t: (u, v) => v > 9.2 ? P.wh : (u > 11.8 ? P.cr2 : P.cr3),
    y: (u, v, x, y, z) => { if (z < 2) return (md(Math.floor(x * 2), 2) ? P.ch2 : P.ch3); if (z > 25.6 && z < 26.4) return P.cr0;
      if (x > 115.5 && x < 116.5 && ((z > 17 && z < 24) || (z > 28 && z < 33))) return P.ml2;
      const dr = SP.drawRainbow, c = Math.floor((x - 108) * 2), r = Math.floor(22 - z);
      if (c >= 0 && c < dr.w && r >= 0 && r < dr.h) return dr.d[r * dr.w + c];
      const dd = SP.drawDog, c2 = Math.floor((x - 108.5) * 2), r2 = Math.floor(34 - z);
      if (c2 >= 0 && c2 < dd.w && r2 >= 0 && r2 < dd.h) return dd.d[r2 * dd.w + c2];
      if ((Math.floor(x * 2) === 225 && Math.floor(z) === 12) ) return P.ro2; if (Math.floor(x * 2) === 228 && Math.floor(z) === 9) return P.te2; if (Math.floor(x * 2) === 222 && Math.floor(z) === 28) return P.hn2;
      return z > 36.5 ? P.wh : x > 117.6 ? P.cr2 : P.cr3; },
    x: (u, v) => v > 36.5 ? P.cr2 : v < 2 ? P.ch2 : P.cr1
  }));
  foot(106, 32, 118.5, 42, 0, 1);
  OB(() => stampS(plantSpr(12, 9, 5, [P.lf2, P.lf3, P.lf1], P.lf1), 110, 35, 38)); pot(110, 35, 38, 1.6, 2.6, P.cr2);
  OB(() => stampS(smap(['.mnnm.', 'mnmmnm', 'nmnnmn', '.NNNN.'], SP.L, 3), 115.5, 36, 38));
  /* round table with gingham cloth */
  OB(() => cyl(96, 58, 0, 3.4, 1, (a) => cylShade(a, P.wd2), P.wd3));
  OB(() => cyl(96, 58, 1, 1.1, 9, (a) => cylShade(a, P.wd2), P.wd2));
  OB(() => cyl(96, 58, 9, 7.2, 4.4, (a, v, x, y) => { const sc = 0.9 + 0.7 * Math.abs(Math.sin(a * 6)); if (v < sc) return 0; return v < sc + 0.7 ? P.ro1 : md(Math.floor(a * 8), 2) ? P.cr2 : P.cr3; },
    (r, a, x, y) => { if (r > 0.94) return P.cr3; const g = (md(Math.floor(x * 1.2), 2) ? 1 : 0) + (md(Math.floor(y * 1.2), 2) ? 1 : 0); return g === 2 ? P.ro3 : g === 1 ? P.ro5 : P.cr3; }));
  foot(89, 51, 103, 65, 0, 0.8);
  OB(() => stampS(SP.vaseFlowers, 96.4, 57.4, 13.4)); OB(() => stampS(SP.mugTeal, 100.2, 59.4, 13.4));
  OB(() => stampS(smap(['.nmnmn.', 'ccccccc', '.kkkkk.'], SP.L, 3), 93, 60.8, 13.4));
  /* bentwood chairs */
  const chair = (cx, cy, dir) => {   // dir: 'y' backrest at -y side, 'x+' backrest at +x side, 'x-' at -x side
    const wd = P.wd2;
    for (const [lx, ly] of [[-2.2, -2.2], [1.6, -2.2], [-2.2, 1.6], [1.6, 1.6]]) OB(() => box(cx + lx, cy + ly, 0, cx + lx + 0.6, cy + ly + 0.6, 7, { t: wd, y: wd, x: P.wd1 }));
    OB(() => fbox(cx - 2.4, cy - 2.4, 7, cx + 2.4, cy + 2.4, 8, wd, (f, u, v) => f === 't' && u > 0.6 && v > 0.6 && u < 4.2 && v < 4.2 ? P.ro2 : 0));
    const bk = dir === 'y' ? [cx - 2.4, cy - 2.6, cx + 2.4, cy - 2] : dir === 'x+' ? [cx + 2, cy - 2.4, cx + 2.6, cy + 2.4] : [cx - 2.6, cy - 2.4, cx - 2, cy + 2.4];
    OB(() => box(bk[0], bk[1], 8, bk[2], bk[3], 19, { t: wd, y: (u, v) => (v > 9.5 || md(Math.floor(u * 2), 3) === 0) ? wd : 0, x: (u, v) => (v > 9.5 || md(Math.floor(u * 2), 3) === 0) ? P.wd1 : 0 }));
    foot(cx - 2.4, cy - 2.4, cx + 2.4, cy + 2.4, 0, 0.5);
  };
  chair(96, 48.6, 'y'); chair(106.6, 59.6, 'x+'); chair(85.6, 60.4, 'x-');
  /* pendant lights (cords end at the cutaway line) */
  ANCH.pendants = [];
  for (const px of [92.5, 99.5]) {
    OB(() => box(px - 0.25, 58 - 0.25, 27, px + 0.25, 58 + 0.25, 47.5, { t: P.ch1, y: P.ch1, x: P.ch1 }));
    OB(() => box(px - 1, 57, 47, px + 1, 59, 48, { t: P.cr2, y: P.cr1, x: P.cr0 }));
    OB(() => cyl(px, 58, 24, 2.6, 3.2, (a, v) => v < 0.7 ? CE('#ffe9b0') : cylShade(a, P.sg3), (r) => r > 0.75 ? P.sg4 : P.sg2));
    ANCH.pendants.push({ x: px, y: 58, z: 23 });
  }
  /* pet bowls on a mat */
  OB(() => { FLAG = F_NOOUT; face('T', 68.5, 61, 0.1, 7.5, 9, (u, v) => (u < 0.6 || v < 0.6 || u > 6.9 || v > 8.4) ? P.te1 : P.te2); FLAG = 0; });
  OB(() => cyl(71.4, 63.6, 0.1, 2, 1.4, (a) => cylShade(a, P.ro2), (r, a, x, y) => r > 0.75 ? P.ro3 : hash3(Math.floor(x * 2), Math.floor(y * 2), 8) > 0.5 ? P.wd3 : P.wd2));
  OB(() => cyl(71.8, 67.8, 0.1, 1.6, 1.1, (a) => cylShade(a, P.te3), (r, a, x, y) => r > 0.72 ? P.te4 : hash3(Math.floor(x * 2), Math.floor(y * 2), 9) > 0.5 ? P.tc3 : P.hn1));
  OB(() => cyl(74.4, 65.6, 0.1, 1.5, 1, (a) => cylShade(a, P.ml1), (r) => r > 0.72 ? P.ml2 : P.mb5));
  ANCH.bowls = { x: 72, y: 65.5 };
  /* braided rug in front of the sink */
  OB(() => { FLAG = F_NOOUT; face('T', 90, 41, 0.1, 14, 7, (u, v) => { const d = Math.hypot((u - 7) / 7, (v - 3.5) / 3.5); if (d > 1) return 0; const k = Math.floor(d * 5); return [P.hn2, P.ro3, P.sg4, P.hn1, P.ro2][k]; }); FLAG = 0; });
}
