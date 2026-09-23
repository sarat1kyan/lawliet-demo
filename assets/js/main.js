(function () {
  'use strict';

  var doc = document;

  /* Sticky nav state */
  var nav = doc.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 24) { nav.classList.add('scrolled'); }
    else { nav.classList.remove('scrolled'); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = doc.getElementById('navToggle');
  var menu = doc.getElementById('navMenu');
  if (toggle) {
    toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); }
    });
  }

  /* Current year */
  var yr = doc.getElementById('year');
  if (yr) { yr.textContent = String(new Date().getFullYear()); }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll reveal */
  var reveals = [].slice.call(doc.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
          if (en.target.classList.contains('stats')) { runCounters(); }
          if (en.target.querySelector && en.target.querySelector('[data-score]')) { fillScore(); }
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
    runCounters();
    fillScore();
  }

  /* Animated stat counters */
  var countersDone = false;
  function runCounters() {
    if (countersDone) { return; }
    countersDone = true;
    [].slice.call(doc.querySelectorAll('[data-count]')).forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = format(target) + suffix; return; }
      var start = performance.now();
      var dur = 1500;
      function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.innerHTML = format(Math.round(target * eased)) + (suffix ? '<span class="unit">' + suffix + '</span>' : '');
        if (p < 1) { requestAnimationFrame(tick); }
      }
      requestAnimationFrame(tick);
    });
  }
  function format(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function fillScore() {
    [].slice.call(doc.querySelectorAll('[data-score]')).forEach(function (el) {
      el.style.width = el.getAttribute('data-score') + '%';
    });
  }

  /* Heartbeat terminal loop */
  var body = doc.getElementById('termBody');
  if (body && !reduce) {
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
      var last = i < frames.length;
      body.innerHTML = lines.join('') + (last ? '<div class="ln"><span class="cursor"></span></div>' : '');
    }
    function step() {
      render();
      i++;
      if (i > frames.length) { i = 0; setTimeout(step, 1600); return; }
      setTimeout(step, 900);
    }
    step();
  } else if (body) {
    body.innerHTML = '<div class="ln c-ok">agent online - heartbeat every 60s</div>';
  }

  /* Netlify form: submit over fetch so the page stays put, then show success */
  var form = doc.getElementById('demoForm');
  var success = doc.getElementById('formSuccess');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = doc.getElementById('submitBtn');
      var data = new FormData(form);
      var encoded = new URLSearchParams();
      data.forEach(function (v, k) { encoded.append(k, v); });

      if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; btn.firstChild.textContent = 'Sending'; }

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encoded.toString()
      }).then(function (res) {
        if (!res.ok) { throw new Error('bad status ' + res.status); }
        form.style.display = 'none';
        if (success) { success.classList.add('show'); }
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.firstChild.textContent = 'Request the demo'; }
        alert('Something went wrong sending that. Email the maintainer directly via the GitHub profile and it will get sorted.');
      });
    });
  }
})();
