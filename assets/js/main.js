/* Lawliet landing. Base behaviour always runs; the scroll choreography runs
   only when GSAP is present and reduced motion is off. If anything fails, the
   page stays a complete, readable, static document. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = matchMedia('(hover: none)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };

  /* ---- Header stuck state ---- */
  var hdr = $('#hdr');
  var onScroll = function () { hdr.classList.toggle('stuck', window.scrollY > 40); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- Mobile menu ---- */
  var menuBtn = $('#menuBtn'), sheet = $('#sheet');
  if (menuBtn && sheet) {
    var setMenu = function (open) {
      sheet.classList.toggle('open', open);
      sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', function () { setMenu(!sheet.classList.contains('open')); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  var yr = $('#year'); if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---- Demo form (Netlify contract preserved) ---- */
  (function () {
    var form = $('#demoForm'); if (!form) return;
    var sent = $('#formSent'), btn = $('#formBtn');
    function fieldError(id, msg) { var e = $('#err-' + id); if (e) e.textContent = msg || ''; }
    function validate() {
      var ok = true;
      [['name', 'Enter your name'], ['company', 'Enter your organisation']].forEach(function (f) {
        var v = form[f[0]].value.trim(); fieldError(f[0], v ? '' : f[1]); if (!v) ok = false;
      });
      var email = form.email.value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      fieldError('email', emailOk ? '' : 'Enter a valid work email'); if (!emailOk) ok = false;
      return ok;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      btn.disabled = true; btn.textContent = 'Sending...';
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (r) { if (!r.ok) throw 0; form.hidden = true; sent.hidden = false; sent.focus(); })
        .catch(function () { btn.disabled = false; btn.textContent = 'Request a demo'; fieldError('email', 'That did not send. Email info@justlawliet.net.'); });
    });
  })();

  /* ---- Everything below is optional motion. Bail cleanly if unavailable. ---- */
  if (reduce || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove('anim'); // reveal any pre-hidden content
    return;
  }
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  /* ---- Lenis smooth scroll (pointer devices only) ---- */
  if (window.Lenis && !touch) {
    var lenis = new window.Lenis({ duration: 1.1, easing: function (t) { return 1 - Math.pow(2, -10 * t); } });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = doc.getElementById(id.slice(1)); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -64 });
      });
    });
  }

  var mm = gsap.matchMedia();
  var DESKTOP = '(min-width: 901px)';

  /* ---- Generic reveals (all breakpoints) ---- */
  $$('[data-rv]').forEach(function (el) {
    gsap.set(el, { y: 26 });
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  function countTo(el, end, suffix) {
    var o = { v: 0 };
    return gsap.to(o, { v: end, duration: 1.1, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v) + (suffix || ''); } });
  }

  /* ---- Scene 1: hero zoom ---- */
  (function () {
    var cam = $('#heroCam'); if (!cam) return;
    // draw the reticle ring in on load
    var ring = $('#heroRing');
    if (ring) { var len = 2 * Math.PI * 40; gsap.set(ring, { strokeDasharray: len, strokeDashoffset: len }); gsap.to(ring, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out' }); }
    gsap.from(['#heroL', '.hero .word-lg', '.hero .slogan', '.hero .statement', '.hero .ctas'], { opacity: 0, y: 16, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.25 });
    // scrub: zoom into the reticle as the hero leaves
    gsap.to(cam, {
      scale: 6, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.6, pin: true, pinSpacing: true }
    });
  })();

  /* ---- Scene 2: console assemble ---- */
  (function () {
    var arc = $('#postureArc'), num = $('#postureNum'), badge = $('#bellBadge');
    var tl = gsap.timeline({ scrollTrigger: { trigger: '#platform', start: 'top 70%' } });
    tl.from('#platform .console', { opacity: 0, y: 40, scale: 0.97, duration: 0.7, ease: 'power3.out' });
    tl.from('#platform .posture, #platform .tile, #platform .crow', { opacity: 0, y: 18, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, '-=0.3');
    if (arc) { var full = 97.39; gsap.set(arc, { strokeDashoffset: full }); tl.to(arc, { strokeDashoffset: 28.2, duration: 1.0, ease: 'power2.out' }, '-=0.2'); }
    if (num) tl.add(countTo(num, 71, '%'), '<');
    $$('#platform .tile .k').forEach(function (k) { var end = +k.getAttribute('data-count'); tl.add(countTo(k, end, ''), '<'); });
    if (badge) { badge.textContent = '0'; tl.add(countTo(badge, 3, ''), '<'); }
  })();

  /* ---- Scene 3: harden, type the evidence hash ---- */
  (function () {
    var h = $('#evHash'); if (!h) return;
    var full = h.textContent; h.textContent = '';
    ST.create({
      trigger: '#harden', start: 'top 60%', once: true,
      onEnter: function () {
        var i = 0; (function type() { h.textContent = full.slice(0, i++); if (i <= full.length) setTimeout(type, 24); })();
      }
    });
  })();

  /* ---- Scene 4: modules rail (horizontal on desktop) ---- */
  mm.add(DESKTOP, function () {
    var track = $('#railTrack'), bar = $('#railBar'), count = $('#railCount');
    if (!track) return;
    var dist = track.scrollWidth - innerWidth + 48;
    var tw = gsap.to(track, {
      x: -dist, ease: 'none',
      scrollTrigger: {
        trigger: '#modules', start: 'top top', end: '+=' + dist, pin: true, scrub: 0.6, invalidateOnRefresh: true,
        onUpdate: function (s) { var n = Math.min(6, Math.floor(s.progress * 6) + 1); if (count) count.textContent = n + ' / 6'; if (bar) bar.style.width = (16.6 + s.progress * 83.4) + '%'; }
      }
    });
    return function () { if (tw.scrollTrigger) tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { x: 0 }); };
  });

  /* ---- Scene 6: chain of trust spine ---- */
  (function () {
    var fill = $('#chainFill'); if (!fill) return;
    gsap.set(fill, { scaleY: 0 });
    gsap.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#chain', start: 'top 70%', end: 'bottom 80%', scrub: 0.6 } });
  })();

  /* ---- Scene 7: fleet nodes light up + fingerprint type ---- */
  (function () {
    var fp = $('#fingerprint'); var nodes = $$('#deployment .fleet .node.on');
    ST.create({
      trigger: '#deployment', start: 'top 60%', once: true,
      onEnter: function () {
        gsap.set('#deployment .fleet .node.on', { opacity: 0.25 });
        gsap.to('#deployment .fleet .node.on', { opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
        if (fp) { var full = fp.textContent; fp.textContent = 'fp '; var i = 3; (function type() { fp.textContent = full.slice(0, i++); if (i <= full.length) setTimeout(type, 30); })(); }
      }
    });
  })();

  /* ---- Footer mark ring draws ---- */
  (function () {
    var ring = $('#footRing'); if (!ring) return;
    var len = 2 * Math.PI * 40; gsap.set(ring, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(ring, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top 90%', end: 'bottom bottom', scrub: 0.6 } });
  })();

  /* ---- Scroll-spy ---- */
  var spy = $$('#nav a[href^="#"]');
  var map = {}; spy.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (id) map[id] = a; });
  Object.keys(map).forEach(function (id) {
    var s = doc.getElementById(id); if (!s) return;
    ST.create({
      trigger: s, start: 'top 55%', end: 'bottom 55%',
      onToggle: function (self) { if (self.isActive) { spy.forEach(function (a) { a.removeAttribute('aria-current'); }); map[id].setAttribute('aria-current', 'true'); } }
    });
  });

  /* ---- FAQ smooth open ---- */
  $$('.faq details').forEach(function (d) {
    var ans = $('.ans', d); if (!ans) return;
    d.addEventListener('toggle', function () {
      if (d.open) gsap.fromTo(ans, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' });
    });
  });

  doc.fonts && doc.fonts.ready.then(function () { ST.refresh(); });
  addEventListener('load', function () { ST.refresh(); });
})();
