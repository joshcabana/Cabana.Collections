#!/usr/bin/env bash

set -euo pipefail

SRC_DIR="assets/Images"
OUT_WEBP_DIR="assets/Images/webp"
OUT_RESP_DIR="assets/Images/responsive"

MOBILE_W=400
TABLET_W=800
DESKTOP_W=1200

log() { printf "[optimize-images] %s\n" "$*"; }
err() { printf "[optimize-images][ERROR] %s\n" "$*" >&2; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Pick ImageMagick command name
if command_exists magick; then
  IM_CMD="magick"
elif command_exists convert; then
  IM_CMD="convert"
else
  err "ImageMagick not found. Install via: npm run install:tools"
  exit 1
fi

if ! command_exists cwebp; then
  err "cwebp not found. Install via: npm run install:tools"
  exit 1
fi

if [ ! -d "$SRC_DIR" ]; then
  err "Source directory '$SRC_DIR' not found. Run from project root."
  exit 1
fi

mkdir -p "$OUT_WEBP_DIR" "$OUT_RESP_DIR" || true

# Progress counters
total=0
converted=0
resized=0
skipped=0

# Find PNG/JPG/JPEG files (case-insensitive)
mapfile -t files < <(find "$SRC_DIR" -maxdepth 1 -type f \( \
  -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \
\))

total=${#files[@]}
if [ "$total" -eq 0 ]; then
  log "No PNG/JPG images found in $SRC_DIR. Nothing to do."
  exit 0
fi

log "Processing $total images from '$SRC_DIR'"

pad() { printf "%03d" "$1"; }

idx=0
for src in "${files[@]}"; do
  idx=$((idx+1))
  base=$(basename "$src")
  name_noext=${base%.*}
  ext=${base##*.}
  ext_lc=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

  printf "(%s/%s) %s\n" "$(pad "$idx")" "$(pad "$total")" "$base"

  # 1) Convert to WebP (lossy quality 78; alpha smart for PNG)
  out_webp="$OUT_WEBP_DIR/${name_noext}.webp"
  if [ -f "$out_webp" ] && [ "$out_webp" -nt "$src" ]; then
    log "  - WebP up-to-date → skip"
    skipped=$((skipped+1))
  else
    # Use cwebp directly for performance and consistent output
    if [[ "$ext_lc" == "png" ]]; then
      cwebp -q 78 -alpha_method 1 -mt "$src" -o "$out_webp" >/dev/null 2>&1 || {
        err "  - cwebp failed for $src"; continue; }
    else
      cwebp -q 78 -mt "$src" -o "$out_webp" >/dev/null 2>&1 || {
        err "  - cwebp failed for $src"; continue; }
    fi
    log "  - WebP → ${out_webp}"
    converted=$((converted+1))
  fi

  # 2) Generate responsive sizes in original format to keep fallbacks
  for w in $MOBILE_W $TABLET_W $DESKTOP_W; do
    dest="$OUT_RESP_DIR/${name_noext}-${w}.${ext_lc}"
    if [ -f "$dest" ] && [ "$dest" -nt "$src" ]; then
      log "  - ${w}px up-to-date → skip"
      skipped=$((skipped+1))
      continue
    fi

    # Use ImageMagick to resize with good quality settings
    # -strip: remove metadata; -filter: Lanczos; -quality 82 (for JPEG); PNG compression
    case "$ext_lc" in
      jpg|jpeg)
        $IM_CMD "$src" -strip -resize ${w}x -filter Lanczos -quality 82 "$dest" >/dev/null 2>&1 || {
          err "  - resize failed (JPEG) $src"; continue; }
        ;;
      png)
        $IM_CMD "$src" -strip -resize ${w}x -filter Lanczos -define png:compression-level=9 "$dest" >/dev/null 2>&1 || {
          err "  - resize failed (PNG) $src"; continue; }
        ;;
      *)
        # Fallback: write JPEG
        dest="$OUT_RESP_DIR/${name_noext}-${w}.jpg"
        $IM_CMD "$src" -strip -resize ${w}x -filter Lanczos -quality 82 "$dest" >/dev/null 2>&1 || {
          err "  - resize failed (fallback) $src"; continue; }
        ;;
    esac
    log "  - ${w}px → ${dest}"
    resized=$((resized+1))
  done
done

echo
log "Done. Summary:"
log "  - Total:     ${total}"
log "  - WebP made: ${converted}"
log "  - Resized:   ${resized}"
log "  - Skipped:   ${skipped}"

log "Outputs:"
log "  - WebP:       ${OUT_WEBP_DIR}"
log "  - Responsive: ${OUT_RESP_DIR}"


