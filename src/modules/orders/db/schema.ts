import {
  pgTable,
  pgEnum,
  text,
  bigint,
  integer,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { productVariants } from "@/modules/catalog/db/schema";
import { customers } from "@/modules/customers/db/schema";

// ---------------------------------------------------------------------------
// Order state machine
// Transitions: draft → pending_payment → paid → assembling → shipped
//            → delivered → completed
// Terminal: cancelled, refunded
// ---------------------------------------------------------------------------
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending_payment",
  "paid",
  "assembling",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
]);

export const orderEventTypeEnum = pgEnum("order_event_type", [
  "created",
  "payment_initiated",
  "payment_received",
  "assembly_started",
  "shipped",
  "delivered",
  "completed",
  "cancellation_requested",
  "cancelled",
  "refund_requested",
  "refunded",
  "note_added",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Human-readable number for customer communication
    number: text("number").notNull(), // e.g. "FS-2025-0042"
    customerId: uuid("customer_id").references(() => customers.id),
    // Guest email — set even for auth'd customers for receipt delivery
    email: text("email").notNull(),
    status: orderStatusEnum("status").notNull().default("draft"),

    // Snapshot of shipping address at order time (not linked to address table)
    shippingAddress: jsonb("shipping_address")
      .notNull()
      .$type<ShippingAddress>(),

    // Amounts — all in kopecks
    subtotalCopecks: bigint("subtotal_copecks", { mode: "bigint" }).notNull(),
    shippingCopecks: bigint("shipping_copecks", { mode: "bigint" }).notNull(),
    discountCopecks: bigint("discount_copecks", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    totalCopecks: bigint("total_copecks", { mode: "bigint" }).notNull(),

    // Customer-facing notes
    customerNote: text("customer_note"),
    // Internal admin notes
    adminNote: text("admin_note"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("orders_customer_idx").on(t.customerId),
    index("orders_status_idx").on(t.status),
    index("orders_created_at_idx").on(t.createdAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),
    // Snapshot of product data at order time — decoupled from live catalog
    productName: text("product_name").notNull(),
    variantLabel: text("variant_label").notNull(),
    sku: text("sku").notNull(),
    quantity: integer("quantity").notNull(),
    // Unit price at time of purchase, in kopecks
    unitPriceCopecks: bigint("unit_price_copecks", { mode: "bigint" }).notNull(),
    totalPriceCopecks: bigint("total_price_copecks", {
      mode: "bigint",
    }).notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

// Immutable audit log of all state transitions and events
export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    eventType: orderEventTypeEnum("event_type").notNull(),
    // Who triggered the event
    actorType: text("actor_type").notNull().$type<"customer" | "admin" | "system">(),
    actorId: text("actor_id"), // user_id, "system", or "webhook:yukassa"
    // Arbitrary JSON payload for the event (e.g. payment_id, old/new status)
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("order_events_order_idx").on(t.orderId),
    index("order_events_created_at_idx").on(t.createdAt),
  ]
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}));

// ---------------------------------------------------------------------------
// Shared types used as JSONB shapes
// ---------------------------------------------------------------------------
export interface ShippingAddress {
  fullName: string;
  phone: string; // stored masked in logs, full in DB (152-FZ: DB is РФ-only)
  city: string;
  street: string;
  apartment?: string;
  postalCode: string;
  region: string;
}

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type OrderEventType = (typeof orderEventTypeEnum.enumValues)[number];
