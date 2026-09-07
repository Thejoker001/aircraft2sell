# Assistant du site — fonctionnement et maintenance

L'assistant répond automatiquement aux questions des visiteurs (frais, dépôt
d'annonce, sécurité, compte) à partir de la FAQ publiée.

## Pourquoi cette solution plutôt qu'un service tiers

Le plan gratuit de Crisp **n'inclut aucune IA** : son agent Hugo démarre à
45 €/mois (≈ 90 conversations) et n'est réellement exploitable qu'à 95 €/mois.
Sur le plan gratuit, il faut un humain derrière le clavier — le visiteur qui
pose une question à 22 h n'obtient rien.

L'assistant maison répond seul, immédiatement, pour 0 € :

| | Crisp gratuit | Crisp payant | Assistant du site |
|---|---|---|---|
| Réponses automatiques | non | oui | **oui** |
| Coût mensuel | 0 € | 45–95 € | **0 €** |
| Disponibilité | selon présence | 24/7 | **24/7** |
| Données envoyées à un tiers | oui | oui | **aucune** |
| Risque d'invention | — | oui (LLM) | **nul** |

Le compromis assumé : l'assistant ne comprend pas les questions ouvertes ni le
contexte d'une conversation. Il fait de la recherche de pertinence sur 22
réponses officielles, et **avoue son ignorance** plutôt que d'inventer. Pour
une FAQ de marketplace, c'est le comportement souhaitable — une réponse fausse
sur une transaction à 500 000 € coûte plus cher qu'un « je ne sais pas ».

## Architecture

```
faq.html (JSON-LD)          <- source unique de vérité, indexée par Google
   |
   | python3 scripts/gen-faq-data.py
   v
faq-data.js                 <- corpus généré, 22 entrées FR + EN (17 ko)
   |
   | chargé à l'ouverture de l'assistant seulement
   v
assistant.js                <- moteur + interface, monté par footer.js
```

- **Aucun serveur, aucune clé API, aucun appel réseau externe.** Tout s'exécute
  dans le navigateur : rien à déclarer au RGPD, rien à payer, rien à surveiller.
- **Chargement différé** : `assistant.js` se charge 900 ms après le `load`, et
  le corpus seulement quand le visiteur ouvre la fenêtre. Le score PageSpeed et
  le SEO ne sont pas affectés.
- **Exclu des pages privées** (admin, dashboard, modération, tunnel de paiement).
- **Bilingue** : suit `<html lang>`, français et anglais.

## Le moteur de réponse

Score de pertinence par mots, avec trois niveaux de pondération :

| Correspondance trouvée dans | Poids |
|---|---|
| la question de la FAQ | 3 |
| les mots-clés (vocabulaire des visiteurs) | 2,6 |
| le texte de la réponse | 1,1 |

Ajustements qui se sont révélés nécessaires à l'usage :

- **Racinisation** (troncature à 5 caractères) : « commission » / « commissions »,
  « résilier » / « résiliation », « données » / « revendez » se rejoignent.
- **Couverture atténuée** (racine carrée) : sans cela, une question courte et
  précise comme « vous prenez une commission ? » tombait sous le seuil.
- **Seuil de confiance à 2,2** : en dessous, l'assistant propose le contact
  humain au lieu de répondre approximativement.

Les **mots-clés** sont le levier principal : ils portent le vocabulaire réel
des visiteurs (« arnaque », « ça coûte combien », « j'ai perdu mon mot de
passe »), très différent de celui de la FAQ. Ils se règlent dans le dict
`KEYWORDS` de `scripts/gen-faq-data.py`.

## Tests

```bash
node scripts/test-assistant.mjs   # sortie non nulle si un cas échoue
```

18 cas, écrits comme un visiteur les taperait (pas comme la FAQ les formule),
dont deux questions hors sujet qui **doivent** déclencher l'escalade email.
État actuel : 12/12 en français, 6/6 en anglais.

**Lancer ces tests après toute modification de la FAQ ou des mots-clés.**

## Ajouter ou modifier une réponse

1. Modifier la Q/R dans le JSON-LD de `faq.html` (elle sera aussi visible et
   indexée sur la page FAQ — c'est voulu, une seule source de vérité).
2. Ajouter la traduction anglaise dans le dict `EN` de
   `scripts/gen-faq-data.py`. Le script **refuse de générer** si une traduction
   manque, pour éviter que le FR et l'EN divergent.
3. Ajouter les mots-clés dans `KEYWORDS` (formulations réelles des visiteurs).
4. Régénérer et tester :

```bash
python3 scripts/gen-faq-data.py
node scripts/test-assistant.mjs
```

Deux garde-fous protègent la génération : elle échoue si une traduction
anglaise manque, et si une entrée se retrouve sans aucun mot-clé (piège des
accents — les clés de `KEYWORDS` s'écrivent sans accent, la comparaison est
faite sur un texte replié).

## Évolutions possibles

- **Recherche d'annonces dans le chat** : brancher le moteur sur Supabase pour
  répondre « montre-moi les ULM sous 80 000 € ». Pertinent une fois qu'il y a
  du stock réel.
- **Passage à un vrai LLM** : si le besoin de conversation ouverte se confirme,
  une Edge Function Supabase avec une clé OpenAI/Anthropic coûterait quelques
  euros par mois, en gardant `faq-data.js` comme contexte pour ancrer les
  réponses. À arbitrer selon le volume de questions réellement reçues.
- **Mesure d'usage** : journaliser les questions sans réponse permettrait
  d'enrichir la FAQ là où les visiteurs butent réellement.
