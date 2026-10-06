-- ============================================================
-- Aircraft2Sell — Ajout colonne description_en (listings)
-- Permet d'afficher la description de l'annonce en anglais sur les
-- pages /en/ sans jamais toucher au texte original saisi par le
-- vendeur (description reste la source de vérité, souvent en FR).
--
-- Remplissage :
--   - nouvelles annonces / modifications : api/notify.js traduit
--     automatiquement via Groq au moment de l'approbation (voir
--     POST /api/notify?type=translate-description), écrit
--     directement cette colonne.
--   - rattrapage ponctuel des annonces déjà live : scripts/
--     translate-descriptions.mjs (une fois, à la mise en place).
--
-- Exécuté le 2026-10-06 (voir commit i18n: descriptions d'annonces
-- traduites en anglais). Conservé pour traçabilité / rejouabilité
-- sur un environnement de test.
--
-- Coller dans Supabase > SQL Editor > New Query > Run
-- ============================================================

alter table public.listings
  add column if not exists description_en text;

comment on column public.listings.description_en is
  'Traduction anglaise de description, générée automatiquement (Groq) à la validation de l''annonce. NULL si jamais traduite — le front retombe alors sur description.';

-- IMPORTANT : une colonne ajoutée par ALTER TABLE n'hérite PAS
-- automatiquement des GRANT déjà posés sur la table (confirmé en pratique :
-- `description` avait SELECT pour anon/authenticated, mais description_en
-- nouvellement créée n'en avait aucun — testé via
-- information_schema.column_privileges avant ce GRANT). Sans cette ligne,
-- l'API publique (clé anon utilisée par le front) ne peut PAS lire
-- description_en malgré une politique RLS qui autoriserait la ligne —
-- PostgreSQL bloque au niveau colonne avant même d'évaluer la RLS.
grant select on public.listings to anon, authenticated;
