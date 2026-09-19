#!/usr/bin/env python3
"""
Notifie IndexNow (Bing, Yandex, Seznam...) des URLs du sitemap.
Usage : python3 scripts/indexnow-submit.py [--all]
  --all : soumet TOUTES les URLs du sitemap (usage ponctuel).
  (sans --all) : soumet uniquement si le sitemap.xml a changé depuis le dernier commit
                 précédent (usage cron quotidien, via git diff).
"""
import json
import os
import re
import subprocess
import sys
import urllib.request

HOST = "aircraft2sell.eu"
KEY = "bd6e68bb6f39402f69ffac5ab1748ef9"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITEMAP = os.path.join(REPO, "sitemap.xml")


def get_sitemap_urls(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    return re.findall(r"<loc>([^<]+)</loc>", content)


def get_changed_urls():
    """URLs nouvelles/modifiées dans sitemap.xml depuis le commit précédent (HEAD~1)."""
    try:
        old = subprocess.run(
            ["git", "show", "HEAD~1:sitemap.xml"],
            cwd=REPO, capture_output=True, text=True, check=True
        ).stdout
        old_urls = set(re.findall(r"<loc>([^<]+)</loc>", old))
    except subprocess.CalledProcessError:
        old_urls = set()
    new_urls = set(get_sitemap_urls(SITEMAP))
    return sorted(new_urls - old_urls)


def submit(urls):
    if not urls:
        print("Aucune URL à soumettre.")
        return
    body = json.dumps({
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }).encode()
    req = urllib.request.Request(
        ENDPOINT, data=body, method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            print(f"IndexNow: {len(urls)} URL(s) soumise(s), HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        # 200/202 = accepté ; 400/403/422/429 = erreur réelle
        print(f"IndexNow: {len(urls)} URL(s), HTTP {e.code} ({e.reason})")
    except Exception as e:
        print(f"IndexNow: erreur réseau: {e}")


def main():
    if "--all" in sys.argv:
        urls = get_sitemap_urls(SITEMAP)
        print(f"Mode --all : {len(urls)} URLs du sitemap")
    else:
        urls = get_changed_urls()
        print(f"Mode incrémental : {len(urls)} URL(s) nouvelle(s)/modifiée(s)")
    submit(urls)


if __name__ == "__main__":
    main()
