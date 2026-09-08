/* ============================================================
   A2SFavs — Favoris partagés (localStorage)
   Utilisé par listing.html, search.html, dashboard.html
   ============================================================ */
window.A2SFavs = (function(){
  const KEY = 'a2s_favourites';
  function load(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e){ return []; } }
  function save(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); document.dispatchEvent(new CustomEvent('a2s:favs-updated')); }
  function has(id){ return load().some(f => String(f.id) === String(id)); }
  function toggle(listing){
    const favs = load();
    const idx  = favs.findIndex(f => String(f.id) === String(listing.id));
    if(idx > -1){ favs.splice(idx, 1); save(favs); return false; }
    favs.unshift({ ...listing, savedAt: new Date().toISOString() }); save(favs); return true;
  }
  function remove(id){ save(load().filter(f => String(f.id) !== String(id))); }
  function getAll(){ return load(); }
  function clear(){ save([]); }
  function count(){ return load().length; }
  return { has, toggle, remove, getAll, clear, count };
})();

/* ============================================================
   nav.js — Aircraft2Sell · Navigation v2
   Barre claire, deux actions principales (Chercher / Vendre),
   méga-menu catégories, langue + devise en utilitaires.
   Le style vit dans styles.css (section 15) ; ce fichier ne
   contient que la structure et le comportement.
   Dépend de icons.js (A2SIcon) — chargé automatiquement si absent.
   ============================================================ */
(function(){

  var KEY_LOGGED = 'a2s_logged_in';
  var KEY_NAME   = 'a2s_user_name';
  var KEY_EMAIL  = 'a2s_user_email';
  var KEY_PLAN   = 'a2s_user_plan';

  function isLoggedIn(){ return localStorage.getItem(KEY_LOGGED) === 'true'; }
  function getUserName(){ return localStorage.getItem(KEY_NAME) || ''; }
  function getUserEmail(){ return localStorage.getItem(KEY_EMAIL) || ''; }
  function getInitials(name, email){
    if(name && name.trim()) return name.trim().split(/\s+/).map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    if(email) return email[0].toUpperCase();
    return 'U';
  }

  /* ── Langue / i18n des liens ─────────────────────────────── */
  function currentLang(){ var m = location.pathname.match(/^\/(en|de|it|es)\//); return m ? m[1] : 'fr'; }
  var LANG_NAMES = { fr:'Français', en:'English', de:'Deutsch', it:'Italiano', es:'Español' };
  var TRANSLATED_PAGES = ['index.html','search.html','listing.html','post-listing.html',
    'avions-legers.html','jets-affaires.html','helicopteres.html','turboprops.html',
    'ulm.html','avions-de-ligne.html'];
  function isTranslatedPage(page){ return TRANSLATED_PAGES.indexOf(page.split(/[?#]/)[0]) > -1; }
  /* Toujours des chemins absolus : évite les 404 (/en/nav.js) et rend la nav
     indépendante de la profondeur du dossier. */
  function href(page){
    var lang = currentLang();
    if(lang === 'fr') return '/' + page;
    return isTranslatedPage(page) ? '/' + lang + '/' + page : '/' + page;
  }
  function currentPageBase(){
    var m = location.pathname.match(/^\/(?:en|de|it|es)\/(.*)$/);
    var rel = m ? m[1] : location.pathname.replace(/^\//, '');
    return rel || 'index.html';
  }
  function langSwitchHref(targetLang){
    var base = currentPageBase().split(/[?#]/)[0] || 'index.html';
    var target = isTranslatedPage(base) ? base : 'index.html';
    return targetLang === 'fr' ? '/' + target : '/' + targetLang + '/' + target;
  }

  var I18N = {
    fr: { buy:'Acheter', sell:'Vendre', pro:'Professionnels', guide:'Guide', blog:'Blog', faq:'FAQ', contact:'Contact',
      currencies:'Devises', converter:'Convertisseur de devises', live:'Taux en direct', loading:'Chargement…', invert:'Inverser', ecbRate:'Taux indicatif BCE',
      allListings:'Voir toutes les annonces', catLight:'Avions légers', catJet:'Jets d\'affaires', catTurbo:'Turbopropulseurs', catHeli:'Hélicoptères', catUlm:'ULM', catAirliner:'Avions de ligne',
      dLight:'Monomoteurs, bimoteurs, voyage', dJet:'Jets privés & d\'affaires', dTurbo:'Turbines à hélice', dHeli:'Loisir, travail aérien', dUlm:'Multiaxes, pendulaires, autogires', dAirliner:'Transport commercial',
      login:'Connexion', myFavs:'Favoris', myAccount:'Mon compte', myDashboard:'Mon tableau de bord', myListings:'Mes annonces', myMessages:'Messages', logout:'Se déconnecter',
      postFull:'Déposer une annonce', postShort:'Vendre', chooseLang:'Choisir la langue', menu:'Menu',
      mmBuy:'Acheter', mmSellPro:'Vendre', mmSellMy:'Vendre mon aéronef', mmResources:'Aide & ressources', mmGuide:'Guide de l\'acheteur', mmLogin:'Se connecter', mmSignup:'Créer un compte', mmEstimate:'Estimer mon aéronef', mmAlerts:'Alertes email' },
    en: { buy:'Buy', sell:'Sell', pro:'Dealers', guide:'Guide', blog:'Blog', faq:'FAQ', contact:'Contact',
      currencies:'Currency', converter:'Currency converter', live:'Live rates', loading:'Loading…', invert:'Swap', ecbRate:'Indicative ECB rate',
      allListings:'See all listings', catLight:'Light aircraft', catJet:'Business jets', catTurbo:'Turboprops', catHeli:'Helicopters', catUlm:'Light sport / ULM', catAirliner:'Airliners',
      dLight:'Singles, twins, touring', dJet:'Private & business jets', dTurbo:'Turbine-powered props', dHeli:'Leisure, aerial work', dUlm:'Microlights, gyros', dAirliner:'Commercial transport',
      login:'Log in', myFavs:'Favourites', myAccount:'My account', myDashboard:'My dashboard', myListings:'My listings', myMessages:'Messages', logout:'Log out',
      postFull:'List your aircraft', postShort:'Sell', chooseLang:'Choose language', menu:'Menu',
      mmBuy:'Buy', mmSellPro:'Sell', mmSellMy:'Sell my aircraft', mmResources:'Help & resources', mmGuide:'Buyer\'s guide', mmLogin:'Log in', mmSignup:'Create an account', mmEstimate:'Value my aircraft', mmAlerts:'Email alerts' },
    de: { buy:'Kaufen', sell:'Verkaufen', pro:'Händler', guide:'Ratgeber', blog:'Blog', faq:'FAQ', contact:'Kontakt',
      currencies:'Währung', converter:'Währungsrechner', live:'Live-Kurse', loading:'Lädt…', invert:'Tauschen', ecbRate:'Indikativer EZB-Kurs',
      allListings:'Alle Anzeigen ansehen', catLight:'Leichtflugzeuge', catJet:'Geschäftsjets', catTurbo:'Turboprops', catHeli:'Hubschrauber', catUlm:'Ultraleicht (UL)', catAirliner:'Verkehrsflugzeuge',
      dLight:'Ein- und Zweimotorige', dJet:'Privat- & Geschäftsjets', dTurbo:'Turbinen-Propeller', dHeli:'Freizeit, Arbeitsflug', dUlm:'Dreiachser, Trikes', dAirliner:'Kommerzieller Transport',
      login:'Anmelden', myFavs:'Favoriten', myAccount:'Mein Konto', myDashboard:'Mein Dashboard', myListings:'Meine Anzeigen', myMessages:'Nachrichten', logout:'Abmelden',
      postFull:'Flugzeug inserieren', postShort:'Verkaufen', chooseLang:'Sprache wählen', menu:'Menü',
      mmBuy:'Kaufen', mmSellPro:'Verkaufen', mmSellMy:'Mein Flugzeug verkaufen', mmResources:'Hilfe & Ressourcen', mmGuide:'Käuferratgeber', mmLogin:'Anmelden', mmSignup:'Konto erstellen', mmEstimate:'Flugzeug bewerten', mmAlerts:'E-Mail-Alarme' },
    it: { buy:'Acquista', sell:'Vendi', pro:'Rivenditori', guide:'Guida', blog:'Blog', faq:'FAQ', contact:'Contatto',
      currencies:'Valuta', converter:'Convertitore di valuta', live:'Tassi in diretta', loading:'Caricamento…', invert:'Inverti', ecbRate:'Tasso indicativo BCE',
      allListings:'Vedi tutti gli annunci', catLight:'Aerei leggeri', catJet:'Jet privati', catTurbo:'Turboelica', catHeli:'Elicotteri', catUlm:'Ultraleggeri', catAirliner:'Aerei di linea',
      dLight:'Mono e bimotori', dJet:'Jet privati e business', dTurbo:'Eliche a turbina', dHeli:'Tempo libero, lavoro aereo', dUlm:'Tre assi, pendolari', dAirliner:'Trasporto commerciale',
      login:'Accedi', myFavs:'Preferiti', myAccount:'Il mio account', myDashboard:'La mia dashboard', myListings:'I miei annunci', myMessages:'Messaggi', logout:'Esci',
      postFull:'Pubblica un annuncio', postShort:'Vendi', chooseLang:'Scegli lingua', menu:'Menu',
      mmBuy:'Acquista', mmSellPro:'Vendi', mmSellMy:'Vendi il mio aereo', mmResources:'Aiuto e risorse', mmGuide:'Guida per l\'acquirente', mmLogin:'Accedi', mmSignup:'Crea un account', mmEstimate:'Valuta il mio aereo', mmAlerts:'Avvisi email' },
    es: { buy:'Comprar', sell:'Vender', pro:'Distribuidores', guide:'Guía', blog:'Blog', faq:'FAQ', contact:'Contacto',
      currencies:'Divisa', converter:'Conversor de divisas', live:'Tipos en directo', loading:'Cargando…', invert:'Invertir', ecbRate:'Tipo indicativo BCE',
      allListings:'Ver todos los anuncios', catLight:'Aviones ligeros', catJet:'Jets privados', catTurbo:'Turbohélices', catHeli:'Helicópteros', catUlm:'Ultraligeros', catAirliner:'Aviones comerciales',
      dLight:'Mono y bimotores', dJet:'Jets privados y de negocios', dTurbo:'Hélices con turbina', dHeli:'Ocio, trabajo aéreo', dUlm:'Tres ejes, pendulares', dAirliner:'Transporte comercial',
      login:'Acceder', myFavs:'Favoritos', myAccount:'Mi cuenta', myDashboard:'Mi panel', myListings:'Mis anuncios', myMessages:'Mensajes', logout:'Cerrar sesión',
      postFull:'Publicar un anuncio', postShort:'Vender', chooseLang:'Elegir idioma', menu:'Menú',
      mmBuy:'Comprar', mmSellPro:'Vender', mmSellMy:'Vender mi avión', mmResources:'Ayuda y recursos', mmGuide:'Guía del comprador', mmLogin:'Acceder', mmSignup:'Crear una cuenta', mmEstimate:'Valorar mi avión', mmAlerts:'Alertas por email' }
  };
  function t(key){ var lang = currentLang(); return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key; }

  /* ── Icônes : garantit A2SIcon même si icons.js n'est pas inclus ── */
  function ic(name, cls){
    if(window.A2SIcon) return window.A2SIcon(name, cls);
    return '<svg class="' + (cls||'ic') + '" viewBox="0 0 24 24" aria-hidden="true"></svg>';
  }
  function ensureIcons(cb){
    if(window.A2SIcon){ cb(); return; }
    var s = document.createElement('script');
    s.src = '/icons.js?v=20260906c';
    s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }

  /* ── Fallback CSS minimal (si styles.css absent/en cache) ── */
  function injectCSS(){
    if(document.getElementById('a2s-nav-css')) return;
    var s = document.createElement('style');
    s.id = 'a2s-nav-css';
    s.textContent = 'nav#mainNav{position:fixed;top:0;left:0;right:0;z-index:500;height:64px;background:#fff;border-bottom:1px solid #E4E8EF;display:flex;align-items:center}.mobile-menu{display:none}.mobile-menu.open{display:flex}.nav-mega-panel,.nav-popover{opacity:0;pointer-events:none;position:absolute}.nav-mega.open .nav-mega-panel,.nav-util.open .nav-popover{opacity:1;pointer-events:auto}';
    document.head.appendChild(s);
  }

  /* ── Structure de la barre ──────────────────────────────── */
  var CATS = [
    { key:'light',    icon:'plane-light', page:'avions-legers.html',   title:'catLight',    desc:'dLight' },
    { key:'jet',      icon:'jet',         page:'jets-affaires.html',   title:'catJet',      desc:'dJet' },
    { key:'turbo',    icon:'turboprop',   page:'turboprops.html',      title:'catTurbo',    desc:'dTurbo' },
    { key:'heli',     icon:'helicopter',  page:'helicopteres.html',    title:'catHeli',     desc:'dHeli' },
    { key:'ulm',      icon:'ulm',         page:'ulm.html',             title:'catUlm',      desc:'dUlm' },
    { key:'airliner', icon:'airliner',    page:'avions-de-ligne.html', title:'catAirliner', desc:'dAirliner' }
  ];
  var CURRENCIES = ['EUR','USD','GBP','CHF','CAD','AUD','JPY','SEK','NOK','DKK','PLN','AED'];
  var SYMS = {EUR:'€',USD:'$',GBP:'£',CHF:'Fr',CAD:'CA$',AUD:'AU$',JPY:'¥',SEK:'kr',NOK:'kr',DKK:'kr',PLN:'zł',AED:'AED'};

  function currentPageKey(){
    var b = currentPageBase().split(/[?#]/)[0];
    if(/^(search|avions-|jets-|helicopteres|turboprops|ulm|listing)/.test(b)) return 'buy';
    if(/^(post-listing|vendeur|estimation|vendre-)/.test(b)) return 'sell';
    if(/^pro-dealers/.test(b)) return 'pro';
    if(/^(guide-acheteur|inspection|comment-financer|assurance)/.test(b)) return 'guide';
    if(/^blog/.test(b)) return 'blog';
    if(/^faq/.test(b)) return 'faq';
    if(/^contact/.test(b)) return 'contact';
    return '';
  }

  function buildNavHTML(){
    var lang = currentLang();
    var active = currentPageKey();
    function link(page, key, label){
      return '<li><a href="' + href(page) + '" data-nav="' + key + '"' + (active === key ? ' class="active" aria-current="page"' : '') + '>' + label + '</a></li>';
    }
    var megaItems = CATS.map(function(c){
      return '<a class="nav-mega-item" href="' + href(c.page) + '">'
        + '<span class="icon-box">' + ic(c.icon) + '</span>'
        + '<span><span class="mi-title">' + t(c.title) + '</span><span class="mi-desc">' + t(c.desc) + '</span></span>'
        + '</a>';
    }).join('');
    var currencyOptions = CURRENCIES.map(function(c){ return '<option value="' + c + '">' + c + '</option>'; }).join('');
    var langLinks = Object.keys(LANG_NAMES).map(function(l){
      return '<a href="' + langSwitchHref(l) + '" hreflang="' + l + '" class="' + (lang === l ? 'active' : '') + '"><span>' + LANG_NAMES[l] + '</span>' + (lang === l ? ic('check') : '<span class="lang-code">' + l.toUpperCase() + '</span>') + '</a>';
    }).join('');

    return [
      '<nav id="mainNav" aria-label="Navigation principale">',
        '<div class="nav-inner">',
          '<a href="' + href('index.html') + '" class="logo" aria-label="Aircraft2Sell — accueil">',
            '<img src="' + href('logo.png') + '?v=20260908" alt="Aircraft2Sell" class="logo-img" width="180" height="29" loading="eager">',
          '</a>',
          '<ul class="nav-links">',
            '<li class="nav-mega" id="navMega">',
              '<a href="' + href('search.html') + '" class="nav-mega-trigger' + (active === 'buy' ? ' active' : '') + '" id="megaTrigger" aria-haspopup="true" aria-expanded="false">' + t('buy') + ic('chevron-down', 'ic mega-arrow') + '</a>',
              '<div class="nav-mega-panel" role="menu">',
                megaItems,
                '<a class="nav-mega-all" href="' + href('search.html') + '">' + t('allListings') + ic('arrow-right') + '</a>',
              '</div>',
            '</li>',
            link('vendeur.html', 'sell', t('sell')),
            link('pro-dealers.html', 'pro', t('pro')),
            link('guide-acheteur.html', 'guide', t('guide')),
            link('blog.html', 'blog', t('blog')),
            link('faq.html', 'faq', t('faq')),
            link('contact.html', 'contact', t('contact')),
          '</ul>',
          '<div class="nav-right">',
            /* Devise */
            '<div class="nav-util" id="navCurrency">',
              '<button class="nav-util-btn" id="toggleCvBtn" type="button" aria-label="' + t('converter') + '" aria-expanded="false">' + ic('euro') + '<span class="util-label">' + t('currencies') + '</span>' + ic('chevron-down', 'ic cv-arrow') + '</button>',
              '<div class="nav-popover cv-dropdown">',
                '<div class="cv-drop-head"><span class="cv-drop-title">' + t('converter') + '</span><span class="cv-live" id="cvLiveTime">' + t('live') + '</span></div>',
                '<div class="cv-body">',
                  '<div class="cv-row">',
                    '<div class="cv-inp-wrap"><input class="cv-inp" type="number" id="cvAmount" value="100000" min="0" aria-label="Montant"><select class="cv-sel" id="cvFrom" aria-label="Devise source">' + currencyOptions + '</select></div>',
                    '<button class="cv-swap-btn" id="cvSwapBtn" type="button" title="' + t('invert') + '" aria-label="' + t('invert') + '">' + ic('swap') + '</button>',
                  '</div>',
                  '<div class="cv-result-box"><div><div class="cv-result-val" id="cvResult">…</div><div class="cv-result-sub">' + t('ecbRate') + '</div></div><select class="cv-to-sel" id="cvTo" aria-label="Devise cible">' + currencyOptions.replace('value="USD"','value="USD" selected') + '</select></div>',
                  '<div class="cv-rate-txt" id="cvRateTxt"><span>—</span></div>',
                  '<div class="cv-quick">' + ['USD','GBP','CHF','CAD','AUD','JPY','AED','EUR'].map(function(c){ return '<button class="cv-qb" type="button" data-cur="' + c + '">' + c + '</button>'; }).join('') + '</div>',
                '</div>',
              '</div>',
            '</div>',
            /* Langue */
            '<div class="nav-util" id="navLang">',
              '<button class="nav-util-btn" id="toggleLangBtn" type="button" aria-label="' + t('chooseLang') + '" aria-expanded="false">' + ic('globe') + '<span class="util-label">' + lang.toUpperCase() + '</span>' + ic('chevron-down', 'ic cv-arrow') + '</button>',
              '<div class="nav-popover nav-lang-dropdown">' + langLinks + '</div>',
            '</div>',
            /* Favoris (connecté) */
            '<a href="' + href('dashboard.html') + '#favs" class="nav-favs" id="navFavs" title="' + t('myFavs') + '" style="display:none">' + ic('heart') + '<span id="navFavCount">0</span></a>',
            /* Connexion / compte */
            '<a href="' + href('login.html') + '" class="btn-nav-login" id="btnLogin">' + ic('user') + '<span>' + t('login') + '</span></a>',
            '<div class="nav-user" id="navUser" role="button" tabindex="0" style="display:none"><div class="nav-avatar" id="navAvatar">U</div><span class="nav-user-name" id="navUserName">' + t('myAccount') + '</span></div>',
            /* CTA vendre */
            '<a href="' + href('post-listing.html') + '" class="btn-post" id="btnPost" aria-label="' + t('postFull') + '">' + ic('plus') + '<span class="bp-full">' + t('postFull') + '</span><span class="bp-short">' + t('postShort') + '</span></a>',
            '<button class="burger" id="burger" type="button" aria-label="' + t('menu') + '" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>',
          '</div>',
        '</div>',
      '</nav>',
      /* Menu mobile */
      '<div class="mobile-menu" id="mobileMenu">',
        '<div class="mm-actions">',
          '<a href="' + href('login.html') + '" class="btn-secondary" id="mmLogin">' + ic('user') + t('mmLogin') + '</a>',
          '<a href="' + href('login.html') + '?tab=register" class="btn-navy" id="mmSignup">' + t('mmSignup') + '</a>',
        '</div>',
        '<div class="mm-section-label">' + t('mmBuy') + '</div>',
        '<a href="' + href('search.html') + '">' + ic('search') + t('allListings') + ic('chevron-right', 'ic mm-chev') + '</a>',
        CATS.map(function(c){ return '<a class="mm-sub" href="' + href(c.page) + '">' + ic(c.icon) + t(c.title) + ic('chevron-right', 'ic mm-chev') + '</a>'; }).join(''),
        '<div class="mm-section-label">' + t('mmSellPro') + '</div>',
        '<a href="' + href('post-listing.html') + '">' + ic('plus') + t('mmSellMy') + ic('chevron-right', 'ic mm-chev') + '</a>',
        '<a href="' + href('estimation.html') + '">' + ic('calculator') + t('mmEstimate') + ic('chevron-right', 'ic mm-chev') + '</a>',
        '<a href="' + href('pro-dealers.html') + '">' + ic('briefcase') + t('pro') + ic('chevron-right', 'ic mm-chev') + '</a>',
        '<div class="mm-section-label">' + t('mmResources') + '</div>',
        '<a href="' + href('guide-acheteur.html') + '">' + ic('book') + t('mmGuide') + ic('chevron-right', 'ic mm-chev') + '</a>',
        '<a href="' + href('alerts.html') + '">' + ic('bell') + t('mmAlerts') + ic('chevron-right', 'ic mm-chev') + '</a>',
        '<a href="' + href('blog.html') + '">' + ic('file-text') + t('blog') + ic('chevron-right', 'ic mm-chev') + '</a>',
        '<a href="' + href('faq.html') + '">' + ic('help-circle') + t('faq') + ic('chevron-right', 'ic mm-chev') + '</a>',
        '<a href="' + href('contact.html') + '">' + ic('mail') + t('contact') + ic('chevron-right', 'ic mm-chev') + '</a>',
        '<a href="' + href('post-listing.html') + '" class="btn-primary btn-lg mm-cta" id="mmCta">' + ic('plus') + t('postFull') + '</a>',
        '<div class="mm-langs">' + Object.keys(LANG_NAMES).map(function(l){ return '<a href="' + langSwitchHref(l) + '" hreflang="' + l + '" class="mm-lang-btn ' + (lang === l ? 'active' : '') + '">' + l.toUpperCase() + '</a>'; }).join('') + '</div>',
      '</div>'
    ].join('');
  }

  function injectNav(){
    if(document.getElementById('mainNav')) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildNavHTML();
    var first = document.body.firstChild;
    while(wrapper.firstChild){ document.body.insertBefore(wrapper.firstChild, first); }
  }

  /* ── Comportements ──────────────────────────────────────── */
  function bindScroll(){
    var nav = document.getElementById('mainNav'); if(!nav) return;
    function onScroll(){ nav.classList.toggle('scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }

  function bindBurger(){
    var burger = document.getElementById('burger'), menu = document.getElementById('mobileMenu');
    if(!burger || !menu) return;
    function setOpen(open){
      burger.classList.toggle('open', open); menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function(){ setOpen(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setOpen(false); }); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && menu.classList.contains('open')) setOpen(false); });
    window.addEventListener('resize', function(){ if(window.innerWidth > 900 && menu.classList.contains('open')) setOpen(false); });
    window.toggleMenu = function(){ setOpen(!menu.classList.contains('open')); };
  }

  function bindMegaMenu(){
    var mega = document.getElementById('navMega'), trigger = document.getElementById('megaTrigger');
    if(!mega || !trigger) return;
    var closeTimer;
    function open(){ clearTimeout(closeTimer); mega.classList.add('open'); trigger.setAttribute('aria-expanded','true'); }
    function close(){ mega.classList.remove('open'); trigger.setAttribute('aria-expanded','false'); }
    mega.addEventListener('mouseenter', open);
    mega.addEventListener('mouseleave', function(){ closeTimer = setTimeout(close, 120); });
    trigger.addEventListener('click', function(e){
      /* clic sur la flèche : ouvre/ferme ; clic sur le libellé : navigue */
      if(e.target.closest('.mega-arrow')){ e.preventDefault(); mega.classList.contains('open') ? close() : open(); }
    });
    trigger.addEventListener('keydown', function(e){ if(e.key === 'ArrowDown'){ e.preventDefault(); open(); var f = mega.querySelector('.nav-mega-item'); if(f) f.focus(); } });
    document.addEventListener('click', function(e){ if(!mega.contains(e.target)) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
  }

  function bindPopover(wrapId, btnId){
    var wrap = document.getElementById(wrapId), btn = document.getElementById(btnId);
    if(!wrap || !btn) return null;
    function set(open){ wrap.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    btn.addEventListener('click', function(e){ e.stopPropagation(); var willOpen = !wrap.classList.contains('open');
      document.querySelectorAll('.nav-util.open').forEach(function(o){ if(o !== wrap){ o.classList.remove('open'); var b = o.querySelector('.nav-util-btn'); if(b) b.setAttribute('aria-expanded','false'); } });
      set(willOpen); if(willOpen) wrap.dispatchEvent(new CustomEvent('a2s:open')); });
    document.addEventListener('click', function(e){ if(!wrap.contains(e.target)) set(false); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') set(false); });
    return { open: function(){ set(true); }, close: function(){ set(false); }, toggle: function(){ set(!wrap.classList.contains('open')); } };
  }

  function initCurrency(){
    var _rates = {EUR:1}, _busy = false;
    var FALLBACK = {USD:1.082,GBP:0.856,CHF:0.937,CAD:1.559,AUD:1.746,JPY:162.5,SEK:11.28,NOK:11.62,DKK:7.461,PLN:4.256,AED:3.972};
    var elNav = document.getElementById('navCurrency'), elAmount = document.getElementById('cvAmount'), elFrom = document.getElementById('cvFrom'),
        elTo = document.getElementById('cvTo'), elResult = document.getElementById('cvResult'), elRate = document.getElementById('cvRateTxt'),
        elLive = document.getElementById('cvLiveTime'), elSwap = document.getElementById('cvSwapBtn');
    if(!elNav) return;
    var pop = bindPopover('navCurrency', 'toggleCvBtn');
    elNav.addEventListener('a2s:open', function(){ if(Object.keys(_rates).length <= 1) fetchRates(); });

    function compute(){
      if(!elAmount || !elResult) return;
      var amt = parseFloat(elAmount.value) || 0, from = elFrom ? elFrom.value : 'EUR', to = elTo ? elTo.value : 'USD';
      var rate = (from === to) ? 1 : (1/(_rates[from]||1))*(_rates[to]||1);
      var result = amt * rate;
      elResult.textContent = (SYMS[to]||to) + ' ' + (result >= 1000 ? result.toLocaleString('fr-FR',{maximumFractionDigits:0}) : result.toFixed(2));
      if(elRate) elRate.innerHTML = '<span>1 ' + from + ' = ' + rate.toFixed(4) + ' ' + to + '</span>';
      document.querySelectorAll('.cv-qb').forEach(function(b){ b.classList.toggle('on', b.dataset.cur === to); });
    }
    function fetchRates(){
      if(_busy) return; _busy = true;
      if(elLive) elLive.textContent = t('loading');
      var sources = [
        { url:'https://open.er-api.com/v6/latest/EUR', parse:function(d){ return d.rates; } },
        { url:'https://api.exchangerate-api.com/v4/latest/EUR', parse:function(d){ return d.rates; } },
        { url:'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json', parse:function(d){
            if(!d||!d.eur) return null; var r={}; CURRENCIES.forEach(function(c){ if(d.eur[c.toLowerCase()]) r[c]=d.eur[c.toLowerCase()]; }); return Object.keys(r).length ? r : null; } }
      ];
      var tried = 0;
      function tryNext(){
        if(tried >= sources.length){ _busy = false; _rates = Object.assign({EUR:1}, FALLBACK); if(elLive) elLive.textContent = t('ecbRate'); compute(); return; }
        var src = sources[tried++];
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = controller ? setTimeout(function(){ controller.abort(); }, 5000) : null;
        fetch(src.url, controller ? {signal:controller.signal} : {})
          .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
          .then(function(d){ clearTimeout(timer); var rates = src.parse(d);
            if(rates && (rates.USD || rates.GBP)){ _busy = false; _rates = Object.assign({EUR:1}, rates);
              if(elLive) elLive.textContent = t('live') + ' · ' + new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); compute(); }
            else tryNext(); })
          .catch(function(){ clearTimeout(timer); tryNext(); });
      }
      tryNext();
    }
    if(elAmount) elAmount.addEventListener('input', compute);
    if(elFrom) elFrom.addEventListener('change', compute);
    if(elTo) elTo.addEventListener('change', compute);
    if(elSwap) elSwap.addEventListener('click', function(){ var tmp = elFrom.value; elFrom.value = elTo.value; elTo.value = tmp; compute(); });
    document.querySelectorAll('.cv-qb').forEach(function(b){ b.addEventListener('click', function(){ if(elTo) elTo.value = b.dataset.cur; compute(); }); });

    /* API globale (compat pages existantes) */
    window.toggleCv  = function(e){ if(e) e.stopPropagation(); if(pop) pop.toggle(); };
    window.cvCompute = compute;
    window.cvFetch   = compute;
    window.cvSwap    = function(){ if(elFrom&&elTo){ var x=elFrom.value; elFrom.value=elTo.value; elTo.value=x; compute(); } };
    window.cvSetTo   = function(c){ if(elTo) elTo.value=c; compute(); };
    fetchRates();
  }

  function updateNav(){
    var logged = isLoggedIn();
    var btnLogin = document.getElementById('btnLogin'), navUser = document.getElementById('navUser'),
        navAvatar = document.getElementById('navAvatar'), navUName = document.getElementById('navUserName'),
        btnPost = document.getElementById('btnPost'), mmCta = document.getElementById('mmCta'),
        mmLogin = document.getElementById('mmLogin'), mmSignup = document.getElementById('mmSignup'),
        navFavs = document.getElementById('navFavs');
    if(logged){
      if(btnLogin) btnLogin.style.display = 'none';
      if(navUser){
        navUser.style.display = 'inline-flex'; navUser.title = t('myDashboard');
        var go = function(){ window.location.href = href('dashboard.html'); };
        navUser.onclick = go; navUser.onkeydown = function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } };
        if(navAvatar) navAvatar.textContent = getInitials(getUserName(), getUserEmail());
        if(navUName) navUName.textContent = getUserName() || getUserEmail().split('@')[0] || t('myAccount');
      }
      if(navFavs){
        var n = window.A2SFavs ? window.A2SFavs.count() : 0;
        var fc = document.getElementById('navFavCount'); if(fc) fc.textContent = n;
        navFavs.style.display = n ? 'inline-flex' : 'none';
      }
      if(btnPost){ btnPost.onclick = null; btnPost.href = href('post-listing.html'); }
      if(mmLogin){ mmLogin.href = href('dashboard.html'); mmLogin.innerHTML = ic('layout') + t('myDashboard'); }
      if(mmSignup){ mmSignup.href = href('messages.html'); mmSignup.innerHTML = ic('message') + t('myMessages'); }
      if(mmCta){ mmCta.href = href('post-listing.html'); }
    } else {
      if(btnLogin) btnLogin.style.display = '';
      if(navUser) navUser.style.display = 'none';
      if(navFavs) navFavs.style.display = 'none';
      if(btnPost){
        btnPost.href = href('login.html') + '?redirect=post-listing.html';
        btnPost.onclick = null;
      }
      if(mmCta){ mmCta.href = href('login.html') + '?redirect=post-listing.html'; }
    }
  }
  document.addEventListener('a2s:favs-updated', updateNav);

  window.a2sAuth = {
    isLoggedIn: isLoggedIn,
    login: function(name, email, plan){
      localStorage.setItem(KEY_LOGGED, 'true');
      if(name) localStorage.setItem(KEY_NAME, name);
      if(email) localStorage.setItem(KEY_EMAIL, email);
      if(plan) localStorage.setItem(KEY_PLAN, plan || 'Essentiel');
      try {
        var _u = JSON.parse(localStorage.getItem('a2s_users')||'[]');
        if(!_u.some(function(u){return u.email===email;})){
          _u.unshift({id:Date.now(),name:name||'',email:email||'',plan:plan||'Essentiel',status:'active',registeredAt:new Date().toISOString(),listings:0});
          localStorage.setItem('a2s_users', JSON.stringify(_u));
        }
      } catch(e){}
      updateNav();
    },
    logout: function(){
      [KEY_LOGGED, KEY_NAME, KEY_EMAIL, KEY_PLAN].forEach(function(k){ localStorage.removeItem(k); });
      sessionStorage.removeItem('a2s_auth_token');
      updateNav();
      window.location.href = href('index.html');
    },
    requireLogin: function(e, dest){
      if(e) e.preventDefault();
      if(isLoggedIn()) window.location.href = dest;
      else window.location.href = href('login.html') + '?redirect=' + encodeURIComponent(dest);
    },
    href: href,
    lang: currentLang
  };

  function boot(){
    injectCSS();
    ensureIcons(function(){
      injectNav();
      bindScroll();
      bindBurger();
      bindMegaMenu();
      bindPopover('navLang', 'toggleLangBtn');
      initCurrency();
      updateNav();
      if(window.A2SIcon && window.A2SIcon.hydrate) window.A2SIcon.hydrate();
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ══ CACHE SUPABASE CÔTÉ CLIENT (5 min) ══════════════════════ */
window.A2SCache = {
  _store: {},
  get: function(key){ var item = this._store[key]; if(!item) return null; if(Date.now() - item.ts > 5*60*1000){ delete this._store[key]; return null; } return item.data; },
  set: function(key, data){ this._store[key] = { data: data, ts: Date.now() }; return data; },
  clear: function(){ this._store = {}; }
};
window.sbGetCached = async function(table, params){
  var key = table + '?' + params;
  var cached = window.A2SCache.get(key); if(cached) return cached;
  var SB_URL = 'https://hlivysnlzlqdjcigqgvk.supabase.co';
  var SB_KEY = 'sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';
  try {
    var r = await fetch(SB_URL + '/rest/v1/' + table + '?' + params, { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
    var data = r.ok ? await r.json() : [];
    return window.A2SCache.set(key, data);
  } catch(e){ return []; }
};
