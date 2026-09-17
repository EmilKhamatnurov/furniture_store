"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  requireAdmin,
  clearAdminCookie,
  updateOrderStatus,
  addOrderNote,
  createProductAdmin,
  updateProductAdmin,
  createVariantAdmin,
  updateVariantAdmin,
  addProductImageAdmin,
  deleteProductImageAdmin,
  makePrimaryProductImageAdmin,
  moveProductImageAdmin,
  updateProductImageAltAdmin,
} from "@/modules/admin";
import { parseVariantOptions } from "@/modules/catalog";
import { putPublicObject, deletePublicObject } from "@/lib/storage";
import { rubToKopecks } from "@/lib/utils/money";
import type { OrderStatus } from "@/modules/orders/db/schema";

// ---------------------------------------------------------------------------
// Admin mutations. Every action re-checks requireAdmin().
// ---------------------------------------------------------------------------

export interface ActionResult {
  error?: string;
  success?: boolean;
}

// --- Logout ---
export async function adminLogoutAction(): Promise<void> {
  await clearAdminCookie();
  redirect("/admin/login");
}

// --- Order status transition ---
const statusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    "draft",
    "pending_payment",
    "paid",
    "assembling",
    "shipped",
    "delivered",
    "completed",
    "cancelled",
    "refunded",
  ]),
  note: z.string().optional(),
});

export async function updateOrderStatusAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const adminEmail = await requireAdmin();

  const parsed = statusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Некорректные данные." };

  const { orderId, status, note } = parsed.data;
  const ok = await updateOrderStatus(
    orderId,
    status as OrderStatus,
    adminEmail,
    note || undefined
  );
  if (!ok) return { error: "Такой переход статуса недопустим." };

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { success: true };
}

// --- Add internal note ---
const noteSchema = z.object({
  orderId: z.string().uuid(),
  note: z.string().min(1, "Введите текст заметки"),
});

export async function addOrderNoteAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const adminEmail = await requireAdmin();

  const parsed = noteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Введите текст заметки." };

  await addOrderNote(parsed.data.orderId, adminEmail, parsed.data.note);
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { success: true };
}

// --- Update product core fields ---
const productSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(2, "Введите название"),
  description: z.string().optional(),
  priceRub: z.coerce.number().nonnegative("Цена не может быть отрицательной"),
  categoryId: z.string().uuid("Выберите категорию"),
  isActive: z.string().optional(), // checkbox "on"
  isArchived: z.string().optional(),
});

const productCreateSchema = productSchema
  .omit({ productId: true, isActive: true, isArchived: true })
  .extend({
    slug: z
      .string()
      .min(2, "Введите slug")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: строчные латинские буквы, цифры и дефис"),
  });

export async function createProductAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productCreateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }

  try {
    const productId = await createProductAdmin({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description?.trim() || null,
      basePriceCopecks: rubToKopecks(parsed.data.priceRub),
      categoryId: parsed.data.categoryId,
    });
    revalidatePath("/admin/products");
    redirect(`/admin/products/${productId}`);
  } catch (err) {
    console.error("[admin] createProduct failed:", err);
    return { error: "Не удалось создать товар. Возможно, slug уже занят." };
  }
}

export async function updateProductAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }

  const { productId, name, description, priceRub, categoryId, isActive, isArchived } =
    parsed.data;

  await updateProductAdmin(productId, {
    name,
    description: description?.trim() ? description : null,
    basePriceCopecks: rubToKopecks(priceRub),
    categoryId,
    isActive: isActive === "on",
    isArchived: isArchived === "on",
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  return { success: true };
}

// --- Update a single variant (price / stock / active) ---
const variantSchema = z.object({
  variantId: z.string().uuid(),
  productId: z.string().uuid(),
  priceRub: z.string().optional(), // empty → inherit base price (null)
  stockQuantity: z.coerce.number().int().nonnegative("Остаток ≥ 0"),
  isActive: z.string().optional(),
  optionsText: z.string().max(2000, "Слишком много параметров"),
});

export async function updateVariantAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = variantSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }

  const { variantId, productId, priceRub, stockQuantity, isActive } = parsed.data;
  const options = parseVariantOptions(parsed.data.optionsText);
  if (!options) {
    return { error: "Укажите параметры построчно: например, «Цвет: Орех»." };
  }
  const priceCopecks =
    priceRub && priceRub.trim() !== "" ? rubToKopecks(Number(priceRub)) : null;

  await updateVariantAdmin(variantId, {
    options,
    priceCopecks,
    stockQuantity,
    isActive: isActive === "on",
  });

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

const variantCreateSchema = variantSchema
  .omit({ variantId: true })
  .extend({
    sku: z
      .string()
      .min(2, "Введите SKU")
      .max(100, "SKU слишком длинный")
      .regex(/^[A-Za-z0-9_-]+$/, "SKU: латинские буквы, цифры, дефис и _"),
    label: z.string().min(2, "Введите название варианта").max(160),
  });

export async function createVariantAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = variantCreateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }
  const options = parseVariantOptions(parsed.data.optionsText);
  if (!options) {
    return { error: "Укажите параметры построчно: например, «Цвет: Орех»." };
  }

  try {
    await createVariantAdmin({
      productId: parsed.data.productId,
      sku: parsed.data.sku,
      label: parsed.data.label,
      options,
      priceCopecks:
        parsed.data.priceRub && parsed.data.priceRub.trim() !== ""
          ? rubToKopecks(Number(parsed.data.priceRub))
          : null,
      stockQuantity: parsed.data.stockQuantity,
      isActive: parsed.data.isActive === "on",
    });
  } catch (err) {
    console.error("[admin] createVariant failed:", err);
    return { error: "Не удалось создать вариант. Возможно, SKU уже занят." };
  }

  revalidatePath(`/admin/products/${parsed.data.productId}`);
  return { success: true };
}

// --- Product images: upload / delete / make primary ---

// MIME → extension whitelist. Anything else is rejected.
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per file
const MAX_IMAGES_PER_UPLOAD = 8;

export async function uploadProductImagesAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const productId = z.string().uuid().safeParse(formData.get("productId"));
  if (!productId.success) return { error: "Некорректные данные." };

  // FormDataEntryValue is string | File; the global File class may be missing
  // in older Node runtimes, so narrow without instanceof.
  const files = formData
    .getAll("images")
    .filter((f): f is File => typeof f !== "string" && f.size > 0);

  if (files.length === 0) return { error: "Выберите хотя бы один файл." };
  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    return { error: `Не больше ${MAX_IMAGES_PER_UPLOAD} файлов за раз.` };
  }
  for (const file of files) {
    if (!IMAGE_EXTENSIONS[file.type]) {
      return { error: `«${file.name}»: допустимы только JPEG, PNG, WebP и AVIF.` };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `«${file.name}»: файл больше 5 МБ.` };
    }
  }

  for (const file of files) {
    const key = `products/${productId.data}/${randomUUID()}.${IMAGE_EXTENSIONS[file.type]}`;
    await putPublicObject(key, Buffer.from(await file.arrayBuffer()), file.type);
    const added = await addProductImageAdmin(productId.data, {
      s3Key: key,
      altText: null,
    });
    if (!added) {
      // Product vanished mid-upload — don't leave an orphaned file behind
      await deletePublicObject(key);
      return { error: "Товар не найден." };
    }
  }

  revalidatePath(`/admin/products/${productId.data}`);
  return { success: true };
}

const imageIdSchema = z.object({
  imageId: z.string().uuid(),
  productId: z.string().uuid(),
});

export async function deleteProductImageAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = imageIdSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Некорректные данные." };

  const deleted = await deleteProductImageAdmin(parsed.data.imageId);
  if (!deleted) return { error: "Изображение не найдено." };

  await deletePublicObject(deleted.s3Key);
  revalidatePath(`/admin/products/${parsed.data.productId}`);
  return { success: true };
}

export async function makePrimaryProductImageAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = imageIdSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Некорректные данные." };

  const ok = await makePrimaryProductImageAdmin(parsed.data.imageId);
  if (!ok) return { error: "Изображение не найдено." };

  revalidatePath(`/admin/products/${parsed.data.productId}`);
  return { success: true };
}

const moveImageSchema = imageIdSchema.extend({
  direction: z.enum(["up", "down"]),
});

export async function moveProductImageAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = moveImageSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Некорректные данные." };

  const ok = await moveProductImageAdmin(parsed.data.imageId, parsed.data.direction);
  if (!ok) return { error: "Изображение не найдено." };

  revalidatePath(`/admin/products/${parsed.data.productId}`);
  return { success: true };
}

const altSchema = imageIdSchema.extend({
  altText: z.string().max(300, "Слишком длинный текст").optional(),
});

export async function updateProductImageAltAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = altSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }

  const alt = parsed.data.altText?.trim();
  const ok = await updateProductImageAltAdmin(parsed.data.imageId, alt || null);
  if (!ok) return { error: "Изображение не найдено." };

  revalidatePath(`/admin/products/${parsed.data.productId}`);
  return { success: true };
}
