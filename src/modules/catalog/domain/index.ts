import type {
  Product,
  ProductVariant,
  ProductImage,
  Category,
} from "../db/schema";

// ---------------------------------------------------------------------------
// Composite types — what consumers of the catalog module actually need
// ---------------------------------------------------------------------------

export type ProductWithRelations = Product & {
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
};

export type CategoryWithChildren = Category & {
  children: Category[];
};

export type CategoryWithProductCount = Category & {
  productCount: number;
};

export { formatVariantOptions, parseVariantOptions } from "./variant-options";
export type { VariantOption } from "./variant-options";

// ---------------------------------------------------------------------------
// Pure pricing logic
// Variant price overrides product base price; if variant has no override,
// fall back to product.basePriceCopecks.
// ---------------------------------------------------------------------------

export function getVariantPrice(
  product: Pick<Product, "basePriceCopecks">,
  variant: Pick<ProductVariant, "priceCopecks">
): bigint {
  return variant.priceCopecks ?? product.basePriceCopecks;
}

/** Lowest price across all variants — for "from X ₽" badges on listings */
export function getMinVariantPrice(
  product: ProductWithRelations
): bigint {
  if (product.variants.length === 0) return product.basePriceCopecks;
  const prices = product.variants.map((v) => getVariantPrice(product, v));
  return prices.reduce((min, p) => (p < min ? p : min), prices[0]!);
}

/** True when at least one active variant has stock > 0 */
export function isProductInStock(product: ProductWithRelations): boolean {
  return product.variants.some((v) => v.isActive && v.stockQuantity > 0);
}

// ---------------------------------------------------------------------------
// Variant dimensions with fallback to product-level dimensions
// Used by shipping module to compute volumetric weight.
// ---------------------------------------------------------------------------

export interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightGrams: number;
}

export function getVariantDimensions(
  product: Pick<Product, "lengthCm" | "widthCm" | "heightCm" | "weightGrams">,
  variant: Pick<
    ProductVariant,
    "lengthCm" | "widthCm" | "heightCm" | "weightGrams"
  >
): Dimensions {
  return {
    lengthCm: variant.lengthCm ?? product.lengthCm,
    widthCm: variant.widthCm ?? product.widthCm,
    heightCm: variant.heightCm ?? product.heightCm,
    weightGrams: variant.weightGrams ?? product.weightGrams,
  };
}
