#!/usr/bin/env python3
"""
Récupère le taux de change EUR -> USD (API gratuite Frankfurter, pas de clé
requise, source BCE) et l'écrit dans exchange-rate.json à la racine du site.
Ce fichier est servi statiquement par Vercel et lu par le JS front
(search.html / listing.html) pour afficher la contre-valeur USD sous les
prix en devise étrangère, sans dépendre d'un appel API côté visiteur.

Idempotent : si le taux n'a pas changé, le fichier n'est pas réécrit (évite
un commit vide). Ne lève jamais d'exception fatale : en cas d'échec réseau,
le fichier existant est conservé tel quel (le site continue de fonctionner
avec le dernier taux connu, juste pas mis à jour ce jour-là).
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

OUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "exchange-rate.json")
# Toutes les devises utilisables pour poster une annonce (post-listing.html),
# afin de pouvoir convertir n'importe quel prix vers USD, pas seulement l'EUR.
SYMBOLS = "USD,GBP,CHF,CAD,AUD,AED"
API_URL = f"https://api.frankfurter.app/latest?base=EUR&symbols={SYMBOLS}"


def fetch_rate():
    req = urllib.request.Request(API_URL, headers={"User-Agent": "Aircraft2Sell-RateUpdater/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)
    rates = data.get("rates", {})
    usd = rates.get("USD")
    if not usd or not isinstance(usd, (int, float)) or usd <= 0:
        raise ValueError(f"Taux USD invalide dans la réponse API: {data}")
    return rates


def main():
    try:
        rates = fetch_rate()
    except Exception as e:
        print(f"[exchange-rate] Échec récupération taux ({e}), fichier existant conservé.", file=sys.stderr)
        return 0  # pas d'échec fatal du cron global

    new_content = {
        "base": "EUR",
        "rates": {k: round(v, 5) for k, v in rates.items()},
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "frankfurter.app (BCE)",
    }

    old_content = None
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, "r", encoding="utf-8") as f:
                old_content = json.load(f)
        except Exception:
            old_content = None

    # Évite un commit inutile si les taux (arrondis) n'ont pas bougé.
    if old_content and old_content.get("rates") == new_content["rates"]:
        print(f"[exchange-rate] Taux inchangés, rien à écrire.")
        return 0

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(new_content, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"[exchange-rate] Mis à jour : {new_content['rates']} ({new_content['updated_at']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
