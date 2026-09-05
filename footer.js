/* ============================================================
   footer.js — Aircraft2Sell
   Footer universel auto-injecté (design system --a2s-*)
   Usage : <div id="a2sFooter"></div><script src="footer.js"></script>
   Si aucun élément #a2sFooter n'existe, le footer est injecté
   juste avant le premier <script> du body (ou en fin de body).
   ============================================================ */
(function(){

  function currentLang(){
    var m = location.pathname.match(/^\/(en|de|it|es)\//);
    return m ? m[1] : 'fr';
  }

  function injectCSS(){
    if(document.getElementById('a2s-footer-css')) return;
    var s = document.createElement('style');
    s.id = 'a2s-footer-css';
    s.textContent = [
      'footer.a2s-footer{background:#0B2545;color:rgba(255,255,255,.85);padding:3.5rem 2rem 1.5rem}',
      '.a2s-footer .footer-inner{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr 1fr;gap:2.5rem;margin-bottom:2.5rem}',
      '.a2s-footer .f-logo{font-family:"Poppins",sans-serif;font-weight:700;font-size:1.35rem;margin-bottom:.85rem;color:#fff}',
      '.a2s-footer .f-logo span{color:#FF7A1A}',
      '.a2s-footer .f-desc{font-size:.8rem;color:rgba(255,255,255,.6);line-height:1.75;max-width:280px;margin-bottom:1.1rem}',
      '.a2s-footer .f-trust{display:flex;flex-direction:column;gap:.45rem}',
      '.a2s-footer .f-trust span{font-size:.72rem;color:rgba(255,255,255,.55);display:flex;align-items:center;gap:.4rem}',
      '.a2s-footer .f-col-title{font-size:.66rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:1.1rem}',
      '.a2s-footer .f-links{list-style:none;display:flex;flex-direction:column;gap:.65rem}',
      '.a2s-footer .f-links a{font-size:.82rem;color:rgba(255,255,255,.72);text-decoration:none;transition:color .2s}',
      '.a2s-footer .f-links a:hover{color:#FF7A1A}',
      '.a2s-footer .footer-bottom{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding-top:1.75rem;border-top:1px solid rgba(255,255,255,.1);gap:1rem;flex-wrap:wrap}',
      '.a2s-footer .f-copy{font-size:.74rem;color:rgba(255,255,255,.45)}',
      '.a2s-footer .f-legal-links{display:flex;gap:1.1rem;flex-wrap:wrap}',
      '.a2s-footer .f-legal-links a{font-size:.74rem;color:rgba(255,255,255,.5);text-decoration:none;transition:color .2s}',
      '.a2s-footer .f-legal-links a:hover{color:#fff}',
      '.a2s-footer .f-langs{display:flex;gap:.3rem}',
      '.a2s-footer .f-lang-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.65);font-family:"Inter",sans-serif;font-size:.66rem;font-weight:600;padding:.28rem .6rem;cursor:pointer;letter-spacing:.06em;transition:all .15s;border-radius:5px;text-decoration:none}',
      '.a2s-footer .f-lang-btn:hover{color:#fff;border-color:rgba(255,255,255,.3)}',
      '.a2s-footer .f-lang-btn.active{background:#FF7A1A;color:#fff;border-color:#FF7A1A}',
      '@media(max-width:1024px){.a2s-footer .footer-inner{grid-template-columns:1fr 1fr 1fr;gap:2rem}}',
      '@media(max-width:768px){.a2s-footer{padding:2.5rem 1.25rem 1.5rem}.a2s-footer .footer-inner{grid-template-columns:1fr 1fr;gap:1.75rem}.a2s-footer .footer-bottom{flex-direction:column;align-items:flex-start}}',
      '@media(max-width:480px){.a2s-footer .footer-inner{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(s);
  }

  function buildFooterHTML(){
    var lang = currentLang();
    return [
      '<footer class="a2s-footer">',
        '<div class="footer-inner">',
          '<div>',
            '<div class="f-logo">Aircraft2<span>Sell</span></div>',
            '<p class="f-desc">Le leader européen de la vente d\'aéronefs entre particuliers et professionnels. Zéro commission, vendeurs vérifiés, 30+ pays couverts.</p>',
            '<div class="f-trust">',
              '<span>⚡ Zéro commission sur vos ventes</span>',
              '<span>✓ Vendeurs vérifiés manuellement</span>',
              '<span>🌍 30+ pays européens</span>',
            '</div>',
          '</div>',
          '<div>',
            '<div class="f-col-title">Acheter</div>',
            '<ul class="f-links">',
              '<li><a href="search.html">Toutes les annonces</a></li>',
              '<li><a href="avions-legers.html">Avions légers</a></li>',
              '<li><a href="jets-affaires.html">Jets d\'affaires</a></li>',
              '<li><a href="turboprops.html">Turbopropulseurs</a></li>',
              '<li><a href="helicopteres.html">Hélicoptères</a></li>',
              '<li><a href="ulm.html">ULM</a></li>',
              '<li><a href="comparateur.html">Comparateur</a></li>',
            '</ul>',
          '</div>',
          '<div>',
            '<div class="f-col-title">Vendre</div>',
            '<ul class="f-links">',
              '<li><a href="post-listing.html">Déposer une annonce</a></li>',
              '<li><a href="pro-dealers.html">Professionnels &amp; dealers</a></li>',
              '<li><a href="pricing.html">Tarifs</a></li>',
              '<li><a href="estimation.html">Estimer mon avion</a></li>',
              '<li><a href="alerts.html">Créer une alerte</a></li>',
              '<li><a href="dashboard.html">Tableau de bord</a></li>',
            '</ul>',
          '</div>',
          '<div>',
            '<div class="f-col-title">Ressources</div>',
            '<ul class="f-links">',
              '<li><a href="guide-acheteur.html">Guide acheteur</a></li>',
              '<li><a href="blog.html">Blog &amp; conseils</a></li>',
              '<li><a href="faq.html">FAQ</a></li>',
              '<li><a href="inspection-pre-achat-avion.html">Inspection pré-achat</a></li>',
              '<li><a href="comment-financer-avion-leger.html">Financer son avion</a></li>',
            '</ul>',
          '</div>',
          '<div>',
            '<div class="f-col-title">Entreprise</div>',
            '<ul class="f-links">',
              '<li><a href="contact.html">Contact</a></li>',
              '<li><a href="legal.html">Mentions légales</a></li>',
              '<li><a href="legal.html#privacy">Confidentialité</a></li>',
              '<li><a href="sitemap.html">Plan du site</a></li>',
            '</ul>',
          '</div>',
        '</div>',
        '<div class="footer-bottom">',
          '<div class="f-copy">© ' + new Date().getFullYear() + ' Aircraft2Sell — Tous droits réservés</div>',
          '<div class="f-legal-links">',
            '<a href="legal.html">Mentions légales</a>',
            '<a href="legal.html#cgv">CGV</a>',
            '<a href="legal.html#privacy">Confidentialité</a>',
            '<a href="legal.html#cookies">Cookies</a>',
          '</div>',
          '<div class="f-langs">',
            '<a href="/index.html" class="f-lang-btn ' + (lang==='fr'?'active':'') + '">FR</a>',
            '<a href="/en/index.html" class="f-lang-btn">EN</a>',
            '<a href="/de/index.html" class="f-lang-btn">DE</a>',
            '<a href="/it/index.html" class="f-lang-btn">IT</a>',
            '<a href="/es/index.html" class="f-lang-btn">ES</a>',
          '</div>',
        '</div>',
      '</footer>'
    ].join('');
  }

  function injectFooter(){
    if(document.querySelector('footer.a2s-footer')) return;
    var mount = document.getElementById('a2sFooter');
    var html = buildFooterHTML();
    if(mount){
      mount.outerHTML = html;
      return;
    }
    /* Pas d'ancre dédiée : insérer juste avant le premier <script> du body,
       sinon en toute fin de body. */
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    var node = wrapper.firstChild;
    var firstScript = document.body.querySelector('script');
    if(firstScript){
      document.body.insertBefore(node, firstScript);
    } else {
      document.body.appendChild(node);
    }
  }

  function boot(){
    injectCSS();
    injectFooter();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
