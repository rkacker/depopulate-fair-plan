#!/usr/bin/env bash
# Copy the two pipeline-produced data files into web/public/data/.
# Run from web/ after the pipeline has produced fresh data/exports/.
#
# Usage:
#   cd web && ./scripts/sync-data.sh
#
# The pipeline emits these from `just build` at the repo root.

set -euo pipefail

WEB_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIPELINE_EXPORTS="$WEB_ROOT/../data/exports"

if [[ ! -d "$PIPELINE_EXPORTS" ]]; then
  echo "error: pipeline exports not found at $PIPELINE_EXPORTS" >&2
  echo "run 'just build' from the repo root first" >&2
  exit 1
fi

mkdir -p "$WEB_ROOT/public/data"

for f in california_county_data.csv site_stats.json; do
  src="$PIPELINE_EXPORTS/$f"
  dst="$WEB_ROOT/public/data/$f"
  if [[ ! -f "$src" ]]; then
    echo "error: missing $src" >&2
    exit 1
  fi
  cp "$src" "$dst"
  echo "synced: $f"
done

echo
echo "done. public/data/ contents:"
ls -lh "$WEB_ROOT/public/data/"
