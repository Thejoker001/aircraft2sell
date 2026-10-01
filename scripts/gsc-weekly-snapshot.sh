#!/bin/bash
# Snapshot hebdomadaire des requêtes/pages Search Console -> JSONL historique.
# no_agent : déterministe, pas besoin d'un LLM. Exécuté par cron.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a && . ~/.hermes/profiles/aircraft2sell/.env && set +a

OUT_DIR=~/workspace/seo-tracking
mkdir -p "$OUT_DIR"
DATE=$(date -u +%Y-%m-%d)

{
  echo "=== $DATE — queries (28j) ==="
  python3 scripts/gsc-submit.py queries 28
  echo
  echo "=== $DATE — pages (28j) ==="
  python3 scripts/gsc-submit.py pages 28
  echo
  echo "=== $DATE — opportunities (28j) ==="
  python3 scripts/gsc-submit.py opportunities 28
} >> "$OUT_DIR/history_$DATE.txt" 2>&1

echo "Snapshot écrit dans $OUT_DIR/history_$DATE.txt"
