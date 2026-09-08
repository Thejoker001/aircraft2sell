#!/usr/bin/env python3
"""Sauvegarde les tables Supabase en JSON horodaté.

À lancer avant toute opération sensible. Tant que la base est ouverte en
écriture (voir supabase/securite-base.sql), une sauvegarde récente est la
seule protection contre une suppression accidentelle ou malveillante.

Usage : python3 scripts/sauvegarde.py [dossier]
"""
import json, os, pathlib, sys, urllib.request, urllib.error
from datetime import datetime

URL = os.environ.get("SUPABASE_URL", "")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not (URL and KEY):
    print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absents de l'environnement.")
    sys.exit(1)

TABLES = ["users", "listings", "messages", "verification_requests",
          "analytics", "listing_views"]

dest = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else
                    pathlib.Path.home() / "aircraft2sell-sauvegardes")
horodatage = datetime.now().strftime("%Y%m%d-%H%M%S")
dossier = dest / horodatage
dossier.mkdir(parents=True, exist_ok=True)


def lire(table):
    """Pagination : PostgREST plafonne les réponses."""
    lignes, offset, taille = [], 0, 1000
    while True:
        req = urllib.request.Request(
            f"{URL}/rest/v1/{table}?select=*&limit={taille}&offset={offset}",
            headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"})
        try:
            lot = json.load(urllib.request.urlopen(req, timeout=60))
        except urllib.error.HTTPError as e:
            return None, f"HTTP {e.code}"
        lignes.extend(lot)
        if len(lot) < taille:
            return lignes, None
        offset += taille


total = 0
resume = {}
for t in TABLES:
    lignes, err = lire(t)
    if err:
        print(f"  {t:24} ÉCHEC ({err})")
        resume[t] = err
        continue
    (dossier / f"{t}.json").write_text(
        json.dumps(lignes, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  {t:24} {len(lignes):>5} ligne(s)")
    resume[t] = len(lignes)
    total += len(lignes)

(dossier / "_resume.json").write_text(json.dumps({
    "date": datetime.now().isoformat(timespec="seconds"),
    "projet": URL,
    "tables": resume,
    "total": total,
}, ensure_ascii=False, indent=1), encoding="utf-8")

print(f"\n{total} enregistrement(s) sauvegardés dans :\n  {dossier}")
