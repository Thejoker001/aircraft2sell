#!/usr/bin/env python3
"""Snapshot hebdomadaire du funnel + trafic analytics maison (Supabase) + Umami.

Complement au gsc-weekly-snapshot.sh (SEO Google) : ici on regarde le trafic
reel toutes sources confondues et la progression dans le funnel d'inscription/
depot d'annonce, pour detecter les points de friction qui bloquent la
conversion visiteur -> client.

no_agent : deterministe, pas besoin d'un LLM. Execute par cron hebdo (lundi).
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

SB_URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

EU_COUNTRIES = {
    "FR", "CH", "GB", "DE", "BE", "IE", "ES", "IT", "NL", "AT",
    "PT", "LU", "SE", "NO", "DK", "FI", "PL", "EE", "LV", "LT",
}

FUNNEL_PAGES = [
    "index.html", "search.html", "listing.html", "vendeur.html",
    "post-listing.html", "login.html", "onboarding.html",
    "dashboard.html", "checkout.html", "success.html",
    "listing-submitted.html",
]


def get(path, params=None):
    url = SB_URL + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(
        url, headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def get_all(path, params):
    rows = []
    offset = 0
    limit = 1000
    while True:
        batch = get(path, {**params, "limit": limit, "offset": offset})
        rows.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return rows


def main():
    now = datetime.now(timezone.utc)
    since = (now - timedelta(days=28)).strftime("%Y-%m-%dT%H:%M:%S")

    rows = get_all(
        "/rest/v1/analytics",
        {
            "select": "session_id,page,country,referrer,device,created_at",
            "created_at": f"gte.{since}",
            "order": "created_at.asc",
        },
    )

    print(f"=== {now.strftime('%Y-%m-%d')} — snapshot trafic+funnel (28j) ===")
    print(f"Total evenements: {len(rows)}")

    sessions = defaultdict(list)
    for r in rows:
        sessions[r["session_id"]].append(r)
    print(f"Sessions uniques: {len(sessions)}")

    # Qualite du trafic par pays (engagement = pages/session)
    by_country_sessions = defaultdict(set)
    for r in rows:
        if r["country"]:
            by_country_sessions[r["country"]].add(r["session_id"])

    print()
    print("--- Engagement par pays (pages/session moyen, >=10 sessions) ---")
    country_quality = []
    for country, sids in by_country_sessions.items():
        pages_per_sess = [len(sessions[sid]) for sid in sids]
        avg = sum(pages_per_sess) / len(pages_per_sess)
        if len(sids) >= 10:
            country_quality.append((country, len(sids), round(avg, 2)))
    country_quality.sort(key=lambda x: -x[1])
    for country, n, avg in country_quality:
        flag = " <- bruit probable" if avg < 1.8 else ""
        print(f"  {country}: {n} sessions, {avg} pages/session{flag}")

    # Sessions EU vs non-EU
    eu_sessions = {
        sid: recs
        for sid, recs in sessions.items()
        if any(r["country"] in EU_COUNTRIES for r in recs)
    }
    print()
    print(f"Sessions EU (marche cible): {len(eu_sessions)} / {len(sessions)}")

    # Referrer breakdown (evenements)
    ref_counter = Counter()
    for r in rows:
        ref = r["referrer"] or "direct"
        if ref in ("direct", "internal"):
            ref_counter[ref] += 1
        elif "google" in ref:
            ref_counter["google"] += 1
        elif "facebook" in ref or "instagram" in ref:
            ref_counter["facebook/instagram"] += 1
        elif "bing" in ref:
            ref_counter["bing"] += 1
        else:
            ref_counter[f"autre:{ref}"] += 1
    print()
    print("--- Sources de trafic (evenements, 28j) ---")
    for k, v in ref_counter.most_common(15):
        print(f"  {v} {k}")

    # Funnel EU
    print()
    print("--- Funnel EU (sessions atteignant chaque etape) ---")
    funnel_counts = Counter()
    for sid, recs in eu_sessions.items():
        pages_visited = {r["page"].split("?")[0] for r in recs}
        for p in FUNNEL_PAGES:
            if p in pages_visited:
                funnel_counts[p] += 1
    prev = len(eu_sessions)
    print(f"  {prev} sessions EU totales")
    for p in FUNNEL_PAGES:
        n = funnel_counts[p]
        drop = f" ({100*n//prev}%)" if prev else ""
        print(f"  {n} {p}{drop}")

    # Conversion reelle (depuis Supabase users/listings, meme logique que volet 6 Rio)
    users = get_all(
        "/rest/v1/users",
        {"select": "email,registered_at"},
    )
    recent_users = [
        u for u in users
        if u.get("registered_at")
        and datetime.fromisoformat(u["registered_at"].replace("Z", "+00:00")) >= now - timedelta(days=28)
    ]
    print()
    print(f"--- Inscriptions reelles (28j) : {len(recent_users)} ---")

    print()
    print("Snapshot termine.")


if __name__ == "__main__":
    main()
