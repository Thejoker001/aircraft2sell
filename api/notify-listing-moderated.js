/**
 * api/notify-listing-moderated.js
 * Prévient le vendeur que son annonce a été publiée ou refusée.
 *
 * Appelé par l'administration (admin-a2s00760.html) après approbation ou
 * rejet. Corps : { listing_id, decision: 'approved' | 'rejected', reason? }
 *
 * Compatible avec l'ancien appel notify-listing-approved : sans `decision`,
 * on déduit l'issue du statut réel de l'annonce en base.
 */
import { preambule, sb, envoyer, gabarit, esc, prix, titreAeronef, SITE } from './_lib.js';

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  try {
    const corps = req.body || {};
    const id = corps.listing_id || corps.listingId || corps.id;
    if (!id) return res.status(400).json({ error: 'listing_id manquant' });

    const rows = await sb(`listings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const l = rows && rows[0];
    if (!l) return res.status(404).json({ error: 'Annonce introuvable' });
    if (!l.seller_email) return res.status(400).json({ error: 'Vendeur sans email' });

    // La décision transmise fait foi ; sinon on lit le statut en base.
    const decision = corps.decision || (l.status === 'live' ? 'approved'
                    : l.status === 'rejected' ? 'rejected' : null);
    if (!decision) {
      return res.status(400).json({ error: `Statut non concluant : ${l.status}` });
    }

    const titre = titreAeronef(l);
    const lien = `${SITE}/listing.html?id=${encodeURIComponent(l.id)}`;
    let html, sujet;

    if (decision === 'approved') {
      sujet = `Votre annonce est en ligne — ${titre}`;
      html = gabarit({
        titre: 'Votre annonce est publiée',
        intro: `Bonjour${l.seller_name ? ' ' + esc(l.seller_name) : ''}, votre annonce a été validée par notre équipe. Elle est désormais visible par tous les acheteurs.`,
        blocs: [
          ['Aéronef', esc(titre)],
          ['Prix affiché', esc(prix(l.price, l.currency))],
          ['Localisation', esc(l.airport || l.country || '—')],
        ],
        cta: lien,
        ctaLabel: 'Voir mon annonce',
        pied: `Les acheteurs intéressés vous écriront via le formulaire de l'annonce : vous recevrez leurs messages par email et dans votre <a href="${SITE}/messages.html" style="color:#1E5FCC;text-decoration:none">messagerie</a>.<br><br>Pour modifier ou retirer votre annonce, rendez-vous sur votre <a href="${SITE}/dashboard.html" style="color:#1E5FCC;text-decoration:none">tableau de bord</a>.`,
      });
    } else {
      const motif = corps.reason || l.rejection_reason || '';
      sujet = `Votre annonce n'a pas été validée — ${titre}`;
      html = gabarit({
        titre: "Votre annonce n'a pas été validée",
        intro: `Bonjour${l.seller_name ? ' ' + esc(l.seller_name) : ''}, votre annonce n'a pas pu être publiée en l'état.`,
        blocs: [
          ['Aéronef', esc(titre)],
          ...(motif ? [['Motif', esc(motif)]] : []),
        ],
        cta: `${SITE}/dashboard.html`,
        ctaLabel: 'Corriger mon annonce',
        pied: `Les motifs les plus fréquents sont des informations incomplètes, des photos insuffisantes ou un prix incohérent avec la catégorie. Vous pouvez corriger et soumettre à nouveau depuis votre tableau de bord.<br><br>Une question ? Écrivez-nous à <a href="mailto:contact@aircraft2sell.eu" style="color:#1E5FCC;text-decoration:none">contact@aircraft2sell.eu</a>.`,
      });
    }

    const r = await envoyer({
      to: l.seller_email,
      toName: l.seller_name || l.seller_email,
      sujet,
      html,
    });

    if (!r.ok) return res.status(502).json({ error: r.erreur });
    return res.status(200).json({ ok: true, decision, messageId: r.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
