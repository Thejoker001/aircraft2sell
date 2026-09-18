-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — CORRECTIF RGPD étape 3b (définitif) : seller.html
-- par pseudo plutôt que par email en clair dans l'URL
--
-- seller.html?email=<email> expose l'email du vendeur en clair dans
-- une URL PUBLIQUE et INDEXABLE (pas de noindex). seller_pseudo est
-- UNIQUE en base (contrainte users_pseudo_key) et déjà conçu pour
-- être public (règle produit : pseudo public obligatoire) — c'est
-- l'identifiant naturel à utiliser dans l'URL à la place de l'email.
--
-- Ces 2 fonctions reproduisent get_seller_public()/get_seller_listings()
-- mais acceptent un pseudo en entrée. Les fonctions existantes par
-- email sont CONSERVÉES (compatibilité avec les liens déjà partagés/
-- indexés ?email=..., ne cassent rien) ; seller.html es mis à jour
-- pour construire ses nouveaux liens avec ?pseudo= à la place.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.get_seller_public_by_pseudo(p_pseudo text)
returns table(name text, pseudo text, certified boolean, is_pro boolean,
              seller_type text, company text, rating numeric, plan text,
              registered_at timestamptz)
language sql
stable
security definer
as $$
  select u.name, u.pseudo, u.certified, u.is_pro, u.seller_type,
         u.company, u.rating, u.plan, u.registered_at
    from public.users u
   where lower(u.pseudo) = lower(trim(p_pseudo))
     and u.status = 'active'
   limit 1;
$$;

grant execute on function public.get_seller_public_by_pseudo(text) to anon, authenticated;

create or replace function public.get_seller_listings_by_pseudo(p_pseudo text)
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
  where lower(l.seller_pseudo) = lower(trim(p_pseudo))
    and l.status = 'live'
  order by l.submitted_at desc;
$$;

grant execute on function public.get_seller_listings_by_pseudo(text) to anon, authenticated;

-- Vérification (à exécuter séparément) :
-- select * from get_seller_public_by_pseudo('AirborneSolutions');
-- select * from get_seller_listings_by_pseudo('AirborneSolutions');
