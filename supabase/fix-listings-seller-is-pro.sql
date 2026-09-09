-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — CORRECTIF : publication annonce 400
-- « Could not find the 'seller_is_pro' column of 'listings' »
--
-- CONSTAT (2026-09-09) : post-listing.html (FR/EN/ET) recopie l'état du
-- compte vendeur sur l'annonce (bloc certification) et envoie les champs
-- seller_is_pro et seller_company dans l'INSERT listings. Ces colonnes
-- n'existaient PAS dans la table → PostgREST répondait 400 et AUCUN
-- vendeur ne pouvait publier (le champ seller_is_pro est envoyé même à
-- false). search.html lit déjà seller_is_pro (badge PRO) : les colonnes
-- sont le pendant logique de seller_certified/seller_pseudo/seller_rating.
--
-- CORRECTIF : ajout des 2 colonnes manquantes (idempotent).
-- ═══════════════════════════════════════════════════════════════

alter table public.listings add column if not exists seller_is_pro boolean default false;
alter table public.listings add column if not exists seller_company text;
