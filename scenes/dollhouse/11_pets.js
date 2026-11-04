/* =====================================================================
   Pets. Miniature long-haired dapple dachshund + fluffy grey tabby cat.
   Procedural pixel rigs (shaded ellipses, feathered fur, hand-placed
   faces) -> cached frames facing screen-right; mirrored at draw time.
   ===================================================================== */
const DC = {}, CC = {}, DOG = {}, CAT = {};
function petPalettes() {
  Object.assign(DC, { O: C('#1f100b'), d: C('#3a1d13'), b: C('#5a3121'), m: C('#74432c'), l: C('#8f5838'), t: C('#b97f4c'), T: C('#d8aa74'),
    s: C('#cbbcaa'), S: C('#9a8b7f'), E: C('#2c150e'), F: C('#4a271a'), n: C('#1d1214'), e: C('#140c0e'), w: C('#ffffff'), k: C('#e07a86'), c: C('#3f6f6a') });
  Object.assign(CC, { O: C('#1e1c26'), d: C('#55576a'), b: C('#7c7f91'), m: C('#9a9dae'), l: C('#c0c3cf'), W: C('#f5f2ec'), w: C('#dcd8d2'),
    p: C('#e9a0aa'), g: C('#b9d35c'), G: C('#7fa23a'), e: C('#17151c'), x: C('#ffffff') });
}
/* fur fill: ellipse shaded top-light, with a dapple/tabby pattern callback */
function furEll(s, cx, cy, rx, ry, pal, pat) {
  s.ell(cx, cy, rx, ry, 0, (x, y, dx, dy) => {
    const v = dy * 0.9 + dx * 0.15;
    let c = v < -0.45 ? pal.l : v > 0.55 ? pal.d : v > 0.15 ? pal.b : pal.m;
    if (pat) { const q = pat(x, y, dx, dy, c); if (q) c = q; }
    return c;
  });
}

/* ------------------------------ DOG ------------------------------ */
const DW = 36, DH = 20;
function dapple(x, y) { const h = hash2(x * 3 + 1, y * 7 + 2); return h > 0.86 ? DC.s : h > 0.8 ? DC.S : 0; }
/* o: {body:'stand'|'sit'|'lie'|'curl'|'bow'|'beg', lf:0..3 (trot), bob, head:[dx,dy], tilt, eye:'o'|'c', ear:0|1, tail:angle, breath:0|1, sniff, tongue} */
function drawDogFrame(o) {
  const s = new Spr(DW, DH), ax = 17, gy = DH - 1;
  const bob = o.bob || 0, br = o.breath || 0;
  const pat = (x, y, dx, dy, c) => (c === DC.l || c === DC.m) ? dapple(x, y) : 0;
  const leg = (x, y0, len, near, fx = 0) => {
    for (let k = 0; k < len; k++) { s.px(x + (k > len - 2 ? fx : 0), y0 + k, k > len - 3 ? DC.t : near ? DC.b : DC.d); s.px(x + 1 + (k > len - 2 ? fx : 0), y0 + k, k > len - 3 ? DC.t : near ? DC.m : DC.d); }
    s.px(x + 2 + fx, y0 + len - 1, DC.t);
  };
  const tail = (bx, by, ang, len = 7) => {     // fluffy plume; ang 0 = straight back, + = up
    for (let k = 0; k < len; k++) { const a = ang * (0.4 + k / len * 0.8), x = bx - Math.cos(a) * k, y = by - Math.sin(a) * k;
      s.px(x, y, k < 2 ? DC.b : DC.m); s.px(x, y + 1, DC.b); if (k > 1) { s.px(x, y + 2, k & 1 ? DC.l : DC.T); if (k > 3) s.px(x - 0.5, y + 3, DC.T); } }
  };
  const head = (hx, hy, dir = 1, tilt = 0) => {      // dir 1 = looking right
    furEll(s, hx, hy, 3.4, 2.9, DC);
    s.px(hx + dir * 0.5, hy - 2.8, DC.l); s.px(hx + dir * 1.5, hy - 2.6, DC.l);
    // muzzle
    for (let k = 0; k < 4; k++) { s.px(hx + dir * (2 + k), hy + 0.3 + tilt * k * 0.25, k > 1 ? DC.t : DC.m); s.px(hx + dir * (2 + k), hy + 1.3 + tilt * k * 0.25, DC.t); }
    s.px(hx + dir * 5.6, hy + 0.2 + tilt, DC.n); s.px(hx + dir * 5.6, hy + 1.1 + tilt, DC.n);
    if (o.tongue) s.px(hx + dir * 4, hy + 2.3 + tilt, DC.k);
    // eye + brow
    if (o.eye === 'c') { s.px(hx + dir * 1, hy - 0.2, DC.d); s.px(hx + dir * 2, hy - 0.2, DC.d); }
    else { s.px(hx + dir * 1.5, hy - 0.6, DC.e); s.px(hx + dir * 1.5, hy + 0.4, DC.e); s.px(hx + dir * 2.5, hy + 0.4, DC.e); s.px(hx + dir * 2.5, hy - 0.6, DC.w); }
    s.px(hx + dir * 1.5, hy - 1.7, DC.t);
  };
  const ear = (ex, ey, lift = 0, len = 6) => {  // long feathered ear, darker than the coat
    const L = len - lift * 2;
    for (let k = 0; k < L; k++) { const w = k < 1 ? 2 : 3, sx = Math.round(ex - 1 - (k > 2 ? 1 : 0));
      for (let q = 0; q < w; q++) s.px(sx + q, ey + k, q === 0 ? DC.F : q === w - 1 ? DC.E : DC.d); }
    const by = ey + L, bx = Math.round(ex - 2);
    s.px(bx, by, DC.F); s.px(bx + 1, by, DC.m); s.px(bx + 2, by, DC.F); s.px(bx + 1, by + 1, DC.l); s.px(bx - 1, by - 1, DC.F);
  };
  const body = o.body || 'stand';
  if (body === 'stand' || body === 'trot' || body === 'sniff') {
    const by = gy - 7 + bob + (br ? 0 : 0);
    const ph = o.lf || 0, fA = body === 'trot' ? [1, 0, -1, 0][ph] : 0, fB = -fA;
    // far legs
    leg(ax - 7 + fB, by + 2, gy - by - 1, false, -1); leg(ax + 5 + fA, by + 2, gy - by - 1, false, 1);
    tail(ax - 9, by - 1, o.tail !== undefined ? o.tail : 0.5);
    furEll(s, ax - 5, by, 3.6, 3.2 + br * 0.3, DC, pat);
    furEll(s, ax, by - 0.3, 7.5, 3 + br * 0.3, DC, pat);
    furEll(s, ax + 5, by + 0.6, 3.4, 3.5 + br * 0.3, DC, pat);
    // belly fringe
    for (let x = ax - 6; x <= ax + 6; x++) if ((x & 1) || hash2(x, 5) > 0.5) s.px(x, by + 3 + (x % 3 === 0 ? 1 : 0), DC.l);
    for (let x = ax + 4; x <= ax + 7; x++) s.px(x, by + 3.5, DC.T);
    // near legs
    leg(ax - 6 + fA, by + 2, gy - by - 1, true, -1); leg(ax + 6 + fB, by + 2, gy - by - 1, true, 1);
    const sn = body === 'sniff' ? 4 + (o.sniff || 0) : 0;
    const hx = ax + 10 + (o.head ? o.head[0] : 0), hy = by - 3 + sn + (o.head ? o.head[1] : 0);
    for (let k = 0; k < 3; k++) furEll(s, ax + 7 + k, by - 1 - k * 0.8 + sn * k / 4, 2.4, 2.6, DC, pat);   // neck
    head(hx, hy, 1, o.tilt || 0);
    ear(hx - 1, hy - 1 + (o.tilt ? -1 : 0), o.ear || 0);
  } else if (body === 'sit' || body === 'beg') {
    const beg = body === 'beg';
    // rump on the ground, body rising to the front
    tail(ax - 7, gy - 2, o.tail !== undefined ? o.tail : 0.15, 6);
    furEll(s, ax - 4, gy - 3, 4, 3, DC, pat);
    for (let k = 0; k < 6; k++) furEll(s, ax - 3 + k * (beg ? 1.2 : 0.75), gy - 4 - k * (beg ? 1.3 : 1.45), 3.2, 3, DC, pat);
    if (!beg) for (let y = gy - 11; y < gy - 4; y++) { s.px(ax + 3.5, y, DC.T); s.px(ax + 4.5, y, y & 1 ? DC.T : DC.t); }
    if (beg) { // front paws up and forward (on the sofa edge)
      for (let k = 0; k < 5; k++) { s.px(ax + 5 + k, gy - 11 + k * 0.2, DC.m); s.px(ax + 5 + k, gy - 10 + k * 0.2, DC.b); }
      s.px(ax + 10, gy - 11, DC.t); s.px(ax + 10, gy - 10, DC.t); s.px(ax + 11, gy - 10, DC.t);
      s.px(ax - 2, gy, DC.t); s.px(ax - 1, gy, DC.t);
    } else {
      leg(ax + 2, gy - 6, 6, false, 1); leg(ax + 4, gy - 6, 6, true, 1);
    }
    s.px(ax - 1, gy, DC.t); s.px(ax - 2, gy, DC.t);
    const hx = ax + (beg ? 8 : 5) + (o.head ? o.head[0] : 0), hy = gy - (beg ? 14 : 14) + (o.head ? o.head[1] : 0);
    head(hx, hy, 1, o.tilt || 0);
    ear(hx - 1, hy - 1 + (o.tilt ? -1 : 0), o.ear || 0, 6);
  } else if (body === 'lie') {
    const by = gy - 3;
    tail(ax - 9, by + 1, o.tail !== undefined ? o.tail : -0.1, 7);
    furEll(s, ax - 1, by, 9, 2.6 + br * 0.4, DC, pat);
    furEll(s, ax + 5, by + 0.4, 3.4, 2.8 + br * 0.3, DC, pat);
    for (let k = 0; k < 4; k++) { s.px(ax + 7 + k, gy, DC.t); s.px(ax + 7 + k, gy - 1, DC.m); }
    for (let x = ax - 8; x < ax + 6; x++) if (x & 1) s.px(x, gy, DC.l);
    const hx = ax + 10 + (o.head ? o.head[0] : 0), hy = gy - 3 + (o.head ? o.head[1] : 0);
    head(hx, hy, 1, 0); ear(hx - 1, hy - 1, o.ear || 0, 5);
  } else if (body === 'curl') {
    // donut: back arc + head resting on the tail at the front
    const cx = ax, cy = gy - 4;
    for (let k = 0; k <= 12; k++) { const a = Math.PI * (0.95 + k / 12 * 1.1), x = cx + Math.cos(a) * 6.5, y = cy + Math.sin(a) * 2.6;
      furEll(s, x, y, 2.9, 2.7 + br * 0.35, DC, pat); }
    furEll(s, cx, cy + 0.6, 5.5, 2.8 + br * 0.3, DC, pat);
    // tail wrapping the front
    for (let k = 0; k < 9; k++) { const x = cx - 5 + k * 1.2, y = gy - 1 - Math.sin(k / 8 * Math.PI) * 0.6; s.px(x, y, DC.m); s.px(x, y + 1, k & 1 ? DC.T : DC.l); }
    const hx = cx + 3 + (o.head ? o.head[0] : 0), hy = gy - 4 + (o.head ? o.head[1] : 0);
    head(hx, hy, 1, 0.3); ear(hx - 1, hy - 1, o.ear || 0, 4);
  } else if (body === 'bow') {
    // play-bow stretch: chest down, rear up, front legs forward
    tail(ax - 8, gy - 10, 1.0, 7);
    for (let k = 0; k < 7; k++) furEll(s, ax - 6 + k * 2, gy - 8 + k * 0.9, 3, 3, DC, pat);
    leg(ax - 7, gy - 6, 6, false, -1); leg(ax - 5, gy - 6, 6, true, -1);
    for (let k = 0; k < 6; k++) { s.px(ax + 4 + k, gy - 1, DC.m); s.px(ax + 4 + k, gy, DC.t); }
    const hx = ax + 9, hy = gy - 4;
    head(hx, hy, 1, 0); ear(hx - 1, hy - 1, 0, 5);
  }
  s.outline(() => DC.O);
  s.ax = ax; s.ay = gy;
  return s;
}
function buildDogFrames() {
  const F = (k, o) => { DOG[k] = drawDogFrame(o); };
  for (let k = 0; k < 4; k++) F('trot_' + k, { body: 'trot', lf: k, bob: k & 1 ? -1 : 0, tail: 0.5 + (k & 1 ? 0.35 : -0.1), ear: k & 1 });
  for (let k = 0; k < 4; k++) F('wag_' + k, { body: 'stand', tail: [0.2, 0.9, 1.3, 0.9][k], tongue: 1 });
  F('stand', { body: 'stand', tail: 0.4 }); F('stand_ear', { body: 'stand', tail: 0.4, ear: 1 });
  F('sniff_0', { body: 'sniff', sniff: 0, tail: 0.6 }); F('sniff_1', { body: 'sniff', sniff: 1, tail: 0.8, ear: 1 });
  F('sit', { body: 'sit' }); F('sit_tilt', { body: 'sit', tilt: 1, head: [0, -1], ear: 1 }); F('sit_tongue', { body: 'sit', tongue: 1 });
  for (let k = 0; k < 3; k++) F('beg_' + k, { body: 'beg', tail: [0.3, 1.0, 1.4][k], tongue: k === 2 ? 1 : 0, eye: k === 1 ? 'c' : 'o' });
  F('lie', { body: 'lie' }); F('lie_1', { body: 'lie', breath: 1 }); F('lie_sleep', { body: 'lie', eye: 'c' }); F('lie_sleep_1', { body: 'lie', eye: 'c', breath: 1 });
  F('curl_0', { body: 'curl', eye: 'c' }); F('curl_1', { body: 'curl', eye: 'c', breath: 1 }); F('curl_ear', { body: 'curl', eye: 'c', ear: 1 });
  F('curl_open', { body: 'curl', eye: 'o' });
  F('bow', { body: 'bow' });
}

/* ------------------------------ CAT ------------------------------ */
const CW = 26, CH = 22;
function tabby(x, y, dx, dy, c) { return (c === CC.m || c === CC.b) && (Math.floor(x + y * 0.4) % 3 === 0) ? CC.d : 0; }
/* o: {body:'sit'|'sitb'|'walk'|'loaf'|'curl'|'groom'|'stretch'|'crouch'|'leap'|'bat', lf, tail:[a,b] curve params, eye:'o'|'c'|'h', ear:0|1, paw} */
function drawCatFrame(o) {
  const s = new Spr(CW, CH), ax = 12, gy = CH - 1, body = o.body || 'sit';
  const tailCurve = (pts, th = 2) => { for (let k = 0; k < pts.length; k++) { const [x, y] = pts[k]; const ring = k % 3 === 1;
      for (let a = 0; a < th; a++) for (let b = 0; b < th; b++) s.px(x + a - 0.5, y + b - 0.5, ring ? CC.d : (b === 0 ? CC.m : CC.b)); }
    const [tx, ty] = pts[pts.length - 1]; s.px(tx, ty, CC.d); };
  const bez = (p0, p1, p2, p3, n = 12) => { const r = []; for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t;
      r.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return r; };
  const head = (hx, hy, view = 'f', eye = 'o', ear = 0, dir = 1) => {
    // ears
    const earPx = (ex, ey, tw) => { s.px(ex, ey - 2 + tw, CC.b); s.px(ex, ey - 1 + tw, CC.b); s.px(ex + dir, ey - 1 + tw, CC.p); s.px(ex - dir, ey, CC.b); s.px(ex, ey, CC.b); s.px(ex + dir, ey, CC.b); };
    earPx(hx - 2 * dir, hy - 2.5, 0); earPx(hx + 1.6 * dir, hy - 2.8, ear);
    furEll(s, hx, hy, 3.7, 3, CC, (x, y, dx, dy, c) => (dy < -0.4 && Math.abs(dx) < 0.35 && (x & 1)) ? CC.d : 0);
    s.px(hx - 3.6 * dir, hy + 0.8, CC.l); s.px(hx + 3.6 * dir, hy + 0.8, CC.l);           // cheek fluff
    if (view === 'b') return;
    // muzzle + face
    s.px(hx + 0.5 * dir, hy + 1, CC.W); s.px(hx + 1.5 * dir, hy + 1, CC.W); s.px(hx + 1 * dir, hy + 2, CC.W); s.px(hx + 2.4 * dir, hy + 1.3, CC.W);
    s.px(hx + 1.2 * dir, hy + 0.6, CC.p);
    if (eye === 'c') { s.px(hx - 1.2 * dir, hy - 0.4, CC.d); s.px(hx - 0.4 * dir, hy - 0.2, CC.d); s.px(hx + 2.2 * dir, hy - 0.4, CC.d); s.px(hx + 2.9 * dir, hy - 0.2, CC.d); }
    else if (eye === 'h') { s.px(hx - 1 * dir, hy - 0.4, CC.G); s.px(hx + 2.4 * dir, hy - 0.4, CC.G); s.px(hx - 1 * dir, hy - 1, CC.d); s.px(hx + 2.4 * dir, hy - 1, CC.d); }
    else { s.px(hx - 1 * dir, hy - 0.6, CC.g); s.px(hx - 1 * dir, hy + 0.3, CC.G); s.px(hx + 2.4 * dir, hy - 0.6, CC.g); s.px(hx + 2.4 * dir, hy + 0.3, CC.G);
      s.px(hx - 0.3 * dir, hy - 0.2, CC.e); s.px(hx + 3.0 * dir, hy - 0.2, CC.e); }
  };
  const legC = (x, y0, len, near) => { for (let k = 0; k < len; k++) { s.px(x, y0 + k, k > len - 3 ? CC.W : near ? CC.m : CC.b); s.px(x + 1, y0 + k, k > len - 3 ? CC.w : near ? CC.b : CC.d); } };
  const t = o.tail || [0, 0];
  if (body === 'sit' || body === 'groom' || body === 'bat' || body === 'sitb') {
    const back = body === 'sitb';
    // tail wrapped / swishing on the ground
    if (back) tailCurve(bez([ax - 2, gy - 1], [ax - 7, gy], [ax - 9 + t[0], gy - 2 + t[1]], [ax - 8 + t[0] * 1.5, gy - 6 + t[1]]));
    else tailCurve(bez([ax - 3, gy - 1], [ax - 8, gy - 1], [ax - 6 + t[0], gy + 0.5], [ax + 1 + t[0], gy + t[1] * 0.3]));
    furEll(s, ax - 2, gy - 3.4, 4.4, 3.4, CC, tabby);                                     // haunch
    furEll(s, ax, gy - 6, 3.8, 5, CC, back ? tabby : (x, y, dx, dy, c) => dx > 0.2 && dy > -0.5 ? CC.W : tabby(x, y, dx, dy, c));
    if (!back) {
      legC(ax + 1, gy - 5, 5, false); legC(ax + 3, gy - 5, 5, true);
      if (body === 'groom') { const pz = o.paw || 0; s.px(ax + 3, gy - 9 - pz, CC.W); s.px(ax + 4, gy - 9 - pz, CC.W); s.px(ax + 3, gy - 8 - pz, CC.m); s.px(ax + 4, gy - 8 - pz, CC.m); s.px(ax + 3, gy - 2, 0); }
      if (body === 'bat') { const pz = o.paw || 0; for (let k = 0; k < 6; k++) s.px(ax + 3 + k * 0.5 + pz, gy - 7 - k, k > 4 ? CC.W : CC.m); }
    }
    const hd = body === 'groom' ? [1, 1] : [0, 0];
    head(ax + 1 + hd[0], gy - 12 + hd[1], back ? 'b' : 'f', body === 'groom' ? 'c' : o.eye || 'o', o.ear || 0, 1);
    if (body === 'groom' && o.paw === 0) s.px(ax + 3, gy - 9, CC.p);
  } else if (body === 'walk') {
    const ph = o.lf || 0, fA = [1, 0, -1, 0][ph];
    tailCurve(bez([ax - 6, gy - 7], [ax - 9, gy - 10], [ax - 8 + t[0], gy - 15], [ax - 5 + t[0] * 1.6, gy - 16 + t[1]]));
    legC(ax - 5 - fA, gy - 5, 5, false); legC(ax + 3 + fA, gy - 5, 5, false);
    furEll(s, ax - 1, gy - 7.2, 6.5, 3.2, CC, (x, y, dx, dy, c) => dy > 0.55 ? CC.l : tabby(x, y, dx, dy, c));
    legC(ax - 4 + fA, gy - 5, 5, true); legC(ax + 4 - fA, gy - 5, 5, true);
    head(ax + 6.5, gy - 11 + (ph & 1 ? 0 : 0), 'f', o.eye || 'o', o.ear || 0, 1);
  } else if (body === 'loaf' || body === 'curl') {
    const br = o.breath || 0;
    if (body === 'curl') {
      furEll(s, ax, gy - 3.4, 6.4, 3.4 + br * 0.35, CC, tabby);
      tailCurve(bez([ax - 6, gy - 2], [ax - 4, gy + 0.5], [ax + 3, gy + 0.5], [ax + 6, gy - 2]), 2);
      head(ax + 3.4, gy - 4.6, 'f', 'c', o.ear || 0, 1);
      tailCurve(bez([ax + 6.5, gy - 2], [ax + 7, gy - 3], [ax + 6, gy - 4], [ax + 4.5, gy - 3.8]), 2);
    } else {
      tailCurve(bez([ax - 5, gy - 1], [ax - 3, gy + 0.5], [ax + 3, gy + 0.5], [ax + 5, gy - 0.6]), 2);
      furEll(s, ax - 0.5, gy - 3.6, 6, 3.6 + br * 0.35, CC, tabby);
      s.px(ax + 4, gy, CC.W); s.px(ax + 5, gy, CC.W);
      head(ax + 4, gy - 7.5, 'f', o.eye || 'h', o.ear || 0, 1);
    }
  } else if (body === 'stretch') {
    tailCurve(bez([ax - 6, gy - 8], [ax - 8, gy - 11], [ax - 7, gy - 15], [ax - 4, gy - 15]));
    legC(ax - 6, gy - 6, 6, false); legC(ax - 4, gy - 6, 6, true);
    for (let k = 0; k < 6; k++) furEll(s, ax - 5 + k * 1.8, gy - 7.5 + k * 0.85, 3, 2.8, CC, tabby);
    for (let k = 0; k < 6; k++) { s.px(ax + 4 + k, gy - 1, CC.m); s.px(ax + 4 + k, gy, CC.W); }
    head(ax + 8, gy - 4.5, 'f', 'c', 0, 1);
    s.px(ax + 9, gy - 2.5, CC.p);
  } else if (body === 'crouch') {
    tailCurve(bez([ax - 6, gy - 3], [ax - 9, gy - 3], [ax - 10, gy - 2], [ax - 12, gy - 2]));
    legC(ax - 5, gy - 3, 3, true); legC(ax + 3, gy - 3, 3, true);
    furEll(s, ax - 1, gy - 4.2, 6.5, 3, CC, tabby);
    head(ax + 6, gy - 6.5, 'f', 'o', 1, 1);
  } else if (body === 'leap') {
    tailCurve(bez([ax - 7, gy - 9], [ax - 10, gy - 9], [ax - 12, gy - 8], [ax - 13, gy - 6]));
    for (let k = 0; k < 4; k++) { s.px(ax - 8 - k, gy - 6 + k, CC.b); s.px(ax - 7 - k, gy - 6 + k, CC.m); }
    for (let k = 0; k < 7; k++) furEll(s, ax - 6 + k * 2, gy - 8 - k * 1.1, 3, 2.7, CC, tabby);
    for (let k = 0; k < 4; k++) { s.px(ax + 7 + k, gy - 12 - k * 0.5, CC.m); s.px(ax + 7 + k, gy - 11 - k * 0.5, CC.W); }
    head(ax + 8, gy - 16, 'f', 'o', 1, 1);
  }
  s.outline(() => CC.O);
  s.ax = ax; s.ay = gy;
  return s;
}
function buildCatFrames() {
  const F = (k, o) => { CAT[k] = drawCatFrame(o); };
  for (let k = 0; k < 6; k++) { const a = Math.sin(k / 6 * TAU); F('sit_' + k, { body: 'sit', tail: [a * 2, Math.cos(k / 6 * TAU)] }); }
  F('sit_blink', { body: 'sit', eye: 'c' }); F('sit_half', { body: 'sit', eye: 'h' }); F('sit_ear', { body: 'sit', ear: 1 });
  for (let k = 0; k < 6; k++) { const a = Math.sin(k / 6 * TAU); F('sitb_' + k, { body: 'sitb', tail: [a * 2.5, Math.cos(k / 6 * TAU) * 1.5], ear: k === 3 ? 1 : 0 }); }
  for (let k = 0; k < 4; k++) F('walk_' + k, { body: 'walk', lf: k, tail: [Math.sin(k / 4 * TAU), Math.cos(k / 4 * TAU)] });
  F('groom_0', { body: 'groom', paw: 0 }); F('groom_1', { body: 'groom', paw: 1 }); F('groom_2', { body: 'groom', paw: 2 });
  F('bat_0', { body: 'bat', paw: 0 }); F('bat_1', { body: 'bat', paw: 2 });
  F('loaf_0', { body: 'loaf' }); F('loaf_1', { body: 'loaf', breath: 1 }); F('loaf_blink', { body: 'loaf', eye: 'c' });
  F('curl_0', { body: 'curl' }); F('curl_1', { body: 'curl', breath: 1 }); F('curl_ear', { body: 'curl', ear: 1 });
  F('stretch', { body: 'stretch' }); F('crouch', { body: 'crouch' }); F('leap', { body: 'leap' });
}
function buildPetFrames() { petPalettes(); buildDogFrames(); buildCatFrames(); }
