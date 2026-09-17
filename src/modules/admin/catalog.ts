import "server-only";
import { db } from "@/lib/db";
import { eq, asc, desc, inArray, sql } from "drizzle-orm";
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

export interface CreateProductInput {
  slug: string;
  name: string;
  description: string | null;
  basePriceCopecks: bigint;
  categoryId: string;
}

/** New goods are drafts; an admin explicitly publishes them after review. */
export async function createProductAdmin(input: CreateProductInput): Promise<string> {
  const [created] = await db
    .insert(products)
    .values({ ...input, isActive: false, isArchived: false })
    .returning({ id: products.id, slug: products.slug });
  if (!created) throw new Error("Product was not created");

  const category = await db.query.categories.findFirst({
    where: eq(categories.id, input.categoryId),
    columns: { slug: true },
  });
  await invalidateProductCache(created.slug, category?.slug);
  return created.id;
}

export async function updateProductAdmin(
  id: string,
  input: UpdateProductInput
): Promise<void> {
  const existing = await db.query.products.findFirst({
    where: eq(products.id, id),
    columns: { categoryId: true },
  });
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

  if (updated) {
    const categoryIds = [existing?.categoryId, input.categoryId].filter(
      (categoryId): categoryId is string => Boolean(categoryId)
    );
    const affectedCategories = categoryIds.length
      ? await db.query.categories.findMany({
          where: inArray(categories.id, categoryIds),
          columns: { slug: true },
        })
      : [];
    await Promise.all(
      affectedCategories.map((category) =>
        invalidateProductCache(updated.slug, category.slug)
      )
    );
  }
}

export interface UpdateVariantInput {
  options: Array<{ name: string; value: string }>;
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
      options: input.options,
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
      with: { category: { columns: { slug: true } } },
    });
    if (product) await invalidateProductCache(product.slug, product.category.slug);
  }
}

export interface CreateVariantInput {
  productId: string;
  sku: string;
  label: string;
  options: Array<{ name: string; value: string }>;
  priceCopecks: bigint | null;
  stockQuantity: number;
  isActive: boolean;
}

export async function createVariantAdmin(input: CreateVariantInput): Promise<string> {
  const [created] = await db
    .insert(productVariants)
    .values(input)
    .returning({ id: productVariants.id });
  if (!created) throw new Error("Variant was not created");

  const product = await db.query.products.findFirst({
    where: eq(products.id, input.productId),
    with: { category: { columns: { slug: true } } },
  });
  if (product) await invalidateProductCache(product.slug, product.category.slug);
  return created.id;
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
    with: { category: { columns: { slug: true } } },
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

  await invalidateProductCache(product.slug, product.category.slug);
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
    with: { category: { columns: { slug: true } } },
  });
  if (product) await invalidateProductCache(product.slug, product.category.slug);
  return deleted;
}

/** Moves the image to the front of the gallery (storefront cover image). */
export async function makePrimaryProductImageAdmin(
  imageId: string
): Promise<boolean> {
  const image = await db.query.productImages.findFirst({
    where: eq(productImages.id, imageId),
    with: { product: { with: { category: { columns: { slug: true } } } } },
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

  await invalidateProductCache(image.product.slug, image.product.category.slug);
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
    with: { product: { with: { category: { columns: { slug: true } } } } },
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

  await invalidateProductCache(image.product.slug, image.product.category.slug);
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
    with: { category: { columns: { slug: true } } },
  });
  if (product) await invalidateProductCache(product.slug, product.category.slug);
  return true;
}
