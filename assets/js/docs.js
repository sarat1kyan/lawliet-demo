/* Docs: mobile menu only. No motion. */
(function () {
  var btn = document.getElementById('menuBtn');
  var sheet = document.getElementById('sheet');
  if (!btn || !sheet) return;
  function set(open) {
    sheet.classList.toggle('open', open);
    sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  btn.addEventListener('click', function () { set(!sheet.classList.contains('open')); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
})();
