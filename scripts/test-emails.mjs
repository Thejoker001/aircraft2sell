#!/usr/bin/env node
/* Teste les 3 fonctions de notification SANS passer par Vercel : on importe
   les handlers et on simule req/res. Un envoi réel est effectué vers
   l'adresse passée en argument.

   Usage : node scripts/test-emails.mjs destinataire@exemple.eu
           node scripts/test-emails.mjs --dry     (aucun envoi réel)
*/
import { readFileSync } from 'node:fs';

const DEST = process.argv.find(a => a.includes('@'));
const DRY = process.argv.includes('--dry');

/* Charger le .env du profil dans process.env */
const ENV = `${process.env.HOME}/.hermes/profiles/aircraft2sell/.env`;
for (const line of readFileSync(ENV, 'utf8').split('\n')) {
  const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
if (DEST) process.env.ADMIN_EMAIL = DEST;
if (DRY) process.env.BREVO_API_KEY = '';        // force l'échec propre d'envoi

const R = [];
const ok = (n, c, d = '') => R.push({ n, ok: !!c, d: String(d) });

/* Faux objets req/res compatibles avec les handlers Vercel */
function faireRes() {
  const res = {
    _code: 0, _corps: null, _headers: {},
    setHeader(k, v) { this._headers[k] = v; },
    status(c) { this._code = c; return this; },
    json(o) { this._corps = o; return this; },
    end() { return this; },
  };
  return res;
}

async function appeler(module, corps, methode = 'POST') {
  const { default: handler } = await import(module);
  const req = { method: methode, body: corps };
  const res = faireRes();
  await handler(req, res);
  return res;
}

/* Une annonce réelle sert de support */
const SB = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rows = await fetch(`${SB}/rest/v1/listings?select=*&status=eq.live&limit=1`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then(r => r.json());
const annonce = rows[0];
if (!annonce) { console.log('Aucune annonce en ligne — test impossible.'); process.exit(0); }
console.log(`Annonce support : #${annonce.id} ${annonce.make} ${annonce.model}`);
console.log(`Destinataire    : ${DEST || '(dry run)'}\n`);

/* ── 1. CORS / méthode ── */
const opt = await appeler('../api/notify-new-listing.js', {}, 'OPTIONS');
ok('CORS preflight accepte', opt._code === 204, `HTTP ${opt._code}`);
ok('en-tete CORS pose', /aircraft2sell\.eu/.test(opt._headers['Access-Control-Allow-Origin'] || ''));

const get = await appeler('../api/notify-new-listing.js', {}, 'GET');
ok('GET refuse', get._code === 405, `HTTP ${get._code}`);

/* ── 2. Nouvelle annonce -> administrateur ── */
const r1 = await appeler('../api/notify-new-listing.js', { listingId: String(annonce.id) });
ok('nouvelle annonce : envoi', DRY ? r1._code === 502 : r1._code === 200,
   `HTTP ${r1._code} ${JSON.stringify(r1._corps).slice(0, 90)}`);

const r1b = await appeler('../api/notify-new-listing.js', { listingId: '000000' });
ok('annonce inexistante refusee', r1b._code === 400, `HTTP ${r1b._code}`);

/* ── 3. Modération -> vendeur ── */
if (DEST) {
  // On cible l'adresse de test plutôt que le vendeur réel
  await fetch(`${SB}/rest/v1/listings?id=eq.${annonce.id}`, {
    method: 'PATCH',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ seller_email: DEST }),
  });
}
const r2 = await appeler('../api/notify-listing-moderated.js',
  { listing_id: String(annonce.id), decision: 'approved' });
ok('annonce validee : envoi', DRY ? r2._code === 502 : r2._code === 200,
   `HTTP ${r2._code} ${JSON.stringify(r2._corps).slice(0, 90)}`);

const r3 = await appeler('../api/notify-listing-moderated.js',
  { listing_id: String(annonce.id), decision: 'rejected', reason: 'Photos insuffisantes (test)' });
ok('annonce rejetee : envoi', DRY ? r3._code === 502 : r3._code === 200,
   `HTTP ${r3._code} ${JSON.stringify(r3._corps).slice(0, 90)}`);

const r3b = await appeler('../api/notify-listing-moderated.js', {});
ok('listing_id manquant refuse', r3b._code === 400, `HTTP ${r3b._code}`);

/* ── 4. Message reçu ── */
const r4 = await appeler('../api/notify-message.js', {
  buyerName: 'Jean Test', buyerEmail: 'acheteur@exemple.invalid',
  buyerPhone: '+33 6 00 00 00 00',
  message: 'Bonjour,\nVotre appareil est-il toujours disponible ?\nCordialement',
  listingId: String(annonce.id),
});
ok('message acheteur : envoi', DRY ? r4._code === 502 : r4._code === 200,
   `HTTP ${r4._code} ${JSON.stringify(r4._corps).slice(0, 90)}`);

const r5 = await appeler('../api/notify-message.js', {
  senderEmail: 'a@exemple.invalid', senderName: 'Vendeur',
  receiverEmail: DEST || 'b@exemple.invalid', content: 'Réponse depuis la messagerie',
});
ok('message messagerie : envoi', DRY ? r5._code === 502 : r5._code === 200,
   `HTTP ${r5._code} ${JSON.stringify(r5._corps).slice(0, 90)}`);

const r6 = await appeler('../api/notify-message.js', { buyerEmail: 'x@y.invalid', message: '' });
ok('message vide refuse', r6._code === 400, `HTTP ${r6._code}`);

const r7 = await appeler('../api/notify-message.js', {
  senderEmail: 'meme@exemple.invalid', receiverEmail: 'meme@exemple.invalid', content: 'test',
});
ok('auto-notification evitee', r7._code === 200 && r7._corps?.ignore, JSON.stringify(r7._corps));

/* Restauration du vendeur d'origine */
if (DEST) {
  await fetch(`${SB}/rest/v1/listings?id=eq.${annonce.id}`, {
    method: 'PATCH',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ seller_email: annonce.seller_email }),
  });
  console.log(`(vendeur d'origine restauré : ${annonce.seller_email})\n`);
}

let pass = 0, fail = 0;
for (const r of R) {
  if (r.ok) { pass++; console.log(`  OK   ${r.n}${r.d ? ' (' + r.d + ')' : ''}`); }
  else { fail++; console.log(`  FAIL ${r.n}${r.d ? ' -> ' + r.d : ''}`); }
}
console.log(`\n${pass}/${pass + fail} tests réussis`);
process.exit(fail ? 1 : 0);
