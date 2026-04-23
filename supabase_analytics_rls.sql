-- ============================================================
-- RLS pour les tables analytics et listing_views
-- Coller dans Supabase > SQL Editor > Run
-- ============================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "analytics_insert"      ON public.analytics;
DROP POLICY IF EXISTS "analytics_read"        ON public.analytics;
DROP POLICY IF EXISTS "analytics_public_insert" ON public.analytics;
DROP POLICY IF EXISTS "analytics_admin_select" ON public.analytics;

DROP POLICY IF EXISTS "listing_views_insert"  ON public.listing_views;
DROP POLICY IF EXISTS "listing_views_read"    ON public.listing_views;
DROP POLICY IF EXISTS "listing_views_public_insert" ON public.listing_views;
DROP POLICY IF EXISTS "listing_views_admin_select"  ON public.listing_views;

-- ANALYTICS : tout le monde peut insérer (tracking anonyme), admin peut lire
CREATE POLICY "analytics_insert" ON public.analytics
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "analytics_read" ON public.analytics
FOR SELECT USING (
  auth.email() = 'contact@aircraft2sell.eu'
);

-- LISTING_VIEWS : idem
CREATE POLICY "listing_views_insert" ON public.listing_views
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "listing_views_read" ON public.listing_views
FOR SELECT USING (
  auth.email() = 'contact@aircraft2sell.eu'
);

-- Vérification
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('analytics', 'listing_views')
ORDER BY tablename, cmd;
