// MEJA Cart Transform Function (Shopify Function, deployed as an app extension).
// Configured/quote lines are added to the cart with the CRM-computed unit price as a
// signed `_meja_unit_price` attribute plus a `_configId`. This Function rewrites the
// cart line price to that amount. The CRM pricing engine is the sole authority (D4/D10);
// the value is verified server-side and reconciled at orders/create.
// @ts-check

/** @typedef {import("../generated/api").RunInput} RunInput */
/** @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult */

export function run(input) {
  const operations = [];
  for (const line of input.cart.lines) {
    const price = line.mejaPrice && line.mejaPrice.value;
    const configId = line.configId && line.configId.value;
    if (!price || !configId) continue; // only adjust configured lines
    operations.push({
      lineUpdate: {
        cartLineId: line.id,
        price: { adjustment: { fixedPricePerUnit: { amount: price } } },
      },
    });
  }
  return { operations };
}
