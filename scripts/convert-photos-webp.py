#!/usr/bin/env python3
"""Conversion WebP réelle des photos d'annonces live (bucket Supabase `photos`).

Contexte (audit Lighthouse mobile 09/11/2026) : listing.html charge des photos
JPEG non converties (confirmé : 797/797 photos live en .jpg/.jpeg). Le paramètre
?format=webp utilisé par optimizeImg() côté client est SANS EFFET — l'endpoint
/storage/v1/render/image/ de Supabase (seul moyen de conversion à la volée) est
HTTP 403 sur le plan gratuit du projet (vérifié le 09/11). Seule option sans
upgrade payant : convertir réellement les fichiers et changer les URLs en base.

Approche SANS RISQUE :
  1. Téléchargement de l'original JPEG (jamais modifié ni supprimé).
  2. Conversion WebP qualité 80 (ré-encodage, pas de redimensionnement —
     optimize-photos.py s'en charge déjà en amont si besoin).
  3. Upload du résultat sous un NOUVEAU chemin listings-webp/<nom-sans-ext>.webp
     (jamais d'écrasement : l'original reste accessible si rollback nécessaire).
  4. Bascule atomique PAR ANNONCE : les URLs `photos` ne sont PATCHées en base
     QUE si TOUTES les photos de cette annonce ont été converties avec succès —
     jamais un mélange jpg/webp au sein d'une même annonce par accident d'une
     conversion partiellement échouée.

Usage : python3 convert-photos-webp.py [--limit N] [--dry-run] [--only SOUSCHAINE]
Journal : ~/.hermes/profiles/aircraft2sell/scripts/photos-webp-state.jsonl
(une ligne par ANNONCE ; un id déjà journalisé avec ok=true n'est jamais retraité).
"""
import os, sys, io, json, time, argparse, requests
from concurrent.futures import ThreadPoolExecutor

U = os.environ["SUPABASE_URL"]; K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": K, "Authorization": f"Bearer {K}"}
BUCKET = "photos"
LOG = os.environ.get("PHOTOS_WEBP_LOG", os.path.expanduser("~/.hermes/profiles/aircraft2sell/scripts/photos-webp-state.jsonl"))

ap = argparse.ArgumentParser()
ap.add_argument("--limit", type=int, default=0)
ap.add_argument("--dry-run", action="store_true")
ap.add_argument("--workers", type=int, default=3)
ap.add_argument("--only", default="", help="sous-chaîne de l'id d'annonce pour ne traiter que certaines")
args = ap.parse_args()

done_ids = set()
if os.path.exists(LOG):
    for l in open(LOG):
        try:
            rec = json.loads(l)
            if rec.get("ok"):
                done_ids.add(rec["id"])
        except Exception:
            pass


def live_listings():
    rows = requests.get(
        f"{U}/rest/v1/listings?select=id,photos&status=eq.live", headers=H, timeout=60
    ).json()
    out = []
    for r in rows:
        photos = [p for p in (r.get("photos") or []) if isinstance(p, str) and f"/object/public/{BUCKET}/" in p]
        if photos:
            out.append({"id": r["id"], "photos": photos})
    return out


def webp_name(orig_path):
    """listings/1793982308230-0.jpg -> listings-webp/1793982308230-0.webp"""
    base = orig_path.rsplit("/", 1)[-1]
    stem = base.rsplit(".", 1)[0]
    return f"listings-webp/{stem}.webp"


def convert_one(photo_url):
    """Télécharge l'original, convertit en WebP, upload. Renvoie (ok, new_url_or_err, orig_kb, new_kb)."""
    from PIL import Image, ImageOps
    clean_url = photo_url.split("?")[0]
    orig_path = clean_url.split(f"/object/public/{BUCKET}/", 1)[1]
    new_path = webp_name(orig_path)
    try:
        r = requests.get(clean_url, headers=H, timeout=120)
        if r.status_code != 200:
            return False, f"download http {r.status_code}", 0, 0
        orig = r.content
        im = Image.open(io.BytesIO(orig))
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=80, method=4)
        out = buf.getvalue()
        if args.dry_run:
            return True, f"(dry) {U}/storage/v1/object/public/{BUCKET}/{new_path}", len(orig) // 1024, len(out) // 1024
        up = requests.post(
            f"{U}/storage/v1/object/{BUCKET}/{new_path}",
            headers={**H, "Content-Type": "image/webp", "x-upsert": "true", "Cache-Control": "max-age=31536000"},
            data=out, timeout=180,
        )
        if up.status_code not in (200, 201):
            return False, f"upload http {up.status_code} {up.text[:100]}", len(orig) // 1024, 0
        new_url = f"{U}/storage/v1/object/public/{BUCKET}/{new_path}"
        return True, new_url, len(orig) // 1024, len(out) // 1024
    except Exception as e:
        return False, str(e)[:160], 0, 0


def process_listing(listing):
    rec = {"id": listing["id"], "t": time.strftime("%H:%M:%S"), "n_photos": len(listing["photos"])}
    new_urls = []
    orig_total = new_total = 0
    for p in listing["photos"]:
        ok, result, okb, nkb = convert_one(p)
        orig_total += okb
        new_total += nkb
        if not ok:
            rec["error"] = f"photo échouée: {result}"
            rec["ok"] = False
            return rec
        new_urls.append(result)
    rec["orig_kb"] = orig_total
    rec["new_kb"] = new_total
    if args.dry_run:
        rec["dry"] = True
        rec["ok"] = True
        return rec
    # Bascule atomique : toutes les photos ont réussi -> on PATCH l'annonce entière.
    patch = requests.patch(
        f"{U}/rest/v1/listings?id=eq.{listing['id']}",
        headers={**H, "Content-Type": "application/json", "Prefer": "return=minimal"},
        json={"photos": new_urls}, timeout=60,
    )
    if patch.status_code not in (200, 204):
        rec["error"] = f"patch http {patch.status_code} {patch.text[:150]}"
        rec["ok"] = False
        return rec
    rec["ok"] = True
    return rec


listings = [l for l in live_listings() if l["id"] not in done_ids and args.only in str(l["id"])]
if args.limit:
    listings = listings[: args.limit]
print(f"{len(listings)} annonces à traiter (déjà faites: {len(done_ids)})", flush=True)

tot_o = tot_n = 0
ok_count = fail_count = 0
with open(LOG, "a") as f, ThreadPoolExecutor(args.workers) as ex:
    for i, rec in enumerate(ex.map(process_listing, listings), 1):
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        f.flush()
        if rec.get("ok"):
            ok_count += 1
            tot_o += rec.get("orig_kb", 0)
            tot_n += rec.get("new_kb", 0)
        else:
            fail_count += 1
        print(f"{i}/{len(listings)} id={rec['id']} ok={rec.get('ok')} {rec.get('error','')}", flush=True)

print(f"FIN — ok={ok_count} fail={fail_count} — {tot_o // 1024} MB -> {tot_n // 1024} MB", flush=True)
