/* =====================================================================
   Small hand-drawn item sprites + furniture material helpers.
   ===================================================================== */
const SP = {};   // sprite library (filled in buildItems)
function smap(rows, leg, ax, ay) { const w = Math.max(...rows.map(r => r.length)); const s = new Spr(w, rows.length); s.map(rows, leg); s.ax = ax !== undefined ? ax : Math.floor(w / 2); s.ay = ay !== undefined ? ay : rows.length - 1; return s; }

/* edge-aware furniture box: top lighter w/ front-edge highlight, +y face base, +x face darker */
function fbox(x0, y0, z0, x1, y1, z1, base, tex, opt = {}) {
  const X = x1 - x0, Y = y1 - y0, Z = z1 - z0, hi = lt(base), lo = dk(base), lo2 = dk(base, 2);
  const T = opt.top || hi;
  box(x0, y0, z0, x1, y1, z1, {
    t: opt.noTop ? 0 : (u, v, x, y, z) => { const c = tex && tex('t', u, v, x, y, z, X, Y); if (c) return c; return (u > X - 0.6 || v > Y - 0.6) ? lt(T) : T; },
    y: (u, v, x, y, z) => { const c = tex && tex('y', u, v, x, y, z, X, Z); if (c) return c; return v > Z - 1 ? hi : v < 0.8 && Z > 3 ? lo : base; },
    x: (u, v, x, y, z) => { const c = tex && tex('x', u, v, x, y, z, Y, Z); if (c) return c; return v > Z - 1 ? base : v < 0.8 && Z > 3 ? lo2 : lo; }
  });
}
const OB = (fn) => { OBJ = objNew(); fn(); };

function buildItems() {
  const L = {
    o: P.ink, w: P.wh, c: P.cr3, C: P.cr1, k: P.cr0,
    r: P.ro2, R: P.ro1, s: P.ro4, t: P.tc2, T: P.tc1, h: P.hn2, H: P.hn1, y: P.hn3,
    g: P.sg3, G: P.sg2, q: P.sg4, e: P.te2, E: P.te1, a: P.te3,
    b: P.mb4, B: P.mb3, v: P.vi3, V: P.vi2, n: P.wd3, N: P.wd2, m: P.wd4, d: P.wd1,
    l: P.lf3, L: P.lf2, f: P.lf1, z: P.ch4, Z: P.ch3, x: P.ch2, p: P.pe1, P: P.pe0, u: P.gd2, U: P.gd1
  };
  SP.L = L;
  SP.mugRose = smap(['.ccc.', 'crrrcc', 'crrrc.c', 'cRrRcc', '.RRR.'], { ...L, c: P.ro3, r: P.ro2, R: P.ro1 }, 2);
  SP.mugTeal = smap(['.aaa.', 'aeeeaa', 'aeeea.a', 'aEeEaa', '.EEE.'], L, 2);
  SP.mugHoney = smap(['.yyy.', 'yhhhyy', 'yhhhy.y', 'yHhHyy', '.HHH.'], L, 2);
  SP.bookStack = smap(['..rrrrrc.', '.RRRRRRc.', 'eeeeeeeec', 'EEEEEEEEc', '.hhhhhhc.', '.HHHHHHc.'], L, 4);
  SP.bookOpen = smap(['c.......c', 'ccc...ccc', 'cCcc.ccCc', 'CCCcCcCCC', 'nnnnnnnnn'], L, 4);
  SP.clementines = smap(['.TttT.tT..', 'TttyttTtt.', 'TtttTttTtT', '.kCCCCCCk.', '..kkkkkk..'], { ...L, t: P.tc3, T: P.tc2, y: P.hn3 }, 5);
  SP.vaseFlowers = smap(['.s.y..s.', 'sRs.ysRs', '.s.l.s..', '.l.l.l.l', '..lLl.l.', '...aa...', '..aeea..', '..aeeE..', '...EE...'], L, 4);
  SP.jarHoney = smap(['.UUU.', '.ccc.', 'chhhc', 'chyhc', 'chhhc', '.HHH.'], L, 2);
  SP.jarFlour = smap(['.mmm.', '.ccc.', 'cCCCc', 'cCwCc', 'cCCCc', '.kkk.'], L, 2);
  SP.jarCookie = smap(['..n..', '.mmm.', 'cCnCc', 'cnCnc', 'cCnCc', '.kkk.'], L, 2);
  SP.teapot = smap(['...a...', '..aea..', 'a.eeeea.', 'aaeeeeea', '.aeaeaea', '..EeeeE.', '...EEE..'], L, 3);
  SP.bowlStack = smap(['rrrrrrr', '.RRRRR.', 'eeeeeee', '.EEEEE.', 'hhhhhhh', '.HHHHH.'], L, 3);
  SP.plateUp = smap(['.ccc.', 'cCsCc', 'csrsc', 'cCsCc', '.ccc.'], L, 2);
  SP.plateUp2 = smap(['.aaa.', 'acecc', 'aeeec', 'acecc', '.aaa.'], L, 2);
  SP.candle = smap(['c', 'c', 'C', 'C'], L, 0);
  SP.candleJar = smap(['k.k', 'kck', 'kck', 'kCk', 'kkk'], L, 1);
  SP.soap = smap(['.z.', '.z.', 'aaa', 'aea', 'aEa'], L, 1);
  SP.herbPot = smap(['.l.l.', 'lLlfl', '.lLl.', 'tTtTt', '.tTt.', '.TTT.'], L, 2);
  SP.succulent = smap(['.q.q.', 'qgqgq', '.gGg.', 'cccc.', '.CCC.'], L, 2);
  SP.photo = smap(['nnnnnn', 'nbbbhn', 'nbgbbn', 'ngGggn', 'nnnnnn', '..nn..'], { ...L, b: P.mb5, g: P.sg4, G: P.sg3 }, 3);
  SP.globe = smap(['..aaa.', '.aalla', 'aallaa', 'alaaae', '.aaee.', '..UU..', '.UUUU.'], L, 3);
  SP.crayons = smap(['r.e.h', 'r.ehs', 'rteha', 'kkkkk', 'kCCCk', 'kkkkk'], L, 2);
  SP.lampDesk = smap(['..hhh.', '.hhhhh', '...uU.', '...U..', '..U...', '.U....', '.U....', 'UUUU..'], L, 1);
  SP.robot = smap(['.zz.', 'zbbz', 'zZZz', '.zz.', 'z..z'], L, 2);
  SP.blocks = smap(['..rr..', '..RR..', 'eehhaa', 'EEHHaa'], L, 3);
  SP.ball = smap(['.rcr.', 'rcrcr', 'Rrcrr', '.RRR.'], L, 2);
  SP.boat = smap(['..c..', '..cC.', '.ccCC', 'nnnnnn', '.NNNN.'], L, 3);
  SP.star = smap(['..y..', '.yhy.', 'yhhhy', '.yhy.', 'y...y'], L, 2);
  SP.bone = smap(['c...c', '.ccc.', 'c...c'], L, 2);
  SP.rope = smap(['.r.e.', 'rrReE', '.RrE.', 'ccCC.', 'c..C.'], L, 2);
  SP.yarn = smap(['.ss.', 'srsR', 'sRrs', '.RR.'], L, 2);
  SP.mushrooms = smap(['.rr....', 'rcrr.s.', 'RRRRsss', '.cc..c.', '.cc..c.'], L, 3);
  SP.gnomeHat = smap(['..r..', '.rr..', '.rrr.', 'rrRrr', '.ppp.', 'cpppc', 'cccc.', '.eEe.', '.eEe.', '.n.n.'], L, 2);
  SP.telescope = smap(['......u', '....uuU', '..uuUU.', 'uUUU...', '..n....', '.n.n...', 'n...n..'], L, 3);
  SP.lantern = smap(['.o.', 'ooo', 'oyo', 'oyo', 'ooo'], { o: P.ch2, y: P.bulb2 }, 1);

  /* plush toys */
  SP.bunny = smap([
    '.ss..ss.', '.sr..rs.', '.sr..rs.', '.ssssss.', 'sswssws.', 'sssrssss', '.sssss..', 'ssscsss.', 'ssccccs.', '.ss..ss.'
  ], { s: P.cr2, r: P.ro4, w: P.ink, c: P.wh }, 4);
  SP.bear = smap([
    'nn...nn.', 'nmnnnmn.', '.nnnnn..', 'nownownn', 'nnmmmnnn', '.nmomn..', 'nnnnnnn.', 'nnmmmnnn', 'nnmmmnn.', '.nn..nn.'
  ], { n: P.wd4, m: P.wd6, o: P.ink }, 4);
  SP.teddyOld = smap(['n....', 'nnnnn', 'nonon', 'nmmmn', '.nnn.', 'nnnnn', 'nmmmn', 'n...n'], { n: P.ow2, m: P.wd5, o: P.ink }, 2);

  /* framed pictures (wall decals) */
  const frame = (w, h, fc, content) => { const s = new Spr(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1; s.px(x, y, edge ? (x === 0 || y === h - 1 ? dk(fc) : fc) : content(x - 1, y - 1, w - 2, h - 2)); } return s; };
  SP.picLandscape = frame(16, 11, P.gd1, (x, y, w, h) => {      // mountains + moon
    const m = Math.abs(x - 5) + (h - y) * 1.1 < 7.5 || Math.abs(x - 11) + (h - y) * 1.2 < 6;
    if (y > h - 2) return P.sg2; if (m) return (x + y) & 1 ? P.vi3 : P.vi2; if (x === 11 && y === 1) return P.cr3; return y < 3 ? P.mb3 : P.mb4; });
  SP.picBoat = frame(10, 12, P.wd2, (x, y, w, h) => { if (y > 7) return (x + y) & 1 ? P.te2 : P.te3; if (x >= 3 && x <= 5 && y >= 2 && y <= 6 && x - 3 <= y - 2) return P.cr3; if (y === 7 && x > 1 && x < 7) return P.tc2; return P.pe2; });
  SP.picFlower = frame(8, 9, P.cr3, (x, y) => (x === 3 && y > 3) ? P.sg2 : (Math.abs(x - 3) + Math.abs(y - 2) < 2) ? (x === 3 && y === 2 ? P.hn2 : P.ro3) : P.cr2);
  SP.picFamily = frame(9, 8, P.wd4, (x, y) => (y > 3 ? (x < 3 ? P.ro2 : x < 5 ? P.hn1 : P.te2) : y > 1 && (x === 1 || x === 3 || x === 5) ? P.sk2 : P.mb5));
  SP.mirror = (() => { const s = new Spr(13, 13); s.ell(6.5, 6.5, 6.5, 6.5, P.gd1); s.ell(6.5, 6.5, 5.2, 5.2, 0, (x, y) => (x - y > 2 && x - y < 5) ? P.mb6 : (x + y < 9 ? P.mb5 : P.mb4)); s.ell(6.5, 6.5, 5.2, 5.2, 0, (x, y) => (x - y > 2 && x - y < 5) ? P.ml2 : (x + y < 9 ? P.mb5 : P.mb4)); return s; })();
  SP.calendar = frame(7, 9, P.cr3, (x, y) => y < 2 ? P.ro2 : ((x + y * 2) % 3 === 0 ? P.ch3 : P.cr3));
  SP.map = frame(11, 8, P.cr1, (x, y) => (x === 6 && y === 3) || (x === 7 && y === 4) || (x === 6 && y === 4) || (x === 7 && y === 3) ? P.ro1 : ((x * 3 + y * 5) % 7 === 0) ? P.wd3 : (x > 1 && x < 5 && y > 1 && y < 5) ? P.sg4 : P.cr2);

  /* kid drawings: paper with crayon scribbles + tape corners */
  const paper = (w, h, draw) => { const s = new Spr(w, h); s.rect(0, 0, w, h, P.wh); draw(s); s.px(0, 0, P.cr1); s.px(w - 1, 0, P.cr1); return s; };
  SP.drawSun = paper(9, 8, s => { s.ell(3, 3, 2, 2, P.hn2); s.px(6, 1, P.hn1); s.px(6, 5, P.hn1); s.px(0, 6, P.hn1); s.rect(0, 7, 9, 1, P.lf3); s.px(7, 5, P.ro2); s.px(7, 6, P.lf2); });
  SP.drawHouse = paper(9, 9, s => { s.rect(2, 4, 5, 4, P.ro3); s.line(1, 4, 4, 1, P.tc2); s.line(4, 1, 7, 4, P.tc2); s.px(4, 6, P.mb4); s.px(4, 7, P.mb4); s.rect(0, 8, 9, 1, P.lf3); });
  SP.drawDog = paper(11, 7, s => { s.rect(2, 3, 6, 2, P.wd3); s.rect(7, 2, 2, 2, P.wd3); s.px(8, 4, P.wd2); s.px(2, 5, P.wd2); s.px(7, 5, P.wd2); s.px(1, 2, P.wd3); s.px(9, 2, P.ink); s.px(5, 1, P.ro2); s.px(4, 1, P.ro2); });
  SP.drawCat = paper(8, 8, s => { s.ell(3.5, 5, 2.5, 2, P.ch4); s.ell(3.5, 2.5, 1.8, 1.5, P.ch4); s.px(2, 1, P.ch4); s.px(5, 1, P.ch4); s.px(6, 4, P.ch4); s.px(7, 3, P.ch4); s.px(3, 2, P.lf3); s.px(4, 2, P.lf3); });
  SP.drawRainbow = paper(10, 7, s => { const cs = [P.ro2, P.hn2, P.lf3, P.mb5]; for (let k = 0; k < 4; k++) for (let a = 0; a <= 12; a++) { const t = a / 12 * Math.PI; s.px(4.5 - Math.cos(t) * (4 - k * 0.9), 5.5 - Math.sin(t) * (4 - k * 0.9), cs[k]); } });
  SP.drawGirl = paper(7, 9, s => { s.ell(3.5, 2.5, 1.6, 1.6, P.sk2); s.px(2, 1, P.wd2); s.px(3, 1, P.wd2); s.px(4, 1, P.wd2); s.rect(2, 4, 3, 3, P.hn2); s.px(2, 7, P.mb4); s.px(4, 7, P.mb4); s.px(3, 2, P.ink); });

  /* book spine palette */
  SP.bookCols = [P.ro2, P.tc2, P.hn1, P.sg3, P.te2, P.mb4, P.vi3, P.cr2, P.ro3, P.wd3, P.sg2, P.tc3];
}

/* row of books standing on a shelf (boxes) along x, spines facing +y */
function booksX(x0, x1, y0, y1, z, hMax, seed) {
  let x = x0, k = 0; const r = mulberry32(seed);
  while (x < x1 - 0.6) {
    const w = r() < 0.2 ? 1.5 : 1, h = Math.round(hMax * (0.65 + r() * 0.35)), col = SP.bookCols[Math.floor(r() * SP.bookCols.length)];
    if (r() < 0.08 && x > x0 + 2) { x += 1; continue; }                     // gap
    const lean = r() < 0.07;
    OBJ = objNew();
    const xe = Math.min(x1, x + w);
    box(x, y0 + (r() < 0.3 ? 0.5 : 0), z, xe, y1, z + (lean ? h - 1 : h), {
      t: P.cr2,
      y: (u, v) => (v > h - 2.5 && v < h - 1.5) || (v > 1 && v < 2) ? P.gd2 : col,
      x: dk(col)
    });
    x = xe; k++;
  }
}
/* row of books along y on an X-facing shelf */
function booksY(x0, x1, y0, y1, z, hMax, seed) {
  let y = y1, r = mulberry32(seed);
  while (y > y0 + 0.6) {
    const w = r() < 0.2 ? 1.5 : 1, h = Math.round(hMax * (0.65 + r() * 0.35)), col = SP.bookCols[Math.floor(r() * SP.bookCols.length)];
    OBJ = objNew();
    box(x0, Math.max(y0, y - w), z, x1, y, z + h, { t: P.cr2, x: (u, v) => (v > h - 2.5 && v < h - 1.5) ? P.gd2 : col, y: dk(col) });
    y -= w;
  }
}
/* generic small leafy plant sprite (static) */
function plantSpr(w, h, seed, leafCols, stemCol) {
  const s = new Spr(w, h), r = mulberry32(seed);
  const n = Math.floor(w * h / 9);
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.6, len = (0.45 + r() * 0.55) * h * 0.85;
    const bx = w / 2, by = h - 1, ex = bx + Math.cos(a) * len * 0.7, ey = by + Math.sin(a) * len;
    s.line(bx, by, (bx + ex) / 2, (by + ey) / 2, stemCol);
    const lc = leafCols[Math.floor(r() * leafCols.length)];
    s.ell(ex, ey, 1.6 + r(), 1 + r() * 0.6, lc);
    s.px(ex - 0.5, ey - 0.5, lt(lc));
  }
  s.ax = Math.floor(w / 2); s.ay = h - 1;
  return s;
}
/* terracotta pot */
function pot(x, y, z, r, h, col = P.tc2) {
  OBJ = objNew();
  cyl(x, y, z, r, h, (a, v) => v > h - 1.2 ? lt(col) : cylShade(a, col), (rr) => rr > 0.82 ? lt(col) : P.wd1);
  foot(x - r, y - r, x + r, y + r, z, 0.8);
}
