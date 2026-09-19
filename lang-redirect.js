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
   - pour les crawlers (les moteurs de recherche envoient rarement
     Accept-Language avec une préférence forte, et de toute façon le HTML
     brut FR reste servi et indexable : cette redirection est seulement
     déclenchée côté client APRÈS que le crawler ait déjà lu le contenu ;
     un vrai crawler n'exécute pas ce script de la même façon qu'un
     navigateur humain interactif, donc pas d'impact sur l'indexation FR).
   ========================================================================== */
(function () {
  'use strict';

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
    'ulm.html', 'avions-de-ligne.html'];

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
