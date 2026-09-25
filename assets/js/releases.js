/* Renders the Lawliet release history from /data/releases.json.
   No libraries. All release text is written with textContent (never innerHTML),
   and `inline code` is turned into <code>. The page is a document, not a hero. */
(function () {
  'use strict';
  var doc = document;
  var $ = function (id) { return doc.getElementById(id); };
  var statusEl = $('relStatus'), currentEl = $('relCurrent'), controlsEl = $('relControls'),
      indexEl = $('relIndex'), listEl = $('relList');
  if (!listEl) return;

  function el(tag, cls, txt) { var e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  // Turn `code` spans into <code>; everything else is a text node. Data-safe.
  function withCode(text) {
    var frag = doc.createDocumentFragment();
    String(text == null ? '' : text).split('`').forEach(function (part, i) {
      if (i % 2 === 1) { var c = doc.createElement('code'); c.textContent = part; frag.appendChild(c); }
      else if (part) { frag.appendChild(doc.createTextNode(part)); }
    });
    return frag;
  }

  function anchorId(version) { return 'v' + String(version).replace(/\./g, '-').replace(/[^a-z0-9-]/gi, '-'); }

  function badge(channel) {
    var beta = channel === 'beta';
    return el('span', 'rel-badge ' + (beta ? 'beta' : 'stable'), beta ? 'Beta' : 'Stable');
  }

  function list(items, cls) {
    var ul = el('ul', cls);
    (items || []).forEach(function (it) { var li = doc.createElement('li'); li.appendChild(withCode(it)); ul.appendChild(li); });
    return ul;
  }

  function nonEmpty(a) { return Array.isArray(a) && a.length > 0; }

  function block(heading, items) {
    if (!nonEmpty(items)) return null;
    var frag = doc.createDocumentFragment();
    frag.appendChild(el('h3', 'rel-h', heading));
    frag.appendChild(list(items, 'rel-ul'));
    return frag;
  }

  // Build the collapsible entry for one release.
  function entry(r, isCurrent) {
    var d = el('details', 'rel-entry'); d.id = anchorId(r.version); if (isCurrent) d.open = true;
    var sum = el('summary', 'rel-summary');
    var meta = el('div', 'rel-meta');
    meta.appendChild(el('span', 'rel-ver', 'v' + r.version));
    meta.appendChild(badge(r.channel));
    if (isCurrent) meta.appendChild(el('span', 'rel-current-tag', 'Current'));
    if (r.codename) meta.appendChild(el('span', 'rel-codename', r.codename));
    if (r.date) meta.appendChild(el('span', 'rel-date', r.date));
    sum.appendChild(meta);
    var h2 = el('h2', 'rel-title'); h2.appendChild(withCode(r.title || ('Version ' + r.version))); sum.appendChild(h2);
    d.appendChild(sum);

    var body = el('div', 'rel-entry-body');
    if (r.summary) { var p = el('p', 'rel-summary-text'); p.appendChild(withCode(r.summary)); body.appendChild(p); }

    (Array.isArray(r.sections) ? r.sections : []).forEach(function (s) {
      var b = block(s && s.heading ? s.heading : 'Changes', s && s.items);
      if (b) body.appendChild(b);
    });

    var fixed = block('Fixed', r.fixed); if (fixed) body.appendChild(fixed);

    var v = r.verification || {};
    if (nonEmpty(v.proven) || nonEmpty(v.not_proven)) {
      body.appendChild(el('h3', 'rel-h', 'Verification'));
      if (nonEmpty(v.proven)) { body.appendChild(el('p', 'rel-vlabel', 'Proven on a real target')); body.appendChild(list(v.proven, 'rel-ul')); }
      if (nonEmpty(v.not_proven)) { body.appendChild(el('p', 'rel-vlabel muted', 'Not yet proven on a real target')); body.appendChild(list(v.not_proven, 'rel-ul')); }
    }

    var ni = block('Not in this release', r.not_included); if (ni) body.appendChild(ni);
    var up = block('Upgrading', r.upgrade); if (up) body.appendChild(up);

    d.appendChild(body);
    return d;
  }

  // The header strip for the current release.
  function currentStrip(r) {
    currentEl.textContent = '';
    var meta = el('div', 'rel-meta');
    meta.appendChild(el('span', 'rel-ver rel-ver-lg', 'v' + r.version));
    meta.appendChild(badge(r.channel));
    meta.appendChild(el('span', 'rel-current-tag', 'Current'));
    if (r.date) meta.appendChild(el('span', 'rel-date', r.date));
    currentEl.appendChild(meta);
    var h = el('p', 'rel-current-title'); h.appendChild(withCode(r.title || ('Version ' + r.version))); currentEl.appendChild(h);
    if (r.summary) { var p = el('p', 'rel-current-sum'); p.appendChild(withCode(r.summary)); currentEl.appendChild(p); }
    var a = el('a', 'rel-jump', 'Read the full notes'); a.href = '#' + anchorId(r.version); currentEl.appendChild(a);
    currentEl.hidden = false;
  }

  function versionIndex(releases) {
    indexEl.textContent = '';
    indexEl.appendChild(el('span', 'rel-index-label', 'Versions'));
    releases.forEach(function (r) {
      var a = el('a', 'rel-index-item' + (r.channel === 'beta' ? ' beta' : ''));
      a.href = '#' + anchorId(r.version);
      a.appendChild(el('b', null, 'v' + r.version));
      if (r.date) a.appendChild(el('span', 'rel-index-date', r.date));
      if (r.channel === 'beta') a.appendChild(el('span', 'rel-index-beta', 'beta'));
      indexEl.appendChild(a);
    });
    indexEl.hidden = false;
  }

  function haystack(r) {
    var parts = [r.title, r.summary, r.codename];
    (r.sections || []).forEach(function (s) { if (s) { parts.push(s.heading); (s.items || []).forEach(function (i) { parts.push(i); }); } });
    (r.fixed || []).forEach(function (i) { parts.push(i); });
    var v = r.verification || {}; (v.proven || []).concat(v.not_proven || []).forEach(function (i) { parts.push(i); });
    (r.not_included || []).forEach(function (i) { parts.push(i); });
    (r.upgrade || []).forEach(function (i) { parts.push(i); });
    return parts.join(' \n ').toLowerCase();
  }

  function openHash() {
    var id = location.hash.slice(1); if (!id) return;
    var t = doc.getElementById(id);
    if (t && t.classList && t.classList.contains('rel-entry')) { t.open = true; t.scrollIntoView(); }
  }

  function fail() {
    statusEl.textContent = 'The release notes could not be loaded. Please try again shortly.';
    statusEl.classList.add('rel-error');
    if (currentEl) currentEl.hidden = true;
    if (controlsEl) controlsEl.hidden = true;
    if (indexEl) indexEl.hidden = true;
  }

  function render(data) {
    if (!data || data.schema !== 1) {
      try { console.warn('releases.json: unexpected schema', data && data.schema); } catch (e) {}
    }
    var releases = data && Array.isArray(data.releases) ? data.releases : [];
    if (!releases.length) { statusEl.textContent = 'No releases have been published yet.'; return; }

    statusEl.hidden = true;
    currentStrip(releases[0]);
    versionIndex(releases);

    var entries = releases.map(function (r, i) { var e = entry(r, i === 0); listEl.appendChild(e); return { r: r, e: e, hay: haystack(r) }; });
    controlsEl.hidden = false;

    var search = $('relSearch'), channel = $('relChannel'), count = $('relCount'), expand = $('relExpand');

    function applyFilters() {
      var q = (search.value || '').trim().toLowerCase();
      var ch = channel.value;
      var shown = 0;
      entries.forEach(function (x) {
        var okCh = ch === 'all' || x.r.channel === ch;
        var okQ = !q || x.hay.indexOf(q) !== -1;
        var vis = okCh && okQ;
        x.e.hidden = !vis;
        if (vis) shown++;
      });
      count.textContent = shown + (shown === 1 ? ' release' : ' releases');
    }

    search.addEventListener('input', applyFilters);
    channel.addEventListener('change', applyFilters);

    var allOpen = false;
    expand.addEventListener('click', function () {
      allOpen = !allOpen;
      entries.forEach(function (x) { if (!x.e.hidden) x.e.open = allOpen; });
      expand.textContent = allOpen ? 'Collapse all' : 'Expand all';
    });

    applyFilters();
    openHash();
  }

  addEventListener('hashchange', openHash);

  fetch('/data/releases.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(render)
    .catch(fail);
})();
