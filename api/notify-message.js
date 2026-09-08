/**
 * api/notify-message.js
 * Prévient le destinataire qu'il a reçu un message.
 *
 * Deux usages :
 *   1. Formulaire « Contacter le vendeur » / « Faire une offre » d'une
 *      annonce (remplace send-listing-message, jamais déployée).
 *      Corps : { buyerName, buyerEmail, buyerPhone?, message, listingId }
 *   2. Réponse depuis la messagerie du site.
 *      Corps : { senderEmail, senderName?, receiverEmail, content, listingId? }
 *
 * Le destinataire peut répondre directement à l'email : replyTo pointe sur
 * l'expéditeur réel.
 */
import { preambule, sb, envoyer, gabarit, esc, prix, titreAeronef, SITE } from './_lib.js';

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  try {
    const c = req.body || {};

    // Normalisation des deux formes d'appel
    const expediteurEmail = c.buyerEmail || c.senderEmail || c.sender_email;
    const expediteurNom   = c.buyerName || c.senderName || c.sender_name || expediteurEmail;
    const telephone       = c.buyerPhone || c.phone || '';
    const contenu         = c.message || c.content || '';
    const listingId       = c.listingId || c.listing_id || null;
    let   destinataire    = c.receiverEmail || c.receiver_email || null;

    if (!contenu.trim()) return res.status(400).json({ error: 'Message vide' });
    if (!expediteurEmail) return res.status(400).json({ error: 'Expéditeur manquant' });

    // Contexte de l'annonce, et destinataire déduit si absent
    let l = null;
    if (listingId) {
      const rows = await sb(`listings?id=eq.${encodeURIComponent(listingId)}&select=*&limit=1`);
      l = rows && rows[0];
      if (!destinataire && l) destinataire = l.seller_email;
    }
    if (!destinataire) return res.status(400).json({ error: 'Destinataire introuvable' });

    // Ne pas s'auto-notifier
    if (destinataire.toLowerCase() === String(expediteurEmail).toLowerCase()) {
      return res.status(200).json({ ok: true, ignore: 'expéditeur = destinataire' });
    }

    const titre = l ? titreAeronef(l) : null;
    const lien = l ? `${SITE}/listing.html?id=${encodeURIComponent(l.id)}` : `${SITE}/messages.html`;

    // Le message est du texte libre : on échappe puis on restitue les sauts de ligne.
    const corpsMessage = esc(contenu).replace(/\n/g, '<br>');

    const html = gabarit({
      titre: titre ? `Nouveau message sur votre annonce` : 'Nouveau message',
      intro: titre
        ? `<strong>${esc(expediteurNom)}</strong> vous a écrit au sujet de votre annonce <strong>${esc(titre)}</strong>.`
        : `<strong>${esc(expediteurNom)}</strong> vous a envoyé un message.`,
      blocs: [
        ...(titre ? [['Aéronef', esc(titre)]] : []),
        ...(l ? [['Prix affiché', esc(prix(l.price, l.currency))]] : []),
        ['De', esc(expediteurNom)],
        ['Email', `<a href="mailto:${esc(expediteurEmail)}" style="color:#1E5FCC;text-decoration:none">${esc(expediteurEmail)}</a>`],
        ...(telephone ? [['Téléphone', esc(telephone)]] : []),
      ],
      cta: `${SITE}/messages.html`,
      ctaLabel: 'Répondre dans ma messagerie',
      pied: `<span style="display:block;background:#F4F7FB;border-left:3px solid #EA6A16;padding:12px 14px;margin:0 0 16px;color:#3D4F63;font-size:14px;line-height:1.6">${corpsMessage}</span>
             Vous pouvez aussi répondre directement à cet email : votre réponse parviendra à ${esc(expediteurNom)}.
             ${l ? `<br><br><a href="${lien}" style="color:#1E5FCC;text-decoration:none">Voir l'annonce concernée</a>` : ''}`,
    });

    const r = await envoyer({
      to: destinataire,
      toName: l?.seller_name || destinataire,
      sujet: titre ? `Message reçu — ${titre}` : `Nouveau message sur Aircraft2Sell`,
      html,
      replyTo: { email: expediteurEmail, name: expediteurNom },
    });

    if (!r.ok) return res.status(502).json({ error: r.erreur });
    return res.status(200).json({ ok: true, messageId: r.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
