#!/usr/bin/env python3
"""Génère rss.xml (flux RSS 2.0) à partir des annonces live de Supabase.

Source des identifiants : /home/ubuntu/.hermes/profiles/aircraft2sell/.env
(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).

Usage : python3 scripts/gen-rss.py
"""
import os
import re
import sys
import urllib.request
import urllib.parse
import json
from datetime import datetime, timezone
from email.utils import format_datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = '/home/ubuntu/.hermes/profiles/aircraft2sell/.env'
BASE = 'https://aircraft2sell.eu'
CHANNEL_TITLE = 'Aircraft2Sell — Annonces aéronefs'
CHANNEL_DESC = ('Annonces d’avions, hélicoptères, jets d’affaires, turboprops et ULM '
                'à vendre en Europe. Marketplace aéronautique entre particuliers et '
                'professionnels : annonces vérifiées, contact direct, zéro commission.')
MAX_ITEMS = 50
DESC_CAP = 300
CURR_SYM = {'EUR': '€', 'USD': '$', 'GBP': '£', 'CHF': 'CHF'}


def load_env(path):
    """Lit un fichier .env simple (KEY=VALUE, commentaires #) et renvoie un dict."""
    env = {}
    if not os.path.exists(path):
        print(f'ERREUR : {path} introuvable', file=sys.stderr)
        return env
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def fetch_listings(base_url, service_key):
    """GET /rest/v1/listings?status=eq.live&order=submitted_at.desc&limit=50"""
    qs = urllib.parse.urlencode({
        'status': 'eq.live',
        'order': 'submitted_at.desc',
        'limit': MAX_ITEMS,
    })
    url = base_url.rstrip('/') + '/rest/v1/listings?' + qs
    req = urllib.request.Request(url, headers={
        'apikey': service_key,
        'Authorization': 'Bearer ' + service_key,
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))


def esc(s):
    """Échappe une chaîne pour du XML."""
    if s is None:
        return ''
    return (str(s)
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&apos;'))


def format_price(price, currency):
    """Prix lisible : nombre → format fr, sinon brut, sinon « sur demande »."""
    if price is None or str(price).strip() == '':
        return 'Prix sur demande'
    p = str(price).strip()
    try:
        n = float(p.replace('\u202f', '').replace(' ', '').replace('\u00a0', ''))
    except ValueError:
        return p  # déjà un texte (ex. « 85 000 € »)
    sym = CURR_SYM.get(currency or 'EUR', '€')
    s = f'{n:,.0f}'.replace(',', '\u202f')
    return f'{s} {sym}'


def truncate(text, cap=DESC_CAP):
    t = (text or '').strip().replace('\r', ' ').replace('\n', ' ')
    t = re.sub(r'\s+', ' ', t)
    if len(t) <= cap:
        return t
    cut = t[:cap].rsplit(' ', 1)[0]
    return cut.rstrip(' ,;:') + '…'


def parse_iso(value):
    """ISO 8601 → datetime aware UTC, sinon None."""
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError:
        return None


def build_rss(rows):
    out = []
    out.append('<?xml version="1.0" encoding="UTF-8"?>')
    out.append('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">')
    out.append('  <channel>')
    out.append(f'    <title>{esc(CHANNEL_TITLE)}</title>')
    out.append(f'    <link>{BASE}/</link>')
    out.append(f'    <description>{esc(CHANNEL_DESC)}</description>')
    out.append('    <language>fr</language>')
    out.append(f'    <atom:link href="{BASE}/rss.xml" rel="self" type="application/rss+xml"/>')
    out.append(f'    <lastBuildDate>{format_datetime(datetime.now(timezone.utc))}</lastBuildDate>')

    for r in rows:
        make = (r.get('make') or '').strip()
        model = (r.get('model') or '').strip()
        year = (r.get('year') or '').strip()
        rid = r.get('id')
        if rid is None:
            continue
        title = ' '.join(x for x in (make, model, year) if x).strip() or 'Aéronef à vendre'
        link = f'{BASE}/listing.html?id={rid}'
        price = format_price(r.get('price'), r.get('currency'))
        desc = (r.get('description') or '').strip()
        item_desc = f'Prix : {price}. ' + (truncate(desc) if desc else '')
        out.append('    <item>')
        out.append(f'      <title>{esc(title)}</title>')
        out.append(f'      <link>{esc(link)}</link>')
        out.append(f'      <guid isPermaLink="true">{esc(link)}</guid>')
        pub = parse_iso(r.get('submitted_at')) or parse_iso(r.get('created_at'))
        if pub:
            out.append(f'      <pubDate>{format_datetime(pub)}</pubDate>')
        out.append(f'      <description>{esc(item_desc)}</description>')
        out.append('    </item>')

    out.append('  </channel>')
    out.append('</rss>')
    return '\n'.join(out) + '\n'


def main():
    env = load_env(ENV_PATH)
    base = env.get('SUPABASE_URL')
    key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not base or not key:
        print('ERREUR : SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquants '
              f'dans {ENV_PATH}', file=sys.stderr)
        return 1
    try:
        rows = fetch_listings(base, key)
    except Exception as e:
        print(f'ERREUR : échec de la récupération des annonces — {e}', file=sys.stderr)
        return 1

    xml = build_rss(rows)
    dest = os.path.join(ROOT, 'rss.xml')
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(xml)
    print(f'rss.xml généré : {len(rows)} annonces live ({len([r for r in rows if r.get("id") is not None])} items), '
          f'{os.path.getsize(dest)} octets.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
