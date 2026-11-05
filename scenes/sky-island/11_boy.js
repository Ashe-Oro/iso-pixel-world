/* =====================================================================
   The boy: sits on the island's left tip in profile, legs over the edge,
   fishing into the clouds. Frames compose like the girl's.
   ===================================================================== */
const BM = pal_({ g: '#b47c48', h: '#96603a', G: '#6a4028', s: '#f8d4b0', S: '#e2a888', e: '#2c1620', y: '#f0b84a', Y: '#c08a36', j: '#3e4a78', J: '#2a3058', a: '#6274a8', p: '#6a5444', P: '#4a3a34', b: '#2a1c1e', B: '#3a2626' });
const B_HEAD = [
  '......hh.hh.....',
  '....ghhhhhhhh...',
  '...ghhhhhhhhhhG.',
  '..ghhhhhhhhhhhhG',
  '..ghhhhhhhhhhhhG',
  '..sshshhhhhhhhhG',
  '.sssssshhhhhhhh.',
  '.ssssssShhhhhhG.',
  '.sssssssShhhhh..',
  '..ssssssSShhhG..',
  '...SSssss.hhh...'
];
const B_BODY = [
  '....yyyyyyyy...',
  '...YyyyyyyyyYY.',
  '...yyyyyyyyyyYY',
  '..aaajjjjjjjjYY',
  '.saaajjjjjjjjJ.',
  'ss..ajjjjjjjjJ.',
  '....ajjjjjjjjJ.',
  '....jjjjjjjjJJ.',
  '.pppppppppppPP.',
  'ppppppppppppPP.'
];
const B_OX = 5;
function boySpr(look, eyes, dy, lean, arm) {
  return cached(`b|${look}|${eyes}|${dy}|${lean}|${arm}`, () => {
    const s = new Spr(34, 29), x = B_OX + lean, by = 10 + 1;
    s.map(B_BODY, BM, x, by);
    if (arm === 'pat0' || arm === 'pat1') { const k = arm === 'pat1' ? 1 : 0; s.rect(x + 13, by + 4, 3, 2, BM.J); s.rect(x + 15, by + 3, 3, 2, BM.j); s.rect(x + 18, by + 2, 2, 2, BM.j); s.rect(x + 20 + k, by + 2, 2, 2, BM.s); }
    if (arm === 'wave0' || arm === 'wave1') { const k = arm === 'wave1' ? 1 : 0; s.rect(x + 13, by + 2, 3, 2, BM.j); s.rect(x + 15, by - 1, 2, 3, BM.j); s.rect(x + 16, by - 4, 2, 3, BM.j); s.rect(x + 16 + k, by - 7, 2, 3, BM.s); }
    const hx = x - 1, hy = 1 + dy;
    s.map(B_HEAD, BM, hx, hy, look);
    const ex = look ? hx + 12 : hx + 3, E = BM.e;
    if (eyes === 'up') s.rect(ex, hy + 5, 2, 2, E); else if (eyes === 'blink') s.rect(ex, hy + 7, 2, 1, BM.S); else s.rect(ex, hy + 6, 2, 2, E);
    s.outline(() => P.ink); s.ax = B_OX + 7; s.ay = by + 9; return s;
  });
}
/* dangling legs, swung slowly and out of step; far leg first and darker */
function drawBoyLegs(sx, sy, d, lw, t) {
  for (let leg = 0; leg < 2; leg++) {
    const sw = 0.5 * wave(t, 3, leg * 0.5), kx = sx - 8 + (leg === 0 ? 3 : 0), ky = sy + 1, c = leg === 0 ? BM.P : BM.p, sh = leg === 0 ? BM.b : BM.B;
    for (let k = 0; k < 8; k++) {
      const x = kx + Math.round(Math.sin(sw) * k), y = ky + k, col = k >= 6 ? sh : c, e = P.ink;
      dput(x - 1, y, e, d + leg, lw); dput(x, y, col, d + leg + 0.1, lw); dput(x + 1, y, col, d + leg + 0.1, lw); dput(x + 2, y, e, d + leg, lw);
      if (k >= 6) dput(x - 1, y, col, d + leg + 0.1, lw);
      if (k === 7) for (let q = -2; q <= 2; q++) dput(x + q, y + 1, e, d + leg, lw);
    }
  }
}
