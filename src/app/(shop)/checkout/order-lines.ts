import type { OrderLineInput } from "@/modules/orders";
import type { CartLine } from "./schema";

/** Minimal server-side catalog shape needed to turn a cart into an order. */
export interface CheckoutVariant {
  id: string;
  sku: string;
  label: string;
  priceCopecks: bigint | null;
  stockQuantity: number;
  product: {
    name: string;
    basePriceCopecks: bigint;
  };
}

export type OrderLinesResult =
  | { items: OrderLineInput[] }
  | { error: string };

/**
 * Builds authoritative order rows from client-supplied identifiers and
 * quantities. Price, name, SKU and stock are always read from the supplied
 * server catalog data.
 */
export function buildOrderLines(
  lines: CartLine[],
  variants: CheckoutVariant[]
): OrderLinesResult {
  const byId = new Map(variants.map((variant) => [variant.id, variant]));
  const items: OrderLineInput[] = [];

  for (const line of lines) {
    const variant = byId.get(line.variantId);
    if (!variant || variant.stockQuantity <= 0) {
      return { error: "Один из товаров больше не доступен. Обновите корзину." };
    }
    if (line.quantity > variant.stockQuantity) {
      return {
        error: `Для «${variant.product.name}» доступно только ${variant.stockQuantity} шт. Обновите количество в корзине.`,
      };
    }
    items.push({
      variantId: variant.id,
      productName: variant.product.name,
      variantLabel: variant.label,
      sku: variant.sku,
      quantity: line.quantity,
      unitPriceCopecks: variant.priceCopecks ?? variant.product.basePriceCopecks,
    });
  }

  return { items };
}
