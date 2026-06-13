# MEJA Cart Transform — line price from the CRM engine

A **Shopify Function** (Cart Transform target) that sets the price of configured cart lines
to the **CRM-computed** amount. Deployed as a **Shopify app extension** (Shopify CLI),
not part of the theme bundle.

## How it fits (Decision D10 / D4)
1. The storefront configurator (or a quote listing) adds a base "configurable" variant to the
   cart with line-item properties: `_configId` and a **signed** `_meja_unit_price` (the price the
   MEJA-CRM engine returned).
2. This Function rewrites the cart line price to `_meja_unit_price`.
3. The CRM is authoritative: the price is signed to prevent tampering and **reconciled at
   `orders/create`** (see docs/06-API-Contracts.md, C3).

CRM-pushed private/hybrid quotes can alternatively use the **Draft Orders** path.

## Dev
```sh
shopify app generate extension   # cart_transform (JavaScript)
shopify app dev                  # test against a dev store
```
> This folder is a scaffold; wire it into a Shopify app and replace the placeholder price
> verification with the CRM's signed-price check.
