#!/usr/bin/env python3
"""Soumission Search Console : sitemap + demandes d'indexation.

Le script `gsc.py` du skill demande le scope `webmasters.readonly` et ne peut
donc rien écrire. Ici on signe notre propre JWT avec le scope complet
`https://www.googleapis.com/auth/webmasters` pour pouvoir soumettre.

Commandes :
  python3 scripts/gsc-submit.py sitemaps            liste les sitemaps déclarés
  python3 scripts/gsc-submit.py submit [URL]        soumet le sitemap
  python3 scripts/gsc-submit.py delete URL          retire un sitemap obsolète
  python3 scripts/gsc-submit.py inspect [URL...]    état d'indexation (défaut: sitemap)
  python3 scripts/gsc-submit.py audit               inspecte toutes les URLs du sitemap

Note : l'API « Demander une indexation » (Indexing API) est réservée aux offres
d'emploi et livestreams. Pour les autres pages, Google n'expose pas ce bouton en
API : le sitemap et le maillage interne sont les leviers officiels. `audit`
identifie les pages non indexées à pousser manuellement dans l'interface.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

try:
    import jwt
except ImportError:
    sys.exit("PyJWT manquant : pip install pyjwt cryptography")

SITE = os.environ.get('GSC_SITE_URL', 'sc-domain:aircraft2sell.eu')
SCOPE = 'https://www.googleapis.com/auth/webmasters'  # complet, pas .readonly
SITEMAP = 'https://aircraft2sell.eu/sitemap.xml'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def token():
    """Access token via JWT signé par le compte de service (scope écriture)."""
    path = os.environ.get('GSC_SERVICE_ACCOUNT_JSON')
    if not path or not os.path.exists(path):
        sys.exit('GSC_SERVICE_ACCOUNT_JSON absent ou introuvable.')
    sa = json.load(open(path, encoding='utf-8'))
    now = int(time.time())
    assertion = jwt.encode({
        'iss': sa['client_email'], 'scope': SCOPE,
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': now, 'exp': now + 3600,
    }, sa['private_key'], algorithm='RS256')

    body = urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': assertion,
    }).encode()
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=body)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['access_token']


def call(method, url, tok, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Authorization', 'Bearer ' + tok)
    if data:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw.strip() else {})
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors='replace')


def api_site():
    return urllib.parse.quote(SITE, safe='')


def sitemap_urls():
    """URLs listées dans le sitemap local."""
    import re
    path = os.path.join(ROOT, 'sitemap.xml')
    return re.findall(r'<loc>([^<]+)</loc>', open(path, encoding='utf-8').read())


def cmd_sitemaps(tok):
    url = f'https://www.googleapis.com/webmasters/v3/sites/{api_site()}/sitemaps'
    status, data = call('GET', url, tok)
    if status != 200 or not isinstance(data, dict):
        print(status, data)
        return 1
    entries = data.get('sitemap', [])
    if not entries:
        print('Aucun sitemap déclaré.')
    for s in entries:
        warn = s.get('warnings', '0')
        err = s.get('errors', '0')
        submitted = sum(int(c.get('submitted', 0)) for c in s.get('contents', []))
        indexed = sum(int(c.get('indexed', 0)) for c in s.get('contents', []))
        print(f"  {s['path']}")
        print(f"    dernier téléchargement : {s.get('lastDownloaded', '—')}")
        print(f"    URLs soumises={submitted} indexées={indexed} "
              f"erreurs={err} avertissements={warn}")
    return 0


def cmd_submit(tok, target):
    url = (f'https://www.googleapis.com/webmasters/v3/sites/{api_site()}'
           f'/sitemaps/{urllib.parse.quote(target, safe="")}')
    status, data = call('PUT', url, tok)
    print(f'PUT {target} -> HTTP {status}' + ('' if status == 204 else f' {data}'))
    return 0 if status == 204 else 1


def cmd_delete(tok, target):
    url = (f'https://www.googleapis.com/webmasters/v3/sites/{api_site()}'
           f'/sitemaps/{urllib.parse.quote(target, safe="")}')
    status, data = call('DELETE', url, tok)
    print(f'DELETE {target} -> HTTP {status}' + ('' if status == 204 else f' {data}'))
    return 0 if status == 204 else 1


def inspect(tok, page):
    status, data = call(
        'POST', 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
        tok, {'inspectionUrl': page, 'siteUrl': SITE, 'languageCode': 'fr'})
    if status != 200 or not isinstance(data, dict):
        return {'url': page, 'error': f'HTTP {status} {str(data)[:120]}'}
    r = data.get('inspectionResult', {}).get('indexStatusResult', {})
    return {
        'url': page,
        'verdict': r.get('verdict'),
        'coverage': r.get('coverageState'),
        'googleCanonical': r.get('googleCanonical'),
        'userCanonical': r.get('userCanonical'),
        'lastCrawl': (r.get('lastCrawlTime') or '')[:10],
    }


def cmd_inspect(tok, urls):
    for u in urls:
        r = inspect(tok, u)
        print(f"\n{r['url']}")
        for k in ('verdict', 'coverage', 'googleCanonical', 'userCanonical', 'lastCrawl', 'error'):
            if r.get(k):
                print(f'   {k:16} {r[k]}')
        time.sleep(0.5)  # l'API est limitée à ~600 requêtes/jour
    return 0


def cmd_audit(tok):
    urls = sitemap_urls()
    print(f'Audit de {len(urls)} URLs du sitemap…\n')
    ok, todo, err = [], [], []
    for u in urls:
        r = inspect(tok, u)
        if r.get('error'):
            err.append(r)
        elif r.get('verdict') == 'PASS':
            ok.append(r)
        else:
            todo.append(r)
        time.sleep(0.6)

    print(f'INDEXÉES : {len(ok)}')
    if todo:
        print(f'\nÀ POUSSER ({len(todo)}) — « Demander une indexation » dans Search Console :')
        for r in todo:
            print(f"  {r['url']}")
            print(f"     {r.get('coverage')}")
            if r.get('googleCanonical') and r['googleCanonical'] != r.get('userCanonical'):
                print(f"     canonique Google : {r['googleCanonical']}")
    if err:
        print(f'\nERREURS ({len(err)}) :')
        for r in err:
            print(f"  {r['url']} :: {r['error']}")
    return 0


def main():
    args = sys.argv[1:] or ['sitemaps']
    cmd, rest = args[0], args[1:]
    tok = token()
    if cmd == 'sitemaps':
        return cmd_sitemaps(tok)
    if cmd == 'submit':
        return cmd_submit(tok, rest[0] if rest else SITEMAP)
    if cmd == 'delete':
        if not rest:
            sys.exit('URL du sitemap à supprimer requise.')
        return cmd_delete(tok, rest[0])
    if cmd == 'inspect':
        return cmd_inspect(tok, rest or [SITEMAP.replace('sitemap.xml', '')])
    if cmd == 'audit':
        return cmd_audit(tok)
    sys.exit(__doc__)


if __name__ == '__main__':
    raise SystemExit(main())
