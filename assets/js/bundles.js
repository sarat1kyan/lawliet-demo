/* Bundles page: header state, mobile menu, year. No scroll choreography. */
(function () {
  'use strict';
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };

  var hdr = $('#hdr');
  var onScroll = function () { if (hdr) hdr.classList.toggle('stuck', window.scrollY > 40); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

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
})();
