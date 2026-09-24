/* Lawliet site: header state, mobile menu, and the demo form. No dependencies. */
(function () {
  var head = document.querySelector('.site-head');
  var onScroll = function () { if (head) head.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var btn = document.getElementById('menuBtn');
  if (btn && head) {
    btn.addEventListener('click', function () {
      var open = head.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
    document.querySelectorAll('#nav a').forEach(function (a) {
      a.addEventListener('click', function () { head.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.textContent = 'Menu'; });
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Netlify registers the form from the static HTML; this posts it without leaving the page.
  // Without JavaScript the form still posts and lands on thanks.html.
  var form = document.getElementById('demoForm');
  if (!form) return;
  var sent = document.getElementById('formSent');
  var err = document.getElementById('formError');
  var submit = document.getElementById('formBtn');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    err.hidden = true;
    submit.disabled = true;
    submit.textContent = 'Sending...';
    var body = new URLSearchParams(new FormData(form)).toString();
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
      .then(function (res) {
        if (!res.ok) throw new Error('status ' + res.status);
        form.hidden = true;
        sent.hidden = false;
        sent.focus();
      })
      .catch(function () {
        submit.disabled = false;
        submit.textContent = 'Request a demo';
        err.textContent = 'That did not send. Try again, or write to info@justlawliet.net.';
        err.hidden = false;
      });
  });
})();
