// Capture each world's poster from the scene itself, so the home page always shows the real art.
// usage: node tools/posters.js [slug ...]     (no arguments = every world listed on the home page)
// The list and the moment to capture come from public/index.html: <a data-world="slug" data-t="seconds">.
// Run tools/build.sh first. Writes public/posters/<slug>.png at the scenes' native 640x360.
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
(async () => {
  const pub = path.join(__dirname, '..', 'public'), home = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
  const worlds = [...home.matchAll(/data-world="([^"]+)"\s+data-t="([\d.]+)"/g)].map(m => ({ slug: m[1], t: +m[2] }));
  const only = process.argv.slice(2), list = only.length ? worlds.filter(w => only.includes(w.slug)) : worlds;
  if (!list.length) throw new Error('no worlds to capture');
  fs.mkdirSync(path.join(pub, 'posters'), { recursive: true });
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 640, height: 360 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  for (const { slug, t } of list) {
    await pg.goto('file://' + path.join(pub, slug, 'index.html') + '?t=' + t); await pg.waitForTimeout(600);
    const url = await pg.evaluate(t => { window.renderAt(t); return OUTC.toDataURL('image/png'); }, t);
    const out = path.join(pub, 'posters', slug + '.png'), png = Buffer.from(url.split(',')[1], 'base64');
    fs.writeFileSync(out, png); console.log(`${slug} at t=${t}: ${(png.length / 1024).toFixed(0)} KB`);
  }
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exitCode = 1; }
})();
