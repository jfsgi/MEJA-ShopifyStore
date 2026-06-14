# MEJA \u2014 Shopify Online Store 2.0 theme (scaffold)

Scaffolded from the approved **Scandi Light** mockups (`../mockups/`) and shared design
system (`assets/scandi.css`). This is a **starting structure**, not a finished theme.

## Structure
- `layout/theme.liquid` \u2014 base layout; loads `scandi.css` + `theme.css`; maps theme
  settings to `--brand`/`--accent`/`--ink`.
- `sections/` \u2014 header, footer, hero, product-categories, reviews, **configurator**
  (embeds the 4kGraphics engine), main-product, main-collection, main-cart.
- `snippets/` \u2014 product-card, price-block, made-to-order microcopy.
- `templates/` \u2014 index/product/collection/cart JSON templates + `page.configurator.json`.
- `assets/` \u2014 `scandi.css` (design system), `theme.css` (page layouts), `configurator.js`.
- `config/` \u2014 settings schema + data. `locales/` \u2014 en.default.

## Configurator + 4kGraphics
`sections/configurator.liquid` renders the option tabs + viewer and loads
`assets/configurator.js`, which dynamically imports the **4kGraphics `browser.js`**
(upload it to `assets/4kgraphics-engine.browser.js`). Options + **live price** come from the
**MEJA-CRM engine**; the configured line price is applied via Cart Transform / Draft Orders.
See `../docs/06-API-Contracts.md` and `../api/openapi.yaml`.

## Not yet wired (next steps)
- Upload the 4kGraphics engine asset; wire the option model from `shelf_templates`/product.
- Cart Transform Function (Plus) for custom line price; private/hybrid listing template.
- Reviews app blocks; metafield definitions; Shopify Markets.

> Run locally with the Shopify CLI (`shopify theme dev`) once connected to a dev store.

## Added in this pass
- **Configurator** (`sections/configurator.liquid` + `assets/configurator.js`): renders an
  option model per product type, computes a price preview, and adds to cart with
  `_configId` + `_meja_unit_price` line-item properties.
- **Cart Transform Function** (`functions/cart-transform/`): applies the CRM-computed price
  to configured lines (deploy as a Shopify app extension). CRM is authoritative (D4/D10).
- **Private/Hybrid listing** (`sections/main-private-listing.liquid` +
  `templates/product.private-listing.json`): quote banner, locked + editable options from
  `crm.*` metafields.
- **Account** (`sections/main-account.liquid` + `templates/customers/account.json`) and
  **My quotes** (`sections/main-quotes.liquid` + `templates/page.quotes.json`).

## Standard templates (this pass)
Added the templates a valid OS 2.0 theme expects, each with a matching section:
`page`, `search`, `404`, `list-collections`, and the customer pages
(`customers/login`, `register`, `order`, `addresses`, `reset_password`, `activate_account`).
`tools/theme_check.py` (run in CI) validates schema JSON, brace balance, and section/snippet refs.
