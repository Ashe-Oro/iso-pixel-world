/* =====================================================================
   The yeti: a big shaggy snow creature with a slate face and small horns.
   Side frames face right and flip for the other way. Each frame is built
   from ragged blobs of fur before the outline goes on.
   ===================================================================== */
const YM = pal_({ w: '#fbfcff', a: '#dfe7f7', b: '#b8c6e8', c: '#8a9bcc', d: '#5f6faa', f: '#54669e', F: '#34406e', e: '#0e1228', h: '#efe4c8', H: '#b4a486', m: '#2a2c54' });
const Y_FUR = [YM.d, YM.c, YM.b, YM.a, YM.w];
const furAt = (x, y, dx, dy, seed, shift = 0) => Y_FUR[clamp(Math.round(2.9 + shift - (dx * 0.75 + dy) * 1.6 + (hash3(x >> 1, y, seed) - 0.5) * 1.15), 0, 4)];
/* a filled blob with a torn edge: rows and columns are nudged by a hash so no outline runs straight */
function shag(s, cx, cy, rx, ry, seed, shift = 0) {
  for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, a = Math.atan2(dy, dx), edge = 1 + 0.17 * (hash3(Math.floor((a + 4) * 3.2), seed, 71) - 0.4) + (dy > 0.4 ? 0.12 * (hash3(x, seed, 72) - 0.3) : 0);
    if (dx * dx + dy * dy <= edge * edge) s.px(x, y, furAt(x, y, dx, dy, seed, shift));
  }
}
/* a heavy limb: a thick line of fur from shoulder to hand, ending in a slate paw */
function limb(s, x0, y0, x1, y1, r, seed, paw, shift = 0) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let k = 0; k <= n; k++) { const u = k / n; shag(s, lerp(x0, x1, u), lerp(y0, y1, u), r, r * 1.05, seed + k, shift - u * 0.5); }
  if (paw) { s.rect(Math.round(x1 - r + 1), Math.round(y1 + r - 2), Math.round(r * 2 - 1), 2, YM.f); s.rect(Math.round(x1 - r + 1), Math.round(y1 + r), Math.round(r * 2 - 1), 1, YM.F); }
}
function yetiHorns(s, x, y) {                      // two short horns curling up and out, x is the left one's base
  for (const [dx, dy, c] of [[0, 0, YM.H], [-1, -1, YM.h], [-2, -2, YM.h], [-2, -3, YM.h], [-1, -4, YM.h]]) { s.px(x + dx, y + dy, c); s.px(x + 7 - dx, y + dy, c); }
  s.px(x + 1, y, YM.H); s.px(x + 6, y, YM.H);
}
/* a limb on its own layer with a soft dark edge, so it reads against the body in the same white fur */
function limbOver(s, x0, y0, x1, y1, r, seed, paw, shift) { const l = new Spr(s.w, s.h); limb(l, x0, y0, x1, y1, r, seed, paw, shift); l.outline(() => YM.c); s.blit(l, 0, 0); }
/* tufts: little dark flecks so the coat doesn't read as a blank shape */
function tufts(s, seed, n) { for (let k = 0; k < n; k++) { const x = Math.floor(hash2(seed, k * 2) * s.w), y = Math.floor(hash2(seed, k * 2 + 1) * s.h), c = s.g(x, y); if (c && Y_FUR.includes(c) && s.g(x + 1, y + 1) && s.g(x - 1, y + 1) && Y_FUR.includes(s.g(x + 1, y + 1))) { s.px(x, y, YM.c); s.px(x + 1, y + 1, YM.c); s.px(x - 1, y + 1, YM.b); } } }
/* side view. f 0..3 walks; pose 'stand' | 'look' | 'pat' */
function yetiSide(f, pose) {
  return cached(`y|s|${f}|${pose}`, () => {
    const s = new Spr(60, 54), cx = 27, ground = 48, walking = pose === 'walk', st = walking ? [0, 1, 0, -1][f] : 0, bob = walking && (f & 1) ? -1 : 0, by = 28 + bob;
    /* far leg and arm first, a step darker */
    limb(s, cx - 2 - st * 4, by + 11, cx - 2 - st * 6, ground - 4, 3.8, 11, false, -1.2); s.rect(cx - 6 - st * 6, ground - 1, 8, 2, YM.F);
    if (pose === 'pat') limb(s, cx + 7, by - 8, cx + 20, by - 18, 3.4, 12, false, -0.9); else limb(s, cx + 3, by - 7, cx + 5 + st * 9, by + 9, 3.6, 12, true, -1.2);
    shag(s, cx, by, 11.5, 14, 21, -0.5); tufts(s, 41, 60);
    limbOver(s, cx + 3 + st * 4, by + 9, cx + 3 + st * 6, ground - 4, 4.2, 13, false, 0.2); s.rect(cx - 1 + st * 6, ground - 1, 9, 2, YM.f); s.rect(cx - 1 + st * 6, ground, 9, 1, YM.F);
    /* head hunched forward, or lifted to look */
    const lift = pose === 'look' ? -3 : 0, hx = cx + 7 + (pose === 'look' ? 2 : 0), hy = by - 15 + lift;
    shag(s, hx, hy, 8.5, 8, 22);
    yetiHorns(s, hx - 4, hy - 7);
    s.ell(hx + 4, hy + 1, 4.2, 4.6, YM.f);
    s.rect(hx + 3, hy - 1, 2, 2, YM.e); s.px(hx + 3, hy - 1, YM.w); s.rect(hx + 5, hy + 3, 3, 1, YM.F);
    limbOver(s, cx - 3, by - 7, cx - 5 - st * 9, by + 10, 4, 14, true, 0.5);                 // the near arm swings against the near leg
    s.outline(() => YM.m); s.ax = cx; s.ay = ground + 1; return s;
  });
}
/* front on, for the moment it notices the viewer. wave 0 arm down, 1 and 2 arm up */
function yetiFront(wave) {
  return cached(`y|f|${wave}`, () => {
    const s = new Spr(52, 52), cx = 25, ground = 47, by = 28;
    limb(s, cx - 5, by + 10, cx - 6, ground - 4, 4.4, 31, false, 0); limb(s, cx + 5, by + 10, cx + 6, ground - 4, 4.4, 32, false, 0);
    s.rect(cx - 11, ground - 1, 9, 2, YM.f); s.rect(cx + 2, ground - 1, 9, 2, YM.f); s.rect(cx - 11, ground, 9, 1, YM.F); s.rect(cx + 2, ground, 9, 1, YM.F);
    shag(s, cx, by, 13, 14, 33); tufts(s, 43, 60);
    limb(s, cx - 11, by - 6, cx - 15, by + 9, 3.9, 34, true, -0.5);
    if (wave) limb(s, cx + 11, by - 6, cx + 18 + (wave === 2 ? 2 : -1), by - 18, 3.7, 35, false, -0.2), s.rect(cx + 16 + (wave === 2 ? 2 : -1), by - 23, 5, 3, YM.f);
    else limb(s, cx + 11, by - 6, cx + 15, by + 9, 3.9, 35, true, -0.5);
    const hy = by - 15; shag(s, cx, hy, 9, 8.5, 36); yetiHorns(s, cx - 4, hy - 7);
    s.ell(cx, hy + 1, 5.6, 4.8, YM.f);
    for (const q of [-3, 2]) { s.rect(cx + q, hy - 1, 2, 2, YM.e); s.px(cx + q, hy - 1, YM.w); }
    s.rect(cx - 2, hy + 3, 5, 1, YM.F); s.px(cx - 3, hy + 2, YM.F); s.px(cx + 3, hy + 2, YM.F);        // a small, friendly smile
    s.outline(() => YM.m); s.ax = cx; s.ay = ground + 1; return s;
  });
}
