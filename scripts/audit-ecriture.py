#!/usr/bin/env python3
"""Teste les ÉCRITURES possibles avec la clé publique du site.

Une fuite en lecture expose des données. Une écriture ouverte permet de les
détruire. Ce script mesure les deux, sans jamais modifier de donnée réelle :
les tests d'écriture visent des enregistrements inexistants et les DELETE
portent sur des filtres qui ne correspondent à rien.
"""
import json, urllib.request, urllib.error

SB = "https://hlivysnlzlqdjcigqgvk.supabase.co"
ANON = "sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe"
H = {"apikey": ANON, "Authorization": "Bearer " + ANON,
     "Content-Type": "application/json", "Prefer": "return=minimal"}

SENTINELLE = "sonde-securite-inexistant@a2s.invalid"

def appel(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(SB + path, data=data, headers=H, method=method)
    try:
        return urllib.request.urlopen(req, timeout=20).status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0

TABLES = ["users", "listings", "messages", "verification_requests",
          "analytics", "listing_views"]

print("Ce qu'un visiteur anonyme peut faire avec la clé publique du site :\n")
print(f"{'table':<24} {'lire':<10} {'modifier':<12} {'supprimer':<12}")
print("-" * 60)

critiques = []
for t in TABLES:
    # LECTURE
    try:
        r = urllib.request.urlopen(urllib.request.Request(
            f"{SB}/rest/v1/{t}?select=*&limit=1",
            headers={"apikey": ANON, "Authorization": "Bearer " + ANON}), timeout=20)
        lignes = json.load(r)
        lire = f"{len(lignes)} ligne" if lignes else "vide"
        peut_lire = bool(lignes)
    except urllib.error.HTTPError as e:
        lire, peut_lire = f"HTTP {e.code}", False

    # MODIFIER — filtre sur une valeur inexistante : 204 = autorisé, 0 ligne touchée
    col = "email" if t in ("users", "verification_requests") else (
          "sender_email" if t == "messages" else "id")
    val = SENTINELLE if col.endswith("email") else "-999999999"
    champ = {"status": "sonde"} if t in ("users", "listings") else {"read": True}
    st_mod = appel("PATCH", f"/rest/v1/{t}?{col}=eq.{val}", champ)
    peut_mod = st_mod in (200, 204)

    # SUPPRIMER — même filtre inexistant
    st_del = appel("DELETE", f"/rest/v1/{t}?{col}=eq.{val}")
    peut_del = st_del in (200, 204)

    def marque(ok, code):
        return ("OUI" if ok else f"non ({code})")

    print(f"{t:<24} {lire:<10} {marque(peut_mod, st_mod):<12} {marque(peut_del, st_del):<12}")

    if peut_mod or peut_del:
        critiques.append((t, peut_mod, peut_del))
    if peut_lire and t in ("users", "messages", "verification_requests"):
        critiques.append((t + " (lecture)", False, False))

print()
if critiques:
    print("CRITIQUE — un visiteur peut altérer ou détruire des données :")
    for t, m, d in critiques:
        actions = []
        if m: actions.append("modifier")
        if d: actions.append("supprimer")
        print(f"  {t}" + (f" : {', '.join(actions)}" if actions else ""))
    print("\nUne seule requête suffirait à vider une table entière.")
else:
    print("Aucune écriture anonyme possible.")
