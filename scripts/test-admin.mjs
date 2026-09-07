#!/usr/bin/env node
/* Test fonctionnel de l'admin : 10 onglets, palette, tri, pagination,
   sélection multiple. Injecte un jeu de données puis vérifie le rendu.
   Usage : node scripts/test-admin.mjs [url] */
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_ADMIN = process.argv[2] || 'http://127.0.0.1:8799/admin-a2s00760.html';
const CHROME = process.env.CHROME_BIN
  || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`;

const SEED = `
document.getElementById('loginWrap').classList.add('hidden');
document.getElementById('app').classList.add('visible');
var cats=['light','jet','turbo','heli','ulm','airliner'];
var st=['pending','live','rejected'];
_allListings=[];
for(var i=1;i<=68;i++){
  _allListings.push({id:i,make:['Cirrus','Cessna','Daher','Robinson','Tecnam','Piper'][i%6],
   model:['SR22','CJ3+','TBM 940','R44','P2008','PA-28'][i%6],year:2000+(i%25),
   price:50000+i*13700,currency:'EUR',category:cats[i%6],status:st[i%3],
   sellerName:'Vendeur '+i,sellerEmail:'v'+i+'@example.eu',
   submittedAt:new Date(Date.now()-i*86400000).toISOString(),views:i*3});
}
_allUsers=[];
for(var j=1;j<=42;j++){
  _allUsers.push({id:100+j,name:'Membre '+j,email:'m'+j+'@example.eu',
   plan:['Essentiel','Aviateur','Pro'][j%3],status:'active',
   registeredAt:new Date(Date.now()-j*172800000).toISOString(),is_free:j%7===0});
}
`;

const TEST = `
(function(){
  var R=[];
  function ok(n,c,d){ R.push({n:n, ok:!!c, d:d===undefined?'':String(d)}); }
  var jsErrors=[];
  window.onerror=function(m){ jsErrors.push(String(m)); };

  ${SEED}
  updateDashboard(); updateSidebar(); updateSidebarBadges();

  // 1. Les 10 onglets s'affichent sans erreur
  var TABS=['dash','mod','list','new','users','verif','subs','stats','msgs','set'];
  TABS.forEach(function(t){
    try{
      showTab(t, document.getElementById('sn-'+t));
      var sec=document.getElementById('tab-'+t);
      ok('onglet '+t, sec && getComputedStyle(sec).display!=='none');
    }catch(e){ ok('onglet '+t, false, e.message); }
  });

  // 2. Compteurs de la barre latérale (cassés en v2 : ids absents du markup)
  ok('compteur annonces', document.getElementById('sk-ann').textContent==='68', document.getElementById('sk-ann').textContent);
  ok('compteur a moderer', document.getElementById('sk-pnd').textContent==='22', document.getElementById('sk-pnd').textContent);
  ok('compteur membres', document.getElementById('sk-usr').textContent==='42', document.getElementById('sk-usr').textContent);
  ok('MRR calcule', parseInt(document.getElementById('sk-mrr').textContent,10)>0, document.getElementById('sk-mrr').textContent);
  ok('pastille moderation', document.getElementById('badge-mod').textContent==='22', document.getElementById('badge-mod').textContent);
  ok('alerte topbar visible', getComputedStyle(document.getElementById('btn-alert')).display!=='none');

  // 3. Pagination (absente en v2 : 68 lignes rendues d'un coup)
  showTab('list', document.getElementById('sn-list')); renderList();
  ok('pagination 25 lignes', document.querySelectorAll('#list-body tr').length===25, document.querySelectorAll('#list-body tr').length);
  ok('pager 3 pages', /Page 1 \\/ 3/.test(document.getElementById('pager-list').textContent));
  goPage('list',2);
  ok('page 2 accessible', /Page 2 \\/ 3/.test(document.getElementById('pager-list').textContent));
  goPage('list',1);

  // 4. Sélection multiple + actions groupées (absentes en v2)
  var boxes=document.querySelectorAll('#tab-list .row-check input[data-id]');
  boxes[0].click(); boxes[1].click(); boxes[2].click();
  ok('3 lignes selectionnees', selectedIds('list').length===3, selectedIds('list').length);
  ok('barre groupee affichee', getComputedStyle(document.getElementById('bulk-list')).display!=='none');
  ok('lignes surlignees', document.querySelectorAll('#list-body tr.is-selected').length===3);
  // la sélection survit à un changement de page
  goPage('list',2); goPage('list',1);
  ok('selection conservee', selectedIds('list').length===3, selectedIds('list').length);
  clearSelection('list');
  ok('selection videe', selectedIds('list').length===0);

  // 5. Tri des colonnes (absent en v2)
  sortBy('list','price');
  var p1=document.querySelectorAll('#list-body tr td:nth-child(4)')[0].textContent;
  sortBy('list','price');
  var p2=document.querySelectorAll('#list-body tr td:nth-child(4)')[0].textContent;
  ok('tri par prix inverse l ordre', p1!==p2, p1+' vs '+p2);

  // 6. Palette de commandes (Ctrl+K)
  openCmdk();
  ok('palette ouverte', document.getElementById('cmdk').classList.contains('open'));
  ok('commandes listees', document.querySelectorAll('#cmdkList .cmdk-item').length>=15,
     document.querySelectorAll('#cmdkList .cmdk-item').length);
  renderCmdk('export');
  ok('filtre palette', document.querySelectorAll('#cmdkList .cmdk-item').length===2,
     document.querySelectorAll('#cmdkList .cmdk-item').length);
  renderCmdk('moder');   // sans accent -> doit trouver "Modération"
  ok('filtre insensible aux accents', document.querySelectorAll('#cmdkList .cmdk-item').length>=1);
  closeCmdk();
  ok('palette fermee', !document.getElementById('cmdk').classList.contains('open'));

  // 7. Membres : tri + pagination
  showTab('users', document.getElementById('sn-users')); renderUsers();
  ok('membres pagines', document.querySelectorAll('#users-body tr').length===25,
     document.querySelectorAll('#users-body tr').length);
  sortBy('users','name');
  ok('tri membres sans erreur', document.querySelectorAll('#users-body tr').length>0);

  // 8. Éléments morts en v2, désormais alimentés
  showTab('stats', document.getElementById('sn-stats'));
  ok('conteneur villes present', !!document.getElementById('st-cities'));
  ok('ancre filtre vendeur presente', !!document.getElementById('ls-header'));

  // 9. Aucune icône vide
  showTab('list', document.getElementById('sn-list')); renderList();
  var emptyBtns=0;
  document.querySelectorAll('#tab-list .act').forEach(function(b){
    if(!b.querySelector('svg') && !b.textContent.trim()) emptyBtns++;
  });
  ok('aucun bouton vide', emptyBtns===0, emptyBtns);
  ok('icones rendues', document.querySelectorAll('svg').length>50, document.querySelectorAll('svg').length);

  // 11. Toast avec annulation (remplace les confirm() sur actions réversibles)
  var annule = false;
  toastUndo('Test', function(){ annule = true; });
  var toastEl = document.getElementById('toast');
  ok('toast annulable affiche', toastEl.classList.contains('show'));
  ok('bouton annuler present', !!toastEl.querySelector('.t-undo'));
  toastEl.querySelector('.t-undo').click();
  ok('annulation executee', annule === true);
  ok('toast referme apres annulation', !toastEl.classList.contains('show'));
  // un toast simple ne doit pas laisser un bouton orphelin
  toastUndo('Avec annulation', function(){});
  showToast('Message simple');
  ok('toast simple nettoie le bouton', !toastEl.querySelector('.t-undo'));

  ok('aucune erreur JS', jsErrors.length===0, jsErrors.join(' | '));

  // 10. Recherche globale (v2 : basculait d'onglet à chaque frappe)
  return new Promise(function(resolve){
    onGlobalSearch('c');                       // <2 caractères : ne doit rien faire
    var tabAvant = CURRENT_TAB;
    setTimeout(function(){
      ok('recherche ignore 1 caractere', CURRENT_TAB===tabAvant, CURRENT_TAB);
      onGlobalSearch('Cessna');
      setTimeout(function(){
        ok('recherche annonce ouvre l onglet', CURRENT_TAB==='list', CURRENT_TAB);
        onGlobalSearch('Membre 3');
        setTimeout(function(){
          ok('repli sur les membres', CURRENT_TAB==='users', CURRENT_TAB);
          showTab('dash', document.getElementById('sn-dash'));
          resolve(JSON.stringify(R));
        }, 600);
      }, 600);
    }, 600);
  });
})()
`;

/* ── pilotage CDP minimal (Playwright absent de l'environnement) ── */
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${port}`, '--headless', '--disable-gpu', '--no-sandbox',
  '--window-size=1400,900', 'about:blank'
], { stdio: 'ignore' });

let ws, id = 0;
const pending = new Map();
function send(method, params = {}, sessionId) {
  return new Promise((res, rej) => {
    const m = ++id;
    pending.set(m, { res, rej });
    ws.send(JSON.stringify({ id: m, method, params, sessionId }));
  });
}

try {
  let targets, tries = 0;
  while (tries++ < 60) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      targets = await r.json();
      if (targets.length) break;
    } catch { /* le navigateur n'écoute pas encore */ }
    await sleep(200);
  }
  if (!targets?.length) throw new Error('Chrome injoignable sur le port CDP');

  const { WebSocket } = await import('ws').catch(() => ({ WebSocket: globalThis.WebSocket }));
  ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: URL_ADMIN });
  await sleep(2600);

  const out = await send('Runtime.evaluate', {
    expression: TEST, returnByValue: true, awaitPromise: true
  });
  if (out.exceptionDetails) {
    console.error('EXCEPTION :', out.exceptionDetails.exception?.description || out.exceptionDetails.text);
    process.exit(1);
  }

  const results = JSON.parse(out.result.value);
  let pass = 0, fail = 0;
  for (const r of results) {
    if (r.ok) { pass++; console.log(`  OK   ${r.n}${r.d ? ' (' + r.d + ')' : ''}`); }
    else { fail++; console.log(`  FAIL ${r.n}${r.d ? ' -> ' + r.d : ''}`); }
  }
  console.log(`\n${pass}/${pass + fail} tests réussis`);
  process.exit(fail ? 1 : 0);
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
}
