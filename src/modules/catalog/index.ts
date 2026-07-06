// ---------------------------------------------------------------------------
// Catalog module — public API
// Other modules MUST import from this barrel, never from internals.
// ---------------------------------------------------------------------------

// Cached read operations (default for SSR)
export {
  getProductBySlug,
  getProductsByCategorySlug,
  getCategoryTree,
  getAllCategories,
  getCategoryBySlug,
  invalidateProductCache,
  invalidateCategoryCache,
} from "./db/cache";

// For sitemap / admin uncached reads
export {
  listAllProductSlugsForSitemap,
  findSellableVariantsByIds,
} from "./db/repository";

// Domain types and pure helpers
export type {
  ProductWithRelations,
  CategoryWithChildren,
  CategoryWithProductCount,
  Dimensions,
} from "./domain";

export {
  getVariantPrice,
  getMinVariantPrice,
  isProductInStock,
  getVariantDimensions,
} from "./domain";

// Re-export DB types for typing across modules (e.g. orders refers to ProductVariant)
export type {
  Category,
  Product,
  ProductVariant,
  ProductImage,
} from "./db/schema";
