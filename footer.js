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

  /* Pages existant sous /en/ /de/ /it/ /es/ — les autres retombent sur le FR racine. */
  var TRANSLATED_PAGES = ['index.html','search.html','listing.html','post-listing.html',
    'avions-legers.html','jets-affaires.html','helicopteres.html','turboprops.html',
    'ulm.html','avions-de-ligne.html'];
  function isTranslatedPage(page){
    return TRANSLATED_PAGES.indexOf(page.split(/[?#]/)[0]) > -1;
  }
  function href(page){
    if(currentLang() === 'fr') return page;
    return isTranslatedPage(page) ? page : '/' + page;
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
    fr: {
      desc:'Le leader européen de la vente d\'aéronefs entre particuliers et professionnels. Zéro commission, vendeurs vérifiés, 30+ pays couverts.',
      trust1:'⚡ Zéro commission sur vos ventes', trust2:'✓ Vendeurs vérifiés manuellement', trust3:'🌍 30+ pays européens',
      colBuy:'Acheter', allListings:'Toutes les annonces', catLight:'Avions légers', catJet:'Jets d\'affaires',
      catTurbo:'Turbopropulseurs', catHeli:'Hélicoptères', catUlm:'ULM', comparator:'Comparateur',
      colSell:'Vendre', postListing:'Déposer une annonce', proDealers:'Professionnels &amp; dealers',
      pricing:'Tarifs', estimate:'Estimer mon avion', createAlert:'Créer une alerte', dashboard:'Tableau de bord',
      colResources:'Ressources', buyerGuide:'Guide acheteur', blog:'Blog &amp; conseils', faq:'FAQ',
      inspection:'Inspection pré-achat', financing:'Financer son avion',
      colCompany:'Entreprise', contact:'Contact', legal:'Mentions légales', privacy:'Confidentialité',
      sitemap:'Plan du site', copy:'Tous droits réservés', cgv:'CGV', cookies:'Cookies'
    },
    en: {
      desc:'Europe\'s leading marketplace for buying and selling aircraft between private owners and professionals. Zero commission, verified sellers, 30+ countries covered.',
      trust1:'⚡ Zero commission on your sales', trust2:'✓ Manually verified sellers', trust3:'🌍 30+ European countries',
      colBuy:'Buy', allListings:'All listings', catLight:'Light aircraft', catJet:'Business jets',
      catTurbo:'Turboprops', catHeli:'Helicopters', catUlm:'Light sport / ULM', comparator:'Comparator',
      colSell:'Sell', postListing:'List your aircraft', proDealers:'Dealers &amp; professionals',
      pricing:'Pricing', estimate:'Estimate my aircraft', createAlert:'Create an alert', dashboard:'Dashboard',
      colResources:'Resources', buyerGuide:'Buyer\'s guide', blog:'Blog &amp; advice', faq:'FAQ',
      inspection:'Pre-purchase inspection', financing:'Finance your aircraft',
      colCompany:'Company', contact:'Contact', legal:'Legal notice', privacy:'Privacy',
      sitemap:'Sitemap', copy:'All rights reserved', cgv:'Terms', cookies:'Cookies'
    },
    de: {
      desc:'Europas führender Marktplatz für den Kauf und Verkauf von Luftfahrzeugen zwischen Privatpersonen und Profis. Keine Provision, verifizierte Verkäufer, 30+ Länder.',
      trust1:'⚡ Keine Provision auf Ihre Verkäufe', trust2:'✓ Manuell verifizierte Verkäufer', trust3:'🌍 30+ europäische Länder',
      colBuy:'Kaufen', allListings:'Alle Anzeigen', catLight:'Leichtflugzeuge', catJet:'Geschäftsjets',
      catTurbo:'Turboprops', catHeli:'Hubschrauber', catUlm:'Ultraleicht (ULM)', comparator:'Vergleich',
      colSell:'Verkaufen', postListing:'Flugzeug inserieren', proDealers:'Händler &amp; Profis',
      pricing:'Preise', estimate:'Mein Flugzeug schätzen', createAlert:'Suchauftrag erstellen', dashboard:'Dashboard',
      colResources:'Ressourcen', buyerGuide:'Käuferratgeber', blog:'Blog &amp; Tipps', faq:'FAQ',
      inspection:'Vorkaufinspektion', financing:'Flugzeug finanzieren',
      colCompany:'Unternehmen', contact:'Kontakt', legal:'Impressum', privacy:'Datenschutz',
      sitemap:'Sitemap', copy:'Alle Rechte vorbehalten', cgv:'AGB', cookies:'Cookies'
    },
    it: {
      desc:'Il principale marketplace europeo per l\'acquisto e la vendita di aeromobili tra privati e professionisti. Zero commissioni, venditori verificati, 30+ paesi coperti.',
      trust1:'⚡ Zero commissioni sulle vendite', trust2:'✓ Venditori verificati manualmente', trust3:'🌍 30+ paesi europei',
      colBuy:'Acquista', allListings:'Tutti gli annunci', catLight:'Aerei leggeri', catJet:'Jet privati',
      catTurbo:'Turboelica', catHeli:'Elicotteri', catUlm:'Ultraleggeri (ULM)', comparator:'Comparatore',
      colSell:'Vendi', postListing:'Pubblica un annuncio', proDealers:'Rivenditori &amp; professionisti',
      pricing:'Prezzi', estimate:'Stima il mio aereo', createAlert:'Crea un avviso', dashboard:'Pannello',
      colResources:'Risorse', buyerGuide:'Guida per l\'acquirente', blog:'Blog &amp; consigli', faq:'FAQ',
      inspection:'Ispezione pre-acquisto', financing:'Finanzia il tuo aereo',
      colCompany:'Azienda', contact:'Contatto', legal:'Note legali', privacy:'Privacy',
      sitemap:'Mappa del sito', copy:'Tutti i diritti riservati', cgv:'Termini', cookies:'Cookie'
    },
    es: {
      desc:'El marketplace europeo líder para comprar y vender aeronaves entre particulares y profesionales. Cero comisión, vendedores verificados, 30+ países.',
      trust1:'⚡ Cero comisión en tus ventas', trust2:'✓ Vendedores verificados manualmente', trust3:'🌍 30+ países europeos',
      colBuy:'Comprar', allListings:'Todos los anuncios', catLight:'Aviones ligeros', catJet:'Jets privados',
      catTurbo:'Turbohélices', catHeli:'Helicópteros', catUlm:'Ultraligeros (ULM)', comparator:'Comparador',
      colSell:'Vender', postListing:'Publicar un anuncio', proDealers:'Distribuidores &amp; profesionales',
      pricing:'Precios', estimate:'Estimar mi avión', createAlert:'Crear una alerta', dashboard:'Panel',
      colResources:'Recursos', buyerGuide:'Guía del comprador', blog:'Blog &amp; consejos', faq:'FAQ',
      inspection:'Inspección previa a la compra', financing:'Financiar tu avión',
      colCompany:'Empresa', contact:'Contacto', legal:'Aviso legal', privacy:'Privacidad',
      sitemap:'Mapa del sitio', copy:'Todos los derechos reservados', cgv:'Términos', cookies:'Cookies'
    }
  };
  function t(key){
    var lang = currentLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
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
            '<p class="f-desc">' + t('desc') + '</p>',
            '<div class="f-trust">',
              '<span>' + t('trust1') + '</span>',
              '<span>' + t('trust2') + '</span>',
              '<span>' + t('trust3') + '</span>',
            '</div>',
          '</div>',
          '<div>',
            '<div class="f-col-title">' + t('colBuy') + '</div>',
            '<ul class="f-links">',
              '<li><a href="' + href('search.html') + '">' + t('allListings') + '</a></li>',
              '<li><a href="' + href('avions-legers.html') + '">' + t('catLight') + '</a></li>',
              '<li><a href="' + href('jets-affaires.html') + '">' + t('catJet') + '</a></li>',
              '<li><a href="' + href('turboprops.html') + '">' + t('catTurbo') + '</a></li>',
              '<li><a href="' + href('helicopteres.html') + '">' + t('catHeli') + '</a></li>',
              '<li><a href="' + href('ulm.html') + '">' + t('catUlm') + '</a></li>',
              '<li><a href="' + href('comparateur.html') + '">' + t('comparator') + '</a></li>',
            '</ul>',
          '</div>',
          '<div>',
            '<div class="f-col-title">' + t('colSell') + '</div>',
            '<ul class="f-links">',
              '<li><a href="' + href('post-listing.html') + '">' + t('postListing') + '</a></li>',
              '<li><a href="' + href('pro-dealers.html') + '">' + t('proDealers') + '</a></li>',
              '<li><a href="' + href('pricing.html') + '">' + t('pricing') + '</a></li>',
              '<li><a href="' + href('estimation.html') + '">' + t('estimate') + '</a></li>',
              '<li><a href="' + href('alerts.html') + '">' + t('createAlert') + '</a></li>',
              '<li><a href="' + href('dashboard.html') + '">' + t('dashboard') + '</a></li>',
            '</ul>',
          '</div>',
          '<div>',
            '<div class="f-col-title">' + t('colResources') + '</div>',
            '<ul class="f-links">',
              '<li><a href="' + href('guide-acheteur.html') + '">' + t('buyerGuide') + '</a></li>',
              '<li><a href="' + href('blog.html') + '">' + t('blog') + '</a></li>',
              '<li><a href="' + href('faq.html') + '">' + t('faq') + '</a></li>',
              '<li><a href="' + href('inspection-pre-achat-avion.html') + '">' + t('inspection') + '</a></li>',
              '<li><a href="' + href('comment-financer-avion-leger.html') + '">' + t('financing') + '</a></li>',
            '</ul>',
          '</div>',
          '<div>',
            '<div class="f-col-title">' + t('colCompany') + '</div>',
            '<ul class="f-links">',
              '<li><a href="' + href('contact.html') + '">' + t('contact') + '</a></li>',
              '<li><a href="' + href('legal.html') + '">' + t('legal') + '</a></li>',
              '<li><a href="' + href('legal.html') + '#privacy">' + t('privacy') + '</a></li>',
              '<li><a href="' + href('sitemap.html') + '">' + t('sitemap') + '</a></li>',
            '</ul>',
          '</div>',
        '</div>',
        '<div class="footer-bottom">',
          '<div class="f-copy">© ' + new Date().getFullYear() + ' Aircraft2Sell — ' + t('copy') + '</div>',
          '<div class="f-legal-links">',
            '<a href="' + href('legal.html') + '">' + t('legal') + '</a>',
            '<a href="' + href('legal.html') + '#cgv">' + t('cgv') + '</a>',
            '<a href="' + href('legal.html') + '#privacy">' + t('privacy') + '</a>',
            '<a href="' + href('legal.html') + '#cookies">' + t('cookies') + '</a>',
          '</div>',
          '<div class="f-langs">',
            '<a href="' + langSwitchHref('fr') + '" class="f-lang-btn ' + (lang==='fr'?'active':'') + '">FR</a>',
            '<a href="' + langSwitchHref('en') + '" class="f-lang-btn ' + (lang==='en'?'active':'') + '">EN</a>',
            '<a href="' + langSwitchHref('de') + '" class="f-lang-btn ' + (lang==='de'?'active':'') + '">DE</a>',
            '<a href="' + langSwitchHref('it') + '" class="f-lang-btn ' + (lang==='it'?'active':'') + '">IT</a>',
            '<a href="' + langSwitchHref('es') + '" class="f-lang-btn ' + (lang==='es'?'active':'') + '">ES</a>',
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
