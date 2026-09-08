#!/usr/bin/env node
/* Audit fonctionnel du site : charge chaque page dans Chromium, collecte les
   erreurs JS, les requêtes en échec, les éléments clés manquants.

   Usage : node scripts/audit-site.mjs [base_url]        (défaut : serveur local) */
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = process.argv[2] || 'http://127.0.0.1:8799';
const CHROME = process.env.CHROME_BIN
  || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`;

/* Pages publiques (on exclut les écrans protégés, testés séparément) */
const SKIP = new Set(['admin-a2s00760.html', 'diag.html', 'moderation.html', 'homepage.html']);
const pages = [
  ...readdirSync('.').filter(f => f.endsWith('.html') && !SKIP.has(f)),
  ...readdirSync('en').filter(f => f.endsWith('.html')).map(f => 'en/' + f)
];

const port = 9600 + Math.floor(Math.random() * 300);
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${port}`, '--headless', '--disable-gpu', '--no-sandbox',
  '--window-size=1400,900', 'about:blank'
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++msgId;
  pending.set(id, { res, rej });
  ws.send(JSON.stringify({ id, method, params }));
});

const results = [];

try {
  /* connexion CDP */
  let targets, tries = 0;
  while (tries++ < 60) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      targets = await r.json();
      if (targets.length) break;
    } catch {}
    await sleep(200);
  }
  if (!targets?.length) throw new Error('Chromium injoignable');

  const { WebSocket } = await import('ws').catch(() => ({ WebSocket: globalThis.WebSocket }));
  ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

  let jsErrors = [], netFails = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      return m.error ? rej(new Error(m.error.message)) : res(m.result);
    }
    /* erreurs JS non capturées */
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      jsErrors.push((d.exception?.description || d.text || '').split('\n')[0].slice(0, 160));
    }
    /* console.error */
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      const t = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
      if (t.trim()) jsErrors.push('console: ' + t.slice(0, 160));
    }
    /* requêtes en échec */
    if (m.method === 'Network.loadingFailed' && !m.params.canceled) {
      netFails.push(m.params.errorText);
    }
    if (m.method === 'Network.responseReceived') {
      const { status, url } = m.params.response;
      if (status >= 400) netFails.push(`${status} ${url.replace(BASE, '')}`);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  for (const p of pages) {
    jsErrors = []; netFails = [];
    await send('Page.navigate', { url: `${BASE}/${p}` });
    await sleep(1200);
    /* nav.js et footer.js injectent après le chargement : on attend leur
       présence (ou 6 s) avant de sonder, sinon on signale des absences fausses. */
    for (let w = 0; w < 24; w++) {
      const r = await send('Runtime.evaluate', {
        expression: `!!document.querySelector('footer') && !!document.querySelector('nav')`,
        returnByValue: true
      });
      if (r.result.value) break;
      await sleep(200);
    }
    await sleep(400);

    const probe = await send('Runtime.evaluate', {
      expression: `(() => {
        const q = s => document.querySelector(s);
        return JSON.stringify({
          url:      location.pathname,
          titre:    (document.title||'').slice(0,70),
          nav:      !!q('header nav, .nav, #mainNav, nav'),
          footer:   !!q('footer'),
          h1:       document.querySelectorAll('h1').length,
          h1visibles: Array.from(document.querySelectorAll('h1')).filter(h => h.offsetParent !== null).length,
          canonical: !!q('link[rel=canonical]'),
          desc:     !!q('meta[name=description]'),
          liensVides: document.querySelectorAll('a[href=""], a:not([href])').length,
          imgSansAlt: document.querySelectorAll('img:not([alt])').length,
          boutonsVides: Array.from(document.querySelectorAll('button')).filter(b =>
                          !b.textContent.trim() && !b.querySelector('svg,img') && !b.getAttribute('aria-label')).length,
          iconesNonRendues: document.querySelectorAll('i[data-icon]:empty').length,
          formulaires: document.querySelectorAll('form').length,
          debordement: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
        });
      })()`, returnByValue: true
    });

    let info = {};
    try { info = JSON.parse(probe.result.value); } catch {}
    /* Une page protégée redirige vers login.html : ce n'est pas un défaut,
       mais auditer la page d'arrivée fausserait tout le rapport. */
    const attendu = '/' + p;
    info.redirige = info.url && info.url !== attendu ? info.url : null;
    results.push({ page: p, info, jsErrors: [...new Set(jsErrors)], netFails: [...new Set(netFails)] });
    process.stdout.write('.');
  }
  console.log('\n');
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
}

/* ── Rapport ── */
let problemes = 0;
const ligne = (p, msg) => { problemes++; console.log(`  ${p} : ${msg}`); };

console.log('═══ ERREURS JAVASCRIPT ═══');
let n = 0;
for (const r of results) for (const e of r.jsErrors) { ligne(r.page, e); n++; }
if (!n) console.log('  aucune');

console.log('\n═══ RESSOURCES EN ÉCHEC ═══');
n = 0;
for (const r of results) for (const f of r.netFails) { ligne(r.page, f); n++; }
if (!n) console.log('  aucune');

console.log('\n═══ STRUCTURE / SEO ═══');
n = 0;
for (const r of results) {
  const i = r.info;
  if (i.redirige) { console.log(`  ${r.page} : redirige vers ${i.redirige} (page protégée, non auditée)`); continue; }
  if (!i.titre) { ligne(r.page, 'titre absent'); n++; }
  if (!i.canonical) { ligne(r.page, 'canonical absent'); n++; }
  if (!i.desc) { ligne(r.page, 'meta description absente'); n++; }
  if (i.h1 === 0) { ligne(r.page, 'aucun h1'); n++; }
  /* Plusieurs h1 sont légitimes quand un seul est visible à la fois
     (login.html : onglets « connexion » / « inscription »). */
  if (i.h1 > 1 && i.h1visibles > 1) { ligne(r.page, `${i.h1visibles} balises h1 visibles`); n++; }
  if (!i.nav) { ligne(r.page, 'navigation non injectée'); n++; }
  if (!i.footer) { ligne(r.page, 'footer non injecté'); n++; }
}
if (!n) console.log('  aucun problème');

console.log('\n═══ ACCESSIBILITÉ / RENDU ═══');
n = 0;
for (const r of results) {
  const i = r.info;
  if (i.redirige) continue;
  if (i.iconesNonRendues) { ligne(r.page, `${i.iconesNonRendues} icône(s) non rendue(s)`); n++; }
  if (i.boutonsVides) { ligne(r.page, `${i.boutonsVides} bouton(s) sans libellé`); n++; }
  if (i.imgSansAlt) { ligne(r.page, `${i.imgSansAlt} image(s) sans alt`); n++; }
  if (i.liensVides) { ligne(r.page, `${i.liensVides} lien(s) sans href`); n++; }
  if (i.debordement) { ligne(r.page, 'débordement horizontal'); n++; }
}
if (!n) console.log('  aucun problème');

console.log(`\n${results.length} pages auditées — ${problemes} problème(s) relevé(s)`);
process.exit(0);
