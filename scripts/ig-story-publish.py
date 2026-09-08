#!/usr/bin/env python3
"""
Publie une story Instagram via l'Instagram Graph API.

Usage:
  python3 ig-story-publish.py <image_url> "<caption (non utilisée sur story, log only)>"

Nécessite dans l'environnement (chargées depuis ~/.hermes/profiles/aircraft2sell/.env) :
  IG_USER_ID          - Instagram User ID (numérique)
  IG_ACCESS_TOKEN      - token longue durée (60j), généré via le flow Instagram Login
  IG_APP_SECRET        - App Secret Meta (pour le refresh du token)

Étapes Graph API :
  1. POST /{ig-user-id}/media?image_url=...&media_type=STORIES  -> creation_id
  2. Attendre que le statut du conteneur soit FINISHED (poll status_code)
  3. POST /{ig-user-id}/media_publish?creation_id=...            -> story publiée
"""
import os
import sys
import time
import json
import urllib.request
import urllib.parse

GRAPH = "https://graph.facebook.com/v21.0"


def api_post(path, params):
    url = f"{GRAPH}/{path}"
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def api_get(path, params):
    url = f"{GRAPH}/{path}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    if len(sys.argv) < 2:
        print("Usage: ig-story-publish.py <image_url> [caption_log]", file=sys.stderr)
        sys.exit(1)

    image_url = sys.argv[1]
    caption = sys.argv[2] if len(sys.argv) > 2 else ""

    ig_user_id = os.environ.get("IG_USER_ID")
    access_token = os.environ.get("IG_ACCESS_TOKEN")

    if not ig_user_id or not access_token:
        print(json.dumps({"error": "IG_USER_ID ou IG_ACCESS_TOKEN manquant dans l'environnement"}))
        sys.exit(2)

    # 1. Créer le conteneur
    container = api_post(f"{ig_user_id}/media", {
        "image_url": image_url,
        "media_type": "STORIES",
        "access_token": access_token,
    })
    if "id" not in container:
        print(json.dumps({"step": "create_container", "error": container}))
        sys.exit(3)
    creation_id = container["id"]

    # 2. Poll du statut (jusqu'à FINISHED, max ~30s)
    status = None
    for _ in range(15):
        time.sleep(2)
        info = api_get(creation_id, {
            "fields": "status_code",
            "access_token": access_token,
        })
        status = info.get("status_code")
        if status == "FINISHED":
            break
        if status == "ERROR":
            print(json.dumps({"step": "container_status", "error": info}))
            sys.exit(4)

    if status != "FINISHED":
        print(json.dumps({"step": "container_status_timeout", "last_status": status}))
        sys.exit(5)

    # 3. Publier
    publish = api_post(f"{ig_user_id}/media_publish", {
        "creation_id": creation_id,
        "access_token": access_token,
    })
    if "id" not in publish:
        print(json.dumps({"step": "publish", "error": publish}))
        sys.exit(6)

    print(json.dumps({
        "success": True,
        "media_id": publish["id"],
        "image_url": image_url,
        "caption_logged": caption,
    }))


if __name__ == "__main__":
    main()
