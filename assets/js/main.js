(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';

  if (reduce) { body.classList.add('reduced'); }

  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };

  /* ------------------------------------------------------------- boot */
  var boot = $('#boot');
  function killBoot(instant) {
    if (!boot) { return; }
    if (instant || !hasGSAP) {
      boot.style.display = 'none';
      body.classList.remove('boot-lock');
      heroIntro();
      startReveals();
      return;
    }
    var bar = $('#bootBar');
    var text = $('#bootText');
    var phases = ['LOADING CONTROL CONTENT', 'VERIFYING SIGNATURES', 'CONSOLE READY'];
    var tl = window.gsap.timeline({
      onComplete: function () {
        boot.style.display = 'none';
        body.classList.remove('boot-lock');
        heroIntro();
        startReveals();
      }
    });
    tl.to(bar, { width: '100%', duration: 1.15, ease: 'power2.inOut' }, 0);
    phases.forEach(function (p, i) {
      tl.add(function () { if (text) { text.textContent = p; } }, 0.28 + i * 0.3);
    });
    tl.to(boot, { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '+=0.12');
  }

  if (boot && !reduce) {
    var seen = false;
    try { seen = sessionStorage.getItem('lw_boot') === '1'; } catch (e) {}
    if (seen) { killBoot(true); }
    else {
      body.classList.add('boot-lock');
      try { sessionStorage.setItem('lw_boot', '1'); } catch (e) {}
      window.addEventListener('load', function () { killBoot(false); });
      setTimeout(function () { if (boot && boot.style.display !== 'none') { killBoot(false); } }, 2600);
    }
  } else {
    killBoot(true);
  }

  /* ------------------------------------------------------------- nav */
  var nav = $('#nav');
  function onScrollNav() { if (window.scrollY > 24) { nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); } }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  var toggle = $('#navToggle');
  var menu = $('#navMenu');
  if (toggle) {
    toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) { nav.classList.remove('open'); } });
  }

  var yr = $('#year');
  if (yr) { yr.textContent = String(new Date().getFullYear()); }

  /* --------------------------------------------------- smooth scroll (Lenis) */
  var lenis = null;
  if (hasLenis && !reduce) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, lerp: 0.1 });
    if (hasST) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
  }
  // anchor links go through Lenis when present
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) { return; }
      var target = doc.getElementById(id.slice(1));
      if (!target) { return; }
      e.preventDefault();
      if (lenis) { lenis.scrollTo(target, { offset: -70 }); }
      else { target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    });
  });

  /* ------------------------------------------------------- scroll progress */
  var prog = $('#progress');
  function updateProgress() {
    var h = doc.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (prog) { prog.style.width = p + '%'; }
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ------------------------------------------------------------- cursor */
  if (!touch && !reduce) {
    var dot = $('#cursorDot');
    var ring = $('#cursorRing');
    var rx = 0, ry = 0, dx = 0, dy = 0;
    window.addEventListener('mousemove', function (e) {
      dx = e.clientX; dy = e.clientY;
      if (dot) { dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; }
    });
    function ringLoop() {
      rx += (dx - rx) * 0.18; ry += (dy - ry) * 0.18;
      if (ring) { ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)'; }
      requestAnimationFrame(ringLoop);
    }
    ringLoop();
    $$('[data-cursor], a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { if (ring) { ring.classList.add('hot'); } });
      el.addEventListener('mouseleave', function () { if (ring) { ring.classList.remove('hot'); } });
    });
    // magnetic primary buttons
    $$('.btn-primary').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + mx * 0.18 + 'px,' + my * 0.28 + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------- background canvas */
  (function bgCanvas() {
    var cv = $('#bg-canvas');
    if (!cv || reduce) { if (cv) { cv.style.display = 'none'; } return; }
    var ctx = cv.getContext('2d');
    var w, h, dpr, nodes = [], mouse = { x: -999, y: -999 };
    var COUNT;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      COUNT = Math.max(28, Math.min(72, Math.round(w * h / 26000)));
      nodes = [];
      for (var i = 0; i < COUNT; i++) {
        nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.6 + 0.6 });
      }
    }
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', function () { mouse.x = -999; mouse.y = -999; });
    var scrollShift = 0;
    window.addEventListener('scroll', function () { scrollShift = window.scrollY * 0.02; }, { passive: true });
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) { n.vx *= -1; }
        if (n.y < 0 || n.y > h) { n.vy *= -1; }
        var mdx = n.x - mouse.x, mdy = n.y - (mouse.y + scrollShift);
        var md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 140) { n.x += mdx / md * 0.6; n.y += mdy / md * 0.6; }
        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var dx = n.x - m.x, dy = n.y - m.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 132) {
            ctx.strokeStyle = 'rgba(79,137,245,' + (0.14 * (1 - d / 132)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(120,170,255,0.6)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener('resize', size);
    frame();
  })();

  /* ------------------------------------------------------------- reveals */
  var revealsStarted = false;
  function startReveals() {
    if (revealsStarted) { return; }
    revealsStarted = true;

    if (reduce || !hasST) {
      $$('[data-reveal]').forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      $$('.line > span').forEach(function (el) { el.style.transform = 'none'; });
      runCounters(); fillScores();
      staticModules();
      basicMarquee();
      return;
    }

    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    // generic reveals
    $$('[data-reveal]').forEach(function (el) {
      if (el.closest('.hero')) { return; }
      gsap.fromTo(el, { autoAlpha: 0, y: el.getAttribute('data-reveal') === 'up' ? 30 : 0 }, {
        autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' }
      });
    });

    // section-head reveals already covered by [data-reveal]; the hero handled in heroIntro

    // stats counters + lit bar
    var statsEl = $('#stats');
    if (statsEl) {
      ST.create({ trigger: statsEl, start: 'top 80%', once: true, onEnter: function () {
        runCounters();
        $$('.stat', statsEl).forEach(function (s, i) { gsap.delayedCall(i * 0.08, function () { s.classList.add('lit'); }); });
      }});
    }

    // evidence score + tilt
    var evCard = $('#evCard');
    if (evCard) {
      ST.create({ trigger: evCard, start: 'top 78%', once: true, onEnter: fillScores });
      if (!touch) {
        evCard.addEventListener('mousemove', function (e) {
          var r = evCard.getBoundingClientRect();
          var rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
          var ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
          evCard.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        });
        evCard.addEventListener('mouseleave', function () { evCard.style.transform = ''; });
      }
    }

    // pull-only: pin the section and light each node as you scroll through
    var pull = $('#platform');
    var rows = $$('.flow-row');
    if (pull && rows.length) {
      var pullTl = gsap.timeline({
        scrollTrigger: { trigger: pull, start: 'top 60%', end: 'bottom 70%', scrub: 0.6 }
      });
      rows.forEach(function (row, i) {
        var node = $('.flow-node', row);
        var pkt = $('.pkt', row);
        pullTl.to(node, { onStart: function () { node.classList.add('live'); }, onReverseComplete: function () { node.classList.remove('live'); }, duration: 0.2 }, i * 0.34);
        if (pkt) { pullTl.fromTo(pkt, { x: -6, opacity: 0.2 }, { x: 8, opacity: 1, duration: 0.34, ease: 'power1.inOut' }, i * 0.34); }
      });
    }

    // reticle + blade parallax
    var reticle = $('#reticle');
    if (reticle) { gsap.to(reticle, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } }); }
    var blade = $('#heroBlade');
    if (blade) { gsap.to(blade, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } }); }

    // horizontal modules (desktop only), static fallback below breakpoint
    var mm = gsap.matchMedia();
    var track = $('#hscrollTrack');
    var viewport = $('.hscroll-viewport');
    var hbar = $('#hscrollBar');
    mm.add('(min-width: 961px)', function () {
      var scrollLen = track.scrollWidth - window.innerWidth + 48;
      var tween = gsap.to(track, {
        x: -scrollLen, ease: 'none',
        scrollTrigger: {
          trigger: '#modules', start: 'top top', end: '+=' + scrollLen,
          pin: true, scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: function (self) { if (hbar) { hbar.style.width = (22 + self.progress * 78) + '%'; } }
        }
      });
      return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); gsap.set(track, { x: 0 }); };
    });
    mm.add('(max-width: 960px)', function () {
      if (viewport) { viewport.classList.add('static'); }
      return function () { if (viewport) { viewport.classList.remove('static'); } };
    });

    // marquee driven by scroll velocity
    marqueeMotion();

    ST.refresh();
  }

  /* --------------------------------------------------------- hero intro */
  var heroDone = false;
  function heroIntro() {
    if (heroDone) { return; }
    heroDone = true;
    if (reduce || !hasGSAP) {
      $$('.hero-copy [data-reveal], .hero .line > span').forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }
    var gsap = window.gsap;
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.hero .eyebrow', { autoAlpha: 1, y: 0, duration: 0.6 }, 0.05)
      .to('.hero-title .line > span', { y: '0%', duration: 0.9, stagger: 0.12 }, 0.15)
      .to('.hero .lede', { autoAlpha: 1, y: 0, duration: 0.7 }, 0.5)
      .to('.hero-actions', { autoAlpha: 1, y: 0, duration: 0.7 }, 0.62)
      .to('.hero-trust', { autoAlpha: 1, y: 0, duration: 0.7 }, 0.74);
  }

  /* ------------------------------------------------------------- counters */
  var countersDone = false;
  function runCounters() {
    if (countersDone) { return; }
    countersDone = true;
    $$('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce || !hasGSAP) { el.innerHTML = fmt(target) + unit(suffix); return; }
      var obj = { v: 0 };
      window.gsap.to(obj, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.innerHTML = fmt(Math.round(obj.v)) + unit(suffix); } });
    });
  }
  function unit(s) { return s ? '<span class="unit">' + s + '</span>' : ''; }
  function fmt(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function fillScores() { $$('[data-score]').forEach(function (el) { el.style.width = el.getAttribute('data-score') + '%'; }); }
  function staticModules() { var v = $('.hscroll-viewport'); if (v) { v.classList.add('static'); } }
  function basicMarquee() { animateMarquee(28); }

  /* ------------------------------------------------------------- marquee */
  function animateMarquee(seconds) {
    var track = $('#marquee');
    if (!track) { return; }
    track.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: seconds * 1000, iterations: Infinity });
  }
  function marqueeMotion() {
    // base drift plus a nudge from scroll velocity
    animateMarquee(30);
  }

  /* --------------------------------------------------- heartbeat terminal */
  (function terminal() {
    var el = $('#termBody');
    if (!el) { return; }
    if (reduce) { el.innerHTML = '<div class="ln c-ok">agent online - heartbeat every 60s</div>'; return; }
    var frames = [
      { c: 'c-mut', t: '$ lawliet-agent --heartbeat' },
      { c: 'c-acc', t: 'POST /api/v1/heartbeat  host=db-prod-01' },
      { c: 'c-ink', t: 'queued commands: 2 (signed)' },
      { c: 'c-mut', t: 'verify hmac ......... ok' },
      { c: 'c-mut', t: 'verify clock skew ... 0.4s ok' },
      { c: 'c-acc', t: 'run: cis-scan --profile server' },
      { c: 'c-ok',  t: 'pass 214  fail 6  n/a 12' },
      { c: 'c-acc', t: 'run: fim-check /etc /usr/bin' },
      { c: 'c-ok',  t: 'evidence sealed  sha256 9f2c4a...' },
      { c: 'c-mut', t: 'sleep 60s  # next heartbeat' }
    ];
    var i = 0;
    function render() {
      var lines = [];
      for (var k = Math.max(0, i - 7); k <= i && k < frames.length; k++) {
        lines.push('<div class="ln ' + frames[k].c + '">' + frames[k].t + '</div>');
      }
      el.innerHTML = lines.join('') + (i < frames.length ? '<div class="ln"><span class="cursor"></span></div>' : '');
    }
    function step() { render(); i++; if (i > frames.length) { i = 0; setTimeout(step, 1600); return; } setTimeout(step, 900); }
    step();
  })();

  /* ------------------------------------------------------ Netlify form */
  var form = $('#demoForm');
  var success = $('#formSuccess');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('#submitBtn');
      var data = new FormData(form);
      var encoded = new URLSearchParams();
      data.forEach(function (v, k) { encoded.append(k, v); });
      if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; var sp = btn.querySelector('span'); if (sp) { sp.textContent = 'Sending'; } }
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: encoded.toString() })
        .then(function (res) {
          if (!res.ok) { throw new Error('bad status ' + res.status); }
          form.style.display = 'none';
          if (success) { success.classList.add('show'); }
          if (lenis) { lenis.scrollTo(success, { offset: -120 }); } else { success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.style.opacity = '1'; var s2 = btn.querySelector('span'); if (s2) { s2.textContent = 'Request the demo'; } }
          alert('Something went wrong sending that. Reach the maintainer through the GitHub profile and it will get sorted.');
        });
    });
  }
})();
