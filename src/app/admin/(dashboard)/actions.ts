"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  requireAdmin,
  clearAdminCookie,
  updateOrderStatus,
  addOrderNote,
  updateProductAdmin,
  updateVariantAdmin,
} from "@/modules/admin";
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
  const priceCopecks =
    priceRub && priceRub.trim() !== "" ? rubToKopecks(Number(priceRub)) : null;

  await updateVariantAdmin(variantId, {
    priceCopecks,
    stockQuantity,
    isActive: isActive === "on",
  });

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}
