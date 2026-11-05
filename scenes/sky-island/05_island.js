/* =====================================================================
   The island: an organic oval of autumn grass on a stepped rock belly,
   with a pond, a channel to the rim and worn paths. u runs along the
   screen horizontal and v toward the camera (see xyToU / xyToV).
   ===================================================================== */
const ISL = { A: 74, B: 48, D: 158 };
const WOB = [[3, 0.05, 1.0], [5, 0.04, 2.1], [9, 0.025, 0.7], [17, 0.012, 3.3]];
function rimR(a) {
  const c = Math.cos(a), s = Math.sin(a); let k = 1;
  for (const [n, m, p] of WOB) k += m * Math.sin(n * a + p);
  return ISL.A * ISL.B / Math.hypot(ISL.B * c, ISL.A * s) * k;
}
function rimDist(x, y) { const u = xyToU(x, y), v = xyToV(x, y); return rimR(Math.atan2(v, u)) - Math.hypot(u, v); }   // > 0 inside
/* the belly hangs in a few lobes, so each angle has its own depth */
const bellyD = a => ISL.D * (0.74 + 0.14 * Math.sin(2 * a + 0.6) + 0.08 * Math.sin(5 * a + 1.9) + 0.04 * Math.sin(11 * a + 0.4));
function bodyWarp(a, d) { return d + 3 * Math.sin(3 * a + 1) + 1.6 * Math.sin(8 * a + 0.3) + 0.8 * Math.sin(19 * a); }
function bodyR(a, d) {
  const D = bellyD(a), w = bodyWarp(a, d), q = Math.floor(w / 10), fr = w / 10 - q;
  const st = Math.max(0, (q + smooth(fr * 3 - 2)) * 10), f = st / D;                 // cliffs with short ledges between
  if (f >= 1) return 0;
  return rimR(a) * Math.pow(1 - Math.pow(f, 1.25), 0.82) - (d < 4 ? 0 : 0.6);
}
const SUN_A = 2.55;                                    // the low sun sits to the left and a little forward
function rockShade(a, d, i, j) {
  const D = bellyD(a), w = bodyWarp(a, d), fr = w / 10 - Math.floor(w / 10), lightK = 0.5 + 0.5 * Math.cos(a - SUN_A);
  if (d < 2.5 + hash3(Math.floor(a * 70), 3, 1) * 5) return R.grass[hash3(i, j, 9) > 0.7 ? 2 : 1 + (lightK > 0.5 ? 1 : 0)];       // grass lip
  if (d < 8 + hash3(Math.floor(a * 40), 5, 2) * 3) return R.dirt[lightK > 0.55 ? 3 : 2];                                          // soil
  const ivyN = noise2(a * 9 + 30, d / 9);
  if (d < 40 && ivyN - d / 130 > 0.62) return hash3(i >> 1, j >> 1, 4) > 0.72 ? P.ivyL : (hash3(i, j, 5) > 0.4 ? P.ivy : P.ivyD);
  const q = Math.floor(w / 10), crack = noise2(a * 24, d / 14) > 0.76 ? -0.15 : 0;
  let tone = 0.1 + 0.66 * lightK - 0.3 * (d / D) + (hash3(q, 1, 40) - 0.5) * 0.14 + (fr < 0.16 ? 0.17 : fr > 0.82 ? -0.15 : 0) + (noise2(a * 15, d / 6) - 0.5) * 0.2 + crack;
  tone += (bay(i, j) / 16 - 0.5) * 0.045;
  return R.rock[clamp(Math.floor(tone * 8), 0, 7)];
}

const PATHS = [[[8, 5], [-2, 18], [-11, 34], [-15, 47]], [[20, 5], [20.5, 8], [20, 11]]];
function pathDist(x, y) {
  let best = 1e9;
  for (const L of PATHS) for (let k = 1; k < L.length; k++) {
    const [ax, ay] = L[k - 1], [bx, by] = L[k], dx = bx - ax, dy = by - ay, u = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - u * dx, y - ay - u * dy));
  }
  return best;
}
const POND = { x: 29, y: 19.5, rx: 13.5, ry: 7.5 };
const inPond = (x, y, m = 0) => (((x - POND.x) / (POND.rx + m)) ** 2 + ((y - POND.y) / (POND.ry + m)) ** 2) < 1;
const CHANNEL = { y0: 17.5, y1: 22.5, x0: 40 };             // the overflow runs toward +x and off the rim
const inChannel = (x, y) => x > CHANNEL.x0 && y >= CHANNEL.y0 + Math.sin(x * 0.4) * 0.8 && y < CHANNEL.y1 + Math.sin(x * 0.4) * 0.8;
const TREE = { x: -30, y: -13 };
function grassShade(u, v, x, y) {
  const rd = rimDist(x, y); if (rd <= 0) return 0;
  const i = Math.floor(x * 2), j = Math.floor(y * 2), su = xyToU(x, y), sv = xyToV(x, y), n = noise2(su / 15 + 3.3, sv / 8 + 1.7) * 0.6 + noise2(su / 6.5 + 7.1, sv / 3.6 + 4.4) * 0.4, n2 = noise2(su / 3.1, sv / 2.2 + 9), trD = Math.hypot(x - TREE.x, y - TREE.y);
  const pd = pathDist(x, y) + (n2 - 0.5) * 2.4;
  if (pd < 1.6) return hash3(i, j, 21) > 0.82 ? R.dirt[4] : R.dirt[3];
  if (pd < 2.5 && hash3(i, j, 22) > 0.45) return R.grass[2];
  if (trD < 34 && hash3(i, j, 23) * 34 > 26 + trD * 0.34) return R.leaves[3 + Math.floor(hash3(i, j, 24) * 4)];          // fallen leaves under the maple
  const h = hash3(i, j, 25);
  if (h > 0.993) return [P.flower, P.flower2, P.flower][Math.floor(hash3(i, j, 26) * 3)];
  let tone = 4.1 + (n - 0.5) * 1.9 + (n2 - 0.5) * 0.8 - (rd < 2.5 ? 1.1 : 0) + (bay(i, j) / 16 - 0.5) * 0.7;
  if (h > 0.93) tone += 1.1; else if (h < 0.08) tone -= 1.0;
  return R.grass[clamp(Math.floor(tone), 1, 6)];
}
/* the pond keeps a fixed tone map; the colours cycle with the sky */
const WATER_DUSK = ['#241c40', '#2e2652', '#3c3064', '#523c74', '#74507e', '#a8687e', '#e89a7c', '#ffd8a0'];
const WATER_NITE = ['#04121a', '#06202a', '#0a3038', '#0e4448', '#145e5c', '#1e8076', '#3cb4a0', '#a8f4dc'];
const WATER = WATER_DUSK.map((h, k) => CK([[0, h], [0.35, mixHex(h, WATER_NITE[k], 0.25)], [0.7, WATER_NITE[k]], [1, WATER_NITE[k]]]));
function waterShade(u, v, x, y) {
  const pond = inPond(x, y) && rimDist(x, y) > 1.5, chan = inChannel(x, y) && rimDist(x, y) > -1;
  if (!pond && !chan) return 0;
  if (chan && !pond) return WATER[3 + (Math.floor(x * 2 + y) & 1)];
  const dr = Math.sqrt(((x - POND.x) / POND.rx) ** 2 + ((y - POND.y) / POND.ry) ** 2);
  const backEdge = !inPond(x - 1.5, y - 1.5) && !inChannel(x - 1.5, y - 1.5);
  return backEdge ? WATER[1] : WATER[clamp(Math.floor(2.6 + 3.4 * (1 - dr) + 1.2 * (y - POND.y) / POND.ry + bay(Math.floor(x * 2), Math.floor(y * 2)) / 16), 2, 6)];
}
const STONE_SPR = [];
function buildStones() {
  const leg = { a: R.stone[4], b: R.stone[3], c: R.stone[2], d: R.stone[1] };
  STONE_SPR.push(smap(['.aab.', 'aabbc', 'abbcd', '.ccd.'], leg), smap(['.ab.', 'abbc', 'bccd'], leg), smap(['.aabb.', 'aabbbc', 'abbbcc', 'bbcccd', '.ccdd.'], leg));
}
function buildIsland() {
  OBJ = objNew(); FLAG = F_ROCK;
  lathe(0, ISL.D, bodyR, rockShade);
  OBJ = objNew(); FLAG = F_GRASS;
  face('T', -110, -110, 0, 220, 220, grassShade);
  OBJ = objNew(); FLAG = F_WATER | F_NOOUT;
  face('T', 0, -10, 0.05, 90, 70, waterShade);
  FLAG = 0; buildStones();
  /* a mossy boulder, mushrooms and grass tufts keep the open meadow from sitting empty */
  const rock = new Spr(30, 22); rock.ell(14, 13, 12, 8, 0, (x, y, dx, dy) => { const v = 3.1 - (dx + dy) * 1.7 + hash3(x >> 1, y >> 1, 41) * 0.8; return dy < -0.35 && hash3(x, y, 42) > 0.45 ? P.ivy : R.stone[clamp(Math.floor(v), 0, 4)]; });
  rock.ell(22, 16, 6, 5, 0, (x, y, dx, dy) => R.stone[clamp(Math.floor(2.6 - (dx + dy) * 1.5), 0, 4)]); rock.outline(n => dk(n, 2)); rock.ax = 14; rock.ay = 20;
  OBJ = objNew(); stampS(rock, -49, 22, 0, 0); foot(-54, 18, -44, 26, 0, 0.7); SHADOW_SPH.push([-49, 22, 6, 4]);
  const shroom = (w) => { const leg = { r: '#c8402e', R: '#8e2a26', d: '#fff0dc', s: '#e8d8c0', S: '#b8a890' }; return outl(smap(pad(w ? ['..rrr..', '.rdrrr.', 'rrrrdrr', 'RRRRRRR', '..sS...', '..sS...'] : ['.rr.', 'rdrr', 'RRRR', '.sS.']), leg)); };
  for (const [x, y, w] of [[-41, 15, 1], [-38, 17, 0], [-33, 37, 1], [-44, 22, 0], [-16, 14, 0]]) { OBJ = objNew(); stampS(shroom(w), x, y, 0, 0); foot(x - 1, y - 1, x + 1, y + 1, 0, 0.4); }
  const tuft = k => outl(smap(pad(k ? ['g..g.', '.g.gg', '.ggg.', 'GGGG.'] : ['..g.', 'g.g.', '.gg.', '.GG.']), { g: R.grass[5], G: R.grass[3] }));
  const r_ = mulberry32(61); for (let k = 0; k < 26; k++) { const x = -56 + r_() * 100, y = -8 + r_() * 66; if (rimDist(x, y) < 5 || inPond(x, y, 3) || pathDist(x, y) < 4 || (x > 0 && y < 6)) continue; OBJ = objNew(); stampS(tuft(k & 1), x, y, 0, 0); }
  /* stones round the pond, leaving the channel mouth open */
  for (let k = 0; k < 15; k++) {
    const a = k / 15 * TAU + 0.2, x = POND.x + (POND.rx + 1.4) * Math.cos(a), y = POND.y + (POND.ry + 1.4) * Math.sin(a);
    if (x > POND.x + 8 && Math.abs(y - POND.y) < 7) continue;
    OBJ = objNew(); stampS(STONE_SPR[k % 3], x, y, 0, 0); foot(x - 1.5, y - 1.5, x + 1.5, y + 1.5, 0, 0.5);
  }
}
