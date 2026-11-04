// Nearest-neighbour zoom of a region of the internal 640x360 frame.
// usage: node zoom.js <file.html> <out.png> <x> <y> <w> <h> [scale=4] [query] [waitMs=600]
// Use ?t=<seconds> in the query to start at a moment (the boot code should honour ?t=).
const { chromium } = require('playwright');
(async () => {
  const [,, file, out, x, y, w, h, sc = '4', query = '', wait = '600'] = process.argv;
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 640, height: 360 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + file + (query ? '?' + query : '')); await pg.waitForTimeout(+wait);
  const data = await pg.evaluate(([x, y, w, h, sc]) => {
    const src = document.getElementById('out'); const c = document.createElement('canvas'); c.width = w * sc; c.height = h * sc;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const k = src.width / 640; g.drawImage(src, x * k, y * k, w * k, h * k, 0, 0, w * sc, h * sc); return c.toDataURL();
  }, [+x, +y, +w, +h, +sc]);
  require('fs').writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  if (errs.length) console.log(errs.join('\n')); await b.close();
})();
