#!/usr/bin/env python3
"""Génère sitemap.xml à partir des pages réellement présentes sur le disque.

Règles appliquées :
- une page n'entre dans le sitemap que si elle est indexable :
  pas de `noindex`, pas de `Disallow` dans robots.txt, pas de page technique ;
- l'URL publiée est le `canonical` de la page (jamais une variante) ;
- les balises `xhtml:link` (hreflang) sont reprises depuis la page elle-même,
  afin que sitemap et <head> ne puissent pas diverger ;
- `lastmod` = date du dernier commit git touchant le fichier (à défaut, mtime).

Le sitemap se périme dès qu'on ajoute une page : le régénérer plutôt que
l'éditer à la main.

Usage : python3 scripts/gen-sitemap.py [--check]
        --check : ne réécrit rien, sort en erreur si le sitemap est périmé (CI).
"""
import os
import re
import subprocess
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://aircraft2sell.eu'

# Pages sans valeur de référencement (outil personnel, redirections, doublons).
# `sitemap.html` reste indexable : c'est un hub de maillage interne qui pointe
# vers les 38 pages du site (dont les versions EN) en HTML brut, donc crawlable
# sans JavaScript — utile là où la nav est injectée en JS.
EXCLUDE = {
    'homepage.html',      # redirection vers /
    'alerts.html',        # outil personnel, contenu mince
    'seller.html',        # profil vendeur, généré dynamiquement
    'diag.html', 'moderation.html',
}

# Priorité et fréquence par page (défaut : 0.70 / monthly).
PRIORITY = {
    '': (1.00, 'daily'),
    'search.html': (0.95, 'daily'),
    'avions-legers.html': (0.90, 'weekly'),
    'avions-a-vendre-france.html': (0.85, 'weekly'),
    'avions-a-vendre-allemagne.html': (0.85, 'weekly'),
    'avions-a-vendre-espagne.html': (0.85, 'weekly'),
    'avions-a-vendre-italie.html': (0.85, 'weekly'),
    'avions-a-vendre-suisse.html': (0.85, 'weekly'),
    'avions-a-vendre-royaume-uni.html': (0.85, 'weekly'),
    'jets-affaires.html': (0.90, 'weekly'),
    'helicopteres.html': (0.88, 'weekly'),
    'post-listing.html': (0.88, 'weekly'),
    'turboprops.html': (0.85, 'weekly'),
    'ulm.html': (0.82, 'weekly'),
    'pro-dealers.html': (0.82, 'weekly'),
    'guide-acheteur.html': (0.82, 'monthly'),
    'avions-de-ligne.html': (0.80, 'weekly'),
    'pricing.html': (0.80, 'weekly'),
    'blog.html': (0.78, 'weekly'),
    'comparateur.html': (0.78, 'weekly'),
    'vendeur.html': (0.75, 'monthly'),
    'map.html': (0.75, 'daily'),
    'comment-financer-avion-leger.html': (0.72, 'monthly'),
    'inspection-pre-achat-avion.html': (0.72, 'monthly'),
    'vendre-avion-particulier-europe.html': (0.72, 'monthly'),
    'assurance-aeronef-guide.html': (0.72, 'monthly'),
    'estimation.html': (0.70, 'monthly'),
    'listing.html': (0.70, 'weekly'),
    'faq.html': (0.65, 'monthly'),
    'contact.html': (0.55, 'monthly'),
    'sitemap.html': (0.40, 'weekly'),
    'legal.html': (0.30, 'yearly'),
}


def robots_blocked():
    """Chemins interdits aux robots (donc jamais dans le sitemap)."""
    path = os.path.join(ROOT, 'robots.txt')
    if not os.path.exists(path):
        return set()
    txt = open(path, encoding='utf-8').read()
    return set(re.findall(r'Disallow:\s*/([\w./-]+\.html)', txt))


def staged_files():
    """Fichiers indexés (staged) pour le commit en cours. Utilisé par le hook
    pre-commit : au moment où il tourne, le commit n'existe pas encore, donc
    `git log` pour ces fichiers renvoie la date du commit PRÉCÉDENT — un
    sitemap régénéré à ce moment-là est donc structurellement périmé d'un
    commit dès qu'une page HTML change, ce qui faisait échouer le check CI
    `gen-sitemap.py --check` à répétition (vu 2026-09-08/09, plusieurs
    workflows en échec). En dehors d'un pre-commit (rien de staged, ou script
    lancé manuellement/en CI sur un checkout propre), cet ensemble est vide et
    le comportement retombe sur git_lastmod normal — aucune régression.
    """
    try:
        out = subprocess.run(
            ['git', 'diff', '--cached', '--name-only'],
            cwd=ROOT, capture_output=True, text=True, timeout=10)
        return set(out.stdout.strip().splitlines())
    except Exception:
        return set()


_STAGED = staged_files()


def git_lastmod(relpath):
    """Date du dernier commit touchant le fichier, sinon date du jour.
    Si le fichier est actuellement staged (commit en cours), sa date
    effective une fois committé sera "aujourd'hui" : ne pas interroger un
    historique qui ne le sait pas encore (voir staged_files())."""
    if relpath in _STAGED:
        return date.today().isoformat()
    try:
        out = subprocess.run(
            ['git', 'log', '-1', '--format=%cs', '--', relpath],
            cwd=ROOT, capture_output=True, text=True, timeout=10)
        stamp = out.stdout.strip()
        if re.fullmatch(r'\d{4}-\d{2}-\d{2}', stamp):
            return stamp
    except Exception:
        pass
    return date.today().isoformat()


def collect():
    blocked = robots_blocked()
    entries = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames
                       if d not in ('.git', 'node_modules', 'supabase', 'scripts', 'images')]
        for name in sorted(filenames):
            if not name.endswith('.html'):
                continue
            rel = os.path.relpath(os.path.join(dirpath, name), ROOT).replace(os.sep, '/')
            if rel in EXCLUDE or os.path.basename(rel) in EXCLUDE or rel in blocked:
                continue

            html = open(os.path.join(ROOT, rel), encoding='utf-8').read()

            robots = re.search(r'<meta name="robots" content="([^"]*)"', html)
            if robots and 'noindex' in robots.group(1).lower():
                continue

            canon = re.search(r'<link rel="canonical" href="([^"]+)"', html)
            if not canon:
                print(f'  ! {rel} : pas de canonical, ignorée', file=sys.stderr)
                continue
            loc = canon.group(1)

            alts = re.findall(
                r'<link rel="alternate" hreflang="([\w-]+)" href="([^"]+)"', html)

            key = '' if rel == 'index.html' else rel
            prio, freq = PRIORITY.get(key, PRIORITY.get(os.path.basename(rel), (0.70, 'monthly')))
            entries.append({
                'loc': loc, 'priority': prio, 'changefreq': freq,
                'lastmod': git_lastmod(rel), 'alts': alts,
            })

    # rss.xml n'est pas une page HTML : on l'ajoute explicitement s'il existe.
    rss_path = os.path.join(ROOT, 'rss.xml')
    if os.path.exists(rss_path):
        entries.append({
            'loc': BASE + '/rss.xml', 'priority': 0.70,
            'changefreq': 'daily', 'lastmod': git_lastmod('rss.xml'),
            'alts': [],
        })

    entries.sort(key=lambda e: (-e['priority'], e['loc']))
    return entries


def render(entries):
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
           '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
           '']
    for e in entries:
        out.append('  <url>')
        out.append(f'    <loc>{e["loc"]}</loc>')
        out.append(f'    <lastmod>{e["lastmod"]}</lastmod>')
        out.append(f'    <changefreq>{e["changefreq"]}</changefreq>')
        out.append(f'    <priority>{e["priority"]:.2f}</priority>')
        for lang, href in e['alts']:
            out.append(f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{href}"/>')
        out.append('  </url>')
    out.append('')
    out.append('</urlset>')
    return '\n'.join(out) + '\n'


def main():
    entries = collect()
    xml = render(entries)
    dest = os.path.join(ROOT, 'sitemap.xml')
    current = open(dest, encoding='utf-8').read() if os.path.exists(dest) else ''

    if '--check' in sys.argv:
        if current != xml:
            print('sitemap.xml est périmé — relancer python3 scripts/gen-sitemap.py')
            return 1
        print(f'sitemap.xml à jour ({len(entries)} URLs).')
        return 0

    open(dest, 'w', encoding='utf-8').write(xml)
    n_alt = sum(1 for e in entries if e['alts'])
    print(f'sitemap.xml généré : {len(entries)} URLs, {n_alt} avec hreflang.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
