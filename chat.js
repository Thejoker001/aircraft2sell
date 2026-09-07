/* ==========================================================================
   Aircraft2Sell — Chat client (Crisp)
   --------------------------------------------------------------------------
   Chargement DIFFÉRÉ : le SDK Crisp (~90 ko) n'est jamais chargé au rendu
   initial. Il l'est seulement à la première intention réelle de l'utilisateur
   (clic sur le bouton d'aide, scroll significatif, ou intention de sortie).
   Objectif : garder le LCP et le score PageSpeed intacts — le chat ne doit
   jamais coûter du SEO.

   Configuration : renseigner CRISP_WEBSITE_ID ci-dessous (Crisp > Paramètres >
   Paramètres du site > Identifiant du site). Tant qu'il est vide, ce fichier
   est totalement inerte : aucune requête réseau, aucun bouton affiché.
   ========================================================================== */
(function () {
  'use strict';

  var CRISP_WEBSITE_ID = ''; /* <-- coller ici l'ID Crisp */

  /* Pages privées / applicatives : pas de chat support. */
  var BLOCKED = /(admin-|dashboard|messages|moderation|moderate|diag|onboarding|checkout|success|cancel|listing-submitted|login)\.html/i;

  if (!CRISP_WEBSITE_ID || BLOCKED.test(location.pathname)) return;
  if (window.$crisp) return;

  var LANGS = { fr: 'fr', en: 'en', de: 'de', it: 'it', es: 'es' };
  var lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  if (!LANGS[lang]) lang = 'fr';

  var LABEL = {
    fr: 'Une question ? Discutons',
    en: 'Questions? Chat with us',
    de: 'Fragen? Schreiben Sie uns',
    it: 'Domande? Scrivici',
    es: '¿Preguntas? Escríbenos'
  };

  var loaded = false;

  /* ── Chargement réel du SDK ─────────────────────────────── */
  function loadCrisp(openAfter) {
    if (loaded) {
      if (openAfter && window.$crisp) window.$crisp.push(['do', 'chat:open']);
      return;
    }
    loaded = true;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
    window.CRISP_RUNTIME_CONFIG = { locale: lang };

    /* Contexte transmis à l'opérateur : d'où vient la question. */
    window.$crisp.push(['set', 'session:data', [[
      ['page', location.pathname],
      ['langue', lang]
    ]]]);

    var s = document.createElement('script');
    s.src = 'https://client.crisp.chat/l.js';
    s.async = 1;
    s.onload = function () {
      if (openAfter && window.$crisp) window.$crisp.push(['do', 'chat:open']);
      hideLauncher();
    };
    document.head.appendChild(s);
  }

  /* Notre bouton remplace celui de Crisp jusqu'au chargement. */
  function hideLauncher() {
    var b = document.getElementById('a2sChatBtn');
    if (b) b.remove();
  }

  /* ── Bouton d'appel (léger, sans dépendance réseau) ──────── */
  function injectButton() {
    if (document.getElementById('a2sChatBtn')) return;

    var css = document.createElement('style');
    css.textContent =
      '#a2sChatBtn{position:fixed;bottom:1.25rem;right:1.25rem;z-index:600;' +
      'display:inline-flex;align-items:center;gap:.5rem;min-height:48px;' +
      'padding:0 1.1rem;border:none;border-radius:999px;cursor:pointer;' +
      'background:var(--a2s-navy,#0B2545);color:#fff;font-family:var(--font-body,Manrope,sans-serif);' +
      'font-size:.88rem;font-weight:700;box-shadow:0 8px 24px rgba(11,37,69,.22);' +
      'transition:background .15s,transform .15s}' +
      '#a2sChatBtn:hover{background:var(--a2s-navy-light,#163A6B);transform:translateY(-1px)}' +
      '#a2sChatBtn svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:1.8;' +
      'stroke-linecap:round;stroke-linejoin:round}' +
      '@media(max-width:600px){#a2sChatBtn{bottom:1rem;right:1rem;padding:0 .9rem;' +
      'min-height:44px;font-size:.82rem}#a2sChatBtn .a2s-chat-label{display:none}}' +
      '@media print{#a2sChatBtn{display:none}}';
    document.head.appendChild(css);

    var btn = document.createElement('button');
    btn.id = 'a2sChatBtn';
    btn.type = 'button';
    btn.setAttribute('aria-label', LABEL[lang]);
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg>' +
      '<span class="a2s-chat-label">' + LABEL[lang] + '</span>';
    btn.addEventListener('click', function () { loadCrisp(true); });
    document.body.appendChild(btn);
  }

  /* ── Déclencheurs de préchargement ──────────────────────── */
  function armPreload() {
    var fired = false;
    function preload() {
      if (fired) return;
      fired = true;
      clean();
      loadCrisp(false); /* charge sans ouvrir : le clic sera instantané */
    }
    function onScroll() {
      var h = document.documentElement;
      var seen = (h.scrollTop + window.innerHeight) / (h.scrollHeight || 1);
      if (seen > 0.45) preload();
    }
    function onLeave(e) { if (e.clientY <= 0) preload(); }
    function clean() {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onLeave);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseleave', onLeave);
  }

  function boot() {
    injectButton();
    armPreload();
    avoidConsentBanner();
  }

  /* Le bandeau de consentement (z-index 9999) recouvre le coin bas droit :
     tant qu'il est affiché, on remonte le bouton pour qu'il reste cliquable. */
  function avoidConsentBanner() {
    var btn = document.getElementById('a2sChatBtn');
    if (!btn) return;

    function sync() {
      var banner = document.getElementById('a2s-consent-banner');
      var box = banner && banner.firstElementChild;
      var visible = box && box.getBoundingClientRect().height > 0;
      btn.style.bottom = visible
        ? (box.getBoundingClientRect().height + 28) + 'px'
        : '';
    }

    sync();
    /* Le bandeau est injecté puis retiré par rgpd-consent.js : on suit ses changements. */
    if (window.MutationObserver) {
      new MutationObserver(sync).observe(document.body, { childList: true });
    }
    window.addEventListener('resize', sync);
  }

  /* Après le chargement complet : ne concurrence jamais le rendu initial. */
  if (document.readyState === 'complete') setTimeout(boot, 1200);
  else window.addEventListener('load', function () { setTimeout(boot, 1200); });
})();
