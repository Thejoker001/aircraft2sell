#!/usr/bin/env python3
"""Génère sitemap-listings.xml : une URL par annonce EN LIGNE (status='live').

Pourquoi un fichier SÉPARÉ de sitemap.xml :
- sitemap.xml (scripts/gen-sitemap.py) ne connaît que les pages HTML statiques
  présentes sur le disque ; il est vérifié par la CI (`--check`, voir
  .github/workflows/deploy-vercel.yml) SANS les secrets Supabase — y mélanger
  les annonces casserait ce check à chaque annonce publiée/vendue.
- Les ~65+ annonces vivantes ne sont servies que par listing.html?id=XXX (un
  seul template HTML, canonical réécrit en JS par annonce). Elles n'étaient
  listées NULLE PART : ni dans sitemap.xml, ni dans un autre sitemap — Google
  Search Console confirmait chaque annonce testée "URL is unknown to Google"
  (diagnostic du 22/10/2026). Ce script comble ce trou.

Ce script est lancé par un cron Hermes dédié (pas par la CI GitHub), car lui
seul dispose de SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en dehors du dépôt.
Le fichier généré est commité et poussé par le cron, pas par ce script lui-même
(garde le script pur / testable en local sans toucher git).

Usage : python3 scripts/gen-sitemap-listings.py
  (lit SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY depuis l'environnement)
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://aircraft2sell.eu'
DEST = os.path.join(ROOT, 'sitemap-listings.xml')


def fetch_live_listings():
    url = os.environ.get('SUPABASE_URL', '').rstrip('/')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not url or not key:
        print('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans l\'environnement',
              file=sys.stderr)
        sys.exit(1)
    endpoint = (f'{url}/rest/v1/listings?select=id,submitted_at,created_at'
                f'&status=eq.live&order=submitted_at.desc&limit=2000')
    req = urllib.request.Request(endpoint, headers={
        'apikey': key, 'Authorization': f'Bearer {key}',
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def render(listings):
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', '']
    for l in listings:
        lid = l.get('id')
        if lid is None:
            continue
        lastmod = (l.get('submitted_at') or l.get('created_at') or '')[:10]
        out.append('  <url>')
        out.append(f'    <loc>{BASE}/listing.html?id={lid}</loc>')
        if lastmod:
            out.append(f'    <lastmod>{lastmod}</lastmod>')
        out.append('    <changefreq>weekly</changefreq>')
        out.append('    <priority>0.60</priority>')
        out.append('  </url>')
    out.append('')
    out.append('</urlset>')
    return '\n'.join(out) + '\n'


def main():
    listings = fetch_live_listings()
    xml = render(listings)
    with open(DEST, 'w', encoding='utf-8') as f:
        f.write(xml)
    print(f'sitemap-listings.xml généré : {len(listings)} annonces.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
