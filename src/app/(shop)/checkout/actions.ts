"use server";

import { redirect } from "next/navigation";
import { checkoutSchema, parseCartLines, type CartLine } from "./schema";
import { createOrder, createOrderAccessToken, type OrderLineInput } from "@/modules/orders";
import { sendOrderConfirmationEmail } from "@/modules/email";
import { getCurrentCustomer } from "@/modules/customers";
import { findSellableVariantsByIds } from "@/modules/catalog";
import { quoteShipping } from "@/modules/shipping";
import { rateLimit, clientIp, retryAfterText } from "@/lib/security/rate-limit";

export interface ActionState {
  errors?: Partial<Record<string, string[]>>;
  message?: string;
}

// ---------------------------------------------------------------------------
// Server-side re-pricing: the client only tells us WHAT it wants
// (variantId + quantity); prices, names and SKUs always come from the DB.
// Returns null when some variant no longer exists / is not sellable.
// ---------------------------------------------------------------------------
async function buildOrderLines(lines: CartLine[]): Promise<OrderLineInput[] | null> {
  const variants = await findSellableVariantsByIds(lines.map((l) => l.variantId));
  const byId = new Map(variants.map((v) => [v.id, v]));

  const result: OrderLineInput[] = [];
  for (const line of lines) {
    const v = byId.get(line.variantId);
    if (!v) return null; // variant removed/deactivated since it was added to cart
    result.push({
      variantId: v.id,
      productName: v.product.name,
      variantLabel: v.label,
      sku: v.sku,
      quantity: line.quantity,
      unitPriceCopecks: v.priceCopecks ?? v.product.basePriceCopecks,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// quoteShippingAction — live delivery price for the chosen zone, called from
// the checkout form when the zone changes. Returns kopecks as a string.
// ---------------------------------------------------------------------------
export interface QuoteState {
  shippingCopecks: string | null;
  zoneName?: string;
  error?: string;
}

export async function quoteShippingAction(
  zoneId: string,
  cartItemsJson: string
): Promise<QuoteState> {
  const rl = await rateLimit("quote-shipping", await clientIp(), {
    limit: 30,
    windowSec: 60,
  });
  if (!rl.ok) {
    return {
      shippingCopecks: null,
      error: `Слишком много запросов. Попробуйте ${retryAfterText(rl.retryAfterSec)}`,
    };
  }

  const lines = parseCartLines(cartItemsJson);
  if (!lines) {
    return { shippingCopecks: null, error: "Не удалось прочитать корзину" };
  }

  const quote = await quoteShipping(lines, zoneId);
  if (!quote || quote.shippingCopecks === null) {
    return { shippingCopecks: null, error: "Не удалось рассчитать доставку для зоны" };
  }
  return { shippingCopecks: quote.shippingCopecks.toString(), zoneName: quote.zoneName };
}

// ---------------------------------------------------------------------------
// checkoutAction — validates the form, writes order to DB, redirects.
// Used with React's useActionState hook in checkout-form.tsx.
// ---------------------------------------------------------------------------
export async function checkoutAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rl = await rateLimit("checkout", await clientIp(), {
    limit: 10,
    windowSec: 600,
  });
  if (!rl.ok) {
    return {
      message: `Слишком много попыток оформления. Попробуйте ${retryAfterText(rl.retryAfterSec)}`,
    };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = checkoutSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const {
    fullName,
    email,
    phone,
    region,
    city,
    street,
    apartment,
    postalCode,
    zoneId,
    note,
    cartItems: cartItemsJson,
  } = parsed.data;

  const lines = parseCartLines(cartItemsJson);
  if (!lines) {
    return { message: "Не удалось прочитать состав корзины. Обновите страницу и попробуйте снова." };
  }

  // Authoritative prices/names/SKUs from the catalog — never from the client
  const items = await buildOrderLines(lines);
  if (!items) {
    return {
      message:
        "Некоторые товары из корзины больше недоступны. Обновите страницу и проверьте корзину.",
    };
  }

  // Recompute shipping server-side (never trust a client-supplied amount)
  const quote = await quoteShipping(lines, zoneId);
  if (!quote || quote.shippingCopecks === null) {
    return { message: "Не удалось рассчитать доставку. Выберите зону доставки." };
  }

  // Link the order to the logged-in customer, if any (guest checkout otherwise)
  const customer = await getCurrentCustomer();

  let orderId: string;
  try {
    const order = await createOrder({
      email,
      shippingAddress: {
        fullName,
        phone,
        region,
        city,
        street,
        postalCode,
        zoneName: quote.zoneName,
        ...(apartment ? { apartment } : {}),
      },
      items,
      note,
      customerId: customer?.id,
      shippingCopecks: quote.shippingCopecks,
    });
    orderId = order.id;
  } catch (err) {
    console.error("[checkout] createOrder failed:", err);
    return { message: "Произошла ошибка при создании заказа. Попробуйте позже." };
  }

  // Fire-and-forget confirmation email (enqueues a BullMQ job; never blocks).
  // Internally swallows its own errors, so checkout never fails on email.
  await sendOrderConfirmationEmail(orderId);

  // Capability token so the guest can view their order (page hides PII otherwise)
  const token = createOrderAccessToken(orderId);
  redirect(`/orders/${orderId}?t=${token}`);
}
