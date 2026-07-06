import "server-only";
import { db } from "@/lib/db";
import { eq, asc, desc, sql } from "drizzle-orm";
import {
  products,
  productVariants,
  productImages,
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
      images: { orderBy: [asc(productImages.sortOrder)] },
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

// ---------------------------------------------------------------------------
// Product images. Files live in S3 (see @/lib/storage); rows here hold the
// keys. Sort order defines the gallery order; the lowest value is the cover.
// ---------------------------------------------------------------------------

export async function addProductImageAdmin(
  productId: string,
  input: { s3Key: string; altText: string | null }
): Promise<boolean> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { slug: true },
  });
  if (!product) return false;

  const [row] = await db
    .select({
      next: sql<number>`coalesce(max(${productImages.sortOrder}), -1) + 1`,
    })
    .from(productImages)
    .where(eq(productImages.productId, productId));

  await db.insert(productImages).values({
    productId,
    s3Key: input.s3Key,
    altText: input.altText,
    sortOrder: row?.next ?? 0,
  });

  await invalidateProductCache(product.slug);
  return true;
}

/** Deletes the row and returns its s3Key so the caller can remove the file. */
export async function deleteProductImageAdmin(
  imageId: string
): Promise<{ s3Key: string; productId: string } | null> {
  const [deleted] = await db
    .delete(productImages)
    .where(eq(productImages.id, imageId))
    .returning({ s3Key: productImages.s3Key, productId: productImages.productId });
  if (!deleted) return null;

  const product = await db.query.products.findFirst({
    where: eq(products.id, deleted.productId),
    columns: { slug: true },
  });
  if (product) await invalidateProductCache(product.slug);
  return deleted;
}

/** Moves the image to the front of the gallery (storefront cover image). */
export async function makePrimaryProductImageAdmin(
  imageId: string
): Promise<boolean> {
  const image = await db.query.productImages.findFirst({
    where: eq(productImages.id, imageId),
    with: { product: { columns: { slug: true } } },
  });
  if (!image) return false;

  const [row] = await db
    .select({ min: sql<number>`coalesce(min(${productImages.sortOrder}), 0)` })
    .from(productImages)
    .where(eq(productImages.productId, image.productId));

  const min = row?.min ?? 0;
  if (image.sortOrder > min) {
    await db
      .update(productImages)
      .set({ sortOrder: min - 1 })
      .where(eq(productImages.id, imageId));
  }

  await invalidateProductCache(image.product.slug);
  return true;
}

/**
 * Moves an image one position toward the cover ("up") or away ("down") by
 * swapping sortOrder with its neighbour. Sort values may be non-contiguous
 * (makePrimary uses min-1), so we swap by rank, not by value arithmetic.
 */
export async function moveProductImageAdmin(
  imageId: string,
  direction: "up" | "down"
): Promise<boolean> {
  const image = await db.query.productImages.findFirst({
    where: eq(productImages.id, imageId),
    with: { product: { columns: { slug: true } } },
  });
  if (!image) return false;

  const siblings = await db.query.productImages.findMany({
    where: eq(productImages.productId, image.productId),
    orderBy: [asc(productImages.sortOrder)],
    columns: { id: true, sortOrder: true },
  });

  const idx = siblings.findIndex((s) => s.id === imageId);
  const neighbourIdx = direction === "up" ? idx - 1 : idx + 1;
  const neighbour = siblings[neighbourIdx];
  if (idx === -1 || !neighbour) return true; // already at the edge — no-op

  const current = siblings[idx]!;
  await db.transaction(async (tx) => {
    await tx
      .update(productImages)
      .set({ sortOrder: neighbour.sortOrder })
      .where(eq(productImages.id, current.id));
    await tx
      .update(productImages)
      .set({ sortOrder: current.sortOrder })
      .where(eq(productImages.id, neighbour.id));
  });

  await invalidateProductCache(image.product.slug);
  return true;
}

/** Updates the alt text of a single image (SEO / accessibility). */
export async function updateProductImageAltAdmin(
  imageId: string,
  altText: string | null
): Promise<boolean> {
  const [updated] = await db
    .update(productImages)
    .set({ altText })
    .where(eq(productImages.id, imageId))
    .returning({ productId: productImages.productId });
  if (!updated) return false;

  const product = await db.query.products.findFirst({
    where: eq(products.id, updated.productId),
    columns: { slug: true },
  });
  if (product) await invalidateProductCache(product.slug);
  return true;
}
