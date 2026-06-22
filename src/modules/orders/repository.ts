import "server-only";
import { db } from "@/lib/db";
import { orders, orderItems, orderEvents } from "./db/schema";
import { eq, or, desc, sql } from "drizzle-orm";
import type { CartItem } from "@/modules/cart/types";
import type { ShippingAddress } from "./db/schema";

// ---------------------------------------------------------------------------
// Orders repository — all DB writes for the order module
// ---------------------------------------------------------------------------

export interface CreateOrderInput {
  email: string;
  shippingAddress: ShippingAddress;
  items: CartItem[];
  note?: string | undefined;
  /** Link to a logged-in customer, when present */
  customerId?: string | undefined;
}

/** Generate FS-YYYY-NNNNN order number, globally sequential */
async function generateOrderNumber(): Promise<string> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders);
  const seq = (row?.count ?? 0) + 1;
  return `FS-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`;
}

export async function createOrder(input: CreateOrderInput) {
  const { email, shippingAddress, items, note, customerId } = input;

  const orderNumber = await generateOrderNumber();

  const subtotalCopecks = items.reduce(
    (sum, item) => sum + item.priceCopecks * BigInt(item.quantity),
    0n
  );
  const shippingCopecks = 0n; // Shipping module — future step
  const totalCopecks = subtotalCopecks + shippingCopecks;

  const [order] = await db
    .insert(orders)
    .values({
      number: orderNumber,
      email,
      customerId: customerId ?? null,
      status: "draft",
      shippingAddress,
      subtotalCopecks,
      shippingCopecks,
      totalCopecks,
      customerNote: note ?? null,
    })
    .returning();

  if (!order) throw new Error("Order insert returned no rows");

  await db.insert(orderItems).values(
    items.map((item) => ({
      orderId: order.id,
      variantId: item.variantId,
      productName: item.productName,
      variantLabel: item.variantLabel,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceCopecks: item.priceCopecks,
      totalPriceCopecks: item.priceCopecks * BigInt(item.quantity),
    }))
  );

  await db.insert(orderEvents).values({
    orderId: order.id,
    eventType: "created",
    actorType: "customer",
    payload: { orderNumber, email },
  });

  return order;
}

export async function getOrderById(id: string) {
  return await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true, events: true },
  });
}

/**
 * Orders belonging to a customer — matched by customerId OR by the email
 * used at checkout (so guest orders placed before sign-up still appear).
 * Newest first, with line items.
 */
export async function getOrdersForCustomer(customerId: string, email: string) {
  return await db.query.orders.findMany({
    where: or(eq(orders.customerId, customerId), eq(orders.email, email.toLowerCase())),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
  });
}
