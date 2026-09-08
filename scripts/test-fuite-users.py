#!/usr/bin/env python3
"""Vérifie que le site survivra au verrouillage de la table `users`.

Simule l'état d'APRÈS application de supabase/fuite-users.sql :
la lecture directe de `users` renvoie [] pour un visiteur anonyme.
On contrôle que les pages publiques disposent bien du chemin de repli
(fonction get_seller_public) et n'appellent plus `users` en direct.
"""
import re, sys, pathlib

RACINE = pathlib.Path(__file__).resolve().parent.parent
PUBLIQUES = ["seller.html", "listing.html", "en/listing.html"]

R = []
def ok(n, c, d=""):
    R.append((n, bool(c), str(d)))

for f in PUBLIQUES:
    p = RACINE / f
    s = p.read_text(encoding="utf-8")

    # 1. La page doit disposer du chemin RPC
    ok(f"{f} : fonction sbSellerPublic presente",
       "function sbSellerPublic" in s or "sbSellerPublic(" in s)

    # 2. Plus aucune lecture directe de users pour le profil vendeur.
    #    Le repli interne à sbSellerPublic est légitime : on le neutralise
    #    d'abord (la regex sur sbGet(...) s'arrête au premier ')' et ne
    #    voyait pas la liste de champs qui l'identifie).
    corps = s
    for bloc in re.findall(r"async function sbSellerPublic\(email\)\{.*?\n\}", s, re.S):
        corps = corps.replace(bloc, "")
    hors_repli = re.findall(r"sbGet\(\s*'users'\s*,", corps)
    ok(f"{f} : aucune lecture directe de users hors repli",
       not hors_repli, f"{len(hors_repli)} appel(s) restant(s)")

    # 3. Aucun select=* sur users (rapatriait l'email sans raison)
    ok(f"{f} : aucun select=* sur users",
       not re.search(r"sbGet\(\s*'users'[^)]*select=\*", s))

    # 4. L'email ne doit jamais être demandé dans le profil public
    ok(f"{f} : le profil public ne demande pas l'email",
       not re.search(r"get_seller_public[^}]{0,400}select=[^'\"]*email", s))

# supabase.js : version partagée
sb = (RACINE / "supabase.js").read_text(encoding="utf-8")
ok("supabase.js : sbSellerPublic exportee", "function sbSellerPublic" in sb)
ok("supabase.js : jeton de session utilise", "_a2sAuth" in sb)
ok("supabase.js : renouvellement du jeton", "_a2sRenouveler" in sb)

# Le SQL de correction doit exister et couvrir les deux étapes
sql_p = RACINE / "supabase" / "fuite-users.sql"
ok("SQL de correction present", sql_p.exists())
if sql_p.exists():
    sql = sql_p.read_text(encoding="utf-8")
    ok("SQL : cree get_seller_public", "create or replace function public.get_seller_public" in sql)
    ok("SQL : active la RLS sur users", "alter table public.users enable row level security" in sql)
    ok("SQL : conserve la lecture de sa propre fiche", "users_read_self" in sql)
    ok("SQL : conserve l'inscription", "users_insert_signup" in sql)
    ok("SQL : get_seller_public ne renvoie pas l'email",
       not re.search(r"returns table\s*\([^)]*\bemail\b", sql, re.S))

passed = sum(1 for _, c, _ in R if c)
for n, c, d in R:
    print(f"  {'OK  ' if c else 'FAIL'} {n}" + (f" -> {d}" if d and not c else ""))
print(f"\n{passed}/{len(R)} tests réussis")
sys.exit(0 if passed == len(R) else 1)
