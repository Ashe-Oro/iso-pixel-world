// Loop-seam check. usage: node seam.js <file.html> [query ...]   (e.g. "seed=7" "seed=2")
// Compares the frame just before LOOP with t=0 against ordinary frame-to-frame differences,
// and confirms renderFrame(LOOP) == renderFrame(0). Needs globals renderFrame, O32, LOOP.
// If episodeFor/findSeg/segPos exist (see references/animation.md), also checks every actor's position at both ends.
const { chromium } = require('playwright');
(async () => { const [,, file, ...qs] = process.argv; const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  for (const q of (qs.length ? qs : [''])) {
    await pg.goto('file://' + file + (q ? '?' + q : '')); await pg.waitForTimeout(600);
    const r = await pg.evaluate(() => {
      const snap = t => { renderFrame(t); return new Uint32Array(O32); };
      const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
      const dt = 1 / 60, a = snap(LOOP - dt), b0 = snap(0), c = snap(LOOP);
      const typical = [10, 30, 40, 60, 70, 90, 100].map(t => diff(snap(t - dt), snap(t)));
      const out = { seamDiff: diff(a, b0), t120_equals_t0: diff(b0, c) === 0, typicalDiffs: typical };
      if (typeof episodeFor === 'function') { const e = episodeFor(0); out.statesMatch = {};
        for (const [name, tr] of Object.entries(e)) { if (!tr || !tr.segs) continue; const s0 = findSeg(tr, 0), s1 = findSeg(tr, LOOP - 1e-3);
          out.statesMatch[name] = JSON.stringify(segPos(s0, 0)) === JSON.stringify(segPos(s1, LOOP - 1e-3)); } }
      return out; });
    console.log(q || '(default)', JSON.stringify(r));
    const statesOk = !r.statesMatch || Object.values(r.statesMatch).every(Boolean);
    if (!r.t120_equals_t0 || !statesOk) { console.error('FAIL: loop seam does not match'); process.exitCode = 1; } }
  if (errs.length) { console.error(errs.join('\n')); process.exitCode = 1; }
  await b.close(); })();
