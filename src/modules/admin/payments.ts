import "server-only";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { payments } from "@/modules/payments/db/schema";
import { orders } from "@/modules/orders/db/schema";

// ---------------------------------------------------------------------------
// Admin payments view — read-only list joined with order numbers.
// ---------------------------------------------------------------------------

export async function listPayments(limit = 100) {
  return db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      orderNumber: orders.number,
      yukassaPaymentId: payments.yukassaPaymentId,
      status: payments.status,
      method: payments.method,
      amountCopecks: payments.amountCopecks,
      createdAt: payments.createdAt,
      succeededAt: payments.succeededAt,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}
