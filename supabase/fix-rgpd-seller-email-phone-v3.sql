-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — CORRECTIF RGPD v3 (définitif) : vue publique
-- sans email/téléphone vendeur (audit du 18/09/2026)
--
-- LEÇON DES v1/v2 (annulées) : révoquer SELECT au niveau colonne sur
-- `listings` casse tout code utilisant select=* (PostgREST exige le
-- privilège table complet pour résoudre '*') — plusieurs pages du
-- site (listing.html, search.html, index.html) utilisent select=*.
-- Une révocation en place a cassé listing.html en production
-- (quelques minutes), rollback immédiat effectué (grant select on
-- listings to anon restauré à l'identique de l'état avant audit).
--
-- SOLUTION RETENUE : ne pas toucher aux privilèges de `listings`
-- (la table reste inchangée, select=* continue de fonctionner pour
-- authenticated ET anon comme avant). On ajoute une VUE dédiée à
-- l'usage public, listings_public, qui expose les mêmes colonnes
-- SAUF seller_email et seller_phone, filtrée sur status='live'.
-- Le front est mis à jour pour interroger cette vue au lieu de la
-- table brute UNIQUEMENT dans les pages consultées par un visiteur
-- anonyme non connecté à ses propres données (search.html, la liste
-- "annonces similaires" de listing.html, le compteur d'index.html).
-- dashboard.html / post-listing.html / messages.html continuent
-- d'interroger `listings` directement (RLS listings_read_own déjà
-- en place, l'utilisateur authentifié voit ses propres données).
--
-- La page d'une annonce individuelle (listing.html, chargement par
-- id) continue elle aussi d'utiliser `listings` (table brute) car
-- sendMsg() a besoin de LISTING.seller_email pour construire le
-- message ; cf. commit suivant qui déplace cette résolution côté
-- serveur (api/notify.js le fait déjà pour l'email transactionnel ;
-- l'écriture directe dans `messages` est corrigée séparément).
-- ═══════════════════════════════════════════════════════════════

create or replace view public.listings_public as
select
  id, make, model, year, price, currency, category, airport, country,
  description, status, seller_name, views, enquiries, icon,
  submitted_at, created_at, photos, seller_rating, seller_certified,
  hours, smoh, engine, seats, range, avionics, equipment, registration,
  documents, price_type, ifr, rvsm, adsb, logs, hours_prop, seller_pseudo,
  featured, weekly_pick, featured_until, expires_at, seller_is_pro,
  seller_company
from public.listings
where status = 'live';

grant select on public.listings_public to anon, authenticated;

-- Vérification (à exécuter séparément) :
-- select seller_email from listings_public limit 1;
-- -> doit échouer avec "column seller_email does not exist"
--    (la colonne n'existe pas dans la vue, pas une histoire de droits)
