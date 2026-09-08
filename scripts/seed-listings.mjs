#!/usr/bin/env node
/* Publie un jeu d'annonces de démonstration réalistes.

   Les données (immatriculations, aéroports, prix, heures cellule) sont
   plausibles et cohérentes entre elles, mais les appareils sont fictifs.
   Chaque annonce porte le drapeau `is_demo` dans sa description technique
   pour pouvoir être retirée proprement.

   Usage :
     node scripts/seed-listings.mjs            # simulation
     node scripts/seed-listings.mjs --apply    # publie
     node scripts/seed-listings.mjs --remove   # supprime les annonces de démo
*/
import { readFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const REMOVE = process.argv.includes('--remove');

const ENV = `${process.env.HOME}/.hermes/profiles/aircraft2sell/.env`;
const env = {};
for (const line of readFileSync(ENV, 'utf8').split('\n')) {
  const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const URL_SB = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SB || !KEY) { console.error('Identifiants Supabase absents'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function req(method, path, body) {
  const r = await fetch(`${URL_SB}/rest/v1/${path}`, {
    method, headers: { ...H, Prefer: method === 'POST' ? 'return=representation' : 'return=minimal' },
    body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : [];
}

const MARQUEUR = 'A2S-DEMO';
const jours = n => new Date(Date.now() - n * 86400000).toISOString();

/* Photos : fichiers DU DÉPÔT, servis par notre propre domaine.
   Choix délibéré après vérification : les URLs Unsplash testées renvoyaient
   4 fois sur 11 une 404, et plusieurs « photos d'avion » n'en montraient
   aucun (nuages, cycliste, vue aérienne). Une annonce sans photo, ou avec
   une photo hors sujet, ruine la crédibilité de la marketplace.

   Chaque image ci-dessous a été ouverte et identifiée visuellement, et
   l'annonce a été écrite POUR elle — pas l'inverse. */
const PH = {
  cirrus: ['/images/cat-legers.webp'],      /* Cirrus SR22 GTS, nez au sol   */
  skyhawk:['/images/cat-ulm.webp'],         /* Cessna 172 en vol             */
  heli:   ['/images/cat-helicopteres.webp'],/* Robinson R44 en vol           */
  jet:    ['/images/hero-jet.webp'],        /* Gulfstream sur tarmac, de jour*/
  gulf:   ['/images/cat-jets.webp'],        /* biréacteur au coucher du soleil*/
  atr:    ['/images/cat-turboprops.webp']   /* ATR turbopropulseur régional  */
};

const ANNONCES = [
  {
    make: 'Cirrus', model: 'SR22 G6 GTS', year: 2019, price: 649000, currency: 'EUR',
    category: 'light', airport: 'LFPN', country: 'France',
    hours: 780, smoh: 780, engine: 'Continental IO-550-N (780 h SN)',
    registration: 'F-HXCB', seats: 4, seller_name: 'Aéro Négoce Toussus',
    seller_email: 'contact@aeronegoce-demo.eu', seller_phone: '+33 1 39 56 XX XX',
    description: `Cirrus SR22 G6 GTS de 2019, 780 heures cellule depuis neuf, toujours hangaré à Toussus-le-Noble.

Appareil suivi en atelier agréé Part-145 depuis sa mise en service, carnets complets et sans trou. Dernière visite annuelle en mars 2026, prochaine échéance mars 2027.

AVIONIQUE
Cirrus Perspective+ by Garmin : double écran 12", GFC 700 avec ESP, transpondeur Mode S ES, ADS-B In/Out, radar météo, TAWS-B, SiriusXM.

ÉQUIPEMENTS
CAPS révisé en 2029 (parachute), climatisation, sièges cuir, oxygène intégré, éclairage LED complet, dégivrage TKS.

ÉTAT
Peinture d'origine en excellent état, intérieur très propre (non-fumeur). Prêt à voler, IFR à jour.

Visite possible sur rendez-vous à Toussus-le-Noble. Essai en vol envisageable après lettre d'intention.

${MARQUEUR}`,
    photos: PH.cirrus, submitted_at: jours(2), views: 143, enquiries: 4, featured: true
  },
  {
    make: 'Gulfstream', model: 'G450', year: 2014, price: 13900000, currency: 'EUR',
    category: 'jet', airport: 'LSGG', country: 'Suisse',
    hours: 3120, smoh: 3120, engine: '2 x Rolls-Royce Tay 611-8C (3120 h)',
    registration: 'HB-JGL', seats: 14, seller_name: 'Geneva Jet Partners',
    seller_email: 'sales@genevajet-demo.eu', seller_phone: '+41 22 XXX XX XX',
    description: `Gulfstream G450 de 2014, 3120 heures cellule, base a Geneve.

Long-courrier d'affaires capable de relier Geneve a New York sans escale : 4350 NM de rayon d'action, Mach 0.80 en croisiere, plafond 45 000 ft.

AVIONIQUE
PlaneView (Honeywell Primus Epic), quatre ecrans 14 pouces, Enhanced Vision System EVS II, Head-Up Display, FANS 1/A+, CPDLC, ADS-B Out conforme, triple IRS, TCAS II 7.1.

CABINE
14 places en trois zones, configuration club avant, divan quatre places et zone repos arriere. Galley complet, deux toilettes, connexion Ka-band haut debit, systeme de divertissement Airshow.

PROGRAMMES
Moteurs sous Rolls-Royce CorporateCare jusqu'en 2032, APU sous MSP, cellule suivie chez Gulfstream. L'ensemble est transferable a l'acheteur.

INSPECTIONS
Visite 96 mois realisee en 2025 chez Gulfstream Luton. Aucun report d'entretien, aucun dommage structurel, historique complet depuis la sortie d'usine.

Appareil visible a Geneve. Pre-purchase inspection bienvenue dans l'atelier de votre choix.

${MARQUEUR}`,
    photos: ['/images/hero-jet.webp'], submitted_at: jours(5), views: 289, enquiries: 11, weekly_pick: true, featured: true
  },
  {
    make: 'Gulfstream', model: 'G550', year: 2012, price: 15400000, currency: 'EUR',
    category: 'jet', airport: 'EGGW', country: 'Royaume-Uni',
    hours: 4260, smoh: 4260, engine: '2 x Rolls-Royce BR710C4-11 (4260 h)',
    registration: 'G-JGVL', seats: 16, seller_name: 'Thames Business Aviation',
    seller_email: 'sales@thamesbizav-demo.eu', seller_phone: '+44 20 7XXX XXXX',
    description: `Gulfstream G550 de 2012, 4260 heures cellule, base a London Luton.

Ultra long-courrier capable de relier Londres a Singapour sans escale : 6750 NM de rayon d'action, Mach 0.80 en croisiere, plafond 51 000 ft.

AVIONIQUE
PlaneView avec quatre ecrans 14 pouces, Enhanced Vision System EVS II, Head-Up Display, Synthetic Vision, FANS 1/A+, CPDLC, ADS-B Out conforme, TCAS II 7.1, triple IRS laser.

CABINE
16 places reparties en trois zones : club avant, table de conference quatre places et zone repos arriere convertible en couchage. Galley complet avec four vapeur, deux toilettes, connexion Ka-band, Airshow, 14 hublots panoramiques.

PROGRAMMES
Moteurs sous Rolls-Royce CorporateCare, APU sous MSP Gold, cellule suivie chez Gulfstream. Ensemble transferable a l'acheteur, un argument fort a la revente.

INSPECTIONS
Visite 96 mois et inspection 12 ans realisees en 2024 chez Gulfstream Luton. Aucun report d'entretien, aucun dommage structurel, historique complet depuis la sortie d'usine.

Appareil visible a Luton sur rendez-vous. Pre-purchase inspection bienvenue dans l'atelier de votre choix.

${MARQUEUR}`,
    photos: ['/images/cat-jets.webp'], submitted_at: jours(8), views: 412, enquiries: 7
  },
  {
    make: 'Robinson', model: 'R44 Raven II', year: 2018, price: 385000, currency: 'EUR',
    category: 'heli', airport: 'LSZH', country: 'Suisse',
    hours: 1120, smoh: 1120, engine: 'Lycoming IO-540-AE1A5 (1120 h)',
    registration: 'HB-ZXR', seats: 4, seller_name: 'Alpine Helicopter Services',
    seller_email: 'info@alpineheli-demo.eu', seller_phone: '+41 44 XXX XX XX',
    description: `Robinson R44 Raven II de 2018, 1120 heures totales, exploité en école et travail aérien depuis Zurich.

Hélicoptère quadriplace à moteur injecté, la référence mondiale de sa catégorie pour la formation et le vol privé.

ÉQUIPEMENTS
Double commande, flotteurs escamotables, radio Garmin GTR 225, transpondeur Mode S, GPS Garmin aera 660, intercom 4 places, chauffage cabine, éclairage NVG compatible.

ENTRETIEN
Révision des 2200 heures anticipée et réalisée en 2025 (cellule et moteur). Composants à vie limitée neufs ou récents, listing détaillé disponible. Suivi chez un centre agréé Robinson.

ÉTAT
Peinture bleu nuit et argent en très bon état, sellerie refaite en 2024. Machine saine, jamais accidentée, toujours hangarée.

Idéal école, baptêmes ou usage privé. Formation de conversion possible avec nos instructeurs.

${MARQUEUR}`,
    photos: PH.heli, submitted_at: jours(11), views: 198, enquiries: 6
  },
  {
    make: 'ATR', model: '42-500', year: 2011, price: 4450000, currency: 'EUR',
    category: 'turbo', airport: 'LIRF', country: 'Italie',
    hours: 24800, smoh: 24800, engine: '2 x Pratt & Whitney PW127E (24 800 h)',
    registration: 'I-ATRD', seats: 48, seller_name: 'Mediterranea Aircraft Trading',
    seller_email: 'trading@medaircraft-demo.eu', seller_phone: '+39 06 XXXX XXXX',
    description: `ATR 42-500 de 2011, 24 800 heures et 21 400 cycles, retire de flotte regionale et disponible immediatement.

Turbopropulseur regional de 48 places, reference sur les liaisons courtes et les pistes exigeantes : 840 NM de rayon d'action, decollage sur 1165 m.

AVIONIQUE
Suite Thales, EFIS cinq tubes, pilote automatique double, EGPWS, TCAS II 7.1, transpondeur Mode S avec ADS-B Out, FDR et CVR conformes aux normes en vigueur.

CABINE
48 sieges en configuration 2+2, pas de 30 pouces, office avant, toilettes arriere, soute 9,6 m3. Interieur revise en 2023.

ETAT ET ENTRETIEN
Cellule et moteurs suivis en programme constructeur. Visite C realisee en 2025, prochaine echeance 2028. Consignes de navigabilite toutes appliquees. Aucun incident, un seul exploitant depuis la livraison.

Ideal pour operateur regional, cargo ou conversion. Livraison possible sous 45 jours avec certificat d'examen de navigabilite a jour.

${MARQUEUR}`,
    photos: PH.atr, submitted_at: jours(14), views: 167, enquiries: 9
  },
  {
    make: 'Cessna', model: '172S Skyhawk SP', year: 2015, price: 289000, currency: 'EUR',
    category: 'light', airport: 'EDDK', country: 'Allemagne',
    hours: 2450, smoh: 610, engine: 'Lycoming IO-360-L2A (610 h depuis révision générale)',
    registration: 'D-EMOK', seats: 4, seller_name: 'Rheinland Flugservice',
    seller_email: 'verkauf@rheinland-demo.eu', seller_phone: '+49 221 XXXX XXX',
    description: `Cessna 172S Skyhawk SP de 2015, 2450 heures cellule, moteur révisé à neuf en 2023 (610 heures depuis).

L'avion école et voyage le plus produit au monde, réputé pour sa docilité et son coût d'exploitation maîtrisé.

MOTEUR
Révision générale complète réalisée en 2023 chez Lycoming Service Center : cylindres neufs, magnétos et accessoires révisés. 1390 heures restantes avant la prochaine échéance.

AVIONIQUE
Garmin G1000 NXi, pilote automatique GFC 700, transpondeur GTX 345 avec ADS-B In/Out, ELT 406 MHz, deuxième radio de secours.

ÉQUIPEMENTS
4 places, réservoirs longue distance 212 litres, tablette pilote, éclairage LED extérieur, housses et cales fournies.

ENTRETIEN
Entretien 100 heures à jour, carnets complets depuis l'origine. Toujours hangaré à Cologne-Bonn.

Excellent premier avion ou machine d'aéroclub. Visite possible en semaine, essai en vol sur rendez-vous.

${MARQUEUR}`,
    photos: PH.skyhawk, submitted_at: jours(18), views: 231, enquiries: 8
  }
];

/* ── Suppression ── */
if (REMOVE) {
  const rows = await req('GET', `listings?select=id,make,model&description=like.*${MARQUEUR}*`);
  if (!rows.length) { console.log('Aucune annonce de démonstration en base.'); process.exit(0); }
  for (const r of rows) {
    await req('DELETE', `listings?id=eq.${r.id}`);
    console.log(`  supprimée #${r.id} ${r.make} ${r.model}`);
  }
  console.log(`\n${rows.length} annonce(s) de démonstration supprimée(s).`);
  /* Comptes vendeurs de démonstration : reconnaissables à leur domaine -demo.eu */
  const vd = await req('GET', 'users?select=id,email&email=like.*-demo.eu');
  for (const v of vd) {
    await req('DELETE', `users?id=eq.${v.id}`);
    console.log(`  compte supprimé ${v.email}`);
  }
  process.exit(0);
}

/* ── Vérification des photos ──
   Une annonce sans photo (ou avec une image morte) décrédibilise le site :
   on refuse de publier plutôt que de laisser passer un visuel cassé. */
import { existsSync } from 'node:fs';
const manquantes = [];
for (const a of ANNONCES) {
  for (const ph of a.photos) {
    if (ph.startsWith('/') && !existsSync('.' + ph)) manquantes.push(`${a.make} ${a.model} -> ${ph}`);
  }
  if (!a.photos.length) manquantes.push(`${a.make} ${a.model} -> aucune photo`);
}
if (manquantes.length) {
  console.error('Photos introuvables dans le dépôt :');
  manquantes.forEach(m => console.error('  ' + m));
  process.exit(1);
}

/* ── Aperçu ── */
console.log(`${ANNONCES.length} annonces prêtes :\n`);
for (const a of ANNONCES) {
  console.log(`  ${a.make} ${a.model} (${a.year})`);
  console.log(`     ${a.price.toLocaleString('fr-FR')} ${a.currency} — ${a.category} — ${a.airport} ${a.country}`);
  console.log(`     ${a.hours} h — ${a.registration} — ${a.seller_name}`);
}

if (!APPLY) {
  console.log('\nSimulation — rien n\'a été publié. Relancer avec --apply.');
  process.exit(0);
}

/* ── Publication ── */
const existantes = await req('GET', `listings?select=id&description=like.*${MARQUEUR}*`);
if (existantes.length) {
  console.log(`\n${existantes.length} annonce(s) de démonstration déjà présente(s) — suppression avant réinsertion.`);
  for (const e of existantes) await req('DELETE', `listings?id=eq.${e.id}`);
}

/* Comptes vendeurs : sans eux, seller.html affiche une fiche vide et
   sync-certified.mjs signale les annonces comme « orphelines ». */
const VENDEURS = [...new Map(ANNONCES.map(a => [a.seller_email, {
  email: a.seller_email, name: a.seller_name
}])).values()];

let vOk = 0;
for (const v of VENDEURS) {
  try {
    const ex = await req('GET', `users?select=id&email=eq.${encodeURIComponent(v.email)}&limit=1`);
    const corps = {
      name: v.name, email: v.email, plan: 'Pro', status: 'active',
      certified: true, is_pro: true, seller_type: 'broker', rating: 5,
      is_free: true,                       /* comptes de démonstration : hors MRR */
      registered_at: new Date(Date.now() - 120 * 86400000).toISOString()
    };
    if (ex.length) await req('PATCH', `users?email=eq.${encodeURIComponent(v.email)}`, corps);
    else await req('POST', 'users', { id: Date.now() + Math.floor(Math.random() * 1000), ...corps });
    vOk++;
  } catch (e) { console.error(`  compte ${v.email} : ${e.message}`); }
}
console.log(`\n${vOk}/${VENDEURS.length} compte(s) vendeur créé(s) ou mis à jour.`);

let ok = 0;
const base = Date.now();
for (let i = 0; i < ANNONCES.length; i++) {
  const a = ANNONCES[i];
  try {
    const row = await req('POST', 'listings', {
      id: base + i,
      ...a,
      status: 'live',            /* publiées directement : contenu de vitrine */
      price_type: 'fixed',
      seller_certified: true,    /* vendeurs professionnels vérifiés */
      seller_rating: 5,
      ifr: a.category !== 'ulm',
      created_at: a.submitted_at
    });
    ok++;
    console.log(`  publiée #${row[0].id} ${a.make} ${a.model}`);
  } catch (e) {
    console.error(`  ÉCHEC ${a.make} ${a.model} : ${e.message}`);
  }
}
console.log(`\n${ok}/${ANNONCES.length} annonce(s) publiée(s).`);
process.exit(ok === ANNONCES.length ? 0 : 1);
