import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Customers schema — 152-FZ compliance notes:
// - All PII stored only in this РФ-hosted DB
// - Consent records are versioned with content hash
// - Phone stored in full in DB (allowed), masked in all log output
// ---------------------------------------------------------------------------

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    // Hashed with argon2 — never store plaintext passwords
    passwordHash: text("password_hash"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    // Full phone in DB — masked in logs (see logger/maskPhone)
    phone: text("phone"),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("customers_email_idx").on(t.email),
    index("customers_active_idx").on(t.isActive),
  ]
);

// 152-FZ: versioned consent records with content hash
export const customerConsents = pgTable(
  "customer_consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    // "privacy_policy" | "marketing_email" | "marketing_sms"
    consentType: text("consent_type").notNull(),
    // SHA-256 hash of the consent text shown to user
    consentTextHash: text("consent_text_hash").notNull(),
    // Version label of the policy document, e.g. "v2025-01-01"
    policyVersion: text("policy_version").notNull(),
    isGranted: boolean("is_granted").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    // IP address of the consent action (for legal evidence)
    ipAddress: text("ip_address"),
  },
  (t) => [
    index("consents_customer_idx").on(t.customerId),
    index("consents_type_idx").on(t.consentType),
  ]
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const customersRelations = relations(customers, ({ many }) => ({
  consents: many(customerConsents),
}));

export const customerConsentsRelations = relations(
  customerConsents,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerConsents.customerId],
      references: [customers.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerConsent = typeof customerConsents.$inferSelect;
