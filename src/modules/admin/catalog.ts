import "server-only";
import { db } from "@/lib/db";
import { eq, asc, desc } from "drizzle-orm";
import {
  products,
  productVariants,
  categories,
} from "@/modules/catalog/db/schema";
import { invalidateProductCache } from "@/modules/catalog";

// ---------------------------------------------------------------------------
// Admin catalog data access — includes inactive/archived rows (unlike the
// public repository) and writes that bust the Redis cache.
// ---------------------------------------------------------------------------

export async function listAllProductsAdmin() {
  return db.query.products.findMany({
    with: {
      category: true,
      variants: { orderBy: [asc(productVariants.label)] },
    },
    orderBy: [desc(products.updatedAt)],
  });
}

export async function getProductAdmin(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      category: true,
      variants: { orderBy: [asc(productVariants.label)] },
      images: true,
    },
  });
}

export async function listCategoriesAdmin() {
  return db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
  });
}

// ---------------------------------------------------------------------------
// Writes — each invalidates the product cache so the storefront updates.
// ---------------------------------------------------------------------------

export interface UpdateProductInput {
  name: string;
  description: string | null;
  basePriceCopecks: bigint;
  categoryId: string;
  isActive: boolean;
  isArchived: boolean;
}

export async function updateProductAdmin(
  id: string,
  input: UpdateProductInput
): Promise<void> {
  const [updated] = await db
    .update(products)
    .set({
      name: input.name,
      description: input.description,
      basePriceCopecks: input.basePriceCopecks,
      categoryId: input.categoryId,
      isActive: input.isActive,
      isArchived: input.isArchived,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning({ slug: products.slug });

  if (updated) await invalidateProductCache(updated.slug);
}

export interface UpdateVariantInput {
  priceCopecks: bigint | null;
  stockQuantity: number;
  isActive: boolean;
}

export async function updateVariantAdmin(
  variantId: string,
  input: UpdateVariantInput
): Promise<void> {
  const [variant] = await db
    .update(productVariants)
    .set({
      priceCopecks: input.priceCopecks,
      stockQuantity: input.stockQuantity,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(productVariants.id, variantId))
    .returning({ productId: productVariants.productId });

  // Bust the parent product's cache
  if (variant) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, variant.productId),
      columns: { slug: true },
    });
    if (product) await invalidateProductCache(product.slug);
  }
}
