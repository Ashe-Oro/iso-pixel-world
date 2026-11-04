// Frame-time + memory-growth check. usage: node perf.js <file.html>
// Needs a global renderFrame(t). Reports median/p95/max ms over 240 frames and heap before/after 3000 frames.
const { chromium } = require('playwright');
(async () => { const file = process.argv[2]; const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + e.stack));
  await pg.goto('file://' + file); await pg.waitForTimeout(800);
  const r = await pg.evaluate(() => { const ts = []; for (let k = 0; k < 240; k++) { const a = performance.now(); renderFrame((k * 0.5) % 120); ts.push(performance.now() - a); }
    ts.sort((a, b) => a - b); return { median: +ts[120].toFixed(2), p95: +ts[228].toFixed(2), max: +ts[239].toFixed(2) }; });
  const h1 = await pg.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
  await pg.evaluate(() => { for (let k = 0; k < 3000; k++) renderFrame(k / 60 % 120); });
  const h2 = await pg.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
  console.log(JSON.stringify(r), 'heap MB', (h1 / 1e6).toFixed(1), '->', (h2 / 1e6).toFixed(1)); if (errs.length) console.log(errs.join('\n')); await b.close(); })();
