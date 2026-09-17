import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/modules/orders/db/schema";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { emailQueue } from "@worker/queues";
import {
  renderOrderConfirmation,
  renderPaymentReceived,
  renderAdminNewOrder,
} from "./templates";

// ---------------------------------------------------------------------------
// Email service — high-level, intent-named functions.
// Loads order data, renders the template, and enqueues a BullMQ job.
// Called from server actions / webhooks. Never blocks the request on SMTP.
// ---------------------------------------------------------------------------

const log = logger.child({ module: "email-service" });

async function loadOrder(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
}

/** Enqueue with a stable jobId so retries / double-calls don't duplicate sends */
async function enqueue(
  job: {
    to: string;
    subject: string;
    html: string;
    text: string;
    tag: string;
  },
  dedupeKey: string
) {
  await emailQueue.add("send", { ...job, dedupeKey }, { jobId: dedupeKey });
}

/**
 * Order confirmation — sent right after checkout.
 * Failure here must NOT break the checkout flow: we log and swallow.
 */
export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) {
      log.warn({ orderId }, "sendOrderConfirmationEmail: order not found");
      return;
    }
    const rendered = renderOrderConfirmation(order);
    await enqueue(
      { to: order.email, ...rendered, tag: "order-confirmation" },
      `email:order-confirmation:${orderId}`
    );
  } catch (err) {
    log.error({ err, orderId }, "Failed to enqueue order confirmation email");
  }
}

/**
 * New order notifications — customer confirmation and the operational email
 * to the manager are independent, stable BullMQ jobs. A queue failure never
 * rolls back a successfully created order.
 */
export async function sendOrderCreatedEmails(orderId: string): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) {
      log.warn({ orderId }, "sendOrderCreatedEmails: order not found");
      return;
    }

    const customerEmail = renderOrderConfirmation(order);
    const adminEmail = renderAdminNewOrder(order, { paymentReceived: false });
    const adminTo = env.ADMIN_EMAIL || env.EMAIL_FROM;

    await Promise.all([
      enqueue(
        { to: order.email, ...customerEmail, tag: "order-confirmation" },
        `email:order-confirmation:${orderId}`
      ),
      enqueue(
        { to: adminTo, ...adminEmail, tag: "admin-new-order" },
        `email:admin-new-order:${orderId}`
      ),
    ]);
  } catch (err) {
    log.error({ err, orderId }, "Failed to enqueue new order emails");
  }
}

/**
 * Payment received — sent to customer AND admin when an order is paid.
 * Called from the YuKassa webhook; failures are logged, not thrown.
 */
export async function sendPaymentReceivedEmails(orderId: string): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) {
      log.warn({ orderId }, "sendPaymentReceivedEmails: order not found");
      return;
    }

    // Customer receipt
    const customerEmail = renderPaymentReceived(order);
    await enqueue(
      { to: order.email, ...customerEmail, tag: "payment-received" },
      `email:payment-received:${orderId}`
    );

    // Admin notification
    const adminTo = env.ADMIN_EMAIL || env.EMAIL_FROM;
    const adminEmail = renderAdminNewOrder(order, { paymentReceived: true });
    await enqueue(
      { to: adminTo, ...adminEmail, tag: "admin-new-order" },
      `email:admin-paid-order:${orderId}`
    );
  } catch (err) {
    log.error({ err, orderId }, "Failed to enqueue payment-received emails");
  }
}
