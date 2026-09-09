/**
 * api/pro-request.js
 * Traite le formulaire "Parlons de votre flotte" (pro-dealers.html). Remplace
 * l'appel direct à l'API Brevo depuis le navigateur, qui exposait une clé API
 * en clair dans le HTML de la page (trouvée désactivée côté Brevo, mais le
 * code restait dangereux si une clé valide y était remise).
 *
 * Corps accepté : { company, name, email, phone, type, volume, message }
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

function estEmailValide(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  try {
    const corps = req.body || {};
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
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
