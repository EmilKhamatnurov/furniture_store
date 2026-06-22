import "server-only";
import { cacheGet, cacheSet, cacheDel, CacheKey, CACHE_TTL } from "@/lib/redis";
import { moduleLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  ProductWithRelations,
  CategoryWithChildren,
  CategoryWithProductCount,
} from "../domain";

const log = moduleLogger("catalog");

// ---------------------------------------------------------------------------
// Cached read API — used by SSR pages
// Cache miss → DB query → cache set. Cache failures fall through to DB.
// ---------------------------------------------------------------------------

export async function getProductBySlug(
  slug: string
): Promise<ProductWithRelations | null> {
  const key = CacheKey.product(slug);

  try {
    const cached = await cacheGet<ProductWithRelations>(key);
    if (cached !== null) {
      // BigInt fields are serialized as strings by JSON — re-hydrate them
      return reviveProductBigInts(cached);
    }
  } catch (err) {
    log.warn({ err, slug }, "Cache read failed, falling through to DB");
  }

  const product = await repo.findProductBySlug(slug);
  if (product === null) return null;

  try {
    await cacheSet(key, product, CACHE_TTL.PRODUCT);
  } catch (err) {
    log.warn({ err, slug }, "Cache write failed, ignoring");
  }

  return product;
}

export async function getProductsByCategorySlug(
  categorySlug: string
): Promise<ProductWithRelations[]> {
  const key = CacheKey.productList(categorySlug);

  try {
    const cached = await cacheGet<ProductWithRelations[]>(key);
    if (cached !== null) {
      return cached.map(reviveProductBigInts);
    }
  } catch (err) {
    log.warn({ err, categorySlug }, "Cache read failed");
  }

  const items = await repo.listProductsByCategorySlug(categorySlug);

  try {
    await cacheSet(key, items, CACHE_TTL.PRODUCT);
  } catch (err) {
    log.warn({ err, categorySlug }, "Cache write failed");
  }

  return items;
}

export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  const key = CacheKey.categoryList();

  try {
    const cached = await cacheGet<CategoryWithChildren[]>(key);
    if (cached !== null) return cached;
  } catch (err) {
    log.warn({ err }, "Cache read failed");
  }

  const tree = await repo.getCategoryTree();

  try {
    await cacheSet(key, tree, CACHE_TTL.CATEGORY);
  } catch (err) {
    log.warn({ err }, "Cache write failed");
  }

  return tree;
}

export async function getAllCategories(): Promise<CategoryWithProductCount[]> {
  return await repo.listAllCategories();
}

export async function getCategoryBySlug(slug: string) {
  const key = CacheKey.category(slug);

  try {
    const cached = await cacheGet<Awaited<ReturnType<typeof repo.findCategoryBySlug>>>(key);
    if (cached !== undefined && cached !== null) return cached;
  } catch (err) {
    log.warn({ err, slug }, "Cache read failed");
  }

  const category = await repo.findCategoryBySlug(slug);
  if (category) {
    try {
      await cacheSet(key, category, CACHE_TTL.CATEGORY);
    } catch (err) {
      log.warn({ err, slug }, "Cache write failed");
    }
  }
  return category;
}

// ---------------------------------------------------------------------------
// Cache invalidation — call from admin actions when data changes
// ---------------------------------------------------------------------------
export async function invalidateProductCache(
  productSlug: string,
  categorySlug?: string
): Promise<void> {
  await Promise.all([
    cacheDel(CacheKey.product(productSlug)),
    cacheDel(CacheKey.productList(categorySlug)),
    // Also bust the "all products" list
    cacheDel(CacheKey.productList()),
  ]);
}

export async function invalidateCategoryCache(slug: string): Promise<void> {
  await Promise.all([
    cacheDel(CacheKey.category(slug)),
    cacheDel(CacheKey.categoryList()),
  ]);
}

// ---------------------------------------------------------------------------
// JSON.stringify converts bigint → string (or throws). We use a custom
// serializer at write time, but on read we must rehydrate kopecks fields.
// ---------------------------------------------------------------------------
function reviveProductBigInts(p: ProductWithRelations): ProductWithRelations {
  return {
    ...p,
    basePriceCopecks: BigInt(p.basePriceCopecks as unknown as string),
    variants: p.variants.map((v) => ({
      ...v,
      priceCopecks:
        v.priceCopecks === null
          ? null
          : BigInt(v.priceCopecks as unknown as string),
    })),
  };
}
