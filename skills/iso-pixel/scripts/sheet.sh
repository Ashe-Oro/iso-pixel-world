#!/bin/bash
# Build a sprite-sheet viewer page for character rigs.
# usage: sheet.sh <src_dir> <setup.js> <out.html> <rig.js>...
#   setup.js must build frames and set: window.SHEETS = [[name, Spr], ...]
#   e.g.  buildHeroFrames(); window.SHEETS = Object.keys(HERO).map(k => [k, HERO[k]]);
set -e
SRC=${1:?}; SETUP=${2:?}; OUT=${3:?}; shift 3
HERE=$(cd "$(dirname "$0")" && pwd)
{ cat "$SRC/00_head.html"; cat "$SRC/01_core.js"; for f in "$@"; do cat "$SRC/$f"; done; cat "$SETUP" "$HERE/sheet-viewer.js"; cat "$SRC/99_tail.html"; } > "$OUT"
echo "sheet page: $OUT  (screenshot it with shot-full.js)"
