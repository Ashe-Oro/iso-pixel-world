/* =====================================================================
   The story. One authored 300 s storyboard: everyone starts and ends in
   their home pose (girl reading, boy fishing, cat hunting the pond).
   ===================================================================== */
const EPI = new Map();
const BEAT = 0.75;
const nod = (t, active, lag = 0) => (active && phase(t, 2 * BEAT, -lag) < 0.2 ? 1 : 0);
const during = (t, a, b) => { const m = mod(t, LOOP); return m >= a && m < b; };
const GIRL_P = [17.5, 2.6, 1.5], BOY_P = [-22.3, 60, 0];                 // the boy sits where the rim faces the camera
const MUG_P = [7.8, 0.2, 3];
const SPOT = { pond: [12, 21, 0], girl: [28.5, 9.5, 0], boy: [-16, 56, 0], boyEat: [-7, 52, 0] };
const CATPATH = {
  toGirl: [SPOT.pond, [13, 13, 0], SPOT.girl],
  toBoy: [SPOT.girl, [8, 10, 0], [-2, 20, 0], [-7, 36, 0], SPOT.boyEat],
  scoot: [SPOT.boyEat, SPOT.boy],
  home: [SPOT.boy, [-10, 44, 0], [-6, 30, 0], [2, 22, 0], SPOT.pond]
};
function mkTrack() { return { segs: [] }; }
function hold(tr, t0, t1, pos, anim, o = {}) { tr.segs.push({ t0, t1, pos, anim, ...o }); return t1; }
function walk(tr, t0, t1, path, anim, o = {}) {
  let len = 0; const L = [0];
  for (let k = 1; k < path.length; k++) { len += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]); L.push(len); }
  tr.segs.push({ t0, t1, path, lens: L, len, anim, walk: 1, ...o }); return t1;
}
function buildEpisode() {
  const G = mkTrack(), B = mkTrack(), Rd = mkTrack(), Ct = mkTrack();
  for (const [a, b, s] of [[0, 33.4, 'read'], [33.4, 38.2, 'pet'], [38.2, 52, 'read'], [52, 54.6, 'sip'], [54.6, 112, 'read'], [112, 113.6, 'lookup'], [113.6, 128, 'read'], [128, 130.6, 'sip'],
    [130.6, 147.5, 'read'], [147.5, 157, 'lookup'], [157, 179.4, 'read'], [179.4, 181.8, 'clap'], [181.8, 267.6, 'read'], [267.6, 270.2, 'wave'], [270.2, 284, 'read'], [284, 286.6, 'sip'], [286.6, LOOP, 'read']]) hold(G, a, b, GIRL_P, s);
  hold(B, 0, LOOP, BOY_P, 'sit');
  for (const [a, b, s] of [[0, 19, 'idle'], [19, 20.6, 'nibble'], [20.6, 21.4, 'yank'], [21.4, 174, 'idle'], [174, 175.2, 'bite'], [175.2, 179.4, 'reel'], [179.4, 183.6, 'hold'], [183.6, 184.6, 'swing'],
    [184.6, 190.5, 'rest'], [190.5, 191.1, 'backswing'], [191.1, 192.6, 'cast'], [192.6, LOOP, 'idle']]) hold(Rd, a, b, BOY_P, s);
  hold(Ct, 0, 26.5, SPOT.pond, 'hunt');
  hold(Ct, 26.5, 27.1, SPOT.pond, 'stand', { face: -1 });
  walk(Ct, 27.1, 33, CATPATH.toGirl, 'walk');
  hold(Ct, 33, 38.5, SPOT.girl, 'sit', { face: -1 });
  hold(Ct, 38.5, 178, SPOT.girl, 'sleep', { face: -1 });
  hold(Ct, 178, 178.6, SPOT.girl, 'sit', { face: -1 });
  walk(Ct, 178.6, 183.4, CATPATH.toBoy, 'run');
  hold(Ct, 183.4, 185, SPOT.boyEat, 'sit', { face: -1 });
  hold(Ct, 185, 190, SPOT.boyEat, 'eat', { face: -1 });
  walk(Ct, 190, 190.9, CATPATH.scoot, 'walk');
  hold(Ct, 190.9, 229, SPOT.boy, 'sit', { face: -1 });
  hold(Ct, 229, 229.6, SPOT.boy, 'stand', { face: 1 });
  walk(Ct, 229.6, 238.4, CATPATH.home, 'walk');
  hold(Ct, 238.4, LOOP, SPOT.pond, 'hunt');
  return { girl: G, boy: B, rod: Rd, cat: Ct };
}
function episodeFor() { if (!EPI.has(0)) EPI.set(0, buildEpisode()); return EPI.get(0); }
function buildSchedule() { EPI.clear(); }
function findSeg(tr, lt) { const s = tr.segs; for (let k = 0; k < s.length; k++) if (lt >= s[k].t0 && lt < s[k].t1) return s[k]; return s[s.length - 1]; }
function segPos(s, lt) {
  if (!s.walk) return s.pos;
  const d = clamp((lt - s.t0) / (s.t1 - s.t0), 0, 1) * s.len, L = s.lens; let k = 1;
  while (k < L.length - 1 && d > L[k]) k++;
  const u = (d - L[k - 1]) / Math.max(1e-6, L[k] - L[k - 1]), a = s.path[k - 1], b = s.path[k];
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), 0];
}
const HEADS = { girl: null, boy: null, cat: null, owl: null };
const PAGE_TURNS = [9, 26, 44, 63, 84, 100, 140, 165, 200, 215, 240, 255, 278, 295];
const BLINKS = (() => { const r = mulberry32(4242), out = []; for (let b = 3.2; b < LOOP - 1; b += 4.5 + r() * 3) out.push(+b.toFixed(2)); return out; })();

function drawGirl(t, lt) {
  const seg = findSeg(episodeFor().girl, lt), st = seg.anim, [x, y, z] = GIRL_P, sx = Math.round(isx(x, y)), sy = Math.round(isy(x, y, z));
  let pose = 'read', eyes = 'down', dy = 0, tilt = 0;
  const blink = BLINKS.some(b => since(t, b) < 0.15);
  if (st === 'read') {
    dy = nod(t, phase(t, 15) < 0.6);
    for (const pt of PAGE_TURNS) { const d = since(t, pt); if (d < 0.6) pose = d < 0.2 ? 'page0' : d < 0.4 ? 'page1' : 'page2'; }
    if (blink) eyes = 'blink';
  } else if (st === 'pet') { pose = phase(t, 0.8) < 0.5 ? 'pet0' : 'pet1'; eyes = 'blink'; tilt = 1; }
  else if (st === 'sip') { pose = 'sip'; eyes = 'blink'; }
  else if (st === 'lookup') eyes = blink ? 'blink' : 'up';
  else if (st === 'clap') { pose = phase(t, 0.4) < 0.5 ? 'clap0' : 'clap1'; eyes = 'side'; }
  else if (st === 'wave') { pose = phase(t, 0.5) < 0.5 ? 'wave0' : 'wave1'; eyes = 'side'; }
  stampD(girlSpr(pose, eyes, dy, tilt), x, y, z, 0, [lightAt(x, y, z + 2, t), lightAt(x, y, z + 20, t)], false, 5);
  HEADS.girl = [sx, sy - 26];
  /* the mug: on the deck, or at her lips while she sips */
  let mx = isx(MUG_P[0], MUG_P[1]), my = isy(MUG_P[0], MUG_P[1], MUG_P[2]);
  if (st === 'sip') { const k = smooth(Math.min(1, (lt - seg.t0) / 0.5, (seg.t1 - lt) / 0.5)); mx = lerp(mx, sx - 6, k); my = lerp(my, sy - 11, k); }
  const held = st === 'sip', m = MUG_SPR, x0 = Math.round(mx) - m.ax, y0 = Math.round(my) - m.ay, d = held ? DEP(x, y, z) + 60 : DEP(MUG_P[0], MUG_P[1], MUG_P[2]) + 16, lw = lightAt(x, y, z + 6, t);
  for (let r = 0; r < m.h; r++) for (let c = 0; c < m.w; c++) { const v = m.d[r * m.w + c]; if (v) dput(x0 + c, y0 + r, v, d, lw); }
  for (let w_ = 0; w_ < 2; w_++) for (let i = 0; i < 5; i++) {
    const p = phase(t, 2.5, i / 5 + w_ * 0.37); if (p > 0.85) continue;
    dput(Math.round(mx) + 1 + w_ * 2 + Math.round(1.6 * Math.sin(p * 6 + w_ * 2.2)), y0 - 1 - Math.round(p * 10), p < 0.4 ? STEAM[0] : STEAM[1], d + 1);
  }
}
const STEAM = [CK([[0, '#fbeeea'], [1, '#aab4d0']]), CK([[0, '#d6b4c2'], [1, '#6a7498']])];

/* ---- rod: screen offsets from the boy's anchor ---- */
const HAND = [-10, -6], TIP0 = [-46, -36], TIPS = { up: [-38, -48], cat: [26, -44], rest: [-30, -48], back: [14, -62], fwd: [-62, -20] };
const BOB_Y = 268, ROD_C = C('#6a4630'), ROD_L = C('#a8784a'), ROD_T = C('#e8d8c0'), LINE_C = CK([[0, '#f6e4cc'], [1, '#aeb8d8']]), BOB_R = C('#e8402e'), BOB_L = C('#ff7a5a'), BOB_W = C('#fff0e0'), BOB_G = C('#d8c8c0');
const ROBIN_LAND = 13, REEL = [C('#c8c0c8'), C('#6a6070')];
function rodState(t, lt) {
  const r = findSeg(episodeFor().rod, lt), u = clamp((lt - r.t0) / (r.t1 - r.t0), 0, 1), s = lt - r.t0, st = r.anim, [x0, y0] = TIP0, jig = phase(t, 0.4) < 0.5 ? 1 : 0;
  const ease = smooth, L = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  let tip = [x0, y0], lean = 0;
  switch (st) {
    case 'idle': tip = [x0, y0 + (since(t, ROBIN_LAND) < 0.3 ? 1 : 0)]; break;
    case 'nibble': tip = [x0, y0 + jig]; break;
    case 'yank': { const k = Math.sin(Math.PI * u); tip = [x0 + (k > 0.3 ? 3 : 0), y0 - 12 * k]; lean = k > 0.2 ? 1 : 0; break; }
    case 'bite': tip = [x0, y0 + 5 + jig]; break;
    case 'reel': tip = L([x0, y0 + 5], TIPS.up, ease(Math.min(1, s / 0.4))); tip[1] += phase(t, 0.5) < 0.5 ? 0 : 1; lean = 1; break;
    case 'hold': tip = [TIPS.up[0], TIPS.up[1] - (phase(t, 1) < 0.5 ? 1 : 0)]; break;
    case 'swing': { const k = ease(u); tip = [lerp(TIPS.up[0], TIPS.cat[0], k), lerp(TIPS.up[1], TIPS.cat[1], k) - 8 * Math.sin(Math.PI * k)]; break; }
    case 'rest': tip = L(TIPS.cat, TIPS.rest, ease(Math.min(1, s / 1))); break;
    case 'backswing': tip = L(TIPS.rest, TIPS.back, ease(u)); break;
    case 'cast': tip = u < 0.25 ? L(TIPS.back, TIPS.fwd, ease(u / 0.25)) : L(TIPS.fwd, [x0, y0], ease((u - 0.25) / 0.75)); break;
  }
  const tx = Math.round(tip[0]), ty = Math.round(tip[1]), bx = x0 - 5 + Math.round(wave(t, 6, 0.4) * 1.5), bob = dy => ({ kind: 'bobber', x: bx, y: BOB_Y + Math.round(wave(t, 3, 0.2) * 1.5) + dy, abs: 1 });
  let end;
  switch (st) {
    case 'idle': end = bob(0); break;
    case 'nibble': end = bob(jig ? 5 : 2); break;
    case 'yank': end = bob(-Math.round(26 * Math.sin(Math.PI * u))); break;
    case 'bite': end = bob(u < 0.3 ? 6 : 14); break;
    case 'reel': end = { kind: 'fish', x: Math.round(lerp(x0 - 5, tx, ease(u))) + (phase(t, 0.3) < 0.5 ? 0 : 1), y: null, u: ease(u), ty }; break;
    case 'hold': end = { kind: 'fish', x: tx, y: null, u: 1, ty }; break;
    case 'swing': end = u < 0.75 ? { kind: 'fish', x: tx, y: null, u: 1, ty } : { kind: 'none' }; break;
    case 'rest': case 'backswing': end = { kind: 'dangle', x: tx, y: null, u: 1, ty }; break;
    case 'cast': end = { kind: 'bobber', x: Math.round(lerp(TIPS.back[0], x0 - 5, u)), y: null, cast: u, ty }; break;
  }
  return { st, tip: [tx, ty], end, lean };
}
function dline(x0, y0, x1, y1, c, d, w) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let k = 0; k <= n; k++) dput(Math.round(lerp(x0, x1, k / n)), Math.round(lerp(y0, y1, k / n)), c, d, w); }
const LOOKS = [[183.6, 190.6], [196, 198.6], [267, 269.8]], BOY_PAT = [196, 198.4], BOY_WAVE = [267.2, 269.6], STARGAZE = [147.5, 157];
const FISH_DROP = { release: 184.35, land: 184.6, eat: 185.4, gone: 189.6, x: -14, y: 53 };
let ROD_NOW = null;
function drawBoy(t, lt) {
  const R_ = rodState(t, lt), [x, y, z] = BOY_P, sx = Math.round(isx(x, y)), sy = Math.round(isy(x, y, z)), lw = lightAt(x + 2, y - 2, 8, t), lb = lightAt(x, y, 2, t), d0 = DEP(x, y, z) + 12;
  ROD_NOW = { sx, sy, R: R_ };
  const look = LOOKS.some(([a, b]) => during(t, a, b)), star = during(t, ...STARGAZE), groove = R_.st === 'idle' && !look && !star && phase(t, 10, 0.25) < 0.5;
  const arm = during(t, ...BOY_PAT) ? (phase(t, 0.6) < 0.5 ? 'pat0' : 'pat1') : during(t, ...BOY_WAVE) ? (phase(t, 0.5) < 0.5 ? 'wave0' : 'wave1') : '';
  const blink = BLINKS.some(b => since(t, b + 1.3) < 0.15);
  drawBoyLegs(sx, sy, d0 + 4, lb, t);
  stampD(boySpr(look, star ? 'up' : blink ? 'blink' : 'open', nod(t, groove, 0.1), R_.lean, arm), x, y, z, 0, [lb, lw], false, 12);
  HEADS.boy = [sx + 1, sy - 22];
  const hx = sx + HAND[0] + R_.lean, hy = sy + HAND[1], tx = sx + R_.tip[0], ty = sy + R_.tip[1], d = d0 + 60;
  if (R_.st === 'reel') { const c = [[0, -1], [1, 0], [0, 1], [-1, 0]][Math.floor(phase(t, 0.4) * 4)]; dput(hx + 4, hy + 3, REEL[0], d + 1); dput(hx + 4 + c[0], hy + 3 + c[1], REEL[1], d + 1); }
  dline(hx, hy, tx, ty, ROD_C, d, lw); dline(hx, hy - 1, Math.round((hx + tx) / 2), Math.round((hy + ty) / 2) - 1, ROD_L, d, lw); dput(tx, ty, ROD_T, d + 1, lw);
  const E = R_.end; if (E.kind === 'none') return;
  const ex = sx + E.x; let ey;
  if (E.kind === 'bobber') ey = E.abs ? E.y : Math.round(lerp(sy + TIPS.back[1] + 10, BOB_Y, E.cast) - 40 * Math.sin(Math.PI * E.cast));
  else if (E.kind === 'fish') ey = Math.round(lerp(BOB_Y + 14, ty + 15, E.u)); else ey = ty + 12;
  const ly = E.kind === 'fish' ? ey - 2 : ey;
  if (E.kind === 'bobber' && ey > ty + 34) { let lx0 = tx, ly0 = ty; for (let yy = ty + 1; yy <= ey; yy += 2) { const k = (yy - ty) / (ey - ty), xx = Math.round(lerp(tx, ex, k * k) - 2.5 * Math.sin(Math.PI * k)); dline(lx0, ly0, xx, yy, LINE_C, 1e5, lw); lx0 = xx; ly0 = yy; } }
  else dline(tx, ty + 1, ex, ly, LINE_C, 1e5, lw);
  if (E.kind === 'fish') stampS2(FISH_HANG[phase(t, 0.3) < 0.5 ? 0 : 1], ex, ey, 1e5, lw);
  else if (E.kind === 'bobber') { for (const [a, b, c] of [[0, 0, BOB_R], [1, 0, BOB_L], [0, 1, BOB_W], [1, 1, BOB_G]]) dput(ex + a, ey + b, c, 1e5 + 1, lw); for (const [a, b] of [[-1, 0], [-1, 1], [2, 0], [2, 1], [0, -1], [1, -1], [0, 2], [1, 2]]) dput(ex + a, ey + b, P.ink, 1e5, lw); }
}
/* screen-anchored sprite at a fixed depth */
function stampS2(s, sx, sy, d, lw, flip) {
  for (let r = 0; r < s.h; r++) for (let c = 0; c < s.w; c++) { const v = s.d[r * s.w + (flip ? s.w - 1 - c : c)]; if (v) dput(sx + c - (flip ? s.w - 1 - s.ax : s.ax), sy + r - s.ay, v, d, lw); }
}
function drawDroppedFish(t) {
  const sr = since(t, FISH_DROP.release); if (sr > FISH_DROP.gone - FISH_DROP.release) return;
  const gx = Math.round(isx(FISH_DROP.x, FISH_DROP.y)), gy = Math.round(isy(FISH_DROP.x, FISH_DROP.y, 0)), lw = lightAt(FISH_DROP.x, FISH_DROP.y, 2, t);
  if (sr < FISH_DROP.land - FISH_DROP.release) {
    const u = sr / (FISH_DROP.land - FISH_DROP.release), bx = ROD_NOW.sx + TIPS.cat[0], by = ROD_NOW.sy + TIPS.cat[1] + 15;
    stampS2(FISH_HANG[0], Math.round(lerp(bx, gx, u)), Math.round(lerp(by, gy - 6, u * u)), 2e4, lw); return;
  }
  const s = since(t, FISH_DROP.eat), bites = s < 5.2 ? clamp(Math.floor(s / 0.7), 0, 6) : 0;
  if (bites >= 6) return;
  stampD(FISH_LIE(bites), FISH_DROP.x, FISH_DROP.y, 0, 0, lw, false, 1);
}

/* ---- cat ---- */
const CAT_HAPPY = [[33.6, 38.2], [196, 198.6]], EAR_FLICKS = [4, 15.2, 52.15, 160.15, 244, 280.15];
function drawCat(t, lt) {
  const seg = findSeg(episodeFor().cat, lt), st = seg.anim, p = segPos(seg, lt), x = p[0], y = p[1];
  const happy = CAT_HAPPY.some(([a, b]) => during(t, a, b)), ear = EAR_FLICKS.some(e => since(t, e) < 0.25);
  let spr, flip = seg.face === -1, sdx = 0;
  if (seg.walk) { const q = segPos(seg, Math.min(seg.t1 - 1e-3, lt + 0.02)); sdx = (q[0] - x) - (q[1] - y); flip = sdx < 0; }
  let headDx = 0, headDy = 14;
  if (st === 'hunt') {
    let wiggle = 0, reach = 0, drops = -1;
    for (const s0 of SWIPES) {
      const until = since(s0, t); if (until > 0 && until < 1.2) wiggle = phase(t, 0.4) < 0.5 ? 1 : 0;
      const dt = since(t, s0); if (dt < 0.45) { reach = dt < 0.12 ? 2 : dt < 0.3 ? 5 : 2; drops = dt; } else if (dt < 1.25) reach = -1 - (phase(t, 0.2) < 0.5 ? 0 : 1);
    }
    spr = catHunt(Math.round(wave(t, 2) * (wiggle ? 1 : 0.6)), wiggle, reach, ear ? 1 : 0); flip = false; headDx = 7; headDy = 12;
    if (drops > 0.15) { const u = (drops - 0.15) / 0.3, i0 = Math.round(isx(RIPPLE_AT.x, RIPPLE_AT.y)), j0 = Math.round(isy(RIPPLE_AT.x, RIPPLE_AT.y, 0)); for (let k = 0; k < 3; k++) dput(i0 - 2 + k * 3, j0 - 3 - Math.round(7 * Math.sin(Math.PI * u)) + k, SPLASH_K, 900); }
  } else if (st === 'walk' || st === 'run' || st === 'stand') {
    const dist = seg.walk ? clamp((lt - seg.t0) / (seg.t1 - seg.t0), 0, 1) * seg.len : 0, f = st === 'stand' ? 1 : Math.floor(dist / (st === 'run' ? 2.4 : 1.4)) % 4;
    spr = catWalk(f, Math.round(wave(t, 1.5) * 1), 0); headDx = 7; headDy = 13;
  } else if (st === 'sit') { spr = catSit(wave(t, 3, 0.2) > 0.6 ? -1 : 0, happy ? 1 : 0); headDx = 3; headDy = 15; }
  else if (st === 'sleep') { spr = catSleep(phase(t, 4) < 0.45 ? 1 : 0, ear ? 1 : 0); headDx = 6; headDy = 8; }
  else if (st === 'eat') { spr = catEat(phase(t, 0.6) < 0.5 ? 2 : 3); headDx = 7; headDy = 10; }
  shadowBlob(x, y, 0, 9, 3, 0.28);
  const sy = Math.round(isy(x, y, 0)) + (st === 'run' && Math.floor(lt * 8) % 2 ? -1 : 0);
  stampD(spr, x, y, sy - isy(x, y, 0), 0, [lightAt(x, y, 2, t), lightAt(x, y, 12, t)], flip, 0.5);
  HEADS.cat = [Math.round(isx(x, y)) + (flip ? -headDx : headDx) + (seg.pos === SPOT.girl ? 17 : 0), Math.round(isy(x, y, 0)) - headDy + (seg.pos === SPOT.girl ? 6 : 0)];   // beside her, never over her face
}

/* ---- robin and owl ---- */
const ROBIN = [{ arrive: 10.5, land: 13, leave: 19.1, from: [-40, 104], via: [60, 70], to: [-50, 34], perch: 'rod' }, { arrive: 250, land: 252, leave: 290, from: [680, 37], via: [400, 83], to: [-30, 30], perch: 'line' }];
function drawRobin(t) {
  if (!FX.robin) return;
  const bez = (a, c, b, u) => [lerp(lerp(a[0], c[0], u), lerp(c[0], b[0], u), u), lerp(lerp(a[1], c[1], u), lerp(c[1], b[1], u), u)];
  for (const V of ROBIN) {
    const lx = LINE.x0 + 15.2, perch = V.perch === 'rod' ? [ROD_NOW.sx + ROD_NOW.R.tip[0] - 1, ROD_NOW.sy + ROD_NOW.R.tip[1] - 2] : [Math.round(isx(lx, LINE.y)), Math.round(isy(lx, LINE.y, ropeZ(lx))) - 1];
    const sIn = since(t, V.arrive), sOut = since(t, V.leave), flyDur = V.land - V.arrive, stay = V.leave - V.land;
    let pos, spr, flip = false;
    if (sIn < flyDur) { const u = 1 - (1 - sIn / flyDur) ** 2; pos = bez(V.from, V.via, perch, u); spr = sIn > flyDur - 0.25 ? ROBIN_PERCH : ROBIN_FLY[phase(t, 0.2) < 0.5 ? 0 : 1]; flip = perch[0] > V.from[0]; }
    else if (sOut < 2.2) { const u = (sOut / 2.2) ** 1.6; pos = bez(perch, [perch[0] - 10, perch[1] - 43], V.to, u); spr = ROBIN_FLY[phase(t, 0.1) < 0.5 ? 0 : 1]; flip = V.to[0] > perch[0]; }
    else if (since(t, V.land) < stay) { const s = since(t, V.land), g = mod(s, 7.5) / 7.5; pos = perch; spr = ROBIN_PERCH; flip = g > 0.27 && g < 0.45; }
    else continue;
    stampS2(spr, Math.round(pos[0]), Math.round(pos[1]), 3e4, AMB_W + 6, flip);
  }
}
const OWL = { arrive: 92, land: 94, leave: 206, x: 33, y: HS.yR - 0.5 };
function drawOwl(t) {
  HEADS.owl = null; if (!FX.owl) return;
  const sIn = since(t, OWL.arrive), sOut = since(t, OWL.leave), ox = Math.round(isx(OWL.x, OWL.y)), oy = Math.round(isy(OWL.x, OWL.y, HS.ridge + 0.5));
  let x, y, spr;
  if (sIn < OWL.land - OWL.arrive) { const u = smooth(sIn / (OWL.land - OWL.arrive)); x = Math.round(lerp(680, ox, u)); y = Math.round(lerp(30, oy - 7, u) - 17 * Math.sin(Math.PI * u)); spr = OWL_FLY[phase(t, 0.4) < 0.5 ? 0 : 1]; }
  else if (sOut < 2) { const u = smooth(sOut / 2); x = Math.round(lerp(ox, 680, u)); y = Math.round(lerp(oy - 7, 13, u)); spr = OWL_FLY[phase(t, 0.4) < 0.5 ? 0 : 1]; }
  else if (since(t, OWL.land) < OWL.leave - OWL.land) { x = ox; y = oy; spr = phase(t, 5, 0.3) < 0.05 ? OWL_BLINK : OWL_SIT; HEADS.owl = [x, y - 10]; }
  else return;
  stampS2(spr, x, y, 2e3, 130);
}

function drawCharacters(t) {
  const lt = mod(t, LOOP);
  drawGirl(t, lt); drawBoy(t, lt); drawDroppedFish(t); drawCat(t, lt); drawRobin(t); drawOwl(t);
}
function scheduleInfo(t) { const lt = mod(t, LOOP), e = episodeFor(); return `girl ${findSeg(e.girl, lt).anim} · cat ${findSeg(e.cat, lt).anim} · rod ${findSeg(e.rod, lt).anim}`; }

/* ---- emote bubbles ---- */
const ICONS = {
  bang: ['...x...', '...x...', '...x...', '...x...', '.......', '...x...', '.......'],
  heart: ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...', '.......'],
  note: ['...xxx.', '...x.x.', '...x.x.', '...x...', '.xxx...', '.xxx...', '.......'],
  z: ['xxxxx..', '...x...', '..x....', '.x.....', 'xxxxx..', '.......', '.......'],
  dots: ['.......', '.......', 'x..x..x', '.......', '.......', '.......', '.......']
};
const ICON_C = { bang: CE('#e0403a'), heart: CE('#e8506a'), note: CE('#3e8a80'), z: CE('#6a6aa0'), dots: CE('#5a4058') }, BUB_W = CE('#fff6ea'), BUB_O = CE('#2e1a2c');
const BUBBLE_ROWS = ['..wwwwwwww..', '.wwwwwwwwww.', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', '.wwwwwwwwww.', '..wwwwwwww..', '...www......', '...ww.......', '...w........'];
function bubble(icon) {
  return cached('e' + icon, () => {
    const s = new Spr(14, 15); s.map(BUBBLE_ROWS, { w: BUB_W }, 1, 1);
    s.map(ICONS[icon], { x: ICON_C[icon] }, 3, 3); s.outline(() => BUB_O); s.ax = 4; s.ay = 14; return s;
  });
}
const POP = (() => { const s = new Spr(7, 7); s.rect(2, 2, 3, 3, BUB_W); s.outline(() => BUB_O); s.ax = 3; s.ay = 6; return s; })();
const EMOTES = [['girl', 'note', 15, 2.2], ['boy', 'bang', 19, 1.2], ['boy', 'dots', 21.6, 1.8], ['cat', 'heart', 34.6, 2.4],
  ...[42, 51, 60, 69, 78, 87, 96, 105, 114, 123, 132, 141, 159, 168].map(s => ['cat', 'z', s, 2.4]),
  ['owl', 'note', 125, 2], ['girl', 'bang', 148, 1.4], ['boy', 'bang', 148.5, 1.4], ['owl', 'note', 165, 2], ['boy', 'bang', 174, 1.4], ['cat', 'bang', 178, 1], ['girl', 'note', 179.6, 2],
  ['cat', 'heart', 188.4, 2.2], ['cat', 'note', 196.8, 1.8], ['girl', 'note', 268.2, 2]];
function drawEmotes(t) {
  for (const [who, icon, t0, dur] of EMOTES) {
    const s = since(t, t0); if (s >= dur) continue;
    const h = HEADS[who]; if (!h) continue;
    stampS2(s < 0.12 || s > dur - 0.1 ? POP : bubble(icon), h[0] - 1, h[1] - 2 - (s > 0.6 ? 1 : 0), 3e6, AMB_W);
  }
}
