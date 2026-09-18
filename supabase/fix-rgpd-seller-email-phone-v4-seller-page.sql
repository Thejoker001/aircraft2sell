-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — CORRECTIF RGPD étape 2/3 : seller.html
--
-- seller.html filtre les annonces d'un vendeur par
-- seller_email=eq.<email extrait de l'URL>. La vue listings_public
-- n'expose pas seller_email (par design), donc impossible de
-- filtrer dessus via PostgREST. Solution : réutiliser le pattern
-- déjà en place pour get_seller_public() (fonction SECURITY DEFINER
-- qui reçoit l'email en paramètre d'entrée, jamais en colonne de
-- sortie) — get_seller_listings() fait la même chose pour les
-- annonces : l'email sert de critère de filtre côté serveur, sans
-- jamais apparaître dans la réponse JSON.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.get_seller_listings(p_email text)
returns table(
  id bigint, make text, model text, year text, price text, currency text,
  category text, airport text, country text, description text,
  seller_name text, views integer, enquiries integer, icon text,
  submitted_at timestamptz, created_at timestamptz, photos jsonb,
  seller_rating integer, seller_certified boolean, hours integer, smoh integer,
  engine text, seats integer, range integer, avionics text, equipment text,
  registration text, documents text, price_type text, ifr boolean,
  rvsm boolean, adsb boolean, logs boolean, hours_prop integer,
  seller_pseudo text, featured boolean, weekly_pick boolean,
  featured_until timestamptz, expires_at timestamptz, seller_is_pro boolean,
  seller_company text
)
language sql
stable
security definer
as $$
  select
    l.id, l.make, l.model, l.year, l.price, l.currency, l.category,
    l.airport, l.country, l.description, l.seller_name, l.views,
    l.enquiries, l.icon, l.submitted_at, l.created_at, l.photos,
    l.seller_rating, l.seller_certified, l.hours, l.smoh, l.engine,
    l.seats, l.range, l.avionics, l.equipment, l.registration,
    l.documents, l.price_type, l.ifr, l.rvsm, l.adsb, l.logs,
    l.hours_prop, l.seller_pseudo, l.featured, l.weekly_pick,
    l.featured_until, l.expires_at, l.seller_is_pro, l.seller_company
  from public.listings l
  where lower(l.seller_email) = lower(trim(p_email))
    and l.status = 'live'
  order by l.submitted_at desc;
$$;

grant execute on function public.get_seller_listings(text) to anon, authenticated;

-- Vérification (à exécuter séparément) :
-- select * from get_seller_listings('contact@airborne-s.com') limit 1;
-- -> doit renvoyer les annonces SANS colonne seller_email/seller_phone
