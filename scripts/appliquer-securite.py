#!/usr/bin/env python3
"""Applique supabase/securite-base.sql via la Management API Supabase.

Usage :
  SUPABASE_ACCESS_TOKEN=sbp_xxx python3 scripts/appliquer-securite.py
  SUPABASE_ACCESS_TOKEN=sbp_xxx python3 scripts/appliquer-securite.py --dry

Le SQL est envoyé en un seul bloc : PostgreSQL exécute le tout dans une
transaction, donc soit l'ensemble passe, soit rien n'est modifié.
"""
import json, os, pathlib, sys, urllib.request, urllib.error

RACINE = pathlib.Path(__file__).resolve().parent.parent
SQL = RACINE / "supabase" / "securite-base.sql"
REF = os.environ.get("SUPABASE_PROJECT_REF", "hlivysnlzlqdjcigqgvk")
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
DRY = "--dry" in sys.argv

if not TOKEN:
    print("SUPABASE_ACCESS_TOKEN absent.")
    print("Créer un jeton : https://supabase.com/dashboard/account/tokens")
    sys.exit(1)
if not SQL.exists():
    print(f"Fichier introuvable : {SQL}")
    sys.exit(1)

sql = SQL.read_text(encoding="utf-8")
print(f"Fichier : {SQL.relative_to(RACINE)} ({len(sql)} caractères)")
print(f"Projet  : {REF}\n")

if DRY:
    print("Simulation — rien n'est envoyé.")
    sys.exit(0)


def requete(chemin, corps=None, methode="GET"):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/{chemin}",
        data=json.dumps(corps).encode() if corps else None,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
            # Sans User-Agent de navigateur, Cloudflare renvoie 403 (code 1010)
            # indépendamment de la validité du jeton.
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
        },
        method=methode,
    )
    try:
        r = urllib.request.urlopen(req, timeout=90)
        txt = r.read().decode()
        return r.status, (json.loads(txt) if txt.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]


# 1. Le jeton est-il valide, et le projet accessible ?
st, projets = requete("projects")
if st != 200:
    print(f"Jeton refusé (HTTP {st}) : {projets}")
    sys.exit(1)
noms = {p["id"]: p["name"] for p in projets} if isinstance(projets, list) else {}
if REF not in noms:
    print(f"Le projet {REF} n'est pas accessible avec ce jeton.")
    print("Projets visibles :", ", ".join(f"{k} ({v})" for k, v in noms.items()) or "aucun")
    sys.exit(1)
print(f"Jeton valide — projet « {noms[REF]} » accessible.\n")

# 2. Exécution
st, res = requete(f"projects/{REF}/database/query", {"query": sql}, "POST")
if st not in (200, 201):
    print(f"ÉCHEC (HTTP {st})")
    print(res)
    sys.exit(1)

print("SQL appliqué avec succès.\n")
print("Vérification recommandée :")
print("  python3 scripts/audit-ecriture.py")
print("  python3 scripts/audit-fuite.py")
print("  node scripts/test-features.mjs")
