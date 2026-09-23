/* ============================================================
   partners.js — Aircraft2Sell · Encart partenaire natif
   Affiche UN encart discret en bas de page (jamais avant le
   contenu principal), tiré aléatoirement parmi les partenaires
   actifs pour la page courante. Zéro pollution : pas de bandeau,
   pas de pop-up, pas de régie tierce.

   Usage : <div id="a2sPartnerSlot"></div><script src="/partners.js"></script>
   Le slot doit être placé APRÈS le contenu principal de la page,
   avant le footer.
   ============================================================ */
(function () {
  var SB = 'https://hlivysnlzlqdjcigqgvk.supabase.co';
  var SK = 'sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';
  var COLS = 'id,company,logo_url,website_url,tagline,category,tier,target_pages';

  function currentPage() {
    var p = location.pathname.replace(/^\/(en|et)\//, '').replace(/^\//, '');
    return p || 'index.html';
  }

  function esc(s) {
    if (s === null || s === undefined) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function render(p) {
    var slot = document.getElementById('a2sPartnerSlot');
    if (!slot) return;
    var logo = p.logo_url
      ? '<img src="' + esc(p.logo_url) + '" alt="' + esc(p.company) + '" style="width:44px;height:44px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid var(--a2s-border)">'
      : '<span class="icon-box" style="width:44px;height:44px">' + (window.A2SIcon ? window.A2SIcon('building') : '') + '</span>';
    slot.innerHTML =
      '<div class="card" style="display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;margin:2rem 0">' +
      logo +
      '<div style="flex:1;min-width:0">' +
      '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.15rem">' +
      '<span style="font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--a2s-text-faint)">Partenaire</span>' +
      '</div>' +
      '<div style="font-weight:700;color:var(--a2s-text)">' + esc(p.company) + '</div>' +
      (p.tagline ? '<div style="font-size:.85rem;color:var(--a2s-text-muted)">' + esc(p.tagline) + '</div>' : '') +
      '</div>' +
      '<a href="' + esc(p.website_url) + '" target="_blank" rel="noopener sponsored" class="btn-secondary" style="white-space:nowrap">En savoir plus</a>' +
      '</div>';
  }

  window.addEventListener('DOMContentLoaded', async function () {
    var slot = document.getElementById('a2sPartnerSlot');
    if (!slot) return;
    try {
      var r = await fetch(SB + '/rest/v1/partners?select=' + COLS, { headers: { apikey: SK } });
      if (!r.ok) return;
      var rows = await r.json();
      var page = currentPage();
      var eligible = rows.filter(function (p) {
        if (p.tier === 'decouverte') return false; /* pas d'encart sur page, uniquement /partenaires.html */
        var pages = p.target_pages || [];
        if (p.tier === 'premium' && (page === 'index.html' || pages.indexOf(page) > -1)) return true;
        if (p.tier === 'visibilite' && pages.indexOf(page) > -1) return true;
        return false;
      });
      if (!eligible.length) return;
      var pick = eligible[Math.floor(Math.random() * eligible.length)];
      render(pick);
    } catch (e) { /* silencieux : jamais bloquer l'affichage de la page pour une pub */ }
  });
})();
