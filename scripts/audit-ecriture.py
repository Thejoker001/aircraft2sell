#!/usr/bin/env python3
"""Mesure ce qu'un visiteur ANONYME peut lire dans chaque table.

La clé publique est lisible par tous dans supabase.js : toute ligne qu'elle
peut lire est une fuite potentielle, et toute ligne lisible est modifiable si
la politique le permet. La lecture à vide (0 ligne) est le signal fiable que
la table est verrouillée : la RLS filtre alors uniformément lecture, écriture
et suppression.

Usage : python3 scripts/audit-ecriture.py
"""
import json, urllib.request, urllib.error

SB = "https://hlivysnlzlqdjcigqgvk.supabase.co"
ANON = "sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe"

TABLES = ["users", "listings", "messages", "verification_requests",
          "analytics", "listing_views"]

# Champs considérés comme données personnelles (RGPD)
SENSIBLES = {"email", "phone", "telephone", "seller_email", "seller_phone",
             "sender_email", "receiver_email", "ip", "ip_address", "user_email",
             "doc_number", "doc_type", "name", "company"}

print("Lecture anonyme (clé publique) :\n")
print(f"{'table':<24} {'lisible':<10} champs sensibles exposés")
print("-" * 70)

fuites = 0
for t in TABLES:
    req = urllib.request.Request(
        f"{SB}/rest/v1/{t}?select=*&limit=200",
        headers={"apikey": ANON, "Authorization": f"Bearer {ANON}"})
    try:
        r = urllib.request.urlopen(req, timeout=20)
        data = json.load(r)
    except urllib.error.HTTPError as e:
        data, err = [], f"HTTP {e.code}"
        print(f"{t:<24} {err:<10} —")
        continue
    except Exception as e:
        print(f"{t:<24} {'ERR':<10} {str(e)[:40]}")
        continue

    n = len(data)
    ex = (data[0].keys() & SENSIBLES) if data else set()
    marque = f"⚠ {', '.join(sorted(ex))}" if ex else ""
    print(f"{t:<24} {n:<10} {marque}")

    if n and ex:
        fuites += 1

print("\n" + ("=" * 70))
if fuites:
    print(f"{fuites} table(s) exposent des données personnelles à un anonyme.")
    print("Interprétation : pour users/messages/verification_requests, TOUTE")
    print("lecture est une fuite. Pour listings, seul seller_email/seller_phone")
    print("sont exposés — normal pour une marketplace, mais à surveiller.")
else:
    print("Aucune donnée personnelle lisible par un visiteur anonyme.")