#!/usr/bin/env python3
"""Vérifie la messagerie de bout en bout avec un vrai jeton de session.

Simule ce que fait messages.html une fois l'utilisateur connecté :
lecture de la boîte, envoi, relecture, marquage lu.
"""
import json, os, urllib.request, urllib.error, time

URL = os.environ["SUPABASE_URL"]
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANON = "sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe"
A = "leclercromain01@gmail.com"          # utilisateur connecté
B = "contact@aircraft2sell.eu"           # correspondant

R = []
def ok(n, c, d=""):
    R.append((n, bool(c), str(d)))

def call(method, path, body=None, headers=None, prefer=None):
    h = dict(headers or {})
    if prefer:
        h["Prefer"] = prefer
    if body is not None:
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(
        f"{URL}{path}", data=json.dumps(body).encode() if body is not None else None,
        headers=h, method=method)
    try:
        r = urllib.request.urlopen(req, timeout=20)
        txt = r.read().decode()
        return r.status, (json.loads(txt) if txt.strip() else [])
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]

def session(email):
    st, lien = call("POST", "/auth/v1/admin/generate_link",
                    {"type": "magiclink", "email": email},
                    {"apikey": KEY, "Authorization": f"Bearer {KEY}"})
    th = lien.get("hashed_token") or lien.get("properties", {}).get("hashed_token")
    st, s = call("POST", "/auth/v1/verify",
                 {"type": "magiclink", "token_hash": th}, {"apikey": ANON})
    return s.get("access_token")

jwtA = session(A)
ok("session utilisateur obtenue", bool(jwtA), f"{len(jwtA or '')} caractères")
hA = {"apikey": ANON, "Authorization": f"Bearer {jwtA}"}

# 1. Boîte de réception
st, boite = call("GET",
    f"/rest/v1/messages?select=*&or=(sender_email.eq.{A},receiver_email.eq.{A})&order=created_at.desc&limit=50", None, hA)
ok("boite de reception lisible", st == 200 and isinstance(boite, list), f"HTTP {st}, {len(boite) if isinstance(boite,list) else 0} message(s)")
ok("les messages existants sont visibles", isinstance(boite, list) and len(boite) > 0,
   f"{len(boite) if isinstance(boite,list) else 0} message(s)")

# 2. Envoi d'un message (comme messages.html corrigé : return=minimal)
thread = f"diag-{int(time.time())}"
st, _ = call("POST", "/rest/v1/messages",
             {"thread_id": thread, "listing_id": None, "sender_email": A,
              "receiver_email": B, "content": "Diagnostic messagerie", "read": False},
             hA, prefer="return=minimal")
ok("envoi d'un message", st in (201, 204), f"HTTP {st}")

# 3. Relecture du fil
st, fil = call("GET", f"/rest/v1/messages?thread_id=eq.{thread}&select=*", None, hA)
ok("message relu dans le fil", isinstance(fil, list) and len(fil) == 1, f"{len(fil) if isinstance(fil,list) else 0}")

# 4. Marquage lu
if isinstance(fil, list) and fil:
    st, _ = call("PATCH", f"/rest/v1/messages?thread_id=eq.{thread}",
                 {"read": True}, hA, prefer="return=minimal")
    ok("marquage lu", st in (200, 204), f"HTTP {st}")

# 5. Cloisonnement : la clé publique seule ne doit rien voir
st, pub = call("GET", "/rest/v1/messages?select=id&limit=10", None,
               {"apikey": ANON, "Authorization": f"Bearer {ANON}"})
ok("cloisonnement : cle publique ne lit rien", isinstance(pub, list) and len(pub) == 0,
   f"{len(pub) if isinstance(pub,list) else pub} message(s)")

# Nettoyage
call("DELETE", f"/rest/v1/messages?thread_id=eq.{thread}", None,
     {"apikey": KEY, "Authorization": f"Bearer {KEY}"})

passed = sum(1 for _, c, _ in R if c)
for n, c, d in R:
    print(f"  {'OK  ' if c else 'FAIL'} {n}" + (f" ({d})" if d else ""))
print(f"\n{passed}/{len(R)} tests réussis")
raise SystemExit(0 if passed == len(R) else 1)
