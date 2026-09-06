/* ============================================================
   icons.js — Aircraft2Sell
   Bibliothèque d'icônes SVG en trait (24x24, stroke currentColor).
   Usage :
     - JS   : A2SIcon('search')            -> '<svg class="ic">…</svg>'
              A2SIcon('search', 'ic ic-lg') -> classe personnalisée
     - HTML : <i data-icon="search"></i>   -> remplacé au chargement
   Aucun emoji sur le site : toute icône passe par ce fichier.
   ============================================================ */
(function(){
  var P = {
    /* Navigation & actions */
    search:      '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu:        '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close:       '<path d="M6 6l12 12M18 6 6 18"/>',
    'chevron-down':  '<path d="m6 9 6 6 6-6"/>',
    'chevron-up':    '<path d="m18 15-6-6-6 6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    'chevron-left':  '<path d="m15 6-6 6 6 6"/>',
    'arrow-right':   '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left':    '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'arrow-up-right':'<path d="M7 17 17 7M8 7h9v9"/>',
    plus:        '<path d="M12 5v14M5 12h14"/>',
    minus:       '<path d="M5 12h14"/>',
    check:       '<path d="m5 12 5 5L20 7"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    'x-circle':  '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    info:        '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    'alert-triangle': '<path d="M10.3 4.6 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    external:    '<path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
    refresh:     '<path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5M4 13a8 8 0 0 0 13.7 4.7l2.3-2.2"/><path d="M4 4v4.5h4.5M20 20v-4.5h-4.5"/>',
    swap:        '<path d="M7 4v13M3 13l4 4 4-4M17 20V7M13 11l4-4 4 4"/>',
    filter:      '<path d="M4 5h16l-6 8v5l-4 2v-7L4 5Z"/>',
    sliders:     '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    grid:        '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    list:        '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    'sort':      '<path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3"/>',
    eye:         '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off':   '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M6.7 6.7C4.2 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1M9.9 5.8A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5s-.9 1.7-2.5 3.4"/>',
    edit:        '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m13.5 6.5 3 3"/>',
    trash:       '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    copy:        '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
    share:       '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    download:    '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    upload:      '<path d="M12 16V5M7 10l5-5 5 5M4 20h16"/>',
    printer:     '<path d="M6 9V4h12v5M6 18H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="6"/>',
    link:        '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3"/>',
    settings:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    logout:      '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M9 12h10"/>',

    /* Compte & personnes */
    user:        '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users:       '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    'user-check':'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 11l2 2 4-4"/>',
    building:    '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>',
    briefcase:   '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/>',
    heart:       '<path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z"/>',
    star:        '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8L12 3.5Z"/>',
    bell:        '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    mail:        '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    message:     '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1Z"/>',
    phone:       '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    'help-circle': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',

    /* Confiance, sécurité, argent */
    shield:      '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6L12 3Z"/>',
    'shield-check': '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
    lock:        '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    'badge-check': '<path d="M12 2.5l2.2 1.6 2.7-.4 1 2.5 2.5 1-.4 2.7 1.6 2.2-1.6 2.2.4 2.7-2.5 1-1 2.5-2.7-.4L12 21.5l-2.2-1.6-2.7.4-1-2.5-2.5-1 .4-2.7L2.5 12l1.6-2.2-.4-2.7 2.5-1 1-2.5 2.7.4L12 2.5Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    percent:     '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    euro:        '<path d="M18 6.5A7 7 0 0 0 7.5 9M18 17.5A7 7 0 0 1 7.5 15M4 10.5h11M4 13.5h11"/>',
    'credit-card': '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    'trending-up': '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
    'bar-chart':  '<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>',
    calculator:  '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    tag:         '<path d="M3 12V4h8l9 9-8 8-9-9Z"/><path d="M7.5 7.5h.01"/>',
    zap:         '<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z"/>',
    award:       '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/>',
    globe:       '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    languages:   '<path d="M4 5h9M8.5 3v2M11 5c-.6 3.2-2.7 6.4-6 8M6 8.5c1 2 3 4 5.5 5.5M12.5 21l4.5-10 4.5 10M14 17.5h6"/>',
    'map-pin':   '<path d="M12 21s6.5-5.5 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.5 6.5 11 6.5 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    map:         '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6ZM9 4v14M15 6v14"/>',
    calendar:    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock:       '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    gauge:       '<path d="M4 15a8 8 0 1 1 16 0"/><path d="m12 15 4-5"/><circle cx="12" cy="15" r="1.5"/>',
    wrench:      '<path d="M14.5 6.5a4 4 0 0 0 5 5L9 22l-3-3L16.5 8.5a4 4 0 0 0-2-2ZM3 21l3-3"/>',
    clipboard:   '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h6"/>',
    'file-text': '<path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    book:        '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H12v18H5.5A1.5 1.5 0 0 1 4 19.5v-15ZM12 3h6.5A1.5 1.5 0 0 1 20 4.5v15a1.5 1.5 0 0 1-1.5 1.5H12"/>',
    image:       '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/>',
    camera:      '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
    home:        '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9Z"/>',
    layout:      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M10 10v10"/>',
    compass:     '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    send:        '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z"/>',
    'thumbs-up': '<path d="M7 11v9H4v-9h3Zm0 0 4-7a2 2 0 0 1 2 2v3h5.5a1.5 1.5 0 0 1 1.5 1.7l-1.2 7a1.5 1.5 0 0 1-1.5 1.3H7"/>',
    whatsapp:    '<path d="M4 20l1.3-3.8A8 8 0 1 1 8 19.2L4 20Z"/><path d="M9.5 9.5c0 3 2 5 5 5l1-1.5-1.8-.8-.7.8a3.5 3.5 0 0 1-2-2l.8-.7-.8-1.8-1.5 1Z"/>',
    linkedin:    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7h.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
    instagram:   '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',

    /* Aéronefs (catégories) — pictos trait maison */
    plane:       '<path d="M10.5 13.5 4 16v2l6.5-1.5L12 21h2l-1-6.5 6.5-2.5V10L13 12.5 12 4h-2l-.5 8L4 10v2l6.5 1.5Z"/>',
    'plane-light': '<path d="M3 12h18M12 5v14M7 8l5-3 5 3M6 19h12"/>',
    jet:         '<path d="M3 13 20 6l1 2-6 3.5V17l2 2-3 1-2-3-2 1v3l-2-1-1-3-4-1 1-3H3v-1Z"/>',
    turboprop:   '<path d="M2 12h20M12 4v16M8 8l8 8M16 8l-8 8"/><circle cx="12" cy="12" r="2"/>',
    helicopter:  '<path d="M4 6h16M12 6v3M6 12a4 4 0 0 1 4-3h5a4 4 0 0 1 4 3v2a2 2 0 0 1-2 2h-7a4 4 0 0 1-4-4Z"/><path d="M7 16.5v2M15 16.5v2M5 18.5h12"/>',
    ulm:         '<path d="M3 9c4-4 14-4 18 0M12 7v9M8 16h8M12 16v3"/>',
    airliner:    '<path d="M2 12h14a4 4 0 0 1 4 4v1H9l-3-3H2v-2Z"/><path d="M6 12 4 6h2l4 6M14 12l-2-4h2l3 4M9 17l1 3"/>',
    rocket:      '<path d="M12 3c3 2 5 6 5 9l-2 2h-6l-2-2c0-3 2-7 5-9Z"/><circle cx="12" cy="9" r="1.5"/><path d="M9 14 6 17l1 2 2-1M15 14l3 3-1 2-2-1M12 16v5"/>'
  };

  function icon(name, cls, attrs){
    var body = P[name];
    if(!body) body = P['help-circle'];
    var c = cls || 'ic';
    return '<svg class="' + c + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"' + (attrs ? ' ' + attrs : '') + '>' + body + '</svg>';
  }
  icon.names = Object.keys(P);
  icon.has = function(n){ return !!P[n]; };

  /* Remplace <i data-icon="..."> par le SVG */
  function hydrate(root){
    (root || document).querySelectorAll('[data-icon]').forEach(function(el){
      if(el.tagName === 'svg') return;
      var n = el.getAttribute('data-icon');
      var extra = el.getAttribute('class') || '';
      var cls = extra.indexOf('ic') === -1 ? ('ic ' + extra).trim() : extra;
      var wrap = document.createElement('span');
      wrap.innerHTML = icon(n, cls);
      var svg = wrap.firstChild;
      if(el.getAttribute('aria-label')){ svg.setAttribute('aria-label', el.getAttribute('aria-label')); svg.setAttribute('role','img'); svg.removeAttribute('aria-hidden'); }
      el.replaceWith(svg);
    });
  }
  icon.hydrate = hydrate;

  window.A2SIcon = icon;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ hydrate(); });
  } else {
    hydrate();
  }
})();
