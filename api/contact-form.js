/**
 * api/contact-form.js
 * Traite le formulaire de contact public (contact.html). Remplace l'appel
 * direct à l'API Brevo depuis le navigateur, qui exposait une clé API en
 * clair dans le HTML de la page (trouvée désactivée côté Brevo, mais le
 * code restait dangereux si une clé valide y était remise).
 *
 * Corps accepté : { first, last, email, subject, message }
 */
import { preambule, envoyer, gabarit, esc, ADMIN_EMAIL } from './_lib.js';

const SUJETS = {
  support: 'Support / Problème technique',
  listing: 'Question sur une annonce',
  billing: 'Facturation / Abonnement',
  partnership: 'Partenariat',
  press: 'Presse / Médias',
  other: 'Autre',
};

const BREVO_NEWSLETTER_LIST_ID = 6;

function estEmailValide(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Inscription newsletter — crée/actualise le contact Brevo avec opt-in, l'ajoute à la liste. */
async function inscrireNewsletter(req, res) {
  const corps = req.body || {};
  const email = String(corps.email || '').trim().toLowerCase();
  const lang = String(corps.lang || 'fr').trim().slice(0, 2);

  if (!estEmailValide(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const cle = process.env.BREVO_API_KEY;
  if (!cle) return res.status(500).json({ error: 'Configuration email absente' });

  try {
    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': cle, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        email,
        attributes: { OPT_IN: true, _DETECTED_LANGUAGE: lang.toUpperCase() },
        listIds: [BREVO_NEWSLETTER_LIST_ID],
        updateEnabled: true,
      }),
    });
    // Brevo renvoie 204 (déjà existant, mis à jour) ou 201 (créé) — les deux sont un succès.
    if (!r.ok && r.status !== 400) {
      const txt = await r.text();
      return res.status(502).json({ error: `Brevo ${r.status} : ${txt.slice(0, 200)}` });
    }
    // 400 "Contact already exist" : on force quand même l'ajout à la liste.
    if (r.status === 400) {
      const r2 = await fetch('https://api.brevo.com/v3/contacts/lists/' + BREVO_NEWSLETTER_LIST_ID + '/contacts/add', {
        method: 'POST',
        headers: { 'api-key': cle, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ emails: [email] }),
      });
      if (!r2.ok) {
        const txt2 = await r2.text();
        return res.status(502).json({ error: `Brevo ${r2.status} : ${txt2.slice(0, 200)}` });
      }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  const corps = req.body || {};
  if (corps.action === 'newsletter') {
    return inscrireNewsletter(req, res);
  }

  try {
    const corps = req.body || {};
    const first = String(corps.first || '').trim();
    const last = String(corps.last || '').trim();
    const email = String(corps.email || '').trim().toLowerCase();
    const subject = String(corps.subject || '').trim();
    const message = String(corps.message || '').trim();

    if (!first || !estEmailValide(email) || !message) {
      return res.status(400).json({ error: 'Champs requis manquants ou email invalide' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message trop long' });
    }

    const sujetLabel = SUJETS[subject] || subject || 'Contact';
    const nomComplet = [first, last].filter(Boolean).join(' ');

    const htmlAdmin = gabarit({
      titre: 'Nouveau message de contact',
      intro: `Un visiteur a envoyé un message via le formulaire de contact.`,
      blocs: [
        ['De', esc(nomComplet)],
        ['Email', `<a href="mailto:${esc(email)}" style="color:#1E5FCC;text-decoration:none">${esc(email)}</a>`],
        ['Objet', esc(sujetLabel)],
      ],
      pied: `Message :<br>${esc(message).replace(/\n/g, '<br>')}`,
    });

    const rAdmin = await envoyer({
      to: ADMIN_EMAIL,
      toName: 'Administration Aircraft2Sell',
      sujet: `[Contact A2S] ${sujetLabel} — ${nomComplet}`,
      html: htmlAdmin,
      replyTo: { email, name: nomComplet || email },
    });
    if (!rAdmin.ok) return res.status(502).json({ error: rAdmin.erreur });

    // Confirmation au visiteur — best-effort, ne bloque jamais la réponse.
    const htmlVisiteur = gabarit({
      titre: 'Nous avons bien reçu votre message',
      intro: `Bonjour ${esc(first)},<br><br>Nous avons bien reçu votre message et notre équipe vous répondra sous 24 h, 7 jours sur 7.`,
    });
    envoyer({
      to: email,
      toName: first,
      sujet: 'Nous avons bien reçu votre message — Aircraft2Sell',
      html: htmlVisiteur,
    }).catch(() => {});

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
