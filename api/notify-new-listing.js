/**
 * api/notify-new-listing.js
 * Prévient l'administrateur qu'une annonce vient d'être déposée et attend
 * une modération.
 *
 * Appelé par post-listing.html après l'enregistrement de l'annonce.
 * Corps accepté : { listingId } ou l'objet annonce complet (les deux formes
 * existaient déjà dans le code du site).
 */
import { preambule, sb, envoyer, gabarit, esc, prix, titreAeronef, ADMIN_EMAIL, SITE } from './_lib.js';

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  try {
    const corps = req.body || {};
    const id = corps.listingId || corps.listing_id || corps.id;

    // On relit l'annonce en base : le contenu envoyé par le navigateur
    // n'est pas digne de confiance, et peut être incomplet.
    let l = null;
    if (id) {
      const rows = await sb(`listings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
      l = rows && rows[0];
    }
    if (!l) l = corps;                      // repli : annonce transmise en clair
    if (!l || (!l.make && !l.model)) {
      return res.status(400).json({ error: 'Annonce introuvable' });
    }

    const titre = titreAeronef(l);
    const CAT = {
      light: 'Avion léger', jet: "Jet d'affaires", turbo: 'Turbopropulseur',
      heli: 'Hélicoptère', ulm: 'ULM', airliner: 'Avion de ligne',
    };

    const html = gabarit({
      titre: 'Nouvelle annonce à modérer',
      intro: `Une annonce vient d'être déposée et attend votre validation.`,
      blocs: [
        ['Aéronef', esc(titre)],
        ['Catégorie', esc(CAT[l.category] || l.category || '—')],
        ['Prix', esc(prix(l.price, l.currency))],
        ['Localisation', esc(l.airport || l.country || '—')],
        ['Heures', l.hours ? esc(Number(l.hours).toLocaleString('fr-FR')) + ' h' : '—'],
        ['Vendeur', esc(l.seller_name || '—')],
        ['Email', `<a href="mailto:${esc(l.seller_email)}" style="color:#1E5FCC;text-decoration:none">${esc(l.seller_email || '—')}</a>`],
        ['Statut', esc(l.status || 'pending')],
      ],
      cta: `${SITE}/admin-a2s00760.html`,
      ctaLabel: "Ouvrir la modération",
      pied: `Référence interne : ${esc(String(l.id ?? '—'))}`,
    });

    const r = await envoyer({
      to: ADMIN_EMAIL,
      toName: 'Administration Aircraft2Sell',
      sujet: `Nouvelle annonce à modérer — ${titre}`,
      html,
      replyTo: l.seller_email ? { email: l.seller_email, name: l.seller_name || l.seller_email } : undefined,
    });

    if (!r.ok) return res.status(502).json({ error: r.erreur });
    return res.status(200).json({ ok: true, messageId: r.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
