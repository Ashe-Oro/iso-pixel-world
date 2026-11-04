/* sprite sheet viewer: renders a frame cache (window.SHEET = {name: Spr}) at zoom */
(function(){
  buildLUT();
  const sets = window.SHEETS || [];
  const Z = 5, pad = 6;
  document.getElementById('wrap').style.cssText='position:absolute;left:0;top:0;display:block'; const cv = document.getElementById('out'); cv.width = 1600; cv.height = 1000; cv.style.width='1600px'; cv.style.height='1000px';
  const g = cv.getContext('2d'); g.fillStyle = '#5a6b55'; g.fillRect(0,0,1600,1000); g.font='10px monospace';
  let x = 8, y = 14, rowH = 0;
  for (const [name, spr, flip] of sets) {
    const w = spr.w*Z, h = spr.h*Z;
    if (x + w > 1590) { x = 8; y += rowH + 18; rowH = 0; }
    g.fillStyle='#4a5a46'; g.fillRect(x, y, w, h);
    for (let r=0;r<spr.h;r++) for (let c=0;c<spr.w;c++){ const v=spr.d[r*spr.w+c]; if(!v) continue; const u=LUT[(v<<5)|(6<<2)];
      g.fillStyle='rgb('+(u&255)+','+(u>>8&255)+','+(u>>16&255)+')'; g.fillRect(x+(flip?spr.w-1-c:c)*Z, y+r*Z, Z, Z); }
    g.fillStyle='#ff0'; g.fillRect(x+spr.ax*Z+Z/2-1, y+spr.ay*Z+Z/2-1, 2, 2);
    g.fillStyle='#fff'; g.fillText(name, x, y-3);
    x += w + pad; rowH = Math.max(rowH, h);
  }
})();
