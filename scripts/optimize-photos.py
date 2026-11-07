#!/usr/bin/env python3
"""Optimisation en place des photos d'annonces (bucket Supabase `photos`, préfixe listings/).

Pour chaque photo référencée par une annonce live :
  1. téléchargement de l'original
  2. sauvegarde de l'original sous listings-originals/<nom> (upsert, une seule fois)
  3. redimensionnement (bord long max 1600 px) + ré-encodage (JPEG q82 progressif /
     WebP q80 / PNG optimisé — le format et le NOM ne changent jamais : les URL en
     base restent valides)
  4. upload en écrasant l'original (x-upsert) SEULEMENT si le résultat est plus petit

Usage : python3 optimize-photos.py [--limit N] [--min-kb 150] [--dry-run]
Journal : ~/.hermes/profiles/aircraft2sell/scripts/photos-opt-state.jsonl (une ligne par
fichier ; un nom déjà journalisé n'est jamais retraité — supprimer la ligne pour forcer).
Exécuté chaque semaine par le cron no-agent `photos-optimize-weekly.sh` (les imports
CSV/API des pros contournent la compression côté client de post-listing.html).
"""
import os, sys, io, json, time, argparse, requests
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps

U = os.environ["SUPABASE_URL"]; K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": K, "Authorization": f"Bearer {K}"}
BUCKET = "photos"; MAX_EDGE = 1600
LOG = os.environ.get("PHOTOS_OPT_LOG", os.path.expanduser("~/.hermes/profiles/aircraft2sell/scripts/photos-opt-state.jsonl"))

ap = argparse.ArgumentParser()
ap.add_argument("--limit", type=int, default=0); ap.add_argument("--min-kb", type=int, default=150)
ap.add_argument("--dry-run", action="store_true"); ap.add_argument("--workers", type=int, default=3)
ap.add_argument("--only", default="", help="sous-chaîne du nom pour ne traiter que certains fichiers")
args = ap.parse_args()

done = set()
if os.path.exists(LOG):
    for l in open(LOG):
        try: done.add(json.loads(l)["name"])
        except Exception: pass

def bucket_sizes():
    """Tailles via l'API list (métadonnées) : évite de télécharger les photos déjà légères."""
    sizes, off = {}, 0
    while True:
        r = requests.post(f"{U}/storage/v1/object/list/{BUCKET}", headers={**H, "Content-Type": "application/json"},
                          json={"prefix": "listings", "limit": 1000, "offset": off, "sortBy": {"column": "name", "order": "asc"}}, timeout=60)
        b = r.json() if r.status_code == 200 else []
        if not isinstance(b, list) or not b: break
        for o in b:
            if o.get("metadata"): sizes["listings/" + o["name"]] = int(o["metadata"].get("size", 0))
        off += len(b)
        if len(b) < 1000: break
    return sizes

def live_photo_names():
    rows = requests.get(f"{U}/rest/v1/listings?select=photos&status=eq.live", headers=H, timeout=60).json()
    names = []
    for r in rows:
        for p in (r.get("photos") or []):
            if isinstance(p, str) and f"/object/public/{BUCKET}/" in p:
                names.append(p.split(f"/object/public/{BUCKET}/", 1)[1].split("?")[0])
    names = list(dict.fromkeys(names))
    sizes = bucket_sizes()
    if sizes:
        names = [n for n in names if sizes.get(n, 10**9) >= args.min_kb * 1024]
    return names

def encode(im, fmt):
    im = ImageOps.exif_transpose(im)
    w, h = im.size
    scale = min(1.0, MAX_EDGE / max(w, h))
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    if fmt == "JPEG":
        if im.mode not in ("RGB", "L"): im = im.convert("RGB")
        im.save(buf, "JPEG", quality=80, optimize=True, progressive=True)
    elif fmt == "WEBP":
        im.save(buf, "WEBP", quality=80, method=4)
    elif fmt == "PNG":
        if im.mode == "RGBA" and not any(a < 255 for a in im.getchannel("A").getdata()):
            im = im.convert("RGB")
        im.save(buf, "PNG", optimize=True)
    else:
        return None, im.size
    return buf.getvalue(), im.size

def process(name):
    rec = {"name": name, "t": time.strftime("%H:%M:%S")}
    try:
        r = requests.get(f"{U}/storage/v1/object/public/{BUCKET}/{name}", headers=H, timeout=120)
        if r.status_code != 200: rec["skip"] = f"http {r.status_code}"; return rec
        orig = r.content; rec["orig_kb"] = len(orig) // 1024
        ctype = r.headers.get("content-type", "")
        if rec["orig_kb"] < args.min_kb: rec["skip"] = "déjà léger"; return rec
        im = Image.open(io.BytesIO(orig)); fmt = im.format  # JPEG / PNG / WEBP
        rec["orig_px"] = list(im.size); rec["fmt"] = fmt
        if fmt not in ("JPEG", "PNG", "WEBP"): rec["skip"] = f"format {fmt}"; return rec
        out, size = encode(im, fmt)
        rec["new_kb"] = len(out) // 1024; rec["new_px"] = list(size)
        if len(out) >= len(orig) * 0.92: rec["skip"] = "gain < 8 %"; return rec
        if args.dry_run: rec["dry"] = True; return rec
        # 1) backup original (upsert idempotent)
        b = requests.post(f"{U}/storage/v1/object/{BUCKET}/listings-originals/{name.split('/',1)[-1]}", headers={**H, "Content-Type": ctype or f"image/{fmt.lower()}", "x-upsert": "true"}, data=orig, timeout=180)
        if b.status_code not in (200, 201): rec["error"] = f"backup http {b.status_code} {b.text[:80]}"; return rec
        # 2) overwrite with optimized bytes (same name, same mimetype)
        mime = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}[fmt]
        w = requests.post(f"{U}/storage/v1/object/{BUCKET}/{name}", headers={**H, "Content-Type": mime, "x-upsert": "true", "Cache-Control": "max-age=31536000"}, data=out, timeout=180)
        if w.status_code not in (200, 201): rec["error"] = f"upload http {w.status_code} {w.text[:80]}"; return rec
        rec["ok"] = True
    except Exception as e:
        rec["error"] = str(e)[:160]
    return rec

names = [n for n in live_photo_names() if n not in done and args.only in n]
if args.limit: names = names[:args.limit]
print(f"{len(names)} photos à traiter (déjà faites: {len(done)})", flush=True)
tot_o = tot_n = 0
with open(LOG, "a") as f, ThreadPoolExecutor(args.workers) as ex:
    for i, rec in enumerate(ex.map(process, names), 1):
        f.write(json.dumps(rec, ensure_ascii=False) + "\n"); f.flush()
        if rec.get("ok") or rec.get("dry"): tot_o += rec["orig_kb"]; tot_n += rec["new_kb"]
        if i % 25 == 0 or args.limit: print(f"{i}/{len(names)} {rec}", flush=True)
print(f"FIN — {tot_o//1024} MB -> {tot_n//1024} MB", flush=True)
