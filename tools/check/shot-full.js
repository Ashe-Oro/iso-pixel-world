// Screenshot any page at a given viewport. usage: node shot-full.js <file.html> <out.png> [w=1600] [h=1000]
const { chromium } = require('playwright');
(async () => { const [,, file, out, w = '1600', h = '1000'] = process.argv; const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: +w, height: +h } }); const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + e.stack)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + file); await pg.waitForTimeout(500); await pg.screenshot({ path: out }); if (errs.length) console.log(errs.join('\n')); await b.close(); })();
