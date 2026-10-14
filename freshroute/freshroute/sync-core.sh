#!/usr/bin/env bash
# Copies the shared engine into both apps. Edit ONLY /shared, then run this.
set -e
cd "$(dirname "$0")"
for app in web mobile; do
  mkdir -p "$app/src/core"
  for f in shared/*.ts; do
    case "$f" in *.test.ts) continue;; esac
    cp "$f" "$app/src/core/"
  done
done
echo "core synced to web/ and mobile/"
