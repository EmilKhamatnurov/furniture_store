import { describe, it, expect } from "vitest";
import {
  formatRub,
  rubToKopecks,
  multiplyKopecks,
  asKopecks,
} from "@/lib/utils/money";

/**
 * Intl.NumberFormat("ru-RU") uses non-breaking spaces, and the exact kind
 * (U+00A0 vs U+202F) differs between Node/ICU versions. Normalize all space
 * variants to a plain space so tests don't depend on the ICU build.
 */
function norm(s: string): string {
  return s.replace(/[   ]/g, " ");
}

describe("money utilities", () => {
  describe("formatRub", () => {
    it("formats whole rubles without decimals", () => {
      expect(norm(formatRub(150000n))).toBe("1 500 ₽");
    });

    it("formats kopecks with exactly 2 decimal places", () => {
      expect(norm(formatRub(99950n))).toBe("999,50 ₽");
    });

    it("formats a single kopeck with 2 decimal places", () => {
      expect(norm(formatRub(1n))).toBe("0,01 ₽");
    });

    it("formats zero", () => {
      expect(norm(formatRub(0n))).toBe("0 ₽");
    });
  });

  describe("rubToKopecks", () => {
    it("converts integer rubles", () => {
      expect(rubToKopecks(1500)).toBe(150000n);
    });

    it("converts fractional rubles without float drift", () => {
      expect(rubToKopecks(99.99)).toBe(9999n);
    });

    it("converts fractional rubles: 0.1 + 0.2 problem", () => {
      // 0.1 + 0.2 in JS = 0.30000000000000004
      expect(rubToKopecks(0.3)).toBe(30n);
    });
  });

  describe("multiplyKopecks", () => {
    it("multiplies price by quantity", () => {
      expect(multiplyKopecks(50000n, 3)).toBe(150000n);
    });
  });

  describe("asKopecks", () => {
    it("brands a valid bigint", () => {
      expect(asKopecks(100n)).toBe(100n);
    });

    it("throws for negative values", () => {
      expect(() => asKopecks(-1n)).toThrow(RangeError);
    });
  });
});
