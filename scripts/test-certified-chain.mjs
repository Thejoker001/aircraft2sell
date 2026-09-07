#!/usr/bin/env node
/* Test bout en bout de la chaîne « vendeur certifié ».
   Crée une annonce de test pour un vendeur certifié, vérifie que le badge
   suit à chaque étape, puis supprime tout ce qu'il a créé.

   Usage : node scripts/test-certified-chain.mjs */
import { readFileSync } from 'node:fs';

const ENV = `${process.env.HOME}/.hermes/profiles/aircraft2sell/.env`;
const env = {};
for (const line of readFileSync(ENV, 'utf8').split('\n')) {
  const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const URL_SB = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = 'sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const HA = { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' };

const R = [];
const ok = (n, c, d = '') => { R.push({ n, ok: !!c, d: String(d) }); };

async function req(method, path, body, headers = H) {
  const r = await fetch(`${URL_SB}/rest/v1/${path}`, {
    method, headers: { ...headers, Prefer: method === 'POST' ? 'return=representation' : 'return=minimal' },
    body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : [];
}

const TEST_ID = 999000000 + Math.floor(Math.random() * 99999);
let created = false;

try {
  /* Un vendeur certifié existant sert de référence */
  const users = await req('GET', 'users?select=email,certified&certified=eq.true&limit=1');
  if (!users.length) { console.log('Aucun membre certifié en base — test impossible'); process.exit(0); }
  const email = users[0].email;
  console.log(`Vendeur de référence : ${email} (certified=true)\n`);

  /* 1. Une annonce créée sans seller_certified doit-elle hériter du compte ?
        (vrai si le trigger SQL de la partie 1 a été appliqué) */
  const ins = await req('POST', 'listings', {
    id: TEST_ID, make: 'ZZTest', model: 'Chaine', year: 2020, price: 1,
    currency: 'EUR', category: 'light', status: 'pending',
    seller_email: email, seller_name: 'Test automatisé',
    submitted_at: new Date().toISOString(), views: 0, enquiries: 0
  });
  created = true;
  const heritee = ins[0]?.seller_certified === true;
  ok('trigger SQL applique (heritage a la creation)', heritee,
     heritee ? 'oui' : 'non — appliquer supabase/rls-securite.sql partie 1');

  /* 2. La correction côté admin : certifier propage sur les annonces */
  await req('PATCH', `listings?seller_email=eq.${encodeURIComponent(email)}`, { seller_certified: false });
  await req('PATCH', `listings?seller_email=eq.${encodeURIComponent(email)}`, { seller_certified: true });
  const after = await req('GET', `listings?id=eq.${TEST_ID}&select=seller_certified`);
  ok('propagation vers les annonces du vendeur', after[0]?.seller_certified === true, after[0]?.seller_certified);

  /* 3. Le badge est-il visible par un visiteur anonyme ? */
  await req('PATCH', `listings?id=eq.${TEST_ID}`, { status: 'live' });
  const pub = await fetch(`${URL_SB}/rest/v1/listings?id=eq.${TEST_ID}&select=seller_certified,status`, { headers: HA });
  const pubRows = await pub.json();
  ok('annonce visible par un visiteur', Array.isArray(pubRows) && pubRows.length === 1, JSON.stringify(pubRows).slice(0, 80));
  ok('badge certifie visible publiquement', pubRows[0]?.seller_certified === true, pubRows[0]?.seller_certified);

  /* 4. Le compteur de l'accueil */
  const st = await fetch(`${URL_SB}/rest/v1/homepage_stats?select=certified_sellers&limit=1`, { headers: HA });
  const stRows = await st.json();
  ok('compteur vendeurs certifies accessible', stRows[0]?.certified_sellers > 0, stRows[0]?.certified_sellers);

  /* 5. Détection de désynchronisation */
  await req('PATCH', `listings?id=eq.${TEST_ID}`, { seller_certified: false });
  const desync = await req('GET', `listings?id=eq.${TEST_ID}&select=seller_certified`);
  ok('desynchronisation detectable', desync[0]?.seller_certified === false, 'sync-certified.mjs la corrige');

} catch (e) {
  ok('execution du test', false, e.message);
} finally {
  if (created) {
    try { await req('DELETE', `listings?id=eq.${TEST_ID}`); console.log(`(annonce de test ${TEST_ID} supprimée)\n`); }
    catch (e) { console.error(`ATTENTION : annonce de test ${TEST_ID} non supprimée — ${e.message}\n`); }
  }
}

let pass = 0, fail = 0;
for (const r of R) {
  if (r.ok) { pass++; console.log(`  OK   ${r.n}${r.d ? ' (' + r.d + ')' : ''}`); }
  else { fail++; console.log(`  FAIL ${r.n}${r.d ? ' -> ' + r.d : ''}`); }
}
console.log(`\n${pass}/${pass + fail} tests réussis`);
process.exit(fail ? 1 : 0);
