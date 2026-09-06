# Aircraft2Sell — Design System v2 (référence pour toute page)

Source de vérité : `styles.css` (tokens + composants), `icons.js` (icônes SVG), `nav.js`, `footer.js`.
Objectif : un site cohérent, sobre, professionnel — aucun effet gratuit, aucun emoji.

## Règles absolues

1. **Aucun emoji nulle part** (HTML, JS, textes, boutons, placeholders, toasts). Remplacer par
   `<i data-icon="nom"></i>` en HTML ou `A2SIcon('nom')` en JS. Une puce ✓ → `check`, ✕ → `close`,
   ⚠ → `alert-triangle`, ✈ → `plane`, 📍 → `map-pin`, 📅 → `calendar`, ⏱ → `clock`, ♥ → `heart`, etc.
   Tolérance : un simple `→` textuel peut rester si c'est un lien inline, mais préférer `arrow-right`.
2. **Thème clair uniquement.** Supprimer tout `:root{--bg:#05080f…}` et polices Bebas Neue / DM Sans.
   Fond de page = `var(--a2s-bg)`, surfaces = `var(--a2s-surface)`, texte = `var(--a2s-text)`.
   Blocs sombres autorisés uniquement pour un hero ou un CTA de bas de page (`var(--a2s-navy)`).
3. **Pas d'effets "IA" :** pas de dégradés multicolores, pas de glow/glassmorphism, pas de
   `backdrop-filter`, pas de bordures dégradées, pas de texte en `-webkit-text-stroke`, pas de
   tickers défilants, pas de reveal-on-scroll, pas d'ombres colorées. Ombres = `var(--a2s-shadow*)`.
   Transitions courtes (.15s) sur hover uniquement.
4. **Orange (`--a2s-accent`) réservé aux actions principales** (un seul `.btn-primary` visible par
   zone). Jamais en décoration ni en texte courant.
5. **Icônes** : trait 1.8px, `currentColor`. Dans un cadre : `<span class="icon-box"><i data-icon="…"></i></span>`
   (variantes `.accent`, `.navy`, `.success`).
6. **Chaque page inclut** dans `<head>` : `styles.css?v=20260906c` puis `mobile.css?v=20260906c`, puis un
   `<style>` local minimal (uniquement ce qui est spécifique à la page). En fin de `<body>` :
   `<script src="icons.js?v=20260906c"></script>` AVANT le script inline de la page,
   puis `nav.js?v=20260906c` et `footer.js?v=20260906c` (+ `<div id="a2sFooter"></div>` avant les scripts).
   Pages sous `/en/` : préfixer par `/` (`/styles.css`, `/icons.js`, `/nav.js`, `/footer.js`).
7. **Ne pas mettre `style="padding-top:64px"` sur `<body>`** — `styles.css` gère le décalage de la nav.
8. Ne jamais casser les `id` utilisés par le JS de la page (`grep getElementById` avant de renommer).

## Structure de page standard

```html
<body>
<!-- nav injectée par nav.js -->
<div class="page-head">
  <div class="container">
    <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a><i data-icon="chevron-right"></i><span aria-current="page">Titre</span></nav>
    <h1>Titre de la page</h1>
    <p>Sous-titre en une phrase, qui dit ce qu'on peut faire ici.</p>
  </div>
</div>
<section class="section"><div class="container"> … </div></section>
<div id="a2sFooter"></div>
<script src="icons.js?v=20260906c"></script>
<script> /* page */ </script>
<script src="nav.js?v=20260906c"></script>
<script src="footer.js?v=20260906c"></script>
</body>
```

## Composants disponibles (classes)

| Besoin | Classe |
|---|---|
| Conteneur | `.container` (1200px) · `.container-narrow` (760px) |
| Section | `.section` · `.section-sm` · `.section-alt` (fond blanc + bordures) · `.section-head` |
| Titres | `h1/h2/h3` natifs · `.eyebrow` (sur-titre orange) · `.lead` · `.muted` · `.faint` |
| Boutons | `.btn-primary` (orange, action principale) · `.btn-secondary` (contour) · `.btn-navy` · `.btn-ghost` · `.btn-danger` · `.btn-link` · tailles `.btn-sm` `.btn-lg` `.btn-block` · `.btn-icon` · état `.is-loading` |
| Formulaire | `.field` > `label` + `.inp` / `.sel` / `.txta` + `.field-hint` / `.field-error` · `.field.has-error` · `.form-grid` (+`.col3`, `.span2`) · `.input-group.has-icon` (+ `<i data-icon>` avant l'input) · `.input-group.has-action` (+ `.inp-action`) · `.addon` · `.check` · `.choice-grid` > `.choice` · `.pills` > `.pill(.active)` · `.switch` |
| Cartes | `.card` · `.card-body` · `.card-head` · `.card-foot` · `.card-hover` |
| Carte annonce | `.listings-grid` > `a.lc` > `.lc-img` (+`.lc-cat-badge`, `.lc-fav`, `.lc-placeholder`) + `.lc-body` > `.lc-title`, `.lc-specs` > `.lc-spec`, `.lc-trust`, `.lc-footer` > `.lc-price` + `.lc-loc` · vue liste : parent `.listings-list` |
| Badges | `.badge` · `.badge-verified` · `.badge-zero-commission` · `.badge-accent/-navy/-success/-danger/-warning` · `.badge-dot` |
| Messages | `.alert.alert-info/-success/-warning/-error` (+ icône) · `.toast` (`#toast`, `.show`) |
| Navigation interne | `.tabs` > `.tab(.active)` · `.stepper` > `.step(.active/.done)` > `.step-num` + `span.step-label` · `.breadcrumb` |
| Vide / chargement | `.empty-state` > `.icon-box` + `.empty-title` + `.empty-sub` · `.shimmer`/`.skel` |
| Données | `.table-wrap` > `.table` · `.kpi` > `.kpi-label` + `.kpi-value` + `.kpi-delta` |
| Modale | `.modal-overlay(.open)` > `.modal` > `.modal-head` (`.modal-title`, `.modal-close`) + `.modal-body` + `.modal-footer` |
| Grilles | `.grid-2` `.grid-3` `.grid-4` (responsive auto) · `.stack` · `.row` · `.spread` |

## Icônes disponibles (`icons.js`)

search, menu, close, chevron-down/up/right/left, arrow-right/left/up-right, plus, minus, check,
check-circle, x-circle, info, alert-triangle, external, refresh, swap, filter, sliders, grid, list,
sort, eye, eye-off, edit, trash, copy, share, download, upload, printer, link, settings, logout,
user, users, user-check, building, briefcase, heart, star, bell, mail, message, phone, help-circle,
shield, shield-check, lock, badge-check, percent, euro, credit-card, trending-up, bar-chart,
calculator, tag, zap, award, globe, languages, map-pin, map, calendar, clock, gauge, wrench,
clipboard, file-text, book, image, camera, home, layout, compass, send, thumbs-up, whatsapp,
linkedin, instagram, plane, plane-light, jet, turboprop, helicopter, ulm, airliner, rocket.

Catégories → icône : light→`plane-light`, jet→`jet`, turbo→`turboprop`, heli→`helicopter`,
ulm→`ulm`, airliner→`airliner`.

## Ton & UX

- Un titre = une action claire. Sous-titre = ce que l'utilisateur obtient.
- Un seul CTA principal par écran ; les actions secondaires en `.btn-secondary` / `.btn-link`.
- Formulaires : label visible au-dessus, aide courte sous le champ, erreurs en ligne (pas d'`alert()`).
- Étapes visibles (`.stepper`) dès qu'un parcours a plus de 2 écrans.
- États vides toujours utiles (proposer l'action suivante).
- Textes : phrases courtes, sans jargon marketing, vouvoiement.

## Validation avant de rendre une page

`python3 scripts/check-page.py page.html` doit imprimer `OK` (JS valide, balises équilibrées,
aucun emoji, aucun `***`, aucun thème sombre legacy).
