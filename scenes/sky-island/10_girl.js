/* =====================================================================
   The girl: sits on the porch edge reading, front-facing. Frames are
   composed from head + body + pose on first use and cached, so a part
   that moves can never leave a gap in the outline.
   ===================================================================== */
const SPRC = new Map();
function cached(key, fn) { let s = SPRC.get(key); if (!s) { s = fn(); SPRC.set(key, s); } return s; }
const pal_ = o => { const m = {}; for (const k in o) m[k] = C(o[k]); return m; };
const GM = pal_({ h: '#3a2030', H: '#a0543e', c: '#f4b443', s: '#e6b08a', S: '#c08866', e: '#2c1620', b: '#e08a78', w: '#5c9488', W: '#3e6a68', v: '#8cc2a6', k: '#b4343c', K: '#7e2230', p: '#fff4de', P: '#d8bfa0', l: '#3c2a44', o: '#6e3a2a' });
const G_HEAD = [
  '.....hhhhhhh.....',
  '...hhhhhhhhhhh...',
  '..HhhhhhhhhhhhH..',
  '.HhhhhhhhhhhhccH.',
  '.HhhhhhhhhhhhcHh.',
  'HhhhhshhhhshhhhhH',
  'HhhhsssssssssshhH',
  'HhhsssssssssssshH',
  'HhhsssssssssssshH',
  'HhhbbsssSsssbbshH',
  '.HhhsssssssssShH.',
  '.HhhhSsssssShhhH.',
  '..Hhh.SSSSS.hhH..'
];
const G_BODY = [
  '..HhhWwwwwwWhhH..',
  '..HhvwwwwwwwWhH..',
  '..vvwwwwwwwwwWW..',
  '.vvwwwwwwwwwwwWW.',
  '.vwwkkkkkkkkkwwW.',
  '.vssppppPppppssW.',
  '..wKppppPppppKw..',
  '..wkkkkkkkkkkkw..',
  '...lll.....lll...',
  '...lll.....lll...',
  '...ooo.....ooo...',
  '..oooo.....oooo..'
];
const G_OX = 7, G_BY = 12;                            // body offset within the 31x26 frame
/* the eyes are painted after the head so one pose can look down, up, across or shut */
function girlEyes(s, x, y, eyes) {
  const L = x + 5, R_ = x + 11, e = GM.e, skin = GM.S;
  if (eyes === 'blink') { s.rect(L, y + 8, 2, 1, skin); s.rect(R_, y + 8, 2, 1, skin); }
  else if (eyes === 'down') { s.rect(L, y + 8, 2, 1, e); s.rect(R_, y + 8, 2, 1, e); }
  else if (eyes === 'up') { s.rect(L, y + 6, 2, 2, e); s.rect(R_, y + 6, 2, 2, e); }
  else if (eyes === 'side') { s.rect(L + 1, y + 7, 2, 2, e); s.rect(R_ + 1, y + 7, 2, 2, e); }
  else { s.rect(L, y + 7, 2, 2, e); s.rect(R_, y + 7, 2, 2, e); }
}
function girlPose(s, pose, x, y) {
  const by = y + G_BY + 5, W = GM.W, w = GM.w, sk = GM.s, pg = GM.p, sh = GM.P;
  if (pose === 'page0') { s.rect(x + 9, by - 1, 3, 1, pg); s.rect(x + 9, by, 2, 1, sh); }
  else if (pose === 'page1') { s.rect(x + 8, by - 3, 1, 3, pg); s.rect(x + 7, by - 2, 1, 2, pg); }
  else if (pose === 'page2') { s.rect(x + 5, by - 1, 3, 1, pg); s.rect(x + 6, by, 2, 1, sh); }
  else if (pose === 'pet0' || pose === 'pet1') {                      // arm reaches down and right to the cat
    const k = pose === 'pet1' ? 1 : 0;
    s.rect(x + 13, y + G_BY + 5, 3, 2, w); s.rect(x + 16, y + G_BY + 6, 3, 2, W); s.rect(x + 19, y + G_BY + 7, 2, 2, w); s.rect(x + 21 + k, y + G_BY + 8, 2, 2, sk);
  } else if (pose === 'sip') {                                        // left arm lifts the mug to her mouth
    s.rect(x + 1, y + G_BY + 3, 2, 3, W); s.rect(x + 2, y + G_BY + 1, 2, 3, w); s.rect(x + 3, y + G_BY - 1, 2, 2, sk);
  } else if (pose === 'clap0') { s.rect(x + 7, by - 3, 3, 2, sk); }
  else if (pose === 'clap1') { s.rect(x + 3, by - 3, 2, 2, sk); s.rect(x + 12, by - 3, 2, 2, sk); }
  else if (pose === 'wave0' || pose === 'wave1') {                    // raises her right arm high, toward the boy
    const k = pose === 'wave1' ? 1 : 0;
    s.rect(x, y + G_BY + 2, 2, 3, W); s.rect(x - 2, y + G_BY - 1, 2, 3, w); s.rect(x - 3, y + G_BY - 3, 2, 2, w); s.rect(x - 3 - k, y + G_BY - 6, 2, 3, sk);
  }
}
function girlSpr(pose, eyes, dy, tilt) {
  return cached(`g|${pose}|${eyes}|${dy}|${tilt}`, () => {
    const s = new Spr(33, 27); s.map(G_BODY, GM, G_OX, G_BY + 1);
    girlPose(s, pose, G_OX, 1);
    s.map(G_HEAD, GM, G_OX + tilt, 1 + dy); girlEyes(s, G_OX + tilt, 1 + dy, eyes);
    s.outline(() => P.ink); s.ax = G_OX + 8; s.ay = 25; return s;
  });
}
const MUG_SPR = (() => { const s = smap(['.mdddm.', 'hmmmmmm', 'h.bbbbm', 'hmbbbbm', '.mmmmmm', '.MMMMM.'], { m: '#f6efe4', M: '#c8b8ac', d: '#6a3a26', b: '#3e8a80', h: '#dcd0c4' }); s.outline(() => P.ink); return s; })();
