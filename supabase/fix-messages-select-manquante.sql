-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — CORRECTIF : aucune policy SELECT sur messages
--
-- CONSTAT (vérifié en prod, 2026-09-13) : la table public.messages a RLS
-- activée avec des policies INSERT/UPDATE/DELETE mais AUCUNE policy SELECT
-- pour un utilisateur normal (seul messages_admin_all couvre la lecture,
-- restreinte à contact@aircraft2sell.eu). Conséquence : l'envoi d'un
-- message fonctionne (INSERT 201) et l'email de notification part
-- (Brevo 200, livré), mais AUCUN utilisateur ne peut relire ses propres
-- conversations dans messages.html (ni les messages envoyés, ni les
-- messages reçus) — la requête SELECT de loadConversations() renvoie
-- toujours 0 ligne, RLS bloquant silencieusement (comportement sûr par
-- défaut de Postgres RLS : aucune policy = accès refusé).
--
-- Origine probable : l'ancienne policy "messages_read" a été supprimée
-- par securite-base.sql (`drop policy if exists "messages_read"`) lors
-- du durcissement RLS du 2026-09-08, sans qu'une policy SELECT de
-- remplacement soit créée. rls-securite.sql contient bien un brouillon
-- "messages_read_own" mais il était resté COMMENTÉ, jamais appliqué.
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "messages_read_own" on public.messages;

create policy "messages_read_own"
  on public.messages for select
  to authenticated
  using (
    lower(receiver_email) = lower(auth.jwt() ->> 'email')
    or lower(sender_email) = lower(auth.jwt() ->> 'email')
  );
