#!/usr/bin/env python3
"""Ajoute les balises hreflang fr/en/x-default sur les 15 articles de blog FR,
juste après leur <link rel="canonical">. Idempotent (ne touche pas un fichier
qui a déjà hreflang)."""
import re

ARTICLES = [
    "assurance-aeronef-guide.html", "comment-financer-avion-leger.html",
    "copropriete-avion-guide.html", "cout-entretien-avion-leger.html",
    "delai-vente-avion.html", "documents-obligatoires-vente-avion.html",
    "guide-acheteur.html", "immatriculation-aeronef-europe.html",
    "importer-avion-usa-europe.html", "inspection-pre-achat-avion.html",
    "licence-pilote-prive-cout.html", "louer-ou-acheter-avion.html",
    "pieges-achat-avion-occasion.html", "turbopropulseur-ou-jet-affaires.html",
    "vendre-avion-particulier-europe.html",
]

BASE = "https://aircraft2sell.eu"

for fname in ARTICLES:
    with open(fname, encoding="utf-8") as f:
        html = f.read()
    if "hreflang" in html:
        print(f"SKIP (déjà présent) : {fname}")
        continue
    canon_match = re.search(r'<link rel="canonical" href="([^"]+)">\n', html)
    if not canon_match:
        print(f"ERREUR : pas de canonical trouvé dans {fname}")
        continue
    insert_after = canon_match.end()
    block = (
        f'<link rel="alternate" hreflang="fr" href="{BASE}/{fname}">\n'
        f'<link rel="alternate" hreflang="en" href="{BASE}/en/{fname}">\n'
        f'<link rel="alternate" hreflang="x-default" href="{BASE}/{fname}">\n'
    )
    html = html[:insert_after] + block + html[insert_after:]
    with open(fname, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"OK : {fname}")
