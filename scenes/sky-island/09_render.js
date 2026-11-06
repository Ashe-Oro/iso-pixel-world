/* =====================================================================
   Per-frame renderer: copy the static buffers, blend the dusk and night
   light bakes, composite sky, far layer, props and characters with depth
   testing, then resolve palette index + light through the ramp LUT of the
   current time-of-day grade.
   ===================================================================== */
const FR = { idx: new Uint16Array(NPIX), dep: new Float32Array(NPIX), w: new Uint8ClampedArray(NPIX), c: new Uint8ClampedArray(NPIX) };
let CUR_T = 0, CUR_N = 0, AMB_W = 200, AMB_C = 0;

/* ---- dynamic pixel / sprite primitives ---- */
function dput(i, j, col, d, w, c) {
  if (i < 0 || j < 0 || i >= IW || j >= IH) return;
  const p = j * IW + i; if (d < FR.dep[p]) return;
  FR.idx[p] = col; FR.dep[p] = d; FR.w[p] = w === undefined ? AMB_W : w; FR.c[p] = c === undefined ? AMB_C : c;
}
/* stamp sprite as billboard at world point. lw: warm light (number) or [bottom, top]; lc: cool light */
function stampD(spr, wx, wy, wz, slope, lw, flip, extraDepth = 0, lc = AMB_C) {
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
      FR.idx[p] = col; FR.dep[p] = dd; FR.w[p] = light; FR.c[p] = lc;
    }
  }
}
/* sprite drawn in a +y plane (y = y0): pixel (c,r) -> world x = x0 + c/2, z = zTop - r. rowShift sways cloth */
function decalYD(spr, x0, y0, zTop, lw, rowShift, lc) {
  for (let r = 0; r < spr.h; r++) { const sh = rowShift ? rowShift(r) : 0;
    for (let c = 0; c < spr.w; c++) { const col = spr.d[r * spr.w + c]; if (!col) continue;
      const x = x0 + (c + sh + 0.5) / 2, z = zTop - r - 0.5;
      dput(Math.floor(isx(x, y0)), Math.floor(isy(x, y0, z)), col, DEP(x, y0, z) + 0.06, lw, lc); } }
}
/* world-space single pixel (particles) */
function wpx(x, y, z, col, w, dbias = 0, c) { dput(Math.floor(isx(x, y)), Math.floor(isy(x, y, z)), col, DEP(x, y, z) + dbias, w, c); }

/* ---- lighting: blend the two bakes, then flicker the dynamic lamps ---- */
function composeLight(t) {
  const a = FX.lighting ? Math.round(CUR_N * 256) : 0, b = 256 - a, L = BAKE.list, n = L.length, dw = BAKE.dw, dc = BAKE.dc, nw = BAKE.nw, nc = BAKE.nc, W = FR.w, Cc = FR.c;
  for (let k = 0; k < n; k++) { const p = L[k]; W[p] = (dw[p] * b + nw[p] * a) >> 8; Cc[p] = (dc[p] * b + nc[p] * a) >> 8; }
  AMB_W = lerp(AMB.dusk.w, AMB.night.w, CUR_N); AMB_C = lerp(AMB.dusk.c, AMB.night.c, CUR_N);
  applyDynLights(t);
}
/* soft contact shadow ellipse on ground pixels (reduces light) */
function shadowBlob(x, y, z, rx, ry, k) {
  const ci = isx(x, y), cj = isy(x, y, z);
  for (let j = Math.floor(cj - ry - 1); j <= cj + ry + 1; j++) for (let i = Math.floor(ci - rx - 1); i <= ci + rx + 1; i++) {
    if (i < 0 || j < 0 || i >= IW || j >= IH) continue; const p = j * IW + i;
    const dx = (i + 0.5 - ci) / rx, dy = (j + 0.5 - cj) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
    if (S.nrm[p] !== 0 || Math.abs(S.wz[p] - z) > 3 || FR.dep[p] > S.dep[p] + 0.01) continue;
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
  const idx = FR.idx, W = FR.w, Cc = FR.c, lut = lutFor(Math.round(CUR_N * (GRADES - 1))), o = O32;
  applyKeyed(lut, CUR_N);
  const dith = FX.dither, lit = FX.lighting;
  for (let j = 0; j < IH; j++) {
    const bj = (j & 3) << 2, row = j * IW;
    for (let i = 0; i < IW; i++) {
      const p = row + i, b = dith ? BAYER[bj | (i & 3)] : 8;
      const w = lit ? WLV[(W[p] << 4) | b] : 6, c = lit ? CLV[(Cc[p] << 4) | b] : 0;
      o[p] = lut[(idx[p] << 5) | (w << 2) | c];
    }
  }
  OUTX.putImageData(IMG, 0, 0);
  VIEWX.imageSmoothingEnabled = false;
  VIEWX.drawImage(OUTC, 0, 0, VIEW.width, VIEW.height);
}

function renderFrame(t) {
  if (CFG.loop) t = mod(t, LOOP);
  CUR_T = t; CUR_N = night(t);
  FR.idx.set(S.idx); FR.dep.set(S.dep);
  composeLight(t);
  drawSkyGlow(t); drawSun(t); drawMilkyWay(); drawStars(t); drawMoon(t); drawMeteors(t); drawWisps(t);
  drawDragon(t, false); drawFar(t); drawDragon(t, true); drawBirds(t);
  drawCloudSea(t); drawRocks(t);
  drawProps(t);
  if (FX.characters) drawCharacters(t);
  drawFrontProps(t);
  drawNearClouds(t);
  drawOverlay(t);
  resolve();
}
