// Direction-of-motion check for falling/rising effects (catches sign errors like rain scrolling upward).
// usage: node motiondir.js <file.html> "<js expr -> array of palette indices>" [x0 y0 x1 y1]
//   e.g. node motiondir.js scene.html "[P.rain1, P.rain2]" 120 100 300 200
// For each screen column in the region, compares the top-most matching pixel row between frames
// t and t+1/60 at several times; reports how many columns moved down vs up. Needs FR, renderFrame.
const { chromium } = require('playwright');
(async () => { const [,, file, expr, x0 = '0', y0 = '0', x1 = '640', y1 = '360'] = process.argv; const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file); await pg.waitForTimeout(600);
  const r = await pg.evaluate(([expr, x0, y0, x1, y1]) => { const set = new Set(eval(expr));
    const tops = t => { renderFrame(t); const m = new Map(); for (let i = x0; i < x1; i++) for (let j = y0; j < y1; j++) if (set.has(FR.idx[j * IW + i])) { m.set(i, j); break; } return m; };
    let down = 0, up = 0, same = 0;
    for (const t0 of [5, 33.3, 71.7]) { const a = tops(t0), b = tops(t0 + 1 / 60); for (const [i, ja] of a) { const jb = b.get(i); if (jb === undefined) continue; const d = jb - ja; if (Math.abs(d) > 3) continue; d > 0 ? down++ : d < 0 ? up++ : same++; } }
    return { movingDown: down, movingUp: up, unchanged: same }; }, [expr, +x0, +y0, +x1, +y1]);
  console.log(JSON.stringify(r)); if (errs.length) console.log(errs.join('\n')); await b.close(); })();
