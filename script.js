/* Eternal Jannati Stopwatch — fixed start, timestamp-derived elapsed time (no incremented counter). */
(function (root) {
  'use strict';
  var START_ISO = '2026-10-29T06:30:00+06:00';   // = 2026-10-29T00:30:00Z
  var START_MS = Date.parse(START_ISO);

  // Exact integer breakdown via BigInt; never negative.
  function breakdown(nowMs, startMs) {
    var n = Math.trunc(Number(nowMs)), s = Math.trunc(Number(startMs === undefined ? START_MS : startMs));
    if (!isFinite(n) || !isFinite(s)) return { d: 0n, h: 0, m: 0, s: 0 };
    var e = BigInt(n) - BigInt(s);
    if (e < 0n) e = 0n;
    return { d: e / 86400000n, h: Number(e % 86400000n / 3600000n), m: Number(e % 3600000n / 60000n), s: Number(e % 60000n / 1000n) };
  }
  var api = { START_ISO: START_ISO, START_MS: START_MS, breakdown: breakdown };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof document === 'undefined') return;

  /* ---- clock model: monotonic anchor + wall-clock offset ---- */
  var anchorServer = Date.now(), anchorPerf = performance.now(), wallOffset = 0, synced = false, srcName = '', precision = '', lastShown = 0, timer = 0, syncing = false;
  var now = function () { return anchorServer + (performance.now() - anchorPerf); };
  // performance.now() can stall during device sleep; if the wall clock is clearly ahead, re-anchor to it.
  function resume() { var wall = Date.now() + wallOffset; if (wall - now() > 1500) { anchorServer = wall; anchorPerf = performance.now(); } }

  var SOURCES = [
    { name: 'worldtimeapi.org (UTC)', url: 'https://worldtimeapi.org/api/timezone/Etc/UTC', prec: '', parse: function (r) { return r.json().then(function (j) { return Date.parse(j.utc_datetime); }); } },
    { name: 'this site’s server (HTTP Date header)', url: location.href.split('#')[0], prec: ' ±1 s', head: true,
      parse: function (r) { var d = Date.parse(r.headers.get('Date')); return Promise.resolve(d + 500); } }
  ];
  function tryFetch(src) {
    var ac = new AbortController(), to = setTimeout(function () { ac.abort(); }, 6000), p0 = performance.now();
    return fetch(src.url + (src.head ? '' : ''), { method: src.head ? 'HEAD' : 'GET', cache: 'no-store', signal: ac.signal })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return src.parse(r).then(function (t) { return { t: t, mid: (p0 + performance.now()) / 2 }; }); })
      .then(function (x) { if (!isFinite(x.t) || x.t < 1577836800000 || x.t > 4102444800000) throw new Error('invalid'); return x; })
      .finally(function () { clearTimeout(to); });
  }
  function sync() {
    if (syncing || !/^https?:$/.test(location.protocol) && SOURCES.length && false) return;
    syncing = true;
    var i = 0;
    (function next() {
      if (i >= SOURCES.length) { syncing = false; synced = false; setStatus(); return; }
      var src = SOURCES[i++];
      tryFetch(src).then(function (x) {
        anchorServer = x.t; anchorPerf = x.mid;
        wallOffset = x.t - (Date.now() - (performance.now() - x.mid));
        synced = true; srcName = src.name; precision = src.prec; syncing = false; setStatus();
      }, next);
    })();
  }
  function setStatus() {
    var si = $('si'), st = $('st');
    if (synced) { si.textContent = '✓'; st.textContent = 'Synchronized with ' + srcName + precision + '. Rechecked every 10 minutes.'; }
    else { si.textContent = '◌'; st.textContent = 'Offline estimate: using this device’s clock, not externally verified.'; }
  }

  /* ---- rendering ---- */
  function $(id) { return document.getElementById(id); }
  var els = {}, cache = {};
  function put(k, v) { if (cache[k] !== v) { cache[k] = v; els[k].textContent = v; } }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function plural(n, one, many) { return (n === 1n || n === 1) ? one : many; }
  function paint(b, t) {
    var d = b.d.toString();
    put('d', d); put('h', pad(b.h)); put('m', pad(b.m)); put('s', pad(b.s));
    put('dl', plural(b.d, 'Day', 'Days')); put('hl', plural(b.h, 'Hour', 'Hours')); put('ml', plural(b.m, 'Minute', 'Minutes')); put('sl', plural(b.s, 'Second', 'Seconds'));
    var len = d.length <= 2 ? '1' : d.length <= 3 ? '3' : d.length <= 5 ? '5' : '8';
    if (cache.len !== len) { cache.len = len; $('clock').setAttribute('data-len', len); }
    $('note').hidden = t >= START_MS;
    var sr = d + ' ' + cache.dl + ', ' + b.h + ' ' + cache.hl + ', ' + b.m + ' ' + cache.ml + ', ' + b.s + ' ' + cache.sl;
    if (cache.sr !== sr) { cache.sr = sr; $('sr').textContent = sr; }
  }
  function tick() {
    clearTimeout(timer); resume();
    var t = Math.max(lastShown, Math.floor(now())); lastShown = t;   // never run backwards after a correction
    paint(breakdown(t), t);
    if (!document.hidden) timer = setTimeout(tick, 1000 - (t % 1000) + 5); // aligned to next second boundary
  }

  function init() {
    ['d', 'h', 'm', 's', 'dl', 'hl', 'ml', 'sl'].forEach(function (k) { els[k] = $(k); });
    var box = $('motes'), f = document.createDocumentFragment();
    for (var i = 0; i < 14; i++) { var p = document.createElement('span'); p.style.cssText = '--x:' + (Math.random() * 100).toFixed(1) + '%;--z:' + (3 + Math.random() * 5).toFixed(1) + 'px;--t:' + (14 + Math.random() * 14).toFixed(1) + 's;--dl:-' + (Math.random() * 20).toFixed(1) + 's;--dx:' + ((Math.random() - .5) * 8).toFixed(1) + 'vw'; f.appendChild(p); }
    for (var j = 0; j < 8; j++) { var q = document.createElement('span'); q.className = 'petal'; q.style.cssText = '--x:' + (Math.random() * 100).toFixed(1) + '%;--z:' + (7 + Math.random() * 6).toFixed(1) + 'px;--t:' + (22 + Math.random() * 16).toFixed(1) + 's;--dl:-' + (Math.random() * 30).toFixed(1) + 's;--dx:' + ((Math.random() - .5) * 14).toFixed(1) + 'vw'; f.appendChild(q); }
    box.appendChild(f);
    var img = $('full'), fr = $('frame'), RAW = 'https://raw.githubusercontent.com/AlphaStopwatch/Something-About-This-Hur/main/Golden%20Veil%20by%20the%20Garden%20Waters.png', tried = false;
    img.addEventListener('error', function () { if (!tried) { tried = true; img.src = RAW; } else { img.hidden = true; $('miss').hidden = false; } });
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { fr.classList.add('in'); io.disconnect(); } }, { threshold: .25 }); io.observe(fr); } else fr.classList.add('in');
    setStatus(); tick(); sync();
    setInterval(sync, 600000);
    document.addEventListener('visibilitychange', function () { document.body.classList.toggle('paused', document.hidden); if (!document.hidden) { tick(); sync(); } });
    window.addEventListener('pageshow', tick); window.addEventListener('focus', tick);
    window.addEventListener('online', sync);
    window.addEventListener('offline', function () { synced = false; setStatus(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
