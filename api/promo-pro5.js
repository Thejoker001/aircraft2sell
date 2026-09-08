/**
 * api/promo-pro5.js
 * Offre de lancement : "Pro offert à vie" pour les 5 premiers professionnels
 * inscrits (courtiers/dealers = seller_type 'broker', aéroclubs/écoles = 'club').
 *
 * IMPORTANT — condition explicite du user : cette offre ne concerne QUE les
 * comptes créés via l'inscription GRATUITE (formule Essentiel). Un compte qui
 * a déjà payé Aviateur/Pro via checkout.html n'est pas éligible et ne consomme
 * PAS une place — sinon un professionnel pressé de payer priverait un autre
 * professionnel inscrit gratuitement d'une place qui lui revenait.
 *
 * Règle : "les 5 premiers" est calculé sur l'ORDRE D'INSCRIPTION réel
 * (registered_at), jamais sur l'ordre d'appel de cette fonction — ça évite
 * tout effet de course si plusieurs onboarding se terminent en même temps.
 *
 * Appelé par onboarding.html juste après qu'un utilisateur choisit un profil
 * professionnel (broker ou club/école).
 *
 * Corps accepté : { email }
 * Réponse : { ok, granted, remaining, rank? }
 */
import { preambule, sb, envoyer, gabarit, esc, ADMIN_EMAIL, SITE } from './_lib.js';

const TOTAL_PLACES = 5;
const TYPES_PRO = ['broker', 'club'];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Lecture publique du nombre de places restantes (pour affichage sur le site).
    // Aucune donnée personnelle exposée : uniquement un compteur.
    try {
      const filtreType = TYPES_PRO.map(t => `seller_type.eq.${t}`).join(',');
      const tousPros = await sb(
        `users?or=(${filtreType})&status=eq.active&select=plan,is_free`
      );
      const attribues = tousPros.filter(u => u.is_free === true).length;
      const remaining = Math.max(0, TOTAL_PLACES - attribues);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
      return res.status(200).json({ ok: true, remaining, total: TOTAL_PLACES });
    } catch (e) {
      return res.status(200).json({ ok: true, remaining: TOTAL_PLACES, total: TOTAL_PLACES });
    }
  }
  if (preambule(req, res)) return;

  try {
    const email = (req.body && req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    // Tous les comptes professionnels actifs, triés par date d'inscription réelle.
    // Filtre "inscription gratuite" : plan Essentiel (jamais payé), OU déjà
    // bénéficiaire de cette promo (is_free=true) — ne PAS compter un compte
    // qui a payé Aviateur/Pro via checkout.html, il n'a pas pris le chemin
    // d'inscription gratuite exigé par cette offre.
    const filtreType = TYPES_PRO.map(t => `seller_type.eq.${t}`).join(',');
    const tousPros = await sb(
      `users?or=(${filtreType})&status=eq.active&select=id,email,seller_type,is_free,is_pro,plan,registered_at,created_at` +
      `&order=registered_at.asc.nullslast,created_at.asc`
    );
    const pros = tousPros.filter(u => u.plan === 'Essentiel' || u.is_free === true);

    const cible = tousPros.find(u => (u.email || '').toLowerCase() === email);
    if (!cible) {
      return res.status(404).json({ error: 'Compte introuvable ou pas encore marqué professionnel' });
    }
    if (cible.plan !== 'Essentiel' && !cible.is_free) {
      // A payé un abonnement : inscription non gratuite, hors offre par design.
      return res.status(200).json({ ok: true, granted: false, remaining: null, reason: 'compte deja abonne payant — inscription gratuite requise' });
    }

    const cinqPremiers = pros.slice(0, TOTAL_PLACES);
    const rang = cinqPremiers.findIndex(u => u.id === cible.id) + 1; // 0 si hors liste
    const eligible = rang > 0 && rang <= TOTAL_PLACES;
    const remaining = Math.max(0, TOTAL_PLACES - Math.min(pros.length, TOTAL_PLACES));

    if (!eligible) {
      return res.status(200).json({ ok: true, granted: false, remaining, reason: 'offre complète' });
    }

    if (cible.is_free && cible.is_pro) {
      // Déjà accordé lors d'un appel précédent : pas de doublon, pas de re-notification.
      return res.status(200).json({ ok: true, granted: true, remaining, rank: rang, already: true });
    }

    // Attribution : PATCH conditionnel (is_free=false dans le filtre) pour
    // qu'un double-appel simultané ne déclenche jamais deux fois l'email.
    const supaUrl = process.env.SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const entetes = new Headers();
    entetes.set('apikey', supaKey);
    entetes.set('authorization', 'Bearer ' + supaKey);
    entetes.set('Content-Type', 'application/json');
    entetes.set('Prefer', 'return=representation');
    const url = `${supaUrl}/rest/v1/users?id=eq.${cible.id}&is_free=eq.false`;
    const r = await fetch(url, {
      method: 'PATCH',
      headers: entetes,
      body: JSON.stringify({ is_free: true, is_pro: true, plan: 'Pro' }),
    });
    if (!r.ok) {
      return res.status(502).json({ error: `Supabase ${r.status} : ${(await r.text()).slice(0, 200)}` });
    }
    const lignesModifiees = await r.json();
    const vraimentAccorde = Array.isArray(lignesModifiees) && lignesModifiees.length > 0;

    if (vraimentAccorde) {
      const html = gabarit({
        titre: 'Abonnement Pro offert à vie',
        intro: `Bonne nouvelle : vous faites partie des ${TOTAL_PLACES} premiers professionnels
          inscrits sur Aircraft2Sell. Votre abonnement <strong>Pro est offert, sans limite de
          durée</strong> — annonces illimitées, badge vendeur certifié, mise en avant
          prioritaire, zéro commission sur vos ventes.`,
        blocs: [
          ['Formule', 'Pro — offert à vie'],
          ['Rang', `${rang}${rang === 1 ? 'er' : 'ème'} professionnel inscrit`],
        ],
        cta: `${SITE}/post-listing.html`,
        ctaLabel: 'Publier ma première annonce',
        pied: `Cet avantage est lié à votre compte (${esc(email)}) et ne peut pas être transféré.`,
      });
      const rEmail = await envoyer({
        to: email,
        toName: cible.name || email,
        sujet: 'Aircraft2Sell — votre abonnement Pro est offert à vie',
        html,
      });
      // Un échec d'email ne doit jamais annuler l'octroi ni bloquer la réponse.
      if (!rEmail.ok) console.warn('promo-pro5: email non envoyé —', rEmail.erreur);

      // Info admin, best-effort.
      envoyer({
        to: ADMIN_EMAIL,
        toName: 'Administration Aircraft2Sell',
        sujet: `Promo Pro5 — place ${rang}/${TOTAL_PLACES} attribuée`,
        html: gabarit({
          titre: `Place ${rang}/${TOTAL_PLACES} de l'offre "Pro offert à vie" attribuée`,
          intro: `Le compte ${esc(email)} (${esc(cible.seller_type)}) vient de recevoir l'abonnement Pro offert à vie.`,
        }),
      }).catch(() => {});
    }

    return res.status(200).json({
      ok: true,
      granted: vraimentAccorde || (cible.is_free && cible.is_pro),
      remaining: Math.max(0, TOTAL_PLACES - rang),
      rank: rang,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
