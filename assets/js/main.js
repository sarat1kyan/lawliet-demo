/* Lawliet landing. The page is a complete static document; this file layers
   scroll motion on top. If GSAP is missing or reduced motion is set, the page
   stays readable and every scene shows its final state. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };

  /* ---- Header stuck state ---- */
  var hdr = $('#hdr');
  var onScroll = function () { if (hdr) hdr.classList.toggle('stuck', window.scrollY > 40); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- Mobile menu (focus trap, Escape, scroll lock) ---- */
  (function () {
    var btn = $('#menuBtn'), sheet = $('#sheet'), close = $('#sheetClose');
    if (!btn || !sheet) return;
    var lastFocus = null;
    function set(open) {
      sheet.classList.toggle('open', open);
      sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.body.style.overflow = open ? 'hidden' : '';
      if (open) { lastFocus = doc.activeElement; var f = sheet.querySelector('a,button'); if (f) f.focus(); }
      else if (lastFocus) { lastFocus.focus(); }
    }
    btn.addEventListener('click', function () { set(true); });
    if (close) close.addEventListener('click', function () { set(false); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('open')) set(false);
      if (e.key === 'Tab' && sheet.classList.contains('open')) {
        var f = $$('a,button', sheet); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  })();

  var yr = $('#year'); if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---- Fleet grid (built in both paths so the static page shows dots too) ---- */
  (function () {
    var spec = [['linux', 30, 1], ['win', 12, 1], ['mac', 6, 0]];
    spec.forEach(function (s) {
      var grid = $('.fgrid[data-os="' + s[0] + '"]'); if (!grid || grid.children.length) return;
      var total = s[1], off = s[2];
      for (var i = 0; i < total; i++) {
        var n = doc.createElement('span');
        n.className = 'fnode' + (i >= total - off ? ' off' : '');
        grid.appendChild(n);
      }
    });
  })();

  /* ---- Launch countdown (revealed inside the hero zoom) ---- */
  (function () {
    var clock = $('#cdClock'); if (!clock) return;
    var target = new Date(2026, 9, 20, 0, 0, 0).getTime(); // 20 Oct 2026, local
    var c = { d: $('[data-cd="d"]', clock), h: $('[data-cd="h"]', clock), m: $('[data-cd="m"]', clock), s: $('[data-cd="s"]', clock) };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) { c.d.textContent = c.h.textContent = c.m.textContent = c.s.textContent = '00'; return; }
      var t = Math.floor(diff / 1000);
      var d = Math.floor(t / 86400); t -= d * 86400;
      var h = Math.floor(t / 3600); t -= h * 3600;
      var m = Math.floor(t / 60); t -= m * 60;
      c.d.textContent = pad(d); c.h.textContent = pad(h); c.m.textContent = pad(m); c.s.textContent = pad(t);
    }
    tick();
    setInterval(function () { if (!doc.hidden) tick(); }, 1000);
  })();

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
      if (!validate()) { var bad = form.querySelector('.err:not(:empty)'); if (bad) { var inp = bad.parentNode.querySelector('input'); if (inp) inp.focus(); } return; }
      btn.disabled = true; btn.textContent = 'Sending...';
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (r) { if (!r.ok) throw 0; form.hidden = true; sent.hidden = false; sent.focus(); })
        .catch(function () { btn.disabled = false; btn.textContent = 'Request a demo'; fieldError('email', 'That did not send. Email info@justlawliet.net.'); });
    });
  })();

  /* ---- FAQ smooth open (works even without GSAP via native details) ---- */

  /* ================= Motion. Bail cleanly to a complete static page. ============ */
  if (reduce || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove('anim');
    return;
  }
  window.__lwReady = true;
  root.classList.remove('anim'); // reveal handled by GSAP below
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  var touch = matchMedia('(hover: none)').matches;
  var auto = navigator.webdriver;

  /* ---- Lenis (fine pointers only; off under automation for deterministic checks) ---- */
  if (window.Lenis && !touch && !auto) {
    var lenis = new window.Lenis({ duration: 1.1, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = doc.getElementById(id.slice(1)); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -70 });
      });
    });
  }

  /* ---- Generic reveals ---- */
  $$('[data-rv]').forEach(function (el) {
    gsap.fromTo(el, { opacity: 0, y: 26 }, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  function countTo(el, end, suffix) {
    var o = { v: 0 };
    return gsap.to(o, { v: end, ease: 'none', onUpdate: function () { el.textContent = Math.round(o.v) + (suffix || ''); } });
  }

  var DESKTOP = '(min-width: 1024px) and (min-height: 620px)';
  var mm = gsap.matchMedia();

  /* ---- Scene 1: hero reticle zoom (all sizes; distance differs) ---- */
  (function () {
    var cam = $('#heroCam'), con = $('#heroConsole'), mark = $('#heroMark'), hint = $('.scroll-hint');
    if (!cam) return;
    gsap.from(cam.children, { opacity: 0, y: 18, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
    gsap.from(mark, { scale: 0.9, duration: 0.9, ease: 'power2.out' });

    function origin() {
      var m = mark.getBoundingClientRect(), c = cam.getBoundingClientRect();
      var x = ((m.left + m.width / 2) - c.left) / c.width * 100;
      var y = ((m.top + m.height / 2) - c.top) / c.height * 100;
      gsap.set(cam, { transformOrigin: x + '% ' + y + '%' });
      var vy = (m.top + m.height / 2) / innerHeight * 100;
      gsap.set(con, { '--cy': vy + '%' });
      return vy;
    }

    mm.add({ big: '(min-height: 620px)', small: '(max-height: 619px)' }, function (ctx) {
      var d = ctx.conditions.big ? 1.0 : 0.6;
      var vy = origin();
      gsap.set(con, { clipPath: 'circle(0% at 50% ' + vy + '%)' });
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero', start: 'top top', end: '+=' + (innerHeight * d),
          pin: true, scrub: 0.6, invalidateOnRefresh: true,
          onRefresh: function () { vy = origin(); },
          onUpdate: function (s) { if (hint) hint.style.opacity = s.progress > 0.03 ? '0' : '1'; }
        }
      });
      tl.to(cam, { scale: 13, ease: 'none', duration: 1 }, 0);
      tl.to(cam, { opacity: 0, ease: 'none', duration: 0.4 }, 0.32);
      tl.fromTo(con, { clipPath: function () { return 'circle(0% at 50% ' + vy + '%)'; } },
        { clipPath: function () { return 'circle(150% at 50% ' + vy + '%)'; }, ease: 'none', duration: 0.62 }, 0.38);
      return function () { gsap.set(cam, { scale: 1, opacity: 1 }); gsap.set(con, { clipPath: 'circle(0% at 50% 45%)' }); };
    });
  })();

  /* ---- Scene 2: console assemble ---- */
  (function () {
    var arc = $('#postureArc'), num = $('#postureNum'), badge = $('#bellBadge'), cam = $('#consoleCam'), row = $('#failRow');
    var panes = $$('#platform .posture, #platform .tile, #platform .rows');
    function counts(tl, pos) {
      if (arc) { gsap.set(arc, { strokeDashoffset: 97.39 }); tl.to(arc, { strokeDashoffset: 28.24, ease: 'none', duration: 0.6 }, pos); }
      if (num) tl.add(countTo(num, 71, '%'), pos);
      $$('#platform .tile .k').forEach(function (k) { tl.add(countTo(k, +k.getAttribute('data-count'), ''), pos); });
      if (badge) { badge.textContent = '0'; tl.add(countTo(badge, 3, ''), pos); }
    }
    mm.add(DESKTOP, function () {
      gsap.set(panes, { opacity: 0, y: 22 });
      var tl = gsap.timeline({ scrollTrigger: { trigger: '#platform', start: 'top top', end: '+=' + (innerHeight * 0.9), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      tl.to(panes, { opacity: 1, y: 0, ease: 'power3.out', stagger: 0.08, duration: 0.5 }, 0.05);
      counts(tl, 0.2);
      if (cam && row) {
        tl.to({}, { duration: 0.2 });
        tl.to(cam, {
          scale: 1.9, ease: 'power2.inOut', duration: 0.6,
          transformOrigin: function () {
            var r = row.getBoundingClientRect(), c = cam.getBoundingClientRect();
            return ((r.left + r.width / 2 - c.left) / c.width * 100) + '% ' + ((r.top + r.height / 2 - c.top) / c.height * 100) + '%';
          }
        }, '>');
      }
      return function () { gsap.set(panes, { opacity: 1, y: 0 }); if (cam) gsap.set(cam, { scale: 1 }); };
    });
    mm.add('(max-width: 1023px), (max-height: 619px)', function () {
      var tl = gsap.timeline({ scrollTrigger: { trigger: '#platform', start: 'top 70%' } });
      tl.from(panes, { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out' });
      counts(tl, 0.1);
      return function () {};
    });
  })();

  /* ---- Scene 3: harden and prove ---- */
  (function () {
    var after = $('#codeAfter'), roll = $('#hardenRoll'), stamp = $('#approveStamp');
    var evA = $('#evA'), evB = $('#evB'), caret = $('#evCaret'), sealed = $('#evSealed');
    var aFull = evA ? evA.textContent : '', bFull = evB ? evB.textContent : '';
    var total = aFull.length + bFull.length;
    function typeHash(p) {
      var n = Math.round(p * total);
      if (evA) evA.textContent = aFull.slice(0, Math.min(n, aFull.length));
      if (evB) evB.textContent = n > aFull.length ? bFull.slice(0, n - aFull.length) : '';
      if (caret) caret.style.opacity = p > 0 && p < 1 ? '1' : '0';
      if (sealed) sealed.style.opacity = p >= 1 ? '1' : '0';
    }
    var fail = roll ? $('.stat.fail', roll) : null, pass = roll ? $('.stat.pass', roll) : null;
    function build(pin) {
      if (after) gsap.set(after, { clipPath: 'inset(0 100% 0 0)' });
      if (fail) gsap.set(fail, { opacity: 1, yPercent: 0 });
      if (pass) gsap.set(pass, { opacity: 0, yPercent: 120 });
      if (stamp) gsap.set(stamp, { opacity: 0, scale: 1.15 });
      if (sealed) sealed.style.opacity = '0';
      typeHash(0);
      // typing is driven directly from scroll progress so it always reaches 1
      var onUpd = function (self) { typeHash(Math.max(0, Math.min(1, (self.progress - 0.6) / 0.32))); };
      var st = pin
        ? { trigger: '#harden', start: 'top top', end: '+=' + (innerHeight * 1.1), pin: true, scrub: 0.6, invalidateOnRefresh: true, onUpdate: onUpd }
        : { trigger: '#harden', start: 'top 75%', end: 'bottom 60%', scrub: 0.6, onUpdate: onUpd };
      var tl = gsap.timeline({ scrollTrigger: st });
      if (after) tl.to(after, { clipPath: 'inset(0 0% 0 0)', ease: 'none', duration: 0.3 }, 0.05);
      if (stamp) tl.to(stamp, { opacity: 1, scale: 1, ease: 'back.out(2)', duration: 0.2 }, 0.4);
      if (fail) tl.to(fail, { opacity: 0, yPercent: -120, ease: 'power2.in', duration: 0.15 }, 0.5);
      if (pass) tl.to(pass, { opacity: 1, yPercent: 0, ease: 'power2.out', duration: 0.15 }, 0.55);
      tl.to({}, { duration: 0.4 }); // hold so the timeline spans the typing range
      return function () { if (after) gsap.set(after, { clipPath: 'inset(0 0% 0 0)' }); if (stamp) gsap.set(stamp, { opacity: 1, scale: 1 }); if (fail) gsap.set(fail, { opacity: 0 }); if (pass) gsap.set(pass, { opacity: 1, yPercent: 0 }); typeHash(1); };
    }
    mm.add(DESKTOP, function () { return build(true); });
    mm.add('(max-width: 1023px), (max-height: 619px)', function () { return build(false); });
  })();

  /* ---- Scene 4: modules rail ---- */
  (function () {
    var track = $('#railTrack'), bar = $('#railBar'), count = $('#railCount');
    if (!track) return;
    mm.add(DESKTOP, function () {
      var dist = track.scrollWidth - track.clientWidth;
      var tw = gsap.to(track, {
        x: function () { return -(track.scrollWidth - track.clientWidth); }, ease: 'none',
        scrollTrigger: {
          trigger: '#modules', start: 'top top', end: function () { return '+=' + (track.scrollWidth - track.clientWidth); },
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (s) { var n = Math.min(6, Math.floor(s.progress * 5.999) + 1); if (count) count.textContent = n + ' / 6'; if (bar) bar.style.width = (100 / 6 + s.progress * (100 - 100 / 6)) + '%'; }
        }
      });
      return function () { if (tw.scrollTrigger) tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { x: 0 }); };
    });
    mm.add('(max-width: 1023px), (max-height: 619px)', function () {
      var tl = $$('#railTrack .panel').map(function (p) {
        return gsap.fromTo(p, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 85%' } });
      });
      return function () { tl.forEach(function (t) { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); }); gsap.set('#railTrack .panel', { opacity: 1, y: 0 }); };
    });
  })();

  /* ---- Scene 6: chain of trust ---- */
  (function () {
    var fill = $('#chainFill'), nodes = $$('#chain .node-ring');
    if (!fill) return;
    gsap.set(fill, { scaleY: 0 });
    gsap.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#chain', start: 'top 75%', end: 'bottom 75%', scrub: 0.6 } });
    nodes.forEach(function (n, i) {
      ST.create({
        trigger: n, start: 'top 70%',
        onEnter: function () {
          gsap.timeline()
            .fromTo(n, { color: 'rgba(255,255,255,0.13)' }, { color: '#e0569a', duration: 0.25 })
            .to(n, { color: '#4f89f5', duration: 0.4, delay: 0.15 });
        }
      });
    });
  })();

  /* ---- Scene 7: offline delivery ---- */
  (function () {
    var fp = $('#fingerprint'), lights = $$('#fleet .fnode:not(.off)'), flow = $$('#deliveryFlow .flow-step');
    var fpFull = fp ? fp.textContent : '';
    function typeFp(p) { if (fp) fp.textContent = fpFull.slice(0, Math.max(3, Math.round(p * fpFull.length))); }
    function run(pin) {
      if (fp) fp.textContent = 'fp ';
      gsap.set(lights, { opacity: 0.2 });
      var onUpd = function (self) { typeFp(Math.max(0, Math.min(1, (self.progress - 0.15) / 0.35))); };
      var st = pin
        ? { trigger: '#deployment', start: 'top top', end: '+=' + (innerHeight * 0.9), pin: true, scrub: 0.6, invalidateOnRefresh: true, onUpdate: onUpd }
        : { trigger: '#deployment', start: 'top 70%', end: 'bottom 70%', scrub: 0.6, onUpdate: onUpd };
      var tl = gsap.timeline({ scrollTrigger: st });
      tl.to(lights, { opacity: 1, ease: 'none', stagger: 0.01, duration: 0.4 }, 0.5);
      tl.to({}, { duration: 0.2 });
      return function () { typeFp(1); gsap.set(lights, { opacity: 1 }); };
    }
    mm.add(DESKTOP, function () { return run(true); });
    mm.add('(max-width: 1023px), (max-height: 619px)', function () { return run(false); });
  })();

  /* ---- Footer mark reveal ---- */
  (function () {
    var m = $('#footMark'); if (!m) return;
    gsap.fromTo(m, { clipPath: 'circle(0% at 50% 50%)', opacity: 0.2 }, {
      clipPath: 'circle(75% at 50% 50%)', opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top 92%', end: 'top 55%', scrub: 0.6 }
    });
  })();

  /* ---- Scroll-spy ---- */
  var spy = $$('#nav a[href^="#"]');
  var map = {}; spy.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (id) map[id] = a; });
  Object.keys(map).forEach(function (id) {
    var s = doc.getElementById(id) || doc.getElementById(id === 'pricing' ? 'pricing' : id);
    if (!s) return;
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

  /* ---- refresh after fonts and images settle ---- */
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { ST.refresh(); });
  addEventListener('load', function () { ST.refresh(); });
})();
