#!/usr/bin/env node
/* Audit des liaisons « vendeur vérifié » entre les tables Supabase.
   Lecture seule. Usage : node scripts/audit-verif.mjs */
import { readFileSync } from 'node:fs';

const ENV = `${process.env.HOME}/.hermes/profiles/aircraft2sell/.env`;
const env = {};
for (const line of readFileSync(ENV, 'utf8').split('\n')) {
  const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const URL_SB = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SB || !KEY) { console.error('Identifiants Supabase absents'); process.exit(1); }

async function q(table, params = '') {
  const r = await fetch(`${URL_SB}/rest/v1/${table}${params ? '?' + params : ''}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
  });
  if (!r.ok) return { error: `${r.status} ${(await r.text()).slice(0, 160)}` };
  return { rows: await r.json() };
}

/* Quelles colonnes existent réellement ? */
async function columns(table) {
  const r = await q(table, 'limit=1');
  if (r.error) return { error: r.error };
  return { cols: r.rows.length ? Object.keys(r.rows[0]) : [] };
}

const out = [];
const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };

for (const t of ['users', 'listings', 'verification_requests']) {
  const c = await columns(t);
  log(`\n=== ${t} ===`);
  if (c.error) { log('  ERREUR:', c.error); continue; }
  log('  colonnes:', c.cols.join(', ') || '(table vide)');
}

/* Membres certifiés */
const users = await q('users', 'select=*');
if (users.rows) {
  const certKey = ['certified', 'is_certified', 'verified'].find(k => k in (users.rows[0] || {}));
  log(`\n=== MEMBRES (${users.rows.length}) ===`);
  log('  colonne de certification détectée:', certKey || 'AUCUNE');
  if (certKey) {
    const cert = users.rows.filter(u => u[certKey]);
    log(`  certifiés: ${cert.length}`);
    cert.forEach(u => log(`    - ${u.email} | ${u.name || '(sans nom)'} | plan=${u.plan || '?'}`));
  }
}

/* Demandes de vérification */
const vr = await q('verification_requests', 'select=*');
if (vr.rows) {
  log(`\n=== DEMANDES DE VÉRIFICATION (${vr.rows.length}) ===`);
  const byStatus = {};
  vr.rows.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
  log('  par statut:', JSON.stringify(byStatus));
  vr.rows.filter(r => r.status === 'approved').forEach(r =>
    log(`    approuvé: ${r.email || r.user_email || JSON.stringify(r).slice(0, 90)}`));
} else if (vr.error) log('\n=== verification_requests: ' + vr.error);

/* Annonces et drapeau vendeur certifié */
const li = await q('listings', 'select=*');
if (li.rows) {
  log(`\n=== ANNONCES (${li.rows.length}) ===`);
  const k = ['seller_certified', 'sellerCertified', 'certified'].find(x => x in (li.rows[0] || {}));
  log('  colonne « vendeur certifié » détectée:', k || 'AUCUNE');
  const live = li.rows.filter(l => l.status === 'live');
  log(`  publiées: ${live.length}`);
  if (k) log(`  publiées avec drapeau certifié: ${live.filter(l => l[k]).length}`);

  /* Cohérence : annonce d'un vendeur certifié mais drapeau non posé */
  if (users.rows && k) {
    const certKey = ['certified', 'is_certified', 'verified'].find(x => x in (users.rows[0] || {}));
    if (certKey) {
      const certEmails = new Set(users.rows.filter(u => u[certKey])
        .map(u => (u.email || '').toLowerCase()));
      const desync = li.rows.filter(l =>
        certEmails.has((l.sellerEmail || l.seller_email || '').toLowerCase()) && !l[k]);
      log(`\n  INCOHÉRENCES — annonces d'un vendeur certifié sans le drapeau: ${desync.length}`);
      desync.slice(0, 20).forEach(l =>
        log(`    #${l.id} ${l.make || ''} ${l.model || ''} (${l.status}) vendeur=${l.sellerEmail || l.seller_email}`));

      const inverse = li.rows.filter(l =>
        l[k] && !certEmails.has((l.sellerEmail || l.seller_email || '').toLowerCase()));
      log(`  INCOHÉRENCES — drapeau posé mais vendeur non certifié: ${inverse.length}`);
      inverse.slice(0, 20).forEach(l =>
        log(`    #${l.id} vendeur=${l.sellerEmail || l.seller_email}`));
    }
  }
}
