import { describe, it, expect } from "vitest";
import {
  getVariantPrice,
  getMinVariantPrice,
  isProductInStock,
  getVariantDimensions,
  type ProductWithRelations,
} from "@/modules/catalog/domain";

const baseProduct = {
  basePriceCopecks: 100000n, // 1000₽
  lengthCm: 200,
  widthCm: 90,
  heightCm: 85,
  weightGrams: 50000,
};

describe("catalog domain", () => {
  describe("getVariantPrice", () => {
    it("uses variant override when set", () => {
      expect(
        getVariantPrice(baseProduct, { priceCopecks: 150000n })
      ).toBe(150000n);
    });

    it("falls back to base price when variant has no override", () => {
      expect(
        getVariantPrice(baseProduct, { priceCopecks: null })
      ).toBe(100000n);
    });
  });

  describe("getMinVariantPrice", () => {
    it("returns base price when no variants exist", () => {
      const product = {
        ...baseProduct,
        variants: [],
      } as unknown as ProductWithRelations;
      expect(getMinVariantPrice(product)).toBe(100000n);
    });

    it("picks lowest among variant overrides", () => {
      const product = {
        ...baseProduct,
        variants: [
          { priceCopecks: 200000n },
          { priceCopecks: 150000n },
          { priceCopecks: null }, // falls back to base 100000n
        ],
      } as unknown as ProductWithRelations;
      expect(getMinVariantPrice(product)).toBe(100000n);
    });
  });

  describe("isProductInStock", () => {
    it("returns true when at least one active variant has stock", () => {
      const product = {
        variants: [
          { isActive: true, stockQuantity: 0 },
          { isActive: true, stockQuantity: 1 },
        ],
      } as unknown as ProductWithRelations;
      expect(isProductInStock(product)).toBe(true);
    });

    it("ignores inactive variants even if they have stock", () => {
      const product = {
        variants: [{ isActive: false, stockQuantity: 99 }],
      } as unknown as ProductWithRelations;
      expect(isProductInStock(product)).toBe(false);
    });

    it("returns false when all variants out of stock", () => {
      const product = {
        variants: [
          { isActive: true, stockQuantity: 0 },
          { isActive: true, stockQuantity: 0 },
        ],
      } as unknown as ProductWithRelations;
      expect(isProductInStock(product)).toBe(false);
    });
  });

  describe("getVariantDimensions", () => {
    it("uses variant dimensions when set", () => {
      const dims = getVariantDimensions(baseProduct, {
        lengthCm: 220,
        widthCm: null,
        heightCm: null,
        weightGrams: null,
      });
      expect(dims).toEqual({
        lengthCm: 220, // overridden
        widthCm: 90,
        heightCm: 85,
        weightGrams: 50000,
      });
    });

    it("falls back to product dimensions when variant has none", () => {
      const dims = getVariantDimensions(baseProduct, {
        lengthCm: null,
        widthCm: null,
        heightCm: null,
        weightGrams: null,
      });
      expect(dims).toEqual({
        lengthCm: 200,
        widthCm: 90,
        heightCm: 85,
        weightGrams: 50000,
      });
    });
  });
});
