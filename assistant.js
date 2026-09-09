/* ==========================================================================
   Aircraft2Sell — Assistant du site
   --------------------------------------------------------------------------
   Répond automatiquement aux questions des visiteurs à partir de la FAQ
   publiée (faq-data.js, généré depuis le JSON-LD de faq.html).

   Fonctionne entièrement dans le navigateur : aucun serveur, aucune clé API,
   aucun coût, aucune donnée envoyée à un tiers (donc rien à déclarer au RGPD).

   Chargement différé : rien ne part au rendu initial, le corpus (~16 ko) n'est
   téléchargé qu'à l'ouverture de l'assistant. Le SEO n'est pas affecté.

   Escalade : si aucune réponse ne dépasse le seuil de confiance, l'assistant
   propose explicitement le contact humain plutôt que d'inventer.
   ========================================================================== */
(function () {
  'use strict';

  /* Pages privées / applicatives : pas d'assistant. */
  var BLOCKED = /(admin-|dashboard|messages|moderation|diag|onboarding|checkout|success|cancel|listing-submitted|login)\.html/i;
  if (BLOCKED.test(location.pathname)) return;
  if (window.__a2sAssistant) return;
  window.__a2sAssistant = true;

  var lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  /* Seules les FAQ FR/EN existent : sur /et/ (estonien), retomber sur
     l'anglais plutôt que le français — plus pertinent pour un Estonien. */
  if (lang === 'et') lang = 'en';
  else if (lang !== 'en') lang = 'fr';

  var T = {
    fr: {
      launch: 'Une question ?',
      title: 'Assistant Aircraft2Sell',
      subtitle: 'Réponses immédiates, 24 h/24',
      placeholder: 'Posez votre question…',
      send: 'Envoyer',
      close: 'Fermer l\u2019assistant',
      hello: 'Bonjour ! Je réponds aux questions courantes sur Aircraft2Sell : frais, dépôt d\u2019annonce, sécurité, compte. Que puis-je faire pour vous ?',
      suggestTitle: 'Questions fréquentes',
      noAnswer: 'Je n\u2019ai pas de réponse fiable à cette question. Écrivez-nous à <a href="mailto:contact@aircraft2sell.eu">contact@aircraft2sell.eu</a> : l\u2019équipe répond sous 24 h ouvrées.',
      related: 'Ces questions peuvent aussi vous aider :',
      more: 'Voir toute la FAQ',
      faqUrl: '/faq.html',
      contactUrl: '/contact.html',
      contactLabel: 'Contacter l\u2019équipe',
      you: 'Vous'
    },
    en: {
      launch: 'Need help?',
      title: 'Aircraft2Sell Assistant',
      subtitle: 'Instant answers, 24/7',
      placeholder: 'Ask your question…',
      send: 'Send',
      close: 'Close assistant',
      hello: 'Hello! I answer common questions about Aircraft2Sell: fees, posting a listing, safety, accounts. How can I help?',
      suggestTitle: 'Common questions',
      noAnswer: 'I don\u2019t have a reliable answer to that. Email us at <a href="mailto:contact@aircraft2sell.eu">contact@aircraft2sell.eu</a> and the team will reply within 24 working hours.',
      related: 'These questions may also help:',
      more: 'See the full FAQ',
      faqUrl: '/en/index.html#faq',
      contactUrl: '/contact.html',
      contactLabel: 'Contact the team',
      you: 'You'
    }
  }[lang];

  /* ── Normalisation : minuscules, sans accents, sans ponctuation ── */
  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Mots vides : ignorés dans le score, ils faussent la pertinence. */
  var STOP = norm(
    'le la les un une des du de a au aux et ou est sont ce cette ces mon ma mes ' +
    'votre vos je vous il elle on nous que qui quoi comment pourquoi quand ou ' +
    'pour par sur dans avec sans plus moins tres etre avoir faire puis peux peut ' +
    'the a an of to in on for with and or is are do does can i my your it this that ' +
    'what how why when where'
  ).split(' ');

  function tokens(s) {
    return norm(s).split(' ').filter(function (w) {
      return w.length > 2 && STOP.indexOf(w) === -1;
    });
  }

  /* ── Score de pertinence ──────────────────────────────────────
     Pondération : la question pèse plus que la réponse (une question
     qui correspond est un signal plus fort qu'un mot croisé au hasard
     dans un long texte). Les mots-clés captent le vocabulaire réel des
     visiteurs, différent de celui de la FAQ. */
  /* Racinisation grossière : « commission » / « commissions », « donnee » /
     « donnees », « telephone » / « telephoner » doivent se rejoindre. On tronque
     aux 5 premiers caractères, suffisant pour du français et de l'anglais
     courants sans embarquer un vrai stemmer. */
  function stem(w) {
    return w.length > 5 ? w.slice(0, 5) : w;
  }

  function contains(haystackStems, w) {
    var target = stem(w);
    for (var i = 0; i < haystackStems.length; i++) {
      if (haystackStems[i] === target) return true;
    }
    return false;
  }

  function stems(s) {
    return norm(s).split(' ').filter(Boolean).map(stem);
  }

  function score(query, entry) {
    var qt = tokens(query);
    if (!qt.length) return 0;

    if (!entry._sq) {
      entry._sq = stems(entry.q);
      entry._sa = stems(entry.a);
      entry._sk = stems(entry.k || '');
    }

    var hits = 0, total = 0;
    qt.forEach(function (w) {
      var s = 0;
      if (contains(entry._sq, w)) s = 3;
      else if (contains(entry._sk, w)) s = 2.6;
      else if (contains(entry._sa, w)) s = 1.1;
      if (s) hits++;
      total += s;
    });

    if (!hits) return 0;

    /* Proportion de mots reconnus : évite qu'un mot isolé ne fasse remonter
       une réponse hors sujet. Atténuée (racine carrée) car une question courte
       et précise (« vous prenez une commission ? ») ne doit pas être pénalisée
       autant qu'une phrase longue et vague. */
    var coverage = Math.sqrt(hits / qt.length);
    return total * coverage;
  }

  function search(query) {
    var data = (window.A2S_FAQ || []).map(function (e) { return e[lang]; });
    return data
      .map(function (e) { return { e: e, s: score(query, e) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; });
  }

  /* ── Interface ──────────────────────────────────────────────── */
  var root, panel, log, input, opened = false;

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '#a2sBotBtn{position:fixed;bottom:1.25rem;right:1.25rem;z-index:498;display:inline-flex;',
      'align-items:center;gap:.5rem;min-height:48px;padding:0 1.1rem;border:none;border-radius:999px;',
      'cursor:pointer;background:var(--a2s-navy,#0B2545);color:#fff;font-family:var(--font-body,Manrope,sans-serif);',
      'font-size:.88rem;font-weight:700;box-shadow:0 8px 24px rgba(11,37,69,.22);transition:background .15s,transform .15s}',
      '#a2sBotBtn:hover{background:var(--a2s-navy-light,#163A6B);transform:translateY(-1px)}',
      '#a2sBotBtn svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      /* La nav est fixe (z-index 500, hauteur --nav-h) : la fenêtre doit rester
         SOUS elle, sinon elle la recouvre et masque la navigation. */
      '#a2sBot{position:fixed;bottom:1.25rem;right:1.25rem;z-index:499;width:min(384px,calc(100vw - 2rem));',
      'max-height:min(600px,calc(100vh - var(--nav-h,64px) - 3.5rem));display:none;flex-direction:column;overflow:hidden;',
      'background:var(--a2s-surface,#fff);border:1px solid var(--a2s-border,#E4E8EF);border-radius:16px;',
      'box-shadow:0 20px 48px rgba(11,37,69,.24);font-family:var(--font-body,Manrope,sans-serif)}',
      '#a2sBot.open{display:flex}',
      '.a2sb-head{display:flex;align-items:center;gap:.7rem;padding:.9rem 1rem;background:var(--a2s-navy,#0B2545);color:#fff;flex-shrink:0}',
      '.a2sb-av{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.a2sb-av svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.a2sb-ttl{font-weight:800;font-size:.92rem;line-height:1.2}',
      '.a2sb-sub{font-size:.74rem;opacity:.75;margin-top:.1rem}',
      '.a2sb-x{margin-left:auto;background:none;border:none;color:#fff;opacity:.75;cursor:pointer;padding:.3rem;display:flex;border-radius:6px}',
      '.a2sb-x:hover{opacity:1;background:rgba(255,255,255,.12)}',
      '.a2sb-x svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round}',
      '.a2sb-log{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.7rem;background:var(--a2s-bg,#F5F7FA)}',
      '.a2sb-msg{max-width:88%;padding:.7rem .9rem;border-radius:12px;font-size:.87rem;line-height:1.55;white-space:pre-wrap}',
      '.a2sb-bot{align-self:flex-start;background:var(--a2s-surface,#fff);color:var(--a2s-text,#14213D);border:1px solid var(--a2s-border,#E4E8EF);border-bottom-left-radius:4px}',
      '.a2sb-me{align-self:flex-end;background:var(--a2s-navy,#0B2545);color:#fff;border-bottom-right-radius:4px}',
      '.a2sb-msg a{color:var(--a2s-blue,#1E5FCC);font-weight:600}',
      '.a2sb-me a{color:#fff;text-decoration:underline}',
      '.a2sb-sugg{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.15rem}',
      '.a2sb-chip{background:var(--a2s-surface,#fff);border:1px solid var(--a2s-border-2,#CFD6E1);color:var(--a2s-navy,#0B2545);',
      'border-radius:999px;padding:.4rem .8rem;font-size:.79rem;font-weight:600;cursor:pointer;text-align:left;',
      'font-family:inherit;transition:border-color .15s,background .15s}',
      '.a2sb-chip:hover{border-color:var(--a2s-navy,#0B2545);background:var(--a2s-surface-2,#EEF2F7)}',
      '.a2sb-lbl{font-size:.74rem;font-weight:700;color:var(--a2s-text-muted,#5C6B82);margin-top:.2rem}',
      '.a2sb-foot{display:flex;gap:.5rem;padding:.7rem;border-top:1px solid var(--a2s-border,#E4E8EF);background:var(--a2s-surface,#fff);flex-shrink:0}',
      '.a2sb-inp{flex:1;min-width:0;border:1.5px solid var(--a2s-border-2,#CFD6E1);border-radius:999px;padding:.6rem .95rem;',
      'font-family:inherit;font-size:.87rem;color:var(--a2s-text,#14213D);outline:none;background:#fff}',
      '.a2sb-inp:focus{border-color:var(--a2s-blue,#1E5FCC);box-shadow:0 0 0 3px rgba(30,95,204,.14)}',
      '.a2sb-send{width:42px;height:42px;flex-shrink:0;border:none;border-radius:50%;background:var(--a2s-accent,#EA6A16);',
      'color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}',
      '.a2sb-send:hover{background:var(--a2s-accent-hover,#D25C0F)}',
      '.a2sb-send svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      '@media(max-width:600px){#a2sBot{bottom:0;right:0;top:0;width:100vw;max-height:100vh;height:100dvh;border-radius:0;z-index:601}',
      '#a2sBotBtn{bottom:1rem;right:1rem;padding:0 .9rem;min-height:44px;font-size:.82rem}}',
      '@media print{#a2sBotBtn,#a2sBot{display:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  var ICON = {
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function bubble(htmlContent, mine) {
    var d = document.createElement('div');
    d.className = 'a2sb-msg ' + (mine ? 'a2sb-me' : 'a2sb-bot');
    d.innerHTML = htmlContent;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function chips(list, labelText) {
    if (!list.length) return;
    if (labelText) {
      var l = document.createElement('div');
      l.className = 'a2sb-lbl';
      l.textContent = labelText;
      log.appendChild(l);
    }
    var wrap = document.createElement('div');
    wrap.className = 'a2sb-sugg';
    list.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'a2sb-chip';
      b.textContent = q;
      b.addEventListener('click', function () { ask(q); });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  /* Seuil sous lequel on préfère avouer l'ignorance plutôt qu'inventer. */
  var THRESHOLD = 2.2;

  /* Historique envoyé à l'agent IA (contexte court, jamais persisté). */
  var aiHistory = [];

  function typing(on) {
    var el = document.getElementById('a2sbTyping');
    if (on && !el) {
      el = document.createElement('div');
      el.id = 'a2sbTyping';
      el.className = 'a2sb-msg a2sb-bot';
      el.textContent = lang === 'en' ? 'Typing…' : 'Écrit…';
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
    } else if (!on && el) {
      el.remove();
    }
  }

  /* Second niveau : agent IA (Groq), seulement si la recherche locale échoue.
     Affiche le repli humain UNIQUEMENT si l'IA échoue aussi — éviter d'empiler
     "je ne sais pas" puis une vraie réponse juste après (confus pour le visiteur). */
  function askAI(q) {
    typing(true);
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q, lang: lang, history: aiHistory })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        typing(false);
        if (!res.ok || !res.d || !res.d.reply) {
          bubble(T.noAnswer, false);
          chips((window.A2S_FAQ || []).slice(0, 4).map(function (e) { return e[lang].q; }), T.related);
          return;
        }
        aiHistory.push({ role: 'user', content: q });
        aiHistory.push({ role: 'assistant', content: res.d.reply });
        bubble(esc(res.d.reply) +
          '<div style="margin-top:.6rem;font-size:.8rem">' +
          '<a href="' + T.contactUrl + '">' + T.contactLabel + '</a></div>', false);
      })
      .catch(function () {
        typing(false);
        bubble(T.noAnswer, false);
        chips((window.A2S_FAQ || []).slice(0, 4).map(function (e) { return e[lang].q; }), T.related);
      });
  }

  function ask(q) {
    q = String(q || '').trim();
    if (!q) return;
    bubble(esc(q), true);
    input.value = '';

    var res = search(q);
    var best = res[0];

    if (!best || best.s < THRESHOLD) {
      askAI(q);
      return;
    }

    /* Réponse + lien de contact discret pour aller plus loin. */
    bubble(esc(best.e.a) +
      '<div style="margin-top:.6rem;font-size:.8rem">' +
      '<a href="' + T.faqUrl + '">' + T.more + '</a>' +
      ' · <a href="' + T.contactUrl + '">' + T.contactLabel + '</a></div>', false);

    var others = res.slice(1, 4).filter(function (r) { return r.s >= THRESHOLD * 0.6; });
    if (others.length) {
      chips(others.map(function (r) { return r.e.q; }), T.related);
    }
  }

  function build() {
    css();

    var btn = document.createElement('button');
    btn.id = 'a2sBotBtn';
    btn.type = 'button';
    btn.setAttribute('aria-label', T.launch);
    btn.innerHTML = ICON.chat + '<span>' + T.launch + '</span>';
    btn.addEventListener('click', open);
    document.body.appendChild(btn);

    root = document.createElement('section');
    root.id = 'a2sBot';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', T.title);
    root.innerHTML =
      '<div class="a2sb-head">' +
        '<div class="a2sb-av">' + ICON.chat + '</div>' +
        '<div><div class="a2sb-ttl">' + T.title + '</div><div class="a2sb-sub">' + T.subtitle + '</div></div>' +
        '<button type="button" class="a2sb-x" aria-label="' + T.close + '">' + ICON.close + '</button>' +
      '</div>' +
      '<div class="a2sb-log" id="a2sbLog" aria-live="polite"></div>' +
      '<form class="a2sb-foot">' +
        '<input class="a2sb-inp" type="text" autocomplete="off" placeholder="' + T.placeholder + '" aria-label="' + T.placeholder + '">' +
        '<button type="submit" class="a2sb-send" aria-label="' + T.send + '">' + ICON.send + '</button>' +
      '</form>';
    document.body.appendChild(root);

    panel = root;
    log = root.querySelector('#a2sbLog');
    input = root.querySelector('.a2sb-inp');

    root.querySelector('.a2sb-x').addEventListener('click', close);
    root.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      ask(input.value);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && opened) close();
    });

    avoidConsentBanner(btn);
  }

  /* Le bandeau de consentement (z-index 9999) recouvre le coin bas droit :
     tant qu'il est affiché, on remonte le bouton pour qu'il reste cliquable. */
  function avoidConsentBanner(btn) {
    function sync() {
      var banner = document.getElementById('a2s-consent-banner');
      var box = banner && banner.firstElementChild;
      var h = box ? box.getBoundingClientRect().height : 0;
      btn.style.bottom = h ? (h + 28) + 'px' : '';
      if (window.innerWidth > 600) {
        panel.style.bottom = h ? (h + 28) + 'px' : '';
        panel.style.paddingBottom = '';
      } else {
        /* Plein écran mobile : la fenêtre occupe tout l'écran, on ne peut pas
           la décaler — on réserve la place du bandeau sous le champ de saisie,
           sinon il est inaccessible tant que le consentement n'est pas donné. */
        panel.style.bottom = '';
        panel.style.paddingBottom = h ? h + 'px' : '';
      }
    }
    sync();
    if (window.MutationObserver) new MutationObserver(sync).observe(document.body, { childList: true });
    window.addEventListener('resize', sync);
  }

  function open() {
    /* Le corpus n'est téléchargé qu'ici : rien ne pèse sur le rendu initial. */
    if (!window.A2S_FAQ) {
      var s = document.createElement('script');
      s.src = '/faq-data.js?v=20260907';
      s.onload = greet;
      s.onerror = function () {
        bubble(T.noAnswer, false);
      };
      document.head.appendChild(s);
    }
    opened = true;
    panel.classList.add('open');
    document.getElementById('a2sBotBtn').style.display = 'none';
    if (window.A2S_FAQ && !log.children.length) greet();
    setTimeout(function () { input.focus(); }, 60);
  }

  function greet() {
    if (log.children.length) return;
    bubble(T.hello, false);
    chips((window.A2S_FAQ || []).slice(0, 4).map(function (e) { return e[lang].q; }), T.suggestTitle);
  }

  function close() {
    opened = false;
    panel.classList.remove('open');
    document.getElementById('a2sBotBtn').style.display = '';
  }

  /* Après le chargement complet : ne concurrence jamais le rendu initial. */
  if (document.readyState === 'complete') setTimeout(build, 900);
  else window.addEventListener('load', function () { setTimeout(build, 900); });
})();
