import "server-only";
import { db } from "@/lib/db";
import { eq, and, asc, desc, sql, inArray } from "drizzle-orm";
import {
  products,
  productVariants,
  productImages,
  categories,
} from "../db/schema";
import type {
  ProductWithRelations,
  CategoryWithChildren,
  CategoryWithProductCount,
} from "../domain";

// ---------------------------------------------------------------------------
// Catalog repository
// All queries here are uncached — caching is layered on top in cache.ts.
// Only public methods (visible to anonymous users) filter by isActive.
// ---------------------------------------------------------------------------

/** Find an active product by slug, with category, variants, and images */
export async function findProductBySlug(
  slug: string
): Promise<ProductWithRelations | null> {
  const result = await db.query.products.findFirst({
    where: and(
      eq(products.slug, slug),
      eq(products.isActive, true),
      eq(products.isArchived, false)
    ),
    with: {
      category: true,
      variants: {
        where: eq(productVariants.isActive, true),
      },
      images: {
        orderBy: asc(productImages.sortOrder),
      },
    },
  });

  return result ?? null;
}

/** List active products in a category, sorted by sortOrder then created date */
export async function listProductsByCategorySlug(
  categorySlug: string
): Promise<ProductWithRelations[]> {
  const category = await db.query.categories.findFirst({
    where: and(
      eq(categories.slug, categorySlug),
      eq(categories.isActive, true)
    ),
  });

  if (!category) return [];

  const result = await db.query.products.findMany({
    where: and(
      eq(products.categoryId, category.id),
      eq(products.isActive, true),
      eq(products.isArchived, false)
    ),
    with: {
      category: true,
      variants: {
        where: eq(productVariants.isActive, true),
      },
      images: {
        orderBy: asc(productImages.sortOrder),
        limit: 1, // listings only need primary image
      },
    },
    orderBy: [asc(products.sortOrder), desc(products.createdAt)],
  });

  return result;
}

/** All active categories — flat list, used for sitemap and menu */
export async function listAllCategories(): Promise<
  CategoryWithProductCount[]
> {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      parentId: categories.parentId,
      imageKey: categories.imageKey,
      metaTitle: categories.metaTitle,
      metaDescription: categories.metaDescription,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productCount: sql<number>`
        (SELECT COUNT(*)::int FROM ${products}
         WHERE ${products.categoryId} = ${categories.id}
           AND ${products.isActive} = true
           AND ${products.isArchived} = false)
      `,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows;
}

/** Category tree (root categories with children) for navigation menu */
export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  const all = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
  });

  const byParent = new Map<string | null, typeof all>();
  for (const cat of all) {
    const key = cat.parentId;
    const list = byParent.get(key) ?? [];
    list.push(cat);
    byParent.set(key, list);
  }

  const roots = byParent.get(null) ?? [];
  return roots.map((root) => ({
    ...root,
    children: byParent.get(root.id) ?? [],
  }));
}

/** Find a category by slug — used for the category landing page */
export async function findCategoryBySlug(slug: string) {
  return await db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), eq(categories.isActive, true)),
  });
}

/**
 * Active variants (with their product) by id — the authoritative source for
 * re-pricing a client cart at checkout. Variants whose product is inactive
 * or archived are excluded, so a missing id means "not sellable anymore".
 */
export async function findSellableVariantsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.query.productVariants.findMany({
    where: and(
      inArray(productVariants.id, ids),
      eq(productVariants.isActive, true)
    ),
    with: { product: true },
  });
  return rows.filter((v) => v.product.isActive && !v.product.isArchived);
}

/** All product slugs grouped by category slug — for sitemap generation */
export async function listAllProductSlugsForSitemap(): Promise<
  Array<{
    productSlug: string;
    categorySlug: string;
    updatedAt: Date;
  }>
> {
  const rows = await db
    .select({
      productSlug: products.slug,
      categorySlug: categories.slug,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        eq(products.isActive, true),
        eq(products.isArchived, false),
        eq(categories.isActive, true)
      )
    );

  return rows;
}
