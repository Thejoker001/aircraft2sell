/**
 * widget-embed.js — Widget partenaires Aircraft2Sell.
 *
 * À inclure sur n'importe quel site partenaire :
 *
 *   <div id="a2s-widget" data-seller="email.du.vendeur@exemple.fr"></div>
 *   <script src="https://aircraft2sell.eu/widget-embed.js" defer></script>
 *
 * Le script lit data-seller, interroge les annonces live de ce vendeur
 * (Supabase REST, clé publique anon en lecture seule) et affiche une liste
 * compacte des 10 dernières annonces : photo, modèle, année, prix, lien
 * vers la fiche sur aircraft2sell.eu.
 *
 * Styles 100 % inline : le widget s'affiche tel quel sur un site tiers,
 * sans dépendre des feuilles de style d'Aircraft2Sell.
 *
 * Expose window.A2SWidget.render(host) pour permettre à une page hôte
 * (ex. la page de documentation widget.html) de re-rendre l'aperçu après
 * modification de data-seller.
 */
(function () {
  'use strict';

  var SB = 'https://hlivysnlzlqdjcigqgvk.supabase.co';
  var SB_KEY = 'sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';

  /* Styles inline communs. */
  var WRAP = 'box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#FFFFFF;border:1px solid #E3E8F0;border-radius:12px;overflow:hidden;max-width:420px;color:#16233A';
  var HEAD = 'background:#0B2545;color:#FFFFFF;padding:10px 12px;font-size:13px;font-weight:800;display:flex;align-items:center;gap:6px';
  var EMPTY = 'padding:14px 12px;color:#5B6B85;font-size:13px;text-align:center';

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function imgUrl(u) {
    if (!u) return '';
    return u + (u.indexOf('?') > -1 ? '&' : '?') + 'width=160&quality=75';
  }

  function fmtPrice(p, c) {
    var sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr' }[c || 'EUR'] || '€';
    var n = (p != null && p !== '' && !isNaN(Number(p))) ? Number(p) : null;
    return n != null ? n.toLocaleString('fr-FR') + ' ' + sym : 'Prix sur demande';
  }

  function headerHtml() {
    return '<div style="' + HEAD + '">Aircraft2<span style="color:#EA6A16">Sell</span> <span style="font-weight:600;opacity:.85;font-size:12px;margin-left:auto">Annonces en direct</span></div>';
  }

  function itemHtml(l) {
    var title = [l.make, l.model].filter(Boolean).join(' ') || 'Aéronef';
    var thumb = (l.photos && l.photos[0])
      ? '<img src="' + esc(imgUrl(l.photos[0])) + '" alt="" style="width:64px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;background:#F1F5F9">'
      : '<span style="width:64px;height:48px;border-radius:6px;background:#F1F5F9;display:flex;align-items:center;justify-content:center;color:#0B2545;font-weight:800;font-size:11px;flex-shrink:0">A2S</span>';
    return '<a href="https://aircraft2sell.eu/listing.html?id=' + encodeURIComponent(l.id) + '" target="_blank" rel="noopener" style="display:flex;gap:10px;align-items:center;padding:10px 12px;text-decoration:none;border-bottom:1px solid #EEF2F7">'
      + thumb
      + '<span style="flex:1;min-width:0">'
      + '<span style="display:block;color:#0B2545;font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(title)
      + (l.year ? ' <span style="color:#5B6B85;font-weight:500">(' + esc(String(l.year)) + ')</span>' : '')
      + '</span>'
      + '<span style="display:block;color:#EA6A16;font-weight:700;font-size:13px;margin-top:2px">' + fmtPrice(l.price, l.currency) + '</span>'
      + '</span>'
      + '<span style="color:#1E5FCC;font-size:11px;flex-shrink:0">Voir</span>'
      + '</a>';
  }

  function renderWidget(host) {
    if (!host) return;
    var email = (host.getAttribute('data-seller') || '').trim();
    if (!email) {
      host.innerHTML = '<div style="' + WRAP + '">' + headerHtml() + '<div style="' + EMPTY + '">Aucune annonce actuellement</div></div>';
      return;
    }
    host.innerHTML = '<div style="' + WRAP + '">' + headerHtml() + '<div style="' + EMPTY + '">Chargement…</div></div>';

    fetch(SB + '/rest/v1/listings?status=eq.live&seller_email=eq.' + encodeURIComponent(email) +
      '&select=id,make,model,year,price,currency,category,photos&limit=10', {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY },
    })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (rows) {
        var list = Array.isArray(rows) ? rows.slice(0, 10) : [];
        if (!list.length) {
          host.innerHTML = '<div style="' + WRAP + '">' + headerHtml() + '<div style="' + EMPTY + '">Aucune annonce actuellement</div></div>';
          return;
        }
        var items = list.map(itemHtml).join('');
        host.innerHTML = '<div style="' + WRAP + '">' + headerHtml() + items
          + '<div style="padding:8px 12px;text-align:center;border-top:1px solid #EEF2F7">'
          + '<a href="https://aircraft2sell.eu/search.html" target="_blank" rel="noopener" style="color:#1E5FCC;font-size:12px;text-decoration:none;font-weight:600">Voir toutes les annonces sur Aircraft2Sell</a>'
          + '</div></div>';
      })
      .catch(function () {
        host.innerHTML = '<div style="' + WRAP + '">' + headerHtml() + '<div style="' + EMPTY + '">Aucune annonce actuellement</div></div>';
      });
  }

  window.A2SWidget = { render: renderWidget };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var host = document.getElementById('a2s-widget');
    if (host) renderWidget(host);
  });
})();
