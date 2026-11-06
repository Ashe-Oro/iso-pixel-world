/* =====================================================================
   The couple from Sky Island: same head and body art, same palettes. Here
   they sit in rocking chairs with a plaid blanket and a mug of cocoa. A
   frame is composed from chair + person on first use and cached; the
   person is sheared row by row so they rock with the chair, and the
   outline goes on last so a moving part can never split from the rest.
   ===================================================================== */
const SPRC = new Map();
function cached(key, fn) { let s = SPRC.get(key); if (!s) { s = fn(); SPRC.set(key, s); } return s; }
const pal_ = o => { const m = {}; for (const k in o) m[k] = C(o[k]); return m; };
/* --- her: head and body rows exactly as on Sky Island --- */
const GM = pal_({ h: '#3a2030', H: '#a0543e', c: '#f4b443', s: '#e6b08a', S: '#c08866', e: '#2c1620', b: '#e08a78', w: '#5c9488', W: '#3e6a68', v: '#8cc2a6', k: '#b4343c', K: '#7e2230', p: '#fff4de', P: '#d8bfa0', l: '#3c2a44', o: '#6e3a2a' });
const G_HEAD = [
  '.....hhhhhhh.....',
  '...hhhhhhhhhhh...',
  '..HhhhhhhhhhhhH..',
  '.HhhhhhhhhhhhccH.',
  '.HhhhhhhhhhhhcHh.',
  'HhhhhshhhhshhhhhH',
  'HhhhsssssssssshhH',
  'HhhsssssssssssshH',
  'HhhsssssssssssshH',
  'HhhbbsssSsssbbshH',
  '.HhhsssssssssShH.',
  '.HhhhSsssssShhhH.',
  '..Hhh.SSSSS.hhH..'
];
const G_BODY = [
  '..HhhWwwwwwWhhH..',
  '..HhvwwwwwwwWhH..',
  '..vvwwwwwwwwwWW..',
  '.vvwwwwwwwwwwwWW.',
  '.vwwwwwwwwwwwwwW.',
  '.vwwwwwwwwwwwwwW.'
];
function girlEyes(s, x, y, eyes) {
  const L = x + 5, R_ = x + 11, e = GM.e, skin = GM.S;
  if (eyes === 'blink') { s.rect(L, y + 8, 2, 1, skin); s.rect(R_, y + 8, 2, 1, skin); }
  else if (eyes === 'down') { s.rect(L, y + 8, 2, 1, e); s.rect(R_, y + 8, 2, 1, e); }
  else if (eyes === 'up') { s.rect(L, y + 6, 2, 2, e); s.rect(R_, y + 6, 2, 2, e); }
  else if (eyes === 'side') { s.rect(L + 1, y + 7, 2, 2, e); s.rect(R_ + 1, y + 7, 2, 2, e); }
  else if (eyes === 'left') { s.rect(L - 1, y + 7, 2, 2, e); s.rect(R_ - 1, y + 7, 2, 2, e); }
  else { s.rect(L, y + 7, 2, 2, e); s.rect(R_, y + 7, 2, 2, e); }
}
/* --- him --- */
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
  '....jjjjjjjjjYY',
  '....jjjjjjjjjJ.',
  '....jjjjjjjjjJ.',
  '....jjjjjjjjjJ.',
  '....jjjjjjjjJJ.'
];
/* --- shared: chair, blankets, mugs --- */
const WOODC = [C('#4a2c28'), C('#74482e'), C('#9c683c'), C('#c49058')];
const PLAID = { a: pal_({ r: '#b8383a', d: '#842632', c: '#f0dcb4', g: '#2e6a54', f: '#d8c8a0' }), b: pal_({ r: '#3e7a6a', d: '#28544e', c: '#f0dcb4', g: '#c88a30', f: '#d8c8a0' }) };
const plaidAt = (P_, x, y) => { const a = mod(x, 6), b = mod(y, 6); if (a === 4 || b === 4) return a === 4 && b === 4 ? P_.g : P_.c; return a < 2 || b < 2 ? P_.d : P_.r; };
const MUG_C = { a: pal_({ m: '#e84a3c', M: '#a82c30', h: '#c23a34', d: '#6a3a26', w: '#fff6ea' }), b: pal_({ m: '#4a7ac0', M: '#2e5490', h: '#3a64a4', d: '#6a3a26', w: '#fff6ea' }) };
function paintMug(s, who, x, y, flip) {
  const c = MUG_C[who], rows = ['ddwdd.', 'mmmmmh', 'mmmmm.h'.slice(0, 6), 'MMMMM.'];
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.') s.px(flip ? x + 5 - i : x + i, y + j, c[ch]); } });
}
const rockerH = f => (f / 7) * (f / 7) * 2;
function chairProj(ox, oy, th) { return (l, f, h) => { const f2 = f - h * th, h2 = h + f * th; return [ox + 2 * (l - f2), oy + (l + f2) - h2]; }; }
function chairLine(s, p, a, b, c) { const A = p(...a), B = p(...b); s.line(A[0], A[1], B[0], B[1], c); }
function runner(s, p, l, cD, cL) {
  for (let k = 0; k < 8; k++) { const f0 = lerp(-7.5, 6.5, k / 8), f1 = lerp(-7.5, 6.5, (k + 1) / 8); chairLine(s, p, [l, f0, rockerH(f0)], [l, f1, rockerH(f1)], cD); chairLine(s, p, [l, f0, rockerH(f0) + 0.9], [l, f1, rockerH(f1) + 0.9], cL); }
}
const CW = 3, SEAT = 5.5, ARM = 10.2, BACK = 23;
function chairBack(s, p) {
  runner(s, p, -CW, WOODC[0], WOODC[1]);
  chairLine(s, p, [-CW, -2.6, SEAT], [-CW, -2.6, rockerH(-2.6)], WOODC[0]); chairLine(s, p, [-CW, 2.4, SEAT], [-CW, 2.4, rockerH(2.4)], WOODC[0]);
  chairLine(s, p, [-CW, -4.2, ARM], [-CW, 2.8, ARM], WOODC[2]); chairLine(s, p, [-CW, 2.8, ARM], [-CW, 2.8, SEAT], WOODC[1]);
  for (const l of [-CW, -1.5, 0, 1.5, CW]) chairLine(s, p, [l, -3.8, SEAT], [l, -5.2, BACK], l === -CW || l === CW ? WOODC[1] : WOODC[2]);
  for (const h of [BACK, BACK + 0.8]) chairLine(s, p, [-CW - 0.4, -5.2, h], [CW + 0.4, -5.2, h], h > BACK + 0.5 ? WOODC[3] : WOODC[1]);
  for (let f = -3.8; f <= 2.9; f += 0.25) for (let l = -CW; l <= CW; l += 0.25) { const q = p(l, f, SEAT); s.px(q[0], q[1], WOODC[f > 2.3 ? 3 : 2]); }
}
function chairFront(s, p) {
  chairLine(s, p, [CW, -2.6, SEAT], [CW, -2.6, rockerH(-2.6)], WOODC[1]); chairLine(s, p, [CW, 2.4, SEAT], [CW, 2.4, rockerH(2.4)], WOODC[1]);
  runner(s, p, CW, WOODC[1], WOODC[2]);
  chairLine(s, p, [CW, -4.2, ARM], [CW, 2.8, ARM], WOODC[3]); chairLine(s, p, [CW, -4.2, ARM - 0.9], [CW, 2.8, ARM - 0.9], WOODC[2]); chairLine(s, p, [CW, 2.8, ARM - 0.9], [CW, 2.8, SEAT], WOODC[2]);
}
const SPR_W = 52, SPR_H = 46, OX_C = 25, OY_C = 34, ROCK_TH = 0.03;
/* copy src onto s, shifting each row by how far that height swings as the chair rocks */
function shearOnto(s, src, rock, hipY) {
  for (let y = 0; y < src.h; y++) { const dx = Math.round((hipY - y) / 12 * rock * 0.8); for (let x = 0; x < src.w; x++) { const c = src.d[y * src.w + x]; if (c) s.px(x + dx, y, c); } }
}
/* woman, front on. pose: hold | sip | pet0 | pet1 | wave0 | wave1 | laugh */
function womanSpr(pose, eyes, dy, rock) {
  return cached(`w|${pose}|${eyes}|${dy}|${rock}`, () => {
    const s = new Spr(SPR_W, SPR_H), p = chairProj(OX_C, OY_C, rock * ROCK_TH); chairBack(s, p);
    const b = new Spr(SPR_W, SPR_H), x = OX_C - 9, y = OY_C - 27, bodyY = y + 13;
    b.map(G_BODY, GM, x, bodyY);
    /* blanket over the lap and knees, a fringe along the hem */
    const P_ = PLAID.a; for (let r = 0; r < 12; r++) { const hw = r < 2 ? 7.5 : r < 5 ? 8.5 : 8, cy = bodyY + 5 + r; for (let c = -Math.floor(hw); c <= Math.ceil(hw) - 1; c++) { if (r === 11) { if (c & 1) b.px(x + 8 + c, cy, P_.f); continue; } b.px(x + 8 + c, cy, plaidAt(P_, c + 40, r)); } }
    for (const q of [-5, 3]) { b.rect(x + 8 + q, bodyY + 16, 3, 2, GM.o); }
    const sk = GM.s, w = GM.w, W = GM.W, mx = x + 6, my = bodyY + 2;
    if (pose === 'hold') { b.rect(mx - 3, my + 2, 3, 2, W); b.rect(mx + 6, my + 2, 3, 2, W); b.rect(mx - 1, my + 2, 2, 2, sk); b.rect(mx + 5, my + 2, 2, 2, sk); paintMug(b, 'a', mx, my); }
    else if (pose === 'sip') { b.rect(mx - 4, my + 1, 3, 2, W); b.rect(mx - 2, my - 2, 3, 3, w); b.rect(mx + 6, my, 3, 2, W); b.rect(mx + 5, my - 2, 3, 2, w); paintMug(b, 'a', mx + 1, my - 7); b.rect(mx, my - 4, 2, 2, sk); b.rect(mx + 6, my - 4, 2, 2, sk); }
    else if (pose === 'pet0' || pose === 'pet1') { const k = pose === 'pet1' ? 1 : 0; b.rect(mx - 3, my + 1, 3, 2, W); paintMug(b, 'a', mx - 3, my - 3); b.rect(mx - 3, my, 2, 2, sk); b.rect(mx + 6, my + 3, 3, 3, W); b.rect(mx + 5 + k, my + 6, 3, 2, sk); }
    else if (pose === 'wave0' || pose === 'wave1') { const k = pose === 'wave1' ? 1 : 0; paintMug(b, 'a', mx + 1, my); b.rect(mx + 1, my + 2, 2, 2, sk); b.rect(mx - 4, my + 1, 3, 2, W); b.rect(mx - 6, my - 2, 2, 3, w); b.rect(mx - 7, my - 5, 2, 3, w); b.rect(mx - 7 - k, my - 8, 2, 3, sk); }
    else if (pose === 'laugh') { b.rect(mx - 3, my + 1, 3, 2, W); b.rect(mx - 1, my - 3, 3, 4, w); b.rect(mx + 1, my - 5, 3, 2, sk); paintMug(b, 'a', mx + 5, my + 1); b.rect(mx + 9, my + 2, 2, 2, sk); }
    b.map(G_HEAD, GM, x, y + dy); girlEyes(b, x, y + dy, eyes);
    if (pose === 'laugh') { b.rect(x + 7, y + dy + 10, 3, 1, GM.e); }
    else if (eyes === 'blink') { b.rect(x + 8, y + dy + 10, 2, 1, GM.S); }
    shearOnto(s, b, rock, OY_C - 6); chairFront(s, p);
    s.outline(() => P.ink); s.ax = OX_C; s.ay = OY_C; return s;
  });
}
/* man, in profile facing left. pose: hold | sip | pet0 | pet1 | wave0 | wave1 | laugh */
function manSpr(pose, eyes, dy, rock) {
  return cached(`m|${pose}|${eyes}|${dy}|${rock}`, () => {
    const s = new Spr(SPR_W, SPR_H), p = chairProj(OX_C, OY_C, rock * ROCK_TH); chairBack(s, p);
    const b = new Spr(SPR_W, SPR_H), x = OX_C - 7, top = OY_C - 26, by = top + 10, P_ = PLAID.b;
    b.map(B_BODY, BM, x, by);
    /* thighs run out to the left, then shins drop to the boots; the blanket lies over both */
    for (let r = 0; r < 4; r++) for (let c = -7; c < 15; c++) b.px(x + c, by + 7 + r, plaidAt(P_, c + 40, r + 2));
    for (let r = 0; r < 8; r++) for (let c = -8 + (r > 5 ? 1 : 0); c < -1 + (r < 2 ? 1 : 0); c++) { if (r === 7) { if (c & 1) b.px(x + c, by + 10 + r, P_.f); continue; } b.px(x + c, by + 10 + r, plaidAt(P_, c + 40, r + 6)); }
    b.rect(x - 8, by + 17, 5, 2, BM.b); b.rect(x - 9, by + 18, 2, 1, BM.b); b.rect(x - 3, by + 17, 1, 2, BM.B);
    const J = BM.j, Jd = BM.J, a = BM.a, sk = BM.s, hy = top + dy;
    if (pose === 'hold') { b.rect(x + 1, by + 3, 3, 3, a); b.rect(x - 2, by + 4, 3, 2, a); b.rect(x - 4, by + 4, 2, 2, sk); paintMug(b, 'b', x - 7, by + 2, true); }
    else if (pose === 'sip') { b.rect(x + 1, by + 2, 3, 3, a); b.rect(x - 1, by + 1, 3, 2, a); b.rect(x - 2, by - 1, 2, 2, sk); paintMug(b, 'b', x - 6, by - 4, true); }
    else if (pose === 'pet0' || pose === 'pet1') { const k = pose === 'pet1' ? 1 : 0; b.rect(x + 1, by + 3, 3, 3, a); b.rect(x - 2, by + 5, 3, 2, a); b.rect(x - 4 + k, by + 6, 3, 2, sk); }
    else if (pose === 'wave0' || pose === 'wave1') { const k = pose === 'wave1' ? 1 : 0; b.rect(x + 1, by + 2, 3, 3, a); b.rect(x - 1, by, 3, 3, a); b.rect(x - 3, by - 3, 3, 3, a); b.rect(x - 4 - k, by - 6, 2, 3, sk); }
    else if (pose === 'laugh') { b.rect(x + 1, by + 3, 3, 3, a); b.rect(x - 2, by + 4, 3, 2, a); b.rect(x - 4, by + 4, 2, 2, sk); paintMug(b, 'b', x - 7, by + 2, true); }
    const hx = x - 1; b.map(B_HEAD, BM, hx, hy);
    const ex = hx + 3, E = BM.e;
    if (eyes === 'up') b.rect(ex, hy + 5, 2, 2, E); else if (eyes === 'blink') b.rect(ex, hy + 7, 2, 1, BM.S); else b.rect(ex, hy + 6, 2, 2, E);
    if (pose === 'laugh') b.rect(hx + 2, hy + 8, 2, 1, BM.e);
    shearOnto(s, b, rock, OY_C - 6); chairFront(s, p);
    s.outline(() => P.ink); s.ax = OX_C; s.ay = OY_C; return s;
  });
}
