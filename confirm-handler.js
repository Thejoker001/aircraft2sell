/* ==========================================================================
   Aircraft2Sell — Handler de confirmation d'email (liens Supabase Auth)
   --------------------------------------------------------------------------
   Quand un utilisateur clique le lien de confirmation envoyé par email,
   Supabase le redirige vers le site avec un hash contenant les tokens :
       https://aircraft2sell.eu/#access_token=xxx&refresh_token=yyy&type=signup

   Sans ce script, RIEN ne lisait ce hash : l'email était confirmé en base
   mais l'utilisateur n'obtenait aucune session — il devait se reconnecter
   manuellement (ou restait bloqué s'il ne comprenait pas). Résultat :
   « les utilisateurs ne peuvent pas publier d'annonce ».

   Ce script doit être chargé SANS defer, tôt dans le <head>, pour créer la
   session AVANT que les scripts de page (pseudo-gate, garde login, etc.)
   ne redirigent et ne fassent perdre le hash.
   ========================================================================== */
(function () {
  'use strict';
  try {
    var h = location.hash || '';
    if (!h || h.indexOf('access_token') === -1) return;

    var params = new URLSearchParams(h.replace(/^#/, ''));
    var at = params.get('access_token');
    if (!at) return;

    var rt = params.get('refresh_token');
    var type = params.get('type') || '';

    try { sessionStorage.setItem('a2s_auth_token', at); } catch (e) {}
    if (rt) { try { localStorage.setItem('a2s_refresh_token', rt); } catch (e) {} }
    try { localStorage.setItem('a2s_logged_in', 'true'); } catch (e) {}

    /* Email + nom depuis le JWT (pas de second appel réseau). */
    try {
      var p = JSON.parse(atob(at.split('.')[1]));
      if (p && p.email) { try { localStorage.setItem('a2s_user_email', p.email); } catch (e) {} }
      if (p && p.user_metadata && p.user_metadata.full_name) {
        try { localStorage.setItem('a2s_user_name', p.user_metadata.full_name); } catch (e) {}
      }
    } catch (e) {}

    /* Nettoyer le hash de l'URL (le token ne doit pas rester visible). */
    var red = params.get('redirect_to') || '';
    try { history.replaceState(null, '', location.pathname + location.search); }
    catch (e2) { try { location.hash = ''; } catch (e3) {} }

    /* Destination : redirect_to (si même origine) → reset-password si
       récupération → sinon dashboard. */
    var dest = 'dashboard.html';
    if (type === 'recovery') {
      dest = 'reset-password.html';
    } else if (red) {
      try {
        var u = new URL(decodeURIComponent(red), location.origin);
        if (u.origin === location.origin) dest = u.pathname.replace(/^\//, '') + u.search;
      } catch (e4) {}
    }

    setTimeout(function () { window.location.href = dest; }, 120);
  } catch (e) { /* ne jamais bloquer la page sur une erreur de parsing */ }
})();
