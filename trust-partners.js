/* ============================================================
   trust-partners.js — Aircraft2Sell · Bandeau "Ils font confiance"
   Alimente dynamiquement la rangée de logos partenaires affichée
   en bas des pages d'accueil (FR/EN/ET), depuis la table Supabase
   `public.partners`. Tout partenaire actif (status='active', dans
   sa fenêtre de validité) apparaît automatiquement ici — plus
   besoin d'éditer le HTML à chaque nouveau partenaire.

   Usage : <div class="partners" id="partnersTrustGrid"></div>
           <script src="/trust-partners.js" defer></script>
   Si la section ne contient aucun partenaire actif, elle est
   masquée (pas de bandeau vide).
   ============================================================ */
(function () {
  var SB = 'https://hlivysnlzlqdjcigqgvk.supabase.co';
  var SK = 'sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';
  var COLS = 'id,company,logo_url,website_url,tagline';

  function esc(s) {
    if (s === null || s === undefined) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function cardHtml(p) {
    var title = p.tagline ? esc(p.company) + ' — ' + esc(p.tagline) : esc(p.company);
    var logo = p.logo_url
      ? '<img src="' + esc(p.logo_url) + '" alt="' + esc(p.company) + '" loading="lazy">'
      : '<span class="partner-name" style="font-size:.9rem">' + esc(p.company) + '</span>';
    return '<a class="partner-logo" href="' + esc(p.website_url) + '" target="_blank" rel="noopener sponsored" title="' + title + '">'
      + logo
      + '<span class="partner-name">' + esc(p.company) + '</span>'
      + '</a>';
  }

  window.addEventListener('DOMContentLoaded', async function () {
    var grid = document.getElementById('partnersTrustGrid');
    if (!grid) return;
    var section = grid.closest('section') || grid;
    try {
      var r = await fetch(SB + '/rest/v1/partners?select=' + COLS + '&order=id.asc', {
        headers: { apikey: SK, Authorization: 'Bearer ' + SK }
      });
      if (!r.ok) throw new Error('fetch failed');
      var rows = await r.json();
      if (!rows || !rows.length) { section.style.display = 'none'; return; }
      grid.innerHTML = rows.map(cardHtml).join('');
    } catch (e) {
      /* silencieux : si la section n'avait aucun fallback statique, on la masque */
      if (!grid.children.length) section.style.display = 'none';
    }
  });
})();
