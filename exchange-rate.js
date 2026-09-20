/* ==========================================================================
   Aircraft2Sell — Conversion USD approximative sous les prix en devise étrangère
   --------------------------------------------------------------------------
   Charge les taux de change EUR->X depuis exchange-rate.json (fichier
   statique régénéré une fois par jour par un cron serveur, source BCE via
   Frankfurter). Fournit usdApproxText(priceEUR, sourceCur) qui retourne un
   texte "≈ 297 960 $ US" à afficher sous le prix principal, ou null si
   aucune conversion n'a de sens (prix déjà en USD, ou taux indisponible).
   ========================================================================== */
(function (global) {
  'use strict';

  var _rates = null;     // { USD: 1.146, GBP: 0.858, ... } (base EUR)
  var _loadPromise = null;

  function loadRate() {
    if (_loadPromise) return _loadPromise;
    _loadPromise = fetch('/exchange-rate.json', { cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.rates) _rates = d.rates; return _rates; })
      .catch(function () { return null; });
    return _loadPromise;
  }

  /* priceEUR : montant déjà converti en euros (pivot interne du site).
     sourceCur : devise dans laquelle le prix PRINCIPAL est déjà affiché
     (si c'est déjà 'USD', on ne réaffiche pas la même chose en dessous). */
  function usdApproxText(priceEUR, sourceCur) {
    if (!priceEUR || !_rates || !_rates.USD || sourceCur === 'USD') return null;
    var usd = Math.round(priceEUR * _rates.USD);
    return '≈ ' + usd.toLocaleString('fr-FR') + ' $ US';
  }

  global.A2SExchangeRate = { load: loadRate, usdApproxText: usdApproxText, rates: function () { return _rates; } };
})(window);
