/* =====================================================================
   Lighting. Each pixel stores warm (0..255) and cool (0..255) light which
   select a palette ramp step via ordered dithering at resolve time.
   Static lights are baked; flickering lights keep sparse maps.
   ===================================================================== */
const AMB = { [R_EXT]: 46, [R_LIV]: 86, [R_KIT]: 88, [R_BED]: 84, [R_ATT]: 80, [R_STAIR]: 70 };
const AMBC = { [R_EXT]: 84, [R_LIV]: 6, [R_KIT]: 6, [R_BED]: 8, [R_ATT]: 10, [R_STAIR]: 0 };
let LIGHTS = [];
const DYN = {};          // sparse dynamic light maps: {idx: Int32Array, val: Uint8Array}

function defineLights() {
  const A = ANCH;
  LIGHTS = [
    { id: 'fire', x: 30, y: 37, z: 7, I: 1.05, r: 30, rooms: { [R_LIV]: 1, [R_KIT]: 0.25, [R_EXT]: 0.35 }, dyn: 1 },
    { id: 'lamp', x: A.floorLamp.x, y: A.floorLamp.y + 1, z: 31, I: 0.95, r: 24, rooms: { [R_LIV]: 1, [R_EXT]: 0.3 } },
    { id: 'lamp2', x: A.floorLamp.x + 2, y: A.floorLamp.y + 3, z: 26, I: 0.35, r: 40, rooms: { [R_LIV]: 1, [R_EXT]: 0.3 } },
    { id: 'candle', x: A.candle.x, y: A.candle.y, z: 12, I: 0.42, r: 9, rooms: { [R_LIV]: 1 }, dyn: 1 },
    { id: 'mantel', x: 30, y: 36, z: 31, I: 0.3, r: 10, rooms: { [R_LIV]: 1 }, dyn: 1 },
    { id: 'pend0', x: A.pendants[0].x, y: 58, z: 22, I: 0.62, r: 22, rooms: { [R_KIT]: 1, [R_LIV]: 0.2, [R_EXT]: 0.35 } },
    { id: 'pend1', x: A.pendants[1].x, y: 58, z: 22, I: 0.62, r: 22, rooms: { [R_KIT]: 1, [R_LIV]: 0.2, [R_EXT]: 0.35 } },
    { id: 'kitAmb', x: 92, y: 44, z: 34, I: 0.5, r: 42, rooms: { [R_KIT]: 1 } },
    { id: 'desk', x: A.deskLamp.x, y: 4.5, z: 74, I: 0.9, r: 20, rooms: { [R_BED]: 1, [R_ATT]: 0.2 } },
    { id: 'night', x: A.nightLight.x, y: 4, z: 74, I: 0.4, r: 12, rooms: { [R_BED]: 1, [R_ATT]: 0.3 } },
    { id: 'bedAmb', x: 38, y: 14, z: 86, I: 0.42, r: 44, rooms: { [R_BED]: 1, [R_ATT]: 0.3 } },
    { id: 'bulb', x: A.bulb.x, y: A.bulb.y, z: 94, I: 1.0, r: 28, rooms: { [R_ATT]: 1, [R_BED]: 0.3 } },
    { id: 'jar', x: A.jar.x, y: A.jar.y + 1, z: 79, I: 0.4, r: 9, rooms: { [R_ATT]: 1 }, dyn: 1 },
    { id: 'hall', x: 10, y: 26, z: 30, I: 0.8, r: 20, rooms: { [R_STAIR]: 1, [R_LIV]: 0.15 } },
    { id: 'hall2', x: 58, y: 26, z: 52, I: 0.5, r: 14, rooms: { [R_STAIR]: 1 } },
    { id: 'street', x: A.streetlamp.x, y: A.streetlamp.y, z: 49, I: 1.1, r: 30, rooms: { [R_EXT]: 1 }, dyn: 1 },
    { id: 'win1', x: 122, y: 25, z: 26, I: 0.3, r: 12, rooms: { [R_EXT]: 1 } }
  ];
  for (const f of A.fairy) LIGHTS.push({ id: 'fairy' + f.k, x: f.x, y: 1.2, z: f.z, I: 0.22, r: 6, rooms: { [R_BED]: 1 }, dyn: 1, fairy: f.k });
}

function lightContrib(L, x, y, z, n) {
  const dx = x - L.x, dy = y - L.y, dz = (z - L.z) / 1.83;
  const d2 = dx * dx + dy * dy + dz * dz, rr = L.r * L.r;
  if (d2 > rr * 2.6) return 0;
  const d = Math.sqrt(d2) + 1e-3;
  let lam = 0.75;
  if (n === 0) lam = 0.45 + 0.55 * Math.max(0, -dz / d);
  else if (n === 1) lam = 0.45 + 0.55 * Math.max(0, -dy / d);
  else if (n === 2) lam = 0.45 + 0.55 * Math.max(0, -dx / d);
  const fall = 1 / (1 + 3.2 * d2 / rr) * Math.max(0, 1 - d2 / (rr * 2.6));
  return L.I * 205 * fall * lam;
}
/* light at an arbitrary world point (for dynamic sprites) */
function lightAt(x, y, z, room, t) {
  let w = AMB[room] || 40;
  for (const L of LIGHTS) {
    const k = L.rooms[room]; if (!k) continue;
    let s = 1; if (L.dyn) s = dynScale(L, t);
    w += lightContrib(L, x, y, z, 3) * k * s;
  }
  return w;
}
function dynScale(L, t) {
  if (L.id === 'fire') return FX.firelight ? fireFlicker(t) : 0.8;
  if (L.id === 'candle' || L.id === 'mantel') return FX.candle ? 0.75 + 0.35 * vnoise(t, 9, L.id === 'candle' ? 51 : 52) : 0.9;
  if (L.id === 'jar') return FX.fireflies ? 0.35 + 0.65 * jarGlow(t) : 0.5;
  if (L.id === 'street') return FX.streetlamp ? streetFlicker(t) : 1;
  if (L.fairy !== undefined) return FX.fairy ? fairyLevel(L.fairy, t) : 0.6;
  return 1;
}
const fireFlicker = t => 0.72 + 0.2 * vnoise(t, 7, 11) + 0.12 * vnoise(t, 17, 12) + 0.06 * wave(t, 3.1);
const jarGlow = t => 0.5 + 0.5 * Math.sin(TAU * phase(t, 4.6)) * (0.6 + 0.4 * vnoise(t, 1.5, 61));
function streetFlicker(t) { const p = phase(t, 40); if (p > 0.61 && p < 0.64) return vnoise(t, 30, 71) > 0.5 ? 0.35 : 1; return 1; }
function fairyLevel(k, t) { const s = Math.sin(TAU * (phase(t, 6 + (k % 5) * 1.5) + k * 0.37)); return 0.55 + 0.45 * s; }

function bakeLights() {
  defineLights();
  // floor-plane room bounds for wall-proximity AO
  const RB = {
    [R_LIV]: { x0: 0, y0: 32, z: 0 }, [R_KIT]: { x0: 67, y0: 32, z: 0 }, [R_BED]: { x0: 0, y0: 0, z: HS.uz }, [R_ATT]: { x0: 76, y0: 0, z: HS.attz }
  };
  const dynLists = {};
  for (const L of LIGHTS) if (L.dyn) dynLists[L.id] = { idx: [], val: [] };
  for (let p = 0; p < NPIX; p++) {
    const f = S.flag[p];
    if (f & F_SKY) { S.warm[p] = 0; S.cool[p] = 0; continue; }
    const room = S.room[p], x = S.wx[p], y = S.wy[p], z = S.wz[p], n = S.nrm[p];
    if (n === 4) { S.warm[p] = 30; S.cool[p] = 70; continue; }       // hills / island underside
    let w = AMB[room] || 40, c = AMBC[room] || 0;
    for (const L of LIGHTS) {
      const k = L.rooms[room]; if (!k) continue;
      const v = lightContrib(L, x, y, z, n) * k;
      if (v < 0.5) continue;
      if (L.dyn) { if (v >= 1) { dynLists[L.id].idx.push(p); dynLists[L.id].val.push(Math.min(255, Math.round(v))); } }
      else w += v;
    }
    // ambient occlusion
    let ao = 0;
    const rb = RB[room];
    if (rb) {
      if (n === 0 && Math.abs(z - rb.z) < 0.3) {
        ao += Math.max(0, 1 - (y - rb.y0) / 3.5) * 0.5 + Math.max(0, 1 - (x - rb.x0) / 3.5) * 0.5;
        for (const F of FOOT) { if (F[5] !== room || Math.abs(F[4] - z) > 0.5) continue;
          const ddx = Math.max(F[0] - x, 0, x - F[2]), ddy = Math.max(F[1] - y, 0, y - F[3]); const dd = Math.hypot(ddx, ddy);
          if (dd < 2.2) ao = Math.max(ao, F[6] * (dd === 0 ? 0.85 : 0.7 * (1 - dd / 2.2))); }
      } else if (n === 1 || n === 2) {
        const hz = z - rb.z; if (hz < 4) ao += (1 - hz / 4) * 0.35;
        const corner = n === 1 ? x - rb.x0 : y - rb.y0; if (corner < 3 && corner >= 0) ao += (1 - corner / 3) * 0.3;
      }
    }
    if (room === R_EXT && n === 0 && z < -3) {                         // lawn: house casts a soft shadow + warm spill
      const near = Math.max(0, 1 - Math.min(Math.abs(y - 72), Math.abs(x - 120)) / 6);
      ao += near * 0.25;
    }
    w *= (1 - clamp(ao, 0, 0.7) * 0.6);
    if (room !== R_EXT) {                                              // cool spill near windows
      for (let k = 1; k < PANES.length; k++) { const W = PANES[k]; if (W.room !== room || W.ext) continue;
        const cx = W.t === 'Y' ? (W.a0 + W.a1) / 2 : W.plane, cy = W.t === 'Y' ? W.plane : (W.a0 + W.a1) / 2, cz = (W.z0 + W.z1) / 2;
        const d = Math.hypot(x - cx, y - cy, (z - cz) / 1.83); c += Math.max(0, 1 - d / 16) * 60; }
    }
    if (f & F_EXT) { c = Math.max(c, n === 0 ? 96 : n === 1 ? 70 : 84); if (n === 0 && z > 90) { c = 70; w += 26; } }   // moonlit exteriors, roof brightest
    S.warm[p] = clamp(Math.round(w), 0, 255); S.cool[p] = clamp(Math.round(c), 0, 255);
  }
  for (const id in dynLists) DYN[id] = { idx: Int32Array.from(dynLists[id].idx), val: Uint8Array.from(dynLists[id].val) };
  buildReflections();
}

/* glossy-floor reflection strips under bright lights (shimmer per frame) */
const REFL = [];
function buildReflections() {
  const mk = (L, room, w, len, key) => {
    const sx = Math.round(isx(L.x, L.y)), sy0 = Math.round(isy(L.x, L.y, 0));
    const list = [];
    for (let j = sy0 + 1; j < sy0 + len; j++) for (let i = sx - w; i <= sx + w; i++) {
      if (i < 0 || j < 0 || i >= IW || j >= IH) continue; const p = j * IW + i;
      if (!(S.flag[p] & F_GLOSS) || S.room[p] !== room) continue;
      const fall = 1 - (j - sy0) / len, fx = 1 - Math.abs(i - sx) / (w + 1);
      list.push(p, Math.round(255 * fall * fx), i - sx, j - sy0);
    }
    REFL.push({ key, list: Int32Array.from(list) });
  };
  mk({ x: 30, y: 39.5 }, R_LIV, 6, 30, 'fire');
  for (const p of ANCH.pendants) mk({ x: p.x, y: p.y }, R_KIT, 2, 9, 'pend');
  mk({ x: ANCH.floorLamp.x + 3, y: ANCH.floorLamp.y + 3 }, R_LIV, 3, 12, 'lamp');
}
