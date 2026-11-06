/* =====================================================================
   The cat: the orange tabby with the white bib from Sky Island. All frames
   face right and flip for the other way. Tails and moving parts are
   painted into the same sprite before the outline, so nothing splits.
   ===================================================================== */
const CM = pal_({ o: '#f0923a', O: '#c0602a', L: '#ffc074', w: '#fff0dc', e: '#2a2a1a', n: '#f08080' });
const CAT_TOP = [
  '.............o...o..',
  '.............on.no..',
  '.............ooooo..',
  '............ooooooo.',
  '............oeoooeo.',
  '...LoOoOoOoOoowwnwo.',
  '..LoOoOoOoOoOoowww..',
  '.LoOoOoOoOoOooowww..',
  '.oooooooooooooowww..',
  '.ooooooooooooooww...'
];
const CAT_WALK_LEGS = [
  ['..OO...oo...OO...oo.', '.OO.....oo.OO.....oo'],
  ['....Ooo........Ooo..', '....Ooo........Ooo..'],
  ['..oo...OO...oo...OO.', '.oo.....OO.oo.....OO'],
  ['....oOO........oOO..', '....oOO........oOO..']
];
const CAT_SIT = [
  '......o...o...',
  '......on.no...',
  '......ooooo...',
  '.....ooooooo..',
  '.....oeoooeo..',
  '.....oowwnwo..',
  '....Looowww...',
  '...LoOowwww...',
  '...LoOoowww...',
  '..LoOoOowww...',
  '..oOoOoowwo...',
  '..oOoOooowo...',
  '.oooooooowo...',
  '.oooooooowwww.',
  '.oooooo..wwww.'
];
const CAT_SLEEP = [
  '.............o...o.',
  '....oooooooo.on.no.',
  '..LoOoOoOoOooooooo.',
  '.LoOoOoOoOoOoOOoOOo',
  '.oOoOoOoOoOoooooooo',
  'oOoOoOoOoOooooowwnw',
  'oooooooooooooowwwww',
  'owwOOOOOOOOOOoooo..',
  '.wwoooooooooo......'
];
function catBuild(rows, w, h, ax, ay, tail, extra) {
  const s = new Spr(w, h), x0 = 8, y0 = h - 2 - rows.length;
  s.map(rows, CM, x0, y0);
  if (tail) tail.forEach(([dx, dy], k) => { s.px(x0 + dx, y0 + dy, k === tail.length - 1 ? CM.O : CM.o); s.px(x0 + dx + 1, y0 + dy, k === tail.length - 1 ? CM.O : CM.o); });
  if (extra) extra(s, x0, y0);
  s.outline(() => P.ink); s.ax = x0 + ax; s.ay = h - 2; return s;
}
function catWalk(f, sw) {
  return cached(`c|w|${f}|${sw}`, () => catBuild([...CAT_TOP, ...CAT_WALK_LEGS[f]], 38, 26, 9, 0, [[1, 5], [0, 4], [-1, 3], [-1 + sw, 2], [-1 + sw, 1], [sw, 0]]));
}
function catSit(flick, happy, look) {
  return cached(`c|s|${flick}|${happy}|${look}`, () => catBuild(CAT_SIT, 30, 26, 6, 0, [[0, 13], [-1, 13], [-2, 13], [-3, 13 + flick]], (s, x, y) => {
    if (happy) { s.rect(x + 6, y + 4, 2, 1, CM.O); s.rect(x + 10, y + 4, 2, 1, CM.O); s.px(x + 6, y + 5, CM.o); s.px(x + 10, y + 5, CM.o); }
    if (look === 1) { s.px(x + 6, y + 4, CM.o); s.px(x + 7, y + 4, CM.e); s.px(x + 10, y + 4, CM.o); s.px(x + 11, y + 4, CM.e); }
    if (look === 2) { s.px(x + 6, y + 3, CM.e); s.px(x + 6, y + 4, CM.o); s.px(x + 10, y + 3, CM.e); s.px(x + 10, y + 4, CM.o); }
    if (look === 3) { s.rect(x + 6, y + 4, 2, 1, CM.O); s.rect(x + 10, y + 4, 2, 1, CM.O); }
  }));
}
function catSleep(breath, ear) {
  return cached(`c|z|${breath}|${ear}`, () => catBuild(CAT_SLEEP, 36, 20, 9, 0, null, (s, x, y) => {
    if (breath) for (let i = 5; i <= 10; i++) s.px(x + i, y, CM.o);
    if (ear) { s.px(x + 13, y, 0); s.px(x + 12, y + 1, CM.o); }
  }));
}
/* a big stretch before getting up: front low, rear high */
function catStretch() {
  return cached('c|st', () => {
    const rows = ['.............o...o..', '.............on.no..', '.L...........ooooo.', '.oOoO.......ooooooo', '.oOoOoOoO...oeoooeo', '..oOoOoOoOooowwnwo.', '...ooOoOoOoOooowww.', '.....ooooooooowwww.', '..OO.........oo.oo.', '..OO...........oo.oo'];
    return catBuild(rows, 38, 26, 9, 0, [[0, 2], [-1, 1], [-2, 0], [-2, -1]]);
  });
}
