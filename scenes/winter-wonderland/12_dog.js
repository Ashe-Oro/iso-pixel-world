/* =====================================================================
   The dog: a big soft mountain dog, black so it stands out on the snow,
   with a white blaze and chest, rust eyebrows and a red collar. Frames
   face right and flip for the other way.
   ===================================================================== */
const DM = pal_({ k: '#26222e', K: '#3c3648', q: '#544c62', r: '#b8642c', w: '#f6f0e6', W: '#c8c2d0', n: '#120e16', e: '#0e0a12', t: '#ec7484', c: '#d83030', C: '#ffcf60' });
const DOG_HEAD = [
  '...kkkkkkk...',
  '..kkkkkkkkk..',
  '.KkkkrkkwkkK.',
  'KKkkkekkwekk.',
  'KKkkkkkwwwwwk',
  'KKKkkrwwwwwwn',
  'KKKkkkwwwwwww',
  '.KKk.kkwwwww.',
  '.....kkkwww..'
];
const DOG_BODY = [
  '......qqKKKKqqKKKKKKkk..',
  '....KKkkkkkkkkkkkkkkkkk.',
  '...Kkkkkkkkkkkkkkkkkkkkc',
  '..Kkkkkkkkkkkkkkkkkkkkcc',
  '..kkkkkkkkkkkkkkkkkkkwww',
  '..kkkkkkkkkkkkkkkkkkwwww',
  '..kkkkkkkkkkkkkkkkkkwwww',
  '..rkkkkkkkkkkkkkkkkkkww.',
  '...rkKkKkKkKkKkKkKkkkk..'
];
const DOG_LEGS = {
  stand: ['...kkk.kk.......kk.kkk..', '...krr.kk.......kk.krr..', '...krr.kk.......kk.krr..', '...krr.rr.......rr.krr..', '...www.ww.......ww.www..'],
  a: ['...kkk...........kkkk...', '..kkrr.kk......kk.krr...', '.krr...kk......kk..krr..', 'krr....rr......rr...krr.', 'www....ww.....ww....www.'],
  b: ['....kkk..........kkk....', '....krk.kkk...kkk.rk....', '....krrkkr.....rkkrr....', '.....wwkr.......rkww....', '......www.......www.....'],
  c: ['.....kkkk.......kkkk....', '....kkrrkk.....kkrrkk...', '...krr..krr...krr..krr..', '..krr...krr..krr....krr.', '..www....www.www....www.'],
  d: ['....kkk..........kkk....', '....kkrk......krkkkk....', '....wrkk.....kkrrw......', '....wwrk.....krww.......', '......www...www.........'],
  sit: []
};
const TAILS = {
  up: [[1, 3], [0, 2], [-1, 1], [-2, 0], [-3, -1], [-4, -3]],
  wag: [[1, 3], [0, 3], [-2, 2], [-3, 1], [-5, 1], [-6, 0]],
  wag2: [[1, 3], [0, 2], [-1, 0], [-1, -2], [-1, -4], [-2, -5]],
  back: [[1, 3], [-1, 3], [-3, 3], [-5, 3], [-7, 2], [-9, 2]]
};
/* the carrot is held across the mouth, tip drooping, the green top poking out by the cheek */
function dogCarrot(s, hx, hy) { const c = P.carrot, d = P.carrotD; s.rect(hx + 10, hy + 8, 3, 2, c); s.rect(hx + 12, hy + 9, 2, 2, c); s.px(hx + 14, hy + 10, d); s.px(hx + 13, hy + 11, d); s.rect(hx + 8, hy + 8, 2, 1, P.holly); s.px(hx + 7, hy + 9, P.holly); }
function paintTail(s, x, y, T) {
  T.forEach(([dx, dy], k) => { const end = k >= T.length - 2, c = end ? DM.w : DM.k, r = k < 2 ? 1 : 2; s.rect(x + dx - (r >> 1), y + dy - (r >> 1), r + 1, r + 1, c); });
}
function dogBase(legs, tail, opt = {}) {
  const key = `d|${legs}|${tail}|${opt.hx || 0}|${opt.hy || 0}|${opt.mouth || ''}|${opt.eye || ''}|${opt.bob || 0}|${opt.snow || 0}`;
  return cached(key, () => {
    const s = new Spr(50, 36), x = 11, y = 12 + (opt.bob || 0);
    paintTail(s, x + 1, y + 1, TAILS[tail]);
    s.map(DOG_BODY, DM, x, y);
    s.map(DOG_LEGS[legs], DM, x, y + 9 - (opt.bob || 0));
    const hx = x + 20 + (opt.hx || 0), hy = y - 7 + (opt.hy || 0);
    s.map(DOG_HEAD, DM, hx, hy);
    if (opt.eye === 'shut') { s.rect(hx + 4, hy + 3, 2, 1, DM.K); s.px(hx + 9, hy + 3, DM.w); }
    if (opt.mouth === 'tongue') { s.rect(hx + 8, hy + 8, 3, 2, DM.t); }
    if (opt.mouth === 'carrot') dogCarrot(s, hx, hy);
    if (opt.snow) { for (const [a, b] of [[4, 0], [5, 0], [9, 1], [12, 0], [13, 0], [16, 1], [20, -1], [21, -1]]) s.px(x + a, y + b, DM.w); s.px(hx + 3, hy, DM.w); s.px(hx + 4, hy, DM.w); }
    s.outline(() => P.ink); s.ax = x + 12; s.ay = y + 13 - (opt.bob || 0); return s;
  });
}
function dogSit(tail, opt = {}) {
  const key = `ds|${tail}|${opt.mouth || ''}|${opt.eye || ''}|${opt.tilt || 0}`;
  return cached(key, () => {
    const rows = [
      '.......KKKkkkk....',
      '.....KKkkkkkkkk...',
      '....Kkkkkkkkkkcc..',
      '...Kkkkkkkkkkwwww.',
      '..Kkkkkkkkkkwwwww.',
      '..kkkkkkkkkkwwwww.',
      '.kkkkkkkkkkkkwwww.',
      '.kkkkkkkkkkkkkww..',
      '.kkkkkkkkkkkkkrk..',
      'kkkkkkkkkkkkkkrk..',
      'kkkkkkkkkkrkkkrk..',
      'kkkkrrkkkkrrkkrr..',
      'kkkkwwwwk.wwwwww..'
    ], s = new Spr(46, 34), x = 12, y = 19;
    paintTail(s, x, y + 9, tail === 'wag' ? [[0, 2], [-2, 2], [-4, 2], [-6, 1], [-7, 1], [-8, 0]] : tail === 'wag2' ? [[0, 2], [-2, 1], [-3, 0], [-4, -2], [-5, -3], [-5, -5]] : [[0, 2], [-2, 3], [-4, 3], [-6, 3], [-8, 3], [-10, 3]]);
    s.map(rows, DM, x, y);
    const hx = x + 8, hy = y - 8 + (opt.tilt || 0); s.map(DOG_HEAD, DM, hx, hy);
    if (opt.eye === 'shut') { s.rect(hx + 4, hy + 3, 2, 1, DM.K); s.px(hx + 9, hy + 3, DM.w); }
    if (opt.mouth === 'tongue') s.rect(hx + 8, hy + 8, 3, 2, DM.t);
    if (opt.mouth === 'carrot') dogCarrot(s, hx, hy);
    s.outline(() => P.ink); s.ax = x + 7; s.ay = y + 12; return s;
  });
}
/* play bow, rear up and head down, with a wiggle */
function dogBow(wiggle, tail) {
  return cached(`db|${wiggle}|${tail}`, () => {
    const s = new Spr(50, 36), x = 11, y = 14;
    paintTail(s, x + 2, y - 1 + wiggle, TAILS[tail]);
    for (let r = 0; r < 10; r++) { const c0 = 2 + Math.floor(r * 0.1), c1 = 24; for (let c = c0; c < c1; c++) { const top = Math.round(lerp(0, 5, (c - 2) / 22)) + wiggle * (c < 10 ? 1 : 0); if (r < top) continue; s.px(x + c, y + r, r === top ? DM.K : DM.k); } }
    s.map(['...kkk.................', '...krr.................', '...krr.................', '...krr.................', '...www.................'], DM, x, y + 10);
    s.map(['kkk..kkk', 'wwk..wwk', 'wwww.wwww'], DM, x + 19, y + 10 + 2 - 1);
    s.map(DOG_HEAD, DM, x + 23, y + 3);
    s.outline(() => P.ink); s.ax = x + 12; s.ay = y + 14; return s;
  });
}
/* lying down with the carrot between the paws, head up, tail thumping */
function dogLie(tail, opt = {}) {
  return cached(`dl|${tail}|${opt.eye || ''}|${opt.down || 0}`, () => {
    const rows = [
      '.......KKKkkkkkk......',
      '.....KKkkkkkkkkkkkk...',
      '...KKkkkkkkkkkkkkkkcc.',
      '..Kkkkkkkkkkkkkkkkwww.',
      '.kkkkkkkkkkkkkkkkkwww.',
      '.kkkkkkkkkkkkkkkkkkww.',
      '.rkkkkkrrkkkkkkkkkwwww',
      '..kkkkrrrrkkkk..wwwwww'
    ], s = new Spr(52, 30), x = 13, y = 18, d = opt.down || 0;
    paintTail(s, x + 1, y + 4, tail === 'wag' ? [[0, 2], [-2, 2], [-4, 3], [-6, 3], [-8, 3], [-10, 2]] : [[0, 2], [-2, 1], [-4, 0], [-5, -1], [-7, -1], [-9, -2]]);
    s.map(rows, DM, x, y);
    const hx = x + 14, hy = y - 7 + d; s.map(DOG_HEAD, DM, hx, hy);
    if (opt.eye === 'shut') { s.rect(hx + 4, hy + 3, 2, 1, DM.K); s.px(hx + 9, hy + 3, DM.w); }
    const c = P.carrot; s.rect(x + 21, y + 7, 6, 1, c); s.rect(x + 22, y + 8, 4, 1, P.carrotD); s.rect(x + 19, y + 7, 2, 1, P.holly);
    s.outline(() => P.ink); s.ax = x + 10; s.ay = y + 8; return s;
  });
}
