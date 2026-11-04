/* =====================================================================
   Per-frame renderer: copy static buffers, composite sky, window views,
   dynamic lights, props/characters/particles (depth-tested), then resolve
   palette index + light -> RGBA through the ramp LUT with Bayer dither.
   ===================================================================== */
const FR = { idx: new Uint16Array(NPIX), dep: new Float32Array(NPIX), w: new Uint8ClampedArray(NPIX), c: new Uint8ClampedArray(NPIX) };
let CUR_T = 0, CUR_FLASH = 0;

/* ---- dynamic pixel / sprite primitives ---- */
function dput(i, j, col, d, w) {
  if (i < 0 || j < 0 || i >= IW || j >= IH) return;
  const p = j * IW + i; if (d < FR.dep[p]) return;
  FR.idx[p] = col; FR.dep[p] = d; if (w !== undefined) FR.w[p] = w;
}
/* stamp sprite as billboard at world point. lw: warm light (number) or [bottom, top] */
function stampD(spr, wx, wy, wz, slope, lw, flip, extraDepth = 0) {
  const sx0 = Math.round(isx(wx, wy)) - (flip ? spr.w - 1 - spr.ax : spr.ax), sy0 = Math.round(isy(wx, wy, wz)) - spr.ay, d0 = DEP(wx, wy, wz) + extraDepth;
  const lb = Array.isArray(lw) ? lw[0] : lw, lt_ = Array.isArray(lw) ? lw[1] : lw;
  const w = spr.w, h = spr.h, d = spr.d;
  for (let r = 0; r < h; r++) {
    const j = sy0 + r; if (j < 0 || j >= IH) continue;
    const hh = spr.ay - r, light = lb + (lt_ - lb) * (1 - r / Math.max(1, h - 1));
    for (let c = 0; c < w; c++) {
      const col = d[r * w + (flip ? w - 1 - c : c)]; if (!col) continue;
      const i = sx0 + c; if (i < 0 || i >= IW) continue;
      const p = j * IW + i, dx = c - (flip ? w - 1 - spr.ax : spr.ax), dd = d0 + 2 * hh + slope * dx;
      if (dd < FR.dep[p]) continue;
      FR.idx[p] = col; FR.dep[p] = dd; FR.w[p] = light;
    }
  }
}
/* sprite drawn in a +y wall plane (y = y0): pixel (c,r) -> world x = x0 + c/2, z = zTop - r */
function decalYD(spr, x0, y0, zTop, lw, rowShift) {
  for (let r = 0; r < spr.h; r++) { const sh = rowShift ? rowShift(r) : 0;
    for (let c = 0; c < spr.w; c++) { const col = spr.d[r * spr.w + c]; if (!col) continue;
      const x = x0 + (c + sh + 0.5) / 2, z = zTop - r - 0.5;
      dput(Math.floor(isx(x, y0)), Math.floor(isy(x, y0, z)), col, DEP(x, y0, z) + 0.06, lw); } }
}
/* sprite drawn in a +x wall plane (x = x0); yLeft = y at screen-left edge */
function decalXD(spr, yLeft, x0, zTop, lw, rowShift) {
  for (let r = 0; r < spr.h; r++) { const sh = rowShift ? rowShift(r) : 0;
    for (let c = 0; c < spr.w; c++) { const col = spr.d[r * spr.w + c]; if (!col) continue;
      const y = yLeft - (c + sh + 0.5) / 2, z = zTop - r - 0.5;
      dput(Math.floor(isx(x0, y)), Math.floor(isy(x0, y, z)), col, DEP(x0, y, z) + 0.06, lw); } }
}
/* world-space single pixel (particles) */
function wpx(x, y, z, col, w, dbias = 0) { dput(Math.floor(isx(x, y)), Math.floor(isy(x, y, z)), col, DEP(x, y, z) + dbias, w); }

/* ---- sky: clouds, stars, lightning ---- */
const SKYFLASH = new Map();
function skyFlashCol(c) { let v = SKYFLASH.get(c); if (v === undefined) { v = mixC(c, CE('#9aa6e0'), 0.42, 1); SKYFLASH.set(c, v); } return v; }
const LIGHTNING = [];       // [{t, x, seed}]
function scheduleLightning() {
  LIGHTNING.length = 0; const r = mulberry32(CFG.seed * 7 + 3);
  const n = 2 + Math.floor(r() * 2);
  for (let k = 0; k < n; k++) LIGHTNING.push({ t: 8 + (k + r() * 0.7) * (LOOP - 16) / n, x: r() < 0.5 ? 20 + r() * 70 : 560 + r() * 70, seed: Math.floor(r() * 1e6) });
}
function lightningState(t) {
  if (!FX.lightning) return [0, null];
  const tt = ((t % LOOP) + LOOP) % LOOP;
  for (const L of LIGHTNING) { const d = tt - L.t; if (d < 0 || d > 1.4) continue;
    let f = 0; if (d < 0.07) f = 1; else if (d < 0.14) f = 0.25; else if (d < 0.21) f = 0.85; else f = Math.max(0, 0.6 * (1 - (d - 0.21) / 1.1));
    return [f, d < 0.26 ? L : null]; }
  return [0, null];
}
function drawBolt(L) {
  const r = mulberry32(L.seed); let x = L.x, y = 70 + r() * 20;
  const seg = (x, y, len, w) => { for (let k = 0; k < len; k++) { const nx = x + (r() - 0.5) * 6, ny = y + 3 + r() * 4;
      const steps = Math.ceil(Math.max(Math.abs(nx - x), ny - y)); for (let s = 0; s <= steps; s++) { const px = Math.round(x + (nx - x) * s / steps), py = Math.round(y + (ny - y) * s / steps);
        dput(px, py, P.bolt, -1e8 + 5); if (w) dput(px + 1, py, P.bolt2, -1e8 + 5); }
      x = nx; y = ny; if (r() < 0.12 && len > 6) seg(x, y, Math.floor(len * 0.35), 0); if (y > 268) break; } };
  seg(x, y, 40, 1);
}
function drawSky(t) {
  const L = BG.skyList, base = BG.skyBase, n = L.length;
  const off0 = FX.clouds ? Math.floor(t * IW / LOOP) % IW : 0, off1 = FX.clouds ? Math.floor(t * IW * 2 / LOOP) % IW : 0;
  const C0 = BG.clouds[0], C1 = BG.clouds[1];
  const [flash, bolt] = lightningState(t); CUR_FLASH = flash;
  for (let k = 0; k < n; k++) {
    const p = L[k], j = (p / IW) | 0, i = p - j * IW;
    let c = base[k];
    let yy = j - C0.y0; if (yy >= 0 && yy < C0.h) { const v = C0.m[yy * IW + ((i + off0) % IW)]; if (v) c = v; }
    yy = j - C1.y0; if (yy >= 0 && yy < C1.h) { const v = C1.m[yy * IW + ((i + off1) % IW)]; if (v) c = v; }
    FR.idx[p] = c;
  }
  // stars in clear patches
  for (const [x, y, ph] of BG.stars) { const p = y * IW + x; if (!(S.flag[p] & F_SKY)) continue; const st = FR.idx[p];
    if (st === P.cl1 || st === P.cl2 || st === P.cl3 || st === P.cl4) continue;
    const tw = Math.sin(TAU * (phase(t, 3 + ph * 4) + ph)); if (tw > -0.3) FR.idx[p] = tw > 0.6 ? P.star : P.mb6; }
  if (bolt) drawBolt(bolt);
  if (flash > 0.05) {
    for (let k = 0; k < n; k++) { const p = L[k]; if (flash > 0.3 || ((p * 7) & 3) < flash * 8) FR.idx[p] = skyFlashCol(FR.idx[p]); }
    const add = Math.round(flash * 150);
    for (let k = 0; k < BG.extList.length; k++) FR.c[BG.extList[k]] += add;
    for (let k = 0; k < BG.spillList.length; k += 2) FR.c[BG.spillList[k]] += (BG.spillList[k + 1] * flash * 3) | 0;
  }
  if (FX.town) for (const L2 of BG.townLights) { const on = hash2(L2.seed, Math.floor((((t % LOOP) + LOOP) % LOOP) / 20)) > 0.12; FR.idx[L2.p] = on ? L2.c : P.hill2; }
  if (FX.car) { const ph = phase(t, 40); if (ph < 0.5) { const x = Math.round(ph * 2 * (IW + 40)) - 20, y = x >= 0 && x < IW ? BG.road[x] : -1;
      if (y > 0) { dput(x, y, P.head, -1e8 + 9); dput(x + 1, y, P.head, -1e8 + 9); dput(x - 3, y, P.tail, -1e8 + 9); } } }
}
function prepSkyLists() {
  const ext = [], spill = [];
  for (let p = 0; p < NPIX; p++) { const f = S.flag[p]; if ((f & F_EXT) && !(f & F_SKY)) ext.push(p); else if (!(f & F_EXT) && S.cool[p] > 18 && S.room[p] !== R_EXT) spill.push(p, S.cool[p]); }
  BG.extList = Int32Array.from(ext); BG.spillList = Int32Array.from(spill);
}

/* ---- window views ---- */
const PANECOL = {};
function prepPanes() {
  const lists = PANES.map(() => []);
  for (let p = 0; p < NPIX; p++) { const id = S.pane[p]; if (id && (S.flag[p] & F_PANE) && S.idx[p] === P.mb2) lists[id].push(p); }
  for (let k = 1; k < PANES.length; k++) { const L = lists[k]; const W = PANES[k]; W.list = Int32Array.from(L);
    let i0 = 1e9, i1 = -1e9, j0 = 1e9, j1 = -1e9; for (const p of L) { const j = (p / IW) | 0, i = p - j * IW; i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
    W.bb = [i0, j0, i1, j1]; }
  Object.assign(PANECOL, { n0: CE('#121834'), n1: CE('#1a2246'), n2: CE('#222b56'), st: CE('#3c4a80'), st2: CE('#56679e'), dr: CE('#8ea1d6'), drD: CE('#0e1330'), bok: CE('#c9925a'), bok2: CE('#7b5a5a'),
    w0: CE('#f0a948'), w1: CE('#d9832f'), w2: CE('#ffd98a'), wSt: CE('#ffe6b0'), wSil: CE('#8a4e2a') });
}
function drawPanes(t) {
  const flash = CUR_FLASH, sc = Math.floor(t * 60) % 24, sc2 = Math.floor(t * 45) % 24;
  for (let k = 1; k < PANES.length; k++) {
    const W = PANES[k], L = W.list; if (!L || !L.length) continue;
    const [i0, j0, i1, j1] = W.bb, H = j1 - j0 + 1;
    for (let q = 0; q < L.length; q++) {
      const p = L[q], j = (p / IW) | 0, i = p - j * IW, fy = (j - j0) / H;
      let c;
      if (W.warm) { c = fy < 0.35 ? PANECOL.w2 : fy < 0.75 ? PANECOL.w0 : PANECOL.w1; if (fy > 0.7 && Math.abs(i - (i0 + i1) / 2) < 2 + (fy - 0.7) * 8) c = PANECOL.wSil; }
      else {
        c = fy < 0.3 ? PANECOL.n0 : fy < 0.7 ? PANECOL.n1 : PANECOL.n2;
        if (((i * 7 + j * 3) % 11) === 0 && fy > 0.55) c = (i & 1) ? PANECOL.bok : PANECOL.bok2;       // distant warm bokeh
        if (flash > 0.2) c = skyFlashCol(c);
      }
      if (FX.windowRain) { const hs = hash2(i, k * 17) * 24 | 0; const ph = (j - (i & 1 ? sc : sc2) + hs + 24) % 24;   // pattern scrolls downward
        if (ph === 1 || ph === 2) c = W.warm ? PANECOL.wSt : PANECOL.st; else if (ph === 0 && hash2(i, k) > 0.5) c = W.warm ? PANECOL.w2 : PANECOL.st2; }
      FR.idx[p] = c;
    }
    if (FX.glassDrops) {                                   // drops gather, pause, then slide down the glass
      for (let d = 0; d < 4; d++) {
        const nCyc = 18 + ((k * 7 + d * 5) % 13), T = LOOP / nCyc, cyc = Math.floor(((t % LOOP) + LOOP) % LOOP / T), f = (((t % LOOP) + LOOP) % LOOP - cyc * T) / T;
        const hx = hash3(k, d, cyc), x = Math.round(i0 + 1 + hx * (i1 - i0 - 2)), y0 = j0 + 1 + Math.round(hash3(d, k, cyc + 99) * H * 0.4);
        const slide = f < 0.55 ? 0 : Math.pow((f - 0.55) / 0.45, 2.2) * (H + 2);
        const y = Math.round(y0 + slide);
        for (let ty = y0; ty < y; ty++) { const pp = ty * IW + x; if (S.pane[pp] === k) FR.idx[pp] = W.warm ? PANECOL.w2 : PANECOL.st2; }
        const pp = y * IW + x; if (y <= j1 && S.pane[pp] === k) { FR.idx[pp] = W.warm ? PANECOL.wSt : PANECOL.dr; const pb = pp + IW; if (S.pane[pb] === k) FR.idx[pb] = W.warm ? PANECOL.wSil : PANECOL.drD; }
      }
    }
  }
}

/* ---- dynamic light application ---- */
function applyDynLights(t) {
  if (!FX.lighting) return;
  for (const L of LIGHTS) { if (!L.dyn) continue; const D = DYN[L.id]; if (!D) continue;
    const s = dynScale(L, t), idx = D.idx, val = D.val, n = idx.length;
    for (let k = 0; k < n; k++) FR.w[idx[k]] += val[k] * s; }
  if (FX.reflections) for (const R of REFL) {
    const l = R.list, isFire = R.key === 'fire', amp = isFire ? (FX.firelight ? fireFlicker(t) : 0.8) * 0.75 : R.key === 'lamp' ? 0.35 : 0.55, tq = Math.floor(t * (isFire ? 10 : 3));
    for (let k = 0; k < l.length; k += 4) { const di = l[k + 2], dj = l[k + 3];
      const sh = isFire ? (0.45 + 0.55 * hash3(di + 50, (dj >> 1), tq)) : (0.7 + 0.3 * hash3(di + 50, dj, tq));
      FR.w[l[k]] += l[k + 1] * amp * sh * 0.55; }
  }
}
/* soft contact shadow ellipse on floor pixels (reduces light) */
function shadowBlob(x, y, z, rx, ry, k) {
  const ci = isx(x, y), cj = isy(x, y, z);
  for (let j = Math.floor(cj - ry - 1); j <= cj + ry + 1; j++) for (let i = Math.floor(ci - rx - 1); i <= ci + rx + 1; i++) {
    if (i < 0 || j < 0 || i >= IW || j >= IH) continue; const p = j * IW + i;
    const dx = (i + 0.5 - ci) / rx, dy = (j + 0.5 - cj) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
    if (S.nrm[p] !== 0 || Math.abs(S.wz[p] - z) > 1.2 || FR.dep[p] > S.dep[p] + 0.01) continue;
    FR.w[p] = FR.w[p] * (1 - k * (d < 0.45 ? 1 : 0.55));
  }
}

/* ---- resolve ---- */
let OUTC, OUTX, IMG, O32, VIEW, VIEWX;
function initOutput() {
  OUTC = document.createElement('canvas'); OUTC.width = IW; OUTC.height = IH;
  OUTX = OUTC.getContext('2d'); IMG = OUTX.createImageData(IW, IH); O32 = new Uint32Array(IMG.data.buffer);
  VIEW = document.getElementById('out'); VIEWX = VIEW.getContext('2d'); VIEWX.imageSmoothingEnabled = false;
}
function resolve() {
  buildLUT();
  const idx = FR.idx, W = FR.w, Cc = FR.c, lut = LUT, o = O32, dith = FX.dither, lit = FX.lighting;
  for (let j = 0; j < IH; j++) {
    const bj = (j & 3) << 2, row = j * IW;
    for (let i = 0; i < IW; i++) {
      const p = row + i, b = dith ? BAYER[bj | (i & 3)] : 8;
      const w = lit ? WLV[(W[p] << 4) | b] : 5, c = lit ? CLV[(Cc[p] << 4) | b] : 0;
      o[p] = lut[(idx[p] << 5) | (w << 2) | c];
    }
  }
  OUTX.putImageData(IMG, 0, 0);
  VIEWX.imageSmoothingEnabled = false;
  VIEWX.drawImage(OUTC, 0, 0, VIEW.width, VIEW.height);
}

function renderFrame(t) {
  if (CFG.loop) t = ((t % LOOP) + LOOP) % LOOP;
  CUR_T = t;
  FR.idx.set(S.idx); FR.dep.set(S.dep); FR.w.set(S.warm); FR.c.set(S.cool);
  drawSky(t);
  drawPanes(t);
  applyDynLights(t);
  if (typeof drawProps === 'function') drawProps(t);
  if (FX.characters && typeof drawCharacters === 'function') drawCharacters(t);
  if (typeof drawWeather === 'function') drawWeather(t);
  resolve();
}
