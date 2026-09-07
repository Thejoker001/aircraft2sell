# Espace d'administration — v3

Fichier unique : `admin-a2s00760.html` (2453 lignes, 10 onglets, 92 fonctions).
URL volontairement non devinable, `noindex, nofollow`, exclue du sitemap.

## Lancer les tests

```bash
python3 -m http.server 8799 &          # depuis la racine du dépôt
node scripts/test-admin.mjs            # 45 assertions
python3 scripts/check-page.py admin-a2s00760.html
```

`test-admin.mjs` injecte un jeu de 68 annonces et 42 membres, parcourt les
10 onglets et vérifie compteurs, tri, pagination, sélection multiple, palette
de commandes, recherche globale et toasts annulables. Sortie non nulle si un
test échoue — utilisable en CI.

## Les 10 onglets

| Onglet | Raccourci | Rôle |
|---|---|---|
| Tableau de bord | `1` | Indicateurs, accès rapides, annonces récentes |
| Modération | `2` | File d'attente, approbation / rejet |
| Annonces | `3` | Tableau complet, tri, filtres, actions groupées |
| Créer une annonce | `4` | Formulaire de saisie |
| Membres | `5` | Comptes, plans, certification |
| Vérifications | `6` | Demandes de vérification d'identité |
| Abonnements | `7` | Suivi des plans et du MRR |
| Statistiques | `8` | Pages vues, pays, villes, sources |
| Messages | `9` | Demandes de contact |
| Paramètres | `0` | Réglages et zone sensible |

## Raccourcis clavier

| Touche | Action |
|---|---|
| `1`–`9`, `0` | Onglet direct |
| `Ctrl/Cmd + K` | Palette de commandes |
| `/` | Recherche globale |
| `R` | Actualiser |
| `Échap` | Fermer modale / palette |

Les raccourcis sont inactifs pendant une saisie (`input`, `textarea`, `select`).

## Nouveautés de la v3

- **Sélection multiple et actions groupées** : cocher des lignes fait
  apparaître une barre permettant de publier, rejeter ou supprimer en lot.
  La sélection survit au changement de page et au tri.
- **Pagination** 25 lignes (annonces et membres). Sans elle, plusieurs
  centaines d'annonces figeaient la page à chaque rendu.
- **Tri** sur toutes les colonnes, avec indicateur de sens.
- **Palette de commandes** (`Ctrl+K`) : 16 actions, filtrage insensible aux
  accents, navigation au clavier.
- **Actualisation automatique** toutes les 60 s, suspendue quand l'onglet est
  en arrière-plan ou qu'une modale est ouverte ; relance au retour sur l'onglet.
- **Densité d'affichage** commutable, mémorisée dans `localStorage`.
- **Toasts annulables** : les actions réversibles s'appliquent immédiatement et
  restent annulables 6 secondes, au lieu d'un `confirm()` bloquant.

## Bugs de la v2 corrigés

| Symptôme | Cause |
|---|---|
| Compteurs de la barre latérale toujours à 0 | `updateSidebar()` écrivait dans `sk-ann`, `sk-pnd`, `sk-usr`, `sk-mrr` — aucun de ces ids n'existait dans le markup |
| Pastilles de navigation vides | `updateSidebarBadges()` visait `mod-badge`/`list-badge`/`users-badge`, le markup portait `badge-*` |
| Top des villes jamais affiché | `renderStats()` alimentait `st-cities`, conteneur absent |
| Bandeau « filtré par vendeur » invisible | `viewSellerListings()` cherchait l'ancre `ls-header`, absente |
| Recherche globale inutilisable | Basculait d'onglet et affichait une erreur à chaque frappe |
| Bouton « Annuler » disparaissant | `showToast()` écrasait le contenu du toast en cours |

## Points d'attention

- **Ne pas renommer les classes `.mr*`** : `.lc` de `styles.css` (carte publique
  en colonne) entrait en collision et cassait les cartes de modération.
- **`<i data-icon>` ne fonctionne pas dans du HTML injecté par JS** :
  l'hydratation n'a lieu qu'au chargement. Utiliser `A2SIcon('nom')`.
- **Les `confirm()` sur les suppressions sont volontaires** : une suppression
  en base n'est pas rattrapable, contrairement à un changement de statut.
- **`:has()` n'est pas utilisé** (absent de Firefox < 121) : le masquage des
  barres d'outils vides se fait via `markEmptyToolbars()`.
- Les appels Supabase des actions groupées sont **séquentiels**, pour ne pas
  saturer l'API ; les échecs sont comptés et signalés, jamais silencieux.
