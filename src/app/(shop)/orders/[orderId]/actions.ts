"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { orders } from "@/modules/orders/db/schema";
import { eq } from "drizzle-orm";
import {
  createYukassaPayment,
  createPaymentRecord,
  getActivePaymentForOrder,
} from "@/modules/payments";
import { canAccessOrder } from "./authorize";

// ---------------------------------------------------------------------------
// initiatePaymentAction
// Called from the Pay button on the order confirmation page.
// Creates a YuKassa payment and redirects the user to the payment form.
// ---------------------------------------------------------------------------

export interface PayActionState {
  error?: string | undefined;
}

export async function initiatePaymentAction(
  _prevState: PayActionState | null,
  formData: FormData
): Promise<PayActionState> {
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string" || !orderId) {
    return { error: "Некорректный идентификатор заказа." };
  }

  // Load the order
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return { error: "Заказ не найден." };
  }

  // Same authorization as the order page: capability token or logged-in owner.
  // Without this, anyone who guesses an order id could initiate payments.
  const token = formData.get("t");
  const allowed = await canAccessOrder(
    orderId,
    typeof token === "string" ? token : null,
    order.customerId,
    order.email
  );
  if (!allowed) {
    return { error: "Нет доступа к этому заказу." };
  }

  // Payment can only be initiated while the order is awaiting it
  if (order.status !== "draft" && order.status !== "pending_payment") {
    return { error: "Этот заказ нельзя оплатить: он уже оплачен или отменён." };
  }

  // Check for an existing active payment → reuse its confirmation URL
  const activePayment = await getActivePaymentForOrder(orderId);
  if (activePayment?.confirmationUrl) {
    redirect(activePayment.confirmationUrl);
  }

  // Build the return URL (where YuKassa redirects the user after payment)
  const appUrl = (process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  const returnUrl = `${appUrl}/orders/${orderId}/payment-result`;

  // Create the payment in YuKassa
  const idempotencyKey = crypto.randomUUID();

  let confirmationUrl: string;
  try {
    const yukassaPayment = await createYukassaPayment({
      amountCopecks: order.totalCopecks,
      orderId,
      orderNumber: order.number,
      returnUrl,
      idempotencyKey,
    });

    confirmationUrl =
      yukassaPayment.confirmation?.confirmation_url ?? "";

    if (!confirmationUrl) {
      console.error("[payment] No confirmation_url in YuKassa response", yukassaPayment);
      return { error: "Не удалось получить ссылку на оплату. Попробуйте позже." };
    }

    // Persist the payment record and advance order status
    await createPaymentRecord({
      orderId,
      yukassaPaymentId: yukassaPayment.id,
      amountCopecks: order.totalCopecks,
      idempotencyKey,
      confirmationUrl,
    });
  } catch (err) {
    console.error("[payment] initiatePaymentAction failed:", err);
    return { error: "Ошибка при создании платежа. Попробуйте ещё раз." };
  }

  // redirect() must be called outside try-catch to work correctly
  redirect(confirmationUrl);
}
