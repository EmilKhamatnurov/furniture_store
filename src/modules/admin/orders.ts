import "server-only";
import { db } from "@/lib/db";
import { eq, desc, sql, count } from "drizzle-orm";
import { orders, orderEvents } from "@/modules/orders/db/schema";
import { payments } from "@/modules/payments/db/schema";
import type { OrderStatus, OrderEventType } from "@/modules/orders/db/schema";

// ---------------------------------------------------------------------------
// Admin orders data access — unfiltered reads + privileged writes.
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

export interface ListOrdersParams {
  status?: OrderStatus | undefined;
  page?: number | undefined;
}

export async function listOrders(params: ListOrdersParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const where = params.status ? eq(orders.status, params.status) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db.query.orders.findMany({
      where,
      with: { items: true },
      orderBy: [desc(orders.createdAt)],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    db.select({ value: count() }).from(orders).where(where ?? sql`true`),
  ]);

  const total = totalRow?.value ?? 0;
  return {
    orders: rows,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getOrderDetail(id: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      events: { orderBy: [desc(orderEvents.createdAt)] },
    },
  });
  if (!order) return null;

  const orderPayments = await db.query.payments.findMany({
    where: eq(payments.orderId, id),
    orderBy: [desc(payments.createdAt)],
  });

  return { ...order, payments: orderPayments };
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

// Allowed forward/terminal transitions per current status.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["cancelled"],
  pending_payment: ["paid", "cancelled"],
  paid: ["assembling", "cancelled", "refunded"],
  assembling: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["completed", "refunded"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
};

const STATUS_EVENT: Record<OrderStatus, OrderEventType> = {
  draft: "created",
  pending_payment: "payment_initiated",
  paid: "payment_received",
  assembling: "assembly_started",
  shipped: "shipped",
  delivered: "delivered",
  completed: "completed",
  cancelled: "cancelled",
  refunded: "refunded",
};

export function allowedTransitions(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

/**
 * Move an order to a new status (admin action). Validates the transition,
 * stamps the relevant timestamp, and appends an immutable order event.
 * Returns false when the transition is not allowed.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  adminEmail: string,
  note?: string | undefined
): Promise<boolean> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return false;
  if (!allowedTransitions(order.status).includes(newStatus)) return false;

  const stamp: Partial<typeof orders.$inferInsert> = { updatedAt: sql`now()` as never };
  if (newStatus === "paid") stamp.paidAt = sql`now()` as never;
  if (newStatus === "shipped") stamp.shippedAt = sql`now()` as never;
  if (newStatus === "completed") stamp.completedAt = sql`now()` as never;

  await db
    .update(orders)
    .set({ status: newStatus, ...stamp })
    .where(eq(orders.id, orderId));

  await db.insert(orderEvents).values({
    orderId,
    eventType: STATUS_EVENT[newStatus],
    actorType: "admin",
    actorId: adminEmail,
    payload: { from: order.status, to: newStatus, ...(note ? { note } : {}) },
  });

  return true;
}

/** Append an internal admin note as an order event */
export async function addOrderNote(
  orderId: string,
  adminEmail: string,
  note: string
): Promise<void> {
  await db.insert(orderEvents).values({
    orderId,
    eventType: "note_added",
    actorType: "admin",
    actorId: adminEmail,
    payload: { note },
  });
}
