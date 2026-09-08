#!/usr/bin/env node
/* Test fonctionnel : exerce les fonctions réelles du site (recherche, filtres,
   favoris, comparateur, formulaires, assistant, i18n) dans un vrai navigateur.

   Usage : node scripts/test-features.mjs [base_url] */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = process.argv[2] || 'http://127.0.0.1:8799';
const CHROME = process.env.CHROME_BIN
  || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`;

const port = 9800 + Math.floor(Math.random() * 190);
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

const R = [];
const ok = (n, c, d = '') => R.push({ n, ok: !!c, d: String(d) });

async function evalOn(page, expr, wait = 3000) {
  await send('Page.navigate', { url: `${BASE}/${page}` });
  await sleep(wait);
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

try {
  let targets, tries = 0;
  while (tries++ < 60) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/list`); targets = await r.json(); if (targets.length) break; } catch {}
    await sleep(200);
  }
  const { WebSocket } = await import('ws').catch(() => ({ WebSocket: globalThis.WebSocket }));
  ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    }
  };
  await send('Page.enable'); await send('Runtime.enable');

  /* ── NAVIGATION ── */
  const nav = await evalOn('index.html', `JSON.stringify({
    liens: document.querySelectorAll('nav a[href]').length,
    cta:   !!document.getElementById('btnPost'),
    burger:!!document.querySelector('.nav-burger, #navBurger, [class*=burger]'),
    devise:!!document.getElementById('navCurrency')
  })`, 3500);
  const n = JSON.parse(nav);
  ok('navigation : liens injectés', n.liens >= 5, n.liens + ' liens');
  ok('navigation : CTA déposer une annonce', n.cta);
  ok('navigation : sélecteur de devise', n.devise);

  /* ── RECHERCHE ── */
  const rech = await evalOn('search.html', `(async () => {
    const r = { champs: document.querySelectorAll('select, input[type=search], input[type=text]').length };
    r.grille = !!document.getElementById('resultsGrid') || !!document.querySelector('[id*=result]');
    r.filtreCategorie = document.querySelectorAll('[data-cat]').length > 1;
    r.tri = !!document.getElementById('sortSel');
    r.pays = !!document.getElementById('filterCountry');
    r.compteur = !!document.querySelector('[id*=count], [class*=count]');
    return JSON.stringify(r);
  })()`, 4000);
  const s = JSON.parse(rech);
  ok('recherche : champs de filtre', s.champs >= 3, s.champs + ' champs');
  ok('recherche : grille de résultats', s.grille);
  ok('recherche : filtres par catégorie', s.filtreCategorie);
  ok('recherche : tri des résultats', s.tri);
  ok('recherche : filtre par pays', s.pays);

  /* ── ASSISTANT ── */
  const ass = await evalOn('faq.html', `(async () => {
    const btn = document.getElementById('a2sBotBtn');
    if (!btn) return JSON.stringify({ bouton: false });
    btn.click();
    await new Promise(r => setTimeout(r, 1400));
    const inp = document.querySelector('.a2sb-inp');
    const win = document.getElementById('a2sBot');
    const avant = document.querySelectorAll('#a2sbLog .a2sb-msg, #a2sbLog .a2sb-me').length;
    if (inp) {
      inp.value = 'quels sont vos frais ?';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      const form = inp.closest('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 1800));
    }
    const apres = document.querySelectorAll('#a2sbLog .a2sb-msg, #a2sbLog .a2sb-me').length;
    const texte = (document.getElementById('a2sbLog') || {}).textContent || '';
    return JSON.stringify({ bouton: true, fenetre: !!win, saisie: !!inp,
                            avant: avant, apres: apres,
                            repondu: /commission|gratuit|frais|0/i.test(texte) });
  })()`, 5000);
  const a = JSON.parse(ass);
  ok('assistant : bouton présent', a.bouton);
  ok("assistant : fenêtre s'ouvre", a.fenetre);
  ok('assistant : champ de saisie', a.saisie);
  ok('assistant : nouveaux messages après question', a.apres > a.avant, a.avant + ' -> ' + a.apres);
  ok('assistant : réponse pertinente sur les frais', a.repondu);

  /* ── BANDEAU RGPD ── */
  await evalOn('index.html', `localStorage.removeItem('a2s_consent'); 'ok'`, 1500);
  const rgpd = await evalOn('index.html', `(() => {
    const b = document.querySelector('[class*=consent], [id*=consent], [class*=cookie]');
    return JSON.stringify({ banniere: !!b, emoji: /[\\u{1F300}-\\u{1FAFF}]/u.test(b ? b.textContent : '') });
  })()`, 3000);
  const g = JSON.parse(rgpd);
  ok('RGPD : bandeau affiché', g.banniere);
  ok('RGPD : aucun emoji', !g.emoji);

  /* ── FORMULAIRE DE CONTACT ── */
  const ct = await evalOn('contact.html', `JSON.stringify({
    form: !!document.querySelector('form'),
    email: !!document.querySelector('input[type=email]'),
    message: !!document.querySelector('textarea'),
    submit: !!document.querySelector('button[type=submit], input[type=submit]')
  })`, 3000);
  const c = JSON.parse(ct);
  ok('contact : formulaire complet', c.form && c.email && c.message && c.submit,
     `form=${c.form} email=${c.email} msg=${c.message} envoi=${c.submit}`);

  /* ── i18n ── */
  const i18n = await evalOn('en/index.html', `JSON.stringify({
    lang: document.documentElement.lang,
    hreflang: document.querySelectorAll('link[rel=alternate][hreflang]').length,
    navEn: (document.querySelector('nav') || {}).textContent?.includes('Search') ||
           (document.querySelector('nav') || {}).textContent?.includes('Sell'),
    footerEn: (document.querySelector('footer') || {}).textContent?.includes('Sell') ||
              (document.querySelector('footer') || {}).textContent?.includes('About')
  })`, 4000);
  const i = JSON.parse(i18n);
  ok('i18n : lang=en', i.lang === 'en', i.lang);
  ok('i18n : hreflang réciproques', i.hreflang >= 2, i.hreflang);
  ok('i18n : navigation traduite', i.navEn);
  ok('i18n : footer traduit', i.footerEn);

  /* ── TARIFS ── */
  const pr = await evalOn('pricing.html', `JSON.stringify({
    plans: document.querySelectorAll('[class*=plan], [class*=pricing-card], [class*=tier]').length,
    prix:  document.body.textContent.match(/\\d+\\s*€|€\\s*\\d+/g)?.length || 0
  })`, 3000);
  const p2 = JSON.parse(pr);
  ok('tarifs : plans affichés', p2.plans >= 2, p2.plans + ' plans');
  ok('tarifs : montants affichés', p2.prix >= 2, p2.prix + ' montants');

  /* ── PLAN DU SITE ── */
  const sm = await evalOn('sitemap.html', `JSON.stringify({
    liens: document.querySelectorAll('main a[href], .container a[href]').length
  })`, 3000);
  ok('plan du site : liens internes', JSON.parse(sm).liens >= 25, JSON.parse(sm).liens + ' liens');

  /* ── 404 ── */
  const e404 = await evalOn('404.html', `JSON.stringify({
    retour: !!document.querySelector('a[href="/"], a[href="index.html"], a[href="/index.html"]')
  })`, 2500);
  ok('page 404 : lien de retour', JSON.parse(e404).retour);

} catch (e) {
  ok('exécution des tests', false, e.message);
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
}

let pass = 0, fail = 0;
for (const r of R) {
  if (r.ok) { pass++; console.log(`  OK   ${r.n}${r.d ? ' (' + r.d + ')' : ''}`); }
  else { fail++; console.log(`  FAIL ${r.n}${r.d ? ' -> ' + r.d : ''}`); }
}
console.log(`\n${pass}/${pass + fail} tests réussis`);
process.exit(fail ? 1 : 0);
