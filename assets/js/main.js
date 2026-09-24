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

  // Scan sweep across the hero evidence card
  var ev = $('.evidence'); if (ev) { var sl = el('span', 'scanline'); sl.setAttribute('aria-hidden', 'true'); ev.appendChild(sl); }

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
