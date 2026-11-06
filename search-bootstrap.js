/* Externalisé le 06/11/26 — reliquat de script inline dans search.html
   (chantier retrait unsafe-inline, phase 1). Placé dans son propre fichier,
   à la MÊME position relative que le <script> inline d'origine (après
   exchange-rate.js), pour préserver l'ordre d'exécution exact : A2SExchangeRate
   doit déjà exister (défini par exchange-rate.js, chargé juste avant), et
   renderPage() doit déjà exister (défini par search-inline.js, chargé plus
   tôt dans la page). */
A2SExchangeRate.load().then(function(){renderPage();});
