/* ============================================================
   track-beacon.js — Aircraft2Sell
   Beacon de tracking SYNCHRONE minimal, réservé aux pages à
   auth-gate (post-listing.html, dashboard.html, onboarding.html)
   où le check d'authentification redirige AVANT que analytics.js
   (defer, fin de body) ait la moindre chance de s'exécuter — un
   visiteur non connecté qui cliquait vers ces pages était jusqu'ici
   invisible dans les stats (voir skill aircraft2sell-site,
   references/audit-tunnel-conversion-2026-11-06.md, section "Angle
   mort structurel").

   Chargé SANS defer, en tout début de <head>, pour être disponible
   avant tout redirect plus bas dans le document. Volontairement
   minimal : pas de géolocalisation (coûterait un aller-retour réseau
   avant le redirect, inutile ici) — seulement page/referrer/device/
   session, cohérent avec les colonnes déjà nullable de la table
   analytics (country/city/region/browser confirmés nullable).

   USAGE : window.a2sBeacon() appelé UNE SEULE FOIS, juste avant le
   window.location.href d'un redirect d'auth-gate précis — jamais au
   chargement inconditionnel de la page (sinon double-compte avec le
   hit normal d'analytics.js dans le cas où la page NE redirige pas).
   Dédoublonné par page+session via sessionStorage, au cas où le point
   d'appel serait traversé plusieurs fois (ex. double redirect gigogne
   dans onboarding.html).
   ============================================================ */
(function() {
  'use strict';

  var SB_URL = 'https://hlivysnlzlqdjcigqgvk.supabase.co';
  var SB_KEY = 'sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';

  /* Même logique que analytics.js::isLikelyBot (navigator.webdriver
     + liste UA bots connus) — évite que les vérifications CDP de
     l'agent de gestion du site polluent ces stats, comme pour le
     tracker principal. */
  function isLikelyBot() {
    try {
      if (navigator.webdriver) return true;
      var ua = (navigator.userAgent || '').toLowerCase();
      return /bot|crawl|spider|slurp|headless|googlebot|bingbot|yandex|baiduspider|duckduckbot|semrush|ahrefs|facebookexternalhit|lighthouse|pagespeed|puppeteer|playwright/.test(ua);
    } catch (e) { return false; }
  }

  function getSessionId() {
    try {
      var key = 'a2s_sid';
      var sid = sessionStorage.getItem(key);
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem(key, sid);
      }
      return sid;
    } catch (e) { return null; }
  }

  function getDevice() {
    var ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) return /iPad/i.test(ua) ? 'tablet' : 'mobile';
    return 'desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Edg/i.test(ua)) return 'Edge';
    if (/Chrome/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua)) return 'Safari';
    if (/OPR|Opera/i.test(ua)) return 'Opera';
    return 'Other';
  }

  function getReferrer() {
    try {
      var ref = document.referrer;
      if (!ref) return 'direct';
      var url = new URL(ref);
      if (url.hostname.includes('aircraft2sell')) return 'internal';
      return url.hostname;
    } catch (e) { return 'direct'; }
  }

  window.a2sBeacon = function() {
    try {
      if (isLikelyBot()) return;
      var page = location.pathname.split('/').pop() || 'index.html';
      var dedupKey = 'a2s_beacon_sent_' + page;
      if (sessionStorage.getItem(dedupKey)) return;
      sessionStorage.setItem(dedupKey, '1');

      fetch(SB_URL + '/rest/v1/analytics', {
        method: 'POST',
        headers: {
          'apikey':        SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({
          page:       page,
          referrer:   getReferrer(),
          device:     getDevice(),
          browser:    getBrowser(),
          session_id: getSessionId(),
          listing_id: null,
          country:    null,
          city:       null,
          region:     null,
        }),
        keepalive: true,
      }).catch(function() {});
    } catch (e) { /* ne jamais bloquer le redirect pour un échec de tracking */ }
  };
})();
