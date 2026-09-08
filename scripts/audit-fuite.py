#!/usr/bin/env python3
"""Mesure exactement ce qu'un visiteur anonyme peut lire.

La clé publique est visible dans supabase.js : n'importe qui peut rejouer
ces requêtes. Ce script liste les données personnelles réellement exposées.
"""
import json, urllib.request, urllib.error

SB = "https://hlivysnlzlqdjcigqgvk.supabase.co"
ANON = "sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe"
H = {"apikey": ANON, "Authorization": "Bearer " + ANON}

def get(path):
    try:
        r = urllib.request.urlopen(urllib.request.Request(SB + path, headers=H), timeout=20)
        return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:120]
    except Exception as e:
        return 0, str(e)[:120]

# Champs considérés comme données personnelles au sens du RGPD
SENSIBLES = {"email", "phone", "telephone", "seller_email", "seller_phone",
             "sender_email", "receiver_email", "ip", "ip_address", "user_email",
             "doc_number", "doc_type", "name", "company"}

TABLES = ["users", "listings", "messages", "verification_requests",
          "analytics", "listing_views", "homepage_stats"]

print("Ce qu'un visiteur anonyme peut lire avec la clé publique du site :\n")
total_expose = 0

for t in TABLES:
    st, data = get(f"/rest/v1/{t}?select=*&limit=200")
    if st != 200 or not isinstance(data, list):
        print(f"  {t:24} verrouillé (HTTP {st})")
        continue
    if not data:
        print(f"  {t:24} 0 ligne")
        continue

    champs = set(data[0].keys())
    fuite = sorted(champs & SENSIBLES)
    marque = "  <-- DONNEES PERSONNELLES" if fuite else ""
    print(f"  {t:24} {len(data):>4} ligne(s){marque}")
    if fuite:
        total_expose += len(data)
        print(f"       champs exposés : {', '.join(fuite)}")
        # Exemple concret, tronqué
        ex = data[0]
        apercu = {k: (str(ex[k])[:34] if ex[k] is not None else None) for k in fuite[:4]}
        print(f"       exemple : {apercu}")

print(f"\n{total_expose} enregistrement(s) contenant des données personnelles sont"
      f" lisibles publiquement.")

# Cas particulier : énumération de la base membres
st, u = get("/rest/v1/users?select=email,name,plan")
if st == 200 and isinstance(u, list) and u:
    print(f"\nGRAVE : la liste des {len(u)} membres est téléchargeable en une requête")
    print("        (nom, email, formule d'abonnement) — violation RGPD.")
