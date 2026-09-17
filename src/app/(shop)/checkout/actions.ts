"use server";

import { redirect } from "next/navigation";
import { checkoutSchema, parseCartLines, type CartLine } from "./schema";
import { createOrder, createOrderAccessToken } from "@/modules/orders";
import { sendOrderCreatedEmails } from "@/modules/email";
import { getCurrentCustomer } from "@/modules/customers";
import { findSellableVariantsByIds } from "@/modules/catalog";
import { quoteShipping } from "@/modules/shipping";
import { rateLimit, clientIp, retryAfterText } from "@/lib/security/rate-limit";
import { buildOrderLines } from "./order-lines";

export interface ActionState {
  errors?: Partial<Record<string, string[]>>;
  message?: string;
}

// ---------------------------------------------------------------------------
// Server-side re-pricing: the client only tells us WHAT it wants
// (variantId + quantity); prices, names and SKUs always come from the DB.
// Returns a user-safe error when a variant is unavailable or stock changed.
// ---------------------------------------------------------------------------
async function buildOrderLinesFromCatalog(lines: CartLine[]) {
  const variants = await findSellableVariantsByIds(lines.map((l) => l.variantId));
  return buildOrderLines(lines, variants);
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
  const orderLines = await buildOrderLinesFromCatalog(lines);
  if ("error" in orderLines) return { message: orderLines.error };

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
      items: orderLines.items,
      note,
      customerId: customer?.id,
      shippingCopecks: quote.shippingCopecks,
    });
    orderId = order.id;
  } catch (err) {
    console.error("[checkout] createOrder failed:", err);
    return { message: "Произошла ошибка при создании заказа. Попробуйте позже." };
  }

  // Customer confirmation and manager notification are queued independently.
  // Internal failures are swallowed, so checkout never fails on email.
  await sendOrderCreatedEmails(orderId);

  // Capability token so the guest can view their order (page hides PII otherwise)
  const token = createOrderAccessToken(orderId);
  redirect(`/orders/${orderId}?t=${token}`);
}
