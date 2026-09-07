# SEO — état et actions restantes

Dernière passe : 2026-09-07.

## Ce qui est fait

| Sujet | Avant | Après |
|---|---|---|
| URLs dans le sitemap | 25 (aucune page EN) | 35, dont les 10 pages EN |
| hreflang dans le sitemap | 0 | 27 URLs annotées |
| Sitemap déclaré à Google | `www.aircraft2sell.eu/sitemap.html` (HTML, mauvais hôte, 0 indexée) | `aircraft2sell.eu/sitemap.xml` |
| Titres hors normes | 18 pages | 0 / 35 |
| Descriptions hors normes | 18 pages | 0 / 35 |
| Poids de l'accueil | 1128 ko | 616 ko (WebP) |
| Canonical des annonces | figé sur `/listing.html` | propre à chaque annonce (`?id=N`) |

Détail des correctifs dans l'historique git (`git log --grep=seo`).

## Actions restantes

### 1. Redirection `www` → domaine racine — ✅ RÉSOLU le 2026-09-07

**Le problème.** Google avait choisi `https://www.aircraft2sell.eu/` comme URL
canonique du site alors que toutes les pages déclarent la version sans `www`,
et la version `www` indexée était figée sur l'ancien `homepage.html`
(dernier crawl du 4 août).

**La solution appliquée.** La redirection a été posée **au niveau du domaine
Vercel**, et non sur Cloudflare : le `www` pointe sur `cname.vercel-dns.com`,
donc Vercel répond et Cloudflare relaie sa redirection. Cela contourne le
token Cloudflare en lecture seule.

```bash
PATCH https://api.vercel.com/v9/projects/<projectId>/domains/www.aircraft2sell.eu
{"redirect": "aircraft2sell.eu", "redirectStatusCode": 301}
```

**Vérifié en production** (à travers Cloudflare, avec un User-Agent navigateur —
`curl` nu reçoit un challenge 403 qui ne présage rien) :

| URL demandée | Réponse |
|---|---|
| `www.aircraft2sell.eu/` | 301 → `aircraft2sell.eu/` |
| `www.aircraft2sell.eu/search.html` | 301 → `aircraft2sell.eu/search.html` |
| `www.aircraft2sell.eu/en/index.html` | 301 → `aircraft2sell.eu/en/index.html` |
| `www…/pricing.html?utm_source=test` | 301, paramètres préservés |
| `www.aircraft2sell.eu/homepage.html` | 301 → apex → 308 → `/` → 200 |
| `aircraft2sell.eu/search.html` | 200 (l'apex ne redirige pas) |

Google mettra quelques jours à recrawler et à basculer l'URL canonique vers
l'apex. Surveiller avec :

```bash
python3 scripts/gsc-submit.py inspect https://aircraft2sell.eu/
```

`googleCanonical` doit passer de `https://www.aircraft2sell.eu/` à
`https://aircraft2sell.eu/`.

### 2. Token Vercel expiré (priorité haute)

Le déploiement automatique à chaque push échoue depuis plusieurs jours :

```
Error: The token provided via `--token` argument is not valid.
```

Les 3 derniers déploiements automatiques avaient échoué sans alerte : la
production restait figée pendant que les commits s'accumulaient.

**Correction.** Générer un token sur https://vercel.com/account/tokens, puis :

```bash
gh secret set VERCEL_TOKEN --repo Thejoker001/aircraft2sell   # CI
# puis remplacer VERCEL_TOKEN dans ~/.hermes/profiles/aircraft2sell/.env
```

*Contournement utilisé en attendant* : la session CLI locale est encore valide,
`env -u VERCEL_TOKEN vercel --prod --yes` déploie correctement (la variable
d'environnement expirée doit être neutralisée, sinon elle a priorité).

### 3. Demandes d'indexation (à faire après le point 1)

L'API d'indexation de Google est réservée aux offres d'emploi et aux
livestreams : elle ne peut pas être utilisée ici. Le sitemap couvre le besoin,
mais pour accélérer les pages stratégiques, dans Search Console >
*Inspection de l'URL* > **Demander une indexation** (10 URLs/jour environ) :

```
https://aircraft2sell.eu/
https://aircraft2sell.eu/search.html
https://aircraft2sell.eu/avions-legers.html
https://aircraft2sell.eu/jets-affaires.html
https://aircraft2sell.eu/helicopteres.html
https://aircraft2sell.eu/en/index.html
https://aircraft2sell.eu/en/search.html
https://aircraft2sell.eu/guide-acheteur.html
https://aircraft2sell.eu/pricing.html
https://aircraft2sell.eu/post-listing.html
```

À faire **après** la redirection `www`, sinon Google réindexera le mauvais hôte.

## Suivi

```bash
cd ~/aircraft2sell
set -a && . ~/.hermes/profiles/aircraft2sell/.env && set +a

python3 scripts/gsc-submit.py sitemaps   # sitemap téléchargé ? combien d'indexées ?
python3 scripts/gsc-submit.py audit      # état des 35 URLs, liste celles à pousser
python3 scripts/gen-sitemap.py --check   # le sitemap est-il périmé ?
```

Le sitemap vient d'être soumis : Google le télécharge généralement sous
quelques heures à deux jours. Relancer `sitemaps` pour confirmer, puis `audit`
une semaine plus tard pour mesurer la progression (référence de départ :
5 pages indexées sur 35).

## Contenu — leviers suivants

Le SEO technique est en place ; ce qui limite maintenant le trafic, c'est le
volume de contenu et les annonces réelles :

1. **Publier des annonces.** Une marketplace sans stock ne se classe pas : les
   pages catégorie affichent « 0 annonce » et Google mesure cette pauvreté.
2. **Alimenter le blog.** 4 guides existent ; viser un article par mois sur des
   requêtes de longue traîne (« prix révision moteur Lycoming », « immatriculer
   un avion en France »), qui convertissent mieux que les requêtes génériques.
3. **Traduire en allemand.** L'Allemagne est le premier marché européen de
   l'aviation légère ; l'infrastructure i18n (`nav.js`, `footer.js`) est prête.
4. **Obtenir des liens entrants** : annuaires d'aéroclubs, fédérations
   aéronautiques, forums pilotes — c'est le facteur qui manque le plus.
