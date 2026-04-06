/* ============================================================
   analytics.js — Aircraft2Sell
   Tracking pages vues dans Supabase (table analytics)
   Respecte le RGPD : anonymisé, pas de cookie, pas de fingerprint
   
   USAGE : ajouter <script src="analytics.js"></script> avant </body>
   sur toutes les pages (après consentement RGPD)
   ============================================================ */

(function() {
  'use strict';

  var SB_URL = 'https://hlivysnlzlqdjcigqgvk.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsaXZ5c25semxxZGpjaWdxZ3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjIwNzAsImV4cCI6MjA4OTc5ODA3MH0.5tKQLlx9LsSujgILJKpmo__ByHorH6KuLyznE-mBVwU';

  /* ── Session ID anonyme (pas de cookie, renouvelé chaque session) ── */
  function getSessionId() {
    var key = 'a2s_sid';
    var sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(key, sid);
    }
    return sid;
  }

  /* ── Détection device ── */
  function getDevice() {
    var ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
      return /iPad/i.test(ua) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  /* ── Détection browser ── */
  function getBrowser() {
    var ua = navigator.userAgent;
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Edg/i.test(ua)) return 'Edge';
    if (/Chrome/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua)) return 'Safari';
    if (/OPR|Opera/i.test(ua)) return 'Opera';
    return 'Other';
  }

  /* ── Page courante ── */
  function getPage() {
    var path = location.pathname.split('/').pop() || 'homepage.html';
    var params = new URLSearchParams(location.search);
    if (params.get('id')) path += '?id=' + params.get('id');
    if (params.get('cat')) path += '?cat=' + params.get('cat');
    return path;
  }

  /* ── Referrer nettoyé ── */
  function getReferrer() {
    try {
      var ref = document.referrer;
      if (!ref) return 'direct';
      var url = new URL(ref);
      // Si même domaine → interne
      if (url.hostname.includes('aircraft2sell')) return 'internal';
      return url.hostname;
    } catch(e) {
      return 'direct';
    }
  }

  /* ── Listing ID si page annonce ── */
  function getListingId() {
    var id = new URLSearchParams(location.search).get('id');
    return id ? parseInt(id, 10) : null;
  }

  /* ── Envoyer le hit ── */
  function track() {
    // Ne pas tracker les pages admin/diag
    var page = getPage();
    if (/admin|diag|moderate|migration/.test(page)) return;

    var payload = {
      page:       page,
      referrer:   getReferrer(),
      device:     getDevice(),
      browser:    getBrowser(),
      session_id: getSessionId(),
      listing_id: getListingId(),
    };

    // Envoyer en mode "fire and forget" — erreur silencieuse
    fetch(SB_URL + '/rest/v1/analytics', {
      method: 'POST',
      headers: {
        'apikey':        SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(payload),
      keepalive: true, // S'envoie même si l'utilisateur navigue
    }).catch(function() {}); // Erreur silencieuse — ne jamais bloquer l'UX

    // Si c'est une page annonce, tracer aussi dans listing_views
    var listingId = getListingId();
    if (listingId && page.includes('listing.html')) {
      fetch(SB_URL + '/rest/v1/listing_views', {
        method: 'POST',
        headers: {
          'apikey':        SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({
          listing_id: listingId,
          session_id: getSessionId(),
        }),
        keepalive: true,
      }).catch(function() {});
    }
  }

  /* ── Lancer après chargement ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', track);
  } else {
    // Délai court pour ne pas retarder le rendu initial
    setTimeout(track, 500);
  }

  /* ── API publique (optionnel) ── */
  window.a2sTrack = { page: track };

})();
