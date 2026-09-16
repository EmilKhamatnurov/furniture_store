"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/modules/admin";
import {
  createZone,
  updateZone,
  addTariff,
  updateTariff,
  deleteTariff,
  setVolumetricDivisor,
} from "@/modules/shipping";
import { rubToKopecks } from "@/lib/utils/money";

export interface ShippingActionState {
  error?: string;
  success?: boolean;
}

// --- Zone (create or update) -----------------------------------------------
const zoneSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2, "Введите название зоны"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.string().optional(), // checkbox "on"
});

export async function saveZoneAction(
  _prev: ShippingActionState | null,
  formData: FormData
): Promise<ShippingActionState> {
  await requireAdmin();
  const parsed = zoneSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }
  const d = parsed.data;
  const values = {
    name: d.name,
    description: d.description?.trim() ? d.description : null,
    sortOrder: d.sortOrder,
    isActive: d.isActive === "on",
  };
  try {
    if (d.id) await updateZone(d.id, values);
    else await createZone(values);
  } catch (err) {
    console.error("[shipping] saveZone failed:", err);
    return { error: "Не удалось сохранить зону." };
  }
  revalidatePath("/admin/shipping");
  return { success: true };
}

// --- Tariff bracket --------------------------------------------------------
const tariffBase = {
  maxWeightKg: z.coerce.number().int().positive("Вес должен быть > 0"),
  priceRub: z.coerce.number().nonnegative("Цена ≥ 0"),
  extraPerKgRub: z.coerce.number().nonnegative("Доплата ≥ 0").default(0),
};

const addTariffSchema = z.object({ zoneId: z.string().uuid(), ...tariffBase });

export async function addTariffAction(
  _prev: ShippingActionState | null,
  formData: FormData
): Promise<ShippingActionState> {
  await requireAdmin();
  const parsed = addTariffSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }
  const d = parsed.data;
  await addTariff({
    zoneId: d.zoneId,
    maxWeightKg: d.maxWeightKg,
    priceCopecks: rubToKopecks(d.priceRub),
    extraPerKgCopecks: rubToKopecks(d.extraPerKgRub),
  });
  revalidatePath("/admin/shipping");
  return { success: true };
}

const updateTariffSchema = z.object({
  tariffId: z.string().uuid(),
  isActive: z.string().optional(),
  ...tariffBase,
});

export async function updateTariffAction(
  _prev: ShippingActionState | null,
  formData: FormData
): Promise<ShippingActionState> {
  await requireAdmin();
  const parsed = updateTariffSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }
  const d = parsed.data;
  await updateTariff(d.tariffId, {
    maxWeightKg: d.maxWeightKg,
    priceCopecks: rubToKopecks(d.priceRub),
    extraPerKgCopecks: rubToKopecks(d.extraPerKgRub),
    isActive: d.isActive === "on",
  });
  revalidatePath("/admin/shipping");
  return { success: true };
}

export async function deleteTariffAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("tariffId");
  if (typeof id === "string" && id) {
    await deleteTariff(id);
    revalidatePath("/admin/shipping");
  }
}

// --- Volumetric divisor ----------------------------------------------------
export async function saveDivisorAction(
  _prev: ShippingActionState | null,
  formData: FormData
): Promise<ShippingActionState> {
  await requireAdmin();
  const divisor = Number(formData.get("divisor"));
  if (!Number.isFinite(divisor) || divisor <= 0) {
    return { error: "Делитель должен быть положительным числом." };
  }
  await setVolumetricDivisor(divisor);
  revalidatePath("/admin/shipping");
  return { success: true };
}
