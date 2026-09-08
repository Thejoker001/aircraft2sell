/* ==========================================================================
   Aircraft2Sell — Garde-fou pseudo obligatoire
   --------------------------------------------------------------------------
   Bloque l'accès aux pages authentifiées (dashboard, post-listing, etc.)
   tant que le compte connecté n'a pas défini de pseudo public. Évite que le
   nom réel d'un vendeur fuite sur ses annonces / sa page profil.

   Ne fait AUCUN appel réseau à chaque page vue : la vérification se fait
   une fois par session via sessionStorage ('a2s_pseudo_ok'), posé par
   set-pseudo.html après enregistrement. Les comptes déjà connus avec un
   pseudo (a2s_user_pseudo en localStorage, posé à l'inscription/connexion)
   passent sans redirection.
   ========================================================================== */
(function () {
  'use strict';

  if (window.__a2sPseudoGate) return;
  window.__a2sPseudoGate = true;

  var loggedIn = localStorage.getItem('a2s_logged_in') === 'true';
  if (!loggedIn) return; /* pages publiques / non connecté : login.html s'en charge déjà */

  var hasPseudo = !!(localStorage.getItem('a2s_user_pseudo') || '').trim();
  var confirmedThisSession = sessionStorage.getItem('a2s_pseudo_ok') === '1';
  if (hasPseudo || confirmedThisSession) return;

  /* Compte connecté sans pseudo connu localement : ne pas bloquer sur la
     seule foi du cache client (il peut être périmé) — vérifier en base une
     fois, silencieusement, avant de rediriger. */
  var SB_URL = 'https://hlivysnlzlqdjcigqgvk.supabase.co';
  var SB_KEY = 'sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';
  var email = localStorage.getItem('a2s_user_email') || '';
  if (!email) return;

  var tk = sessionStorage.getItem('a2s_auth_token') || SB_KEY;
  fetch(SB_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(email) + '&select=pseudo&limit=1', {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + tk }
  }).then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var pseudo = rows && rows[0] && rows[0].pseudo;
      if (pseudo) {
        try { localStorage.setItem('a2s_user_pseudo', pseudo); } catch (e) {}
        return; /* déjà en base, cache local juste périmé — ne pas rediriger */
      }
      var here = location.pathname.replace(/^\//, '') + location.search;
      if (/^set-pseudo\.html/.test(here)) return; /* évite une boucle */
      window.location.href = '/set-pseudo.html?redirect=' + encodeURIComponent(here);
    })
    .catch(function () { /* échec réseau : ne pas bloquer l'accès sur un doute */ });
})();
