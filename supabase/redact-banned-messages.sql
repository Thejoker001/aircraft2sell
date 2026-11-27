-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — Rédaction des messages d'un membre banni
--
-- OBJECTIF : quand un membre est banni, tous les messages qu'il a ENVOYÉS
-- à d'autres membres doivent disparaître de leur contenu d'origine et être
-- remplacés, dans la boîte mail du destinataire, par une explication du
-- bannissement (non-respect des règles de la plate-forme). Le contenu
-- original est conservé dans original_content (pas une vraie suppression)
-- pour permettre un débannissement explicite par l'admin (unredact).
--
-- APPLICATION : scripts/appliquer-redact-messages.py, 27/11/26.
-- ═══════════════════════════════════════════════════════════════

alter table public.messages add column if not exists original_content text;
alter table public.messages add column if not exists redacted_at timestamptz;

-- Appelée par l'admin juste après ban_identity_permanently (même pattern,
-- SECURITY DEFINER pour passer la RLS messages comme ban_identity_permanently
-- passe celle de banned_emails/banned_ips). Idempotente : ne retouche pas un
-- message déjà rédigé (redacted_at is null dans le WHERE).
create or replace function public.redact_banned_user_messages(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.messages
  set original_content = content,
      content = 'Ce message a été supprimé : son expéditeur a été banni d''Aircraft2Sell pour non-respect des règles d''utilisation de la plate-forme.',
      redacted_at = now()
  where lower(sender_email) = lower(trim(p_email))
    and redacted_at is null;
end;
$function$;

-- Fonction symétrique pour un débannissement explicite par l'admin : restaure
-- le contenu d'origine (appelée juste après unban_identity).
create or replace function public.unredact_banned_user_messages(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.messages
  set content = coalesce(original_content, content),
      original_content = null,
      redacted_at = null
  where lower(sender_email) = lower(trim(p_email))
    and redacted_at is not null;
end;
$function$;

-- Vérification (à exécuter séparément) :
-- select sender_email, content, redacted_at from public.messages where redacted_at is not null limit 5;
