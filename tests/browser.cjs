// Browser test: loads eadm-generator.html in jsdom and drives it like a user.
// Part 1 — opaque origin (a file: URL): the DEL v0.1.0 localStorage bug.
// Every storage access must go through eadmSafeStorage(); this proves the
// app survives a blocked localStorage and the demo button works.
// Part 2 — theme toggle + logo: the toggle flips data-theme on the root,
// the dark page background is #000, the header stays brand blue, and the
// one white (wt) PBGC logo sits in the blue header in both themes.
// Part 3 — HeaderNav: skip link first, nav links (not buttons) with
// aria-current, hash links + hashchange, disclosure menu with Escape
// and focus return.
// Part 4 — Welcome and Help are their own pages: 3 nav links, the
// landing page shows only the E.Adm workflow, Try the demo from the
// Welcome page loads the demo and switches to the E.Adm view.
// Part 5 — persistence (http:// origin, storage works): a saved dark choice
// loads dark; toggling writes the choice back.
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

let failures = 0;
function check(name, ok, extra) {
  console.log((ok ? '  ok  ' : 'FAIL  ') + name + (extra !== undefined ? ' — ' + extra : ''));
  if (!ok) failures++;
}

const html = fs.readFileSync(path.join(__dirname, '..', 'eadm-generator.html'), 'utf8');
const ALT = 'Pension Benefit Guaranty Corporation';

function makeDom(url, beforeParse) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e && e.message || e)));
  vc.on('error', (...a) => errors.push(a.join(' ')));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url,
    virtualConsole: vc,
    pretendToBeVisual: true,
    beforeParse
  });
  return { dom, errors };
}

// ---- Parts 1 + 2: opaque origin (file: URL, localStorage throws) ----
const opaque = makeDom('file:///eadm-generator.html');

// ---- Part 3: storage works (http: origin), seeded dark ----
const stored = makeDom('http://localhost/', (window) => {
  window.localStorage.setItem('eadm-theme', 'dark');
});

// jsdom 27 does not resolve var() in computed background-color (it returns
// transparent), so background colors are checked on the CSS rules
// themselves, not on computed style. The toggle checks above prove the
// data-theme attribute flips; these prove the rules it flips between.
function cssRule(document, selector) {
  for (const sheet of document.styleSheets) {
    for (const r of sheet.cssRules) {
      if (r.selectorText === selector) return r;
    }
  }
  return null;
}
function cssVar(document, selector, name) {
  const r = cssRule(document, selector);
  return r ? r.style.getPropertyValue(name).trim() : null;
}

// PNG intrinsic size from a data URI (IHDR width/height, bytes 16-23).
function pngSize(src) {
  const b = Buffer.from(src.split(',')[1], 'base64');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// Media-query rules: find the @media block whose condition mentions `cond`
// and return its inner rules.
function mediaRules(document, cond) {
  for (const sheet of document.styleSheets) {
    for (const r of sheet.cssRules) {
      if (r.conditionText && r.conditionText.indexOf(cond) !== -1) return r.cssRules;
    }
  }
  return null;
}
function ruleText(rules, selector) {
  if (!rules) return '';
  for (const r of rules) {
    if (r.selectorText === selector) return r.cssText || '';
  }
  return '';
}

function done() {
  console.log(failures === 0 ? '\nBrowser tests passed' : '\nBrowser tests FAILED: ' + failures);
  process.exit(failures === 0 ? 0 : 1);
}

setTimeout(() => {
  try {
    const { window } = opaque.dom;
    const { document } = window;
    check('script survives evaluation on an opaque origin (no jsdom errors)', opaque.errors.length === 0, opaque.errors.join(' | '));
    check('EADM global exists', !!window.EADM);
    check('stepper rendered on load', document.getElementById('stepper').children.length === 5);
    check('starts on step 1', window.EADM.state.step === 1 && !document.getElementById('step-1').hidden);

    // ---- demo (Step 3 load-demo) ----
    const demoBtn = document.querySelector('[data-action="load-demo"]');
    check('demo button found', !!demoBtn);
    demoBtn.click();
    check('demo loads sections', !!window.EADM.state.sections && Object.keys(window.EADM.state.sections).length === 7);
    check('demo fills the case form', document.getElementById('f-caseNumber').value === '12345678');
    check('demo moves to Review (step 4)', window.EADM.state.step === 4);
    check('review box populated', document.getElementById('review-box').innerHTML.length > 500);
    check('step-4 visible, step-1 hidden', !document.getElementById('step-4').hidden && document.getElementById('step-1').hidden);
    check('review shows 7 approve checkboxes', document.querySelectorAll('[data-approve]').length === 7);
    check('step 5 blocked until all approved', document.getElementById('btn-to-step-5').disabled === true);

    // approve all 7 sections
    document.querySelectorAll('[data-approve]').forEach(cb => { cb.checked = true; cb.dispatchEvent(new window.Event('change', { bubbles: true })); });
    check('step 5 enabled after all 7 approved', document.getElementById('btn-to-step-5').disabled === false);

    // generate the memo
    document.getElementById('btn-to-step-5').click();
    check('step 5 shown', window.EADM.state.step === 5 && !document.getElementById('step-5').hidden);
    const genBtn = document.querySelector('[data-action="generate-docx"]');
    check('generate button found', !!genBtn);
    genBtn.click();
    check('memo generated', !!window.EADM.state.generated && window.EADM.state.generated.name === '12345678EAdm.docx');
    check('download button enabled after generate', document.querySelector('[data-action="download-docx"]').disabled === false);
    check('audit log has entries', window.EADM.state.audit.length >= 3, String(window.EADM.state.audit.length));

    // ---- theme toggle (opaque origin: no persistence, no crash) ----
    const toggle = document.getElementById('theme-toggle');
    check('theme toggle button exists in the header', !!toggle);
    check('toggle has an accessible label', toggle && toggle.getAttribute('aria-label') === 'Switch theme');
    check('starts in light theme', document.documentElement.getAttribute('data-theme') === 'light');
    check('light page background is white (CSS --bg #FFFFFF)', cssVar(document, ':root', '--bg') === '#FFFFFF', cssVar(document, ':root', '--bg'));
    toggle.click();
    check('toggle flips to dark', document.documentElement.getAttribute('data-theme') === 'dark');
    check('dark page background is #000 (CSS rule)', (function(){ var v = cssVar(document, ':root[data-theme="dark"] body', 'background'); return v === '#000000' || v === 'rgb(0, 0, 0)'; })());
    check('dark header stays brand blue', cssVar(document, '.topbar', 'background') === 'var(--blue)');
    toggle.click();
    check('toggle flips back to light', document.documentElement.getAttribute('data-theme') === 'light');

    // ---- logo ----
    const logo = document.getElementById('pbgc-logo');
    check('logo exists in the header', !!logo);
    check('logo alt text is the agency name', logo && logo.getAttribute('alt') === ALT);
    check('logo is a data URI (no fetch)', logo && logo.src.indexOf('data:image/png;base64,') === 0);
    const sz = pngSize(logo.src);
    check('logo is the horizontal white PBGC logo (751x251)', sz.w === 751 && sz.h === 251, sz.w + 'x' + sz.h);
    check('logo height 52px desktop (CSS)', (cssRule(document, '.topbar .logo') && cssRule(document, '.topbar .logo').style.height) === '52px');
    const mq = mediaRules(document, '640px');
    check('logo height 44px under 640px (CSS)', ruleText(mq, '.topbar .logo').indexOf('44px') >= 0);

    // ---- nav ----
    const links = Array.from(document.querySelectorAll('.nav-link'));
    check('3 nav links', links.length === 3, String(links.length));
    check('nav links are anchors with hash hrefs', links.every(a => a.tagName === 'A' && a.getAttribute('href').indexOf('#') === 0));
    check('E.Adm link is current on load', links[0].getAttribute('aria-current') === 'page');
    check('skip link is first in the body', document.body.firstElementChild.classList.contains('skip-link'));
    const menuBtn = document.getElementById('menu-toggle');
    check('menu toggle exists', !!menuBtn);
    menuBtn.click();
    check('menu opens', document.getElementById('views').classList.contains('open') && menuBtn.getAttribute('aria-expanded') === 'true');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check('Escape closes the menu and returns focus', !document.getElementById('views').classList.contains('open') && document.activeElement === menuBtn);

    // ---- hash routing: Welcome + Help ----
    window.location.hash = '#welcome';
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    check('Welcome view shows on #welcome', !document.getElementById('view-welcome').hidden && document.getElementById('view-eadm').hidden);
    check('Welcome link becomes current', links[1].getAttribute('aria-current') === 'page');
    const tryBtn = document.querySelector('[data-action="try-demo"]');
    check('Try the demo button exists on Welcome', !!tryBtn);
    tryBtn.click();
    check('Try the demo switches to the E.Adm view', !document.getElementById('view-eadm').hidden && document.getElementById('view-welcome').hidden);
    check('Try the demo loads the demo and goes to Review', window.EADM.state.step === 4);
    window.location.hash = '#help';
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    check('Help view shows on #help', !document.getElementById('view-help').hidden);
    check('Help names the 7 sections', document.getElementById('view-help').textContent.indexOf('Required Beginning Dates') >= 0 && document.getElementById('view-help').textContent.indexOf('Employee Contributions') >= 0);

    // ---- persistence (http: origin, storage works) ----
    const sWin = stored.dom.window;
    const sDoc = sWin.document;
    check('stored dark choice loads dark', sDoc.documentElement.getAttribute('data-theme') === 'dark', sDoc.documentElement.getAttribute('data-theme'));
    const sToggle = sDoc.getElementById('theme-toggle');
    sToggle.click();
    check('toggling to light writes the choice back', sWin.localStorage.getItem('eadm-theme') === 'light');
    sToggle.click();
    check('toggling to dark writes the choice back', sWin.localStorage.getItem('eadm-theme') === 'dark');

    done();
  } catch (e) {
    console.log('FAIL  exception: ' + (e && e.stack || e));
    failures++;
    done();
  }
}, 0);
