import "server-only";
import { db } from "@/lib/db";
import { payments, paymentWebhookEvents } from "./db/schema";
import { orders, orderEvents } from "@/modules/orders/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Payments repository — all DB writes for the payments module
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// createPaymentRecord
// Inserts a new payment row and transitions the order to pending_payment.
// ---------------------------------------------------------------------------
export async function createPaymentRecord(input: {
  orderId: string;
  yukassaPaymentId: string;
  amountCopecks: bigint;
  idempotencyKey: string;
  confirmationUrl: string | null;
}) {
  const { orderId, yukassaPaymentId, amountCopecks, idempotencyKey, confirmationUrl } =
    input;

  const [payment] = await db
    .insert(payments)
    .values({
      orderId,
      yukassaPaymentId,
      status: "pending",
      amountCopecks,
      idempotencyKey,
      confirmationUrl,
    })
    .returning();

  if (!payment) throw new Error("Payment insert returned no rows");

  // Advance order state machine: draft → pending_payment
  await db
    .update(orders)
    .set({ status: "pending_payment", updatedAt: sql`now()` })
    .where(eq(orders.id, orderId));

  await db.insert(orderEvents).values({
    orderId,
    eventType: "payment_initiated",
    actorType: "customer",
    payload: { yukassaPaymentId, idempotencyKey },
  });

  return payment;
}

// ---------------------------------------------------------------------------
// processPaymentSucceeded — idempotent, called from webhook handler
// ---------------------------------------------------------------------------
export async function processPaymentSucceeded(
  yukassaPaymentId: string
): Promise<{ orderId: string; alreadyProcessed: boolean }> {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.yukassaPaymentId, yukassaPaymentId),
  });

  if (!payment) throw new Error(`Payment not found: ${yukassaPaymentId}`);
  // already processed — idempotent: report orderId but skip side effects
  if (payment.status === "succeeded") {
    return { orderId: payment.orderId, alreadyProcessed: true };
  }

  await db
    .update(payments)
    .set({ status: "succeeded", succeededAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(payments.yukassaPaymentId, yukassaPaymentId));

  await db
    .update(orders)
    .set({ status: "paid", paidAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(orders.id, payment.orderId));

  await db.insert(orderEvents).values({
    orderId: payment.orderId,
    eventType: "payment_received",
    actorType: "system",
    actorId: "webhook:yukassa",
    payload: { yukassaPaymentId },
  });

  return { orderId: payment.orderId, alreadyProcessed: false };
}

// ---------------------------------------------------------------------------
// processPaymentCancelled — idempotent, rolls order back to draft
// ---------------------------------------------------------------------------
export async function processPaymentCancelled(yukassaPaymentId: string) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.yukassaPaymentId, yukassaPaymentId),
  });

  if (!payment) throw new Error(`Payment not found: ${yukassaPaymentId}`);
  if (payment.status === "cancelled") return; // idempotent

  await db
    .update(payments)
    .set({ status: "cancelled", updatedAt: sql`now()` })
    .where(eq(payments.yukassaPaymentId, yukassaPaymentId));

  // Roll back to draft only if still pending_payment — allows customer to retry
  await db
    .update(orders)
    .set({ status: "draft", updatedAt: sql`now()` })
    .where(
      and(eq(orders.id, payment.orderId), eq(orders.status, "pending_payment"))
    );
}

// ---------------------------------------------------------------------------
// recordWebhookEvent
// Inserts a new webhook event row with deduplication via the unique index.
// Returns { duplicate: true } if externalEventId already exists.
// ---------------------------------------------------------------------------
export async function recordWebhookEvent(input: {
  externalEventId: string;
  yukassaPaymentId: string;
  eventType: string;
  rawPayload: unknown;
  signatureValid: "yes" | "no";
}): Promise<{ duplicate: boolean; eventId: string | null }> {
  const { externalEventId, yukassaPaymentId, eventType, rawPayload, signatureValid } =
    input;

  try {
    const [event] = await db
      .insert(paymentWebhookEvents)
      .values({
        externalEventId,
        yukassaPaymentId,
        eventType,
        rawPayload: rawPayload as Record<string, unknown>,
        signatureValid,
        processed: "pending",
      })
      .returning();

    return { duplicate: false, eventId: event!.id };
  } catch (err: unknown) {
    // Postgres unique violation code — duplicate event
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "23505"
    ) {
      return { duplicate: true, eventId: null };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// markWebhookProcessed — set final outcome on the event row
// ---------------------------------------------------------------------------
export async function markWebhookProcessed(
  externalEventId: string,
  outcome: "ok" | "error",
  errorMessage?: string | undefined
) {
  await db
    .update(paymentWebhookEvents)
    .set({
      processed: outcome,
      processedAt: sql`now()`,
      errorMessage: errorMessage ?? null,
    })
    .where(eq(paymentWebhookEvents.externalEventId, externalEventId));
}

// ---------------------------------------------------------------------------
// getActivePaymentForOrder
// Returns a pending/waiting payment so we can reuse its confirmationUrl.
// ---------------------------------------------------------------------------
export async function getActivePaymentForOrder(orderId: string) {
  return await db.query.payments.findFirst({
    where: and(
      eq(payments.orderId, orderId),
      inArray(payments.status, ["pending", "waiting_for_capture"])
    ),
  });
}
