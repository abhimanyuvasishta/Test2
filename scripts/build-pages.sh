#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_DIR="src/app/api"
BACKUP="/tmp/client-video-studio-api"

if [ -d "$API_DIR" ]; then
  rm -rf "$BACKUP"
  mv "$API_DIR" "$BACKUP"
fi

restore_api() {
  if [ -d "$BACKUP" ] && [ ! -d "$API_DIR" ]; then
    mv "$BACKUP" "$API_DIR"
  fi
}
trap restore_api EXIT

STATIC_EXPORT=1 npx next build

rm -rf docs
mkdir -p docs
cp -R out/. docs/
touch docs/.nojekyll

# GitHub Pages for this repo currently publishes the branch root.
cp out/index.html "$ROOT/index.html"
if [ -f out/404.html ]; then
  cp out/404.html "$ROOT/404.html"
fi
rm -rf "$ROOT/_next"
cp -R out/_next "$ROOT/_next"
touch "$ROOT/.nojekyll"
