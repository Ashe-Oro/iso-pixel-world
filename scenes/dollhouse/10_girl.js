/* =====================================================================
   The girl: ~8 years old, oversized honey sweater, violet leggings,
   pink bunny slippers, messy chestnut hair with a side ponytail.
   Procedural pixel rig (parts + hand-placed face) -> cached frames.
   All frames face screen-right (+x, SE / NE); mirrored for +y / -x.
   ===================================================================== */
const GC = {};
function girlPalette() {
  Object.assign(GC, {
    O: C('#2a1826'), h: C('#7b4128'), H: C('#592c1d'), j: C('#a3633a'), J: C('#c48450'),
    s: C('#f6caa6'), S: C('#dd9c80'), b: C('#ef9890'), e: C('#2a1a30'), w: C('#ffffff'), m: C('#b24c58'),
    y: C('#e4a63e'), Y: C('#b8782b'), z: C('#f6cf73'), r: C('#f6e6c4'), R: C('#d9c49e'),
    l: C('#433a63'), L: C('#2c2647'), p: C('#f2a6b6'), P: C('#c97688'), q: C('#fff6ee'), x: C('#c9485c'),
    bk: C('#c4566a'), bK: C('#8f3a4c'), pg: C('#fbf3e2'), pG: C('#ddd0b6'), mg: C('#7fb3a5'), mG: C('#4f8a85')
  });
}
/* ---- shared drawing helpers ---- */
function shadeEll(s, cx, cy, rx, ry, base, hi, lo, k = 0.55) {
  s.ell(cx, cy, rx, ry, 0, (x, y, dx, dy) => dx * 0.8 + dy < -k ? hi : dx * 0.6 + dy > k + 0.15 ? lo : base);
}
function thick(s, x0, y0, x1, y1, w, col) {
  const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1;
  for (let k = 0; k <= n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) s.px(Math.floor(x - (w - 1) / 2 + a), Math.floor(y - (w - 1) / 2 + b), typeof col === 'function' ? col(t) : col); }
}
/* selective outline: each empty pixel touching the figure takes a deep version of the neighbour */
function charOutline(s, ink) {
  s.outline((n) => ink, false);
  return s;
}

/* ---- head maps (13 x 12), facing right ---- */
const G_HEAD = {
  f: [
    '.....OOO.....',
    '...OOhjhOO...',
    '..OhhjjhhhO..',
    '.OhhjjhhhhhO.',
    '.OhhhhhhhhhhO',
    'OhhhHhhhhhhhO',
    'OhhHhhHhhHhHO',
    'OhHhsHsssHssO',
    'OhHsswesswesO',
    'OHhssbessbeO.',
    '.OHsssssmssO.',
    '..OOSsssssO..'],
  fBlink: null, fSleep: null, fYawn: null, fHappy: null,
  b: [
    '.....OOO.....',
    '...OOhjhOO...',
    '..OhhjjhhhO..',
    '.OhhjjhhhhhO.',
    '.OhhhhhjhhhhO',
    'OhhhhhjjhhhhO',
    'OhhhHhhhhhhhO',
    'OhhHhhhhhHhsO',
    'OhHhhhHhhhhsO',
    'OHhhhHhhhHhsO',
    '.OHHhhhhhHsO.',
    '..OOOHHHHOO..']
};
(function () {
  const f = G_HEAD.f;
  const rep = (rows, r, s) => rows.map((row, i) => i === r ? s : row);
  G_HEAD.fBlink = rep(rep(f, 8, 'OhHssssssssO.'.padEnd(13, '.')).slice(), 9, 'OHhssbSssbSO.');
  G_HEAD.fBlink = rep(G_HEAD.fBlink, 8, 'OhHssssssssO');
  G_HEAD.fBlink = G_HEAD.fBlink.map(r => r.padEnd(13, '.'));
  G_HEAD.fSleep = rep(rep(f, 8, 'OhHsssssssssO'), 9, 'OHhssbeesbeO.');
  G_HEAD.fYawn = rep(rep(rep(f, 8, 'OhHsssssssssO'), 9, 'OHhssbeesbeO.'), 10, '.OHssssmmssO.');
  G_HEAD.fHappy = rep(rep(f, 8, 'OhHssessessO.'.padEnd(13, '.')), 9, 'OHhssbSssbSO.');
  G_HEAD.fHappy = rep(G_HEAD.fHappy, 8, 'OhHsseSsseSO.');
})();
const G_TAIL = ['.x.', 'xhO', 'hjO', 'hhO', 'OhO', '.O.'];

/* ---- the rig ----
   pose: { view:'f'|'b', head:'f'|'fBlink'|..., hx,hy (head offset), bob,
           legs:'stand'|'walk'|'sit'|'kneel', lf (leg phase 0..3), swing (sit feet -1..1),
           armL:[x,y], armR:[x,y] hand targets relative to anchor, item:'book'|'bookLap'|'mug'|null, page:0..3, tail:offset } */
const GW = 26, GH = 34, GAX = 12, GAY = 33;   // sprite canvas; anchor at feet (standing) / hip (sitting: GAY-? handled per pose)
function drawGirlFrame(o) {
  const s = new Spr(GW, GH), C_ = GC;
  const sit = o.legs === 'sit', kneel = o.legs === 'kneel';
  // anchor in sprite space
  const ax = GAX, ay = sit ? GAY - 12 : kneel ? GAY - 6 : GAY;
  const bob = o.bob || 0;
  const hipY = sit ? ay : kneel ? ay - 1 : ay - 7 + bob;      // hip line (top of legs)
  const shY = hipY - 10;                                       // shoulder line
  const back = o.view === 'b';
  /* legs + slippers (drawn first; sweater overlaps the top) */
  const slipper = (x, y, flip) => {
    s.rect(x - 1, y - 1, 4, 2, C_.p); s.px(x + 2, y, C_.P); s.px(x - 1, y, C_.P);
    if (!back) { s.px(x + 1, y - 2, C_.q); s.px(x + 2, y - 2, C_.q); s.px(x + 2, y - 3, C_.p); } else { s.px(x - 1, y - 2, C_.q); }
  };
  if (sit) {
    const sw = o.swing || 0;
    // thighs go +x (screen right-down 2:1), shins hang down from the knee
    for (let k = 0; k < 2; k++) { const dy = k ? 1 : 0, dx = k ? -1 : 0;
      thick(s, ax - 1 + dx, hipY - 1 + dy, ax + 6 + dx, hipY + 2 + dy, 3, k ? C_.L : C_.l);
      const kx = ax + 6 + dx, ky = hipY + 2 + dy, fx = kx + (k ? -sw : sw), fy = ky + 7;
      thick(s, kx, ky, fx, fy - 1, 2, k ? C_.L : C_.l);
      slipper(fx, fy, false);
    }
  } else if (kneel) {
    thick(s, ax - 2, hipY, ax - 2, hipY + 4, 3, C_.L); thick(s, ax + 1, hipY, ax + 3, hipY + 4, 3, C_.l);
    s.rect(ax - 4, hipY + 4, 3, 2, C_.p); s.rect(ax + 2, hipY + 4, 3, 2, C_.P);
  } else {
    const ph = o.lf || 0, st = o.legs === 'walk' ? [1, 0, -1, 0][ph] : 0, lift = o.legs === 'walk' ? [0, 1, 0, 1][ph] : 0;
    const legA = st, legB = -st;   // A = near (right) leg, B = far leg
    const drawLeg = (x, lf, col, foot) => { thick(s, x, hipY, x + lf, ay - 2 - (foot ? 0 : 0), 2, col); slipper(x + lf, ay, false); };
    if (back) { drawLeg(ax + 1, legA, C_.l, 1); drawLeg(ax - 2, legB, C_.L, 1); }
    else { drawLeg(ax - 2, legB, C_.L, 1); drawLeg(ax + 1, legA, C_.l, 1); }
    if (lift) s.px(ax + 1 + legA, ay - 1, 0);
  }
  /* sweater body (oversized tunic) */
  const lean = o.lean || 0;
  const top = shY, bot = sit ? hipY + 1 : hipY + (kneel ? 1 : 1);
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / Math.max(1, bot - top), half = 4 + t * 2.2, lx = Math.round(ax - half + lean * (1 - t)), rx = Math.round(ax + half - 1 + lean * (1 - t));
    for (let x = lx; x <= rx; x++) {
      let c = C_.y;
      if (x >= rx - 1) c = C_.Y; else if (x <= lx + 1 && !back) c = C_.z;
      if (y === bot) c = (x & 1) ? C_.r : C_.R;                            // ribbed hem
      else if (!back && (y === top + 4 || y === top + 5)) c = x >= rx - 1 ? C_.R : C_.r;   // cream chest band
      else if (!back && y === top + 4 + 1 && ((x + y) % 3 === 0)) c = C_.R;
      if (back && y > top + 1 && y < bot - 1 && x === ax + Math.round(lean * (1 - t))) c = C_.Y;
      s.px(x, y, c);
    }
  }
  // collar
  for (let x = ax - 2; x <= ax + 2; x++) s.px(x + lean, top - 1, back ? C_.Y : C_.r);
  /* arms: sleeves as thick lines from the shoulders to the hands, cuffs + mitten hands */
  const arm = (sx, sy, hx, hy, near) => {
    const col = near ? C_.y : C_.Y;
    thick(s, sx, sy, hx, hy, 3, (t) => t > 0.82 ? C_.r : (near ? (t < 0.3 ? C_.z : C_.y) : C_.Y));
    s.px(Math.round(hx), Math.round(hy + 1), C_.s); s.px(Math.round(hx + (near ? 1 : -1)), Math.round(hy + 1), C_.S);
  };
  const aL = o.armL || [-6, 8], aR = o.armR || [5, 8];         // far arm (screen-left), near arm (screen-right)
  const shL = [ax - 4 + lean, shY + 2], shR = [ax + 3 + lean, shY + 2];
  arm(shL[0], shL[1], ax + aL[0], shY + aL[1], false);
  /* items held between the arms */
  if (o.item === 'book' && !back) {
    const bx = ax + 3 + lean, by = shY + 5;
    s.rect(bx - 3, by - 2, 8, 6, C_.bk); s.rect(bx - 3, by + 3, 8, 1, C_.bK);
    s.rect(bx - 2, by - 3, 3, 6, C_.pg); s.rect(bx + 2, by - 3, 3, 6, C_.pg); s.px(bx + 1, by - 3, C_.pG); s.rect(bx + 1, by - 2, 1, 5, C_.pG);
    for (let k = 0; k < 2; k++) { s.px(bx - 1, by - 1 + k * 2, C_.pG); s.px(bx + 3, by - 1 + k * 2, C_.pG); }
    const pgp = o.page || 0;
    if (pgp === 1) { s.rect(bx + 2, by - 5, 2, 3, C_.pg); s.px(bx + 3, by - 5, C_.pG); }
    if (pgp === 2) { s.rect(bx + 1, by - 6, 1, 4, C_.pg); s.px(bx, by - 6, C_.pg); }
    if (pgp === 3) { s.rect(bx - 2, by - 5, 2, 3, C_.pg); s.px(bx - 2, by - 5, C_.pG); }
  }
  if (o.item === 'bookLap') { const bx = ax + 3, by = hipY - 1; s.rect(bx - 2, by - 1, 7, 2, C_.bk); s.rect(bx - 2, by + 1, 7, 1, C_.bK); s.rect(bx - 1, by - 2, 5, 1, C_.pg); }
  if (o.item === 'mug') { const mx = ax + (o.mugX !== undefined ? o.mugX : 4), my = shY + (o.mugY !== undefined ? o.mugY : 6);
    s.rect(mx - 1, my - 2, 4, 4, C_.mg); s.rect(mx + 2, my - 1, 1, 2, C_.mG); s.px(mx + 3, my - 1, C_.mg); s.px(mx + 3, my, C_.mg); s.rect(mx - 1, my - 2, 4, 1, C_.pG); s.px(mx, my - 2, C_.J); s.px(mx + 1, my - 2, C_.J); }
  arm(shR[0], shR[1], ax + aR[0], shY + aR[1], true);
  /* head */
  const hm = G_HEAD[o.head || (back ? 'b' : 'f')];
  const hx0 = ax - 6 + lean + (o.hx || 0), hy0 = shY - 11 + (o.hy || 0);
  // ponytail behind (left side)
  const tl = o.tail || 0;
  if (!back) s.map(G_TAIL, GC, hx0 - 2 + Math.min(0, tl), hy0 + 6 + Math.max(0, tl));
  else s.map(G_TAIL, GC, hx0 - 1 + tl, hy0 + 7);
  s.map(hm, GC, hx0, hy0);
  if (back) { s.px(hx0 + 11, hy0 + 8, GC.s); }
  charOutline(s, GC.O);
  s.ax = ax; s.ay = ay;
  return s;
}

const GIRL = {};   // frame cache
function buildGirlFrames() {
  girlPalette();
  const F = (key, o) => { GIRL[key] = drawGirlFrame(o); };
  const hang = { armL: [-5, 8], armR: [4, 8] };
  // standing / walking (front & back)
  F('stand_f', { view: 'f', legs: 'stand', ...hang });
  F('stand_f_b', { view: 'f', legs: 'stand', head: 'fBlink', ...hang });
  F('stand_f_1', { view: 'f', legs: 'stand', bob: 0, armL: [-5, 9], armR: [4, 9] });
  F('stand_b', { view: 'b', legs: 'stand', ...hang });
  for (let k = 0; k < 4; k++) {
    const sw = [2, 0, -2, 0][k], bob = [0, -1, 0, -1][k];
    F('walk_f_' + k, { view: 'f', legs: 'walk', lf: k, bob, armL: [-5 - sw * 0.5, 8 + Math.abs(sw) * 0], armR: [4 + sw * 0.5, 8], tail: [1, 0, -1, 0][k] });
    F('walk_b_' + k, { view: 'b', legs: 'walk', lf: k, bob, armL: [-5 + sw * 0.5, 8], armR: [4 - sw * 0.5, 8], tail: [1, 0, -1, 0][k] });
    F('walkmug_f_' + k, { view: 'f', legs: 'walk', lf: k, bob, armL: [-1, 6], armR: [3, 6], item: 'mug', mugX: 2, mugY: 5 });
    F('walkmug_b_' + k, { view: 'b', legs: 'walk', lf: k, bob, armL: [-2, 6], armR: [2, 6] });
  }
  // kitchen: back view, arms forward (pouring)
  F('pour_b_0', { view: 'b', legs: 'stand', armL: [-3, 5], armR: [4, 4] });
  F('pour_b_1', { view: 'b', legs: 'stand', armL: [-3, 4], armR: [5, 3] });
  // sitting & reading
  const rd = { view: 'f', legs: 'sit', armL: [-1, 6], armR: [5, 6], item: 'book' };
  for (let sw = -1; sw <= 1; sw++) for (let pg = 0; pg < 4; pg++) F(`read_${sw + 1}_${pg}`, { ...rd, swing: sw, page: pg });
  F('read_blink', { ...rd, head: 'fBlink' });
  F('read_happy', { ...rd, head: 'fHappy' });
  // stretch & yawn
  F('stretch_0', { view: 'f', legs: 'sit', armL: [-3, -6], armR: [4, -7], head: 'fBlink' });
  F('stretch_1', { view: 'f', legs: 'sit', armL: [-4, -9], armR: [5, -10], head: 'fYawn', hy: -1 });
  // dozing
  F('doze_0', { view: 'f', legs: 'sit', armL: [0, 8], armR: [4, 9], item: 'bookLap', head: 'fSleep', hx: -1, hy: 1 });
  F('doze_1', { view: 'f', legs: 'sit', armL: [0, 8], armR: [4, 9], item: 'bookLap', head: 'fSleep', hx: -1, hy: 2, lean: 0 });
  F('doze_2', { view: 'f', legs: 'sit', armL: [0, 8], armR: [4, 9], item: 'bookLap', head: 'fSleep', hx: -2, hy: 2 });
  // petting the dog (lean forward, near arm reaches down-right)
  F('pet_0', { view: 'f', legs: 'sit', armL: [-1, 7], armR: [8, 12], lean: 1, head: 'fHappy', item: 'bookLap' });
  F('pet_1', { view: 'f', legs: 'sit', armL: [-1, 7], armR: [8, 14], lean: 1, head: 'fHappy', item: 'bookLap' });
  F('pet_2', { view: 'f', legs: 'sit', armL: [-1, 7], armR: [7, 11], lean: 1, head: 'f', item: 'bookLap' });
  // mug on the sofa
  F('sitmug_0', { view: 'f', legs: 'sit', armL: [0, 6], armR: [4, 6], item: 'mug', mugX: 2, mugY: 5 });
  F('sitmug_1', { view: 'f', legs: 'sit', armL: [1, 2], armR: [4, 2], item: 'mug', mugX: 3, mugY: 1, head: 'fBlink' });
  F('sitmug_2', { view: 'f', legs: 'sit', armL: [0, 6], armR: [4, 6], item: 'mug', mugX: 2, mugY: 5, head: 'fHappy' });
  F('putmug', { view: 'f', legs: 'sit', armL: [-1, 7], armR: [10, 6], lean: 1, item: null });
  // sitting on the window seat looking out (back view)
  F('seat_b_0', { view: 'b', legs: 'kneel', armL: [-3, 6], armR: [3, 6] });
  F('seat_b_1', { view: 'b', legs: 'kneel', armL: [-3, 6], armR: [3, 6], hy: -1 });
}
