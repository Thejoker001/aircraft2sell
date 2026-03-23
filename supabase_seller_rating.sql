-- Ajouter rating et certification vendeur à la table listings
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS seller_rating integer DEFAULT NULL CHECK (seller_rating >= 1 AND seller_rating <= 5),
  ADD COLUMN IF NOT EXISTS seller_certified boolean DEFAULT false;

-- Même chose sur la table users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS rating integer DEFAULT NULL CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS certified boolean DEFAULT false;
