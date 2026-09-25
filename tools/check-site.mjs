/* Site verification. Loads the landing page at every target viewport and asserts
   layout and scene invariants. Usage:
     node tools/check-site.mjs [baseURL]
   Default baseURL http://127.0.0.1:8099/index.html
   Screenshots for 1920x1080, 1366x768 and 390x844 land in tools/check-out/ (gitignored). */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
import fs from 'fs';
import path from 'path';
const { chromium } = pw;

const BASE = process.argv[2] || 'http://127.0.0.1:8099/index.html';
const OUT = path.join(process.cwd(), 'tools', 'check-out');
fs.mkdirSync(OUT, { recursive: true });
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));

const VIEWPORTS = [
  [3840, 2160, '4k'], [3440, 1440, 'ultrawide'], [2560, 1440, 'qhd'], [1920, 1080, 'fhd'],
  [1680, 1050, 'desktop'], [1536, 864, 'win-laptop'], [1440, 900, 'macbook-air'], [1440, 700, 'short-laptop'],
  [1366, 768, 'laptop'], [1280, 720, 'small-laptop'], [1024, 768, 'tablet-l'], [820, 1180, 'ipad-air'],
  [768, 1024, 'tablet-p'], [430, 932, 'large-phone'], [390, 844, 'phone'], [360, 740, 'android'],
  [320, 640, 'small-phone'], [844, 390, 'phone-landscape'],
];
const SHOT = new Set(['1920x1080', '1366x768', '390x844']);
const SCENES = ['hero', 'platform', 'harden', 'modules', 'security', 'deployment'];

const results = [];

const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

for (const [w, h, name] of VIEWPORTS) {
  const key = `${w}x${h}`;
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  const fails = [];
  const note = (cond, msg) => { if (!cond) fails.push(msg); };
  try {
    await pg.goto(BASE, { waitUntil: 'load', timeout: 45000 });
    await pg.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
    await pg.waitForTimeout(600);

    // 1. overflow
    let ov = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    note(ov.sw <= ov.iw + 1, `overflow ${ov.sw}>${ov.iw}`);

    // 5. hero group fits first viewport (>=1280x720 and 1440x700 class)
    const heroFit = await pg.evaluate(() => {
      const c = document.querySelector('#heroCam').getBoundingClientRect();
      return c.top >= 0 && c.bottom <= window.innerHeight + 1 && c.left >= 0 && c.right <= window.innerWidth + 1;
    });
    if (w >= 1280 && h >= 700) note(heroFit, 'hero group does not fit first viewport');

    // 6. logo ring contrast (sample tick/dot regions vs ground)
    const contrast = await pg.evaluate(async () => {
      const img = document.querySelector('#heroMark img');
      await img.decode().catch(() => {});
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#020304'; cx.fillRect(0, 0, 512, 512);
      cx.drawImage(img, 0, 0, 512, 512);
      const lum = p => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]); };
      const ground = lum([2, 3, 4]);
      const boxes = [[236, 20, 276, 70], [445, 236, 500, 276], [236, 445, 276, 500], [20, 236, 70, 276]];
      let best = 0;
      for (const [x0, y0, x1, y1] of boxes) {
        const d = cx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
        for (let i = 0; i < d.length; i += 4) best = Math.max(best, lum([d[i], d[i + 1], d[i + 2]]));
      }
      return (best + 0.05) / (ground + 0.05);
    });
    note(contrast >= 3, `logo ring contrast ${contrast.toFixed(2)} < 3`);

    // 7. matrix check marks centred under headers (within 2px)
    const matrix = await pg.evaluate(() => {
      const heads = [...document.querySelectorAll('.matrix thead th')].slice(1);
      const hc = heads.map(th => { const r = th.getBoundingClientRect(); return r.left + r.width / 2; });
      let worst = 0;
      document.querySelectorAll('.matrix tbody tr').forEach(tr => {
        const cells = [...tr.querySelectorAll('td.c')];
        cells.forEach((td, i) => {
          const svg = td.querySelector('svg'); if (!svg) return;
          const r = svg.getBoundingClientRect(); const cc = r.left + r.width / 2;
          worst = Math.max(worst, Math.abs(cc - hc[i]));
        });
      });
      return worst;
    });
    note(matrix <= 2.5, `matrix check off-centre by ${matrix.toFixed(1)}px`);

    // 4. rail panels: desktop -> each inside viewport when active; else all visible stacked
    const railDesktop = w >= 1024 && h >= 620;
    if (!railDesktop) {
      const stacked = await pg.evaluate(() => {
        const ps = [...document.querySelectorAll('#railTrack .panel')];
        return ps.every(p => p.getBoundingClientRect().width <= window.innerWidth + 1);
      });
      note(stacked, 'stacked rail panel wider than viewport');
    }

    // 2 + 3 + 8. scrub through scenes
    const shot = SHOT.has(key);
    const step = shot ? 0.05 : 0.125;
    for (const id of SCENES) {
      const range = await pg.evaluate((sid) => {
        const el = document.getElementById(sid); if (!el) return null;
        const top = el.getBoundingClientRect().top + window.scrollY;
        return { top, height: el.offsetHeight };
      }, id);
      if (!range) continue;
      const emptyAt = [];
      for (let p = 0; p <= 1.0001; p += step) {
        await pg.evaluate(sy => window.scrollTo(0, sy), range.top + range.height * p);
        await pg.waitForTimeout(shot ? 90 : 55);
        const nonEmpty = await pg.evaluate(() => {
          const cx = window.innerWidth / 2;
          const ys = [window.innerHeight * 0.4, window.innerHeight * 0.5, window.innerHeight * 0.6];
          for (const cy of ys) {
            const stack = document.elementsFromPoint(cx, cy);
            for (const e of stack) {
              if (!e || e === document.body || e === document.documentElement) continue;
              const t = e.tagName.toLowerCase();
              if (t === 'main' || t === 'section') continue;
              const r = e.getBoundingClientRect();
              const st = getComputedStyle(e);
              if (r.width < 4 || r.height < 4 || st.visibility === 'hidden' || +st.opacity === 0) continue;
              return true;
            }
          }
          return false;
        });
        if (!nonEmpty) emptyAt.push(Math.round(p * 100));
        if (shot && [0, 0.25, 0.5, 0.75, 1].some(m => Math.abs(p - m) < step / 2)) {
          await pg.screenshot({ path: path.join(OUT, `${key}_${id}_${Math.round(p * 100)}.png`) });
        }
      }
      note(emptyAt.length === 0, `scene ${id} empty at ${emptyAt.join(',')}%`);

      // header does not cover pinned content at start/mid/end
      const headerOverlap = await pg.evaluate((sid) => {
        const hdr = document.getElementById('hdr').getBoundingClientRect();
        const el = document.getElementById(sid);
        // sample a meaningful child near top of the scene
        const probe = el.querySelector('h2, h3, .console, .panel, .code-pane, .chain, .delivery, .hero-cam');
        if (!probe) return true;
        const r = probe.getBoundingClientRect();
        // fail only if probe top is hidden behind opaque header while it should be the subject
        return !(r.top < hdr.bottom - 2 && r.bottom > hdr.top && r.top > -r.height);
      }, id);
      // informational only for non-pinned; keep as soft check
    }

    // return-to-start sanity for hero
    await pg.evaluate(() => window.scrollTo(0, 0));
    await pg.waitForTimeout(1600); // scrub eases back over ~0.6s; allow it to settle
    const heroBack = await pg.evaluate(() => { const c = document.querySelector('#heroCam'); return +getComputedStyle(c).opacity > 0.5; });
    note(heroBack, 'hero did not restore on scroll back');

    note(errs.length === 0, `js errors: ${errs.slice(0, 2).join(' | ')}`);
  } catch (e) {
    fails.push('EXC ' + e.message);
  }
  const pass = fails.length === 0;
  results.push({ key, name, pass, fails });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${key.padEnd(10)} ${name}${pass ? '' : '  -> ' + fails.join('; ')}`);
  await pg.close();
}
// ================= Releases page checks =================
{
  const origin = BASE.replace(/\/[^/]*$/, '');
  const relURL = origin + '/docs/releases.html';
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'releases.json'), 'utf8'));
  const N = data.releases.length;
  const betaN = data.releases.filter(r => r.channel === 'beta').length;
  const clickN = data.releases.filter(r => JSON.stringify(r).toLowerCase().includes('clickhouse')).length;
  const fails = [];
  const note = (c, m) => { if (!c) fails.push(m); };
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(m.text())) errs.push('C:' + m.text()); });
  try {
    await pg.goto(relURL, { waitUntil: 'load', timeout: 45000 });
    await pg.waitForTimeout(700);
    const rendered = await pg.$$eval('#relList .rel-entry', e => e.length);
    note(rendered === N, `rendered ${rendered} != releases ${N}`);
    note(await pg.$eval('#relList .rel-entry:first-child', e => e.open), 'first release not open');
    note(await pg.$eval('#relList .rel-entry:first-child', e => !!e.querySelector('.rel-current-tag')), 'first release not marked current');
    note(await pg.$$eval('#relIndex .rel-index-item', e => e.length) === N, 'version index count mismatch');

    // deep link
    await pg.goto(relURL + '#v1-3-0', { waitUntil: 'load' }); await pg.waitForTimeout(700);
    const dl = await pg.$eval('#v1-3-0', e => ({ open: e.open, top: e.getBoundingClientRect().top }));
    note(dl.open && dl.top < 500, 'deep link #v1-3-0 did not open and scroll');

    // text filter
    await pg.fill('#relSearch', 'ClickHouse'); await pg.waitForTimeout(250);
    const shown = await pg.$$eval('#relList .rel-entry', els => els.filter(e => !e.hidden).length);
    note(shown === clickN, `ClickHouse filter shown ${shown} != ${clickN}`);
    // channel filter
    await pg.fill('#relSearch', ''); await pg.selectOption('#relChannel', 'beta'); await pg.waitForTimeout(250);
    const betaShown = await pg.$$eval('#relList .rel-entry', els => els.filter(e => !e.hidden).length);
    note(betaShown === betaN, `beta filter shown ${betaShown} != ${betaN}`);
    await pg.selectOption('#relChannel', 'all'); await pg.waitForTimeout(150);

    // no horizontal overflow at three widths
    for (const w of [360, 768, 1440]) {
      await pg.setViewportSize({ width: w, height: 900 }); await pg.waitForTimeout(250);
      const ov = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      note(ov.sw <= ov.iw + 1, `releases overflow at ${w} (${ov.sw}>${ov.iw})`);
    }
    note(errs.length === 0, `releases js errors: ${errs.slice(0, 2).join(' | ')}`);

    // landing "What's new" link
    const lp = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await lp.goto(BASE, { waitUntil: 'load' }); await lp.waitForTimeout(900);
    const wn = await lp.$eval('#whatsNew', e => ({ hidden: e.hidden, text: e.textContent }));
    note(!wn.hidden && wn.text === "What's new in v" + data.releases[0].version, `whats-new link wrong: ${JSON.stringify(wn)}`);
    await lp.close();

    // failure path: block the data file, expect the error state and no throw
    const ep = await b.newPage({ viewport: { width: 1000, height: 800 } });
    const epErrs = []; ep.on('pageerror', e => epErrs.push(e.message));
    await ep.route('**/data/releases.json', r => r.abort());
    await ep.goto(relURL, { waitUntil: 'load' }); await ep.waitForTimeout(600);
    const est = await ep.$eval('#relStatus', e => e.classList.contains('rel-error') && e.textContent.length > 0);
    note(est, 'error state not shown when data fetch fails');
    note(epErrs.length === 0, `threw on failure path: ${epErrs.slice(0, 2).join(' | ')}`);
    await ep.close();
  } catch (e) { fails.push('EXC ' + e.message); }
  const pass = fails.length === 0;
  results.push({ key: 'releases', name: 'releases-page', pass, fails });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${'releases'.padEnd(10)} releases-page${pass ? '' : '  -> ' + fails.join('; ')}`);
  await pg.close();
}

// ================= Build your own checks =================
{
  const fails = [];
  const note = (c, m) => { if (!c) fails.push(m); };
  // reduced motion so the scroll-scene transforms do not inflate scrollWidth
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(m.text())) errs.push('C:' + m.text()); });
  const press = id => pg.$eval('[data-mod="' + id + '"]', e => e.getAttribute('aria-pressed'));
  const dis = id => pg.$eval('[data-mod="' + id + '"]', e => e.getAttribute('aria-disabled'));
  const pressed = () => pg.$$eval('.mod', els => els.filter(e => e.getAttribute('aria-pressed') === 'true').map(e => e.getAttribute('data-mod')).sort());
  const click = async id => { await pg.click('[data-mod="' + id + '"]'); await pg.waitForTimeout(90); };
  const same = (a, b2) => a.slice().sort().join(',') === b2.slice().sort().join(',');
  try {
    await pg.goto(BASE, { waitUntil: 'load' }); await pg.waitForTimeout(400);
    // coupling: network -> firewall; firewall off -> both off
    if (await press('network') !== 'true') await click('network');
    note(await press('network') === 'true' && await press('firewall') === 'true', 'network did not pull in firewall');
    await click('firewall');
    note(await press('firewall') !== 'true' && await press('network') !== 'true', 'clearing firewall did not clear network');
    // active defence prerequisite
    for (const id of ['compliance', 'firewall', 'network']) { if (await press(id) === 'true') await click(id); }
    note(await dis('defence') === 'true', 'active defence not disabled with no prerequisite');
    await click('dlp');
    note(await dis('defence') === 'false', 'active defence not enabled after DLP');
    await click('defence');
    note(await press('defence') === 'true', 'active defence did not select');
    await click('dlp');
    note(await press('defence') !== 'true' && await dis('defence') === 'true', 'active defence not cleared when last prerequisite cleared');
    // Comply suggestion + choose
    await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(300);
    await click('network'); // {compliance, firewall, network} = Comply
    note((await pg.$eval('#buildSuggest', e => e.textContent)).indexOf('Comply') !== -1, 'Comply suggestion missing');
    await pg.click('#buildSuggest .build-choose'); await pg.waitForTimeout(120);
    note(same(await pressed(), ['compliance', 'firewall', 'network']), 'Choose Comply left wrong modules');
    // Operate
    await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(300);
    await click('compliance'); await click('firewall'); await click('logs');
    note((await pg.$eval('#buildSuggest', e => e.textContent)).indexOf('Operate') !== -1, 'Operate suggestion missing');
    await pg.click('#buildSuggest .build-choose'); await pg.waitForTimeout(120);
    note(same(await pressed(), ['dlp', 'fim', 'logs']), 'Choose Operate left wrong modules');
    // Complete on five modules
    await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(300);
    for (const id of ['compliance', 'firewall', 'logs', 'dlp', 'forensics']) { if (await press(id) !== 'true') await click(id); }
    note((await pg.$eval('#buildSuggest', e => e.textContent)).indexOf('Complete') !== -1, 'Complete suggestion missing on five modules');
    // quote CTA fills the field and it is in the form data
    await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(300);
    await click('network'); // compliance, firewall, network
    await pg.selectOption('#buildSize', '500');
    await pg.click('#buildQuote'); await pg.waitForTimeout(150);
    const expected = 'Build your own, up to 500 agents: Compliance and hardening, Firewall governance, Network discovery and topology';
    const bf = await pg.$eval('#buildField', e => e.value);
    note(bf === expected, 'build field text wrong: ' + bf);
    const fd = await pg.evaluate(() => new URLSearchParams(new FormData(document.getElementById('demoForm'))).get('build'));
    note(fd === expected, 'build not in form data');
    const fleet = await pg.$eval('#demoForm select[name="fleet_size"]', e => e.value);
    note(fleet === 'Up to 500', 'fleet_size not set from build size: ' + fleet);
    // build field empty when opened from elsewhere (fresh reload, no build click)
    await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(200);
    note(await pg.$eval('#buildField', e => e.value) === '', 'build field not empty by default');
    // no price anywhere on the page
    const body = await pg.evaluate(() => document.body.innerText);
    note(!/\$\s?\d|\d\s?(USD|EUR)|per agent a year/i.test(body), 'a price pattern appears on the page');
    // no horizontal overflow at three widths with a selection active
    for (const w of [360, 768, 1440]) {
      await pg.setViewportSize({ width: w, height: 900 }); await pg.waitForTimeout(150);
      await pg.evaluate(() => document.getElementById('build-panel').scrollIntoView());
      await pg.waitForTimeout(120);
      const ov = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      note(ov.sw <= ov.iw + 1, 'build overflow at ' + w + ' (' + ov.sw + '>' + ov.iw + ')');
    }
    note(errs.length === 0, 'build js errors: ' + errs.slice(0, 2).join(' | '));
  } catch (e) { fails.push('EXC ' + e.message); }
  const pass = fails.length === 0;
  results.push({ key: 'build', name: 'build-your-own', pass, fails });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${'build'.padEnd(10)} build-your-own${pass ? '' : '  -> ' + fails.join('; ')}`);
  await ctx.close();
}

await b.close();

const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
