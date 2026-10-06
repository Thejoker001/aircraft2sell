# API Aircraft2Sell — gestion d'annonces par clé API

Cette API permet à un système tiers (site de dealer/broker, CRM, logiciel métier)
de gérer ses propres annonces sur Aircraft2Sell : lecture, création, modification,
suppression.

## Obtenir une clé

1. Connectez-vous sur [aircraft2sell.eu/dashboard.html](https://aircraft2sell.eu/dashboard.html).
2. Onglet **Mon compte → Clé API**.
3. Cliquez sur **Générer une nouvelle clé**.
4. La clé (format `a2s_live_...`) n'est affichée **qu'une seule fois**. Notez-la en
   lieu sûr — elle ne peut pas être récupérée après coup, seulement révoquée et
   remplacée par une nouvelle.

Chaque clé est strictement rattachée à votre compte vendeur : toutes les opérations
ci-dessous ne portent que sur **vos propres annonces**, jamais celles d'un autre
vendeur.

## Authentification

Toutes les requêtes doivent inclure l'en-tête :

```
X-API-Key: a2s_live_votre_cle
```

Base URL : `https://aircraft2sell.eu`

## Limites

- **60 requêtes / minute** par clé (HTTP 429 au-delà).
- Les nouvelles annonces créées via l'API passent par la **même modération** que
  les dépôts manuels : statut `pending` à la création, publiées (`live`) après
  validation par un administrateur Aircraft2Sell.
- Catégories acceptées : `light`, `jet`, `turbo`, `heli`, `ulm`, `airliner`.
- Statuts modifiables via l'API : `live`, `pending`, `sold` (le statut `rejected`
  reste réservé à la modération admin).

## Routes

### Lister ses annonces

```
GET /api/listings
```

```bash
curl https://aircraft2sell.eu/api/listings \
  -H "X-API-Key: a2s_live_..."
```

Réponse `200` :
```json
{ "listings": [ { "id": 123, "make": "Cessna", "model": "182", "status": "live", "...": "..." } ], "count": 1 }
```

### Récupérer une annonce précise

```
GET /api/listings?id=123
```

Réponse `200` : `{ "listing": { ... } }` — ou `404` si l'annonce n'existe pas ou
n'appartient pas à ce compte.

### Créer une annonce

```
POST /api/listings
Content-Type: application/json
```

Corps (champs requis : `make`, `model`, `price`, `category`) :
```json
{
  "make": "Cessna",
  "model": "182 Skylane",
  "year": "2015",
  "price": "185000",
  "currency": "EUR",
  "category": "light",
  "airport": "LFPG",
  "country": "France",
  "description": "Très bon état, double commande, avionique récente.",
  "photos": ["https://.../photo1.jpg"]
}
```

Réponse `201` : `{ "listing": { "id": ..., "status": "pending", "...": "..." } }`

### Modifier une annonce

```
PATCH /api/listings?id=123
Content-Type: application/json
```

Corps : tout sous-ensemble de `make, model, year, price, currency, category,
airport, country, description, photos, status`.

```bash
curl -X PATCH "https://aircraft2sell.eu/api/listings?id=123" \
  -H "X-API-Key: a2s_live_..." \
  -H "Content-Type: application/json" \
  -d '{"price": "179000", "status": "sold"}'
```

Réponse `200` : `{ "listing": { ... } }` — ou `404` si l'annonce n'appartient pas
à ce compte.

### Supprimer une annonce

```
DELETE /api/listings?id=123
```

Réponse `200` : `{ "ok": true, "id": "123" }`.

## Codes d'erreur

| Code | Signification |
|---|---|
| 400 | Champ requis manquant ou invalide (prix, catégorie, statut) |
| 401 | Clé API absente, invalide ou révoquée |
| 404 | Annonce introuvable ou n'appartenant pas à ce compte |
| 429 | Limite de 60 requêtes/minute dépassée |
| 502/503 | Erreur serveur ou base de données indisponible |

## Révoquer une clé

Depuis le dashboard, onglet **Mon compte → Clé API**, bouton **Révoquer** face à
la clé concernée. L'effet est immédiat : toute intégration utilisant cette clé
cesse de fonctionner.

## Support

Pour toute question d'intégration : contact@aircraft2sell.eu
