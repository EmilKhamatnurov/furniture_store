import "server-only";
import { db } from "@/lib/db";
import { sql, inArray, desc, count } from "drizzle-orm";
import { orders } from "@/modules/orders/db/schema";

// ---------------------------------------------------------------------------
// Admin dashboard aggregates.
// ---------------------------------------------------------------------------

// Statuses that count as "paid revenue" (money actually received)
const PAID_STATUSES = ["paid", "assembling", "shipped", "delivered", "completed"] as const;

export async function getDashboardStats() {
  const [
    [totalRow],
    [paidRevenueRow],
    [needsAttentionRow],
  ] = await Promise.all([
    db.select({ value: count() }).from(orders),
    db
      .select({
        revenue: sql<string>`coalesce(sum(${orders.totalCopecks}), 0)::text`,
        cnt: count(),
      })
      .from(orders)
      .where(inArray(orders.status, [...PAID_STATUSES])),
    db
      .select({ value: count() })
      .from(orders)
      .where(inArray(orders.status, ["paid", "assembling"])),
  ]);

  return {
    totalOrders: totalRow?.value ?? 0,
    paidOrders: paidRevenueRow?.cnt ?? 0,
    // bigint kopecks as string → revive to bigint
    revenueCopecks: BigInt(paidRevenueRow?.revenue ?? "0"),
    // paid/assembling = orders waiting to be shipped
    needsAttention: needsAttentionRow?.value ?? 0,
  };
}

export async function getRecentOrders(limit = 8) {
  return db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit,
  });
}
