#!/usr/bin/env bash
# Baja MediaPipe (recorte de la foto de la Collector Card) a assets/vendor/mediapipe/ para alojarlo nosotros.
# Versión fija: si cambia, cambiar también la versión en PCAP_VISION (custom/card/photo-capture.js).
#
# Los archivos NO se commitean (pesan ~19 MB, ver .gitignore): el dev corre este script y sube la carpeta junto
# con el resto de assets/ a ASSET_BASE. Sin ellos el recorte falla y la carta usa la foto entera (no se rompe).
set -euo pipefail
VERSION="0.10.14"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/vendor/mediapipe"
NPM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}"
MODEL="https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite"

mkdir -p "$OUT/wasm"
get() { echo "  $2"; curl -fsSL "$1" -o "$OUT/$2"; }
get "$NPM/vision_bundle.mjs" vision_bundle.mjs
for f in vision_wasm_internal.js vision_wasm_internal.wasm vision_wasm_nosimd_internal.js vision_wasm_nosimd_internal.wasm; do
  get "$NPM/wasm/$f" "wasm/$f"
done
get "$MODEL" selfie_segmenter.tflite
# Sin el comentario del source map (no lo alojamos: daría 404 en la consola de desarrollo)
sed -i.bak '/sourceMappingURL/d' "$OUT/vision_bundle.mjs" && rm -f "$OUT/vision_bundle.mjs.bak"
echo "$VERSION" > "$OUT/VERSION"
du -sh "$OUT"
