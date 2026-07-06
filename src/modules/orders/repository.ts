import "server-only";
import { db } from "@/lib/db";
import { orders, orderItems, orderEvents } from "./db/schema";
import { eq, or, desc, sql } from "drizzle-orm";
import type { ShippingAddress } from "./db/schema";

// ---------------------------------------------------------------------------
// Orders repository — all DB writes for the order module
// ---------------------------------------------------------------------------

/**
 * One order line. All fields (prices, names, SKU) must come from the DB —
 * never from client input. The checkout action re-reads the catalog before
 * building these.
 */
export interface OrderLineInput {
  variantId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  quantity: number;
  unitPriceCopecks: bigint;
}

export interface CreateOrderInput {
  email: string;
  shippingAddress: ShippingAddress;
  items: OrderLineInput[];
  note?: string | undefined;
  /** Link to a logged-in customer, when present */
  customerId?: string | undefined;
  /** Delivery cost in kopecks, computed server-side (defaults to 0) */
  shippingCopecks?: bigint | undefined;
}

export async function createOrder(input: CreateOrderInput) {
  const { email, shippingAddress, items, note, customerId } = input;

  if (items.length === 0) {
    throw new Error("Cannot create an order with no items");
  }

  const subtotalCopecks = items.reduce(
    (sum, item) => sum + item.unitPriceCopecks * BigInt(item.quantity),
    0n
  );
  const shippingCopecks = input.shippingCopecks ?? 0n;
  const totalCopecks = subtotalCopecks + shippingCopecks;

  // Single transaction: order + items + event are all-or-nothing, so a failed
  // insert can never leave a payable order without line items.
  return await db.transaction(async (tx) => {
    // FS-YYYY-NNNNN — sequential part comes from a Postgres sequence (race-safe)
    const seqRows = await tx.execute<{ seq: string }>(
      sql`SELECT nextval('order_number_seq')::text AS seq`
    );
    const seq = Number(seqRows[0]?.seq ?? 0);
    if (!seq) throw new Error("order_number_seq returned no value");
    const orderNumber = `FS-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`;

    const [order] = await tx
      .insert(orders)
      .values({
        number: orderNumber,
        // Lowercased so account lookups by email match guest orders
        email: email.toLowerCase(),
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

    await tx.insert(orderItems).values(
      items.map((item) => ({
        orderId: order.id,
        variantId: item.variantId,
        productName: item.productName,
        variantLabel: item.variantLabel,
        sku: item.sku,
        quantity: item.quantity,
        unitPriceCopecks: item.unitPriceCopecks,
        totalPriceCopecks: item.unitPriceCopecks * BigInt(item.quantity),
      }))
    );

    await tx.insert(orderEvents).values({
      orderId: order.id,
      eventType: "created",
      actorType: "customer",
      payload: { orderNumber, email: email.toLowerCase() },
    });

    return order;
  });
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
