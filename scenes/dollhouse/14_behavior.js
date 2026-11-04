/* =====================================================================
   Behaviour: deterministic seeded timelines. Each 120 s "episode" starts
   and ends with everyone in their home pose (girl reading on the sofa,
   dog curled in its bed, cat on the sofa back watching the rain), so the
   loop is seamless; free mode strings different seeded episodes together.
   ===================================================================== */
const SOFA_HIP = [12.3, 52.5, 11], SOFA_FRONT = [17.5, 53, 0];
const CAT_PERCH = [3.5, 59, 22], DOG_BED = [48, 44.5, 1.9];
const EPI = new Map();            // tiny episode cache (bounded)

function mkTrack() { return { segs: [] }; }
function hold(tr, t0, t1, pos, anim, o = {}) { tr.segs.push({ t0, t1, pos, anim, ...o }); return t1; }
function walk(tr, t0, path, speed, mode, o = {}) {
  let len = 0; const L = [0];
  for (let k = 1; k < path.length; k++) { len += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1], (path[k][2] - path[k - 1][2]) * (o.stairs ? 0 : 0.3)); L.push(len); }
  const t1 = t0 + len / speed; tr.segs.push({ t0, t1, path, lens: L, len, speed, mode, walk: 1, ...o }); return t1;
}
function arc(tr, t0, dur, from, to, h, anim, o = {}) { tr.segs.push({ t0, t1: t0 + dur, from, to, h, anim, arc: 1, ...o }); return t0 + dur; }

/* ---------------- episode builders ---------------- */
function buildEpisode(variant, seed) {
  const r = mulberry32(seed), j = (a) => (r() * 2 - 1) * a;
  const G = mkTrack(), D = mkTrack(), Ct = mkTrack(), ev = { kettle: [], mugTable: [], variant };
  if (variant === 0) {
    /* ---- "cocoa": dog asks for pets, girl makes cocoa, dog snuggles the napping cat ---- */
    const dWake = 12 + j(1.5);
    hold(D, 0, dWake, DOG_BED, 'dCurl');
    let t = hold(D, dWake, dWake + 1.2, DOG_BED, 'dWake');
    t = hold(D, t, t + 1.4, DOG_BED, 'dBow');
    t = walk(D, t, [[48, 44.5, 0], [34, 43.5, 0], [20.6, 44, 0], [20.6, 53, 0]], 10, 'trot');
    const petA = t + 0.3, petB = petA + 7.5 + j(1);
    t = hold(D, t, petB + 0.4, [20.6, 53, 0], 'dBeg', { flip: 1 });
    const gUp = 41 + j(1.5);
    hold(D, t, gUp + 3, [21, 54, 0], 'dSit', { flip: 1 });
    // girl
    let g = hold(G, 0, petA - 0.5, SOFA_HIP, 'gRead', { sit: 1 });
    g = hold(G, g, petA, SOFA_HIP, 'gHappy', { sit: 1 });
    g = hold(G, g, petB, SOFA_HIP, 'gPet', { sit: 1 });
    g = hold(G, g, gUp, SOFA_HIP, 'gRead', { sit: 1 });
    g = hold(G, g, g + 2.5, SOFA_HIP, 'gStretch', { sit: 1 });
    g = hold(G, g, g + 0.5, SOFA_FRONT, 'gStand');
    const toStove = [[17.5, 53, 0], [18, 65, 0], [62, 64.5, 0], [70, 58, 0], [80.5, 43.6, 0]];
    g = walk(G, g, toStove, 8, 'walk');
    const pourEnd = g + 9 + j(1);
    ev.kettle.push([g - 3, pourEnd]);
    g = hold(G, g, pourEnd, [80.5, 43.6, 0], 'gPour');
    g = hold(G, g, g + 0.6, [80.5, 43.6, 0], 'gStandB');
    g = walk(G, g, toStove.slice().reverse(), 7, 'walkmug');
    g = hold(G, g, g + 0.5, SOFA_FRONT, 'gStandMug');
    const putT = g + 12 + j(1.5);
    g = hold(G, g, putT, SOFA_HIP, 'gSitMug', { sit: 1 });
    g = hold(G, g, g + 1.5, SOFA_HIP, 'gPutMug', { sit: 1 });
    ev.mugTable.push([g, LOOP + 26]);
    const dozeT = 99 + j(1.5);
    g = hold(G, g, dozeT, SOFA_HIP, 'gRead', { sit: 1 });
    g = hold(G, g, 112, SOFA_HIP, 'gDoze', { sit: 1 });
    g = hold(G, g, 115, SOFA_HIP, 'gStretch', { sit: 1 });
    hold(G, g, LOOP, SOFA_HIP, 'gRead', { sit: 1 });
    // dog follows her to the kitchen and back
    t = walk(D, gUp + 3, [[21, 54, 0], [21, 66, 0], [62, 66.5, 0], [70, 60, 0], [71.5, 59.2, 0]], 10, 'trot');
    const sniffEnd = t + 7;
    t = hold(D, t, sniffEnd, [71.5, 59.2, 0], 'dSniff', { flip: 1, slope: -0.5 });
    const back = G.segs.find(s => s.mode === 'walkmug');
    t = hold(D, t, back.t0 + 1.2, [71.5, 59.2, 0], 'dWag');
    t = walk(D, t, [[71.5, 59.2, 0], [62, 66.5, 0], [24, 66, 0], [24, 63, 0]], 10, 'trot');
    const toBed = 79 + j(1.5);
    t = hold(D, t, toBed, [24, 63, 0], 'dSit', { flip: 1 });
    // cat: watches rain, grooms, hops down, steals the dog bed
    const cGroom = 31 + j(2), cJump = cGroom + 8;
    let c = hold(Ct, 0, cGroom, CAT_PERCH, 'cWatch', { flip: 1 });
    c = hold(Ct, c, cJump, CAT_PERCH, 'cGroom');
    c = hold(Ct, c, c + 0.4, CAT_PERCH, 'cCrouch');
    c = arc(Ct, c, 0.55, CAT_PERCH, [18.5, 62.5, 0], 6, 'cLeap');
    c = hold(Ct, c, c + 0.3, [18.5, 62.5, 0], 'cCrouch');
    c = hold(Ct, c, c + 1.2, [18.5, 62.5, 0], 'cSit');
    c = walk(Ct, c, [[18.5, 62.5, 0], [40, 63.5, 0], [45.5, 50, 0], [45.4, 44.6, 1.9]], 6, 'cwalk');
    c = hold(Ct, c, c + 1.5, [45.4, 44.6, 1.9], 'cLoaf');
    const cWake = 101 + j(1.5);
    c = hold(Ct, c, cWake, [45.4, 44.6, 1.9], 'cCurl');
    c = hold(Ct, c, c + 1.5, [45.4, 44.6, 1.9], 'cStretch');
    c = walk(Ct, c, [[45.4, 44.6, 1.9], [46, 50, 0], [40, 64, 0], [18.5, 62.5, 0]], 6, 'cwalk');
    c = hold(Ct, c, c + 0.4, [18.5, 62.5, 0], 'cCrouch');
    c = arc(Ct, c, 0.6, [18.5, 62.5, 0], CAT_PERCH, 26, 'cLeap', { flip: 1 });
    c = hold(Ct, c, c + 0.3, CAT_PERCH, 'cCrouch', { flip: 1 });
    hold(Ct, c, LOOP, CAT_PERCH, 'cWatch', { flip: 1 });
    // dog curls up beside the sleeping cat, later re-centres
    t = walk(D, t, [[24, 63, 0], [40, 63, 0], [52, 52, 0], [52, 47.5, 0]], 8, 'trot');
    t = hold(D, t, t + 1.6, [52, 47.5, 0], 'dSniff', { slope: 0.5, flip: 1 });
    t = hold(D, t, cWake + 3, [50.8, 44.2, 1.9], 'dCurl');
    t = walk(D, t, [[50.8, 44.2, 1.9], [48, 44.5, 1.9]], 4, 'trot');
    hold(D, t, LOOP, DOG_BED, 'dCurl');
    ev.kettle.push([20, 22.5]);
  } else {
    /* ---- "upstairs": girl visits her window seat to watch the rain; pets nap by the fire ---- */
    const up = 16 + j(2);
    let g = hold(G, 0, up, SOFA_HIP, 'gRead', { sit: 1 });
    g = hold(G, g, g + 2.5, SOFA_HIP, 'gStretch', { sit: 1 });
    g = hold(G, g, g + 0.5, SOFA_FRONT, 'gStand');
    g = walk(G, g, [[17.5, 53, 0], [17.5, 41, 0], [9, 38.5, 0], [8.5, 33, 0], [8.5, 26, 0]], 7, 'walk');
    g = walk(G, g, stairPath(true), 6, 'walk', { stairs: 1 });
    g = walk(G, g, [[68.5, 26, HS.uz], [68.5, 17.5, HS.uz], [40, 17.2, HS.uz], [11.5, 16.5, HS.uz]], 7, 'walk');
    g = arc(G, g, 0.5, [11.5, 16.5, HS.uz], [5.2, 16, HS.uz + 9.5], 3, 'gSeat', { flip: 1 });
    const down = 71 + j(3);
    g = hold(G, g, down, [5.2, 16, HS.uz + 9.5], 'gSeat', { flip: 1 });
    g = arc(G, g, 0.5, [5.2, 16, HS.uz + 9.5], [11.5, 16.5, HS.uz], 3, 'gStand');
    g = walk(G, g, [[11.5, 16.5, HS.uz], [40, 17.2, HS.uz], [68.5, 17.5, HS.uz], [68.5, 26, HS.uz]], 7, 'walk');
    g = walk(G, g, stairPath(false), 6, 'walk', { stairs: 1 });
    g = walk(G, g, [[8.5, 26, 0], [8.5, 33, 0], [9, 38.5, 0], [17.5, 41, 0], [17.5, 53, 0]], 7, 'walk');
    g = hold(G, g, g + 0.5, SOFA_FRONT, 'gStand');
    const doze = Math.min(108, Math.max(g + 4, 100 + j(1)));
    g = hold(G, g, doze, SOFA_HIP, 'gRead', { sit: 1 });
    g = hold(G, g, 112, SOFA_HIP, 'gDoze', { sit: 1 });
    g = hold(G, g, 115, SOFA_HIP, 'gStretch', { sit: 1 });
    hold(G, g, LOOP, SOFA_HIP, 'gRead', { sit: 1 });
    // dog: wakes, sniffs about, naps stretched out by the hearth, returns to bed
    const dW = 26 + j(3);
    let t = hold(D, 0, dW, DOG_BED, 'dCurl');
    t = hold(D, t, t + 1.2, DOG_BED, 'dWake'); t = hold(D, t, t + 1.4, DOG_BED, 'dBow');
    t = walk(D, t, [[48, 44.5, 0], [44, 56, 0], [38.5, 61.5, 0]], 8, 'trot');
    t = hold(D, t, t + 4, [38.5, 61.5, 0], 'dSniff', { slope: -0.5, flip: 1 });
    t = hold(D, t, t + 2, [38.5, 61.5, 0], 'dTilt', { flip: 1 });
    t = walk(D, t, [[38.5, 61.5, 0], [36, 44, 0], [33, 42.6, 0]], 8, 'trot');
    t = hold(D, t, 96 + j(2), [33, 42.6, 0], 'dLie');
    t = walk(D, t, [[33, 42.6, 0], [42, 43, 0], [48, 44.5, 1.9]], 6, 'trot');
    hold(D, t, LOOP, DOG_BED, 'dCurl');
    // cat: watches rain, grooms, loafs on the sofa back, back to watching
    let c = hold(Ct, 0, 38 + j(3), CAT_PERCH, 'cWatch', { flip: 1 });
    c = hold(Ct, c, c + 9, CAT_PERCH, 'cGroom');
    c = hold(Ct, c, 104 + j(3), CAT_PERCH, 'cLoaf');
    c = hold(Ct, c, c + 1.5, CAT_PERCH, 'cStretch');
    hold(Ct, c, LOOP, CAT_PERCH, 'cWatch', { flip: 1 });
    ev.kettle.push([58, 61]);
    ev.mugTable.push([0, 30], [100, LOOP + 30]);
  }
  return { G, D, C: Ct, ev };
}
function stairPath(up) {
  const p = [[8.5, 26, 0]];
  for (let x = STAIR.x0; x <= STAIR.x0 + STAIR.n * STAIR.run + 0.01; x += STAIR.run / 2) p.push([x + 0.3, 26, 0]);
  p.push([68.5, 26, HS.uz]);
  return up ? p : p.slice().reverse();
}
function episodeFor(t) {
  const idx = CFG.loop ? 0 : Math.floor(t / LOOP);
  let e = EPI.get(idx);
  if (!e) {
    const h = hash2(CFG.seed, idx + 1);
    const variant = CFG.loop ? (CFG.seed % 3 === 2 ? 1 : 0) : (idx === 0 ? (CFG.seed % 3 === 2 ? 1 : 0) : (h < 0.5 ? 0 : 1));
    e = buildEpisode(variant, (CFG.seed * 1009 + idx * 7919) | 0);
    if (EPI.size > 3) EPI.delete(EPI.keys().next().value);
    EPI.set(idx, e);
  }
  return e;
}
function buildSchedule() { EPI.clear(); }
const localT = t => CFG.loop ? ((t % LOOP) + LOOP) % LOOP : ((t % LOOP) + LOOP) % LOOP;
function kettleActivity(t) {
  const e = episodeFor(t), lt = localT(t);
  for (const [a, b] of e.ev.kettle) if (lt >= a && lt < b) return Math.min(1, (lt - a) / 1.5, (b - lt) / 1.5) * (b - a > 4 ? 0.95 : 0.45);
  return 0;
}
function mugOnTable(t) { const e = episodeFor(t), lt = localT(t); for (const [a, b] of e.ev.mugTable) if ((lt >= a && lt < b) || (lt + LOOP >= a && lt + LOOP < b)) return true; return false; }

/* ---------------- evaluation ---------------- */
function findSeg(tr, lt) { const S_ = tr.segs; for (let k = 0; k < S_.length; k++) if (lt >= S_[k].t0 && lt < S_[k].t1) return S_[k]; return S_[S_.length - 1]; }
function segPos(s, lt) {
  if (s.walk) {
    const d = Math.min(s.len, (lt - s.t0) * s.speed); let k = 1; while (k < s.lens.length - 1 && s.lens[k] < d) k++;
    const a = s.path[k - 1], b = s.path[k], seg = Math.max(1e-6, s.lens[k] - s.lens[k - 1]), f = clamp((d - s.lens[k - 1]) / seg, 0, 1);
    const x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f); let z = lerp(a[2], b[2], f);
    if (s.stairs) z = stairZ(x);
    return { x, y, z, dx: b[0] - a[0], dy: b[1] - a[1], dist: d };
  }
  if (s.arc) { const f = clamp((lt - s.t0) / (s.t1 - s.t0), 0, 1); return { x: lerp(s.from[0], s.to[0], f), y: lerp(s.from[1], s.to[1], f), z: lerp(s.from[2], s.to[2], f) + Math.sin(f * Math.PI) * s.h, f }; }
  return { x: s.pos[0], y: s.pos[1], z: s.pos[2] };
}
const roomAt = (x, y, z) => z >= HS.uz - 1 ? (x < HS.attx ? R_BED : R_ATT) : y < HS.gy0 ? R_STAIR : x < 65.5 ? R_LIV : R_KIT;
/* returns {spr, flip, slope} */
function animFrame(s, lt, t, who) {
  const u = lt - s.t0, fl = !!s.flip;
  const pick = (k) => ({ key: k, flip: fl, slope: s.slope !== undefined ? s.slope : 0 });
  if (s.walk) {
    const p = segPos(s, lt), sdx = 2 * (p.dx - p.dy), sdy = p.dx + p.dy;
    const backV = sdy < 0 || (sdy === 0 && false), flip = sdx < 0;
    if (who === 'g') { const f = Math.floor(p.dist / 1.8) % 4; return { key: `${s.mode}_${backV ? 'b' : 'f'}_${f}`, flip, slope: 0 }; }
    if (who === 'd') { const f = Math.floor(p.dist / 1.6) % 4; return { key: 'trot_' + f, flip, slope: Math.abs(p.dx) >= Math.abs(p.dy) ? 0.5 : -0.5 }; }
    const f = Math.floor(p.dist / 1.5) % 4; return { key: 'walk_' + f, flip, slope: Math.abs(p.dx) >= Math.abs(p.dy) ? 0.5 : -0.5 };
  }
  switch (s.anim) {
    /* girl */
    case 'gRead': { const blink = phase(t, 3.75) < 0.04, pc = phase(t, 7.5), pg = pc < 0.04 ? 1 : pc < 0.08 ? 2 : pc < 0.12 ? 3 : 0;
      const sw = Math.round(Math.sin(TAU * phase(t, 2.5)) * 1.2); return { key: blink && !pg ? 'read_blink' : `read_${clamp(sw, -1, 1) + 1}_${pg}`, flip: 0, slope: 1.5 }; }
    case 'gHappy': return { key: 'read_happy', flip: 0, slope: 1.5 };
    case 'gPet': { const k = Math.floor(u / 0.38) % 2; return { key: u > (s.t1 - s.t0) - 0.8 ? 'pet_2' : 'pet_' + k, flip: 0, slope: 1.5 }; }
    case 'gStretch': { const d = s.t1 - s.t0, f = u / d; return { key: f < 0.25 || f > 0.8 ? 'stretch_0' : 'stretch_1', flip: 0, slope: 1.5 }; }
    case 'gDoze': { const n = FX.breath ? Math.floor(u / 1.6) % 4 : 1; return { key: ['doze_0', 'doze_1', 'doze_2', 'doze_1'][n], flip: 0, slope: 1.5, zzz: 1 }; }
    case 'gSitMug': { const c = u % 5.5; return { key: c > 3.6 && c < 4.8 ? 'sitmug_1' : c > 4.8 ? 'sitmug_2' : 'sitmug_0', flip: 0, slope: 1.5, mug: 1 }; }
    case 'gPutMug': return { key: u < 0.9 ? 'putmug' : 'read_1_0', flip: 0, slope: 1.5 };
    case 'gStand': return { key: phase(t, 3) < 0.05 ? 'stand_f_b' : 'stand_f', flip: fl, slope: 0 };
    case 'gStandMug': return { key: 'walkmug_f_1', flip: 1, slope: 0 };
    case 'gStandB': return { key: 'stand_b', flip: 1, slope: 0 };
    case 'gPour': return { key: 'pour_b_' + (Math.floor(u / 0.9) % 2), flip: 0, slope: 0 };
    case 'gSeat': return { key: 'seat_b_' + (phase(t, 4) < 0.5 ? 0 : 1), flip: 1, slope: 0 };
    /* dog */
    case 'dCurl': { const ear = phase(t, 9, 0.3) < 0.025; return { key: ear ? 'curl_ear' : (phase(t, 3.2) < 0.5 || !FX.breath ? 'curl_0' : 'curl_1'), flip: fl, slope: 0, zzz: 0.5 }; }
    case 'dWake': return { key: 'curl_open', flip: fl, slope: 0 };
    case 'dBow': return { key: u < 0.3 ? 'stand' : 'bow', flip: fl, slope: 0.5 };
    case 'dBeg': return { key: 'beg_' + [0, 1, 2, 1][Math.floor(u / 0.22) % 4], flip: fl, slope: 0.5 };
    case 'dSit': { const c = u % 6; return { key: c > 2.2 && c < 3.6 ? 'sit_tilt' : c > 4.6 ? 'sit_tongue' : 'sit', flip: fl, slope: 0.5 }; }
    case 'dTilt': return { key: Math.floor(u / 0.8) % 2 ? 'sit_tilt' : 'sit', flip: fl, slope: 0.5 };
    case 'dSniff': return { key: 'sniff_' + (Math.floor(u / 0.28) % 2), flip: fl, slope: s.slope !== undefined ? s.slope : 0.5 };
    case 'dWag': return { key: 'wag_' + (Math.floor(u / 0.12) % 4), flip: fl, slope: 0.5 };
    case 'dLie': { const c = u % 3.4; return { key: c < 1.7 || !FX.breath ? 'lie_sleep' : 'lie_sleep_1', flip: fl, slope: 0.5, zzz: 0.5 }; }
    /* cat */
    case 'cWatch': { const k = Math.floor(phase(t, 3) * 6) % 6; return { key: 'sitb_' + k, flip: fl, slope: 0 }; }
    case 'cGroom': { const c = u % 4; if (c < 2.6) return { key: 'groom_' + [0, 1, 2, 1][Math.floor(u / 0.3) % 4], flip: fl, slope: 0 };
      return { key: c > 3.6 ? 'sit_blink' : 'sit_' + (Math.floor(u / 0.4) % 6), flip: fl, slope: 0 }; }
    case 'cCrouch': return { key: 'crouch', flip: fl, slope: 0.5 };
    case 'cLeap': return { key: 'leap', flip: fl, slope: 0.5 };
    case 'cSit': return { key: u > 0.8 ? 'sit_blink' : 'sit_' + (Math.floor(u / 0.3) % 6), flip: fl, slope: 0 };
    case 'cLoaf': { const c = u % 5; return { key: c < 0.2 ? 'loaf_blink' : c < 2.5 || !FX.breath ? 'loaf_0' : 'loaf_1', flip: fl, slope: 0.5 }; }
    case 'cCurl': { const ear = phase(t, 11, 0.6) < 0.02; return { key: ear ? 'curl_ear' : (phase(t, 2.8) < 0.5 || !FX.breath ? 'curl_0' : 'curl_1'), flip: fl, slope: 0.5, zzz: 0.4 }; }
    case 'cStretch': return { key: 'stretch', flip: fl, slope: 0.5 };
  }
  return pick(who === 'g' ? 'stand_f' : who === 'd' ? 'stand' : 'sit_0');
}

/* ---------------- drawing ---------------- */
function initCharacters() { buildGirlFrames(); buildPetFrames(); PR.z = smap(['zzz', '.z.', 'zzz'], { z: P.zzz }, 1, 2); PR.zS = smap(['zz', 'zz'], { z: P.zzz }, 0, 1); }
function drawCharacters(t) {
  const e = episodeFor(t), lt = localT(t);
  const chars = [['g', e.G, GIRL], ['d', e.D, DOG], ['c', e.C, CAT]];
  for (const [who, tr, lib] of chars) {
    const s = findSeg(tr, lt), p = segPos(s, lt), a = animFrame(s, lt, t, who);
    const spr = lib[a.key] || lib[Object.keys(lib)[0]];
    const room = roomAt(p.x, p.y, p.z);
    const hgt = who === 'g' ? 26 : 10;
    const lw = [lightW(p.x, p.y, p.z + 2, room, t), lightW(p.x, p.y, p.z + hgt, room, t)];
    if (!s.sit && p.z < 2.5 && !s.arc) shadowBlob(p.x, p.y, Math.max(0, p.z > 1 ? p.z : 0), who === 'g' ? 6 : who === 'd' ? 9 : 6, 2, 0.5);
    if (who === 'g' && p.z >= HS.uz - 0.5 && !s.arc && !s.sit) shadowBlob(p.x, p.y, HS.uz, 6, 2, 0.5);
    stampD(spr, p.x, p.y, p.z, a.slope, lw, a.flip);
    // extras
    if (a.zzz && FX.zzz) {
      const sx = isx(p.x, p.y) + (who === 'g' ? -2 : 4), sy = isy(p.x, p.y, p.z) - (who === 'g' ? 26 : 8);
      for (let k = 0; k < 3; k++) { const f = phase(t, 4.8, k / 3); if (f > 0.85) continue;
        const zs = who === 'g' && f > 0.35 ? PR.z : PR.zS, x = Math.round(sx + f * 7 + Math.sin(f * 6) * 1.5), y = Math.round(sy - f * 12);
        if (who !== 'g' && a.zzz < 1 && k > 0) continue;
        for (let r = 0; r < zs.h; r++) for (let c = 0; c < zs.w; c++) if (zs.d[r * zs.w + c]) dput(x + c, y + r, zs.d[r * zs.w + c], 1e6); }
    }
    if (a.mug && FX.steam) { const sx = isx(p.x, p.y) + 4, sy = isy(p.x, p.y, p.z) - 6;
      for (let k = 0; k < 6; k++) { const f = phase(t, 1.6, k / 6); const x = Math.round(sx + Math.sin(f * 7 + k) * 1.2 + f), y = Math.round(sy - f * 9); if (f < 0.85) dput(x, y, PR.steamCols[Math.min(2, Math.floor(f * 3))], 1e6, 210); } }
  }
}
function scheduleInfo(t) {
  const e = episodeFor(t), lt = localT(t);
  const a = s => s.walk ? s.mode : s.arc ? 'hop' : s.anim;
  return `ep ${CFG.loop ? 'loop' : Math.floor(t / LOOP)} v${e.ev.variant}<br>girl ${a(findSeg(e.G, lt))} · dog ${a(findSeg(e.D, lt))} · cat ${a(findSeg(e.C, lt))}`;
}
