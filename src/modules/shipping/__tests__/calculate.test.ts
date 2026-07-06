import { describe, it, expect } from "vitest";
import {
  lineChargeableKg,
  totalChargeableKg,
  computeShippingCopecks,
  type ItemDimensions,
  type TariffBracket,
} from "../calculate";

const DIVISOR = 5000;

function item(overrides: Partial<ItemDimensions>): ItemDimensions {
  return {
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
    weightGrams: 0,
    quantity: 1,
    ...overrides,
  };
}

describe("lineChargeableKg", () => {
  it("uses actual weight when it exceeds volumetric", () => {
    // volume 50×50×50 = 125000 / 5000 = 25 kg; actual 40 kg wins
    const dim = item({ lengthCm: 50, widthCm: 50, heightCm: 50, weightGrams: 40000 });
    expect(lineChargeableKg(dim, DIVISOR)).toBe(40);
  });

  it("uses volumetric weight when it exceeds actual", () => {
    // volume 100×100×50 = 500000 / 5000 = 100 kg; actual 30 kg
    const dim = item({ lengthCm: 100, widthCm: 100, heightCm: 50, weightGrams: 30000 });
    expect(lineChargeableKg(dim, DIVISOR)).toBe(100);
  });

  it("multiplies by quantity", () => {
    const dim = item({ weightGrams: 10000, quantity: 3 });
    expect(lineChargeableKg(dim, DIVISOR)).toBe(30);
  });

  it("returns 0 for an item with no weight and no volume", () => {
    expect(lineChargeableKg(item({}), DIVISOR)).toBe(0);
  });

  it("ignores volumetric weight when divisor is 0", () => {
    const dim = item({ lengthCm: 100, widthCm: 100, heightCm: 100, weightGrams: 5000 });
    expect(lineChargeableKg(dim, 0)).toBe(5);
  });
});

describe("totalChargeableKg", () => {
  it("sums across items", () => {
    const items = [
      item({ weightGrams: 10000 }),
      item({ weightGrams: 5000, quantity: 2 }),
    ];
    expect(totalChargeableKg(items, DIVISOR)).toBe(20);
  });

  it("returns 0 for an empty cart", () => {
    expect(totalChargeableKg([], DIVISOR)).toBe(0);
  });
});

describe("computeShippingCopecks", () => {
  const tariffs: TariffBracket[] = [
    { maxWeightKg: 10, priceCopecks: 50000n, extraPerKgCopecks: 0n },
    { maxWeightKg: 30, priceCopecks: 90000n, extraPerKgCopecks: 0n },
    { maxWeightKg: 80, priceCopecks: 150000n, extraPerKgCopecks: 2000n },
  ];

  it("returns null when the zone has no tariffs", () => {
    expect(computeShippingCopecks(10, [])).toBeNull();
  });

  it("picks the smallest bracket that covers the weight", () => {
    expect(computeShippingCopecks(5, tariffs)).toBe(50000n);
    expect(computeShippingCopecks(15, tariffs)).toBe(90000n);
    expect(computeShippingCopecks(80, tariffs)).toBe(150000n);
  });

  it("handles a boundary weight as the covering bracket", () => {
    expect(computeShippingCopecks(10, tariffs)).toBe(50000n);
  });

  it("adds a per-kg surcharge above the largest bracket", () => {
    // 85 kg → 5 kg over 80 → 150000 + 5 × 2000
    expect(computeShippingCopecks(85, tariffs)).toBe(160000n);
  });

  it("rounds the overweight up to whole kilograms", () => {
    // 80.2 kg → ceil(0.2) = 1 extra kg
    expect(computeShippingCopecks(80.2, tariffs)).toBe(152000n);
  });

  it("works with unsorted tariff input", () => {
    const shuffled = [tariffs[2]!, tariffs[0]!, tariffs[1]!];
    expect(computeShippingCopecks(15, shuffled)).toBe(90000n);
  });
});
