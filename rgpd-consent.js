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
    banner.innerHTML = [
      '<div style="position:fixed;bottom:0;left:0;right:0;z-index:9999;',
        'background:rgba(12,20,40,.98);border-top:1px solid rgba(232,160,32,.25);',
        'backdrop-filter:blur(20px);padding:1rem 1.5rem;',
        'display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;',
        'font-family:DM Sans,sans-serif;font-size:.82rem;color:#c8d8e8;">',
        '<div style="flex:1;min-width:260px;line-height:1.6">',
          '🍪 Nous utilisons des cookies analytiques anonymes pour améliorer Aircraft2Sell. ',
          '<a href="/legal.html#privacy" style="color:#e8a020;text-decoration:none">En savoir plus</a>',
        '</div>',
        '<div style="display:flex;gap:.5rem;flex-shrink:0">',
          '<button id="a2s-decline" style="',
            'background:transparent;border:1px solid rgba(180,200,230,.2);color:#7a93aa;',
            'padding:.45rem 1rem;font-family:inherit;font-size:.78rem;cursor:pointer;transition:all .2s;">',
            'Refuser',
          '</button>',
          '<button id="a2s-accept" style="',
            'background:#e8a020;color:#030610;border:none;',
            'padding:.45rem 1.2rem;font-family:inherit;font-size:.78rem;font-weight:700;cursor:pointer;transition:background .2s;">',
            'Accepter',
          '</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);
    document.getElementById('a2s-accept').onclick = accept;
    document.getElementById('a2s-decline').onclick = decline;
  }

  // Check existing consent
  var consent = getConsent();
  if (consent && consent.v === CONSENT_VERSION) {
    if (consent.analytics) loadAnalytics();
    return; // Banner already shown previously
  }

  // Show banner on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    setTimeout(showBanner, 800); // Small delay to not compete with LCP
  }

})();
