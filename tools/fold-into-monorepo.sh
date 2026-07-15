#!/usr/bin/env bash
# Fold the MEJA storefront (Shopify theme repo) into the MEJA monorepo as storefront/.
#
#   RUN THIS FROM THE ROOT OF THE MONOREPO — not from the storefront repo.
#
# See docs/FOLD-INTO-MONOREPO.md for the full runbook (incl. the Shopify reconnection step).
set -euo pipefail

# Target monorepo: jfsgi/MEJA-CRM-OrderManagement (apps/crm, apps/atelier, 4kgraphics/,
# packages/contract). Default PREFIX=storefront (repo ROOT) matches the 4kgraphics/ precedent
# (the other non-Vercel, separately-deployed app). Set PREFIX=apps/storefront to nest it.
PREFIX="${PREFIX:-storefront}"
MODE="${MODE:-subtree}"                       # subtree (preserve history) | copy (clean)
STOREFRONT_REMOTE="${STOREFRONT_REMOTE:-https://github.com/jfsgi/meja-shopifystore.git}"
STOREFRONT_BRANCH="${STOREFRONT_BRANCH:-claude/awesome-cori-hk0m0c}"
PUBLISH_BRANCH="${PUBLISH_BRANCH:-shopify-theme}"
WORK_BRANCH="${WORK_BRANCH:-fold/storefront}" # never fold straight onto main

# --- safety checks -----------------------------------------------------------
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
[ -z "$(git status --porcelain)" ] || { echo "✗ Working tree not clean — commit/stash first."; exit 1; }
[ -e "$PREFIX" ] && { echo "✗ $PREFIX already exists — aborting."; exit 1; }
# Work on a dedicated branch so main is never touched directly (review/merge after).
git switch -c "$WORK_BRANCH" 2>/dev/null || { echo "✗ Branch $WORK_BRANCH exists — set WORK_BRANCH=…"; exit 1; }
echo "▸ Folding $STOREFRONT_REMOTE@$STOREFRONT_BRANCH -> $PREFIX (mode=$MODE) on $WORK_BRANCH"

# --- bring the storefront in -------------------------------------------------
if [ "$MODE" = "subtree" ]; then
  git remote add storefront "$STOREFRONT_REMOTE" 2>/dev/null || git remote set-url storefront "$STOREFRONT_REMOTE"
  git fetch storefront "$STOREFRONT_BRANCH"
  git subtree add --prefix="$PREFIX" storefront "$STOREFRONT_BRANCH"
else
  tmp="$(mktemp -d)"
  git clone --depth 1 --branch "$STOREFRONT_BRANCH" "$STOREFRONT_REMOTE" "$tmp/sf"
  rm -rf "$tmp/sf/.git"
  mkdir -p "$PREFIX"
  cp -R "$tmp/sf/." "$PREFIX/"
  rm -rf "$tmp"
  git add "$PREFIX"
  git commit -m "Add storefront (Shopify theme) at $PREFIX"
fi

# --- workspace package.json (if the subtree didn't already carry one) --------
if [ ! -f "$PREFIX/package.json" ]; then
  cat > "$PREFIX/package.json" <<'JSON'
{
  "name": "@meja/storefront",
  "private": true,
  "version": "0.1.0",
  "description": "MEJA Shopify Online Store 2.0 theme. Deploys via the Shopify GitHub integration (the shopify-theme branch), NOT Vercel.",
  "scripts": {
    "check": "python3 tools/theme_check.py",
    "sync:shopify": "THEME_PREFIX=__PREFIX__/theme bash tools/sync_shopify_theme.sh"
  }
}
JSON
  perl -pi -e "s#__PREFIX__#$PREFIX#g" "$PREFIX/package.json"
  echo "▸ wrote $PREFIX/package.json"
fi

# --- monorepo-path-aware publish sync ----------------------------------------
mkdir -p "$PREFIX/tools"
cat > "$PREFIX/tools/sync_shopify_theme.sh" <<'SYNC'
#!/usr/bin/env bash
# Build/refresh the publish branch (default: shopify-theme) whose ROOT is the contents of
# the theme dir, for Shopify's GitHub theme integration. Run from the MONOREPO ROOT.
# Reverse-sync config/settings_data.json from origin/<publish> into the theme BEFORE running.
set -euo pipefail
THEME_PREFIX="${THEME_PREFIX:-__PREFIX__/theme}"
PUBLISH_BRANCH="${PUBLISH_BRANCH:-shopify-theme}"
DIRS="assets config layout locales sections snippets templates"
git fetch -q origin "$PUBLISH_BRANCH" || true
TMPIDX="$(mktemp)"; export GIT_INDEX_FILE="$TMPIDX"
git read-tree --empty
for d in $DIRS; do git read-tree --prefix="$d/" "HEAD:$THEME_PREFIX/$d"; done
TREE="$(git write-tree)"; unset GIT_INDEX_FILE
PARENT=""; git rev-parse --verify -q "origin/$PUBLISH_BRANCH" >/dev/null 2>&1 && PARENT="-p origin/$PUBLISH_BRANCH"
MSG="Sync $THEME_PREFIX -> $PUBLISH_BRANCH root ($(git rev-parse --short HEAD))"
COMMIT="$(git commit-tree "$TREE" $PARENT -m "$MSG")"
git update-ref "refs/heads/$PUBLISH_BRANCH" "$COMMIT"
rm -f "$TMPIDX"; echo "$PUBLISH_BRANCH -> $COMMIT"
SYNC
perl -pi -e "s#__PREFIX__#$PREFIX#g" "$PREFIX/tools/sync_shopify_theme.sh"
chmod +x "$PREFIX/tools/sync_shopify_theme.sh"
echo "▸ wrote $PREFIX/tools/sync_shopify_theme.sh (THEME_PREFIX=$PREFIX/theme)"

# --- root CI workflow (mirrors the storefront's CI, scoped to $PREFIX) ----
mkdir -p .github/workflows
cat > .github/workflows/storefront.yml <<'YAML'
name: storefront

on:
  push:
    paths: ["__PREFIX__/**"]
  pull_request:
    paths: ["__PREFIX__/**"]

defaults:
  run:
    working-directory: __PREFIX__

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Validate theme JSON
        run: |
          python - <<'PY'
          import json, glob, sys
          skip = {'theme/config/settings_data.json'}
          files = [f for f in glob.glob('theme/**/*.json', recursive=True) if f not in skip]
          bad = 0
          for f in files:
              try: json.load(open(f, encoding='utf-8'))
              except Exception as e: print('BAD', f, e); bad += 1
          print(f'checked {len(files)} JSON files; {bad} invalid')
          sys.exit(1 if bad else 0)
          PY
      - name: Theme sanity
        run: python tools/theme_check.py

  theme-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.3"
      - run: gem install theme-check -v 1.15.0 --no-document
      - run: theme-check theme/
        working-directory: __PREFIX__
YAML
perl -pi -e "s#__PREFIX__#$PREFIX#g" .github/workflows/storefront.yml
echo "▸ wrote .github/workflows/storefront.yml"

git add "$PREFIX/package.json" "$PREFIX/tools/sync_shopify_theme.sh" .github/workflows/storefront.yml
git commit -m "Wire $PREFIX into the monorepo (workspace, sync, CI)" || true

cat <<DONE

✓ Folded into $PREFIX on branch $WORK_BRANCH.

Next (manual — see $PREFIX/docs/FOLD-INTO-MONOREPO.md §5):
  1. Push the work branch & review/merge: git push -u origin $WORK_BRANCH
  2. Confirm root package.json workspaces include apps/* (or add $PREFIX).
  3. Build + push the publish branch:
       THEME_PREFIX=$PREFIX/theme bash $PREFIX/tools/sync_shopify_theme.sh
       git push -u origin $PUBLISH_BRANCH
  4. Shopify admin: disconnect the old GitHub theme, reconnect to THIS monorepo's
     '$PUBLISH_BRANCH' branch.
  5. Verify: theme-check $PREFIX/theme  → 0 offenses.
DONE
