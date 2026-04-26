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


  /* ── Table ISO 3166-1 → Nom pays ── */
  function isoToName(code) {
    var map = {
      FR:'France',BE:'Belgique',CH:'Suisse',DE:'Allemagne',ES:'Espagne',
      IT:'Italie',GB:'Royaume-Uni',NL:'Pays-Bas',PT:'Portugal',AT:'Autriche',
      LU:'Luxembourg',DK:'Danemark',SE:'Suède',NO:'Norvège',FI:'Finlande',
      PL:'Pologne',CZ:'République tchèque',HU:'Hongrie',RO:'Roumanie',
      GR:'Grèce',HR:'Croatie',SK:'Slovaquie',BG:'Bulgarie',IE:'Irlande',
      US:'États-Unis',CA:'Canada',AU:'Australie',JP:'Japon',CN:'Chine',
      AE:'Émirats arabes unis',MA:'Maroc',TN:'Tunisie',DZ:'Algérie',
      SN:'Sénégal',CI:'Côte d\'Ivoire',
    };
    return map[code] || code;
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
      country:    null,
    };

    // Envoyer le hit immédiatement (sans pays)
    function sendHit(country) {
      payload.country = country || null;
      fetch(SB_URL + '/rest/v1/analytics', {
        method: 'POST',
        headers: {
          'apikey':        SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function() {});
    }

    // Récupérer le pays via get.geojs.io (sans clé API, RGPD-friendly)
    var countryCache = sessionStorage.getItem('a2s_country');
    if (countryCache) {
      sendHit(countryCache);
    } else {
      fetch('https://get.geojs.io/v1/ip/geo.json')
        .then(function(r) { return r.json(); })
        .then(function(d) {
          /* geojs /geo retourne: {country:"FR", country_code:"FR", name:"France",...} */
          var country = d.country_3166_1_alpha_2
            ? isoToName(d.country_3166_1_alpha_2)
            : (d.country || d.name || null);
          if (country) sessionStorage.setItem('a2s_country', country);
          sendHit(country);
        })
        .catch(function() {
          sendHit(null);
        });
    }

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
