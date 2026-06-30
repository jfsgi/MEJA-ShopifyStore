# Folding the storefront into the MEJA monorepo

Runbook to fold this repo (the Shopify Online Store 2.0 theme) into the **MEJA monorepo**
**`jfsgi/MEJA-CRM-OrderManagement`** (`apps/crm`, `apps/atelier`, `4kgraphics/`,
`packages/contract`; npm workspaces + Turborepo; Vercel + Railway deploys) as
**`apps/storefront`**.

> **Who runs this:** this session can't reach the monorepo (account-owned sessions disable
> repo add/list). Run the script **from the monorepo root** yourself, or start a Claude Code
> session **on `jfsgi/MEJA-CRM-OrderManagement`** and have it run the fold there (it can then
> inspect that repo's `package.json`/`turbo.json`/CI and wire things precisely, and push a
> branch). Defaults were chosen non-interactively; override with env vars (§2).

> **Placement note:** `4kgraphics/` — the other non-Vercel, separately-deployed app — sits at
> the **repo root**, not under `apps/`. So `PREFIX=storefront` (root) mirrors that precedent;
> `apps/storefront` keeps all apps together. Both are fine — pick one via `PREFIX`.

---

## 1. The one thing that makes this non-trivial: Shopify can't sync a subdirectory

Shopify's GitHub theme integration syncs the theme from the **root of a branch** — there is
no "root directory" option (unlike Vercel, which `apps/crm` and `apps/atelier` use). This repo
already handles that with a **dual-branch** setup, and we keep it in the monorepo:

- **Source** lives at `apps/storefront/theme/` (the standard Shopify dirs).
- A **`shopify-theme`** branch in the *monorepo* holds those files at the **repo root**, built
  by `apps/storefront/tools/sync_shopify_theme.sh` (a `git commit-tree` of `theme/`'s contents).
- **Shopify connects to the monorepo's `shopify-theme` branch** (you re-point it — §5).

```
monorepo/                         monorepo @ shopify-theme branch (what Shopify sees)
├─ apps/                          ├─ assets/
│  ├─ crm/        (Vercel)        ├─ config/
│  ├─ atelier/    (Vercel)        ├─ layout/
│  └─ storefront/ (Shopify)  ──▶  ├─ locales/
│     └─ theme/{assets,…}         ├─ sections/
├─ packages/contract/            ├─ snippets/
└─ …                              └─ templates/
```

`apps/storefront` is the **only app that deploys via Shopify, not Vercel** — give it no Vercel
project; include it in Turborepo only for lint/check.

---

## 2. Decisions (defaults + overrides)

| Var | Default | Meaning |
| --- | --- | --- |
| `PREFIX` | `apps/storefront` | Where the storefront lands in the monorepo |
| `MODE` | `subtree` | `subtree` preserves full git history; `copy` = one clean commit |
| `STOREFRONT_REMOTE` | `https://github.com/jfsgi/meja-shopifystore.git` | This repo's URL |
| `STOREFRONT_BRANCH` | `claude/awesome-cori-hk0m0c` | Branch with the latest work (not stale `main`) |
| `PUBLISH_BRANCH` | `shopify-theme` | Root-layout branch Shopify connects to |

Example override: `PREFIX=apps/shopify MODE=copy bash fold-into-monorepo.sh`

---

## 3. Prerequisites
- Run from a **clean** checkout of the **monorepo root** (`git status` clean).
- `git subtree` available (ships with Git; `git subtree --help` to confirm) — only for `subtree` mode.
- The storefront branch is pushed (it is — CI is green on `claude/awesome-cori-hk0m0c`).

## 4. Run it
Copy `apps/storefront/tools/fold-into-monorepo.sh` from this repo (or grab it from the storefront
repo's `tools/`) into the monorepo and run:

```sh
cd /path/to/monorepo
bash fold-into-monorepo.sh
```

It will:
1. `git subtree add --prefix=apps/storefront <storefront> <branch>` (or copy, per `MODE`).
2. Write **`apps/storefront/package.json`** (`@meja/storefront`, private, `check`/`sync` scripts) if absent.
3. Overwrite **`apps/storefront/tools/sync_shopify_theme.sh`** with a monorepo-path-aware version
   (`THEME_PREFIX=apps/storefront/theme`).
4. Write **`.github/workflows/storefront.yml`** at the monorepo root (mirrors this repo's CI,
   scoped to `apps/storefront/**`, runs with `working-directory: apps/storefront`).
5. Print the manual follow-ups below.

## 5. Manual follow-ups (the parts the script can't safely do)

1. **Workspaces** — if the monorepo's root `package.json` uses `"workspaces": ["apps/*", …]`,
   `apps/storefront` is picked up automatically. If it lists apps explicitly, add `apps/storefront`.
   Turborepo: ensure a `check` (or `lint`) pipeline task exists; `@meja/storefront`'s `check`
   runs the theme sanity. The storefront has **no build/deploy** task (Shopify hosts it).
2. **Build the publish branch and push it:**
   ```sh
   THEME_PREFIX=apps/storefront/theme bash apps/storefront/tools/sync_shopify_theme.sh
   git push -u origin shopify-theme
   ```
3. **Re-point Shopify (admin — only you can do this):**
   Shopify admin → **Online Store → Themes →** the GitHub-connected theme → **"…" → Disconnect
   from GitHub**, then **Add theme → Connect from GitHub →** pick the **monorepo** repo and the
   **`shopify-theme`** branch. (Settings carry over because `theme/config/settings_data.json`
   travels with the fold — verify it matches the live theme first.)
4. *(Optional cleanup)* remove the nested `apps/storefront/.github/` (GitHub only runs root
   workflows, so it's inert) and the old storefront repo can be archived once the monorepo
   connection is verified.

## 6. Verify
- `python3 apps/storefront/tools/theme_check.py` → sanity OK.
- `theme-check apps/storefront/theme` → 0 offenses.
- The `shopify-theme` branch root = `assets config layout locales sections snippets templates`.
- Shopify shows "Last saved … from <monorepo>/shopify-theme" after a test commit.

## 7. Ongoing workflow after the fold
Same as today, paths shifted:
1. Edit under `apps/storefront/theme/…`.
2. Before publishing, reverse-sync editor settings:
   `git show origin/shopify-theme:config/settings_data.json > apps/storefront/theme/config/settings_data.json` (commit if changed).
3. `THEME_PREFIX=apps/storefront/theme bash apps/storefront/tools/sync_shopify_theme.sh && git push origin shopify-theme`.

## 8. Rollback
- `subtree` mode is a normal merge commit — `git revert -m 1 <commit>` or reset before pushing.
- The original storefront repo is untouched; nothing here deletes it.
