// Behaviour-timeline validator. usage: node validate.js <file.html> [seeds=60] [episodes=4]
// Checks every track of every episode covers [0, LOOP) with no gaps/overlaps/negative segments,
// then renders a free-mode sweep to catch runtime errors. Needs episodeFor/EPI/CFG/LOOP (see references/animation.md).
const { chromium } = require('playwright');
(async () => { const [,, file, seeds = '60', eps = '4'] = process.argv; const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file + '?loop=0'); await pg.waitForTimeout(600);
  const r = await pg.evaluate(([NS, NE]) => { const bad = []; let n = 0;
    for (let seed = 1; seed <= NS; seed++) { CFG.seed = seed; EPI.clear();
      for (let ep = 0; ep < NE; ep++) { const e = episodeFor(ep * LOOP + 1); n++;
        for (const [nm, tr] of Object.entries(e).filter(([k, v]) => v && v.segs)) { const s = tr.segs.slice().sort((a, b) => a.t0 - b.t0);
          if (Math.abs(s[0].t0) > 1e-6) bad.push(`${seed}/${ep}/${nm} starts ${s[0].t0}`);
          for (let k = 1; k < s.length; k++) if (Math.abs(s[k].t0 - s[k - 1].t1) > 1e-6) bad.push(`${seed}/${ep}/${nm} gap ${s[k - 1].t1.toFixed(2)}->${s[k].t0.toFixed(2)}`);
          if (Math.abs(s[s.length - 1].t1 - LOOP) > 1e-6) bad.push(`${seed}/${ep}/${nm} ends ${s[s.length - 1].t1.toFixed(2)}`);
          for (const q of s) if (q.t1 < q.t0) bad.push(`${seed}/${ep}/${nm} negative ${q.anim || q.mode}`); } } }
    for (let k = 0; k < 400; k++) renderFrame(k * 1.37);
    return { episodes: n, count: bad.length, problems: bad.slice(0, 20) }; }, [+seeds, +eps]);
  console.log(JSON.stringify(r)); if (errs.length) console.error(errs.join('\n'));
  if (r.count > 0 || errs.length) { console.error('FAIL: timeline problems or page errors'); process.exitCode = 1; }
  await b.close(); })();
