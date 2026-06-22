import { describe, it, expect } from "vitest";
import {
  formatRub,
  rubToKopecks,
  kopecksToRubFloat,
  multiplyKopecks,
  asKopecks,
} from "@/lib/utils/money";

describe("money utilities", () => {
  describe("formatRub", () => {
    it("formats whole rubles without decimals", () => {
      expect(formatRub(150000n)).toBe("1 500 ₽");
    });

    it("formats kopecks with 2 decimal places", () => {
      expect(formatRub(99950n)).toBe("999,50 ₽");
    });

    it("formats zero", () => {
      expect(formatRub(0n)).toBe("0 ₽");
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
