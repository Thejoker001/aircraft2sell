#!/usr/bin/env python3
"""Un utilisateur AUTHENTIFIÉ peut-il lire ses messages ?

Génère un jeton de session via l'API admin (magic link), puis interroge
/rest/v1/messages avec ce jeton. Détermine si une politique RLS de lecture
existe pour le rôle `authenticated`.
"""
import json, os, urllib.request, urllib.error

URL = os.environ["SUPABASE_URL"]
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANON = "sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe"
EMAIL = "leclercromain01@gmail.com"


def post(path, body, headers):
    req = urllib.request.Request(
        f"{URL}{path}", data=json.dumps(body).encode(),
        headers={**headers, "Content-Type": "application/json"}, method="POST")
    try:
        return json.load(urllib.request.urlopen(req, timeout=20))
    except urllib.error.HTTPError as e:
        return {"_erreur": e.code, "_corps": e.read().decode()[:200]}


def get(path, headers):
    req = urllib.request.Request(f"{URL}{path}", headers=headers)
    try:
        r = urllib.request.urlopen(req, timeout=20)
        return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]


# 1) Générer un lien de connexion pour obtenir un jeton de session valide
lien = post("/auth/v1/admin/generate_link",
            {"type": "magiclink", "email": EMAIL},
            {"apikey": KEY, "Authorization": f"Bearer {KEY}"})

if "_erreur" in lien:
    print("Impossible de générer le lien :", lien["_erreur"], lien["_corps"])
    raise SystemExit(1)

token_hash = lien.get("hashed_token") or lien.get("properties", {}).get("hashed_token")
print(f"Lien de connexion généré pour {EMAIL}")

# 2) Échanger le jeton contre une session
sess = post("/auth/v1/verify",
            {"type": "magiclink", "token_hash": token_hash},
            {"apikey": ANON})

if "_erreur" in sess:
    print("Échange impossible :", sess["_erreur"], sess["_corps"])
    raise SystemExit(1)

jwt = sess.get("access_token")
print(f"Session obtenue (jeton {len(jwt)} caractères)\n")

# 3) Lire les messages AVEC le jeton utilisateur
hdr_auth = {"apikey": ANON, "Authorization": f"Bearer {jwt}"}
st, data = get("/rest/v1/messages?select=id,sender_email,receiver_email&limit=20", hdr_auth)
n_auth = len(data) if isinstance(data, list) else data
print(f"  utilisateur authentifié : HTTP {st} — {n_auth} message(s)")

# 4) Comparer avec la clé publique seule
hdr_anon = {"apikey": ANON, "Authorization": f"Bearer {ANON}"}
st2, data2 = get("/rest/v1/messages?select=id&limit=20", hdr_anon)
n_anon = len(data2) if isinstance(data2, list) else data2
print(f"  clé publique seule      : HTTP {st2} — {n_anon} message(s)")

# 5) Vérité terrain
st3, data3 = get("/rest/v1/messages?select=id&limit=100",
                 {"apikey": KEY, "Authorization": f"Bearer {KEY}"})
print(f"  service_role (réalité)  : HTTP {st3} — {len(data3)} message(s)\n")

if isinstance(n_auth, int) and n_auth > 0:
    print("=> Une politique SELECT existe pour `authenticated`.")
    print("   Il suffit que le front envoie le jeton de session : OPTION A.")
else:
    print("=> AUCUNE politique SELECT, même pour un utilisateur authentifié.")
    print("   La boîte de réception restera vide tant que le SQL n'est pas appliqué.")
