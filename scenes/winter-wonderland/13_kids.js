/* =====================================================================
   The children: small and round in puffy coats, hats with bobbles. Each
   has a coat, hat and scarf of their own. Frames are built from a view
   (front, back, side) plus a body pose, facing right; flip for left.
   ===================================================================== */
const KID_PAL = [
  { c: '#e04c4c', C: '#a8323e', h: '#fff4e8', H: '#d0d0e4', p: '#f8d048', f: '#3aa0a0', F: '#287878', m: '#f8d048', s: '#f4c4a0', S: '#d89878', a: '#6a3a2a', j: '#3a4470', b: '#3a2830' },
  { c: '#3cb0a8', C: '#268088', h: '#f4b83c', H: '#c08a2c', p: '#e8534c', f: '#e8534c', F: '#b03a3e', m: '#e8534c', s: '#c98a60', S: '#a06a48', a: '#2a1c22', j: '#4a3a5c', b: '#2a2430' },
  { c: '#9a5cc8', C: '#6e3e9c', h: '#ff8ab0', H: '#d0608c', p: '#ffffff', f: '#ffd060', F: '#d0a040', m: '#ff8ab0', s: '#f8d4b4', S: '#e0a888', a: '#c86a30', j: '#3a3a68', b: '#4a2a3a' },
  { c: '#f49030', C: '#c06420', h: '#3a6ec8', H: '#2a4e98', p: '#ffffff', f: '#3a6ec8', F: '#2a4e98', m: '#3a6ec8', s: '#8a5a40', S: '#6a4030', a: '#1e1418', j: '#2e3a60', b: '#2a2028' }
].map(pal_);
const KID_HEAD = {
  front: ['....pp.....', '...pppp....', '..hhhhhhh..', '.hHhHhHhhh.', '.hHhHhHhhh.', '.HHHHHHHHH.', '.ssssssss..', '.ssessses..', '.bsssssbs..', '..ssssss...'],
  back: ['.....pp....', '....pppp...', '..hhhhhhh..', '.hhHhHhHhh.', '.hhHhHhHhh.', '.HHHHHHHHH.', '.aaaaaaaaa.', '.aaaaaaaaa.', '.aaaaaaaaa.', '..aaaaaaa..'],
  side: ['....pp.....', '...pppp....', '..hhhhhhh..', '.hHhHhHhhh.', '.hHhHhHhhh.', '.HHHHHHHHH.', '.aaasssss..', '.aasssses..', '.aaasssbs..', '..aassss...']
};
const KID_BODY = ['..fffffff..', '.fffffffff.', '.ccFfffccc.', 'ccccccccccc', 'ccccccccccc', 'ccccccccccc', '.cccCCCccc.', '.cCCCCCCCc.'];
const KID_LEGS = { stand: ['..jjj.jjj..', '..bbb.bbb..'], w0: ['..jjj.jjj..', '..bbb.bbb..'], w1: ['..jjj..jjj.', '..bbb...bb.'], w2: ['..jjj.jjj..', '..bbb.bbb..'], w3: ['.jjj..jjj..', '.bb...bbb..'] };
const EYE_C = C('#2a1a20'), BLUSH = C('#f09090');
function kidSpr(id, view, pose, f = 0, opt = {}) {
  return cached(`k|${id}|${view}|${pose}|${f}|${opt.bob || 0}|${opt.eye || ''}|${opt.lean || 0}`, () => {
    const P_ = KID_PAL[id], leg = { ...P_, e: EYE_C, b: BLUSH }, legsLeg = { j: P_.j, b: P_.b }, s = new Spr(25, 28), x = 7, top = 3, bob = opt.bob || 0;
    const headV = view === 'back' ? 'back' : view, hx = x + (opt.lean || 0), by = top + 10 + bob;
    /* legs */
    const lk = pose === 'walk' ? 'w' + f : 'stand';
    if (pose === 'sit') { s.rect(x + 7, by + 7, 7, 2, P_.j); s.rect(x + 13, by + 6, 3, 3, P_.b); }
    else if (pose === 'sitfront') { s.rect(x + 2, by + 8, 3, 2, P_.j); s.rect(x + 6, by + 8, 3, 2, P_.j); s.rect(x + 2, by + 10, 3, 1, P_.b); s.rect(x + 6, by + 10, 3, 1, P_.b); }
    else s.map(KID_LEGS[lk], legsLeg, x, by + 8);
    /* body */
    if (view === 'back') s.map(['..fffffff..', '.fffffffff.', '.ccccccccc.', 'ccccccccccc', 'ccccccccccc', 'ccccccccccc', '.cccCCCccc.', '.cCCCCCCCc.'], leg, x, by);
    else s.map(KID_BODY, leg, x, by);
    const m = P_.m, c = P_.c, Cd = P_.C;
    /* arms: mittens are the kid's strongest colour pop */
    if (pose === 'stand' || pose === 'walk' || pose === 'sitfront') { const sw = pose === 'walk' ? (f === 1 ? 1 : f === 3 ? -1 : 0) : 0; s.rect(x - 1, by + 3 + sw, 2, 3, Cd); s.rect(x - 1, by + 6 + sw, 2, 2, m); s.rect(x + 10, by + 3 - sw, 2, 3, Cd); s.rect(x + 10, by + 6 - sw, 2, 2, m); }
    else if (pose === 'cheer') { const k = f & 1; s.rect(x - 1, by + 1 - k, 2, 3, Cd); s.rect(x - 2, by - 2 - k, 2, 3, m); s.rect(x + 10, by + 1 - k, 2, 3, Cd); s.rect(x + 11, by - 2 - k, 2, 3, m); }
    else if (pose === 'nohead') { s.rect(x - 1, by + 1, 2, 3, Cd); s.rect(x, by - 3, 2, 3, m); s.rect(x + 10, by + 1, 2, 3, Cd); s.rect(x + 9, by - 3, 2, 3, m); }
    else if (pose === 'push') { s.rect(x + 8, by + 3, 4, 2, Cd); s.rect(x + 12, by + 3, 2, 2, m); s.rect(x + 8, by + 5, 3, 2, Cd); s.rect(x + 11, by + 5, 2, 2, m); }
    else if (pose === 'lift') { s.rect(x - 1, by, 2, 3, Cd); s.rect(x, by - 3, 2, 3, m); s.rect(x + 10, by, 2, 3, Cd); s.rect(x + 9, by - 3, 2, 3, m); }
    else if (pose === 'reach') { const k = f & 1; s.rect(x + 8, by + 2 - k, 4, 2, Cd); s.rect(x + 12, by + 1 - k, 3, 2, m); s.rect(x - 1, by + 3, 2, 3, Cd); s.rect(x - 1, by + 6, 2, 2, m); }
    else if (pose === 'low') { const k = f & 1; s.rect(x + 8, by + 5, 3, 2, Cd); s.rect(x + 11 + k, by + 6, 3, 2, m); s.rect(x - 1, by + 3, 2, 3, Cd); s.rect(x - 1, by + 6, 2, 2, m); }
    else if (pose === 'sit') { const k = f & 1; s.rect(x + 8, by + 3, 4, 2, Cd); s.rect(x + 12, by + 4 - k, 2, 2, m); }
    else if (pose === 'pull') { s.rect(x - 1, by + 3, 2, 3, Cd); s.rect(x - 3, by + 5, 3, 2, m); s.rect(x + 10, by + 3, 2, 3, Cd); s.rect(x + 10, by + 6, 2, 2, m); }
    /* head */
    s.map(KID_HEAD[headV], leg, hx, top + bob);
    if (view !== 'back' && opt.eye === 'shut') { if (view === 'front') { s.rect(hx + 3, top + 7 + bob, 1, 1, P_.S); s.rect(hx + 7, top + 7 + bob, 1, 1, P_.S); } else s.px(hx + 7, top + 7 + bob, P_.S); }
    if (view !== 'back' && opt.eye === 'happy') { if (view === 'front') { s.rect(hx + 3, top + 7 + bob, 1, 1, P_.S); s.rect(hx + 7, top + 7 + bob, 1, 1, P_.S); s.px(hx + 5, top + 9 + bob, EYE_C); } }
    s.outline(() => P.ink); s.ax = x + 5; s.ay = pose === 'sit' ? by + 8 : by + 9; return s;
  });
}
