#!/usr/bin/env python3
"""Régénère CRISP-SETUP.md à partir des Q/R de faq.html (JSON-LD).

La FAQ du site est la source unique de vérité : ce script évite que les
réponses du chat divergent de celles publiées (et indexées par Google).

Usage : python3 scripts/gen-crisp-faq.py
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Mots-clés de déclenchement, par fragment de question.
KEYWORDS = {
    'commission': 'commission, frais, pourcentage, gratuit, coût, tarif, prix du service',
    'déposer': 'déposer, publier, poster, mettre en vente, vendre, annonce',
    'validée': 'validation, refusée, rejetée, délai, en attente, modération',
    'vérifiées': 'vérifiée, fiable, arnaque, confiance, sécurité, escroquerie',
    'données': 'rgpd, données, confidentialité, vie privée, personnelles',
    'abonnement': 'abonnement, résilier, formule, plan, mensuel, facture, paiement',
    'compte': 'compte, inscription, gratuit, créer un compte, mot de passe',
    'contacter': 'contacter, vendeur, message, joindre, appeler',
}

HEADER = """# Aircraft2Sell — Scénarios de réponse pour Crisp

Source unique de vérité : `faq.html` (JSON-LD). Si la FAQ change, régénérer
ce fichier avec `python3 scripts/gen-crisp-faq.py` et réimporter dans Crisp.

## Installation (5 minutes)

1. Créer un compte sur https://crisp.chat (plan gratuit suffisant).
2. Paramètres > Paramètres du site > copier l'**Identifiant du site**.
3. Coller cet identifiant dans `chat.js`, variable `CRISP_WEBSITE_ID`.
   Tant qu'elle est vide, le chat est totalement inerte (aucune requête réseau).
4. Crisp > Paramètres > Chatbot (ou Réponses rapides) : créer un scénario par
   entrée ci-dessous, en collant les mots-clés et la réponse.
5. Boîte de réception > Paramètres : brancher `contact@aircraft2sell.eu` pour
   recevoir les conversations manquées par email.

## Réglages recommandés

- **Langue** : le widget suit `document.documentElement.lang` (fr/en/de/it/es).
- **Message d'absence** : « Nous répondons sous 24 h ouvrées. Laissez-nous votre
  email et nous revenons vers vous. »
- **RGPD** : activer l'anonymisation IP et la rétention à 6 mois
  (Crisp héberge en UE, cohérent avec la politique de confidentialité du site).

---

## Réponses rapides
"""

FOOTER = """---

## Escalade vers un humain

Si la question sort de ce périmètre (litige, dossier technique précis,
demande professionnelle), répondre :

> Je transmets votre demande à l'équipe Aircraft2Sell. Laissez-nous votre
> email et nous vous répondons sous 24 h ouvrées — ou écrivez directement
> à contact@aircraft2sell.eu.
"""


def extract_faq(path):
    """Retourne [(question, réponse), ...] depuis les blocs JSON-LD FAQPage."""
    src = open(path, encoding='utf-8').read()
    pairs = []
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', src, re.S):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        for entry in data.get('mainEntity', []) or []:
            answer = entry.get('acceptedAnswer', {}).get('text', '')
            answer = re.sub(r'\s+', ' ', re.sub('<[^>]+>', '', html.unescape(answer))).strip()
            question = (entry.get('name') or '').strip()
            if question and answer:
                pairs.append((question, answer))
    return pairs


def main():
    faq = os.path.join(ROOT, 'faq.html')
    pairs = extract_faq(faq)
    if not pairs:
        raise SystemExit('Aucune Q/R trouvée dans faq.html — vérifier le JSON-LD.')

    out = [HEADER]
    for question, answer in pairs:
        kws = next((v for k, v in KEYWORDS.items() if k.lower() in question.lower()), '')
        out.append(f'### {question}')
        if kws:
            out.append(f'*Mots-clés :* {kws}')
        out.append('')
        out.append(answer)
        out.append('')
    out.append(FOOTER)

    dest = os.path.join(ROOT, 'CRISP-SETUP.md')
    open(dest, 'w', encoding='utf-8').write('\n'.join(out))
    print(f'{dest} régénéré — {len(pairs)} réponses.')


if __name__ == '__main__':
    main()
