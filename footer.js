/* ============================================================
   footer.js — Aircraft2Sell · Footer v2
   Footer universel auto-injecté (style dans styles.css §16).
   Usage : <div id="a2sFooter"></div><script src="footer.js"></script>
   Sans ancre, injecté avant le premier <script> du body.
   ============================================================ */
(function(){

  function currentLang(){ var m = location.pathname.match(/^\/(en|et)\//); return m ? m[1] : 'fr'; }
  var TRANSLATED_PAGES = ['index.html','search.html','listing.html','post-listing.html',
    'avions-legers.html','jets-affaires.html','helicopteres.html','turboprops.html','ulm.html','avions-de-ligne.html'];
  function isTranslatedPage(page){ return TRANSLATED_PAGES.indexOf(page.split(/[?#]/)[0]) > -1; }
  function href(page){ var lang = currentLang(); if(lang === 'fr') return '/' + page; return isTranslatedPage(page) ? '/' + lang + '/' + page : '/' + page; }
  function currentPageBase(){ var m = location.pathname.match(/^\/(?:en|et)\/(.*)$/); var rel = m ? m[1] : location.pathname.replace(/^\//, ''); return rel || 'index.html'; }
  function langSwitchHref(targetLang){ var base = currentPageBase().split(/[?#]/)[0] || 'index.html'; var target = isTranslatedPage(base) ? base : 'index.html'; return targetLang === 'fr' ? '/' + target : '/' + targetLang + '/' + target; }
  function ic(name, cls){ return window.A2SIcon ? window.A2SIcon(name, cls) : ''; }

  var I18N = {
    fr: { desc:'La marketplace aéronautique européenne. Achetez et vendez un aéronef entre particuliers et professionnels, sans commission.',
      trust1:'Zéro commission sur vos ventes', trust2:'Vendeurs vérifiés manuellement', trust3:'30+ pays européens',
      colBuy:'Acheter', allListings:'Toutes les annonces', catLight:'Avions légers', catJet:'Jets d\'affaires', catTurbo:'Turbopropulseurs', catHeli:'Hélicoptères', catUlm:'ULM', comparator:'Comparateur',
      colSell:'Vendre', postListing:'Déposer une annonce', proDealers:'Professionnels & dealers', pricing:'Tarifs', estimate:'Estimer mon aéronef', createAlert:'Créer une alerte', dashboard:'Tableau de bord',
      colResources:'Ressources', buyerGuide:'Guide de l\'acheteur', blog:'Blog & conseils', faq:'FAQ', inspection:'Inspection pré-achat', financing:'Financer son avion',
      colCompany:'Entreprise', contact:'Contact', legal:'Mentions légales', privacy:'Confidentialité', sitemap:'Plan du site', copy:'Tous droits réservés', cgv:'CGV', cookies:'Cookies' },
    en: { desc:'The European aircraft marketplace. Buy and sell aircraft between private owners and professionals, with zero commission.',
      trust1:'Zero commission on your sales', trust2:'Manually verified sellers', trust3:'30+ European countries',
      colBuy:'Buy', allListings:'All listings', catLight:'Light aircraft', catJet:'Business jets', catTurbo:'Turboprops', catHeli:'Helicopters', catUlm:'Light sport / ULM', comparator:'Comparator',
      colSell:'Sell', postListing:'List your aircraft', proDealers:'Dealers & professionals', pricing:'Pricing', estimate:'Value my aircraft', createAlert:'Create an alert', dashboard:'Dashboard',
      colResources:'Resources', buyerGuide:'Buyer\'s guide', blog:'Blog & advice', faq:'FAQ', inspection:'Pre-purchase inspection', financing:'Finance your aircraft',
      colCompany:'Company', contact:'Contact', legal:'Legal notice', privacy:'Privacy', sitemap:'Sitemap', copy:'All rights reserved', cgv:'Terms', cookies:'Cookies' },
    de: { desc:'Der europäische Marktplatz für Luftfahrzeuge. Kaufen und verkaufen Sie zwischen Privatpersonen und Profis – ohne Provision.',
      trust1:'Keine Provision auf Ihre Verkäufe', trust2:'Manuell verifizierte Verkäufer', trust3:'30+ europäische Länder',
      colBuy:'Kaufen', allListings:'Alle Anzeigen', catLight:'Leichtflugzeuge', catJet:'Geschäftsjets', catTurbo:'Turboprops', catHeli:'Hubschrauber', catUlm:'Ultraleicht (UL)', comparator:'Vergleich',
      colSell:'Verkaufen', postListing:'Flugzeug inserieren', proDealers:'Händler & Profis', pricing:'Preise', estimate:'Flugzeug bewerten', createAlert:'Suchauftrag erstellen', dashboard:'Dashboard',
      colResources:'Ressourcen', buyerGuide:'Käuferratgeber', blog:'Blog & Tipps', faq:'FAQ', inspection:'Vorkaufinspektion', financing:'Flugzeug finanzieren',
      colCompany:'Unternehmen', contact:'Kontakt', legal:'Impressum', privacy:'Datenschutz', sitemap:'Sitemap', copy:'Alle Rechte vorbehalten', cgv:'AGB', cookies:'Cookies' },
    it: { desc:'Il marketplace aeronautico europeo. Compra e vendi aeromobili tra privati e professionisti, senza commissioni.',
      trust1:'Zero commissioni sulle vendite', trust2:'Venditori verificati manualmente', trust3:'30+ paesi europei',
      colBuy:'Acquista', allListings:'Tutti gli annunci', catLight:'Aerei leggeri', catJet:'Jet privati', catTurbo:'Turboelica', catHeli:'Elicotteri', catUlm:'Ultraleggeri', comparator:'Comparatore',
      colSell:'Vendi', postListing:'Pubblica un annuncio', proDealers:'Rivenditori & professionisti', pricing:'Prezzi', estimate:'Valuta il mio aereo', createAlert:'Crea un avviso', dashboard:'Pannello',
      colResources:'Risorse', buyerGuide:'Guida per l\'acquirente', blog:'Blog & consigli', faq:'FAQ', inspection:'Ispezione pre-acquisto', financing:'Finanzia il tuo aereo',
      colCompany:'Azienda', contact:'Contatto', legal:'Note legali', privacy:'Privacy', sitemap:'Mappa del sito', copy:'Tutti i diritti riservati', cgv:'Termini', cookies:'Cookie' },
    es: { desc:'El marketplace aeronáutico europeo. Compra y vende aeronaves entre particulares y profesionales, sin comisión.',
      trust1:'Cero comisión en tus ventas', trust2:'Vendedores verificados manualmente', trust3:'30+ países europeos',
      colBuy:'Comprar', allListings:'Todos los anuncios', catLight:'Aviones ligeros', catJet:'Jets privados', catTurbo:'Turbohélices', catHeli:'Helicópteros', catUlm:'Ultraligeros', comparator:'Comparador',
      colSell:'Vender', postListing:'Publicar un anuncio', proDealers:'Distribuidores & profesionales', pricing:'Precios', estimate:'Valorar mi avión', createAlert:'Crear una alerta', dashboard:'Panel',
      colResources:'Recursos', buyerGuide:'Guía del comprador', blog:'Blog & consejos', faq:'FAQ', inspection:'Inspección previa a la compra', financing:'Financiar tu avión',
      colCompany:'Empresa', contact:'Contacto', legal:'Aviso legal', privacy:'Privacidad', sitemap:'Mapa del sitio', copy:'Todos los derechos reservados', cgv:'Términos', cookies:'Cookies' },
    et: { desc:'Euroopa lennukiturg. Osta ja müü õhusõidukeid eraomanike ja professionaalide vahel, vahendustasuta.',
      trust1:'Vahendustasuta müük', trust2:'Käsitsi kontrollitud müüjad', trust3:'30+ Euroopa riiki',
      colBuy:'Osta', allListings:'Kõik kuulutused', catLight:'Kerglennukid', catJet:'Ärijet\'id', catTurbo:'Turbopropellerid', catHeli:'Helikopterid', catUlm:'Mikrolennukid / ULM', comparator:'Võrdleja',
      colSell:'Müü', postListing:'Paku oma õhusõiduk', proDealers:'Edasimüüjad ja professionaalid', pricing:'Hinnad', estimate:'Hinda oma õhusõidukit', createAlert:'Loo teavitus', dashboard:'Töölaud',
      colResources:'Ressursid', buyerGuide:'Ostja juhend', blog:'Blogi ja nõuanded', faq:'KKK', inspection:'Ostueelne ülevaatus', financing:'Rahasta oma lennukit',
      colCompany:'Ettevõte', contact:'Kontakt', legal:'Õiguslik teave', privacy:'Privaatsus', sitemap:'Saidi kaart', copy:'Kõik õigused kaitstud', cgv:'Tingimused', cookies:'Küpsised' }
  };
  function t(key){ var lang = currentLang(); return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key; }

  function injectCSS(){
    if(document.getElementById('a2s-footer-css')) return;
    var s = document.createElement('style'); s.id = 'a2s-footer-css';
    s.textContent = 'footer.a2s-footer{background:#0B2545;color:rgba(255,255,255,.82)}';
    document.head.appendChild(s);
  }

  function buildFooterHTML(){
    var lang = currentLang();
    function col(title, items){
      return '<div><div class="f-col-title">' + title + '</div><ul class="f-links">' + items.map(function(i){ return '<li><a href="' + i[0] + '">' + i[1] + '</a></li>'; }).join('') + '</ul></div>';
    }
    return [
      '<footer class="a2s-footer">',
        '<div class="footer-inner">',
          '<div>',
            '<a href="' + href('index.html') + '" class="f-logo"><img src="' + href('logo-white.png') + '?v=20260908" alt="Aircraft2Sell" class="f-logo-img" width="170" height="32" loading="lazy"></a>',
            '<p class="f-desc">' + t('desc') + '</p>',
            '<div class="f-trust">',
              '<span>' + ic('percent') + t('trust1') + '</span>',
              '<span>' + ic('shield-check') + t('trust2') + '</span>',
              '<span>' + ic('globe') + t('trust3') + '</span>',
            '</div>',
          '</div>',
          col(t('colBuy'), [
            [href('search.html'), t('allListings')], [href('avions-legers.html'), t('catLight')], [href('jets-affaires.html'), t('catJet')],
            [href('turboprops.html'), t('catTurbo')], [href('helicopteres.html'), t('catHeli')], [href('ulm.html'), t('catUlm')], [href('comparateur.html'), t('comparator')]
          ]),
          col(t('colSell'), [
            [href('post-listing.html'), t('postListing')], [href('pro-dealers.html'), t('proDealers')], [href('pricing.html'), t('pricing')],
            [href('estimation.html'), t('estimate')], [href('alerts.html'), t('createAlert')], [href('dashboard.html'), t('dashboard')]
          ]),
          col(t('colResources'), [
            [href('guide-acheteur.html'), t('buyerGuide')], [href('blog.html'), t('blog')], [href('faq.html'), t('faq')],
            [href('inspection-pre-achat-avion.html'), t('inspection')], [href('comment-financer-avion-leger.html'), t('financing')]
          ]),
          col(t('colCompany'), [
            [href('contact.html'), t('contact')], [href('legal.html'), t('legal')], [href('legal.html') + '#privacy', t('privacy')], [href('sitemap.html'), t('sitemap')]
          ]),
        '</div>',
        '<div class="footer-bottom">',
          '<div class="f-copy">© ' + new Date().getFullYear() + ' Aircraft2Sell — ' + t('copy') + '</div>',
          '<div class="f-legal-links">',
            '<a href="' + href('legal.html') + '">' + t('legal') + '</a>',
            '<a href="' + href('legal.html') + '#cgv">' + t('cgv') + '</a>',
            '<a href="' + href('legal.html') + '#privacy">' + t('privacy') + '</a>',
            '<a href="' + href('legal.html') + '#cookies">' + t('cookies') + '</a>',
          '</div>',
          '<div class="f-langs">' + ['fr','en','de','it','es'].map(function(l){ return '<a href="' + langSwitchHref(l) + '" hreflang="' + l + '" class="f-lang-btn ' + (lang === l ? 'active' : '') + '">' + l.toUpperCase() + '</a>'; }).join('') + '</div>',
        '</div>',
      '</footer>'
    ].join('');
  }

  function injectFooter(){
    if(document.querySelector('footer.a2s-footer')) return;
    var mount = document.getElementById('a2sFooter');
    var html = buildFooterHTML();
    if(mount){ mount.outerHTML = html; return; }
    var wrapper = document.createElement('div'); wrapper.innerHTML = html;
    var node = wrapper.firstChild;
    var firstScript = document.body.querySelector('script');
    if(firstScript) document.body.insertBefore(node, firstScript); else document.body.appendChild(node);
  }

  function boot(){
    injectCSS();
    loadChat();
    if(window.A2SIcon){ injectFooter(); return; }
    var s = document.createElement('script'); s.src = '/icons.js?v=20260906c';
    s.onload = injectFooter; s.onerror = injectFooter;
    document.head.appendChild(s);
  }

  /* Assistant du site — répond aux questions à partir de la FAQ publiée.
     Chargé en différé par assistant.js (aucun serveur, aucune clé API).
     Monté ici pour être présent sur toutes les pages publiques sans les
     éditer une par une. */
  function loadChat(){
    if(document.querySelector('script[data-a2s-chat]')) return;
    var s = document.createElement('script');
    s.src = '/assistant.js?v=20260907';
    s.async = true;
    s.setAttribute('data-a2s-chat', '1');
    document.head.appendChild(s);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
