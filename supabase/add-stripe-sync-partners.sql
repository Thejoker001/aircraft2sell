-- Synchronisation Stripe <-> partners (27/10/26)
--
-- CONTEXTE : les abonnements partenaires (Payment Links statiques, 3 paliers)
-- n'étaient jamais reliés à la table partners après paiement. Un partenaire
-- qui arrêtait de payer (carte refusée, résiliation) gardait status='active'
-- pour toujours — son logo restait affiché gratuitement sur le site.
--
-- stripe_customer_id permet au webhook (api/stripe-webhook.js) de retrouver
-- la ligne partners correspondant à un customer Stripe SANS dépendre de
-- l'email de paiement (souvent celui de l'admin qui règle pour le compte du
-- partenaire, pas contact_email) ni du nom de société (saisie libre,
-- fautes de frappe). Rempli automatiquement au premier paiement réussi
-- (checkout.session.completed, metadata.kind='partner') si un matching
-- fiable est possible, sinon laissé à renseigner manuellement.
--
-- 'suspended' (nouveau statut) : distinct d'expired (fin de contrat normale)
-- — utilisé quand Stripe signale past_due/unpaid sur l'abonnement.

alter table public.partners
  add column if not exists stripe_customer_id text;

alter table public.partners
  drop constraint if exists partners_status_check;

alter table public.partners
  add constraint partners_status_check
  check (status in ('pending','active','expired','rejected','suspended'));

create unique index if not exists partners_stripe_customer_id_idx
  on public.partners (stripe_customer_id) where stripe_customer_id is not null;
