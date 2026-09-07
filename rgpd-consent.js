/* ============================================================
   rgpd-consent.js — Aircraft2Sell
   Bannière de consentement cookies RGPD légère
   Charge analytics.js uniquement après consentement
   ============================================================ */
(function() {
  'use strict';

  var CONSENT_KEY = 'a2s_consent';
  var CONSENT_VERSION = '1'; // Incrémenter si la politique change

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch(e) { return null; }
  }

  function setConsent(analytics) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      v: CONSENT_VERSION,
      analytics: analytics,
      date: new Date().toISOString()
    }));
  }

  function loadAnalytics() {
    if (document.querySelector('script[src="analytics.js"]')) return;
    var s = document.createElement('script');
    s.src = 'analytics.js';
    s.defer = true;
    document.head.appendChild(s);
  }

  function removeBanner() {
    var b = document.getElementById('a2s-consent-banner');
    if (b) b.remove();
  }

  function accept() {
    setConsent(true);
    loadAnalytics();
    removeBanner();
  }

  function decline() {
    setConsent(false);
    removeBanner();
  }

  function showBanner() {
    if (document.getElementById('a2s-consent-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'a2s-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentement aux cookies');
    banner.innerHTML = [
      '<div style="position:fixed;bottom:0;left:0;right:0;z-index:9999;',
        'background:var(--a2s-surface,#fff);border-top:1px solid var(--a2s-border,#E4E8EF);',
        'box-shadow:0 -4px 16px rgba(11,37,69,.08);padding:1rem 1.5rem;',
        'display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;',
        'font-family:var(--font-body,Manrope,sans-serif);font-size:.86rem;color:var(--a2s-text,#14213D);">',
        '<div style="flex:1;min-width:260px;line-height:1.6">',
          'Nous utilisons des cookies analytiques anonymes pour améliorer Aircraft2Sell. ',
          '<a href="/legal.html#privacy" style="color:var(--a2s-blue,#1E5FCC);font-weight:600">En savoir plus</a>',
        '</div>',
        '<div style="display:flex;gap:.5rem;flex-shrink:0">',
          '<button id="a2s-decline" type="button" class="btn-secondary btn-sm">Refuser</button>',
          '<button id="a2s-accept" type="button" class="btn-primary btn-sm">Accepter</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);
    document.getElementById('a2s-accept').onclick = accept;
    document.getElementById('a2s-decline').onclick = decline;
  }

  // Analytics anonyme = légal sans consentement (pas de cookie, pas de PII)
  // Charger directement — le consentement ne concerne que les cookies tiers
  // Ref: CNIL - le tracking anonyme ne nécessite pas de consentement
  loadAnalytics();
  
  // Check existing consent (pour compatibilité)
  var consent = getConsent();
  if (consent && consent.v === CONSENT_VERSION) {
    if (consent.analytics) {} // déjà chargé
    return; // Banner already shown previously
  }

  // Show banner on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    setTimeout(showBanner, 800); // Small delay to not compete with LCP
  }

})();
