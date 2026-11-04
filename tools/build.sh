#!/bin/bash
# Build scenes into public/<scene>/index.html (one self-contained HTML file each).
# usage: tools/build.sh [scene ...]      (no arguments = every folder in scenes/)
# A scene folder holds 00_head.html, NN_*.js (joined in name order) and 99_tail.html.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
if [ $# -eq 0 ]; then set -- $(ls "$ROOT/scenes"); fi
for s in "$@"; do
  SRC="$ROOT/scenes/$s"; OUT="$ROOT/public/$s/index.html"
  [ -f "$SRC/00_head.html" ] || { echo "no scene at scenes/$s"; exit 1; }
  mkdir -p "$(dirname "$OUT")"
  { cat "$SRC/00_head.html"; for f in "$SRC"/[0-9][0-9]_*.js; do echo "/* ---- $(basename "$f") ---- */"; cat "$f"; echo; done; cat "$SRC/99_tail.html"; } > "$OUT"
  echo "built public/$s/index.html ($(wc -c < "$OUT") bytes)"
done
