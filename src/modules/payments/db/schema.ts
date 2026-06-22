import {
  pgTable,
  pgEnum,
  text,
  bigint,
  timestamp,
  uuid,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { orders } from "@/modules/orders/db/schema";

// ---------------------------------------------------------------------------
// Payments schema
// We never store card numbers. All card data lives in YuKassa.
// payment_id is YuKassa's UUID — our deduplication key for webhooks.
// ---------------------------------------------------------------------------

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "waiting_for_capture",
  "succeeded",
  "cancelled",
  "refunded",
  "partially_refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_card",
  "sbp",
  "installment", // "Долями"
  "cash",        // reserved for future offline
  "other",
]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    // YuKassa payment UUID — idempotency & deduplication key
    yukassaPaymentId: text("yukassa_payment_id").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    method: paymentMethodEnum("method"),
    amountCopecks: bigint("amount_copecks", { mode: "bigint" }).notNull(),
    // Idempotency key sent with the payment creation request
    idempotencyKey: text("idempotency_key").notNull(),
    // YuKassa confirmation URL — redirect user here
    confirmationUrl: text("confirmation_url"),
    // Receipt URL from YuKassa (54-FZ)
    receiptUrl: text("receipt_url"),
    // Raw webhook payload for audit (full, including signature)
    lastWebhookPayload: jsonb("last_webhook_payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    succeededAt: timestamp("succeeded_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("payments_yukassa_id_idx").on(t.yukassaPaymentId),
    uniqueIndex("payments_idempotency_key_idx").on(t.idempotencyKey),
    index("payments_order_idx").on(t.orderId),
    index("payments_status_idx").on(t.status),
  ]
);

// Immutable webhook event log — processed at-least-once with deduplication
export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // YuKassa event ID (from payload) — deduplication key
    externalEventId: text("external_event_id").notNull(),
    yukassaPaymentId: text("yukassa_payment_id").notNull(),
    eventType: text("event_type").notNull(), // e.g. "payment.succeeded"
    // Raw JSON body as received
    rawPayload: jsonb("raw_payload").notNull(),
    // Was the signature valid?
    signatureValid: text("signature_valid").notNull().$type<"yes" | "no">(),
    // Processing outcome
    processed: text("processed").notNull().default("pending").$type<
      "pending" | "ok" | "error" | "duplicate"
    >(),
    errorMessage: text("error_message"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("webhook_events_external_id_idx").on(t.externalEventId),
    index("webhook_events_payment_idx").on(t.yukassaPaymentId),
    index("webhook_events_processed_idx").on(t.processed),
  ]
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentWebhookEvent = typeof paymentWebhookEvents.$inferSelect;
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
