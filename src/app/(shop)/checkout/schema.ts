import { z } from "zod";

const UFA_CITY_NAMES = new Set(["уфа", "г. уфа", "город уфа"]);

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Введите имя и фамилию"),
  email: z.string().email("Некорректный email"),
  phone: z
    .string()
    .min(10, "Введите номер телефона")
    .regex(/^[\d\s\+\-\(\)]+$/, "Некорректный номер телефона"),
  region: z.string().min(2, "Введите регион или область"),
  city: z
    .string()
    .trim()
    .refine(
      (value) => UFA_CITY_NAMES.has(value.toLocaleLowerCase("ru-RU")),
      "Сейчас доставка доступна только по Уфе"
    ),
  street: z.string().min(3, "Введите улицу и номер дома"),
  apartment: z.string().optional(),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, "Индекс — 6 цифр"),
  zoneId: z.string().uuid("Выберите зону доставки"),
  note: z.string().optional(),
  /** Serialized cart lines (JSON). Only variantId+quantity are trusted —
   *  prices/names are re-read from the DB on the server. */
  cartItems: z.string().min(2, "Корзина пуста"),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

/**
 * Shape of the client-supplied cart payload. Extra fields (price snapshots
 * for UI) are ignored — the server never trusts them.
 */
export const cartLinesSchema = z
  .array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().int().min(1).max(99),
    })
  )
  .min(1, "Корзина пуста")
  .max(50, "Слишком много позиций в корзине");

export type CartLine = z.infer<typeof cartLinesSchema>[number];

/** Parse + validate the serialized cart, merging duplicate variant lines. */
export function parseCartLines(json: string): CartLine[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  // Strip unknown fields before validation (client sends full CartItem objects)
  if (!Array.isArray(raw)) return null;
  const stripped = raw.map((i) => ({
    variantId: (i as { variantId?: unknown }).variantId,
    quantity: (i as { quantity?: unknown }).quantity,
  }));
  const parsed = cartLinesSchema.safeParse(stripped);
  if (!parsed.success) return null;

  const byVariant = new Map<string, CartLine>();
  for (const line of parsed.data) {
    const existing = byVariant.get(line.variantId);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + line.quantity);
    } else {
      byVariant.set(line.variantId, { ...line });
    }
  }
  return [...byVariant.values()];
}
