-- ============================================================
-- Aircraft2Sell — Ajoute description_en aux 3 vues listings_*
-- Suite de supabase/add-description-en.sql : la colonne existe sur la
-- table listings, mais les 3 vues qui exposent les annonces au front
-- (listings_public, listings_mine, listings_admin) listent leurs colonnes
-- explicitement — CREATE OR REPLACE VIEW garde les GRANT déjà posés, donc
-- pas besoin de les reposer après ce script.
--
-- IMPORTANT : PostgreSQL interdit de changer la position/le nom d'une
-- colonne existante via CREATE OR REPLACE VIEW (erreur 42P16 si on insère
-- une colonne au milieu de la liste) — la nouvelle colonne doit être
-- ajoutée en DERNIÈRE position, jamais réordonnée pour "faire joli".
--
-- listings_public : lue par search.html/en/search.html, index.html,
--   comparateur.html, map.html (status='live' uniquement).
-- listings_mine : dashboard.html (annonces du vendeur connecté).
-- listings_admin : admin-a2s00760.html / moderation.html (modération).
--
-- Exécuté le 2026-10-06. Coller dans Supabase > SQL Editor > New Query > Run
-- ============================================================

create or replace view public.listings_public as
select id, make, model, year, price, currency, category, airport, country,
       description, status, seller_name, views, enquiries,
       icon, submitted_at, created_at, photos, seller_rating, seller_certified,
       hours, smoh, engine, seats, range, avionics, equipment, registration,
       documents, price_type, ifr, rvsm, adsb, logs, hours_prop, seller_pseudo,
       featured, weekly_pick, featured_until, expires_at, seller_is_pro,
       seller_company, video_url, description_en
from public.listings
where status = 'live';

create or replace view public.listings_mine as
select id, make, model, year, price, currency, category, airport, country,
       description, status, seller_name, seller_email, views,
       enquiries, icon, rejection_reason, submitted_at, created_at, photos,
       seller_rating, seller_certified, hours, smoh, engine, seats, range,
       avionics, equipment, registration, documents, price_type, ifr, rvsm,
       adsb, logs, hours_prop, seller_phone, seller_pseudo, featured,
       weekly_pick, featured_until, expires_at, seller_is_pro, seller_company,
       description_en
from public.listings
where lower(seller_email) = lower(coalesce((auth.jwt() ->> 'email'), ''));

create or replace view public.listings_admin as
select id, make, model, year, price, currency, category, airport, country,
       description, status, seller_name, seller_email, views,
       enquiries, icon, rejection_reason, submitted_at, created_at, photos,
       seller_rating, seller_certified, hours, smoh, engine, seats, range,
       avionics, equipment, registration, documents, price_type, ifr, rvsm,
       adsb, logs, hours_prop, seller_phone, seller_pseudo, featured,
       weekly_pick, featured_until, expires_at, seller_is_pro, seller_company,
       description_en
from public.listings
where lower(coalesce((auth.jwt() ->> 'email'), '')) = 'contact@aircraft2sell.eu';
