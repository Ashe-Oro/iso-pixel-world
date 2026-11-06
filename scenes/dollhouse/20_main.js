/* =====================================================================
   Boot, timing (real-time / fixed-step / loop), debug panel, keyboard.
   URL params: ?seed=N &loop=0|1 &debug=1 &speed=X &t=sec &fixed=1 &int=1
   ===================================================================== */
const STATE = { simT: CFG.t0, last: null, fpsT: 0, fpsN: 0, fps: 0, ms: 0, fixed: new URLSearchParams(location.search).get('fixed') === '1' };

function buildWorld() {
  buildSky(); buildHills(); buildClouds();
  buildIsland(); buildShell(); buildItems(); buildLiving(); buildKitchen(); buildUpstairs(); buildExterior();
  outlinePass(); finishSky(); bakeLights(); prepSkyLists(); prepPanes();
}
function reseed(seed) {
  CFG.seed = seed | 0 || 1;
  scheduleLightning();
  if (typeof buildSchedule === 'function') buildSchedule();
}
function fit() {
  const v = document.getElementById('out'), w = document.getElementById('wrap'), cs = getComputedStyle(w);
  const W = w.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), H = w.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let s = Math.max(0.05, Math.min(W / 1920, H / 1080));
  if (CFG.intScale && s >= 1) s = Math.floor(s);
  v.style.width = Math.floor(1920 * s) + 'px'; v.style.height = Math.floor(1080 * s) + 'px';
}
function curT() { return CFG.loop ? ((STATE.simT % LOOP) + LOOP) % LOOP : STATE.simT; }

function tick(now) {
  if (STATE.last === null) STATE.last = now;
  let dt = (now - STATE.last) / 1000; STATE.last = now; if (dt > 0.25) dt = 0.25;
  if (!CFG.paused) STATE.simT += (STATE.fixed ? 1 / 60 : dt) * CFG.speed;
  const a = performance.now();
  renderFrame(curT());
  const ms = performance.now() - a;
  STATE.ms = STATE.ms * 0.9 + ms * 0.1; STATE.fpsN++; STATE.fpsT += dt;
  if (STATE.fpsT >= 0.5) { STATE.fps = STATE.fpsN / STATE.fpsT; STATE.fpsN = 0; STATE.fpsT = 0; if (CFG.debug) updateStats(); }
  requestAnimationFrame(tick);
}
/* frame-accurate capture hook: render a given time (seconds) synchronously */
window.renderAt = t => { CFG.paused = true; STATE.simT = t; renderFrame(curT()); return true; };
window.DOLLHOUSE = { CFG, FX, LOOP, renderAt: window.renderAt, reseed };

/* ---------------- debug panel ---------------- */
function buildDebug() {
  const el = document.getElementById('dbg');
  const fx = Object.keys(FX).map(k => `<label><input type="checkbox" data-fx="${k}" ${FX[k] ? 'checked' : ''}>${k}</label>`).join('');
  el.innerHTML = `<h3>DOLLHOUSE · CONTROLS</h3>
  <div class="row stat" id="dstat">…</div>
  <div class="row">speed <b id="dspv">${CFG.speed.toFixed(2)}</b>×<input type="range" id="dsp" min="0" max="8" step="0.05" value="${CFG.speed}"></div>
  <div class="row">time <b id="dtv">0</b>s<input type="range" id="dt" min="0" max="${LOOP}" step="0.05" value="0"></div>
  <div class="row"><button id="dpause">pause</button><button id="dloop"></button><button id="dstep">+1/60</button></div>
  <div class="row">seed <input id="dseed" type="text" inputmode="numeric" value="${CFG.seed}" style="width:70px"> <button id="dseedb">apply</button><button id="drand">random</button></div>
  <div class="row"><button id="dall">all on</button><button id="dnone">all off</button></div>
  <div class="grid">${fx}</div>
  <div class="row keys">Keys: D controls · L loop · space pause · ←/→ scrub · [ ] speed</div>`;
  const $ = id => document.getElementById(id);
  $('dsp').oninput = e => { CFG.speed = +e.target.value; $('dspv').textContent = CFG.speed.toFixed(2); };
  $('dt').oninput = e => { STATE.simT = +e.target.value; };
  $('dpause').onclick = () => { CFG.paused = !CFG.paused; syncDebug(); };
  $('dloop').onclick = () => { CFG.loop = !CFG.loop; syncDebug(); };
  $('dstep').onclick = () => { CFG.paused = true; STATE.simT += 1 / 60; syncDebug(); };
  $('dseedb').onclick = () => reseed(parseInt($('dseed').value, 10));
  $('drand').onclick = () => { const s = 1 + Math.floor(Math.random() * 99999); $('dseed').value = s; reseed(s); };
  $('dall').onclick = () => { for (const k in FX) FX[k] = 1; syncDebug(); };
  $('dnone').onclick = () => { for (const k in FX) FX[k] = 0; FX.characters = 1; FX.lighting = 1; FX.dither = 1; syncDebug(); };
  el.querySelectorAll('[data-fx]').forEach(cb => cb.onchange = e => { FX[e.target.dataset.fx] = e.target.checked ? 1 : 0; });
  syncDebug();
}
function syncDebug() {
  const el = document.getElementById('dbg'); el.hidden = !CFG.debug;
  const b = document.getElementById('bCtl'); if (b) b.textContent = CFG.debug ? 'Hide controls' : 'Controls';
  if (!CFG.debug) return;
  document.getElementById('dpause').textContent = CFG.paused ? 'play' : 'pause';
  document.getElementById('dloop').textContent = CFG.loop ? 'loop: 120s' : 'loop: off';
  el.querySelectorAll('[data-fx]').forEach(cb => { cb.checked = !!FX[cb.dataset.fx]; });
  updateStats();
}
function updateStats() {
  const t = curT(), s = document.getElementById('dstat'); if (!s) return;
  s.innerHTML = `fps ${STATE.fps.toFixed(0)} · frame ${STATE.ms.toFixed(2)}ms<br>t ${t.toFixed(2)}s · ${CFG.loop ? 'loop' : 'free'} · seed ${CFG.seed}<br>palette ${PAL.length} · ${typeof scheduleInfo === 'function' ? scheduleInfo(t) : ''}`;
  const dt = document.getElementById('dt'); if (dt && document.activeElement !== dt) { dt.max = CFG.loop ? LOOP : Math.max(LOOP, Math.ceil(STATE.simT / LOOP) * LOOP); dt.value = CFG.loop ? t : STATE.simT; document.getElementById('dtv').textContent = t.toFixed(1); }
}
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'range') return;
  if (e.key === 'd' || e.key === 'D') { CFG.debug = !CFG.debug; syncDebug(); }
  else if (e.key === 'l' || e.key === 'L') { CFG.loop = !CFG.loop; syncDebug(); }
  else if (e.key === ' ') { CFG.paused = !CFG.paused; syncDebug(); e.preventDefault(); }
  else if (e.key === 'ArrowRight') STATE.simT += CFG.paused ? 1 / 60 : 1;
  else if (e.key === 'ArrowLeft') STATE.simT -= CFG.paused ? 1 / 60 : 1;
  else if (e.key === ']') { CFG.speed = Math.min(8, CFG.speed * 1.5); syncDebug(); }
  else if (e.key === '[') { CFG.speed = Math.max(0.05, CFG.speed / 1.5); syncDebug(); }
});
addEventListener('resize', fit);
if (window.ResizeObserver) new ResizeObserver(fit).observe(document.getElementById('wrap'));

/* ---------------- viewer overlay: Controls + Fullscreen, fade out when idle ---------------- */
function setupOverlay() {
  const bar = document.getElementById('bar'), bFull = document.getElementById('bFull'), bCtl = document.getElementById('bCtl');
  let idleTimer = 0;
  const wake = () => { bar.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!bar.matches(':hover') && !bar.contains(document.activeElement)) bar.classList.add('idle'); }, 3200); };
  ['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, wake, { passive: true }));
  bar.addEventListener('focusin', wake);
  wake();
  bCtl.onclick = () => { CFG.debug = !CFG.debug; syncDebug(); };
  const fsOK = document.fullscreenEnabled && document.documentElement.requestFullscreen;
  if (!fsOK) bFull.hidden = true;
  const syncFs = () => { bFull.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen'; };
  bFull.onclick = () => {
    try {
      const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(() => { bFull.hidden = true; });
    } catch (e) { bFull.hidden = true; }
  };
  document.addEventListener('fullscreenchange', () => { syncFs(); fit(); });
  /* keep the screen awake while the scene plays (ignored where not allowed) */
  let lock = null;
  const askWake = () => { if (!navigator.wakeLock || document.visibilityState !== 'visible' || lock || document.documentElement.classList.contains('embed')) return;
    navigator.wakeLock.request('screen').then(l => { lock = l; l.addEventListener('release', () => { lock = null; }); }).catch(() => {}); };
  document.addEventListener('visibilitychange', askWake); addEventListener('pointerdown', askWake, { passive: true }); askWake();
}

(function boot() {
  const t0 = performance.now();
  buildWorld();
  if (typeof initProps === 'function') initProps();
  if (typeof initCharacters === 'function') initCharacters();
  reseed(CFG.seed);
  buildLUT(); initOutput(); fit(); buildDebug();
  console.log('[dbg] world built in', Math.round(performance.now() - t0), 'ms; palette', PAL.length);
  setupOverlay();
  requestAnimationFrame(tick);
})();
