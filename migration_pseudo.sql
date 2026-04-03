-- ============================================================
-- Migration Aircraft2Sell — Ajout colonne pseudo
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter la colonne pseudo dans users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pseudo TEXT;

-- 2. Contrainte : pseudo unique si renseigné
CREATE UNIQUE INDEX IF NOT EXISTS users_pseudo_unique
  ON public.users (pseudo)
  WHERE pseudo IS NOT NULL;

-- 3. Contrainte longueur et format
ALTER TABLE public.users
  ADD CONSTRAINT IF NOT EXISTS pseudo_format
  CHECK (pseudo IS NULL OR (
    length(pseudo) BETWEEN 3 AND 30
    AND pseudo ~ '^[a-zA-Z0-9_.éèàûôîùçëïü\-]+$'
  ));

-- 4. Ajouter seller_pseudo dans listings (colonne calculée ou stockée)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS seller_pseudo TEXT;

-- 5. Index pour recherche par pseudo
CREATE INDEX IF NOT EXISTS idx_users_pseudo ON public.users(pseudo);
CREATE INDEX IF NOT EXISTS idx_listings_seller_pseudo ON public.listings(seller_pseudo);

-- 6. Fonction trigger : sync seller_pseudo dans listings quand users.pseudo change
CREATE OR REPLACE FUNCTION sync_seller_pseudo()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings
  SET seller_pseudo = NEW.pseudo
  WHERE seller_email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER IF NOT EXISTS trg_sync_seller_pseudo
  AFTER UPDATE OF pseudo ON public.users
  FOR EACH ROW EXECUTE FUNCTION sync_seller_pseudo();

-- ============================================================
-- RÉSULTAT : 
-- - users.pseudo : pseudo public unique par utilisateur
-- - listings.seller_pseudo : pseudo affiché sur les annonces
-- - Trigger de sync automatique
-- ============================================================
