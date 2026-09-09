/**
 * api/notify.js — Notifications email unifiées (fusion des 3 fonctions
 * notify-message / notify-new-listing / notify-listing-moderated pour
 * rester sous la limite Hobby de 12 fonctions serverless par déploiement).
 *
 *   POST /api/notify?type=message      → message reçu (formulaire annonce / messagerie)
 *   POST /api/notify?type=new-listing  → annonce déposée, à modérer (admin)
 *   POST /api/notify?type=moderated    → annonce approuvée / rejetée (vendeur)
 *
 * Les corps acceptés sont identiques à ceux des anciennes fonctions.
 */
import { preambule, sb, envoyer, gabarit, esc, prix, titreAeronef, ADMIN_EMAIL, SITE } from './_lib.js';

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  const type = (req.query && req.query.type) || '';

  if (type === 'new-listing') return newListing(req, res);
  if (type === 'moderated') return moderated(req, res);
  return message(req, res); /* défaut : message (compatibilité /api/notify sans type) */
}

/* ── TYPE message : destinataire notifié d'un message reçu ── */
async function message(req, res) {
  try {
    const c = req.body || {};

    const expediteurEmail = c.buyerEmail || c.senderEmail || c.sender_email;
    const expediteurNom   = c.buyerName || c.senderName || c.sender_name || expediteurEmail;
    const telephone       = c.buyerPhone || c.phone || '';
    const contenu         = c.message || c.content || '';
    const listingId       = c.listingId || c.listing_id || null;
    let   destinataire    = c.receiverEmail || c.receiver_email || null;

    if (!contenu.trim()) return res.status(400).json({ error: 'Message vide' });
    if (!expediteurEmail) return res.status(400).json({ error: 'Expéditeur manquant' });

    let l = null;
    if (listingId) {
      const rows = await sb(`listings?id=eq.${encodeURIComponent(listingId)}&select=*&limit=1`);
      l = rows && rows[0];
      if (!destinataire && l) destinataire = l.seller_email;
    }
    if (!destinataire) return res.status(400).json({ error: 'Destinataire introuvable' });

    if (destinataire.toLowerCase() === String(expediteurEmail).toLowerCase()) {
      return res.status(200).json({ ok: true, ignore: 'expéditeur = destinataire' });
    }

    const titre = l ? titreAeronef(l) : null;
    const lien = l ? `${SITE}/listing.html?id=${encodeURIComponent(l.id)}` : `${SITE}/messages.html`;
    const corpsMessage = esc(contenu).replace(/\n/g, '<br>');

    const html = gabarit({
      titre: titre ? 'Nouveau message sur votre annonce' : 'Nouveau message',
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
      sujet: titre ? `Message reçu — ${titre}` : 'Nouveau message sur Aircraft2Sell',
      html,
      replyTo: { email: expediteurEmail, name: expediteurNom },
    });

    if (!r.ok) return res.status(502).json({ error: r.erreur });
    return res.status(200).json({ ok: true, messageId: r.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/* ── TYPE new-listing : alerte admin pour modération ── */
async function newListing(req, res) {
  try {
    const corps = req.body || {};
    const id = corps.listingId || corps.listing_id || corps.id;

    let l = null;
    if (id) {
      const rows = await sb(`listings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
      l = rows && rows[0];
    }
    if (!l) l = corps;
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
      ctaLabel: 'Ouvrir la modération',
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

/* ── TYPE moderated : vendeur prévenu (approuvée / rejetée) ── */
async function moderated(req, res) {
  try {
    const corps = req.body || {};
    const id = corps.listing_id || corps.listingId || corps.id;
    if (!id) return res.status(400).json({ error: 'listing_id manquant' });

    const rows = await sb(`listings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const l = rows && rows[0];
    if (!l) return res.status(404).json({ error: 'Annonce introuvable' });
    if (!l.seller_email) return res.status(400).json({ error: 'Vendeur sans email' });

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
