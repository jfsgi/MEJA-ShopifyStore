# Deploying the MEJA theme to a Shopify dev store

A practical runbook to get this Online Store 2.0 theme running and wired to the integrations.
See also `../docs/06-API-Contracts.md` (contracts) and `metafields/definitions.json`.

## 1. Prerequisites
- A **Shopify Partner** account + a **development store**.
- **Shopify CLI**: `npm install -g @shopify/cli @shopify/theme`
- (Optional, for live pricing) a **Shopify app** to host the Cart Transform Function.

## 2. Preview / push the theme
```sh
cd theme
shopify theme dev      # live preview against your dev store (hot reload)
# or
shopify theme push     # upload as a new/updated theme
shopify theme check     # the same linter CI runs (expect 0 offenses)
```

## 3. Embed the 4kGraphics engine
Upload the engine bundle so the configurator viewer lights up:
```sh
cp /path/to/4kgraphics-engine.browser.js theme/assets/4kgraphics-engine.browser.js
```
`sections/configurator.liquid` imports it via `assets/configurator.js`. For server-side 4K,
set **Theme settings → Integrations → 4kGraphics render service URL** to your `/v1/render` host.

## 4. Create the metafield definitions
Create the definitions in **Settings → Custom data** (or via the Admin API
`metafieldDefinitionCreate`) exactly as listed in `metafields/definitions.json`
(namespaces `crm`, `reviews`, `custom`). MEJA‑CRM writes the values.

## 5. Wire the configurable products
- Create one **base "configurable" product** per family (Drawer Box, Drawer Unit, Cabinet
  Door, Shelf) with a single base variant.
- Put that **base variant ID** into the Configurator section setting (`base_variant_id`).
- Create a **page** using the `page.configurator` template (handle `configurator`), and a
  page using `page.quotes` (handle `quotes`).
- Set collections `drawer-boxes`, `drawer-units`, `cabinet-doors`, `shelves` and enable
  **Search & Discovery** filters (the collection template renders `collection.filters`).

## 6. Live pricing (Cart Transform) — Decision D10
Deploy `functions/cart-transform/` as a **Shopify Function** in an app:
```sh
shopify app dev          # from the app that contains the function
shopify app deploy
```
The storefront adds configured items with a signed `_meja_unit_price` + `_configId`; the
function applies the CRM‑authoritative price. CRM‑pushed quotes can use **Draft Orders** instead.

## 7. Reviews app (Decision D13)
Install a reviews app (Judge.me / Loox / Okendo) and add its **app block** to the product
and reviews sections (the `@app` slot is already exposed). Trigger review requests from
MEJA‑CRM after `orders/fulfilled` (`review_request` job).

## 8. Go-live
Follow the **sandbox live-testing & demo gate** in `../docs/01-Master-Plan.md` §11.1 before
swapping DNS from the existing store.
