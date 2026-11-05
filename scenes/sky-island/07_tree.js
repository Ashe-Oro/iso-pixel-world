/* =====================================================================
   The maple: a flared trunk and lobed canopy baked into the static world.
   A sparse list of leaf pixels shimmers on the wind each frame.
   ===================================================================== */
/* lobes as [screen dx, height, radius], back to front */
const CANOPY = [[0, 86, 18], [-22, 79, 17], [23, 77, 16], [-36, 60, 15], [37, 58, 15], [-14, 65, 23], [14, 63, 23], [-27, 42, 16], [27, 40, 16], [0, 47, 24], [-13, 31, 12], [13, 30, 12]];
function leafShade(x, y, dx, dy, r) {
  const n = hash3(x >> 1, y >> 1, 31), tone = 4.5 - (dx * 0.8 + dy) / r * 3.2 + (n - 0.5) * 2.2;
  return R.leaves[clamp(Math.floor(tone), 0, 7)];
}
function blob(wx, wy, wz, r, seed) {
  const cx = Math.round(isx(wx, wy)), cy = Math.round(isy(wx, wy, wz)), d0 = DEP(wx, wy, wz);
  for (let dy = -r - 3; dy <= r + 3; dy++) for (let dx = -r - 3; dx <= r + 3; dx++) {
    const a = Math.atan2(dy, dx), edge = r * (1 + 0.07 * Math.sin(5 * a + seed) + 0.05 * Math.sin(9 * a + seed * 2)) - (hash3((cx + dx) >> 1, (cy + dy) >> 1, 32) * 2.2);
    const d = Math.hypot(dx, dy * 1.08); if (d > edge) continue;
    const i = cx + dx, j = cy + dy; if (i < 0 || j < 0 || i >= IW || j >= IH) continue;
    const bulge = Math.sqrt(Math.max(0, 1 - d * d / (r * r))) * r * 0.9;
    put(j * IW + i, leafShade(i, j, dx, dy, r), d0 + bulge * 2, wx + dx / 4, wy - dx / 4, wz - dy, 3);
  }
}
const TREE_OBJ = [0, 0];
function buildTree() {
  const { x, y } = TREE;
  OBJ = objNew();
  const bark = (ang, v) => { const k = Math.cos(ang - 2.4), g = hash3(Math.floor(ang * 5), Math.floor(v / 3), 33) > 0.6 ? -1 : 0; return R.trunk[clamp(2 + (k > 0.3 ? 1 : k < -0.4 ? -1 : 0) + g + (v < 2 ? -1 : 0), 0, 4)]; };
  cyl(x, y, 0, 4.2, 2.5, bark, 0);
  cyl(x, y, 2.5, 3.1, 34, bark, 0);
  /* limbs */
  for (const [dx, dy, top] of [[5, -4, 40], [-5, 4, 42], [4, 3, 44]]) for (let k = 0; k <= 22; k++) { const u = k / 22, px_ = x + dx * u, py_ = y + dy * u, pz = 22 + (top - 22) * u; cyl(px_, py_, pz, 1.5 - 0.5 * u, 1.6, bark, 0); }
  foot(x - 5, y - 5, x + 5, y + 5, 0, 1);
  TREE_OBJ[0] = OBJ + 1;
  CANOPY.forEach(([sx, z, r], k) => { OBJ = objNew(); const wx = x + sx / 4, wy = y - sx / 4 ; blob(wx, wy, z, r, k * 1.7); SHADOW_SPH.push([wx, wy, z, r / 2.2]); });
  TREE_OBJ[1] = OBJ;
  SHADOW_SPH.push([x, y, 18, 3.5]);
}
