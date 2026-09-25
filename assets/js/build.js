/* Build your own: module picker for the Lawliet pricing section.
   No libraries, no prices. It only prepares a plain-text summary for the quote
   request; it never submits on its own. */
(function () {
  'use strict';
  var doc = document;
  var panel = doc.getElementById('build-panel');
  if (!panel) return;

  var MODULES = [
    { id: 'compliance', name: 'Compliance and hardening', group: 'compliance' },
    { id: 'firewall', name: 'Firewall governance', group: 'compliance' },
    { id: 'network', name: 'Network discovery and topology', group: 'compliance' },
    { id: 'logs', name: 'Log collection and detection', group: 'detection' },
    { id: 'dlp', name: 'Data loss prevention', group: 'detection' },
    { id: 'fim', name: 'File integrity monitoring', group: 'detection' },
    { id: 'forensics', name: 'Forensics and hunting', group: 'response' },
    { id: 'defence', name: 'Active defence', group: 'response' }
  ];
  var NAME = {}; MODULES.forEach(function (m) { NAME[m.id] = m.name; });
  var ORDER = MODULES.map(function (m) { return m.id; });
  var COMPLY = ['compliance', 'firewall', 'network'];
  var OPERATE = ['logs', 'dlp', 'fim'];
  var COMPLETE = ORDER.slice();
  var DEFENCE_PREREQ = ['forensics', 'logs', 'dlp', 'fim'];

  var sel = {}; // id -> true
  var btns = {}; MODULES.forEach(function (m) { btns[m.id] = panel.querySelector('[data-mod="' + m.id + '"]'); });
  var chosenEl = doc.getElementById('buildChosen');
  var noteEl = doc.getElementById('buildNote');
  var suggestEl = doc.getElementById('buildSuggest');
  var sizeEl = doc.getElementById('buildSize');
  var quoteEl = doc.getElementById('buildQuote');
  var buildField = doc.getElementById('buildField');
  var fleetEl = doc.querySelector('#demoForm select[name="fleet_size"]');

  function selected() { return ORDER.filter(function (id) { return sel[id]; }); }
  function subsetOf(setArr) { var s = selected(); return s.length > 0 && s.every(function (id) { return setArr.indexOf(id) !== -1; }); }
  function hasPrereq() { return DEFENCE_PREREQ.some(function (id) { return sel[id]; }); }
  function spansAll() {
    var g = { compliance: false, detection: false, response: false };
    selected().forEach(function (id) { var m = MODULES.filter(function (x) { return x.id === id; })[0]; if (m) g[m.group] = true; });
    return g.compliance && g.detection && g.response;
  }

  function enforce() {
    if (!sel.firewall) delete sel.network;      // network only with firewall
    if (!hasPrereq()) delete sel.defence;        // active defence needs something to act on
  }

  function setNote(msg) {
    if (!noteEl) return;
    if (msg) { noteEl.textContent = msg; noteEl.hidden = false; } else { noteEl.textContent = ''; noteEl.hidden = true; }
  }

  function renderButtons() {
    MODULES.forEach(function (m) {
      var b = btns[m.id]; if (!b) return;
      var on = !!sel[m.id];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('on', on);
      if (m.id === 'defence') {
        var enabled = hasPrereq();
        b.setAttribute('aria-disabled', enabled ? 'false' : 'true');
        b.classList.toggle('disabled', !enabled);
      }
    });
  }

  function renderChosen() {
    chosenEl.textContent = '';
    var s = selected();
    if (!s.length) {
      var li = doc.createElement('li'); li.className = 'build-empty'; li.textContent = 'No modules selected yet.'; chosenEl.appendChild(li);
      return;
    }
    s.forEach(function (id) { var li = doc.createElement('li'); li.textContent = NAME[id]; chosenEl.appendChild(li); });
  }

  function chooseSuiteButton(label, ids) {
    var b = doc.createElement('button');
    b.type = 'button'; b.className = 'build-choose'; b.textContent = label;
    b.addEventListener('click', function () { sel = {}; ids.forEach(function (id) { sel[id] = true; }); setNote(''); render(); });
    return b;
  }

  function renderSuggest() {
    suggestEl.textContent = '';
    var s = selected();
    if (!s.length) { suggestEl.hidden = true; return; }
    var msg = null, action = null;
    if (subsetOf(COMPLY)) {
      msg = 'Comply includes all of this and costs less than these modules bought separately.';
      action = chooseSuiteButton('Choose Comply instead', COMPLY);
    } else if (subsetOf(OPERATE)) {
      msg = 'Operate includes all of this and costs less than these modules bought separately.';
      action = chooseSuiteButton('Choose Operate instead', OPERATE);
    } else if (s.length >= 5 || spansAll()) {
      msg = 'Complete may cost less than this build - we will quote both.';
      action = chooseSuiteButton('Choose Complete instead', COMPLETE);
    }
    if (!msg) { suggestEl.hidden = true; return; }
    var p = doc.createElement('p'); p.className = 'build-suggest-msg'; p.textContent = msg; suggestEl.appendChild(p);
    if (action) suggestEl.appendChild(action);
    suggestEl.hidden = false;
  }

  var SIZE_TEXT = { '30': 'up to 30 agents', '100': 'up to 100 agents', '500': 'up to 500 agents', '1000': 'up to 1,000 agents', '3000': 'up to 3,000 agents', 'site': 'a site licence' };
  var SIZE_FLEET = { '30': 'Up to 30', '100': 'Up to 100', '500': 'Up to 500', '1000': 'Up to 1,000', '3000': 'Up to 3,000', 'site': 'More than 3,000' };

  function summaryText() {
    var s = selected();
    var mods = s.length ? s.map(function (id) { return NAME[id]; }).join(', ') : 'no modules selected yet';
    return 'Build your own, ' + (SIZE_TEXT[sizeEl.value] || SIZE_TEXT['30']) + ': ' + mods;
  }

  function render() {
    enforce();
    renderButtons();
    renderChosen();
    renderSuggest();
  }

  function toggle(id) {
    if (id === 'defence' && !hasPrereq()) return; // disabled
    if (sel[id]) {
      delete sel[id];
      setNote('');
    } else {
      sel[id] = true;
      if (id === 'network' && !sel.firewall) { sel.firewall = true; setNote('Firewall governance was selected too, so the network map has rules to check against.'); }
      else setNote('');
    }
    render();
  }

  MODULES.forEach(function (m) {
    var b = btns[m.id]; if (!b) return;
    b.addEventListener('click', function () {
      if (m.id === 'defence' && b.getAttribute('aria-disabled') === 'true') return;
      toggle(m.id);
    });
  });

  if (sizeEl) sizeEl.addEventListener('change', function () { /* size only feeds the quote */ });

  if (quoteEl) {
    quoteEl.addEventListener('click', function () {
      if (buildField) buildField.value = summaryText();
      if (fleetEl) {
        var want = SIZE_FLEET[sizeEl.value] || 'Up to 30';
        for (var i = 0; i < fleetEl.options.length; i++) { if (fleetEl.options[i].text === want) { fleetEl.selectedIndex = i; break; } }
      }
      // the anchor's href="#demo" scrolls to the (currently locked) quote form
    });
  }

  // Realistic starting state.
  sel = { compliance: true, firewall: true };
  render();
})();
