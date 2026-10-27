/**
 * api/stripe-webhook.js — Confirmation de paiement Stripe
 *
 * Reçoit les événements Stripe (checkout.session.completed) et met à jour
 * le plan de l'utilisateur dans Supabase. La signature est vérifiée avec
 * le secret de webhook (STRIPE_WEBHOOK_SECRET) — sans lui, un attaquant
 * pourrait marquer n'importe quel compte comme payant.
 *
 *   POST /api/stripe-webhook   (headers stripe-signature obligatoires)
 *
 * Variables Vercel requises : STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY
 * (pour récupérer la session), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { sb, envoyer, gabarit, esc, ADMIN_EMAIL, SITE } from './_lib.js';

const STRIPE = 'https://api.stripe.com/v1';

/* Empêche Vercel de parser automatiquement le JSON en objet — la
   vérification de signature Stripe exige le corps BRUT, octet pour octet,
   tel qu'envoyé. JSON.stringify(objet reparsé) ne correspond PAS forcément
   au texte original (ordre des clés, espaces, unicode) : la signature HMAC
   échouait silencieusement sur les paiements réels (pending_webhooks bloqué
   côté Stripe), alors que des tests manuels avec un payload trivial
   « marchaient » par coïncidence. */
export const config = { api: { bodyParser: false } };

function lireCorpsBrut(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  /* Le webhook Stripe envoie un body brut (pas du JSON par défaut) et la
     signature dans l'en-tête stripe-signature. */
  let raw = '';
  try {
    raw = await lireCorpsBrut(req);
  } catch (e) {
    raw = '';
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers['stripe-signature'] || '';

  if (!secret) {
    /* Webhook pas encore configuré : on refuse proprement (500 pour que
       Stripe réessaie plus tard) au lieu d'accepter n'importe quoi. */
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET non configuré' });
  }

  try {
    /* Vérification de signature (construction manuelle t=...,v1=...) */
    const parts = {};
    signature.split(',').forEach((p) => {
      const [k, v] = p.split('=');
      if (k) parts[k.trim()] = (v || '').trim();
    });
    const t = parts.t || '';
    const v1 = parts.v1 || '';
    const signed = `${t}.${raw}`;
    const crypto = await import('node:crypto');
    const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
    const okSig = v1.length > 0 && expected.length === v1.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));

    /* Tolérance de 5 minutes sur l'horodatage. */
    const now = Math.floor(Date.now() / 1000);
    const age = Math.abs(now - parseInt(t, 10) || 0);
    if (!okSig || age > 300) {
      return res.status(400).json({ error: 'Signature invalide' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Signature invalide' });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch (e) {
    return res.status(400).json({ error: 'JSON invalide' });
  }

  /* On ne traite que les événements utiles. */
  if (event.type === 'checkout.session.completed') {
    try {
      const session = event.data.object || {};
      const email = session.client_reference_id || session.customer_details?.email || '';

      /* Abonnement PARTENAIRE (Payment Links statiques, metadata kind=partner
         posée sur le Payment Link lui-même — voir stripe-admin.js). L'email
         de paiement est souvent celui de l'admin (qui règle pour le compte
         du partenaire), jamais fiable pour retrouver la ligne `partners` :
         on relie donc par nom de société (customer_details.business_name/name)
         vers une ligne encore non liée (stripe_customer_id IS NULL) du même
         palier. Ambigu ou introuvable -> alerte admin pour liaison manuelle,
         JAMAIS de liaison au hasard. Traitement totalement séparé du flux
         vendeur/Pro ci-dessous (return immédiat). */
      const kindMeta = (session.metadata && session.metadata.kind) || '';
      if (kindMeta === 'partner') {
        try {
          const tier = (session.metadata && session.metadata.tier) || 'decouverte';
          const customerId = session.customer || '';
          const dejaLie = customerId
            ? await sb(`partners?stripe_customer_id=eq.${encodeURIComponent(customerId)}&select=id&limit=1`)
            : [];
          if (!dejaLie || !dejaLie.length) {
            const nomPaiement = (session.customer_details &&
              (session.customer_details.business_name || session.customer_details.name)) || '';
            const normaliser = (s) => String(s || '')
              .toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^A-Z0-9]/g, '');
            const nomNorm = normaliser(nomPaiement);
            const candidats = await sb(
              `partners?tier=eq.${encodeURIComponent(tier)}&status=in.(pending,active)` +
              `&stripe_customer_id=is.null&select=id,company,status`
            );
            const correspondances = (candidats || []).filter((p) => {
              const compNorm = normaliser(p.company);
              return compNorm && nomNorm && (compNorm.includes(nomNorm) || nomNorm.includes(compNorm));
            });
            const clefService = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const authSbHdr = 'Bearer' + ' ' + clefService;
            if (correspondances.length === 1 && customerId) {
              const partnerMatch = correspondances[0];
              await fetch(`${process.env.SUPABASE_URL}/rest/v1/partners?id=eq.${partnerMatch.id}`, {
                method: 'PATCH',
                headers: { apikey: clefService, Authorization: authSbHdr, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
                body: JSON.stringify({ stripe_customer_id: customerId, status: 'active' }),
              });
              envoyer({
                to: ADMIN_EMAIL,
                toName: 'Administration Aircraft2Sell',
                sujet: `Partenaire relié à Stripe — ${partnerMatch.company}`,
                html: gabarit({
                  titre: 'Partenaire activé',
                  intro: `${esc(partnerMatch.company)} (palier ${esc(tier)}) relié automatiquement ` +
                         `au client Stripe ${esc(customerId)}.`,
                }),
              }).catch((e) => console.error('email partner lié admin:', e.message));
            } else {
              envoyer({
                to: ADMIN_EMAIL,
                toName: 'Administration Aircraft2Sell',
                sujet: `Paiement partenaire à lier manuellement (${tier})`,
                html: gabarit({
                  titre: 'Liaison partenaire requise',
                  intro: `Paiement reçu — nom : ${esc(nomPaiement || 'inconnu')}, palier ${esc(tier)}, ` +
                         `client Stripe ${esc(customerId || 'inconnu')}. ${correspondances.length} correspondance(s) ` +
                         `trouvée(s) dans la table partners (0 ou plusieurs = ambigu). Lier manuellement ` +
                         `stripe_customer_id sur la ligne partners concernée.`,
                }),
              }).catch((e) => console.error('email partner à lier admin:', e.message));
            }
          }
        } catch (e) {
          console.error('webhook partner checkout:', e.message);
        }
        return res.status(200).json({ received: true, partner: true });
      }

      /* Mention TVA sur toute facture future : la société n'est pas
         assujettie à la TVA (sous le seuil d'immatriculation estonien).
         Appliqué sur l'abonnement créé (vendeurs ET partenaires, quelle
         que soit la source — Payment Link ou /api/create-checkout) pour
         que Stripe l'affiche automatiquement sur chaque facture récurrente
         sans action manuelle. Best-effort : une erreur ici ne doit jamais
         bloquer le reste du traitement du paiement. */
      if (session.subscription && process.env.STRIPE_SECRET_KEY) {
        fetch(`${STRIPE}/subscriptions/${session.subscription}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'invoice_settings[footer]=' + encodeURIComponent(
            "Aircraft2Sell OÜ is not registered for VAT / n'est pas assujettie à la TVA."
          ),
        }).catch((e) => console.error('footer TVA subscription:', e.message));
      }
      const plan = (session.metadata && session.metadata.plan) || 'aviateur';
      const addon = (session.metadata && session.metadata.addon) === '1';
      const featureId = (session.metadata && session.metadata.feature) || '';

      /* Mise en avant d'annonce (B4) : paiement unique, pas d'abonnement.
         Action directe (PATCH listings featured) — plus de fonction
         feature-listing.js (limite Hobby de 12 fonctions serverless). */
      if (featureId) {
        try {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/listings?id=eq.${encodeURIComponent(featureId)}`, {
            method: 'PATCH',
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ featured: true, featured_until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() }),
          });
          if (email) {
            await envoyer({
              to: email,
              toName: email,
              sujet: 'Votre annonce est en vedette — Aircraft2Sell',
              html: gabarit({
                titre: 'Annonce mise en avant',
                intro: 'Votre annonce est <strong>en vedette</strong> sur Aircraft2Sell pour 30 jours. Elle apparaît en tête des recherches.',
                cta: `${SITE}/dashboard.html`,
                ctaLabel: 'Voir mon tableau de bord',
              }),
            }).catch(() => {});
          }
        } catch (featErr) {
          console.error('feature activation error:', featErr.message);
        }
        return res.status(200).json({ received: true, feature: featureId });
      }

      if (email) {
        const planFinal = plan === 'pro' ? 'Pro' : 'Aviateur';
        const rows = await sb(`users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`);
        const user = rows && rows[0];
        if (user) {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              plan: planFinal,
              is_pro: plan === 'pro',
              is_free: false,
              addon_photos: addon || null,
            }),
          });
        }

        /* Confirmation au client + notification admin (best-effort). */
        envoyer({
          to: email,
          toName: email,
          sujet: `Votre abonnement ${planFinal} est actif — Aircraft2Sell`,
          html: gabarit({
            titre: 'Paiement confirmé',
            intro: `Votre abonnement <strong>${planFinal}</strong> est actif. Merci de votre confiance !`,
            cta: `${SITE}/dashboard.html`,
            ctaLabel: 'Accéder à mon espace',
          }),
        }).catch(() => {});
        envoyer({
          to: ADMIN_EMAIL,
          toName: 'Administration Aircraft2Sell',
          sujet: `Nouveau paiement ${planFinal} — ${email}`,
          html: gabarit({
            titre: `Nouvel abonnement ${planFinal}`,
            intro: `${esc(email)} vient de souscrire à la formule ${planFinal}${addon ? ' + Photos+' : ''}.`,
          }),
        }).catch(() => {});
      }
    } catch (e) {
      /* Une erreur de traitement ne doit pas faire renvoyer 500 à Stripe
         (sinon il rejoue l'événement indéfiniment) : on loggue et on
         accuse réception. */
      console.error('webhook checkout.session.completed:', e.message);
    }
  }

  /* Copie de chaque facture émise (client + admin). Déclenché à chaque
     facture payée — abonnement vendeur, Pro, ou Payment Link partenaire,
     peu importe la source. L'événement est déjà activé côté Stripe
     (voir webhook_endpoints) ; il manquait juste le traitement ici. */
  if (event.type === 'invoice.payment_succeeded') {
    try {
      const invoice = event.data.object || {};
      const email = (invoice.customer_email || '').trim();
      const nom = invoice.customer_name || email || 'Client';
      const numero = invoice.number || invoice.id;
      const montant = ((invoice.amount_paid || 0) / 100).toLocaleString('fr-FR');
      const devise = (invoice.currency || 'eur').toUpperCase();
      const lienFacture = invoice.hosted_invoice_url || invoice.invoice_pdf || '';
      const lienPdf = invoice.invoice_pdf || '';

      if (email && lienFacture) {
        envoyer({
          to: email,
          toName: nom,
          sujet: `Votre facture Aircraft2Sell n°${numero}`,
          html: gabarit({
            titre: 'Facture',
            intro: `Merci pour votre paiement de <strong>${montant} ${devise}</strong>. ` +
                   `Voici votre facture n°${esc(numero)}.`,
            cta: lienFacture,
            ctaLabel: 'Voir / télécharger la facture',
          }),
        }).catch((e) => console.error('email facture client:', e.message));
      }

      envoyer({
        to: ADMIN_EMAIL,
        toName: 'Administration Aircraft2Sell',
        sujet: `Copie facture n°${numero} — ${email || 'client inconnu'}`,
        html: gabarit({
          titre: 'Copie de facture émise',
          intro: `Facture n°${esc(numero)} — <strong>${montant} ${devise}</strong> — ` +
                 `client : ${esc(email || 'inconnu')} (${esc(nom)}).`,
          cta: lienFacture || lienPdf,
          ctaLabel: 'Voir la facture',
        }),
      }).catch((e) => console.error('email facture admin:', e.message));
    } catch (e) {
      console.error('webhook invoice.payment_succeeded:', e.message);
    }
  }

  /* Premier échec de paiement (carte refusée, fonds insuffisants...).
     Stripe va automatiquement réessayer selon ses règles « Smart Retries » ;
     on se contente d'avertir le client (lien pour mettre à jour sa carte)
     et l'admin, SANS toucher à l'accès — le downgrade réel n'intervient
     que sur customer.subscription.updated (statut past_due/unpaid)
     ci-dessous, qui reflète la décision finale de Stripe sur l'abonnement. */
  if (event.type === 'invoice.payment_failed') {
    try {
      const invoice = event.data.object || {};
      const email = (invoice.customer_email || '').trim();
      const nom = invoice.customer_name || email || 'Client';
      const montant = ((invoice.amount_due || 0) / 100).toLocaleString('fr-FR');
      const devise = (invoice.currency || 'eur').toUpperCase();
      const tentative = invoice.attempt_count || 1;
      const lienPaiement = invoice.hosted_invoice_url || `${SITE}/dashboard.html`;

      if (email) {
        envoyer({
          to: email,
          toName: nom,
          sujet: 'Problème avec votre paiement — Aircraft2Sell',
          html: gabarit({
            titre: 'Paiement refusé',
            intro: `Le prélèvement de <strong>${montant} ${devise}</strong> pour votre abonnement ` +
                   `Aircraft2Sell a échoué (tentative n°${tentative}). Merci de mettre à jour votre ` +
                   `moyen de paiement pour éviter la suspension de votre abonnement.`,
            cta: lienPaiement,
            ctaLabel: 'Mettre à jour mon paiement',
          }),
        }).catch((e) => console.error('email payment_failed client:', e.message));
      }

      envoyer({
        to: ADMIN_EMAIL,
        toName: 'Administration Aircraft2Sell',
        sujet: `Paiement échoué (tentative ${tentative}) — ${email || 'client inconnu'}`,
        html: gabarit({
          titre: 'Échec de paiement',
          intro: `${esc(email || 'Client inconnu')} — ${montant} ${devise} — tentative n°${tentative}. ` +
                 `Stripe va réessayer automatiquement.`,
          cta: lienPaiement,
          ctaLabel: 'Voir la facture',
        }),
      }).catch((e) => console.error('email payment_failed admin:', e.message));
    } catch (e) {
      console.error('webhook invoice.payment_failed:', e.message);
    }
  }

  /* Changement de statut d'abonnement. On downgrade DÈS que Stripe déclare
     l'abonnement past_due/unpaid — plutôt que d'attendre la suppression
     finale (customer.subscription.deleted), qui peut survenir plusieurs
     semaines plus tard selon les règles de relance du compte. */
  if (event.type === 'customer.subscription.updated') {
    try {
      const sub = event.data.object || {};
      const statutsCoupure = ['past_due', 'unpaid'];
      const cusIdPartenaire = sub.customer;

      /* Abonnement PARTENAIRE : identifié directement par stripe_customer_id
         (posé au premier paiement, cf. checkout.session.completed ci-dessus)
         — pas besoin de refaire un fetch customer ni de passer par un email.
         Suspension sur past_due/unpaid, réactivation automatique si le
         paiement est régularisé (retour à active). Flux totalement séparé
         de la table users ci-dessous (estPartenaire court-circuite le reste). */
      let estPartenaire = false;
      if (cusIdPartenaire) {
        try {
          const partnerRows = await sb(
            `partners?stripe_customer_id=eq.${encodeURIComponent(cusIdPartenaire)}&select=id,company,status&limit=1`
          );
          const partner = partnerRows && partnerRows[0];
          if (partner) {
            estPartenaire = true;
            const clefService = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const authSbHdr = 'Bearer' + ' ' + clefService;
            if (statutsCoupure.includes(sub.status) && partner.status !== 'suspended') {
              await fetch(`${process.env.SUPABASE_URL}/rest/v1/partners?id=eq.${partner.id}`, {
                method: 'PATCH',
                headers: { apikey: clefService, Authorization: authSbHdr, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
                body: JSON.stringify({ status: 'suspended' }),
              });
              envoyer({
                to: ADMIN_EMAIL,
                toName: 'Administration Aircraft2Sell',
                sujet: `Partenaire suspendu (impayé) — ${partner.company}`,
                html: gabarit({
                  titre: 'Partenaire suspendu',
                  intro: `${esc(partner.company)} repassé en statut « suspendu » (Stripe : ${esc(sub.status)}). ` +
                         `Son logo n'apparaît plus sur le site tant que le paiement n'est pas régularisé.`,
                }),
              }).catch((e) => console.error('email partner suspended:', e.message));
            } else if (sub.status === 'active' && partner.status === 'suspended') {
              await fetch(`${process.env.SUPABASE_URL}/rest/v1/partners?id=eq.${partner.id}`, {
                method: 'PATCH',
                headers: { apikey: clefService, Authorization: authSbHdr, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
                body: JSON.stringify({ status: 'active' }),
              });
              envoyer({
                to: ADMIN_EMAIL,
                toName: 'Administration Aircraft2Sell',
                sujet: `Partenaire réactivé — ${partner.company}`,
                html: gabarit({
                  titre: 'Partenaire réactivé',
                  intro: `${esc(partner.company)} repassé en statut actif (paiement régularisé).`,
                }),
              }).catch((e) => console.error('email partner reactivated:', e.message));
            }
          }
        } catch (e) {
          console.error('webhook partner lookup updated:', e.message);
        }
      }

      if (!estPartenaire && statutsCoupure.includes(sub.status)) {
        const cusId = sub.customer;
        if (cusId && process.env.STRIPE_SECRET_KEY) {
          const authStripeHdr = 'Bearer' + ' ' + process.env.STRIPE_SECRET_KEY;
          const r = await fetch(`${STRIPE}/customers/${cusId}`, {
            headers: { Authorization: authStripeHdr },
          });
          if (r.ok) {
            const cust = await r.json();
            const email = String(cust.email || '').trim().toLowerCase();
            const nom = cust.name || email;
            if (email) {
              const rows = await sb(`users?email=eq.${encodeURIComponent(email)}&select=id,plan&limit=1`);
              const user = rows && rows[0];
              /* Idempotence : n'envoie l'email/ne notifie que si le plan
                 était encore Pro/Aviateur (évite de spammer à chaque
                 nouvel événement updated tant que le statut reste bloqué). */
              const etaitPayant = user && user.plan && user.plan !== 'Essentiel';
              if (user) {
                const clefService = process.env.SUPABASE_SERVICE_ROLE_KEY;
                const authSbHdr = 'Bearer' + ' ' + clefService;
                await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
                  method: 'PATCH',
                  headers: {
                    apikey: clefService,
                    Authorization: authSbHdr,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal',
                  },
                  body: JSON.stringify({ plan: 'Essentiel', is_pro: false }),
                });
              }
              if (etaitPayant) {
                /* Lien pour régulariser : facture la plus récente si
                   disponible, sinon le tableau de bord. */
                let lienRegul = `${SITE}/dashboard.html`;
                try {
                  if (sub.latest_invoice) {
                    const authStripeHdr2 = 'Bearer' + ' ' + process.env.STRIPE_SECRET_KEY;
                    const ri = await fetch(`${STRIPE}/invoices/${sub.latest_invoice}`, {
                      headers: { Authorization: authStripeHdr2 },
                    });
                    if (ri.ok) {
                      const inv = await ri.json();
                      lienRegul = inv.hosted_invoice_url || lienRegul;
                    }
                  }
                } catch { /* best-effort */ }

                envoyer({
                  to: email,
                  toName: nom,
                  sujet: 'Votre abonnement a été suspendu — Aircraft2Sell',
                  html: gabarit({
                    titre: 'Abonnement suspendu',
                    intro: `Faute de paiement, votre abonnement a été suspendu et votre compte ` +
                           `est repassé en formule Essentiel. Réglez votre facture pour retrouver ` +
                           `votre accès complet.`,
                    cta: lienRegul,
                    ctaLabel: 'Régulariser mon paiement',
                  }),
                }).catch((e) => console.error('email subscription.updated client:', e.message));

                envoyer({
                  to: ADMIN_EMAIL,
                  toName: 'Administration Aircraft2Sell',
                  sujet: `Abonnement suspendu (${sub.status}) — ${email}`,
                  html: gabarit({
                    titre: 'Downgrade automatique',
                    intro: `${esc(email)} repassé en Essentiel (statut Stripe : ${esc(sub.status)}).`,
                  }),
                }).catch((e) => console.error('email subscription.updated admin:', e.message));
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('webhook subscription.updated:', e.message);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    try {
      const sub = event.data.object || {};
      const cusId = sub.customer;

      /* Abonnement PARTENAIRE résilié définitivement : status='expired',
         le logo disparaît du site (policy publique filtre sur status='active'). */
      let estPartenaire = false;
      if (cusId) {
        try {
          const partnerRows = await sb(
            `partners?stripe_customer_id=eq.${encodeURIComponent(cusId)}&select=id,company&limit=1`
          );
          const partner = partnerRows && partnerRows[0];
          if (partner) {
            estPartenaire = true;
            const clefService = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const authSbHdr = 'Bearer' + ' ' + clefService;
            await fetch(`${process.env.SUPABASE_URL}/rest/v1/partners?id=eq.${partner.id}`, {
              method: 'PATCH',
              headers: { apikey: clefService, Authorization: authSbHdr, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
              body: JSON.stringify({ status: 'expired' }),
            });
            envoyer({
              to: ADMIN_EMAIL,
              toName: 'Administration Aircraft2Sell',
              sujet: `Partenariat résilié — ${partner.company}`,
              html: gabarit({
                titre: 'Partenariat résilié',
                intro: `${esc(partner.company)} — abonnement Stripe résilié définitivement. ` +
                       `Son logo est retiré du site.`,
              }),
            }).catch((e) => console.error('email partner deleted:', e.message));
          }
        } catch (e) {
          console.error('webhook partner lookup deleted:', e.message);
        }
      }

      if (!estPartenaire && cusId && process.env.STRIPE_SECRET_KEY) {
        const r = await fetch(`${STRIPE}/customers/${cusId}`, {
          headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        });
        if (r.ok) {
          const cust = await r.json();
          const email = String(cust.email || '').trim().toLowerCase();
          if (email) {
            const rows = await sb(`users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`);
            const user = rows && rows[0];
            if (user) {
              await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
                method: 'PATCH',
                headers: {
                  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
                  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal',
                },
                body: JSON.stringify({ plan: 'Essentiel', is_pro: false }),
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('webhook subscription.deleted:', e.message);
    }
  }

  /* Toujours accuser réception (200) pour les événements connus/ignorés. */
  return res.status(200).json({ received: true });
}
