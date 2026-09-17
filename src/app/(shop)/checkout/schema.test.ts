import { describe, expect, it } from "vitest";
import { checkoutSchema, parseCartLines } from "./schema";

describe("parseCartLines", () => {
  const variantId = "66666666-0000-0000-0000-000000000001";

  it("keeps only trusted line fields", () => {
    expect(
      parseCartLines(
        JSON.stringify([
          { variantId, quantity: 2, priceCopecks: "1", productName: "Подмена" },
        ])
      )
    ).toEqual([{ variantId, quantity: 2 }]);
  });

  it("merges duplicate variants and caps the combined quantity", () => {
    expect(
      parseCartLines(JSON.stringify([{ variantId, quantity: 80 }, { variantId, quantity: 80 }]))
    ).toEqual([{ variantId, quantity: 99 }]);
  });

  it("rejects malformed and empty payloads", () => {
    expect(parseCartLines("not-json")).toBeNull();
    expect(parseCartLines("[]")).toBeNull();
  });
});

describe("checkoutSchema", () => {
  const form = {
    fullName: "Иван Петров",
    email: "ivan@example.com",
    phone: "+7 999 000 00 00",
    region: "Республика Башкортостан",
    city: "Уфа",
    street: "ул. Пушкина, д. 10",
    postalCode: "450000",
    zoneId: "55555555-0000-0000-0000-000000000001",
    cartItems: '[{"variantId":"66666666-0000-0000-0000-000000000001","quantity":1}]',
  };

  it("accepts the Ufa delivery flow", () => {
    expect(checkoutSchema.safeParse(form).success).toBe(true);
  });

  it("rejects a city outside the current delivery area", () => {
    const result = checkoutSchema.safeParse({ ...form, city: "Казань" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.city).toContain(
        "Сейчас доставка доступна только по Уфе"
      );
    }
  });
});
