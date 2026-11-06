/* =====================================================================
   The cat: an orange tabby with a white bib. All frames face right and
   flip for the other way. Tails and moving parts are painted into the same
   sprite before the outline, so nothing splits.
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
const CAT_CROUCH_LEGS = ['.ooo.ooo.....oo.oo..'];
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
/* hunting crouch: the tail sweeps; before a pounce the rear half wiggles, seam column kept by stretching */
function catHunt(sw, wiggle, reach, ear) {
  return cached(`c|h|${sw}|${wiggle}|${reach}|${ear}`, () => catBuild([...CAT_TOP, ...CAT_CROUCH_LEGS], 38, 24, 9, 0,
    [[1, 7], [0, 6], [-1, 5], [-2 + sw, 4], [-3 + sw, 3], [-3 + sw * 2, 2], [-3 + sw * 2, 1]], (s, x, y) => {
      if (wiggle) for (let r = 5; r < 11; r++) { const v = s.g(x + 1 + (r === 5 ? 3 : 1), y + r); if (v) s.px(x - 1 + (r === 5 ? 3 : 0), y + r, v); }
      if (reach > 0) { for (let k = 1; k <= reach; k++) { s.px(x + 17 + k, y + 7 - (k > 2 ? 1 : 0), CM.o); s.px(x + 17 + k, y + 8 - (k > 2 ? 1 : 0), CM.o); } s.px(x + 17 + reach, y + 6 - (reach > 2 ? 1 : 0), CM.w); }
      if (reach < 0) { s.rect(x + 18, y + 3, 2, 2, CM.o); s.px(x + 19 + (-reach - 1), y + 2, CM.w); }
      if (ear) { s.px(x + 17, y, 0); s.px(x + 18, y + 1, CM.o); }
    }));
}
function catWalk(f, sw, bound) {
  return cached(`c|w|${f}|${sw}|${bound}`, () => catBuild([...CAT_TOP, ...CAT_WALK_LEGS[f]], 38, 26, 9, 0,
    [[1, 5], [0, 4], [-1, 3], [-1 + sw, 2], [-1 + sw, 1], [sw, 0]]));
}
function catSit(flick, happy) {
  return cached(`c|s|${flick}|${happy}`, () => catBuild(CAT_SIT, 30, 26, 6, 0, [[0, 13], [-1, 13], [-2, 13], [-3, 13 + flick]], (s, x, y) => {
    if (happy) { s.rect(x + 6, y + 4, 2, 1, CM.O); s.rect(x + 10, y + 4, 2, 1, CM.O); s.px(x + 6, y + 5, CM.o); s.px(x + 10, y + 5, CM.o); }
  }));
}
function catSleep(breath, ear) {
  return cached(`c|z|${breath}|${ear}`, () => catBuild(CAT_SLEEP, 36, 20, 9, 0, null, (s, x, y) => {
    if (breath) for (let i = 5; i <= 10; i++) s.px(x + i, y, CM.o);
    if (ear) { s.px(x + 13, y, 0); s.px(x + 12, y + 1, CM.o); }
  }));
}
function catEat(munch) {
  return cached(`c|e|${munch}`, () => {
    const rows = [...CAT_TOP.map((r, j) => r), ...CAT_WALK_LEGS[1]], s = new Spr(38, 26), x0 = 8, y0 = 24 - rows.length;
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { if (row[i] === '.') continue; const head = i >= 12 && j <= 5; s.px(x0 + i + (head ? 1 : 0), y0 + j + (head ? munch : 0), row[i] === 'e' ? CM.O : CM[row[i]]); } });
    for (let j = 3; j < 3 + munch + 2; j++) { s.px(x0 + 13, y0 + j + 3, CM.o); s.px(x0 + 14, y0 + j + 3, CM.o); }
    [[1, 5], [0, 4], [-1, 3], [-1, 2], [-1, 1], [0, 0]].forEach(([dx, dy], k) => { s.px(x0 + dx, y0 + dy, k === 5 ? CM.O : CM.o); s.px(x0 + dx + 1, y0 + dy, CM.o); });
    s.outline(() => P.ink); s.ax = x0 + 9; s.ay = 24; return s;
  });
}
