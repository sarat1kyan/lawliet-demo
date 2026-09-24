/* Lawliet site. Header state, mobile menu, the demo form, and an additive
   motion layer (ambient canvas, scroll reveals, counters, marquee, cursor).
   No dependencies. Everything degrades to a complete, static page. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };

  /* ---- Preloader: hold the first frame until the page is ready ------- */
  var preload = doc.getElementById('preload');
  var preloadDone = false;
  function hidePreload() {
    if (preloadDone || !preload) { return; }
    preloadDone = true;
    preload.classList.add('done');
    setTimeout(function () { if (preload && preload.parentNode) { preload.parentNode.removeChild(preload); } root.classList.add('ready'); }, 520);
  }
  function readyThenHide() {
    var go = function () { requestAnimationFrame(function () { requestAnimationFrame(hidePreload); }); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
    var fontsReady = doc.fonts && doc.fonts.ready ? doc.fonts.ready.catch(function () {}) : Promise.resolve();
    fontsReady.then(go);
  }
  if (doc.readyState === 'complete') { readyThenHide(); }
  else { window.addEventListener('load', readyThenHide); }
  setTimeout(hidePreload, 4500); // hard fallback

  /* ---- Header state -------------------------------------------------- */
  var head = $('.site-head');
  var onScroll = function () { if (head) head.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu -------------------------------------------------- */
  var btn = $('#menuBtn');
  if (btn && head) {
    btn.addEventListener('click', function () {
      var open = head.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
    $$('#nav a').forEach(function (a) {
      a.addEventListener('click', function () { head.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.textContent = 'Menu'; });
    });
  }

  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---- Demo form (Netlify) ----------------------------------------- */
  (function () {
    var form = $('#demoForm');
    if (!form) return;
    var sent = $('#formSent'), err = $('#formError'), submit = $('#formBtn');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (err) err.hidden = true;
      submit.disabled = true; submit.textContent = 'Sending...';
      var payload = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: payload })
        .then(function (res) { if (!res.ok) throw new Error('status ' + res.status); form.hidden = true; sent.hidden = false; sent.focus(); })
        .catch(function () { submit.disabled = false; submit.textContent = 'Request a demo'; if (err) { err.textContent = 'That did not send. Try again, or write to info@justlawliet.net.'; err.hidden = false; } });
    });
  })();

  /* ---- Platform outcomes: dot controls for the mobile carousel ------ */
  (function () {
    var wrap = $('#platform .outcomes');
    if (!wrap) { return; }
    var cards = $$('.outcome', wrap);
    if (cards.length < 2) { return; }
    var dots = doc.createElement('div'); dots.className = 'outcomes-dots';
    cards.forEach(function (c, i) {
      var btn = doc.createElement('button'); btn.type = 'button'; btn.setAttribute('aria-label', 'Outcome ' + (i + 1));
      if (i === 0) { btn.className = 'on'; }
      btn.addEventListener('click', function () { c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); });
      dots.appendChild(btn);
    });
    wrap.parentNode.insertBefore(dots, wrap.nextSibling);
    var dotEls = $$('button', dots);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (e.isIntersecting) { var i = cards.indexOf(e.target); dotEls.forEach(function (d, di) { d.classList.toggle('on', di === i); }); }
        });
      }, { root: wrap, threshold: 0.6 });
      cards.forEach(function (c) { io.observe(c); });
    }
  })();

  if (reduce) { return; } // static page below this line

  /* ---- Atmosphere layers (injected, so every page shares them) ------ */
  function el(tag, cls) { var n = doc.createElement(tag); if (cls) n.className = cls; return n; }
  var canvas = el('canvas'); canvas.id = 'bg-canvas'; canvas.setAttribute('aria-hidden', 'true');
  body.insertBefore(canvas, body.firstChild);
  body.insertBefore(Object.assign(el('div', 'bg-wash'), { ariaHidden: 'true' }), body.firstChild);
  body.insertBefore(Object.assign(el('div', 'bg-grain'), { ariaHidden: 'true' }), body.firstChild);
  var progress = el('div', 'scroll-progress'); progress.setAttribute('aria-hidden', 'true'); body.appendChild(progress);

  // Aurora + a light that tracks the pointer
  var aurora = el('div', 'aurora'); aurora.setAttribute('aria-hidden', 'true');
  aurora.innerHTML = '<i class="a1"></i><i class="a2"></i><i class="a3"></i><i class="a4"></i>';
  body.insertBefore(aurora, body.firstChild);
  var pageSpot = el('div', 'page-spot'); pageSpot.setAttribute('aria-hidden', 'true'); body.appendChild(pageSpot);
  window.addEventListener('mousemove', function (e) { pageSpot.style.setProperty('--px', e.clientX + 'px'); pageSpot.style.setProperty('--py', e.clientY + 'px'); }, { passive: true });

  // Hero HUD becomes a deck that cycles through several live-looking modules
  (function () {
    var first = $('.evidence'); if (!first) return;
    var stage = first.parentNode;
    var deck = el('div', 'deck'); deck.style.zIndex = '3';
    stage.insertBefore(deck, first); deck.appendChild(first); first.classList.add('active');

    var panels = [
      // Network topology
      '<div class="ev-head"><div><b>Network topology</b><small>142 devices, 3 unmanaged</small></div><span class="example">Example</span></div>'
      + '<div class="topo"><svg viewBox="0 0 464 188" aria-hidden="true">'
      + '<line class="lnk" x1="232" y1="96" x2="120" y2="48"/><line class="lnk" x1="232" y1="96" x2="344" y2="48"/>'
      + '<line class="lnk" x1="120" y1="48" x2="60" y2="120"/><line class="lnk" x1="120" y1="48" x2="96" y2="150"/>'
      + '<line class="lnk" x1="344" y1="48" x2="404" y2="70"/><line class="lnk" x1="344" y1="48" x2="392" y2="126"/>'
      + '<line class="lnk" x1="232" y1="96" x2="300" y2="150"/><line class="lnk" x1="232" y1="96" x2="176" y2="150"/>'
      + '<line class="lnk" x1="232" y1="96" x2="256" y2="150"/>'
      + '<circle class="nd core" cx="232" cy="96" r="8"/><circle class="nd ok" cx="120" cy="48" r="6"/><circle class="nd ok" cx="344" cy="48" r="6"/>'
      + '<circle class="nd ok" cx="60" cy="120" r="5"/><circle class="nd ok" cx="96" cy="150" r="5"/><circle class="nd ok" cx="404" cy="70" r="5"/>'
      + '<circle class="nd crit" cx="392" cy="126" r="6"/><circle class="nd warn" cx="300" cy="150" r="5"/><circle class="nd ok" cx="176" cy="150" r="5"/><circle class="nd ok" cx="256" cy="150" r="5"/>'
      + '<text x="232" y="82" text-anchor="middle">core-sw</text><text x="344" y="40" text-anchor="middle">fw-01</text><text x="392" y="146" text-anchor="middle">iot?</text>'
      + '</svg></div>'
      + '<div class="topo-legend"><span><i style="background:#38e0ff"></i>Core</span><span><i style="background:var(--ok)"></i>Managed</span><span><i style="background:var(--warn)"></i>Attention</span><span><i style="background:var(--fail)"></i>Unmanaged</span></div>'
      + '<div class="ev-foot"><span>Zone DMZ / Internal</span><code>12 discovery techniques</code></div>',

      // Digital forensics
      '<div class="ev-head"><div><b>Forensic case CASE-0231</b><small>Chain of custody, 6 items</small></div><span class="example">Example</span></div>'
      + '<div class="ex-note">Acquired from <b>db-prod-01</b> at 02:14 UTC, sealed on collection</div>'
      + '<ul class="ev-rows">'
      + '<li><span class="id">YARA</span><span class="what"><b>APT_webshell match</b><small>/var/www/upload/x.php</small></span><span class="tag fail">Hit</span></li>'
      + '<li><span class="id">ENTROPY</span><span class="what"><b>Packed binary suspected</b><small>/tmp/.k  7.98 / 8.00</small></span><span class="tag na">Review</span></li>'
      + '<li><span class="id">STRINGS</span><span class="what"><b>base64 payload decoded</b><small>runs /bin/sh -i</small></span><span class="tag fail">Flag</span></li>'
      + '<li><span class="id">IOC</span><span class="what"><b>3 indicators extracted</b><small>2 IPv4, 1 SHA-256</small></span><span class="tag info">Tagged</span></li>'
      + '</ul><div class="ev-foot"><span>Custody sealed</span><code>sha256 7b91f0...e4</code></div>',

      // SIEM
      '<div class="ev-head"><div><b>SIEM, live</b><small>syslog, CEF, LEEF and JSON</small></div><span class="example">Example</span></div>'
      + '<div class="spark">' + Array.apply(null, Array(26)).map(function (_, i) { var hs = [30,44,22,60,38,72,48,90,54,40,66,34,80,50,62,46,88,42,58,70,36,64,52,76,44,60]; return '<i style="height:' + hs[i] + '%"></i>'; }).join('') + '</div>'
      + '<ul class="ev-rows">'
      + '<li><span class="id">14:02</span><span class="what"><b>Impossible travel</b><small>jokafor: US then SG in 6m</small></span><span class="tag fail">Critical</span></li>'
      + '<li><span class="id">14:01</span><span class="what"><b>SSH brute force</b><small>bastion-02  240 fails / 1m</small></span><span class="tag na">High</span></li>'
      + '<li><span class="id">13:59</span><span class="what"><b>New admin role granted</b><small>svc-deploy by root</small></span><span class="tag info">Info</span></li>'
      + '</ul><div class="ev-foot"><span>Forwarding to Splunk HEC</span><code>37 rules active</code></div>',

      // FIM
      '<div class="ev-head"><div><b>File integrity</b><small>hash-chained, 128 events / 24h</small></div><span class="example">Example</span></div>'
      + '<div class="ex-note">Watching <b>/etc</b>, <b>/usr/bin</b> and <b>/etc/ssh</b> on 38 hosts</div>'
      + '<ul class="ev-rows">'
      + '<li><span class="id">MOD</span><span class="what"><b>/etc/ssh/sshd_config</b><small>db-prod-01  PermitRootLogin added</small></span><span class="tag fail">Change</span></li>'
      + '<li><span class="id">REPL</span><span class="what"><b>/usr/bin/curl replaced</b><small>web-02  hash mismatch</small></span><span class="tag fail">Alert</span></li>'
      + '<li><span class="id">ADD</span><span class="what"><b>/etc/cron.d/.hidden</b><small>app-07  new file</small></span><span class="tag na">Review</span></li>'
      + '<li><span class="id">LINK</span><span class="what"><b>Mapped to control 5.2.10</b><small>compliance posture updated</small></span><span class="tag info">Mapped</span></li>'
      + '</ul><div class="ev-foot"><span>Chain verified</span><code>prev 4f1c9e07</code></div>'
    ];
    panels[0] = buildTopo();
    panels.forEach(function (html) { var d = el('div', 'evidence'); d.innerHTML = html; deck.appendChild(d); });

    var cards = $$('.evidence', deck);
    cards.forEach(function (c) { var s = el('span', 'scanline'); s.setAttribute('aria-hidden', 'true'); c.appendChild(s); });

    var titles = ['Compliance scan', 'Network topology', 'Digital forensics', 'SIEM', 'File integrity'];
    var dots = el('div', 'deck-dots');
    cards.forEach(function (_, i) { var btn = el('button'); btn.type = 'button'; btn.setAttribute('aria-label', titles[i]); if (i === 0) btn.className = 'on'; btn.addEventListener('click', function () { go(i, true); }); dots.appendChild(btn); });
    deck.appendChild(dots);
    var cap = el('div', 'deck-cap'); cap.innerHTML = '<b>' + titles[0] + '</b>  1 / ' + cards.length; deck.appendChild(cap);
    var dotEls = $$('button', dots);

    var idx = 0, timer = 0;
    function go(n, manual) {
      idx = (n + cards.length) % cards.length;
      cards.forEach(function (c, i) { c.classList.toggle('active', i === idx); });
      dotEls.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
      cap.innerHTML = '<b>' + titles[idx] + '</b>  ' + (idx + 1) + ' / ' + cards.length;
      if (manual) rearm();
    }

    function buildTopo() {
      var n = {
        core:   { x: 232, y: 104, t: 'core', l: 'core-sw' },
        router: { x: 104, y: 60,  t: 'ok',   l: 'router' },
        fw:     { x: 360, y: 54,  t: 'ok',   l: 'fw-01' },
        sw:     { x: 150, y: 152, t: 'ok' },
        srv:    { x: 300, y: 150, t: 'ok' },
        nas:    { x: 232, y: 178, t: 'ok' },
        laptop: { x: 60,  y: 120, t: 'ok' },
        printer:{ x: 412, y: 122, t: 'warn' },
        ap:     { x: 414, y: 62,  t: 'ok' },
        iot:    { x: 402, y: 162, t: 'crit', l: 'iot?' }
      };
      var edges = [['core','router'],['core','fw'],['core','sw'],['core','srv'],['core','nas'],['router','laptop'],['fw','ap'],['fw','printer'],['fw','iot'],['sw','nas']];
      var pulses = [['router','core'],['fw','core'],['srv','core']];
      function curve(a, b, amt) {
        var A = n[a], B = n[b]; var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        var dx = B.x - A.x, dy = B.y - A.y; var len = Math.sqrt(dx * dx + dy * dy) || 1;
        return 'M' + A.x + ' ' + A.y + ' Q' + (mx - dy / len * amt).toFixed(1) + ' ' + (my + dx / len * amt).toFixed(1) + ' ' + B.x + ' ' + B.y;
      }
      var s = '<svg viewBox="0 0 464 210" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true">';
      edges.forEach(function (e) { s += '<path class="lnk" d="' + curve(e[0], e[1], 12) + '"/>'; });
      pulses.forEach(function (e, i) { s += '<path id="tp' + i + '" d="' + curve(e[0], e[1], 12) + '" fill="none" stroke="none"/>'; });
      s += '<circle class="ring" cx="232" cy="104" r="16"><animateTransform attributeName="transform" type="rotate" from="0 232 104" to="360 232 104" dur="9s" repeatCount="indefinite"/></circle>';
      Object.keys(n).forEach(function (k) {
        var nd = n[k], big = k === 'core', r = big ? 7 : 5;
        s += '<circle class="halo ' + nd.t + '" cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r + 7) + '"/>';
        s += '<circle class="nd ' + nd.t + '" cx="' + nd.x + '" cy="' + nd.y + '" r="' + r + '"/>';
        if (nd.l) { var ly = nd.y > 108 ? nd.y + 16 : nd.y - 11; s += '<text x="' + nd.x + '" y="' + ly + '" text-anchor="middle">' + nd.l + '</text>'; }
      });
      pulses.forEach(function (e, i) { s += '<circle class="pulse" r="2.4"><animateMotion dur="' + (2.2 + i * 0.5) + 's" begin="' + (i * 0.7) + 's" repeatCount="indefinite"><mpath xlink:href="#tp' + i + '" href="#tp' + i + '"/></animateMotion></circle>'; });
      s += '</svg>';
      return '<div class="ev-head"><div><b>Network topology</b><small>142 devices, 3 unmanaged</small></div><span class="example">Example</span></div>'
        + '<div class="topo">' + s + '</div>'
        + '<div class="topo-legend"><span><i style="background:#38e0ff"></i>Core</span><span><i style="background:#3ddc84"></i>Managed</span><span><i style="background:var(--warn)"></i>Attention</span><span><i style="background:var(--fail)"></i>Unmanaged</span></div>'
        + '<div class="ev-foot"><span>Zone DMZ / Internal</span><code>12 discovery techniques</code></div>';
    }
    function next() { go(idx + 1); }
    function rearm() { clearInterval(timer); timer = setInterval(next, 5200); }
    if (!reduce) rearm();
    stage.addEventListener('mouseenter', function () { clearInterval(timer); });
    stage.addEventListener('mouseleave', function () { if (!reduce) rearm(); });
  })();

  window.addEventListener('scroll', function () {
    var h = root.scrollHeight - root.clientHeight;
    progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });

  // Cursor-tracking glow border on the key cards
  $$('.outcome, .edition, .control, .evidence, .form').forEach(function (card) {
    card.classList.add('glow-card');
    var g = el('span', 'cardglow'); g.setAttribute('aria-hidden', 'true'); card.appendChild(g);
    var raf = 0;
    card.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  });

  /* ---- Custom cursor + magnetic buttons ---------------------------- */
  if (!touch) {
    var dot = el('div', 'cur-dot'), ring = el('div', 'cur-ring');
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    body.appendChild(dot); body.appendChild(ring);
    var mx = innerWidth / 2, my = innerHeight / 2, rxp = mx, ryp = my;
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; });
    (function ringLoop() { rxp += (mx - rxp) * 0.2; ryp += (my - ryp) * 0.2; ring.style.transform = 'translate(' + rxp + 'px,' + ryp + 'px)'; requestAnimationFrame(ringLoop); })();
    $$('a, button, summary, input, select, textarea').forEach(function (n) {
      n.addEventListener('mouseenter', function () { ring.classList.add('hot'); });
      n.addEventListener('mouseleave', function () { ring.classList.remove('hot'); });
    });
    $$('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.16 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.28 + 'px)'; });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---- Background node field --------------------------------------- */
  (function () {
    var ctx = canvas.getContext('2d');
    var w, h, dpr, nodes = [], count, mouse = { x: -999, y: -999 }, shift = 0;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      count = Math.max(30, Math.min(84, Math.round(w * h / 21000))); nodes = [];
      for (var i = 0; i < count; i++) nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.24, vy: (Math.random() - 0.5) * 0.24, r: Math.random() * 1.5 + 0.6 });
    }
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', function () { mouse.x = -999; mouse.y = -999; });
    window.addEventListener('scroll', function () { shift = window.scrollY * 0.02; }, { passive: true });
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i]; n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1; if (n.y < 0 || n.y > h) n.vy *= -1;
        var ddx = n.x - mouse.x, ddy = n.y - (mouse.y + shift), md = Math.sqrt(ddx * ddx + ddy * ddy);
        if (md < 150) { n.x += ddx / md * 0.7; n.y += ddy / md * 0.7; }
        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j], dx = n.x - m.x, dy = n.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 138) { ctx.strokeStyle = 'rgba(80,150,255,' + (0.24 * (1 - d / 138)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke(); }
        }
        ctx.fillStyle = 'rgba(130,175,255,0.72)'; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    size(); window.addEventListener('resize', size); frame();
  })();

  /* ---- Hero 3D host-globe ------------------------------------------ */
  (function () {
    var stage = $('.stage');
    if (!stage || window.matchMedia('(max-width: 640px)').matches) return;
    var gc = el('canvas', 'globe'); gc.setAttribute('aria-hidden', 'true');
    stage.insertBefore(gc, stage.firstChild);
    var ctx = gc.getContext('2d');
    var w, h, dpr, cx, cy, R;
    var N = 168, pts = [], links = [];
    // Fibonacci sphere
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963229728653;
      pts.push({ x: Math.cos(th) * rr, y: y, z: Math.sin(th) * rr, p: Math.random() * 6.28 });
    }
    // near-neighbour links, precomputed on the unit sphere
    for (var a = 0; a < N; a++) for (var bb = a + 1; bb < N; bb++) {
      var dx = pts[a].x - pts[bb].x, dy = pts[a].y - pts[bb].y, dz = pts[a].z - pts[bb].z;
      if (dx * dx + dy * dy + dz * dz < 0.14) links.push([a, bb]);
    }
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = gc.clientWidth; h = gc.clientHeight; gc.width = w * dpr; gc.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); cx = w / 2; cy = h / 2; R = Math.min(w, h) * 0.42;
    }
    var rotY = 0, rotX = -0.35, tX = -0.35, tY = 0;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      tY = ((e.clientX - r.left) / r.width - 0.5) * 0.9;
      tX = -0.35 + ((e.clientY - r.top) / r.height - 0.5) * 0.6;
    });
    stage.addEventListener('pointerleave', function () { tX = -0.35; tY = 0; });
    var t = 0;
    function proj(p) {
      var cosY = Math.cos(rotY), sinY = Math.sin(rotY), cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      var x1 = p.x * cosY - p.z * sinY, z1 = p.x * sinY + p.z * cosY;
      var y1 = p.y * cosX - z1 * sinX, z2 = p.y * sinX + z1 * cosX;
      var per = 2.6 / (2.6 + z2); // perspective
      return { sx: cx + x1 * R * per, sy: cy + y1 * R * per, z: z2, per: per };
    }
    function frame() {
      rotY += 0.0018 + tY * 0.004;   // steady auto-spin, nudged by pointer x
      rotX += (tX - rotX) * 0.04;    // ease tilt toward pointer y
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      var P = new Array(N);
      for (var i = 0; i < N; i++) P[i] = proj(pts[i]);
      // links
      for (var l = 0; l < links.length; l++) {
        var A = P[links[l][0]], B = P[links[l][1]];
        var depth = (A.z + B.z) / 2; var al = (0.5 - depth) * 0.28;
        if (al <= 0) continue;
        ctx.strokeStyle = 'rgba(80,170,255,' + al.toFixed(3) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy); ctx.stroke();
      }
      // points
      for (var k = 0; k < N; k++) {
        var pp = P[k], front = (0.6 - pp.z);
        if (front <= 0) continue;
        var pulse = 0.6 + 0.4 * Math.sin(t + pts[k].p);
        var rad = (1.1 + pp.per * 1.4) * (0.7 + 0.3 * pulse);
        var a2 = Math.min(front * 0.9, 0.9) * (0.6 + 0.4 * pulse);
        ctx.fillStyle = 'rgba(150,200,255,' + a2.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(pp.sx, pp.sy, rad, 0, 6.2832); ctx.fill();
        if (pp.z < -0.3 && pulse > 0.9) { // bright active host near the front
          ctx.fillStyle = 'rgba(90,230,255,0.9)'; ctx.beginPath(); ctx.arc(pp.sx, pp.sy, rad + 1.4, 0, 6.2832); ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    }
    size(); window.addEventListener('resize', size); frame();
  })();

  /* ---- Reveal on scroll (matches the CSS selector list) ------------ */
  var revealSel = '.hero .kicker, .hero h1, .hero .lede, .hero .ctas, .facts > div, .stage, .problem .say, .proof > div, .band-head, .outcome, .control, .req, .steps > li, .terminal, .edition, .faq details, .demo-points > li, .demo .form, .foot-grid > div';
  $$(revealSel).forEach(function (n) {
    var idx = [].indexOf.call(n.parentNode.children, n); // stagger among siblings
    n.style.transitionDelay = Math.min(idx, 6) * 0.07 + 's';
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.matches('.facts > div')) runCounters(); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$(revealSel).forEach(function (n) { io.observe(n); });
  } else {
    $$(revealSel).forEach(function (n) { n.classList.add('in'); }); runCounters();
  }

  /* ---- Counters (hero facts) --------------------------------------- */
  var countersDone = false;
  function runCounters() {
    if (countersDone) return; countersDone = true;
    $$('.facts dt').forEach(function (dt) {
      var raw = dt.textContent.trim(); if (!/^\d+$/.test(raw)) return;
      var target = parseInt(raw, 10), start = null, durn = 1400;
      function tick(t) { if (start === null) start = t; var p = Math.min((t - start) / durn, 1); dt.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); }
      dt.textContent = '0'; requestAnimationFrame(tick);
    });
  }

  /* ---- Frameworks marquees ----------------------------------------- */
  $$('.frameworks').forEach(function (fw, i) {
    var kids = [].slice.call(fw.children);
    if (!kids.length) return;
    var track = el('div', 'mq-track'); if (i % 2) track.classList.add('rev');
    kids.forEach(function (k) { track.appendChild(k); });
    var clone = track.cloneNode(true); clone.setAttribute('aria-hidden', 'true');
    fw.appendChild(track); fw.appendChild(clone);
    fw.classList.add('mq');
    fw.style.setProperty('--mqdur', (38 + i * 8) + 's');
  });

  /* ---- Hero stage parallax + evidence tilt ------------------------- */
  var stage = $('.stage'), evidence = $('.evidence');
  if (stage && !touch) {
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      if (evidence) evidence.style.transform = 'perspective(1000px) rotateX(' + (-py * 6) + 'deg) rotateY(' + (px * 7) + 'deg) translateZ(0)';
    });
    stage.addEventListener('mouseleave', function () { if (evidence) evidence.style.transform = ''; });
  }

  /* ---- Section scroll-spy in the nav ------------------------------- */
  var spy = $$('#nav a[href^="#"], #nav a[href^="../#"]');
  var map = {};
  spy.forEach(function (a) { var id = a.getAttribute('href').split('#')[1]; if (id) map[id] = a; });
  var ids = Object.keys(map);
  if (ids.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { spy.forEach(function (a) { a.removeAttribute('aria-current'); }); if (map[e.target.id]) map[e.target.id].setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(function (id) { var s = doc.getElementById(id); if (s) so.observe(s); });
  }
})();
