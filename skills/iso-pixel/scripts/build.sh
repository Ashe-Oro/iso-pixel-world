#!/bin/bash
# Assemble a scene into one self-contained HTML file.
# usage: build.sh <src_dir> <out.html>
#   <src_dir> holds 00_head.html, NN_*.js (concatenated in name order), 99_tail.html.
#   Also writes <out>.artifact.html: only the content between <!--ARTIFACT-START--> and
#   <!--ARTIFACT-END--> (for hosts such as claude.ai Artifacts that supply their own skeleton).
set -e
SRC=${1:?src dir}; OUT=${2:?out.html}
cd "$SRC"
{ cat 00_head.html; for f in [0-9][0-9]_*.js; do echo "/* ---- $f ---- */"; cat "$f"; echo; done; cat 99_tail.html; } > "$OUT"
ART="${OUT%.html}.artifact.html"
sed -n '/<!--ARTIFACT-START-->/,/<!--ARTIFACT-END-->/p' "$OUT" | sed '/<!--ARTIFACT-START-->/d;/<!--ARTIFACT-END-->/d' > "$ART"
echo "built $OUT ($(wc -c < "$OUT") bytes) + $ART"
