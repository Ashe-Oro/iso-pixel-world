/* =====================================================================
   Snow-loaded pines, stamped into the static world, and the one in the
   yard that wears the fairy lights.
   ===================================================================== */
function pineSpr(h, seed) {
  const W = Math.round(h * 0.66) | 1, s = new Spr(W + 4, h + 3), cx = (W + 4) >> 1, tiers = Math.max(3, Math.round(h / 8)), lights = [];
  const trunkH = Math.max(2, Math.round(h * 0.09));
  for (let y = 0; y < h - trunkH; y++) {
    const q = y / (h - trunkH), kf = Math.pow(q, 0.82) * tiers, k = Math.floor(kf), fr = kf - k;
    const hw = (W / 2) * Math.pow((k + 0.35 + 0.65 * fr) / tiers, 0.9) + 0.6;
    for (let x = -Math.ceil(hw); x <= Math.ceil(hw); x++) {
      const e = Math.abs(x) / hw + (hash3(x + 40, y, seed) - 0.5) * 0.14; if (e > 1) continue;
      const side = (x / hw) * 0.9 + (fr - 0.5) * 0.7, tone = 2.4 - side * 1.8 + (hash3(x >> 1, y, seed + 1) - 0.5) * 1.3;
      const snowy = fr < 0.42 - e * 0.18 + (hash3(x >> 1, k, seed + 2) - 0.5) * 0.34;
      s.px(cx + x, y + 1, snowy ? R.snow[clamp(Math.floor(5.6 - side * 2.2), 2, 6)] : R.pine[clamp(Math.floor(tone), 0, 5)]);
    }
  }
  for (let y = h - trunkH; y < h; y++) { s.px(cx - 1, y + 1, R.trunk[2]); s.px(cx, y + 1, R.trunk[1]); s.px(cx + 1, y + 1, R.trunk[1]); }
  s.outline(n => (R.snow.includes(n) ? R.pine[1] : dk(n, 1)));
  s.ax = cx; s.ay = h; return s;
}
const PINES = [
  /* behind the cabin */ [24, -50, 44], [40, -48, 50], [56, -46, 42], [8, -48, 36], [68, -36, 42], [-6, -44, 40], [78, -24, 38], [92, -30, 46],
  /* up on the hill */ [-72, 24, 30], [-80, 12, 34], [-68, -6, 28], [-52, -14, 30],
  /* the hill's left foot */ [-96, 44, 44], [-84, 58, 38], [-104, 34, 34], [-70, 72, 36], [-58, 82, 30], [-112, 56, 46],
  /* the right-hand side */ [66, -18, 34], [84, -6, 32], [100, -18, 44], [116, -14, 38], [124, 4, 48], [110, 14, 36],
  /* framing the foreground */ [-6, 142, 66], [14, 150, 58], [152, 34, 62], [160, 12, 56], [140, 54, 50]
];
const DECOR = { x: 40, y: 22, h: 40, lights: [] };
function buildPines() {
  const sprites = new Map(), spriteFor = (h, seed) => { const k = h * 8 + (seed & 7); if (!sprites.has(k)) sprites.set(k, pineSpr(h, h + (seed & 7) * 13)); return sprites.get(k); };
  for (const [x, y, h] of PINES) {
    const z = GZ(x, y), sp = spriteFor(h, Math.round(x));
    OBJ = objNew(); stampS(sp, x, y, z - 0.5, 0);
    foot(x - 2.4, y - 2.4, x + 2.4, y + 2.4, z, 0.8); SHADOW_SPH.push([x, y, z + h * 0.4, h * 0.2]);
  }
  /* the wooded ridge along the back of the valley: a row on the crest, a row behind it */
  const q = mulberry32(204);
  for (const [back, step, h0, h1] of [[6, 9, 26, 38], [-2, 7, 30, 46]]) for (let u = -128; u < 134; u += step * (0.7 + q() * 0.6)) {
    const v = vBack(u) + (back > 0 ? -back - q() * 5 : 1.5 + q() * 6), x = uvToX(u, v), y = uvToY(u, v), h = Math.round(lerp(h0, h1, q()) / 2) * 2, z = Math.max(0, GZ(uvToX(u, Math.max(v, vBack(u) + 1)), uvToY(u, Math.max(v, vBack(u) + 1))));
    if (Math.hypot(x - HILL.x, y - HILL.y) < 30 || (u > -60 && u < -26 && v > -46)) continue;
    OBJ = objNew(); stampS(spriteFor(h, Math.round(u)), x, y, z - 1, 0); if (back <= 0) foot(x - 2, y - 2, x + 2, y + 2, z, 0.6);
  }
  /* the fairy-light pine in the yard */
  const sp = pineSpr(DECOR.h, 77);
  OBJ = objNew(); stampS(sp, DECOR.x, DECOR.y, 0, 0); foot(DECOR.x - 3, DECOR.y - 3, DECOR.x + 3, DECOR.y + 3, 0, 0.8); SHADOW_SPH.push([DECOR.x, DECOR.y, DECOR.h * 0.4, DECOR.h * 0.2]);
  const r = mulberry32(55), sx = Math.round(isx(DECOR.x, DECOR.y)), sy = Math.round(isy(DECOR.x, DECOR.y, 0));
  for (let k = 0; k < 60; k++) { const q = 0.08 + 0.84 * r(), hw = DECOR.h * 0.3 * q, x = Math.round((r() * 2 - 1) * hw), y = Math.round(sy - DECOR.h * (1 - q)); if (sp.g(x + sp.ax, y - sy + sp.ay)) DECOR.lights.push({ i: sx + x, j: y, c: k % 5, P: [2, 3, 5][k % 3], off: r() }); }
}
