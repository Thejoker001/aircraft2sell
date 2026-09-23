#!/usr/bin/env python3
"""Sauvegarde quotidienne complète du site aircraft2sell.eu.

1. Exporte TOUTES les tables réelles de la base Supabase (public) en JSON.
2. Commit + push le résultat dans le dépôt privé aircraft2sell-backups
   (dossier database/<horodatage>/), avec purge des sauvegardes > RETENTION_JOURS.
3. Met à jour le miroir git complet (historique inclus) du code source
   dans le dépôt privé aircraft2sell-code-mirror (git push --mirror).

Le dépôt aircraft2sell (code) est DÉJÀ sur GitHub avec tout son historique :
ce script ne le re-sauvegarde pas fichier par fichier, il pousse un miroir
git identique (tags, branches, historique complet) vers un second dépôt
privé pour survivre à une suppression/compromission du dépôt principal.

Usage : python3 scripts/sauvegarde-complete.py
Variables d'environnement requises : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""
import json
import os
import pathlib
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

URL = os.environ.get("SUPABASE_URL", "")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not (URL and KEY):
    print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absents de l'environnement.")
    sys.exit(1)

# Tables réelles (hors vues *_public/*_admin/*_mine qui ne font que filtrer
# les mêmes lignes, et homepage_stats qui est une vue agrégée non filtrable
# par select=* -> erreur 400, sans intérêt pour une sauvegarde).
TABLES = [
    "users", "listings", "messages", "verification_requests",
    "analytics", "listing_views", "admin_logs", "favorites",
    "partners", "price_history", "promo_campaign_grants",
    "reports", "search_alerts", "testimonials",
]

BACKUP_REPO_DIR = pathlib.Path.home() / "aircraft2sell-backups"
BACKUP_REPO_URL = "https://github.com/Thejoker001/aircraft2sell-backups.git"
CODE_REPO_DIR = pathlib.Path.home() / "aircraft2sell"
CODE_MIRROR_URL = "https://github.com/Thejoker001/aircraft2sell-code-mirror.git"
RETENTION_JOURS = 30


def lire_table(table):
    """Pagination : PostgREST plafonne les réponses par défaut à 1000."""
    lignes, offset, taille = [], 0, 1000
    while True:
        req = urllib.request.Request(
            f"{URL}/rest/v1/{table}?select=*&limit={taille}&offset={offset}",
            headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"})
        try:
            lot = json.load(urllib.request.urlopen(req, timeout=60))
        except urllib.error.HTTPError as e:
            return None, f"HTTP {e.code}: {e.read().decode()[:200]}"
        except Exception as e:
            return None, str(e)
        lignes.extend(lot)
        if len(lot) < taille:
            return lignes, None
        offset += taille


def sauvegarder_base():
    horodatage = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    dossier = BACKUP_REPO_DIR / "database" / horodatage
    dossier.mkdir(parents=True, exist_ok=True)

    total = 0
    resume = {}
    echecs = []
    for t in TABLES:
        lignes, err = lire_table(t)
        if err:
            print(f"  {t:24} ÉCHEC ({err})")
            resume[t] = {"erreur": err}
            echecs.append(t)
            continue
        (dossier / f"{t}.json").write_text(
            json.dumps(lignes, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"  {t:24} {len(lignes):>5} ligne(s)")
        resume[t] = len(lignes)
        total += len(lignes)

    (dossier / "_resume.json").write_text(json.dumps({
        "date_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "projet": URL,
        "tables": resume,
        "total_lignes": total,
        "tables_en_echec": echecs,
    }, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"\n{total} enregistrement(s) sauvegardé(s) dans database/{horodatage}/")
    return horodatage, total, echecs


def purger_anciennes_sauvegardes():
    db_dir = BACKUP_REPO_DIR / "database"
    if not db_dir.exists():
        return []
    limite = datetime.now(timezone.utc) - timedelta(days=RETENTION_JOURS)
    supprimees = []
    for d in sorted(db_dir.iterdir()):
        if not d.is_dir():
            continue
        try:
            dt = datetime.strptime(d.name, "%Y%m%d-%H%M%S").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        if dt < limite:
            for f in d.iterdir():
                f.unlink()
            d.rmdir()
            supprimees.append(d.name)
    if supprimees:
        print(f"Purge : {len(supprimees)} sauvegarde(s) > {RETENTION_JOURS}j supprimée(s).")
    return supprimees


def run(cmd, cwd, check=True):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        print(f"CMD ÉCHEC: {' '.join(cmd)}\n{r.stdout}\n{r.stderr}")
    return r


def commit_et_push_backup(horodatage, total, echecs):
    d = BACKUP_REPO_DIR
    run(["git", "add", "-A"], cwd=d)
    statut = run(["git", "status", "--porcelain"], cwd=d)
    if not statut.stdout.strip():
        print("Aucun changement à committer (base identique à hier).")
        return False
    msg = f"Sauvegarde {horodatage} — {total} lignes"
    if echecs:
        msg += f" ({len(echecs)} table(s) en échec: {','.join(echecs)})"
    run(["git", "commit", "-m", msg], cwd=d)
    r = run(["git", "push", "origin", "main"], cwd=d, check=False)
    if r.returncode != 0:
        # premier push : la branche par défaut peut ne pas encore exister en local
        run(["git", "branch", "-M", "main"], cwd=d)
        r = run(["git", "push", "-u", "origin", "main"], cwd=d, check=False)
    ok = r.returncode == 0
    print("Push base -> aircraft2sell-backups :", "OK" if ok else f"ÉCHEC\n{r.stderr}")
    return ok


def miroir_code():
    if not CODE_REPO_DIR.exists():
        print("Dépôt code introuvable, miroir ignoré.")
        return False
    run(["git", "fetch", "origin"], cwd=CODE_REPO_DIR)
    r = run(["git", "push", "--mirror", CODE_MIRROR_URL], cwd=CODE_REPO_DIR, check=False)
    ok = r.returncode == 0
    print("Miroir code -> aircraft2sell-code-mirror :", "OK" if ok else f"ÉCHEC\n{r.stderr}")
    return ok


def main():
    print(f"=== Sauvegarde complète aircraft2sell.eu — {datetime.now(timezone.utc).isoformat(timespec='seconds')} UTC ===\n")

    print("--- Base de données Supabase ---")
    horodatage, total, echecs = sauvegarder_base()

    print("\n--- Purge rétention ---")
    purger_anciennes_sauvegardes()

    print("\n--- Push sauvegarde base ---")
    push_db_ok = commit_et_push_backup(horodatage, total, echecs)

    print("\n--- Miroir code source ---")
    push_code_ok = miroir_code()

    print("\n=== Résumé ===")
    print(f"Base       : {total} lignes, {len(echecs)} échec(s) table, push {'OK' if push_db_ok or total==0 else 'ÉCHEC'}")
    print(f"Code       : miroir {'OK' if push_code_ok else 'ÉCHEC'}")

    if echecs or not push_code_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
