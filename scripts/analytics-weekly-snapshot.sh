#!/bin/bash
# Snapshot hebdomadaire trafic reel + funnel conversion -> historique JSONL.
# no_agent : deterministe, pas besoin d'un LLM. Execute par cron (lundi).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a && . ~/.hermes/profiles/aircraft2sell/.env && set +a

OUT_DIR=~/workspace/seo-tracking
mkdir -p "$OUT_DIR"
DATE=$(date -u +%Y-%m-%d)

python3 scripts/analytics-weekly-snapshot.py >> "$OUT_DIR/analytics_history_$DATE.txt" 2>&1

echo "Snapshot ecrit dans $OUT_DIR/analytics_history_$DATE.txt"
