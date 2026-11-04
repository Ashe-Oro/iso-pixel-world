// Screenshot the scene. usage: node shot.js <file.html> <out.png> [query] [scale=2] [waitMs=600]
const { chromium } = require('playwright');
(async () => {
  const [,, file, out, query = '', scale = '2', wait = '600'] = process.argv;
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 640 * +scale, height: 360 * +scale } });
  const msgs = [];
  pg.on('console', m => { if (m.type() === 'error' || m.text().startsWith('[dbg]')) msgs.push(m.type() + ': ' + m.text()); });
  pg.on('pageerror', e => msgs.push('PAGEERROR: ' + e.message + '\n' + e.stack));
  await pg.goto('file://' + file + (query ? '?' + query : ''));
  await pg.waitForTimeout(+wait);
  await pg.screenshot({ path: out });
  if (msgs.length) console.log(msgs.join('\n'));
  await b.close();
})();
