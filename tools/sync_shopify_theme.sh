#!/usr/bin/env bash
# Build/refresh the `shopify-theme` branch whose ROOT is the contents of theme/
# (only the standard Shopify theme dirs), for Shopify's GitHub theme integration.
# Does not touch the working tree or the current branch.
set -euo pipefail
DIRS="assets config layout locales sections snippets templates"
# Parent on the REMOTE tip so the push fast-forwards over Shopify editor commits.
# NOTE: reverse-sync config/settings_data.json from origin/shopify-theme into theme/ and
# commit it BEFORE running this, so editor-driven settings (logo, etc.) aren't clobbered.
git fetch -q origin shopify-theme || true
TMPIDX="$(mktemp)"
export GIT_INDEX_FILE="$TMPIDX"
git read-tree --empty
for d in $DIRS; do git read-tree --prefix="$d/" "HEAD:theme/$d"; done
TREE="$(git write-tree)"
unset GIT_INDEX_FILE
PARENT=""
git rev-parse --verify -q origin/shopify-theme >/dev/null 2>&1 && PARENT="-p origin/shopify-theme"
MSG="Sync theme/ -> shopify-theme root ($(git rev-parse --short HEAD))"
COMMIT="$(git commit-tree "$TREE" $PARENT -m "$MSG")"
git update-ref refs/heads/shopify-theme "$COMMIT"
rm -f "$TMPIDX"
echo "shopify-theme -> $COMMIT"
