/* ============================================================
   A2SFavs — Favoris partagés (localStorage)
   Utilisé par listing.html, search.html, dashboard.html
   ============================================================ */
window.A2SFavs = (function(){
  const KEY = 'a2s_favourites';

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e){ return []; }
  }

  function save(arr){
    localStorage.setItem(KEY, JSON.stringify(arr));
    document.dispatchEvent(new CustomEvent('a2s:favs-updated'));
  }

  function has(id){
    return load().some(f => String(f.id) === String(id));
  }

  function toggle(listing){
    const favs = load();
    const idx  = favs.findIndex(f => String(f.id) === String(listing.id));
    if(idx > -1){
      favs.splice(idx, 1);
      save(favs);
      return false;
    } else {
      favs.unshift({ ...listing, savedAt: new Date().toISOString() });
      save(favs);
      return true;
    }
  }

  function remove(id){
    save(load().filter(f => String(f.id) !== String(id)));
  }

  function getAll(){ return load(); }
  function clear(){ save([]); }
  function count(){ return load().length; }

  return { has, toggle, remove, getAll, clear, count };
})();

/* ============================================================
   nav.js — Aircraft2Sell
   Navbar universelle auto-injectée + auth persistante
   ============================================================ */

(function(){

  /* ── Clés localStorage ─────────────────────────────────── */
  var KEY_LOGGED = 'a2s_logged_in';
  var KEY_NAME   = 'a2s_user_name';
  var KEY_EMAIL  = 'a2s_user_email';
  var KEY_PLAN   = 'a2s_user_plan';

  /* ── Utilitaires auth ──────────────────────────────────── */
  function isLoggedIn(){ return localStorage.getItem(KEY_LOGGED) === 'true'; }
  function getUserName(){ return localStorage.getItem(KEY_NAME) || ''; }
  function getUserEmail(){ return localStorage.getItem(KEY_EMAIL) || ''; }
  function getUserPlan(){ return localStorage.getItem(KEY_PLAN) || 'Essentiel'; }

  function getInitials(name, email){
    if(name && name.trim()){
      return name.trim().split(/\s+/).map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    }
    if(email) return email[0].toUpperCase();
    return 'U';
  }

  /* ── CSS global injecté ────────────────────────────────── */
  function injectCSS(){
    if(document.getElementById('a2s-nav-css')) return;
    var s = document.createElement('style');
    s.id = 'a2s-nav-css';
    s.textContent = [
      /* Nav base */
      'nav#mainNav{position:fixed;top:0;left:0;right:0;z-index:500;height:64px;padding:0 2rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;background:rgba(3,6,16,.8);backdrop-filter:blur(28px) saturate(1.4);border-bottom:1px solid rgba(180,200,230,.08);transition:background .3s}',
      'nav#mainNav.scrolled{background:rgba(3,6,16,.97)}',
      /* Logo */
      'nav#mainNav .logo{font-family:"Bebas Neue",sans-serif;font-size:1.75rem;letter-spacing:.12em;color:#edf2f8;text-decoration:none;display:flex;align-items:center;gap:2px;flex-shrink:0}',
      'nav#mainNav .logo span{color:#e8a020}',
      /* Nav links */
      'nav#mainNav .nav-links{display:flex;list-style:none;align-items:center;gap:.1rem;height:64px}',
      'nav#mainNav .nav-links a{display:flex;align-items:center;height:64px;padding:0 .9rem;font-size:.72rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#7a93aa;text-decoration:none;transition:color .2s;white-space:nowrap;position:relative}',
      'nav#mainNav .nav-links a::after{content:"";position:absolute;bottom:0;left:.9rem;right:.9rem;height:2px;background:#e8a020;transform:scaleX(0);transition:transform .2s}',
      'nav#mainNav .nav-links a:hover{color:#edf2f8}',
      'nav#mainNav .nav-links a:hover::after{transform:scaleX(1)}',
      /* Nav right */
      'nav#mainNav .nav-right{display:flex;align-items:center;gap:.6rem;flex-shrink:0}',
      /* Bouton login */
      '.btn-nav-login{background:transparent;border:1px solid rgba(180,200,230,.14);color:#c8d8e8;padding:.44rem 1.1rem;font-family:"DM Sans",sans-serif;font-size:.76rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center}',
      '.btn-nav-login:hover{border-color:#e8a020;color:#e8a020}',
      /* Bouton post */
      '.btn-post{background:#e8a020;color:#030610;border:none;padding:.48rem 1.3rem;font-family:"DM Sans",sans-serif;font-size:.76rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer;transition:background .2s,transform .15s;display:inline-flex;align-items:center}',
      '.btn-post:hover{background:#f5c518;transform:translateY(-1px)}',
      /* Avatar user */
      '.nav-user{display:none;align-items:center;gap:.6rem;cursor:pointer;padding:.3rem .65rem;border:1px solid rgba(180,200,230,.08);transition:border-color .2s}',
      '.nav-user:hover{border-color:rgba(180,200,230,.14)}',
      '.nav-user:hover .nav-avatar{background:rgba(232,160,32,.3)!important;border-color:#e8a020!important}',
      '.nav-user:hover .nav-user-name{color:#e8a020!important}',
      '.nav-avatar{width:28px;height:28px;background:rgba(232,160,32,.18);border:1px solid rgba(232,160,32,.3);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;color:#e8a020}',
      '.nav-user-name{font-size:.76rem;font-weight:500;color:#c8d8e8}',
      /* Burger */
      '.burger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:.5rem;min-height:unset}',
      '.burger span{display:block;width:22px;height:2px;background:#edf2f8;border-radius:1px;transition:all .25s}',
      '.burger.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}',
      '.burger.open span:nth-child(2){opacity:0}',
      '.burger.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}',
      /* Mobile menu */
      '.mobile-menu{display:none;position:fixed;inset:0;background:rgba(3,6,16,.98);backdrop-filter:blur(20px);z-index:490;flex-direction:column;padding:5rem 2rem 2rem;overflow-y:auto}',
      '.mobile-menu.open{display:flex}',
      '.mobile-menu a{padding:1.1rem 0;font-size:.9rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#c8d8e8;text-decoration:none;border-bottom:1px solid rgba(180,200,230,.08);display:block;transition:color .2s}',
      '.mobile-menu a:hover{color:#e8a020}',
      '.mm-cta{margin-top:2rem;background:#e8a020;color:#030610;text-align:center;padding:1rem;font-family:"Bebas Neue",sans-serif;font-size:1.1rem;letter-spacing:.1em;cursor:pointer;text-decoration:none;display:block!important;border-bottom:none!important}',
      '.mm-cta:hover{background:#f5c518!important;color:#030610!important}',
      /* Currency widget */
      '.nav-currency{position:relative;display:flex;align-items:center;height:64px}',
      '.nav-currency-btn{display:flex;align-items:center;gap:.4rem;height:64px;padding:0 .9rem;font-size:.72rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#7a93aa;cursor:pointer;background:none;border:none;font-family:"DM Sans",sans-serif;transition:color .2s;white-space:nowrap}',
      '.nav-currency-btn:hover{color:#edf2f8}',
      '.nav-currency-btn .cv-arrow{font-size:.55rem;opacity:.5;transition:transform .2s}',
      '.nav-currency.open .cv-arrow{transform:rotate(180deg)}',
      '.nav-currency.open .nav-currency-btn{color:#edf2f8}',
      '.cv-dropdown{position:absolute;top:calc(100% + 1px);left:50%;transform:translateX(-50%) translateY(-6px);width:284px;background:rgba(3,6,16,.98);backdrop-filter:blur(28px);border:1px solid rgba(180,200,230,.14);z-index:500;opacity:0;pointer-events:none;transition:opacity .18s,transform .18s}',
      '.nav-currency.open .cv-dropdown{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}',
      '.cv-drop-head{padding:.6rem 1rem;border-bottom:1px solid rgba(180,200,230,.08);display:flex;justify-content:space-between;align-items:center}',
      '.cv-drop-title{font-size:.58rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#3d5468}',
      '.cv-live{display:flex;align-items:center;gap:.35rem;font-size:.58rem;color:#22c55e}',
      '.cv-live::before{content:"";width:5px;height:5px;border-radius:50%;background:#22c55e;animation:cvpulse 2s infinite;flex-shrink:0}',
      '@keyframes cvpulse{0%,100%{opacity:1}50%{opacity:.3}}',
      '.cv-body{padding:.85rem 1rem}',
      '.cv-row{display:flex;gap:.4rem;margin-bottom:.4rem;align-items:center}',
      '.cv-inp-wrap{flex:1;display:flex;border:1px solid rgba(180,200,230,.14);overflow:hidden;min-width:0}',
      '.cv-inp{flex:1;background:rgba(255,255,255,.04);border:none;color:#edf2f8;font-family:"DM Sans",sans-serif;font-size:.92rem;padding:.55rem .7rem;outline:none;min-width:0}',
      '.cv-sel{background:rgba(232,160,32,.08);border:none;border-left:1px solid rgba(180,200,230,.14);color:#e8a020;font-family:"DM Sans",sans-serif;font-size:.7rem;font-weight:600;padding:.3rem .4rem;cursor:pointer;outline:none;flex-shrink:0}',
      '.cv-sel option{background:#030610;color:#edf2f8}',
      '.cv-swap-btn{background:none;border:1px solid rgba(180,200,230,.14);color:#7a93aa;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.95rem;transition:all .15s;flex-shrink:0}',
      '.cv-swap-btn:hover{color:#e8a020;border-color:rgba(232,160,32,.3)}',
      '.cv-result-box{background:rgba(232,160,32,.06);border:1px solid rgba(232,160,32,.15);padding:.55rem .85rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem}',
      '.cv-result-val{font-family:"Bebas Neue",sans-serif;font-size:1.4rem;letter-spacing:.04em;color:#e8a020}',
      '.cv-to-sel{background:none;border:none;color:#e8a020;font-family:"DM Sans",sans-serif;font-size:.72rem;font-weight:700;cursor:pointer;outline:none;padding:0}',
      '.cv-to-sel option{background:#030610;color:#edf2f8}',
      '.cv-rate-txt{font-size:.61rem;color:#3d5468;text-align:center;padding:.2rem 0;border-top:1px solid rgba(180,200,230,.08)}',
      '.cv-rate-txt span{color:#7a93aa}',
      '.cv-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin-top:.45rem}',
      '.cv-qb{background:rgba(255,255,255,.03);border:1px solid rgba(180,200,230,.08);color:#7a93aa;padding:.27rem .2rem;font-size:.61rem;font-weight:600;cursor:pointer;text-align:center;letter-spacing:.04em;transition:all .12s;font-family:"DM Sans",sans-serif}',
      '.cv-qb:hover,.cv-qb.on{border-color:rgba(232,160,32,.3);color:#e8a020;background:rgba(232,160,32,.05)}',
      /* Responsive */
      '@media(max-width:768px){nav#mainNav{padding:0 1.25rem}.nav-links,.btn-nav-login{display:none!important}.burger{display:flex}}',
      '@supports(padding-bottom:env(safe-area-inset-bottom)){.mobile-menu{padding-bottom:calc(2rem + env(safe-area-inset-bottom))}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── HTML Navbar ───────────────────────────────────────── */
  function buildNavHTML(){
    return [
      '<nav id="mainNav">',
        '<a href="homepage.html" class="logo">Aircraft2<span>Sell</span></a>',
        '<ul class="nav-links">',
          '<li><a href="search.html">Annonces</a></li>',
          '<li><a href="search.html?cat=light">Avions</a></li>',
          '<li><a href="search.html?cat=heli">Hélicoptères</a></li>',
          '<li><a href="comparateur.html">Comparateur</a></li>',
          /* Convertisseur devises */
          '<li class="nav-currency" id="navCurrency">',
            '<button class="nav-currency-btn" id="toggleCvBtn" aria-label="Convertisseur de devises">',
              '<span>Devises</span>',
              '<span class="cv-arrow">▾</span>',
            '</button>',
            '<div class="cv-dropdown">',
              '<div class="cv-drop-head">',
                '<span class="cv-drop-title">Convertisseur</span>',
                '<span class="cv-live" id="cvLiveTime">En direct</span>',
              '</div>',
              '<div class="cv-body">',
                '<div class="cv-row">',
                  '<div class="cv-inp-wrap">',
                    '<input class="cv-inp" type="number" id="cvAmount" value="100000" min="0">',
                    '<select class="cv-sel" id="cvFrom">',
                      '<option value="EUR">€ EUR</option>',
                      '<option value="USD">$ USD</option>',
                      '<option value="GBP">£ GBP</option>',
                      '<option value="CHF">Fr CHF</option>',
                      '<option value="CAD">CA$ CAD</option>',
                      '<option value="AUD">AU$ AUD</option>',
                      '<option value="JPY">¥ JPY</option>',
                      '<option value="SEK">kr SEK</option>',
                      '<option value="NOK">kr NOK</option>',
                      '<option value="DKK">kr DKK</option>',
                      '<option value="PLN">zł PLN</option>',
                      '<option value="AED">AED</option>',
                    '</select>',
                  '</div>',
                  '<button class="cv-swap-btn" id="cvSwapBtn" title="Inverser">⇅</button>',
                '</div>',
                '<div class="cv-result-box">',
                  '<div>',
                    '<div class="cv-result-val" id="cvResult">…</div>',
                    '<div style="font-size:.57rem;color:#3d5468;margin-top:.1rem">Taux indicatif BCE</div>',
                  '</div>',
                  '<select class="cv-to-sel" id="cvTo">',
                    '<option value="EUR">EUR €</option>',
                    '<option value="USD" selected>USD $</option>',
                    '<option value="GBP">GBP £</option>',
                    '<option value="CHF">CHF Fr</option>',
                    '<option value="CAD">CAD $</option>',
                    '<option value="AUD">AUD $</option>',
                    '<option value="JPY">JPY ¥</option>',
                    '<option value="SEK">SEK kr</option>',
                    '<option value="NOK">NOK kr</option>',
                    '<option value="DKK">DKK kr</option>',
                    '<option value="PLN">PLN zł</option>',
                    '<option value="AED">AED</option>',
                  '</select>',
                '</div>',
                '<div class="cv-rate-txt" id="cvRateTxt"><span>—</span></div>',
                '<div class="cv-quick">',
                  '<button class="cv-qb" data-cur="USD">USD</button>',
                  '<button class="cv-qb" data-cur="GBP">GBP</button>',
                  '<button class="cv-qb" data-cur="CHF">CHF</button>',
                  '<button class="cv-qb" data-cur="CAD">CAD</button>',
                  '<button class="cv-qb" data-cur="AUD">AUD</button>',
                  '<button class="cv-qb" data-cur="JPY">JPY</button>',
                  '<button class="cv-qb" data-cur="AED">AED</button>',
                  '<button class="cv-qb" data-cur="EUR">EUR</button>',
                '</div>',
              '</div>',
            '</div>',
          '</li>',
          '<li><a href="guide-acheteur.html">Guide</a></li>',
          '<li><a href="faq.html">FAQ</a></li>',
          '<li><a href="contact.html">Contact</a></li>',
        '</ul>',
        '<div class="nav-right">',
          '<a href="login.html" class="btn-nav-login" id="btnLogin">Connexion</a>',
          '<div class="nav-user" id="navUser">',
            '<div class="nav-avatar" id="navAvatar">U</div>',
            '<span class="nav-user-name" id="navUserName">Mon compte</span>',
          '</div>',
          '<a href="post-listing.html" class="btn-post" id="btnPost">+ Déposer</a>',
          '<button class="burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>',
        '</div>',
      '</nav>',
      /* Mobile menu */
      '<div class="mobile-menu" id="mobileMenu">',
        '<a href="search.html">Annonces</a>',
        '<a href="search.html?cat=light">Avions légers</a>',
        '<a href="search.html?cat=jet">Jets d\'affaires</a>',
        '<a href="search.html?cat=heli">Hélicoptères</a>',
        '<a href="guide-acheteur.html">Guide acheteur</a>',
        '<a href="faq.html">FAQ</a>',
        '<a href="contact.html">Contact</a>',
        '<a href="login.html" class="mm-cta" id="mmCta">Se connecter</a>',
      '</div>'
    ].join('');
  }

  /* ── Injecter navbar dans le DOM ───────────────────────── */
  function injectNav(){
    /* Ne pas injecter si une nav#mainNav existe déjà dans le HTML */
    if(document.getElementById('mainNav')) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildNavHTML();
    /* Insérer au tout début du body */
    var first = document.body.firstChild;
    while(wrapper.firstChild){
      document.body.insertBefore(wrapper.firstChild, first);
    }
  }

  /* ── Scroll: nav.scrolled ──────────────────────────────── */
  function bindScroll(){
    var nav = document.getElementById('mainNav');
    if(!nav) return;
    function onScroll(){
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* ── Burger / mobile menu ──────────────────────────────── */
  function bindBurger(){
    var burger = document.getElementById('burger');
    var menu   = document.getElementById('mobileMenu');
    if(!burger || !menu) return;
    burger.addEventListener('click', function(){
      burger.classList.toggle('open');
      menu.classList.toggle('open');
    });
    /* Fermer au clic sur un lien du menu mobile */
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        burger.classList.remove('open');
        menu.classList.remove('open');
      });
    });
  }

  /* ── Convertisseur devises ─────────────────────────────── */
  function initCurrency(){
    var _rates = {EUR:1};
    var _busy  = false;
    var SYMS   = {EUR:'€',USD:'$',GBP:'£',CHF:'Fr',CAD:'CA$',AUD:'AU$',JPY:'¥',SEK:'kr',NOK:'kr',DKK:'kr',PLN:'zł',AED:'AED'};
    var FALLBACK = {USD:1.0812,GBP:0.8563,CHF:0.9601,CAD:1.4721,AUD:1.6534,JPY:161.84,SEK:11.12,NOK:11.52,DKK:7.461,PLN:4.272,AED:3.971};

    var elToggle = document.getElementById('toggleCvBtn');
    var elNav    = document.getElementById('navCurrency');
    var elAmount = document.getElementById('cvAmount');
    var elFrom   = document.getElementById('cvFrom');
    var elTo     = document.getElementById('cvTo');
    var elResult = document.getElementById('cvResult');
    var elRate   = document.getElementById('cvRateTxt');
    var elLive   = document.getElementById('cvLiveTime');
    var elSwap   = document.getElementById('cvSwapBtn');

    if(!elToggle || !elNav) return;

    /* Toggle dropdown */
    elToggle.addEventListener('click', function(e){
      e.stopPropagation();
      elNav.classList.toggle('open');
      if(elNav.classList.contains('open')){
        setTimeout(function(){
          document.addEventListener('click', function cl(ev){
            if(!elNav.contains(ev.target)){
              elNav.classList.remove('open');
              document.removeEventListener('click', cl);
            }
          });
        }, 0);
      }
    });

    /* Compute */
    function compute(){
      if(!elAmount || !elResult) return;
      var amt  = parseFloat(elAmount.value) || 0;
      var from = elFrom ? elFrom.value : 'EUR';
      var to   = elTo   ? elTo.value   : 'USD';
      var rFrom = _rates[from] || 1;
      var rTo   = _rates[to]   || 1;
      var rate  = (from === to) ? 1 : (1/rFrom)*rTo;
      var result = amt * rate;
      var fmt = result >= 1000
        ? result.toLocaleString('fr-FR',{maximumFractionDigits:0})
        : result.toFixed(2);
      elResult.textContent = (SYMS[to]||to) + fmt;
      if(elRate) elRate.innerHTML = '<span>1 '+from+' = '+rate.toFixed(4)+' '+to+'</span>';
      document.querySelectorAll('.cv-qb').forEach(function(b){
        b.classList.toggle('on', b.dataset && b.dataset.cur === to);
      });
    }

    /* Fetch rates */
    function fetchRates(){
      if(_busy) return;
      _busy = true;
      if(elLive) elLive.textContent = 'Chargement…';
      var urls = [
        'https://api.frankfurter.dev/v2/rates?base=EUR',
        'https://api.frankfurter.app/latest?base=EUR'
      ];
      var tried = 0;
      function tryNext(){
        if(tried >= urls.length){
          _busy = false;
          _rates = Object.assign({EUR:1}, FALLBACK);
          if(elLive) elLive.textContent = 'Taux indicatifs (hors ligne)';
          compute();
          return;
        }
        fetch(urls[tried++])
          .then(function(r){ return r.json(); })
          .then(function(d){
            _busy = false;
            var rates = d.rates || d;
            if(rates && typeof rates === 'object' && rates.USD){
              _rates = Object.assign({EUR:1}, rates);
              var ts = new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
              if(elLive) elLive.textContent = 'En direct · ' + ts;
            } else {
              _rates = Object.assign({EUR:1}, FALLBACK);
              if(elLive) elLive.textContent = 'Taux indicatifs';
            }
            compute();
          })
          .catch(function(){ tryNext(); });
      }
      tryNext();
    }

    /* Events */
    if(elAmount) elAmount.addEventListener('input', compute);
    if(elFrom)   elFrom.addEventListener('change', compute);
    if(elTo)     elTo.addEventListener('change', compute);
    if(elSwap)   elSwap.addEventListener('click', function(){
      var tmp = elFrom.value;
      elFrom.value = elTo.value;
      elTo.value = tmp;
      compute();
    });
    document.querySelectorAll('.cv-qb').forEach(function(b){
      b.addEventListener('click', function(){
        if(elTo) elTo.value = b.dataset.cur;
        compute();
      });
    });

    /* Exposer pour compat avec du code inline existant */
    window.toggleCv  = function(e){ e.stopPropagation(); elNav.classList.toggle('open'); };
    window.cvCompute = compute;
    window.cvFetch   = compute;
    window.cvSwap    = function(){ if(elFrom&&elTo){var t=elFrom.value;elFrom.value=elTo.value;elTo.value=t;compute();} };
    window.cvSetTo   = function(c){ if(elTo) elTo.value=c; compute(); };

    fetchRates();
  }

  /* ── Mettre à jour la nav (auth) ───────────────────────── */
  function updateNav(){
    var logged    = isLoggedIn();
    var btnLogin  = document.getElementById('btnLogin');
    var navUser   = document.getElementById('navUser');
    var navAvatar = document.getElementById('navAvatar');
    var navUName  = document.getElementById('navUserName');
    var btnPost   = document.getElementById('btnPost');
    var mmCta     = document.getElementById('mmCta');

    if(logged){
      if(btnLogin) btnLogin.style.display = 'none';
      if(navUser){
        navUser.style.display  = 'flex';
        navUser.style.cursor   = 'pointer';
        navUser.title          = 'Mon tableau de bord';
        navUser.onclick        = function(){ window.location.href = 'dashboard.html'; };
        if(navAvatar) navAvatar.textContent = getInitials(getUserName(), getUserEmail());
        if(navUName)  navUName.textContent  = getUserName() || getUserEmail().split('@')[0] || 'Mon compte';
      }
      if(btnPost){
        btnPost.removeAttribute('onclick');
        btnPost.href = 'post-listing.html';
      }
      /* Mobile menu : remplacer "Se connecter" par "Mon compte" */
      if(mmCta){
        mmCta.href        = 'dashboard.html';
        mmCta.textContent = 'Mon compte';
      }
    } else {
      if(btnLogin) btnLogin.style.display = '';
      if(navUser)  navUser.style.display  = 'none';
      if(btnPost){
        btnPost.href = '#';
        btnPost.onclick = function(e){
          e.preventDefault();
          window.location.href = 'login.html?redirect=post-listing.html';
        };
      }
      if(mmCta){
        mmCta.href        = 'login.html';
        mmCta.textContent = 'Se connecter';
      }
    }
  }

  /* ── API publique ──────────────────────────────────────── */
  window.a2sAuth = {
    isLoggedIn: isLoggedIn,
    login: function(name, email, plan){
      localStorage.setItem(KEY_LOGGED, 'true');
      if(name)  localStorage.setItem(KEY_NAME,  name);
      if(email) localStorage.setItem(KEY_EMAIL, email);
      if(plan)  localStorage.setItem(KEY_PLAN,  plan || 'Essentiel');
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
      localStorage.removeItem(KEY_LOGGED);
      localStorage.removeItem(KEY_NAME);
      localStorage.removeItem(KEY_EMAIL);
      localStorage.removeItem(KEY_PLAN);
      updateNav();
      window.location.href = 'homepage.html';
    },
    requireLogin: function(e, dest){
      if(e) e.preventDefault();
      if(isLoggedIn()){
        window.location.href = dest;
      } else {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(dest);
      }
    }
  };

  /* ── Fonction globale toggleMenu (burger inline) ───────── */
  window.toggleMenu = function(){
    var burger = document.getElementById('burger');
    var menu   = document.getElementById('mobileMenu');
    if(burger) burger.classList.toggle('open');
    if(menu)   menu.classList.toggle('open');
  };

  /* ── Boot ──────────────────────────────────────────────── */
  function boot(){
    injectCSS();
    injectNav();
    bindScroll();
    bindBurger();
    initCurrency();
    updateNav();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
