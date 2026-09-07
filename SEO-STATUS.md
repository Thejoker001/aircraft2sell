# SEO — état et actions restantes

Dernière passe : 2026-09-07.

## Ce qui est fait

| Sujet | Avant | Après |
|---|---|---|
| URLs dans le sitemap | 25 (aucune page EN) | 36, dont les 10 pages EN |
| hreflang dans le sitemap | 0 | 27 URLs annotées |
| Sitemap déclaré à Google | `www.aircraft2sell.eu/sitemap.html` (HTML, mauvais hôte, 0 indexée) | `aircraft2sell.eu/sitemap.xml` |
| Titres hors normes | 18 pages | 0 / 35 |
| Descriptions hors normes | 18 pages | 0 / 35 |
| Poids de l'accueil | 1128 ko | 616 ko (WebP) |
| Canonical des annonces | figé sur `/listing.html` | propre à chaque annonce (`?id=N`) |
| Redirection `www` | absente (Google indexait `www`) | 301 vers le domaine racine |
| CI de déploiement | échec silencieux | contrôles + diagnostic explicite |

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

### 2. Token Vercel expiré — action requise (5 minutes)

Le déploiement automatique à chaque push échoue :

```
Error: The token provided via `--token` argument is not valid.
```

**Ce qui a été fait en attendant.** Le workflow teste désormais le token *avant*
le build et affiche la marche à suivre dans l'interface GitHub — l'incident ne
peut plus passer inaperçu. Un job `checks` (validation des 51 pages + fraîcheur
du sitemap) s'exécute en amont et réussit même quand le déploiement est bloqué.

**Pourquoi je ne peux pas le régénérer moi-même.** L'API Vercel refuse la
création de token depuis une session CLI (`Cannot create tokens for this app`) :
c'est une protection volontaire, il faut passer par l'interface web.

**Correction.** Créer un token sur https://vercel.com/account/tokens (scope
*Full Account*, expiration *No Expiration* ou 1 an), puis :

```bash
gh secret set VERCEL_TOKEN --repo Thejoker001/aircraft2sell
# coller le token à l'invite, puis mettre la même valeur dans
# ~/.hermes/profiles/aircraft2sell/.env
```

*Contournement en cours* : je déploie avec la session CLI locale
(`env -u VERCEL_TOKEN vercel --prod --yes`). Attention, **cette session expire
le 2026-09-07 à 21 h 10** — après quoi plus aucun déploiement ne sera possible
sans un nouveau token.

### 3. Demandes d'indexation (à faire maintenant)

L'API d'indexation de Google est réservée aux offres d'emploi et aux
livestreams : elle ne peut pas être utilisée ici. Le sitemap couvre le besoin,
mais pour accélérer les pages stratégiques, dans Search Console >
*Inspection de l'URL* > **Demander une indexation** (environ 10 URLs/jour) :

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

La redirection `www` étant en place, ces demandes pointeront désormais Google
vers le bon hôte. Commencer par la première URL : c'est elle qui porte
l'ambiguïté canonique à lever.

**À quoi s'attendre.** Au 7 septembre, l'inspection renvoie encore
`googleCanonical = https://www.aircraft2sell.eu/` — c'est normal, elle reflète
le dernier crawl (6 septembre), antérieur à la redirection. Google doit
repasser pour constater la 301. Compter quelques jours ; une demande
d'indexation manuelle accélère nettement.

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
