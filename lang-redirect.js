/* ==========================================================================
   Aircraft2Sell — Redirection automatique par langue navigateur
   --------------------------------------------------------------------------
   Sur une page FR (racine, sans /en/ ni /et/), si le navigateur du visiteur
   est configuré en anglais ET qu'une version EN de cette page existe, on
   redirige une seule fois vers /en/<page>. Le choix est mémorisé (localStorage)
   pour ne plus jamais re-rediriger ensuite, y compris si le visiteur revient
   volontairement en FR via le sélecteur de langue du footer.

   Ne s'exécute PAS :
   - sur les pages déjà sous /en/ ou /et/ (pas de boucle)
   - si un choix de langue a déjà été fait une fois (a2s_lang_choice_made)
   - si la page n'a pas d'équivalent EN (TRANSLATED_PAGES)
   - pour les crawlers (voir isLikelyBot ci-dessous)

   CORRECTIF 2026-09-21 : contrairement à l'hypothèse initiale, Googlebot rend
   la page avec Chrome headless (navigator.language = "en-US" par défaut) et
   EXÉCUTE ce script — confirmé via Search Console URL Inspection sur la page
   d'accueil (userCanonical basculait sur /en/index.html malgré une visite de
   l'URL FR). Impact : le "signal utilisateur" observé par Google pour la
   page racine pouvait dériver vers la version anglaise. Un filtrage sur
   navigator.webdriver + une liste d'UA de crawlers connus élimine ce risque
   sans changer le comportement pour un vrai visiteur humain.
   ========================================================================== */
(function () {
  'use strict';

  /* Détection best-effort des crawlers : navigator.webdriver est vrai pour
     Chrome headless (Googlebot, Bingbot, Puppeteer/Playwright...) ; on
     couvre aussi les UA de crawlers connus au cas où webdriver ne serait pas
     exposé. Un faux négatif reste sans danger (au pire, ancien comportement) ;
     un faux positif ne fait que priver un humain de la redirection auto,
     jamais casser la navigation (le sélecteur de langue manuel reste dispo). */
  function isLikelyBot() {
    try {
      if (navigator.webdriver) return true;
      var ua = (navigator.userAgent || '').toLowerCase();
      return /bot|crawl|spider|slurp|googlebot|bingbot|yandex|baiduspider|duckduckbot|semrush|ahrefs|facebookexternalhit|lighthouse|pagespeed/.test(ua);
    } catch (e) { return false; }
  }
  if (isLikelyBot()) return;

  var path = location.pathname;
  /* Déjà sur une version traduite : ne rien faire. */
  if (/^\/(en|et)\//.test(path)) return;

  /* Un choix a déjà été fait une fois (redirection automatique OU clic
     manuel sur le sélecteur de langue) : ne plus jamais re-rediriger. */
  try {
    if (localStorage.getItem('a2s_lang_choice_made') === '1') return;
  } catch (e) { return; }

  /* Pages disponibles en anglais (même liste que nav.js/footer.js). */
  var TRANSLATED_PAGES = ['index.html', 'search.html', 'listing.html', 'post-listing.html',
    'avions-legers.html', 'jets-affaires.html', 'helicopteres.html', 'turboprops.html',
    'ulm.html', 'avions-de-ligne.html', 'blog.html', 'guide-acheteur.html',
    'assurance-aeronef-guide.html', 'comment-financer-avion-leger.html', 'copropriete-avion-guide.html',
    'cout-entretien-avion-leger.html', 'delai-vente-avion.html', 'documents-obligatoires-vente-avion.html',
    'immatriculation-aeronef-europe.html', 'importer-avion-usa-europe.html', 'inspection-pre-achat-avion.html',
    'licence-pilote-prive-cout.html', 'louer-ou-acheter-avion.html', 'pieges-achat-avion-occasion.html',
    'turbopropulseur-ou-jet-affaires.html', 'vendre-avion-particulier-europe.html'];

  var page = path.replace(/^\//, '').split(/[?#]/)[0] || 'index.html';
  if (TRANSLATED_PAGES.indexOf(page) === -1) return;

  /* Langue du navigateur (première préférence uniquement, en minuscules,
     code ISO 2 lettres avant le tiret éventuel : "en-US" -> "en"). */
  var navLang = ((navigator.language || navigator.userLanguage || '') + '').slice(0, 2).toLowerCase();
  if (navLang !== 'en') return;

  /* Marquer le choix comme fait AVANT de rediriger, pour que la page /en/
     de destination (qui charge aussi ce script) ne redirige pas à son tour
     ni ne déclenche de nouvelle vérification au retour arrière. */
  try { localStorage.setItem('a2s_lang_choice_made', '1'); } catch (e) {}

  location.replace('/en/' + page + location.search + location.hash);
})();

/* Marque tout choix MANUEL de langue (clic sur un lien hreflang du nav/footer)
   comme définitif, pour ne plus jamais déclencher la redirection automatique
   ci-dessus — y compris si le visiteur revient volontairement en FR. Délégué
   sur document pour capter les liens injectés dynamiquement par nav.js/footer.js. */
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[hreflang]');
  if (a) { try { localStorage.setItem('a2s_lang_choice_made', '1'); } catch (err) {} }
});
