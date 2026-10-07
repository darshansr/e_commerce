/**
 * The Shop API returns `ProductVariant.stockLevel` as a `String!` — not a number.
 * Depending on how the variant is tracked it is one of:
 *
 *   - a numeric string, e.g. "12"
 *   - 'IN_STOCK'      (inventory is not tracked for this variant)
 *   - 'OUT_OF_STOCK'
 *
 * Centralised here so the product card and the detail page cannot drift apart.
 */

export function isInStock(stockLevel: string | null | undefined): boolean {
  if (!stockLevel) return false;
  if (stockLevel === 'IN_STOCK') return true;
  if (stockLevel === 'OUT_OF_STOCK') return false;

  const quantity = Number(stockLevel);
  return Number.isFinite(quantity) && quantity > 0;
}

/** The numeric stock level, or `null` when inventory is not tracked. */
export function stockQuantity(stockLevel: string | null | undefined): number | null {
  if (!stockLevel || stockLevel === 'IN_STOCK' || stockLevel === 'OUT_OF_STOCK') {
    return null;
  }
  const quantity = Number(stockLevel);
  return Number.isFinite(quantity) ? quantity : null;
}
