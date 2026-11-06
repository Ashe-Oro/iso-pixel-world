/* =====================================================================
   The snowman, built from balls of snow as a stack of sprites, plus the
   loose balls the children roll. Rolling turns the speckle on the ball.
   ===================================================================== */
const SM = { x: 28, y: 32 };                            // where he stands
const BALL_R = { base: 8, mid: 6, head: 4.6 };
function ballSpr(r, spin = 0) {
  r = Math.round(r * 2) / 2;
  return cached(`ball|${r}|${spin}`, () => {
    const S_ = Math.ceil(r) * 2 + 6, s = new Spr(S_, S_), c = S_ / 2;
    s.ell(c, c, r, r, 0, (x, y, dx, dy) => {
      const q = hash3(Math.floor(x + spin * 3) >> 1, y >> 1, 66) > 0.82 ? -1 : 0;
      return R.snow[clamp(Math.round(4.6 - (dx * 0.8 + dy) * 2.1 + q), 1, 6)];
    });
    s.outline(n => R.snow[0]); s.ax = Math.floor(c); s.ay = Math.floor(c + r); return s;
  });
}
/* stages, in the order the children finish him: 0 base, 1 middle, 2 head, 3 buttons, 4 arms, 5 eyes, 6 nose, 7 scarf, 8 hat */
function snowmanSpr(stage) {
  return cached('sm|' + stage, () => {
    const s = new Spr(46, 50), cx = 23, base = 42, r0 = BALL_R.base, r1 = BALL_R.mid, r2 = BALL_R.head, has = k => stage >= k;
    const paintBall = (cy, r) => { s.ell(cx, cy, r, r, 0, (x, y, dx, dy) => R.snow[clamp(Math.round(4.8 - (dx * 0.8 + dy) * 2 + (hash3(x >> 1, y >> 1, 67) > 0.86 ? -1 : 0)), 1, 6)]); for (let a = 0; a < 40; a++) { const q = a / 40 * Math.PI, xx = Math.round(cx + Math.cos(q) * r), yy = Math.round(cy + Math.sin(q) * r); if (a % 2) s.px(xx, yy, R.snow[1]); } };
    const y0 = base - r0, y1 = y0 - r0 - r1 + 3, y2 = y1 - r1 - r2 + 2.5;
    paintBall(y0, r0);
    if (has(1)) paintBall(y1, r1);
    if (has(2)) paintBall(y2, r2);
    if (has(4)) { const tw = P.twig, tl = P.twigL; s.line(cx - r1 + 1, y1, cx - r1 - 7, y1 - 5, tw); s.line(cx - r1 - 4, y1 - 3, cx - r1 - 6, y1 - 7, tl); s.line(cx + r1 - 1, y1, cx + r1 + 7, y1 - 4, tw); s.line(cx + r1 + 4, y1 - 2, cx + r1 + 7, y1 - 7, tl); }
    if (has(3)) { for (const k of [-2, 2]) { s.rect(cx - 1, y1 + k - 0.5, 2, 1, P.coal); } s.rect(cx - 1, y0 - 2, 2, 2, P.coal); s.rect(cx - 1, y0 + 2, 2, 2, P.coal); }
    if (has(5)) { s.rect(cx - 3, y2 - 2, 2, 2, P.coal); s.rect(cx + 1, y2 - 2, 2, 2, P.coal); for (const k of [-3, -1, 1, 3]) s.px(cx + k, y2 + 2 + (Math.abs(k) < 2 ? 1 : 0), P.coal); }
    if (has(6)) { s.rect(cx - 7, y2, 7, 1, P.carrot); s.rect(cx - 5, y2 + 1, 5, 1, P.carrotD); s.px(cx - 8, y2, P.carrotD); }
    if (has(7)) { const c = P.red, d = P.redD; s.rect(cx - 5, y1 - r1 + 1, 11, 2, c); s.rect(cx - 4, y1 - r1 + 3, 9, 1, d); s.rect(cx + 2, y1 - r1 + 3, 3, 6, c); s.rect(cx + 2, y1 - r1 + 7, 3, 2, d); }
    if (has(8)) { const k = P.coal, m = C('#4a4658'); s.rect(cx - 7, y2 - r2 + 1, 15, 2, k); s.rect(cx - 4, y2 - r2 - 7, 9, 8, k); s.rect(cx - 3, y2 - r2 - 6, 2, 6, m); s.rect(cx - 4, y2 - r2 - 2, 9, 2, P.red); }
    s.outline(n => (n === P.coal ? P.ink : R.snow[0])); s.ax = cx; s.ay = base; return s;
  });
}
/* what is left after the dog: a low broken heap, which the children scoop away as they start again */
function rubbleSpr(k) {
  return cached('rub' + k, () => {
    const s = new Spr(46, 22), cx = 23, base = 18;
    for (const [dx, dy, r] of [[-8, -3, 4], [8, -3, 4.5], [0, -5, 6.5], [-3, -3, 5], [5, -2, 4], [-13, -1, 2], [13, -1, 2]]) s.ell(cx + dx * k, base + dy * k, Math.max(1.5, r * k), Math.max(1.2, r * 0.8 * k), 0, (x, y, ex, ey) => R.snow[clamp(Math.round(4.6 - (ex * 0.8 + ey) * 2 + (hash3(x, y, 68) > 0.8 ? -1 : 0)), 1, 6)]);
    s.outline(() => R.snow[0]); s.ax = cx; s.ay = base; return s;
  });
}
const HAT_SPR = outl(smap(pad(['..kkkkk..', '..kmkkk..', '..kmkkk..', '..kkkkk..', '..rrrrr..', 'kkkkkkkkk']), { k: '#2a2630', m: '#4a4658', r: '#c8342e' }, 5, 7));
const CARROT_SPR = outl(smap(pad(['ccccccd.', 'ddddd...']), { c: '#f08030', d: '#c05820' }, 4, 2));
