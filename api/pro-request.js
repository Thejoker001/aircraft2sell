/**
 * api/pro-request.js
 * Traite deux formulaires distincts (routés par corps.kind) :
 *  - "dealer" (défaut, rétrocompatible) : "Parlons de votre flotte" (pro-dealers.html).
 *  - "partner" : "Devenir partenaire" (devenir-partenaire.html), demande de
 *    publicité professionnelle native (paliers découverte/visibilité/premium).
 * Une seule fonction pour rester sous le plafond de 12 fonctions serverless
 * du plan Vercel Hobby (voir SKILL.md § limites plan Hobby).
 *
 * Remplace l'appel direct à l'API Brevo depuis le navigateur, qui exposait
 * une clé API en clair dans le HTML de la page.
 *
 * Corps dealer  : { company, name, email, phone, type, volume, message }
 * Corps partner : { kind:'partner', company, name, email, phone, category, tier, website, message }
 */
import { preambule, envoyer, gabarit, esc, ADMIN_EMAIL } from './_lib.js';

const TYPES = {
  dealer: 'Dealer / négociant',
  broker: 'Broker',
  operator: 'Opérateur / compagnie',
  amo: 'Atelier de maintenance',
  other: 'Autre',
};
const VOLUMES = { '1-3': '1 à 3', '4-10': '4 à 10', '11-30': '11 à 30', '30+': 'Plus de 30' };

const CATEGORIES = {
  assurance: 'Assurance',
  financement: 'Financement',
  maintenance: 'Maintenance / MRO',
  broker: 'Broker / courtage',
  formation: 'Formation / école de pilotage',
  autre: 'Autre',
};
const TIERS = {
  decouverte: 'Découverte — 49 €/mois',
  visibilite: 'Visibilité — 99 €/mois',
  premium: 'Premium — 190 €/mois',
};

function estEmailValide(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function traiterPartenaire(corps, res) {
  const company = String(corps.company || '').trim();
  const name = String(corps.name || '').trim();
  const email = String(corps.email || '').trim().toLowerCase();
  const phone = String(corps.phone || '').trim();
  const website = String(corps.website || '').trim();
  const category = String(corps.category || '').trim();
  const tier = String(corps.tier || '').trim();
  const message = String(corps.message || '').trim();

  if (!company || !name || !estEmailValide(email)) {
    return res.status(400).json({ error: 'Société, nom et email valide requis' });
  }
  if (message.length > 5000) {
    return res.status(400).json({ error: 'Message trop long' });
  }

  const categoryLabel = CATEGORIES[category] || category || '—';
  const tierLabel = TIERS[tier] || tier || '—';

  const html = gabarit({
    titre: 'Nouvelle demande de partenariat',
    intro: `Une entreprise a envoyé une demande via le formulaire "Devenir partenaire".`,
    blocs: [
      ['Société', esc(company)],
      ['Contact', esc(name)],
      ['Email', `<a href="mailto:${esc(email)}" style="color:#1E5FCC;text-decoration:none">${esc(email)}</a>`],
      ...(phone ? [['Téléphone', esc(phone)]] : []),
      ...(website ? [['Site web', esc(website)]] : []),
      ['Secteur', esc(categoryLabel)],
      ['Palier souhaité', esc(tierLabel)],
    ],
    pied: message ? `Message :<br>${esc(message).replace(/\n/g, '<br>')}` : undefined,
  });

  const r = await envoyer({
    to: ADMIN_EMAIL,
    toName: 'Administration Aircraft2Sell',
    sujet: `[Partenariat A2S] ${company} — ${tierLabel}`,
    html,
    replyTo: { email, name },
  });
  if (!r.ok) return res.status(502).json({ error: r.erreur });
  return res.status(200).json({ ok: true });
}

async function traiterDealer(corps, res) {
  const company = String(corps.company || '').trim();
  const name = String(corps.name || '').trim();
  const email = String(corps.email || '').trim().toLowerCase();
  const phone = String(corps.phone || '').trim();
  const type = String(corps.type || '').trim();
  const volume = String(corps.volume || '').trim();
  const message = String(corps.message || '').trim();

  if (!company || !name || !estEmailValide(email)) {
    return res.status(400).json({ error: 'Société, nom et email valide requis' });
  }
  if (message.length > 5000) {
    return res.status(400).json({ error: 'Message trop long' });
  }

  const typeLabel = TYPES[type] || type || '—';
  const volumeLabel = VOLUMES[volume] || volume || '—';

  const html = gabarit({
    titre: 'Demande professionnelle',
    intro: `Une demande a été envoyée via le formulaire "Parlons de votre flotte".`,
    blocs: [
      ['Société', esc(company)],
      ['Contact', esc(name)],
      ['Email', `<a href="mailto:${esc(email)}" style="color:#1E5FCC;text-decoration:none">${esc(email)}</a>`],
      ...(phone ? [['Téléphone', esc(phone)]] : []),
      ['Activité', esc(typeLabel)],
      ['Volume', esc(volumeLabel)],
    ],
    pied: message ? `Message :<br>${esc(message).replace(/\n/g, '<br>')}` : undefined,
  });

  const r = await envoyer({
    to: ADMIN_EMAIL,
    toName: 'Administration Aircraft2Sell',
    sujet: `[Pro A2S] ${company} — ${volumeLabel} aéronefs`,
    html,
    replyTo: { email, name },
  });
  if (!r.ok) return res.status(502).json({ error: r.erreur });
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  try {
    const corps = req.body || {};
    if (String(corps.kind || '') === 'partner') {
      return await traiterPartenaire(corps, res);
    }
    return await traiterDealer(corps, res);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
