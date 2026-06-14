# First push — safely (your live store stays untouched)

Everything here creates an **unpublished** theme + temporary previews only. Your current
live theme is never changed unless you explicitly run `shopify theme publish` / click Publish.

## 0. One-time setup
```sh
# Install the Shopify CLI (includes theme commands)
npm install -g @shopify/cli@latest
shopify version
```

## 1. Get the code locally
```sh
git clone -b claude/awesome-cori-hk0m0c https://github.com/jfsgi/MEJA-ShopifyStore.git
cd MEJA-ShopifyStore/theme
```

## 2. Preview it live (safe — only you can see it)
Replace `YOURSTORE` with your store (e.g. `mejadesigns.myshopify.com`). The first run opens a
browser to log in.
```sh
shopify theme dev --store YOURSTORE
```
This spins up a **temporary development theme** and a hot-reloading preview URL
(`http://127.0.0.1:9292`). It does **not** touch your live theme. Ctrl-C to stop; the temp
theme is cleaned up.

## 3. (Optional) Lint — same check CI runs
```sh
shopify theme check
# expect: 0 offenses
```

## 4. Upload as a NEW, UNPUBLISHED theme
```sh
shopify theme push --unpublished --store YOURSTORE --theme "MEJA — Scandi Light (preview)"
```
- Creates a brand-new theme in **Online Store → Themes**, sitting **below** your live theme.
- The CLI prints an **editor** link and a **preview** link.
- Your live store is unaffected. Customers see nothing.

Preview/customize it anytime: **Online Store → Themes → "MEJA — Scandi Light (preview)" →
Preview / Customize**.

## 5. What NOT to run (until you've reviewed + signed off)
```sh
# shopify theme publish     # <- this is the ONLY thing that makes it live. Don't run yet.
```

## 6. Make it actually work (after preview)
The theme is a scaffold; to light up the full experience, follow `DEPLOY.md`:
1. Drop `4kgraphics-engine.browser.js` into `theme/assets/` (configurator 3D/4K).
2. Create the metafield definitions from `metafields/definitions.json`.
3. Create base "configurable" products + set their variant ID in the Configurator section.
4. Create pages with the `configurator` and `quotes` templates; set up collections + filters.
5. Deploy the Cart Transform function (live pricing) and install a reviews app.

## Safety recap
- **Unpublished theme** = not live. Your current store keeps serving customers.
- **Metafield definitions** = store-wide schema, harmless.
- **Apps** only act where you place their blocks/enable their functions.
- Go live only via the **§11.1 sandbox gate** in `../docs/01-Master-Plan.md`.
