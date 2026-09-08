#!/usr/bin/env python3
"""Vérifie la réception réelle des notifications dans la boîte contact@.

Se connecte en IMAP (Zimbra) et liste les messages récents envoyés par le
système de notification. Confirme que les emails ne sont pas seulement
« acceptés par Brevo » mais bien arrivés.
"""
import imaplib, email, os, ssl
from email.header import decode_header
from datetime import datetime, timedelta

HOST = os.environ.get("ZIMBRA_IMAP_HOST", "")
PORT = int(os.environ.get("ZIMBRA_IMAP_PORT", "993"))
USER = os.environ.get("ZIMBRA_USER", "")
PWD  = os.environ.get("ZIMBRA_PASSWORD", "")

if not (HOST and USER and PWD):
    print("Identifiants IMAP absents du .env — vérification impossible.")
    raise SystemExit(0)

def lisible(v):
    if not v:
        return ""
    out = []
    for part, enc in decode_header(v):
        out.append(part.decode(enc or "utf-8", errors="replace") if isinstance(part, bytes) else part)
    return "".join(out)

ctx = ssl.create_default_context()
try:
    M = imaplib.IMAP4_SSL(HOST, PORT, ssl_context=ctx)
    M.login(USER, PWD)
except Exception as e:
    print(f"Connexion IMAP impossible : {e}")
    raise SystemExit(0)

M.select("INBOX")
depuis = (datetime.now() - timedelta(hours=2)).strftime("%d-%b-%Y")
typ, data = M.search(None, f'(SINCE {depuis})')
ids = data[0].split()

print(f"Boîte {USER} — {len(ids)} message(s) depuis {depuis}\n")

ATTENDUS = {
    "Nouvelle annonce à modérer": False,
    "Votre annonce est en ligne": False,
    "n'a pas été validée": False,
    "Message reçu": False,
    "Nouveau message": False,
}

for i in reversed(ids[-25:]):
    typ, d = M.fetch(i, "(RFC822.HEADER)")
    msg = email.message_from_bytes(d[0][1])
    suj = lisible(msg.get("Subject"))
    exp = lisible(msg.get("From"))
    dat = (msg.get("Date") or "")[:31]
    marque = ""
    for cle in ATTENDUS:
        if cle.lower() in suj.lower():
            ATTENDUS[cle] = True
            marque = "  <-- notification"
    print(f"  {dat[:25]:27} {exp[:34]:36} {suj[:50]}{marque}")

M.logout()

print()
recus = sum(1 for v in ATTENDUS.values() if v)
for cle, v in ATTENDUS.items():
    print(f"  {'OK  ' if v else 'absent'} {cle}")
print(f"\n{recus}/{len(ATTENDUS)} type(s) de notification reçus")
