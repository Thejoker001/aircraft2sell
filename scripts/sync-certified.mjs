#!/usr/bin/env node
/* Resynchronise listings.seller_certified avec users.certified.
   Le site (accueil, recherche, fiche) lit listings.seller_certified ;
   la certification, elle, est stockée sur users.certified. Toute
   désynchronisation fait disparaître le badge « Vendeur certifié ».

   Usage :
     node scripts/sync-certified.mjs            # simulation (aucune écriture)
     node scripts/sync-certified.mjs --apply    # applique les corrections
*/
import { readFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const ENV = `${process.env.HOME}/.hermes/profiles/aircraft2sell/.env`;
const env = {};
for (const line of readFileSync(ENV, 'utf8').split('\n')) {
  const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const URL_SB = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SB || !KEY) { console.error('Identifiants Supabase absents de .env'); process.exit(1); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function get(path) {
  const r = await fetch(`${URL_SB}/rest/v1/${path}`, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}
async function patch(path, body) {
  const r = await fetch(`${URL_SB}/rest/v1/${path}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
}

const users = await get('users?select=email,certified,rating,pseudo,is_pro');
const listings = await get('listings?select=id,seller_email,seller_certified,seller_rating,make,model,status');

const certByEmail = new Map();
for (const u of users) {
  if (u.email) certByEmail.set(u.email.toLowerCase().trim(), u);
}

console.log(`Membres : ${users.length} (dont ${users.filter(u => u.certified).length} certifiés)`);
console.log(`Annonces : ${listings.length}\n`);

const toCertify = [];    // vendeur certifié, annonce non marquée
const toUncertify = [];  // annonce marquée, vendeur non certifié
const orphans = [];      // annonce sans compte correspondant

for (const l of listings) {
  const email = (l.seller_email || '').toLowerCase().trim();
  const u = certByEmail.get(email);
  if (!u) { orphans.push(l); continue; }
  if (u.certified && !l.seller_certified) toCertify.push(l);
  if (!u.certified && l.seller_certified) toUncertify.push(l);
}

const show = (title, arr) => {
  console.log(`${title} : ${arr.length}`);
  arr.slice(0, 25).forEach(l =>
    console.log(`   #${l.id} ${(l.make || '') + ' ' + (l.model || '')} [${l.status}] ${l.seller_email}`));
  if (arr.length > 25) console.log(`   … et ${arr.length - 25} autres`);
};

show('À CERTIFIER (badge manquant sur le site)', toCertify);
show('À DÉ-CERTIFIER (badge affiché à tort)', toUncertify);
show('ORPHELINES (aucun compte pour cet email)', orphans);

if (!APPLY) {
  console.log(`\nSimulation — aucune écriture. Relancer avec --apply pour corriger.`);
  process.exit(0);
}

let ok = 0, ko = 0;
for (const [arr, val] of [[toCertify, true], [toUncertify, false]]) {
  for (const l of arr) {
    try { await patch(`listings?id=eq.${l.id}`, { seller_certified: val }); ok++; }
    catch (e) { ko++; console.error(`  échec #${l.id} : ${e.message}`); }
  }
}
/* Recopie aussi la note du vendeur quand elle diverge */
let notes = 0;
for (const l of listings) {
  const u = certByEmail.get((l.seller_email || '').toLowerCase().trim());
  if (u && u.rating != null && l.seller_rating !== u.rating) {
    try { await patch(`listings?id=eq.${l.id}`, { seller_rating: u.rating }); notes++; } catch {}
  }
}
console.log(`\n${ok} annonce(s) corrigée(s), ${ko} échec(s), ${notes} note(s) vendeur resynchronisée(s).`);
process.exit(ko ? 1 : 0);
