#!/usr/bin/env bash

set -euo pipefail

echo "==> CABANA: Installing image optimization tools"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

install_mac() {
  if ! command_exists brew; then
    echo "Error: Homebrew not found. Install Homebrew from https://brew.sh and re-run." >&2
    exit 1
  fi
  brew update || true
  # imagemagick provides 'magick' and 'convert'; webp provides cwebp
  brew install imagemagick webp || true
}

install_linux() {
  if command_exists apt-get; then
    sudo apt-get update -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y imagemagick webp || true
  else
    echo "Error: Unsupported Linux distribution (apt-get not found). Please install ImageMagick and WebP tools manually." >&2
    exit 1
  fi
}

case "${OSTYPE:-}" in
  darwin*) install_mac ;;
  linux*) install_linux ;;
  *) echo "Error: Unsupported OS type '${OSTYPE:-unknown}'. Install ImageMagick and WebP tools manually." >&2; exit 1 ;;
esac

echo "\n==> Verifying installations"

if command_exists magick; then
  IM_CMD="magick"
elif command_exists convert; then
  IM_CMD="convert"
else
  echo "Error: ImageMagick not found after installation." >&2
  exit 1
fi

if ! command_exists cwebp; then
  echo "Error: cwebp not found after installation." >&2
  exit 1
fi

echo "- ImageMagick command: ${IM_CMD} ($( ${IM_CMD} -version | head -n1 ))"
echo "- cwebp version: $(cwebp -version 2>/dev/null || echo 'unknown')"
echo "\n✅ Tools ready. Run: npm run optimize:images"


