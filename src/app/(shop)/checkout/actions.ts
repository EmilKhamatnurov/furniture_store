"use server";

import { redirect } from "next/navigation";
import { checkoutSchema } from "./schema";
import { createOrder, createOrderAccessToken } from "@/modules/orders";
import { sendOrderConfirmationEmail } from "@/modules/email";
import { getCurrentCustomer } from "@/modules/customers";
import type { CartItem } from "@/modules/cart/types";

export interface ActionState {
  errors?: Partial<Record<string, string[]>>;
  message?: string;
}

// ---------------------------------------------------------------------------
// checkoutAction — validates the form, writes order to DB, redirects.
// Used with React's useActionState hook in checkout-form.tsx.
// ---------------------------------------------------------------------------
export async function checkoutAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
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
    note,
    cartItems: cartItemsJson,
  } = parsed.data;

  // Deserialize cart items (BigInt was serialised as string for JSON transport)
  let items: CartItem[];
  try {
    const raw = JSON.parse(cartItemsJson) as Array<
      Omit<CartItem, "priceCopecks"> & { priceCopecks: string }
    >;
    items = raw.map((i) => ({ ...i, priceCopecks: BigInt(i.priceCopecks) }));
  } catch {
    return { message: "Не удалось прочитать состав корзины. Обновите страницу и попробуйте снова." };
  }

  if (items.length === 0) {
    return { message: "Корзина пуста — добавьте товары перед оформлением." };
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
        ...(apartment ? { apartment } : {}),
      },
      items,
      note,
      customerId: customer?.id,
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
