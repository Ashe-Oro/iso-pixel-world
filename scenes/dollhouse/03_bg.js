/* =====================================================================
   Background: night sky bands, moon + halo, tileable drifting clouds,
   misty hills with a sleeping town far below the floating island.
   ===================================================================== */
const BG = { skyList: null, clouds: [], townLights: [], car: null, boltX: 0, moon: { x: 548, y: 54, r: 11 } };

/* periodic (tileable in x) fbm noise on a lattice */
function tileNoise(x, y, period, cell, key) {
  const px = Math.max(1, Math.round(period / cell));
  const fx = x / cell, fy = y / cell; let ix = Math.floor(fx), iy = Math.floor(fy); const tx = fx - ix, ty = fy - iy;
  const h = (a, b) => hash3(((a % px) + px) % px, b, key);
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}
const tileFbm = (x, y, key) => tileNoise(x, y, IW, 48, key) * 0.55 + tileNoise(x, y, IW, 20, key + 1) * 0.3 + tileNoise(x, y, IW, 8, key + 2) * 0.15;

function buildSky() {
  const bands = [P.sky0, P.sky1, P.sky2, P.sky3, P.sky4, P.sky5, P.sky6];
  const top = 0, bot = 300;
  const { x: mx, y: my, r: mr } = BG.moon;
  for (let j = 0; j < IH; j++) for (let i = 0; i < IW; i++) {
    const p = j * IW + i;
    let f = clamp((j - top) / (bot - top), 0, 1) * (bands.length - 1);
    // subtle brightening near the moon
    const dm = Math.hypot(i - mx, (j - my) * 1.1);
    f += Math.max(0, 1.6 - dm / 60);
    f = clamp(f, 0, bands.length - 1);
    let k = Math.floor(f); const fr = f - k;
    if (fr * 16 > BAYER[(j & 3) * 4 + (i & 3)] + 0.5 && k < bands.length - 1) k++;
    let c = bands[k];
    if (dm < mr + 9 && dm >= mr) { const g = (mr + 9 - dm) / 9; if (g * 16 > BAYER[(j & 3) * 4 + (i & 3)]) c = g > 0.6 ? P.cl4 : P.moonG; }
    if (dm < mr) {
      // moon disc with soft craters
      const cr = hash3(i >> 1, j >> 1, 77) > 0.82 || (Math.hypot(i - mx + 4, j - my + 2) < 3.2) || (Math.hypot(i - mx - 3, j - my - 4) < 2.2);
      c = (i - mx) + (j - my) > mr * 0.9 ? P.moon2 : cr ? P.moon2 : P.moon;
    }
    S.idx[p] = c; S.flag[p] = F_SKY | F_EXT; S.room[p] = R_EXT; S.dep[p] = -1e8 - 10; S.nrm[p] = 4;
  }
  // stars, sparse, in clear gaps (twinkle handled per frame via hash)
  ART = mulberry32(4242);
  BG.stars = [];
  for (let k = 0; k < 70; k++) { const x = rndi(0, IW - 1), y = rndi(0, 150); BG.stars.push([x, y, ART()]); }
}

function buildHills() {
  // three ridge lines, each a periodic function of x, with mist bands between
  const ridge = (x, base, amp, k) => base - amp * (0.55 * Math.sin(x * 0.012 + k) + 0.3 * Math.sin(x * 0.031 + k * 2.1) + 0.15 * Math.sin(x * 0.09 + k * 0.7));
  const layers = [[262, 16, 1.3, P.hill1, P.hill2], [292, 14, 3.1, P.hill2, P.hill3], [322, 12, 5.2, P.hill3, P.vi0]];
  for (let L = 0; L < layers.length; L++) {
    const [base, amp, k, c0, c1] = layers[L];
    for (let i = 0; i < IW; i++) {
      const top = Math.round(ridge(i, base, amp, k));
      for (let j = Math.max(0, top); j < IH; j++) {
        const p = j * IW + i;
        let c = c0;
        if (j - top < 1) c = c1;            // faint moonlit rim
        S.idx[p] = c; S.flag[p] = F_EXT; S.dep[p] = -1e8 + L; S.room[p] = R_EXT; S.nrm[p] = 4;
      }
      // mist above each ridge (dither)
      for (let j = top - 7; j < top; j++) { if (j < 0) continue; const p = j * IW + i, g = (j - (top - 7)) / 7;
        if (S.flag[p] & F_SKY && g * 16 > BAYER[(j & 3) * 4 + (i & 3)] + 4) S.idx[p] = L === 0 ? P.sky6 : P.cl3; }
      // tree tufts
      if (hash2(i, L * 13 + 5) > 0.86) { const th = 2 + Math.floor(hash2(i, L) * (3 + L)); for (let j = top - th; j < top; j++) if (j >= 0) { const p = j * IW + i; S.idx[p] = c0; S.flag[p] = F_EXT; S.dep[p] = -1e8 + L; } }
    }
  }
  // town lights clustered in valleys of the middle/near layers
  ART = mulberry32(777);
  const clusters = [[60, 300, 34], [170, 318, 26], [470, 306, 40], [590, 326, 30], [330, 336, 22]];
  for (const [cx, cy, n] of clusters) for (let k = 0; k < n; k++) {
    const x = Math.round(cx + rnd(-22, 22) * (0.4 + ART())), y = Math.round(cy + rnd(-5, 7));
    if (x < 0 || x >= IW || y < 0 || y >= IH) continue;
    const p = y * IW + x; if (S.flag[p] & F_SKY) continue;
    BG.townLights.push({ p, c: pick([P.town, P.town, P.town2, P.town3]), seed: k * 31 + cx, big: ART() > 0.85 });
  }
  // a winding road (for a tiny passing car's headlights)
  BG.road = []; for (let i = 0; i < IW; i++) BG.road.push(Math.round(345 - 6 * Math.sin(i * 0.014 + 0.6) - (i > 400 ? (i - 400) * 0.02 : 0)));
}

function buildClouds() {
  // two tileable layers: [Uint16 map, height, y0]
  const mk = (h, y0, key, thr, cols) => {
    const m = new Uint16Array(IW * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < IW; x++) {
      const n = tileFbm(x, y * 2.2, key);
      const vf = 1 - Math.abs((y / h) - 0.45) * 1.9;              // thicker in the middle band
      const v = n * 0.75 + vf * 0.45;
      if (v < thr) continue;
      const up = tileFbm(x, (y - 2) * 2.2, key) * 0.75 + (1 - Math.abs(((y - 2) / h) - 0.45) * 1.9) * 0.45;
      let c = v > thr + 0.17 ? cols[2] : v > thr + 0.07 ? cols[1] : cols[0];
      if (up < thr) c = cols[3];                                    // moonlit top rim
      if (((x * 3 + y * 5) & 7) === 0 && v < thr + 0.04) continue;  // ragged edge
      m[y * IW + x] = c;
    }
    return { m, h, y0 };
  };
  BG.clouds.push(mk(70, 10, 11, 0.70, [P.cl1, P.cl2, P.cl1, P.cl3]));   // far
  BG.clouds.push(mk(60, 56, 23, 0.74, [P.cl2, P.cl3, P.cl2, P.cl4]));   // near
}

/* precompute the list of sky pixels after the house is drawn */
function finishSky() {
  const arr = [];
  for (let p = 0; p < NPIX; p++) if (S.flag[p] & F_SKY) arr.push(p);
  BG.skyList = Int32Array.from(arr);
  BG.skyBase = new Uint16Array(BG.skyList.length);
  for (let k = 0; k < arr.length; k++) BG.skyBase[k] = S.idx[arr[k]];
}
