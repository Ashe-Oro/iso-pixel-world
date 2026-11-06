/* =====================================================================
   The story. One authored 240 s storyboard, opening on the finished
   snowman: the dog knocks him down, the children rebuild him piece by
   piece, the dog brings the carrot back, and everyone cheers as the loop
   closes. The sledders run laps on the hill, the cat comes out through
   the flap for its laps, and the couple rock and watch.
   ===================================================================== */
const EPI = new Map();
const T = { CRASH: 44.2, BASE: 86, MID: 99, HEAD: 119.5, BTN: 126, ARMS: 135, EYES: 143, NOSE: 184, SCARF: 190, HAT: 218 };
const at = (x, y, dz = 0) => [x, y, GZ(x, y) + dz];
const rideEase = u => (u < 0.65 ? 0.66 * (u / 0.65) ** 2 : Math.min(1, 0.66 + 2.03 * (u - 0.65) - 2.9 * (u - 0.65) ** 2));
const pathLen = P_ => { let n = 0; for (let k = 1; k < P_.length; k++) n += Math.hypot(P_[k][0] - P_[k - 1][0], P_[k][1] - P_[k - 1][1]); return n; };
function pointAt(P_, d) {
  let k = 1, n = 0;
  for (; k < P_.length; k++) { const l = Math.hypot(P_[k][0] - P_[k - 1][0], P_[k][1] - P_[k - 1][1]); if (d <= n + l || k === P_.length - 1) { const v = clamp((d - n) / Math.max(1e-6, l), 0, 1); return [lerp(P_[k - 1][0], P_[k][0], v), lerp(P_[k - 1][1], P_[k][1], v)]; } n += l; }
  return P_[P_.length - 1];
}
function cutPath(P_, len) { const out = [P_[0]]; let n = 0; for (let k = 1; k < P_.length; k++) { const l = Math.hypot(P_[k][0] - P_[k - 1][0], P_[k][1] - P_[k - 1][1]); if (n + l >= len) { out.push(pointAt(P_, len)); return out; } n += l; out.push(P_[k]); } return out; }
/* a track is a list of segments covering [0, LOOP); each builder call starts where the last one ended */
function tk() {
  const tr = { segs: [], now: 0 };
  const lens = path => { const L = [0]; let n = 0; for (let k = 1; k < path.length; k++) { n += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]); L.push(n); } return { lens: L, len: n }; };
  tr.hold = (t1, pos, anim, o = {}) => { tr.segs.push({ t0: tr.now, t1, pos, anim, ...o }); tr.now = t1; return tr; };
  tr.go = (t1, path, anim, o = {}) => { tr.segs.push({ t0: tr.now, t1, path, ...lens(path), anim, ...o }); tr.now = t1; return tr; };
  tr.hop = (t1, a, b, h, anim, o = {}) => { tr.segs.push({ t0: tr.now, t1, path: [[a[0], a[1]], [b[0], b[1]]], ...lens([a, b]), hop: [a[2], b[2], h], anim, ...o }); tr.now = t1; return tr; };
  return tr;
}
function findSeg(tr, lt) { const s = tr.segs; for (let k = 0; k < s.length; k++) if (lt >= s[k].t0 && lt < s[k].t1) return s[k]; return s[s.length - 1]; }
function segPos(s, lt) {
  if (!s.path) return s.pos;
  const u = clamp((lt - s.t0) / (s.t1 - s.t0), 0, 1), e = s.ride ? rideEase(u) : u, d = e * s.len, L = s.lens; let k = 1;
  while (k < L.length - 1 && d > L[k]) k++;
  const v = (d - L[k - 1]) / Math.max(1e-6, L[k] - L[k - 1]), a = s.path[k - 1], b = s.path[k], x = lerp(a[0], b[0], v), y = lerp(a[1], b[1], v);
  if (s.hop) return [x, y, lerp(s.hop[0], s.hop[1], e) + 4 * s.hop[2] * e * (1 - e)];
  return [x, y, GZ(x, y)];
}
/* places */
const SPOT = {
  ka: [26, 41], kb: [36, 30], kc: [32, 54], kd: [20, 47], kdWait: [8, 50], dog: [2, 41], dogBow: [3, 34], dogHit: [22, 33], dogStop: [30, 33.5], dogLie: [-4, 30],
  liftA: [26, 40.5], liftB: [17.5, 39.5], sticks: [14, 26], armA: [21.5, 35.5], btn: [21, 35], hat: [12, 45], head: [42, 34], handoff: [18.5, 41.5]
};
const WOMAN = [34, 0, HS.deckZ], MAN = [50, 0, HS.deckZ];
const LAP = { w: [WOMAN[0], 1.2, WOMAN[2] + 8.5], m: [MAN[0] - 1, 1.8, MAN[2] + 8.5] };
const WIN_CAT = { i: Math.round(isx(36.5, HS.y1)) + 1, j: Math.round(isy(36.5, HS.y1, HS.sill)) };
const FLAP_X = (FLAP.x0 + FLAP.x1) / 2;
const ROLL_A = spline([[18, 39], [8, 38], [3, 30], [8, 21], [18, 23], [25, 29], [28, 32]]), ROLL_B = spline([[37, 38], [30, 45], [22, 46], [13, 44], [11, 38], [21.5, 36.5]]);
const ROLL_H = [[42, 34], [35, 33]];
const ROLLS = { base: { P: ROLL_A, r0: 1.5, r1: BALL_R.base }, mid: { P: ROLL_B, r0: 1.5, r1: BALL_R.mid }, head: { P: ROLL_H, r0: BALL_R.head, r1: BALL_R.head } };
for (const k in ROLLS) { const R_ = ROLLS[k]; R_.len = pathLen(R_.P); R_.kidP = cutPath(R_.P, R_.len - R_.r1 - 3); R_.kidLen = pathLen(R_.kidP); }
function buildEpisode() {
  const P3 = q => at(q[0], q[1]);
  const A = tk(), B = tk(), Cc = tk(), Dd = tk(), SC_ = tk(), SD = tk(), Dg = tk(), Ct = tk(), Wm = tk(), Mn = tk();
  const ka = P3(SPOT.ka), kb = P3(SPOT.kb), arm = P3(SPOT.armA);
  /* the builders */
  A.hold(4, ka, 'cheer').hold(T.CRASH + 0.3, ka, 'stand').hold(47.5, ka, 'nohead').hold(54.5, ka, 'stand')
    .go(59.5, [SPOT.ka, [14, 38], [8, 34]], 'walk').hold(62, at(8, 34), 'stand', { face: -1 }).go(63.4, [[8, 34], ROLL_A[0]], 'walk')
    .go(T.BASE, ROLLS.base.kidP, 'push', { roll: 'base' }).hold(90, at(...ROLLS.base.kidP[ROLLS.base.kidP.length - 1]), 'low')
    .go(93, [ROLLS.base.kidP[ROLLS.base.kidP.length - 1], SPOT.liftA], 'walk').hold(95.5, P3(SPOT.liftA), 'stand').hold(T.MID, P3(SPOT.liftA), 'lift').hold(103, P3(SPOT.liftA), 'cheer')
    .go(109, [SPOT.liftA, [32, 43], [44, 40], [48, 34.5]], 'walk').go(115, cutPath([[48, 34.5], [39, 33.5]], 9), 'push', { roll: 'head' })
    .hold(116, at(39, 33.5), 'stand', { face: -1 }).hold(T.HEAD, at(39, 33.5), 'lift').hold(123, at(39, 33.5), 'cheer')
    .go(129, [[39, 33.5], [34, 42], [20, 40], [14, 27]], 'walk').hold(130.5, P3([14, 27]), 'low', { face: 1 }).go(133, [[14, 27], SPOT.armA], 'walk')
    .hold(136, arm, 'reach', { face: 1 }).hold(222, arm, 'stand', { face: 1 }).go(226, [SPOT.armA, [24, 41], SPOT.ka], 'walk').hold(229.5, ka, 'stand').hold(LOOP, ka, 'cheer');
  const sh = [SPOT.armA[0] + 0.1, SPOT.armA[1] + 0.1, arm[2] + 11];
  B.hold(4, kb, 'cheer').hold(T.CRASH + 0.3, kb, 'stand').hold(48, kb, 'nohead').hold(62, kb, 'stand').hold(70, kb, 'low', { face: -1 })
    .go(72, [SPOT.kb, ROLL_B[0]], 'walk').go(94, ROLLS.mid.kidP, 'push', { roll: 'mid' }).go(95.2, [ROLLS.mid.kidP[ROLLS.mid.kidP.length - 1], SPOT.liftB], 'walk')
    .hold(95.5, P3(SPOT.liftB), 'stand', { face: 1 }).hold(T.MID, P3(SPOT.liftB), 'lift').hold(103, P3(SPOT.liftB), 'cheer').hold(120, P3(SPOT.liftB), 'stand', { face: 1 })
    .go(124, [SPOT.liftB, SPOT.btn], 'walk').hold(128, P3(SPOT.btn), 'reach', { face: 1 }).go(130, [SPOT.btn, [17, 39]], 'walk').hold(138, at(17, 39), 'stand', { face: 1 })
    .hop(139.4, at(17, 39), sh, 7, 'stand').hold(141, sh, 'stand', { face: 1, ride2: 1 }).hold(145, sh, 'reach', { face: 1, ride2: 1 }).hold(149, sh, 'stand', { face: -1, ride2: 1 })
    .hop(150.4, sh, at(17, 37), 4, 'stand').go(156, [[17, 37], [1, 31.5]], 'walk').hold(161, at(1, 31.5), 'low', { face: -1 }).go(168, [[1, 31.5], [12, 38]], 'walk')
    .hold(172, at(12, 38), 'stand', { face: -1 }).hold(173.4, at(12, 38), 'low', { face: -1 }).hold(176, at(12, 38), 'low', { face: -1 }).go(178, [[12, 38], [17, 39]], 'walk')
    .hop(179.4, at(17, 39), sh, 7, 'stand').hold(182, sh, 'stand', { face: 1, ride2: 1 }).hold(185, sh, 'reach', { face: 1, ride2: 1 }).hold(188, sh, 'stand', { face: 1, ride2: 1 })
    .hold(192, sh, 'reach', { face: 1, ride2: 1 }).hold(214, sh, 'stand', { face: -1, ride2: 1 }).hold(T.HAT + 1, sh, 'reach', { face: 1, ride2: 1 }).hold(221, sh, 'cheer', { ride2: 1 })
    .hop(222.4, sh, at(30, 40), 5, 'stand').go(228, [[30, 40], [38, 37], SPOT.kb], 'walk').hold(229.5, kb, 'stand').hold(LOOP, kb, 'cheer');
  /* the sledders: walk the sled to the trail, climb, sit, ride, repeat. The sled follows on its rope, a little behind. */
  const trailUp = TRAIL.slice().reverse();
  const laneA0 = at(...LANE_A[0]), laneAEnd = at(...LANE_A[LANE_A.length - 1]), laneB0 = at(...LANE_B[0]), laneBEnd = at(...LANE_B[LANE_B.length - 1]);
  const climbA = trailUp, climbB = spline([[6, 21], [8, 34], [11, 47], [5, 57], [-10, 60]]).concat(trailUp.slice(Math.floor(trailUp.length * 0.3)), spline([[-60, 26], [-62, 16], [-54, 8]]));
  {
    const kc = P3(SPOT.kc), lapT = pathLen(climbA) / 6.4;
    Cc.hold(4, kc, 'cheer').hold(5, kc, 'stand').go(7, [SPOT.kc, [18, 50]], 'walk'); SC_.hold(7 + 1.4, laneAEnd, 'park', { dir: [1, 0] });
    let t0 = 7;
    for (let n = 0; n < 7; n++) {
      const tTop = t0 + lapT;
      Cc.go(tTop, climbA, 'pull'); SC_.go(tTop + 1.4, climbA, 'tow');
      Cc.hold(tTop + 2.8, laneA0, 'stand', { face: 1 }); SC_.hold(tTop + 2.8, laneA0, 'park', { dir: [1, 0.2] });
      const tR = tTop + 2.8; Cc.hold(tR + 1.4, laneA0, 'sit'); SC_.hold(tR + 1.4, laneA0, 'park', { dir: [1, 0.2] });
      Cc.go(tR + 8.6, LANE_A, 'ride', { ride: 1, sled: 0 }); SC_.go(tR + 8.6, LANE_A, 'ride', { ride: 1 });
      Cc.hold(tR + 10.2, laneAEnd, 'sit'); SC_.hold(tR + 10.2 + 1.4, laneAEnd, 'park', { dir: [1, 0] });
      t0 = tR + 10.2;
    }
    Cc.hold(t0 + 1, laneAEnd, 'stand', { face: -1 }).go(t0 + 2.4, [[18, 50], SPOT.hat], 'walk').hold(t0 + 3.6, P3(SPOT.hat), 'low', { face: -1 }).go(t0 + 5.2, [SPOT.hat, SPOT.handoff], 'walk', { carry: 1 })
      .hold(215, P3(SPOT.handoff), 'lift', { carry: 1 }).hold(217, P3(SPOT.handoff), 'stand', { face: 1 }).go(222, [SPOT.handoff, [24, 44], SPOT.kc], 'walk').hold(229.5, kc, 'stand').hold(LOOP, kc, 'cheer');
    SC_.hold(LOOP, laneAEnd, 'park', { dir: [1, 0] });
  }
  {
    const kd = P3(SPOT.kd), lapT = pathLen(climbB) / 6.6;
    Dd.hold(4, kd, 'cheer').hold(9, kd, 'stand').go(12.6, [SPOT.kd, [6, 21]], 'walk'); SD.hold(12.6 + 1.4, laneBEnd, 'park', { dir: [1, 0] });
    let t0 = 12.6;
    for (let n = 0; n < 5; n++) {
      const tTop = t0 + lapT;
      Dd.go(tTop, climbB, 'pull'); SD.go(tTop + 1.4, climbB, 'tow');
      Dd.hold(tTop + 2.8, laneB0, 'stand', { face: 1 }); SD.hold(tTop + 2.8, laneB0, 'park', { dir: [1, 0] });
      const tR = tTop + 2.8; Dd.hold(tR + 1.4, laneB0, 'sit'); SD.hold(tR + 1.4, laneB0, 'park', { dir: [1, 0] });
      Dd.go(tR + 8, LANE_B, 'ride', { ride: 1, sled: 1 }); SD.go(tR + 8, LANE_B, 'ride', { ride: 1 });
      Dd.hold(tR + 9.6, laneBEnd, 'sit'); SD.hold(tR + 9.6 + 1.4, laneBEnd, 'park', { dir: [1, 0] });
      t0 = tR + 9.6;
    }
    Dd.hold(t0 + 1, laneBEnd, 'stand', { face: 1 }).go(t0 + 5, [[6, 21], [6, 36], SPOT.kdWait], 'walk').hold(224, P3(SPOT.kdWait), 'stand', { face: 1 }).go(226.4, [SPOT.kdWait, SPOT.kd], 'walk').hold(229.5, kd, 'stand').hold(LOOP, kd, 'cheer');
    SD.hold(LOOP, laneBEnd, 'park', { dir: [1, 0] });
  }
  /* the dog */
  const dh = P3(SPOT.dog), bow = P3(SPOT.dogBow), stop = P3(SPOT.dogStop), lie = P3(SPOT.dogLie);
  Dg.hold(12, dh, 'sit').go(19, [SPOT.dog, [-2, 46], [8, 52]], 'trot').hold(22, at(8, 52), 'stand', { face: 1 }).go(30, [[8, 52], [-6, 44], SPOT.dogBow], 'trot').hold(39, bow, 'stand', { face: 1 }).hold(T.CRASH - 1.6, bow, 'bow')
    .go(T.CRASH, [SPOT.dogBow, SPOT.dogHit], 'gallop').go(T.CRASH + 1.1, [SPOT.dogHit, SPOT.dogStop], 'skid').hold(49, stop, 'shake', { face: 1 }).hold(54, stop, 'stand', { face: -1, carrot: 1 })
    .go(60, [SPOT.dogStop, [16, 31], SPOT.dogLie], 'trot', { carrot: 1 }).hold(104, lie, 'lie', { face: 1 }).go(108, [SPOT.dogLie, [-12, 38]], 'trot', { carrot: 1 }).hold(113.4, at(-12, 38), 'stand', { face: 1, carrot: 1 })
    .go(116, [[-12, 38], [14, 48]], 'trot', { carrot: 1 }).hold(118, at(14, 48), 'stand', { face: 1, carrot: 1 }).go(126, [[14, 48], SPOT.dogLie], 'trot', { carrot: 1 }).hold(156.6, lie, 'lie', { face: 1 }).hold(161, lie, 'sit', { face: 1, carrot: 1 })
    .go(169, [SPOT.dogLie, [2, 33], SPOT.dog], 'trot', { carrot: 1 }).hold(171, dh, 'sit', { carrot: 1 }).hold(LOOP, dh, 'sit');
  /* the cat */
  const win = [36.5, HS.y1, HS.sill], fl0 = [FLAP_X, HS.y1 - 7, HS.deckZ], fl1 = [FLAP_X, HS.y1 + 5, HS.deckZ];
  Ct.hold(26, win, 'window').hold(27, win, 'down').hold(29, win, 'inside')
    .go(31.4, [[fl0[0], fl0[1]], [fl1[0], fl1[1]]], 'flap', { fixedZ: HS.deckZ }).go(37, [[fl1[0], fl1[1]], [24, -1], [27, 3]], 'walk', { fixedZ: HS.deckZ })
    .hold(40, [27, 3, HS.deckZ], 'sit', { face: 1 }).hop(41, [27, 3, HS.deckZ], LAP.w, 8, 'hop').hold(100, LAP.w, 'lap', { who: 'w' }).hold(102, LAP.w, 'stretch', { who: 'w' })
    .hop(103.2, LAP.w, LAP.m, 7, 'hop').hold(188, LAP.m, 'lap', { who: 'm' }).hold(190, LAP.m, 'stretch', { who: 'm' }).hop(191, LAP.m, [43, 3, HS.deckZ], 6, 'hop')
    .go(198.4, [[43, 3], [25, 4], [fl1[0], fl1[1]]], 'walk', { fixedZ: HS.deckZ }).go(200.8, [[fl1[0], fl1[1]], [fl0[0], fl0[1]]], 'flap', { fixedZ: HS.deckZ }).hold(203, win, 'inside').hold(204, win, 'up').hold(LOOP, win, 'window');
  /* the couple */
  for (const [a, b, s] of [[0, 3.6, 'wave'], [3.6, 14, 'rock'], [14, 16.6, 'sip'], [16.6, T.CRASH + 0.5, 'rock'], [T.CRASH + 0.5, 49, 'laugh'], [49, 62, 'pet'], [62, 66, 'rock'], [66, 68.6, 'sip'], [68.6, 80, 'pet'], [80, 86, 'rock'], [86, 98, 'pet'], [98, 118, 'rock'], [118, 120.6, 'sip'], [120.6, 174, 'rock'], [174, 176.6, 'sip'], [176.6, 196, 'rock'], [196, 205, 'glance'], [205, 230, 'rock'], [230, LOOP, 'wave']]) Wm.hold(b, WOMAN, s);
  for (const [a, b, s] of [[0, 3.6, 'wave'], [3.6, 26, 'rock'], [26, 28.6, 'sip'], [28.6, T.CRASH + 0.7, 'rock'], [T.CRASH + 0.7, 49, 'laugh'], [49, 92, 'rock'], [92, 94.6, 'sip'], [94.6, 108, 'rock'], [108, 124, 'pet'], [124, 126.6, 'sip'], [126.6, 150, 'pet'], [150, 170, 'rock'], [170, 186, 'pet'], [186, 212, 'rock'], [212, 214.6, 'sip'], [214.6, 230, 'rock'], [230, LOOP, 'wave']]) Mn.hold(b, MAN, s);
  return { ka: A, kb: B, kc: Cc, kd: Dd, sledC: SC_, sledD: SD, dog: Dg, cat: Ct, woman: Wm, man: Mn };
}
function episodeFor() { if (!EPI.has(0)) EPI.set(0, buildEpisode()); return EPI.get(0); }
function buildSchedule() { EPI.clear(); }
const BLINKS = (() => { const r = mulberry32(4242), out = []; for (let b = 3.2; b < LOOP - 1; b += 4.5 + r() * 3) out.push(+b.toFixed(2)); return out; })();
const HEADS = {};
function stampS2(s, sx, sy, d, lw, flip) {
  for (let r = 0; r < s.h; r++) for (let c = 0; c < s.w; c++) { const v = s.d[r * s.w + (flip ? s.w - 1 - c : c)]; if (v) dput(sx + c - (flip ? s.w - 1 - s.ax : s.ax), sy + r - s.ay, v, d, lw); }
}
const SP3 = (x, y, z) => [Math.round(isx(x, y)), Math.round(isy(x, y, z))];

/* ---- the couple ---- */
const STEAM = [CK([[0, '#fbf4f0'], [1, '#c4d0ec']]), CK([[0, '#d8d4e0'], [1, '#7c8cb8']])];
const rockOf = (t, who) => Math.round((who ? 1.7 * wave(t, 4.6, 0.3) : 1.7 * wave(t, 4)));
function mugSteam(mx, my, d, t, k) {
  if (!FX.steam) return;
  for (let w_ = 0; w_ < 2; w_++) for (let i = 0; i < 2; i++) { const p = phase(t, 2.5, i / 2 + w_ * 0.37 + k); if (p > 0.7) continue; dput(mx + w_ * 3 + Math.round(1.2 * Math.sin(p * 6 + w_ * 2.2)), my - 1 - Math.round(p * 6), p < 0.35 ? STEAM[0] : STEAM[1], d); }
}
function drawCouple(t, lt) {
  const e = episodeFor(), sw = findSeg(e.woman, lt), sm = findSeg(e.man, lt), rw = rockOf(t, 0), rm = rockOf(t, 1), catSeg = findSeg(e.cat, lt), lapW = catSeg.who === 'w', lapM = catSeg.who === 'm';
  { let pose = 'hold', eyes = 'left', dy = phase(t, 15) < 0.04 ? 1 : 0; const blink = BLINKS.some(b => since(t, b) < 0.15), st = sw.anim, [x, y, z] = WOMAN;
    if (st === 'sip') { pose = 'sip'; eyes = 'blink'; } else if (st === 'wave') { pose = phase(t, 0.5) < 0.5 ? 'wave0' : 'wave1'; eyes = 'left'; } else if (st === 'laugh') { pose = 'laugh'; eyes = 'blink'; dy = phase(t, 0.5) < 0.5 ? 1 : 0; }
    else if (st === 'glance') eyes = 'side';
    else if (lapW && st === 'pet') { pose = phase(t, 0.8) < 0.5 ? 'pet0' : 'pet1'; eyes = 'blink'; }
    if (blink && eyes !== 'blink') eyes = 'blink';
    stampD(womanSpr(pose, eyes, dy, rw), x, y, z, 0, [lightAt(x, y, z + 2, t), lightAt(x, y, z + 20, t)], false, 3);
    const [sx, sy] = SP3(x, y, z); HEADS.woman = [sx + rw, sy - 30];
    if (pose === 'hold') mugSteam(sx - 5 + rw, sy - 12, DEP(x, y, z) + 90, t, 0); }
  { let pose = 'hold', eyes = 'open', dy = 0; const blink = BLINKS.some(b => since(t, b + 1.3) < 0.15), st = sm.anim, [x, y, z] = MAN;
    if (st === 'sip') { pose = 'sip'; eyes = 'blink'; } else if (st === 'wave') pose = phase(t, 0.5) < 0.5 ? 'wave0' : 'wave1'; else if (st === 'laugh') { pose = 'laugh'; eyes = 'blink'; dy = phase(t, 0.5) < 0.5 ? 1 : 0; }
    else if (lapM && st === 'pet') { pose = phase(t, 0.8) < 0.5 ? 'pet0' : 'pet1'; eyes = 'blink'; }
    if (blink && eyes !== 'blink') eyes = 'blink';
    stampD(manSpr(pose, eyes, dy, rm), x, y, z, 0, [lightAt(x, y, z + 2, t), lightAt(x, y, z + 20, t)], false, 3);
    const [sx, sy] = SP3(x, y, z); HEADS.man = [sx + rm - 3, sy - 29];
    if (pose === 'hold') mugSteam(sx - 12 + rm, sy - 15, DEP(x, y, z) + 90, t, 0.4); }
}

/* ---- the cat ---- */
const FLAP_DARK = C('#2a1a18'), FLAP_FACE = [R.log[4], R.log[3], R.log[2]];
const FLAP_PASS = [[29, 31], [198.4, 200.4]];
function flapSwing(lt) {
  for (const [a, b] of FLAP_PASS) { if (lt >= a && lt < b) return 1; if (lt >= b && lt < b + 3) { const q = lt - b; return Math.cos(q * 6.5) * Math.exp(-q * 1.5); } }
  return 0;
}
const inFlap = (i, j) => { const y = HS.y1, x = (i + 0.5 - OX) / 2 + y, z = x + y - (j + 0.5 - OY); return x >= FLAP.x0 + 0.5 && x <= FLAP.x1 - 0.5 && z >= FLAP.z0 && z <= FLAP.z1 - 0.8; };
function drawFlap(lt, t) {
  const s = flapSwing(lt); if (Math.abs(s) < 0.04) return;
  const lw = lightAt(FLAP_X, HS.y1, 8, t), a = Math.abs(s), hgt = (FLAP.z1 - FLAP.z0 - 0.8), open = hgt * (1 - a * 0.86);
  for (let x = FLAP.x0 + 0.5; x <= FLAP.x1 - 0.5; x += 0.25) for (let z = FLAP.z0; z <= FLAP.z1 - 0.8; z += 0.5) {
    const i = Math.floor(isx(x, HS.y1)), j = Math.floor(isy(x, HS.y1, z)), fromTop = FLAP.z1 - 0.8 - z;
    const c = fromTop < open ? FLAP_FACE[Math.floor(fromTop) % 3 === 0 ? 1 : 0] : FLAP_DARK; dput(i, j, c, DEP(x, HS.y1, z) + 0.2, c === FLAP_DARK ? 200 : lw);
  }
}
/* the cat crosses the wall plane: any pixel still behind the wall shows only through the open flap */
function stampThrough(spr, x, y, z, flip, dirOut, lw) {
  const sx0 = Math.round(isx(x, y)) - (flip ? spr.w - 1 - spr.ax : spr.ax), sy0 = Math.round(isy(x, y, z)) - spr.ay, d0 = DEP(x, y, z) + 40;
  for (let r = 0; r < spr.h; r++) for (let c = 0; c < spr.w; c++) {
    const col = spr.d[r * spr.w + (flip ? spr.w - 1 - c : c)]; if (!col) continue;
    const dc = (flip ? spr.w - 1 - c : c) - spr.ax, yp = y + (dirOut ? dc * 0.5 : -dc * 0.5), i = sx0 + c, j = sy0 + r;
    if (yp < HS.y1 && !inFlap(i, j)) continue;
    dput(i, j, col, d0 + 2 * (spr.ay - r), lw);
  }
}
/* inside, behind the glass: clipped to the big window, backlit by the room */
function catInWindow(spr, dz, t) {
  const x0 = WIN_CAT.i - spr.ax, y0 = WIN_CAT.j - spr.ay + dz;
  for (let r = 0; r < spr.h; r++) for (let c = 0; c < spr.w; c++) {
    const v = spr.d[r * spr.w + c]; if (!v) continue;
    const i = x0 + c, j = y0 + r; if (i < 0 || j < 0 || i >= IW || j >= IH) continue;
    const p = j * IW + i; if (WIN_MASK[p]) dput(i, j, v, S.dep[p] + 0.3, 205, 0);
  }
}
const CAT_LOOK = [[3, 7, 1], [11, 14, 2], [17, 20, 1], [207, 211, 2], [215, 219, 1], [226, 230, 2]];
function drawCat(t, lt) {
  const e = episodeFor(), seg = findSeg(e.cat, lt), st = seg.anim, p = segPos(seg, lt), z = seg.fixedZ !== undefined ? seg.fixedZ : p[2], x = p[0], y = p[1];
  const flick = wave(t, 3, 0.2) > 0.6 ? -1 : 0, ear = since(t, 8) < 0.25;
  HEADS.cat = null;
  if (st === 'inside') return;
  if (st === 'window' || st === 'down' || st === 'up') {
    const u = st === 'down' ? (lt - seg.t0) / (seg.t1 - seg.t0) : st === 'up' ? 1 - (lt - seg.t0) / (seg.t1 - seg.t0) : 0, look = CAT_LOOK.find(([a, b]) => lt >= a && lt < b), blink = phase(t, 7.5, 0.3) < 0.04;
    catInWindow(catSit(flick, 0, blink ? 3 : look ? look[2] : 0), Math.round(u * 18), t);
    HEADS.cat = [WIN_CAT.i + 1, WIN_CAT.j - 15];
    return;
  }
  const lw = [lightAt(x, y, z + 2, t), lightAt(x, y, z + 12, t)];
  if (st === 'flap') {
    const out = seg.path[1][1] > seg.path[0][1], f = Math.floor((lt - seg.t0) * 7) % 4, spr = catWalk(f, Math.round(wave(t, 1.5)));
    stampThrough(spr, x, y, z, out, out, lightAt(x, y + 6, z + 6, t));
    return;
  }
  if (st === 'walk') {
    const q = segPos(seg, Math.min(seg.t1 - 1e-3, lt + 0.02)), sdx = (q[0] - x) - (q[1] - y), dist = clamp((lt - seg.t0) / (seg.t1 - seg.t0), 0, 1) * seg.len;
    stampD(catWalk(Math.floor(dist / 1.4) % 4, Math.round(wave(t, 1.5))), x, y, z, 0, lw, sdx < 0, 8); HEADS.cat = [Math.round(isx(x, y)) + (sdx < 0 ? -7 : 7), Math.round(isy(x, y, z)) - 13];
    return;
  }
  if (st === 'sit') { stampD(catSit(flick, phase(lt, 1) < 0.5 ? 1 : 0, 2), x, y, z, 0, lw, false, 8); HEADS.cat = [Math.round(isx(x, y)) + 3, Math.round(isy(x, y, z)) - 15]; return; }
  if (st === 'hop') { const sdx = (seg.path[1][0] - seg.path[0][0]) - (seg.path[1][1] - seg.path[0][1]); stampD(catWalk(1, 0), x, y, z, 0, lw, sdx < 0, 60); return; }
  /* on a lap: the cat rides the chair as it rocks, a pixel or two either way */
  const rk = rockOf(t, seg.who === 'm' ? 1 : 0), ax = x, ay = y;
  if (st === 'stretch') { stampD(catStretch(), ax, ay, z, 0, lw, seg.who === 'm', 60); HEADS.cat = [Math.round(isx(ax, ay)) + rk, Math.round(isy(ax, ay, z)) - 12]; return; }
  const sp = catSleep(phase(t, 4) < 0.45 ? 1 : 0, ear ? 1 : 0), sx = Math.round(isx(ax, ay)) + rk, sy = Math.round(isy(ax, ay, z));
  stampS2(sp, sx, sy, DEP(ax, ay, z) + 60, lw[1], seg.who === 'm');
  HEADS.cat = [sx + (seg.who === 'm' ? -7 : 7), sy - 9];
}

/* ---- the dog ---- */
function drawDog(t, lt) {
  const seg = findSeg(episodeFor().dog, lt), st = seg.anim, p = segPos(seg, lt), [x, y, z] = p, lw = [lightAt(x, y, z + 2, t), lightAt(x, y, z + 14, t)];
  let spr, flip = seg.face === -1, mouth = seg.carrot ? 'carrot' : '', headDx = 18, headDy = 22;
  if (seg.path) { const q = segPos(seg, Math.min(seg.t1 - 1e-3, lt + 0.02)); flip = (q[0] - x) - (q[1] - y) < 0; }
  const wag = phase(t, 0.5) < 0.5 ? 'wag' : 'wag2';
  if (st === 'sit') { spr = dogSit(wag, { mouth: mouth || (phase(t, 6, 0.2) < 0.4 ? 'tongue' : '') }); headDx = 12; headDy = 24; }
  else if (st === 'lie') { spr = dogLie(wag === 'wag' && phase(t, 8) < 0.3 ? 'wag' : 'rest', { eye: phase(t, 7.5) < 0.05 ? 'shut' : '', down: phase(t, 30) < 0.5 ? 1 : 0 }); headDx = 20; headDy = 16; }
  else if (st === 'stand') spr = dogBase('stand', wag, { mouth: mouth || 'tongue' });
  else if (st === 'bow') { const w = phase(t, 0.4) < 0.5 ? 1 : 0; spr = dogBow(w, wag); headDx = 22; headDy = 14; }
  else if (st === 'trot') { const d = clamp((lt - seg.t0) / (seg.t1 - seg.t0), 0, 1) * seg.len, f = ['a', 'b', 'c', 'd'][Math.floor(d / 2.6) % 4]; spr = dogBase(f, 'wag', { mouth: mouth || 'tongue', bob: Math.floor(d / 2.6) % 2 }); }
  else if (st === 'gallop') { const d = clamp((lt - seg.t0) / (seg.t1 - seg.t0), 0, 1) * seg.len, f = ['c', 'a', 'd', 'b'][Math.floor(d / 3.2) % 4]; spr = dogBase(f, 'back', { hy: 2, hx: 1, bob: 1 }); }
  else if (st === 'skid') spr = dogBase('d', 'back', { hy: 3, snow: 1 });
  else if (st === 'shake') { const k = phase(t, 0.25) < 0.5 ? 1 : 0; spr = dogBase('stand', k ? 'wag' : 'wag2', { hx: k, snow: 1, eye: 'shut', mouth: lt > 47.5 ? 'carrot' : '' }); }
  else spr = dogBase('stand', 'up');
  shadowBlob(x, y, z, 12, 3, 0.26);
  stampD(spr, x, y, z, 0, lw, flip, 4);
  HEADS.dog = [Math.round(isx(x, y)) + (flip ? -headDx : headDx), Math.round(isy(x, y, z)) - headDy];
}

/* ---- the children and their sleds ---- */
const KID_IDS = { ka: 0, kb: 1, kc: 2, kd: 3 };
function kidBreath(sx, sy, d, t, k) { if (!FX.breath) return; const p = phase(t, 3, k * 0.27); if (p > 0.34) return; const u = p / 0.34; dput(sx + Math.round(u * 4), sy - Math.round(u * 3), u < 0.6 ? STEAM[0] : STEAM[1], d); if (u > 0.3) dput(sx + 1 + Math.round(u * 4), sy - 1 - Math.round(u * 3), STEAM[1], d); }
function drawKid(name, t, lt) {
  const id = KID_IDS[name], seg = findSeg(episodeFor()[name], lt), st = seg.anim, p = segPos(seg, lt), [x, y, z] = p, lw = [lightAt(x, y, z + 2, t), lightAt(x, y, z + 16, t)];
  let view = 'front', pose = 'stand', f = 0, flip = seg.face === -1, opt = {}, extra = 6, moving = !!seg.path && !seg.hop && !seg.ride;
  if (moving) {
    const q = segPos(seg, Math.min(seg.t1 - 1e-3, lt + 0.05)), dx = q[0] - x, dy = q[1] - y, sdx = dx - dy, sdy = dx + dy, d = clamp((lt - seg.t0) / (seg.t1 - seg.t0), 0, 1) * seg.len;
    flip = sdx < 0; view = sdy < -0.01 ? 'back' : 'front'; f = Math.floor(d / 1.5) % 4; pose = st === 'pull' ? 'walk' : 'walk'; opt.bob = f & 1 ? -1 : 0;
    if (st === 'push') { view = 'side'; pose = 'push'; f = 0; }
  } else if (st === 'cheer') { pose = 'cheer'; f = Math.floor(lt * 4) & 1; opt.bob = f ? -1 : 0; opt.eye = 'happy'; }
  else if (st === 'nohead') { pose = 'nohead'; opt.bob = phase(t, 0.4) < 0.5 ? -1 : 0; }
  else if (st === 'low') { view = 'side'; pose = 'low'; f = Math.floor(lt * 3) & 1; }
  else if (st === 'reach') { view = 'side'; pose = 'reach'; f = Math.floor(lt * 3) & 1; }
  else if (st === 'lift') { pose = 'lift'; }
  else if (st === 'sit' || st === 'ride') { view = 'side'; pose = 'sit'; f = Math.floor(lt * 3) & 1; if (st === 'ride') { const q = segPos(seg, Math.min(seg.t1 - 1e-3, lt + 0.05)); flip = (q[0] - x) - (q[1] - y) < 0; } extra = 12; }
  else if (seg.hop) { pose = 'cheer'; }
  if (seg.ride2) extra = 40;
  if (st !== 'sit' && st !== 'ride' && !seg.ride2 && z < 40) shadowBlob(x, y, z, 6, 2, 0.26);
  const spr = kidSpr(id, view, pose, f, opt), [sx, sy] = SP3(x, y, z), lift = (st === 'sit' || st === 'ride') ? 2 : 0;
  stampD(spr, x, y, z + lift, 0, lw, flip, extra);
  HEADS[name] = [sx + (flip ? -2 : 2), sy - 20 - lift];
  kidBreath(sx + (flip ? -5 : 6), sy - 13 - lift, DEP(x, y, z) + 60, t, id);
  if (seg.carry) stampS2(HAT_SPR, sx, sy - 20, DEP(x, y, z) + 60, lw[1]);
  const hand = [sx + (flip ? -8 : 8), sy - 9], dh = DEP(x, y, z) + 62;
  if (name === 'ka' && lt >= 130.5 && lt < T.ARMS) { dline2(hand[0] - 3, hand[1] - 2, hand[0] + 3, hand[1] + 2, P.twig, dh, lw[1]); dline2(hand[0] - 3, hand[1] + 1, hand[0] + 3, hand[1] - 1, P.twigL, dh, lw[1]); }
  if (name === 'kb' && lt >= 173.4 && lt < T.NOSE) stampS2(CARROT_SPR, hand[0], hand[1], dh, lw[1]);
  if (name === 'kb' && lt >= T.NOSE + 1 && lt < T.SCARF) { dline2(hand[0] - 3, hand[1], hand[0] + 3, hand[1], P.red, dh, lw[1]); dline2(hand[0] + 3, hand[1], hand[0] + 3, hand[1] + 4, P.redD, dh, lw[1]); }
  if (name === 'kb' && lt >= 215 && lt < T.HAT) stampS2(HAT_SPR, hand[0], hand[1] - 2, dh, lw[1]);
}
const SLED_C = [pal_({ a: '#d83a34', b: '#962a30', c: '#f0705a' }), pal_({ a: '#c89050', b: '#8a5a30', c: '#e8b878' })];
function drawSled(which, x, y, tx, ty, lw) {
  const m = Math.hypot(tx, ty) || 1, ux = tx / m, uy = ty / m, nx = -uy, ny = ux, Pc = SLED_C[which], d0 = DEP(x, y, GZ(x, y));
  for (let pass = 0; pass < 2; pass++) for (let s = -3.6; s <= 3.6; s += 0.3) for (let w = -1.6; w <= 1.6; w += 0.3) {
    const px_ = x + ux * s + nx * w, py = y + uy * s + ny * w, z = GZ(px_, py) + 0.8 + (s > 2.2 ? (s - 2.2) * 1.3 : 0), i = Math.floor(isx(px_, py)), j = Math.floor(isy(px_, py, z));
    if (pass === 0) { dput(i, j + 1, P.ink, d0 + 6, lw); dput(i - 1, j, P.ink, d0 + 6, lw); dput(i + 1, j, P.ink, d0 + 6, lw); continue; }
    const edge = Math.abs(w) > 1.25, slat = which === 1 && (Math.floor(w * 1.6 + 8) & 1);
    dput(i, j, edge ? Pc.b : slat ? Pc.c : s > 2.2 ? Pc.c : Pc.a, d0 + 7, lw);
  }
}
function drawRope(ax, ay, bx, by, d, lw) { const n = Math.max(Math.abs(ax - bx), Math.abs(ay - by), 1); for (let k = 0; k <= n; k++) { const u = k / n; dput(Math.round(lerp(ax, bx, u)), Math.round(lerp(ay, by, u) + 2 * Math.sin(Math.PI * u)), WIRE, d, lw); } }
function drawSpray(seg, lt, t, which) {
  if (!FX.spray) return;
  const u = clamp((lt - seg.t0) / (seg.t1 - seg.t0), 0, 1); if (u < 0.08 || u > 0.92) return;
  for (let k = 1; k <= 12; k++) {
    const a = k * 0.05, q = segPos(seg, Math.max(seg.t0, lt - a)), hx = hash2(k, Math.floor(lt * 20)), up = 2 + hx * 3 + k * 0.3;
    dput(Math.round(isx(q[0], q[1])) + Math.round((hx - 0.5) * 8), Math.round(isy(q[0], q[1], q[2])) - Math.round(up), k < 6 ? SPARK_K : STEAM[0], DEP(q[0], q[1], q[2]) + 30);
  }
}
function drawSledFor(name, kidName, which, t, lt) {
  const e = episodeFor(), seg = findSeg(e[name], lt), p = segPos(seg, lt), lw = lightAt(p[0], p[1], p[2] + 2, t);
  let dir = seg.dir || [1, 0];
  if (seg.path) { const q = segPos(seg, Math.min(seg.t1 - 1e-3, lt + 0.06)); if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-3) dir = [q[0] - p[0], q[1] - p[1]]; }
  if (seg.anim === 'tow') dir = [-dir[0], -dir[1]];
  drawSled(which, p[0], p[1], dir[0], dir[1], lw);
  if (seg.anim === 'ride') drawSpray(seg, lt, t, which);
  /* the rope to the mitten while it is towed */
  const ks = findSeg(e[kidName], lt);
  if (ks.anim === 'pull' || seg.anim === 'tow') { const k = segPos(ks, lt), [ax, ay] = SP3(k[0], k[1], k[2]), [bx, by] = SP3(p[0], p[1], p[2]); drawRope(ax, ay - 7, bx, by - 2, DEP(p[0], p[1], p[2]) + 8, lw); }
}

/* ---- the snowman ---- */
function smStage(lt) {
  if (lt < T.CRASH) return 8;
  const S_ = [[T.HAT, 8], [T.SCARF, 7], [T.NOSE, 6], [T.EYES, 5], [T.ARMS, 4], [T.BTN, 3], [T.HEAD, 2], [T.MID, 1], [T.BASE, 0]];
  for (const [a, s] of S_) if (lt >= a) return s;
  return -1;
}
const SM_Z = { base: BALL_R.base * 2 - 2, head: BALL_R.base * 2 + BALL_R.mid * 2 - 5 };
function rollBall(which, seg, lt) {
  const R_ = ROLLS[which], u = clamp((lt - seg.t0) / (seg.t1 - seg.t0), 0, 1), kd = u * R_.kidLen, r = lerp(R_.r0, R_.r1, u), d = kd + r + 3, q = pointAt(R_.P, d);
  return { x: q[0], y: q[1], r, spin: Math.floor(d / 1.4) % 6 };
}
const CHUNKS = (() => { const r = mulberry32(1212), out = []; for (let k = 0; k < 46; k++) out.push({ a: r() * TAU, v: 6 + r() * 15, up: 12 + r() * 26, s: r() > 0.6 ? 2 : 1, c: 2 + Math.floor(r() * 5) }); return out; })();
function drawBall(r, spin, x, y, z, t) { stampD(ballSpr(r, spin), x, y, z, 0, [lightAt(x, y, z + 2, t), lightAt(x, y, z + r * 2, t)], false, 2); }
function drawSnowman(t, lt) {
  const e = episodeFor(), st = smStage(lt), lw = [lightAt(SM.x, SM.y, 2, t), lightAt(SM.x, SM.y, 28, t)], tau = lt - T.CRASH;
  if (st >= 0) { shadowBlob(SM.x, SM.y, 0, 13, 4, 0.22); stampD(snowmanSpr(st), SM.x, SM.y, 0, 0, lw, false, 2); }
  else if (lt < T.BASE) { shadowBlob(SM.x, SM.y, 0, 14, 4, 0.2); const k = lt < 62 ? 1 : lt < 65 ? 0.8 : lt < 68 ? 0.65 : 0.5; stampD(rubbleSpr(k), SM.x, SM.y, 0, 0, lw, false, 1); }
  /* the crash: the head and hat fly, the middle bursts */
  if (tau >= 0 && tau < 2.6) {
    const [sx, sy] = SP3(SM.x, SM.y, 0);
    for (let k = 0; k < CHUNKS.length; k++) { const c = CHUNKS[k], q = tau * 1.4; if (q > 1.8) continue; const px_ = sx + Math.cos(c.a) * c.v * q * 2.1, py = sy - 18 + Math.sin(c.a) * c.v * 0.5 * q - c.up * q + 22 * q * q; if (py > sy + 12) continue; for (let a = 0; a < c.s; a++) for (let b = 0; b < c.s; b++) dput(Math.round(px_) + a, Math.round(py) + b, R.snow[c.c], 2e5, lw[1]); }
    if (tau < 0.34) { const r = 4 + tau * 44; for (let dy = -Math.ceil(r); dy <= r; dy++) for (let dx = -Math.ceil(r * 1.4); dx <= r * 1.4; dx++) { const d = Math.hypot(dx / 1.4, dy); if (d > r) continue; if ((1 - tau / 0.34) * (d / r + 0.25) * 16 > bay(sx + dx, sy - 12 + dy)) dput(sx + dx, sy - 12 + dy, SPARK_K, 2e5 + 1); } }
  }
  /* the head: flies off, rolls to a stop near the edge, then waits for someone to fetch it */
  const a = findSeg(e.ka, lt), R_ = BALL_R.head;
  if (lt >= T.CRASH && lt < T.HEAD) {
    let x, y, z, spin = 0;
    if (a.roll === 'head') { const b = rollBall('head', a, lt); x = b.x; y = b.y; z = 0; spin = b.spin; }
    else if (tau < 1.6) { const u = clamp(tau / 1.6, 0, 1); x = lerp(SM.x, SPOT.head[0], u); y = lerp(SM.y, SPOT.head[1], u); z = (1 - u) * SM_Z.head + 14 * Math.sin(Math.PI * Math.min(1, u * 1.3)) * (1 - u); spin = Math.floor(u * 12) % 6; }
    else if (lt < 115) { x = SPOT.head[0]; y = SPOT.head[1]; z = 0; }
    else { const u = (lt - 116) / (T.HEAD - 116), a1 = smooth(u / 0.55), b1 = smooth((u - 0.45) / 0.55), q = ROLL_H[1]; x = lerp(q[0], SM.x, b1); y = lerp(q[1], SM.y, b1); z = lerp(0, 20, a1) + (SM_Z.head - 20) * b1; }
    drawBall(R_, spin, x, y, z, t);
  }
  /* the balls being rolled, then lifted */
  if (a.roll === 'base') { const b = rollBall('base', a, lt); drawBall(b.r, b.spin, b.x, b.y, 0, t); }
  const kb = findSeg(e.kb, lt);
  if (kb.roll === 'mid') { const b = rollBall('mid', kb, lt); drawBall(b.r, b.spin, b.x, b.y, 0, t); }
  else if (lt >= 94 && lt < T.MID) { const u = (lt - 95.5) / (T.MID - 95.5), a1 = smooth(u / 0.55), b1 = smooth((u - 0.45) / 0.55), q = pointAt(ROLLS.mid.P, 1e9); drawBall(BALL_R.mid, 0, lerp(q[0], SM.x, b1), lerp(q[1], SM.y, b1), lerp(0, 19, a1) + (SM_Z.base - 19) * b1, t); }
  /* loose pieces */
  if (lt >= T.CRASH && lt < e.kc.segs.find(q => q.carry).t0) { const u = clamp(tau / 1.4, 0, 1), [hx, hy] = SPOT.hat, x = lerp(SM.x, hx, u), y = lerp(SM.y, hy, u), z = lerp(38, 0, u) + 18 * Math.sin(Math.PI * u); stampD(HAT_SPR, x, y, z, 0, lightAt(x, y, z, t), false, 3); }
  if (lt >= T.CRASH && lt < 130.5) { const u = clamp(tau / 1.2, 0, 1), [hx, hy] = SPOT.sticks; for (const k of [0, 1]) { const x = lerp(SM.x, hx + k * 3, u), y = lerp(SM.y, hy - k * 2, u), z = lerp(22, 0.5, u) + 10 * Math.sin(Math.PI * u), [sx, sy] = SP3(x, y, z); dline2(sx - 3, sy - k, sx + 3, sy + 1 + k, P.twig, DEP(x, y, z) + 3, lw[0]); } }
  /* the carrot on the snow, between the dog dropping it and the child picking it up */
  if (lt >= 171 && lt < 173.4) stampD(CARROT_SPR, 8.5, 38, 0.4, 0, lightAt(8.5, 38, 2, t), false, 2);
}
function dline2(x0, y0, x1, y1, c, d, w) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let k = 0; k <= n; k++) dput(Math.round(lerp(x0, x1, k / n)), Math.round(lerp(y0, y1, k / n)), c, d, w); }
/* the rolled balls leave a shallow groove that the snow slowly fills in. The pixels are worked out once. */
const TRAILS = [{ nm: 'base', t0: 63.4, t1: T.BASE }, { nm: 'mid', t0: 72, t1: 94 }];
function buildTrails() {
  for (const G of TRAILS) {
    const R_ = ROLLS[G.nm], seen = new Map();
    for (let d = 3; d < R_.len - 2; d += 0.4) { const q = pointAt(R_.P, d), w = 0.7 + 2.2 * Math.min(1, d / 26);
      for (let a = -w; a <= w; a += 0.4) for (let b = -w; b <= w; b += 0.4) { if (a * a + b * b > w * w) continue; const i = Math.floor(isx(q[0] + a, q[1] + b)), j = Math.floor(isy(q[0] + a, q[1] + b, 0)); if (i < 0 || j < 0 || i >= IW || j >= IH) continue; const p = j * IW + i; if ((S.flag[p] & F_SNOW) && !seen.has(p)) seen.set(p, [d, Math.hypot(a, b) / w]); } }
    G.p = Int32Array.from(seen.keys()); G.d = Float32Array.from([...seen.values()].map(v => v[0])); G.e = Float32Array.from([...seen.values()].map(v => v[1])); G.h = Float32Array.from(G.p, q => hash2(q, 91)); G.len = R_.len;
  }
}
function drawRollTrails(t, lt) {
  if (!FX.trails) return;
  for (const G of TRAILS) {
    if (lt < G.t0) continue; const fade = 1 - clamp((lt - G.t1 - 30) / 40, 0, 1); if (fade <= 0) continue;
    const dMax = clamp((lt - G.t0) / (G.t1 - G.t0), 0, 1) * G.len;
    for (let k = 0; k < G.p.length; k++) { if (G.d[k] > dMax || G.h[k] > fade) continue; const p = G.p[k]; if (FR.dep[p] <= S.dep[p] + 0.01) FR.idx[p] = R.snow[G.e[k] > 0.72 ? 3 : 2]; }
  }
}

/* ---- quiet visitors: a hare behind the hill, a deer at the right-hand rim ---- */
const HM = { w: '#f4f4fa', W: '#c8cce0', k: '#2a2430', p: '#f0a0a0' };
const HARE = [outl(smap(pad(['.......k.k', '.......W.w', '.......www', '..www.wwkw', '.wwwwwwwww', 'wwwwwwwww.', '.wW..wW...']), HM, 5, 8)), outl(smap(pad(['.......k.k', '.......W.w', '..www..www', '.wwwwwwwkw', 'wwwwwwwwww', '.W......W.']), HM, 5, 7))];
const DRC = { b: '#8a5e40', B: '#664430', c: '#d8bc98', a: '#4a3028', w: '#f4eee4', k: '#1e1418' };
const DEER_UP = outl(smap(pad(['..a.a...............', '.a.a.a..............', '..aaa...............', '..bbb...............', '.kbeb...............'.replace('e', 'k'), 'bbbbb...............', '...bbb..............', '...bbbbbbbbbbbbbw...', '...bbbbbbbbbbbbbw...', '...cbbbbbbbbbbbb....', '....cccBBBBBBbb.....', '....B.B......B.B....', '....B.B......B.B....', '....B.B......B.B....', '....k.k......k.k....']), DRC, 9, 16));
const DEER_DOWN = outl(smap(pad(['....................', '....................', '....................', '....................', '....................', '....................', '...bbb..............', '...bbbbbbbbbbbbbw...', '...bbbbbbbbbbbbbw...', '..bbbbbbbbbbbbbb....', '.bbkcccBBBBBBbb.....', 'bbb.B.B......B.B....', 'kb..B.B......B.B....', '....B.B......B.B....', '....k.k......k.k....']), DRC, 9, 16));
const HARE_RUNS = [{ t: 18, from: [-26, -16], to: [-6, -26] }, { t: 150, from: [-6, -26], to: [-26, -16] }];
function drawVisitors(t, lt) {
  if (FX.hare) {
    let x = HARE_RUNS[0].from[0], y = HARE_RUNS[0].from[1], z = GZ(x, y), fr = 0, flip = false;
    if (lt >= 18 && lt < 150) { x = -6; y = -26; flip = false; }
    for (const H of HARE_RUNS) { const u = (lt - H.t) / 8; if (u < 0 || u >= 1) continue; x = lerp(H.from[0], H.to[0], u); y = lerp(H.from[1], H.to[1], u); const hop = phase(lt, 0.8); z = GZ(x, y) + 2.4 * Math.sin(Math.PI * hop); fr = hop > 0.15 && hop < 0.85 ? 1 : 0; flip = H.to[0] - H.to[1] < H.from[0] - H.from[1]; }
    if (fr === 0) z = GZ(x, y);
    stampD(HARE[fr], x, y, z, 0, lightAt(x, y, z, t), flip, 4);
    const [sx, sy] = SP3(x, y, z); dput(sx + (flip ? -5 : 5), sy - 2, BLUSH, 2e4);
  }
  if (FX.deer && lt > 92 && lt < 176) {
    const a = [96, -52], b = [78, -2], u = lt < 100 ? (lt - 92) / 8 : lt > 168 ? (176 - lt) / 8 : 1, x = lerp(a[0], b[0], clamp(u, 0, 1)), y = lerp(a[1], b[1], clamp(u, 0, 1)), walk = u < 1;
    const graze = !walk && phase(lt, 20, 0.2) < 0.55;
    stampD(graze ? DEER_DOWN : DEER_UP, x, y, GZ(x, y), 0, lightAt(x, y, 8, t), lt > 168, 6);
  }
}

/* ---- the cardinal: lamp post, then the hat, then a hasty exit to the fairy-light pine ---- */
const CM_B = { r: '#d8342e', R: '#a02830', k: '#2a1a24', y: '#f4a040', e: '#180c14' };
const CARD_SIT = outl(smap(pad(['..r...', '.rrr..', 'kerry.', '.rrrr.', '..rRRR', '..y..y'.slice(0, 6)]), CM_B, 3, 7));
const CARD_FLY = [outl(smap(pad(['RR..RR', '.rrrr.', '.ekry.', '..r...']), CM_B, 3, 3)), outl(smap(pad(['......', 'RRrrRR', '.ekry.', '..r...']), CM_B, 3, 3))];
function drawCardinal(t, lt) {
  if (!FX.cardinal) return;
  const lamp = [Math.round(isx(LAMP_POST.x, LAMP_POST.y)), Math.round(isy(LAMP_POST.x, LAMP_POST.y, LAMP_POST.z)) - 10], hat = [Math.round(isx(SM.x, SM.y)) + 1, Math.round(isy(SM.x, SM.y, 0)) - 42], pine = [Math.round(isx(DECOR.x, DECOR.y)), Math.round(isy(DECOR.x, DECOR.y, 0)) - DECOR.h - 3];
  const fly = (a, b, u) => [Math.round(lerp(a[0], b[0], u)), Math.round(lerp(a[1], b[1], u) - 14 * Math.sin(Math.PI * u))], flap = CARD_FLY[phase(t, 0.2) < 0.5 ? 0 : 1];
  let pos, spr = CARD_SIT, flip = false;
  if (lt < 36) pos = lamp; else if (lt < 38) { pos = fly(lamp, hat, (lt - 36) / 2); spr = flap; flip = true; } else if (lt < T.CRASH) { pos = hat; flip = (lt % 3) < 1.5; }
  else if (lt < T.CRASH + 1.8) { pos = fly(hat, pine, (lt - T.CRASH) / 1.8); spr = flap; } else if (lt < 224) { pos = pine; flip = (lt % 9) < 3; } else if (lt < 226) { pos = fly(pine, lamp, (lt - 224) / 2); spr = flap; flip = true; } else pos = lamp;
  stampS2(spr, pos[0], pos[1], 3e4, AMB_W + 20, flip);
}

function drawCharacters(t) {
  const lt = mod(t, LOOP);
  drawRollTrails(t, lt); drawFlap(lt, t); drawCouple(t, lt); drawCat(t, lt); drawSnowman(t, lt); drawDog(t, lt);
  drawSledFor('sledC', 'kc', 0, t, lt); drawSledFor('sledD', 'kd', 1, t, lt);
  for (const k of ['ka', 'kb', 'kc', 'kd']) drawKid(k, t, lt);
  drawCardinal(t, lt); drawVisitors(t, lt);
}
function scheduleInfo(t) { const lt = mod(t, LOOP), e = episodeFor(); return `A ${findSeg(e.ka, lt).anim} · B ${findSeg(e.kb, lt).anim} · dog ${findSeg(e.dog, lt).anim} · cat ${findSeg(e.cat, lt).anim}`; }

/* ---- emote bubbles ---- */
const ICONS = {
  bang: ['...x...', '...x...', '...x...', '...x...', '.......', '...x...', '.......'],
  heart: ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...', '.......'],
  note: ['...xxx.', '...x.x.', '...x.x.', '...x...', '.xxx...', '.xxx...', '.......'],
  z: ['xxxxx..', '...x...', '..x....', '.x.....', 'xxxxx..', '.......', '.......'],
  dots: ['.......', '.......', 'x..x..x', '.......', '.......', '.......', '.......'],
  q: ['..xxx..', '.x...x.', '.....x.', '...xx..', '...x...', '.......', '...x...']
};
const ICON_C = { bang: CE('#e0403a'), heart: CE('#e8506a'), note: CE('#3e8a80'), z: CE('#6a6aa0'), dots: CE('#5a4058'), q: CE('#3a6ec8') }, BUB_W = CE('#fff6ea'), BUB_O = CE('#2e1a2c');
const BUBBLE_ROWS = ['..wwwwwwww..', '.wwwwwwwwww.', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', '.wwwwwwwwww.', '..wwwwwwww..', '...www......', '...ww.......', '...w........'];
function bubble(icon) {
  return cached('e' + icon, () => {
    const s = new Spr(14, 15); s.map(BUBBLE_ROWS, { w: BUB_W }, 1, 1);
    s.map(ICONS[icon], { x: ICON_C[icon] }, 3, 3); s.outline(() => BUB_O); s.ax = 4; s.ay = 14; return s;
  });
}
const POP = (() => { const s = new Spr(7, 7); s.rect(2, 2, 3, 3, BUB_W); s.outline(() => BUB_O); s.ax = 3; s.ay = 6; return s; })();
const EMOTES = [
  ['ka', 'heart', 0.4, 2.4], ['kd', 'note', 1.2, 2.2], ['dog', 'heart', 6, 2.2], ['woman', 'note', 18, 2.2], ['dog', 'note', 21, 1.6], ['cat', 'note', 12, 2],
  ['dog', 'bang', 38.6, 1.6], ['ka', 'bang', T.CRASH + 0.2, 1.8], ['kb', 'bang', T.CRASH + 0.4, 1.8], ['woman', 'note', T.CRASH + 1, 2.2], ['man', 'note', T.CRASH + 1.6, 2.2], ['dog', 'heart', 50.4, 2],
  ['ka', 'dots', 59.6, 2.2], ['kb', 'note', 60, 2], ['cat', 'heart', 37.4, 2.2], ['cat', 'heart', 44, 2.2], ['woman', 'heart', 50, 2.2],
  ...[56, 66, 76, 86, 96].map(s => ['cat', 'z', s, 2.4]), ['ka', 'note', 99.4, 2], ['kb', 'note', 99.8, 2], ['man', 'heart', 108, 2.2], ...[112, 122, 132, 142, 152, 162, 172, 182].map(s => ['cat', 'z', s, 2.4]),
  ['ka', 'note', 120, 2], ['kb', 'q', 145.4, 3], ['kb', 'heart', 157, 2.2], ['dog', 'heart', 158.6, 2.2], ['dog', 'heart', 174, 2.2], ['kb', 'note', 184.4, 2], ['man', 'heart', 186, 2.2], ['kc', 'bang', 205, 1.6],
  ['ka', 'heart', T.HAT + 0.4, 2.4], ['kb', 'note', T.HAT + 0.8, 2.2], ['woman', 'heart', 232, 2.4], ['man', 'heart', 233, 2.4], ['dog', 'heart', 234, 2.2], ['kc', 'note', 231, 2.2]
];
function drawEmotes(t) {
  for (const [who, icon, t0, dur] of EMOTES) {
    const s = since(t, t0); if (s >= dur) continue;
    const h = HEADS[who]; if (!h) continue;
    stampS2(s < 0.12 || s > dur - 0.1 ? POP : bubble(icon), h[0] - 1, h[1] - 2 - (s > 0.6 ? 1 : 0), 3e6, AMB_W);
  }
}
