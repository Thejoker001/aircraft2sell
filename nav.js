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
   Design system "marketplace généraliste" (voir styles.css) :
   navy #0B2545 + accent orange #FF7A1A utilisé UNIQUEMENT
   pour le CTA principal, jamais en décoration.
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

  /* ── Langue courante (déduite du chemin) ───────────────── */
  function currentLang(){
    var m = location.pathname.match(/^\/(en|de|it|es)\//);
    return m ? m[1] : 'fr';
  }
  var LANG_FLAGS = { fr:'🇫🇷', en:'🇬🇧', de:'🇩🇪', it:'🇮🇹', es:'🇪🇸' };

  /* ── CSS global injecté (fallback si styles.css absent) ── */
  function injectCSS(){
    if(document.getElementById('a2s-nav-css')) return;
    var s = document.createElement('style');
    s.id = 'a2s-nav-css';
    s.textContent = [
      /* Nav base */
      'nav#mainNav{position:fixed;top:0;left:0;right:0;z-index:500;height:64px;padding:0 2rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;background:#0B2545;box-shadow:0 2px 16px rgba(11,37,69,.18);border-bottom:1px solid rgba(255,255,255,.08);transition:background .3s}',
      'nav#mainNav.scrolled{background:#123568}',
      /* Logo */
      'nav#mainNav .logo{font-family:"Poppins",sans-serif;font-weight:700;font-size:1.4rem;letter-spacing:-.01em;color:#fff;text-decoration:none;display:flex;align-items:center;gap:2px;flex-shrink:0}',
      'nav#mainNav .logo span{color:#FF7A1A}',
      /* Nav links */
      'nav#mainNav .nav-links{display:flex;list-style:none;align-items:center;gap:.1rem;height:64px}',
      'nav#mainNav .nav-links>li{position:relative;height:64px;display:flex;align-items:center}',
      'nav#mainNav .nav-links a{display:flex;align-items:center;height:64px;padding:0 .85rem;font-size:.84rem;font-weight:500;color:rgba(255,255,255,.78);text-decoration:none;transition:color .2s;white-space:nowrap;position:relative}',
      'nav#mainNav .nav-links a::after{content:"";position:absolute;bottom:0;left:.85rem;right:.85rem;height:2px;background:#fff;transform:scaleX(0);transition:transform .2s}',
      'nav#mainNav .nav-links a:hover{color:#fff}',
      'nav#mainNav .nav-links a:hover::after{transform:scaleX(1)}',
      /* Nav right */
      'nav#mainNav .nav-right{display:flex;align-items:center;gap:.55rem;flex-shrink:0}',
      /* Bouton login */
      '.btn-nav-login{background:transparent;border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);padding:.44rem 1.1rem;font-family:"Inter",sans-serif;font-size:.8rem;font-weight:500;text-decoration:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;border-radius:8px}',
      '.btn-nav-login:hover{border-color:#fff;color:#fff}',
      /* Bouton post (seule décoration accent) */
      '.btn-post{background:#FF7A1A;color:#fff;border:none;padding:.5rem 1.3rem;font-family:"Poppins",sans-serif;font-size:.82rem;font-weight:600;text-decoration:none;cursor:pointer;transition:background .2s,transform .15s;display:inline-flex;align-items:center;border-radius:8px}',
      '.btn-post:hover{background:#E8690F;transform:translateY(-1px)}',
      '.btn-post .bp-short{display:none}',
      /* Avatar user */
      '.nav-user{display:none;align-items:center;gap:.6rem;cursor:pointer;padding:.3rem .65rem;border:1px solid rgba(255,255,255,.15);transition:border-color .2s;border-radius:8px}',
      '.nav-user:hover{border-color:rgba(255,255,255,.3)}',
      '.nav-user:hover .nav-avatar{background:rgba(255,122,26,.3)!important;border-color:#FF7A1A!important}',
      '.nav-user:hover .nav-user-name{color:#FF7A1A!important}',
      '.nav-avatar{width:28px;height:28px;background:rgba(255,122,26,.2);border:1px solid rgba(255,122,26,.4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;color:#FF7A1A}',
      '.nav-user-name{font-size:.78rem;font-weight:500;color:rgba(255,255,255,.85)}',
      /* Favoris */
      '.nav-favs{display:none;align-items:center;gap:.3rem;color:rgba(255,255,255,.85);text-decoration:none;font-size:.82rem;padding:.4rem .5rem}',
      '.nav-favs:hover{color:#fff}',
      /* Langue — badge visible en permanence (desktop + mobile), plus un simple lien de menu */
      '.nav-lang{position:relative;display:flex;align-items:center;flex-shrink:0}',
      '.nav-lang-btn{display:flex;align-items:center;gap:.35rem;height:38px;padding:0 .75rem;font-size:.8rem;font-weight:700;color:#fff;cursor:pointer;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.28);border-radius:8px;font-family:"Inter",sans-serif;transition:all .2s;white-space:nowrap}',
      '.nav-lang-btn:hover{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.5)}',
      '.nav-lang-btn .nav-lang-flag{font-size:.95rem;line-height:1}',
      '.nav-lang-btn .cv-arrow{font-size:.55rem;opacity:.7;transition:transform .2s}',
      '.nav-lang.open .cv-arrow{transform:rotate(180deg)}',
      '.nav-lang.open .nav-lang-btn{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.5)}',
      '.nav-lang-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:170px;background:#fff;box-shadow:0 12px 32px rgba(11,37,69,.22);border:1px solid #E3E8F0;border-radius:12px;z-index:500;opacity:0;pointer-events:none;transform:translateY(-6px);transition:opacity .18s,transform .18s;overflow:hidden}',
      '.nav-lang.open .nav-lang-dropdown{opacity:1;pointer-events:auto;transform:translateY(0)}',
      '.nav-lang-dropdown a{display:flex;align-items:center;gap:.6rem;padding:.65rem .9rem;font-size:.84rem;font-weight:500;color:#16233A;text-decoration:none;transition:background .15s}',
      '.nav-lang-dropdown a:hover{background:#F7F9FC}',
      '.nav-lang-dropdown a.active{color:#1E5FCC;font-weight:700;background:rgba(30,95,204,.06)}',
      /* Méga-menu Acheter */
      '.nav-mega{position:relative}',
      '.nav-mega-trigger{display:flex;align-items:center;gap:.3rem;cursor:pointer}',
      '.nav-mega-trigger .mega-arrow{font-size:.55rem;opacity:.6;transition:transform .2s}',
      '.nav-mega.open .mega-arrow{transform:rotate(180deg)}',
      '.nav-mega-panel{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(-8px);width:620px;max-width:90vw;background:#fff;box-shadow:0 16px 40px rgba(11,37,69,.18);border:1px solid #E3E8F0;border-radius:12px;padding:1.25rem;z-index:500;display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem;opacity:0;pointer-events:none;transition:opacity .18s,transform .18s}',
      '.nav-mega.open .nav-mega-panel{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}',
      '.nav-mega-item{display:flex;align-items:center;gap:.6rem;padding:.65rem .7rem;border-radius:8px;color:#16233A;text-decoration:none;font-size:.84rem;font-weight:500;transition:background .15s}',
      '.nav-mega-item:hover{background:#F7F9FC;color:#0B2545}',
      '.nav-mega-item .mi-icon{font-size:1.1rem;flex-shrink:0}',
      '.nav-mega-all{grid-column:1/-1;margin-top:.35rem;padding-top:.75rem;border-top:1px solid #E3E8F0;display:flex;align-items:center;justify-content:space-between;color:#1E5FCC;text-decoration:none;font-size:.82rem;font-weight:700}',
      /* Burger */
      '.burger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:.5rem;min-height:unset}',
      '.burger span{display:block;width:22px;height:2px;background:#fff;border-radius:1px;transition:all .25s}',
      '.burger.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}',
      '.burger.open span:nth-child(2){opacity:0}',
      '.burger.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}',
      /* Mobile menu */
      '.mobile-menu{display:none;position:fixed;inset:0;background:#0B2545;z-index:490;flex-direction:column;padding:5rem 1.5rem 2rem;overflow-y:auto}',
      '.mobile-menu.open{display:flex}',
      '.mobile-menu a{padding:1rem 0;font-size:.92rem;font-weight:500;color:rgba(255,255,255,.85);text-decoration:none;border-bottom:1px solid rgba(255,255,255,.1);display:block;transition:color .2s}',
      '.mobile-menu a:hover{color:#fff}',
      '.mobile-menu .mm-section-label{font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:1.1rem 0 .3rem}',
      '.mobile-menu .mm-sub{padding-left:1rem;font-size:.84rem}',
      '.mm-cta{margin-top:1.5rem;background:#FF7A1A;color:#fff;text-align:center;padding:.95rem;font-family:"Poppins",sans-serif;font-weight:600;font-size:1rem;cursor:pointer;text-decoration:none;display:block!important;border-bottom:none!important;border-radius:8px}',
      '.mm-cta:hover{background:#E8690F!important;color:#fff!important}',
      '.mm-langs{display:flex;gap:.4rem;margin-top:1.25rem;flex-wrap:wrap}',
      '.mm-lang-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);font-family:"Inter",sans-serif;font-size:.72rem;font-weight:600;padding:.35rem .7rem;border-radius:6px;text-decoration:none}',
      '.mm-lang-btn.active{background:#FF7A1A;border-color:#FF7A1A;color:#fff}',
      /* Currency widget */
      '.nav-currency{position:relative;display:flex;align-items:center;height:64px}',
      '.nav-currency-btn{display:flex;align-items:center;gap:.4rem;height:64px;padding:0 .8rem;font-size:.78rem;font-weight:500;color:rgba(255,255,255,.78);cursor:pointer;background:none;border:none;font-family:"Inter",sans-serif;transition:color .2s;white-space:nowrap}',
      '.nav-currency-btn:hover{color:#fff}',
      '.nav-currency-btn .cv-arrow{font-size:.55rem;opacity:.6;transition:transform .2s}',
      '.nav-currency.open .cv-arrow{transform:rotate(180deg)}',
      '.nav-currency.open .nav-currency-btn{color:#fff}',
      '.cv-dropdown{position:absolute;top:calc(100% + 1px);left:50%;transform:translateX(-50%) translateY(-6px);width:284px;background:#fff;box-shadow:0 16px 40px rgba(11,37,69,.18);border:1px solid #E3E8F0;border-radius:12px;z-index:500;opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;overflow:hidden}',
      '.nav-currency.open .cv-dropdown{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}',
      '.cv-drop-head{padding:.6rem 1rem;border-bottom:1px solid #E3E8F0;display:flex;justify-content:space-between;align-items:center}',
      '.cv-drop-title{font-size:.58rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#8A99B3}',
      '.cv-live{display:flex;align-items:center;gap:.35rem;font-size:.58rem;color:#1E9E62}',
      '.cv-live::before{content:"";width:5px;height:5px;border-radius:50%;background:#1E9E62;animation:cvpulse 2s infinite;flex-shrink:0}',
      '@keyframes cvpulse{0%,100%{opacity:1}50%{opacity:.3}}',
      '.cv-body{padding:.85rem 1rem}',
      '.cv-row{display:flex;gap:.4rem;margin-bottom:.4rem;align-items:center}',
      '.cv-inp-wrap{flex:1;display:flex;border:1px solid #D3DCEA;border-radius:6px;overflow:hidden;min-width:0}',
      '.cv-inp{flex:1;background:#fff;border:none;color:#16233A;font-family:"Inter",sans-serif;font-size:.92rem;padding:.55rem .7rem;outline:none;min-width:0}',
      '.cv-sel{background:rgba(30,95,204,.08);border:none;border-left:1px solid #D3DCEA;color:#1E5FCC;font-family:"Inter",sans-serif;font-size:.7rem;font-weight:600;padding:.3rem .4rem;cursor:pointer;outline:none;flex-shrink:0}',
      '.cv-sel option{background:#fff;color:#16233A}',
      '.cv-swap-btn{background:none;border:1px solid #D3DCEA;border-radius:6px;color:#5B6B85;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.95rem;transition:all .15s;flex-shrink:0}',
      '.cv-swap-btn:hover{color:#1E5FCC;border-color:rgba(30,95,204,.3)}',
      '.cv-result-box{background:rgba(30,95,204,.06);border:1px solid rgba(30,95,204,.18);border-radius:6px;padding:.55rem .85rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem}',
      '.cv-result-val{font-family:"Poppins",sans-serif;font-weight:700;font-size:1.4rem;color:#1E5FCC}',
      '.cv-to-sel{background:none;border:none;color:#1E5FCC;font-family:"Inter",sans-serif;font-size:.72rem;font-weight:700;cursor:pointer;outline:none;padding:0}',
      '.cv-to-sel option{background:#fff;color:#16233A}',
      '.cv-rate-txt{font-size:.61rem;color:#8A99B3;text-align:center;padding:.2rem 0;border-top:1px solid #E3E8F0}',
      '.cv-rate-txt span{color:#5B6B85}',
      '.cv-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin-top:.45rem}',
      '.cv-qb{background:#F7F9FC;border:1px solid #E3E8F0;border-radius:4px;color:#5B6B85;padding:.27rem .2rem;font-size:.61rem;font-weight:600;cursor:pointer;text-align:center;letter-spacing:.04em;transition:all .12s;font-family:"Inter",sans-serif}',
      '.cv-qb:hover,.cv-qb.on{border-color:rgba(30,95,204,.3);color:#1E5FCC;background:rgba(30,95,204,.05)}',
      /* Responsive */
      '@media(max-width:1180px){.nav-links a[data-nav="pro"],.nav-links a[data-nav="blog"]{display:none}}',
      '@media(max-width:768px){nav#mainNav{padding:0 1.25rem}.nav-links,.btn-nav-login{display:none!important}.burger{display:flex}.nav-right{gap:.4rem}.nav-lang-btn{height:34px;padding:0 .55rem;font-size:.74rem}.btn-post{padding:.5rem .8rem;font-size:.78rem}.btn-post .bp-full{display:none}.btn-post .bp-short{display:inline}}',
      '@media(max-width:400px){nav#mainNav{padding:0 .85rem}.logo{font-size:1.15rem}.nav-lang-btn span:not(.nav-lang-flag){display:none}.nav-lang-btn{padding:0 .5rem;gap:0}.nav-lang-btn .cv-arrow{display:none}.btn-post{padding:.5rem .65rem}}',
      '@supports(padding-bottom:env(safe-area-inset-bottom)){.mobile-menu{padding-bottom:calc(2rem + env(safe-area-inset-bottom))}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── HTML Navbar ───────────────────────────────────────── */
  function buildNavHTML(){
    var lang = currentLang();
    return [
      '<nav id="mainNav">',
        '<a href="index.html" class="logo">Aircraft2<span>Sell</span></a>',
        '<ul class="nav-links">',
          /* Acheter — méga-menu */
          '<li class="nav-mega" id="navMega">',
            '<a href="search.html" class="nav-mega-trigger" id="megaTrigger">',
              '<span>Acheter</span><span class="mega-arrow">▾</span>',
            '</a>',
            '<div class="nav-mega-panel">',
              '<a class="nav-mega-item" href="avions-legers.html"><span class="mi-icon">🛩</span>Avions légers</a>',
              '<a class="nav-mega-item" href="jets-affaires.html"><span class="mi-icon">✈️</span>Jets d\'affaires</a>',
              '<a class="nav-mega-item" href="turboprops.html"><span class="mi-icon">🌀</span>Turbopropulseurs</a>',
              '<a class="nav-mega-item" href="helicopteres.html"><span class="mi-icon">🚁</span>Hélicoptères</a>',
              '<a class="nav-mega-item" href="ulm.html"><span class="mi-icon">🪂</span>ULM</a>',
              '<a class="nav-mega-item" href="search.html?cat=airliner"><span class="mi-icon">🛫</span>Avions de ligne</a>',
              '<a class="nav-mega-all" href="search.html">Toutes les annonces <span>→</span></a>',
            '</div>',
          '</li>',
          '<li><a href="post-listing.html" data-nav="sell">Vendre</a></li>',
          '<li><a href="pro-dealers.html" data-nav="pro">Professionnels</a></li>',
          '<li><a href="guide-acheteur.html">Guide</a></li>',
          '<li><a href="blog.html" data-nav="blog">Blog</a></li>',
          '<li><a href="faq.html">FAQ</a></li>',
          '<li><a href="contact.html">Contact</a></li>',
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
                    '<div style="font-size:.57rem;color:#8A99B3;margin-top:.1rem">Taux indicatif BCE</div>',
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
        '</ul>',
        '<div class="nav-right">',
          /* Sélecteur de langue — badge visible en permanence, plus un lien noyé dans le menu */
          '<div class="nav-lang" id="navLang">',
            '<button class="nav-lang-btn" id="toggleLangBtn" aria-label="Choisir la langue">',
              '<span class="nav-lang-flag">' + LANG_FLAGS[lang] + '</span>',
              '<span>' + lang.toUpperCase() + '</span>',
              '<span class="cv-arrow">▾</span>',
            '</button>',
            '<div class="nav-lang-dropdown">',
              '<a href="/index.html" class="' + (lang==='fr'?'active':'') + '">🇫🇷 Français</a>',
              '<a href="/en/index.html" class="' + (lang==='en'?'active':'') + '">🇬🇧 English</a>',
              '<a href="/de/index.html" class="' + (lang==='de'?'active':'') + '">🇩🇪 Deutsch</a>',
              '<a href="/it/index.html" class="' + (lang==='it'?'active':'') + '">🇮🇹 Italiano</a>',
              '<a href="/es/index.html" class="' + (lang==='es'?'active':'') + '">🇪🇸 Español</a>',
            '</div>',
          '</div>',
          '<a href="login.html" class="btn-nav-login" id="btnLogin">Connexion</a>',
          '<a href="dashboard.html#favs" class="nav-favs" id="navFavs" title="Mes favoris" style="display:none">',
            '♥ <span id="navFavCount">0</span>',
          '</a>',
          '<div class="nav-user" id="navUser">',
            '<div class="nav-avatar" id="navAvatar">U</div>',
            '<span class="nav-user-name" id="navUserName">Mon compte</span>',
          '</div>',
          '<a href="post-listing.html" class="btn-post" id="btnPost"><span class="bp-full">Déposer une annonce</span><span class="bp-short">Vendre</span></a>',
          '<button class="burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>',
        '</div>',
      '</nav>',
      /* Mobile menu */
      '<div class="mobile-menu" id="mobileMenu">',
        '<div class="mm-section-label">Acheter</div>',
        '<a href="search.html">Toutes les annonces</a>',
        '<a class="mm-sub" href="avions-legers.html">Avions légers</a>',
        '<a class="mm-sub" href="jets-affaires.html">Jets d\'affaires</a>',
        '<a class="mm-sub" href="turboprops.html">Turbopropulseurs</a>',
        '<a class="mm-sub" href="helicopteres.html">Hélicoptères</a>',
        '<a class="mm-sub" href="ulm.html">ULM</a>',
        '<div class="mm-section-label">Vendre &amp; Professionnels</div>',
        '<a href="post-listing.html">Vendre mon avion</a>',
        '<a href="pro-dealers.html">Professionnels</a>',
        '<div class="mm-section-label">Ressources</div>',
        '<a href="guide-acheteur.html">Guide acheteur</a>',
        '<a href="blog.html">Blog</a>',
        '<a href="faq.html">FAQ</a>',
        '<a href="contact.html">Contact</a>',
        '<a href="login.html" class="mm-cta" id="mmCta">Se connecter</a>',
        '<div class="mm-langs">',
          '<a href="/index.html" class="mm-lang-btn ' + (lang==='fr'?'active':'') + '">FR</a>',
          '<a href="/en/index.html" class="mm-lang-btn">EN</a>',
          '<a href="/de/index.html" class="mm-lang-btn">DE</a>',
          '<a href="/it/index.html" class="mm-lang-btn">IT</a>',
          '<a href="/es/index.html" class="mm-lang-btn">ES</a>',
        '</div>',
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

  /* ── Méga-menu "Acheter" (hover desktop + clic tactile) ─── */
  function bindMegaMenu(){
    var mega = document.getElementById('navMega');
    var trigger = document.getElementById('megaTrigger');
    if(!mega || !trigger) return;
    trigger.addEventListener('click', function(e){
      /* Sur mobile la nav-links est masquée ; sur desktop, on empêche
         la navigation directe pour laisser le hover/clic ouvrir le menu
         si l'utilisateur clique précisément sur la flèche. Cliquer sur
         "Acheter" navigue normalement vers search.html. */
      if(e.target.classList.contains('mega-arrow')){
        e.preventDefault();
        mega.classList.toggle('open');
      }
    });
    mega.addEventListener('mouseenter', function(){ mega.classList.add('open'); });
    mega.addEventListener('mouseleave', function(){ mega.classList.remove('open'); });
    document.addEventListener('click', function(e){
      if(!mega.contains(e.target)) mega.classList.remove('open');
    });
  }

  /* ── Sélecteur de langue ────────────────────────────────── */
  function bindLangSwitcher(){
    var toggle = document.getElementById('toggleLangBtn');
    var wrap   = document.getElementById('navLang');
    if(!toggle || !wrap) return;
    toggle.addEventListener('click', function(e){
      e.stopPropagation();
      wrap.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if(!wrap.contains(e.target)) wrap.classList.remove('open');
    });
  }

  /* ── Convertisseur devises ─────────────────────────────── */
  function initCurrency(){
    var _rates = {EUR:1};
    var _busy  = false;
    var SYMS   = {EUR:'€',USD:'$',GBP:'£',CHF:'Fr',CAD:'CA$',AUD:'AU$',JPY:'¥',SEK:'kr',NOK:'kr',DKK:'kr',PLN:'zł',AED:'AED'};
    var FALLBACK = {USD:1.082,GBP:0.856,CHF:0.937,CAD:1.559,AUD:1.746,JPY:162.5,SEK:11.28,NOK:11.62,DKK:7.461,PLN:4.256,AED:3.972};

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
        /* Recharger les taux si pas encore chargés ou si taux de fallback */
        if(Object.keys(_rates).length <= 1) fetchRates();
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

    /* Fetch rates — APIs multiples avec fallback robuste */
    function fetchRates(){
      if(_busy) return;
      _busy = true;
      if(elLive) elLive.textContent = 'Chargement…';
      /* Liste d'APIs CORS-friendly dans l'ordre de fiabilité */
      var sources = [
        {
          url: 'https://open.er-api.com/v6/latest/EUR',
          parse: function(d){ return d.rates; }
        },
        {
          url: 'https://api.exchangerate-api.com/v4/latest/EUR',
          parse: function(d){ return d.rates; }
        },
        {
          url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json',
          parse: function(d){ 
            if(!d||!d.eur) return null;
            var r={};
            var map={usd:'USD',gbp:'GBP',chf:'CHF',cad:'CAD',aud:'AUD',jpy:'JPY',sek:'SEK',nok:'NOK',dkk:'DKK',pln:'PLN',aed:'AED'};
            Object.keys(map).forEach(function(k){ if(d.eur[k]) r[map[k]]=d.eur[k]; });
            return Object.keys(r).length ? r : null;
          }
        }
      ];
      var tried = 0;
      function tryNext(){
        if(tried >= sources.length){
          _busy = false;
          _rates = Object.assign({EUR:1}, FALLBACK);
          if(elLive) elLive.textContent = 'Taux indicatifs BCE';
          compute();
          return;
        }
        var src = sources[tried++];
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = controller ? setTimeout(function(){ controller.abort(); }, 5000) : null;
        var opts = controller ? { signal: controller.signal } : {};
        fetch(src.url, opts)
          .then(function(r){
            if(!r.ok) throw new Error('HTTP '+r.status);
            return r.json();
          })
          .then(function(d){
            clearTimeout(timer);
            var rates = src.parse(d);
            if(rates && typeof rates === 'object' && (rates.USD || rates.GBP)){
              _busy = false;
              _rates = Object.assign({EUR:1}, rates);
              var ts = new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
              if(elLive) elLive.textContent = 'En direct · ' + ts;
              compute();
            } else {
              tryNext();
            }
          })
          .catch(function(){ clearTimeout(timer); tryNext(); });
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
    /* Favoris */
    var navFavs = document.getElementById('navFavs');
    if(navFavs){
      navFavs.style.display='flex';
      var favs=[];try{favs=JSON.parse(localStorage.getItem('a2s_favs')||'[]');}catch(e){}
      var fc=document.getElementById('navFavCount');
      if(fc)fc.textContent=favs.length||'';
      navFavs.style.display=favs.length?'flex':'none';
    }
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
      window.location.href = 'index.html';
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
    bindMegaMenu();
    bindLangSwitcher();
    initCurrency();
    updateNav();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();


/* ══ CACHE SUPABASE CÔTÉ CLIENT ══════════════════════════════
   Cache sessionStorage 5 minutes pour les requêtes répétées
   ──────────────────────────────────────────────────────────── */
window.A2SCache = {
  _store: {},
  get: function(key) {
    var item = this._store[key];
    if(!item) return null;
    if(Date.now() - item.ts > 5 * 60 * 1000) { delete this._store[key]; return null; }
    return item.data;
  },
  set: function(key, data) { this._store[key] = { data: data, ts: Date.now() }; return data; },
  clear: function() { this._store = {}; }
};

/* sbGetCached — version cachée de fetch Supabase */
window.sbGetCached = async function(table, params) {
  var key = table + '?' + params;
  var cached = window.A2SCache.get(key);
  if(cached) return cached;
  var SB_URL = 'https://hlivysnlzlqdjcigqgvk.supabase.co';
  var SB_KEY = 'sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';
  try {
    var r = await fetch(SB_URL+'/rest/v1/'+table+'?'+params, { headers: { apikey: SB_KEY, Authorization: 'Bearer '+SB_KEY } });
    var data = r.ok ? await r.json() : [];
    return window.A2SCache.set(key, data);
  } catch(e) { return []; }
};
