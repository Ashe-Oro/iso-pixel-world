/* =====================================================================
   Animated props & particles. Every system is a pure function of t and
   uses periods that divide LOOP, so the 120 s loop is seamless and no
   objects are allocated per frame (particles are evaluated, not stored).
   ===================================================================== */
const PR = {};
function initProps() {
  // ---- fireplace flame frames (8, procedurally grown, deterministic) ----
  PR.flames = [];
  const fc = [P.fire0, P.fire1, P.fire2, P.fire3, P.fire4, P.fire5];
  for (let f = 0; f < 8; f++) {
    const s = new Spr(16, 16);
    for (let x = 0; x < 16; x++) {
      const base = 1 - Math.abs(x - 7.5) / 8;
      const tongue = 0.55 + 0.45 * Math.sin(x * 1.3 + f * 0.785 * 2) * Math.cos(x * 0.7 - f * 0.785);
      const h = Math.max(0, Math.round(base * 14 * (0.55 + 0.45 * tongue) + hash2(x, f) * 2 - 1));
      for (let y = 0; y < h; y++) { const v = y / Math.max(1, h), core = base > 0.55 && v < 0.5;
        s.px(x, 15 - y, core ? (v < 0.25 ? fc[5] : fc[4]) : v < 0.35 ? fc[3] : v < 0.7 ? fc[2] : v < 0.9 ? fc[1] : fc[0]); }
    }
    // stray licks
    for (let k = 0; k < 2; k++) { const x = 3 + Math.floor(hash2(f, k + 9) * 10), y = 1 + Math.floor(hash2(k, f + 3) * 3); s.px(x, y, fc[2]); s.px(x, y + 1, fc[1]); }
    s.ax = 8; s.ay = 15; PR.flames.push(s);
  }
  PR.candle = [smap(['.y.', 'yhy', '.f.'], { y: P.fire4, h: P.fire5, f: P.fire2 }, 1, 2), smap(['y..', 'hy.', 'f..'], { y: P.fire4, h: P.fire5, f: P.fire2 }, 0, 2), smap(['..y', '.yh', '..f'], { y: P.fire4, h: P.fire5, f: P.fire2 }, 2, 2)];
  // ---- monstera & fern leaves (dynamic sway) ----
  const leaves = (n, seed, spread, len, cols) => { const r = mulberry32(seed), L = []; for (let k = 0; k < n; k++) L.push({ a: -Math.PI / 2 + (r() - 0.5) * spread, len: len * (0.55 + r() * 0.45), w: 1.6 + r() * 1.4, c: cols[Math.floor(r() * cols.length)], ph: r() }); return L; };
  PR.monstera = leaves(9, 3, 2.6, 15, [P.lf1, P.lf2, P.lf2, P.lf3]);
  PR.fern = leaves(12, 8, 2.9, 11, [P.lf2, P.lf3, P.lf4]);
  // ---- curtains (living: X-wall left & right of window; bedroom) ----
  PR.curtain = (w, h, base, tie) => { const s = new Spr(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const fold = Math.sin((x + 0.5) / w * Math.PI * 2.4); let c = fold > 0.4 ? lt(base) : fold < -0.5 ? dk(base) : base;
      if (y === 0) c = P.gd1; if (tie && y > h * 0.55 && y < h * 0.62) c = P.cr3; if (y === h - 1) c = dk(base); s.px(x, y, c); } return s; };
  PR.curL = PR.curtain(5, 24, P.ro2, true); PR.curL2 = PR.curtain(5, 24, P.ro2, true);
  PR.curB = PR.curtain(4, 27, P.cr3, false);
  PR.fairyCols = [P.glow, P.glowR, P.glowG, P.glowB, P.glowP, P.bulb2];
  PR.fish = smap(['.hh.h', 'hhhhh', '.hh.h'], { h: C('#f08a3a') }, 2, 1);
  PR.mouse = [smap(['.oo.', 'oww.', 'owpo'], { o: P.ch3, w: P.ch4, p: P.ro4 }, 2, 2), smap(['.oo', 'owe', 'owp'], { o: P.ch3, w: P.ch4, e: P.ink, p: P.ro4 }, 1, 2)];
  PR.moth = [smap(['c.c', '.c.'], { c: P.cr1 }, 1, 1), smap(['ccc', '.c.'], { c: P.cr1 }, 1, 1)];
  PR.mobile = [smap(['.y.', 'yyy', '.y.'], { y: P.hn2 }, 1, 0), smap(['.cc', 'c..', '.cc'], { c: P.cr3 }, 1, 0), smap(['r', 'R'], { r: P.ro3, R: P.ro2 }, 0, 0)];
  PR.bulbSpr = smap(['.o.', 'byb', '.b.'], { o: P.ch2, b: P.bulb, y: CE('#ffffff') }, 1, 0);
  PR.steamCols = [C('#e9e4dc'), C('#c9c4cf'), C('#a7a3b4')];
}

/* ---- helpers ---- */
const lightW = (x, y, z, room, t) => clamp(lightAt(x, y, z, room, t), 0, 255);
function puffAt(cx, cy, r, d, col, dens, w, key) {        // dithered round puff in screen space
  for (let j = Math.floor(cy - r); j <= cy + r; j++) for (let i = Math.floor(cx - r); i <= cx + r; i++) {
    const dx = i + 0.5 - cx, dy = j + 0.5 - cy, q = (dx * dx + dy * dy) / (r * r); if (q > 1) continue;
    if (BAYER[((j & 3) << 2) | (i & 3)] / 16 > dens * (1 - q * 0.6)) continue;
    dput(i, j, col, d, w);
  }
}

/* ======================= per-frame props ======================= */
function drawProps(t) {
  const A = ANCH;
  /* fire */
  if (FX.fire) {
    const fi = Math.floor(t * 12) % 8, fl = PR.flames[fi], fl2 = PR.flames[(fi + 3) % 8];
    stampD(fl, A.fire.x - 1.6, A.fire.y, A.fire.z + 1.4, 0, 255, false, 0.4);
    stampD(fl2, A.fire.x + 1.8, A.fire.y - 0.3, A.fire.z + 1.2, 0, 255, true, 0.3);
  }
  if (FX.embers) for (let k = 0; k < 9; k++) {
    const n = 40 + k * 3, T = LOOP / n, f = ((t % T) + T) % T / T, c = ((Math.floor(t / T) % n) + n) % n;
    const x = A.fire.x - 3 + hash2(k, c) * 6 + Math.sin(f * 9 + k) * 0.8, z = A.fire.z + 3 + f * 13;
    if (f < 0.85) wpx(x, A.fire.y + 1.6, z, f < 0.4 ? P.ember2 : P.ember, 255, 0.5);
  }
  /* candles on mantel and coffee table */
  if (FX.candle) {
    const ci = k => PR.candle[Math.floor(vnoise(t, 6, 80 + k) * 2.99)];
    for (let k = 0; k < A.mantel.length; k++) { const m = A.mantel[k]; stampD(ci(k), m.x, m.y, m.z + 5, 0, 255); }
    stampD(ci(5), A.candle.x, A.candle.y, A.candle.z - 1, 0, 255);
  }
  /* clock pendulum (2 s period) in the clock's window */
  if (FX.pendulum) {
    const a = Math.sin(TAU * phase(t, 2)) * 0.38, px0 = A.clock.x + 0.1, pz0 = A.clock.z - 10;
    for (let k = 0; k < 6; k++) { const x = px0 + Math.sin(a) * k * 0.5, z = pz0 - k * Math.cos(a);
      const i = Math.floor(isx(x, 32.08)), j = Math.floor(isy(x, 32.08, z)); dput(i, j, k > 3 ? P.gd2 : P.gd1, DEP(x, 32.08, z) + 0.2, 150); if (k > 3) dput(i + 1, j, P.gd1, DEP(x, 32.08, z) + 0.2, 150); }
  }
  /* plants swaying */
  if (FX.plants || true) {
    const sway = FX.plants ? 1 : 0;
    const plant = (L, ax, ay, az, room, k0, scale) => { const lw = lightW(ax, ay, az + 8, room, t);
      for (let k = 0; k < L.length; k++) { const lf = L[k], s = sway * (Math.sin(TAU * (phase(t, 5 + (k % 3)) + lf.ph)) * 0.08 + Math.sin(TAU * phase(t, 13)) * 0.04);
        const a = lf.a + s, n = Math.ceil(lf.len);
        for (let q = 0; q <= n; q++) { const f = q / n, x = Math.cos(a) * lf.len * f * 0.5 * scale, z = -Math.sin(a) * lf.len * f + (f * f) * 3;
          const ww = Math.max(0.5, Math.sin(f * Math.PI) * lf.w);
          for (let u = -ww; u <= ww; u += 0.5) { const sx = Math.floor(isx(ax, ay) + x * 2 + u * Math.sin(a) * 1.4), sy = Math.floor(isy(ax, ay, az) - z + u * Math.cos(a) * 0.6);
            const col = Math.abs(u) < 0.4 ? (f > 0.15 ? lt(lf.c) : P.lf1) : u < 0 ? lf.c : dk(lf.c);
            dput(sx, sy, col, DEP(ax, ay, az) + 2 * z + 1 + k * 0.01, lw); } } } };
    plant(PR.monstera, A.monstera.x, A.monstera.y, A.monstera.z, R_LIV, 0, 1.4);
    plant(PR.fern, A.fern.x, A.fern.y, A.fern.z, R_LIV, 3, 1.0);
  }
  /* curtains */
  {
    const sw = FX.curtains ? 1 : 0, W = A.windowLiv, lw = lightW(1, (W.y0 + W.y1) / 2, 30, R_LIV, t);
    const g = (k) => r => Math.round(sw * Math.sin(TAU * (phase(t, 7) + k)) * (r / 24) * 1.4);
    decalXD(PR.curL, W.y1 + 3.5, 0.3, W.z1 + 2, lw, g(0)); decalXD(PR.curL2, W.y0 + 1, 0.3, W.z1 + 2, lw, g(0.3));
    const Wb = A.windowBed, lb = lightW(1, 16, 80, R_BED, t);
    decalXD(PR.curB, Wb.y1 + 2.5, 0.3, Wb.z1 + 3, lb, r => Math.round(sw * Math.sin(TAU * (phase(t, 9) + 0.2)) * (r / 27) * 1.3));
    decalXD(PR.curB, Wb.y0 + 0.5, 0.3, Wb.z1 + 3, lb, r => Math.round(sw * Math.sin(TAU * (phase(t, 9) + 0.6)) * (r / 27) * 1.3));
  }
  /* fairy lights + wire */
  {
    for (const [x, z] of A.fairyWire) { if (z > 89.5) continue; const i = Math.floor(isx(x, 0.1)), j = Math.floor(isy(x, 0.1, z)); dput(i, j, P.ink3, DEP(x, 0.1, z) + 0.1, 90); }
    for (const f of A.fairy) { const lv = FX.fairy ? fairyLevel(f.k, t) : 0.7, col = PR.fairyCols[f.k % PR.fairyCols.length];
      const i = Math.floor(isx(f.x, 0.2)), j = Math.floor(isy(f.x, 0.2, f.z)), d = DEP(f.x, 0.2, f.z) + 0.3;
      dput(i, j, lv > 0.35 ? col : dk(col), d); if (lv > 0.75) dput(i, j + 1, col, d); }
  }
  /* night light gentle pulse handled by light; desk lamp bulb */
  /* attic: dangling bulb (swaying), fireflies jar, mouse, moth */
  {
    const B = A.bulb, a = FX.bulb ? Math.sin(TAU * phase(t, 6)) * 0.12 : 0, lw = 120;
    let bx = B.x, by = B.y, bz = B.z;
    for (let k = 0; k < B.len; k++) { bx = B.x + Math.sin(a) * k * 0.5; bz = B.z - k; wpx(bx, by, bz, P.ch1, lw, 0); }
    stampD(PR.bulbSpr, bx, by, bz, 0, 255);
    if (FX.moth) { const ph = TAU * phase(t, 4), mx = bx + Math.cos(ph) * 3, my = by + Math.sin(ph * 2) * 1.5, mz = bz - 2 + Math.sin(ph * 3) * 2;
      stampD(PR.moth[Math.floor(t * 14) & 1], mx, my, mz, 0, 230); }
    if (FX.fireflies) { const J = A.jar;
      for (let k = 0; k < 4; k++) { const ph = phase(t, 3 + k * 0.7, k * 0.31), on = Math.sin(TAU * phase(t, 2.2 + k * 0.4, k * 0.2)) > -0.1;
        const x = J.x + Math.cos(TAU * ph) * 0.8, z = J.z + 2 + (k % 3) + Math.sin(TAU * ph * 2) * 0.8; if (on) wpx(x, J.y + 0.6, z, k & 1 ? P.ffly : P.ffly2, 255, 0.8); } }
    if (FX.mouse) { const ph = phase(t, 40); if (ph > 0.3 && ph < 0.42) { const peek = ph < 0.33 ? (ph - 0.3) / 0.03 : ph > 0.39 ? (0.42 - ph) / 0.03 : 1;
        const M = A.mouse; stampD(PR.mouse[Math.floor(t * 3) % 2], M.x + 0.3 * peek, M.y + 0.6 + peek * 0.8, M.z, 0, 100); } }
  }
  /* bedroom mobile (toy gently swinging) */
  if (FX.mobile) { const M = A.mobile, a = Math.sin(TAU * phase(t, 8)) * 0.18, rot = phase(t, 20);
    for (let k = 0; k < 10; k++) wpx(M.x + Math.sin(a) * k * 0.4, M.y, M.z - k, P.ch3, 110);
    const hx = M.x + Math.sin(a) * 4, hz = M.z - 10;
    for (let k = 0; k < 3; k++) { const ang = TAU * (rot + k / 3), ox = Math.cos(ang) * 3, oy = Math.sin(ang) * 3;
      for (let q = 0; q < 3; q++) wpx(hx + ox * q / 3, M.y + oy * q / 3, hz, P.ch3, 110);
      for (let q = 0; q < 3; q++) wpx(hx + ox, M.y + oy, hz - q, P.ch3, 110);
      stampD(PR.mobile[k], hx + ox, M.y + oy, hz - 3, 0, lightW(hx, M.y, hz, R_BED, t)); } }
  /* fishbowl */
  if (FX.fish) { const F = ANCH.fishbowl, ph = phase(t, 6), dir = Math.cos(TAU * ph) > 0;
    stampD(PR.fish, F.x + Math.sin(TAU * ph) * 0.9, F.y + 0.3, F.z + 2.5 + Math.sin(TAU * phase(t, 4)) * 0.4, 0, 160, !dir, 1); }
  /* chimney smoke */
  if (FX.smoke) { const Ch = BG.chimney, i0 = isx(Ch.x, Ch.y), j0 = isy(Ch.x, Ch.y, Ch.z);
    for (let k = 0; k < 7; k++) { const n = 20, T = LOOP / n, f = (((t + k * T / 7) % T) + T) % T / T;
      const x = i0 + f * 26 + Math.sin(f * 5 + k) * 2, y = j0 - 2 - f * 34, r = 1.5 + f * 4.5;
      puffAt(x, y, r, 1e6, f < 0.3 ? P.ch4 : f < 0.65 ? P.ch3 : P.cl3, 0.75 * (1 - f) + 0.08, 60); } }
  /* kettle steam: whistles occasionally (and during the girl's tea) */
  if (FX.steam) {
    const K = A.kettle, act = kettleActivity(t);
    if (act > 0.02) for (let k = 0; k < 10; k++) { const n = 60, T = LOOP / n, f = (((t + k * T / 10) % T) + T) % T / T; if (hash2(k, ((Math.floor((t + k * T / 10) / T) % n) + n) % n) > act) continue;
      const x = K.spoutX + f * 3 + Math.sin(f * 8 + k) * 0.6, z = K.spoutZ + f * 14; wpx(x, K.y, z, PR.steamCols[Math.min(2, Math.floor(f * 3))], 200, 2);
      if (f < 0.5) wpx(x + 0.5, K.y, z, PR.steamCols[0], 200, 2); }
    const M = A.mugTable; if (typeof mugOnTable === 'function' && mugOnTable(t)) steamWisp(M.x, M.y, M.z, t, 3);
  }
  /* dust motes drifting in the lamp light and attic */
  if (FX.dust) {
    const fields = [[A.floorLamp.x + 4, A.floorLamp.y + 5, 18, R_LIV, 8], [97, 14, 84, R_ATT, 7], [30, 44, 20, R_LIV, 5], [96, 56, 24, R_KIT, 5]];
    let k0 = 0;
    for (const [cx, cy, cz, room, n] of fields) for (let k = 0; k < n; k++, k0++) {
      const ax = cx + Math.sin(TAU * phase(t, 23 + k * 3, k * 0.13)) * 5, ay = cy + Math.cos(TAU * phase(t, 17 + k * 2, k * 0.29)) * 4, az = cz + Math.sin(TAU * phase(t, 29 + k, k * 0.41)) * 8;
      if (Math.sin(TAU * phase(t, 5 + (k % 4), k * 0.17)) > 0.2) wpx(ax, ay, az, P.cr3, 230, 3);
    }
  }
}
/* thin rising steam wisp */
function steamWisp(x, y, z, t, n) {
  for (let k = 0; k < n * 3; k++) { const T = LOOP / 40, f = (((t + k * T / (n * 3)) % T) + T) % T / T;
    const xx = x + Math.sin(f * 7 + k * 1.7) * 0.7 + f * 0.8, zz = z + f * 9; if (f < 0.9) wpx(xx, y, zz, PR.steamCols[Math.min(2, Math.floor(f * 3))], 200, 2); }
}

/* ======================= weather ======================= */
function drawWeather(t) {
  const flash = CUR_FLASH;
  /* rain: two layers of streaks over exterior pixels (sky, roof, lawn, exterior wall) */
  if (FX.rain) {
    const LS = ANCH.streetlamp, li = isx(LS.x, LS.y), lj = isy(LS.x, LS.y, LS.z);
    const layers = [[260, 4, 0, [P.rain0, P.rain1]], [130, 6, 1, [P.rain1, P.rain2]]];
    for (const [n, len, lay, cols] of layers) {
      const H = IH + 40;
      for (let k = 0; k < n; k++) {
        const cyc = 4 + (k % 3) + lay * 2, sp = cyc * H / LOOP * 30;   // integer cycles: pass count per loop = cyc*30
        const ph = ((hash2(k, 7 + lay) * H + t * sp) % H + H) % H, cycleN = Math.floor((hash2(k, 7 + lay) * H + t * sp) / H);
        const x0 = Math.floor(hash3(k, lay, cycleN % (cyc * 30)) * (IW + 30)) - 10, y0 = Math.floor(ph) - 20;
        for (let q = 0; q < len; q++) {
          const i = x0 - Math.floor((y0 + q) / 6), j = y0 + q; if (i < 0 || j < 0 || i >= IW || j >= IH) continue;
          const p = j * IW + i, fl = S.flag[p]; if (!(fl & F_EXT) || (fl & F_PANE)) continue;
          if (FR.dep[p] > S.dep[p] + 0.01) continue;                 // something dynamic in front
          const dl = Math.hypot(i - li, (j - lj) * 0.8);
          let c = q < len / 2 ? cols[0] : cols[1];
          if (dl < 34) c = dl < 18 ? P.winL : P.rain3;
          if (flash > 0.3) c = P.rain3;
          FR.idx[p] = c;
        }
      }
    }
  }
  /* splashes + puddle ripples */
  if (FX.splashes) for (let k = 0; k < 40; k++) {
    const n = 50 + (k % 7) * 5, T = LOOP / n, tt = ((t % LOOP) + LOOP) % LOOP, c = Math.floor(tt / T), f = (tt - c * T) / T;
    if (f > 0.25) continue;
    const I = HS.isl, x = I.x0 + hash3(k, c, 1) * (I.x1 - I.x0), y = I.y0 + hash3(k, c, 2) * (I.y1 - I.y0);
    if (x < HS.W + 2 && y < HS.gy1 + 1) continue;
    const i = Math.floor(isx(x, y)), j = Math.floor(isy(x, y, I.z)); if (i < 0 || j < 1 || i >= IW || j >= IH) continue;
    const p = j * IW + i; if (!(S.flag[p] & F_EXT) || S.nrm[p] !== 0) continue;
    if (f < 0.1) { FR.idx[p - IW] = P.rain3; } else { if (i > 0) FR.idx[p - 1 - IW] = P.rain2; if (i < IW - 1) FR.idx[p + 1 - IW] = P.rain2; }
  }
  if (FX.puddles) for (const [px, py, rx, ry] of BG.puddles.concat([[126.5, -2.6, 2.2, 2.2]])) for (let k = 0; k < 3; k++) {
    const n = 30 + k * 7, T = LOOP / n, tt = ((t % LOOP) + LOOP) % LOOP, c = Math.floor(tt / T), f = (tt - c * T) / T;
    const cx = px + (hash3(k, c, px | 0) - 0.5) * rx, cy = py + (hash3(c, k, py | 0) - 0.5) * ry, r = f * 2.4;
    const zc = px > 125 && py < 0 ? HS.isl.z + 9 : HS.isl.z;
    for (let a = 0; a < 16; a++) { const ang = a / 16 * TAU, x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * 0.9;
      const i = Math.floor(isx(x, y)), j = Math.floor(isy(x, y, zc)); if (i < 0 || j < 0 || i >= IW || j >= IH) continue; const p = j * IW + i;
      if (S.flag[p] & F_WATER && f < 0.8) FR.idx[p] = f < 0.4 ? P.rain2 : P.rain1; }
  }
  /* drips: off the gutter, from the downspout into the barrel, off the island's underside */
  if (FX.drips) {
    for (let k = 0; k < 10; k++) { const n = 24 + k * 2, T = LOOP / n, tt = ((t % LOOP) + LOOP) % LOOP, c = Math.floor(tt / T), f = (tt - c * T) / T;
      const x = -4 + (k + 0.5) / 10 * 128, y = -7.2, z = 98 - f * f * 40; if (f > 0.9) continue;
      const i = Math.floor(isx(x, y)), j = Math.floor(isy(x, y, z)); if (i >= 0 && j >= 0 && i < IW && j < IH && (S.flag[j * IW + i] & F_SKY)) dput(i, j, P.rain2, -1e5); }
    { const i = Math.floor(isx(124.3, -4.4)), j0 = Math.floor(isy(124.3, -4.4, 6)); const off = Math.floor(t * 20) % 3;
      for (let q = 0; q < 4; q++) dput(i + (q > 1 ? 1 : 0), j0 + q, (q - off + 3) % 3 ? P.rain2 : P.rain3, DEP(124.3, -4.4, 6) + 5); }
    const ub = BG.islandBottom; if (ub) for (let k = 0; k < 6; k++) { const n = 12 + k * 3, T = LOOP / n, tt = ((t % LOOP) + LOOP) % LOOP, c = Math.floor(tt / T), f = (tt - c * T) / T;
      const pt = ub[Math.floor(hash2(k, 3) * (ub.length - 2)) + 1]; const i = Math.round(pt[0]), j = Math.round(pt[1] + f * f * 60);
      if (j < IH) { dput(i, j, P.rain2, -1e5); if (f > 0.1) dput(i, j - 1, P.rain0, -1e5); } }
  }
}
