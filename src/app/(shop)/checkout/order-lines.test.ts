import { describe, expect, it } from "vitest";
import { buildOrderLines, type CheckoutVariant } from "./order-lines";

const variantId = "66666666-0000-0000-0000-000000000001";
const variant: CheckoutVariant = {
  id: variantId,
  sku: "DEMO-160-NAT",
  label: "1600 × 800 / Natural Oak",
  priceCopecks: 13400000n,
  stockQuantity: 2,
  product: { name: "KHM Demo 01", basePriceCopecks: 12900000n },
};

describe("buildOrderLines", () => {
  it("uses the server price and snapshot fields", () => {
    expect(buildOrderLines([{ variantId, quantity: 2 }], [variant])).toEqual({
      items: [
        {
          variantId,
          productName: "KHM Demo 01",
          variantLabel: "1600 × 800 / Natural Oak",
          sku: "DEMO-160-NAT",
          quantity: 2,
          unitPriceCopecks: 13400000n,
        },
      ],
    });
  });

  it("falls back to the product base price when a variant has no override", () => {
    expect(
      buildOrderLines([{ variantId, quantity: 1 }], [{ ...variant, priceCopecks: null }])
    ).toMatchObject({ items: [{ unitPriceCopecks: 12900000n }] });
  });

  it("rejects a variant which disappeared or has no stock", () => {
    expect(buildOrderLines([{ variantId, quantity: 1 }], [])).toMatchObject({ error: expect.any(String) });
    expect(
      buildOrderLines([{ variantId, quantity: 1 }], [{ ...variant, stockQuantity: 0 }])
    ).toMatchObject({ error: expect.any(String) });
  });

  it("rejects a requested quantity above the live stock", () => {
    expect(buildOrderLines([{ variantId, quantity: 3 }], [variant])).toEqual({
      error: "Для «KHM Demo 01» доступно только 2 шт. Обновите количество в корзине.",
    });
  });
});
