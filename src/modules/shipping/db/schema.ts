import {
  pgTable,
  text,
  bigint,
  integer,
  boolean,
  timestamp,
  uuid,
  index,
  real,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Shipping schema — in-house delivery tariff matrix
// Zone × volumetric weight → price in kopecks
// Editable via admin panel; cached in Redis (CACHE_TTL.SHIPPING_ZONES)
// ---------------------------------------------------------------------------

// Delivery zones — e.g. "Москва", "МО до 50 км", "МО 50-100 км"
export const shippingZones = pgTable("shipping_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// Tariff rows: zone × weight bracket → price
export const shippingTariffs = pgTable(
  "shipping_tariffs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    zoneId: uuid("zone_id")
      .notNull()
      .references(() => shippingZones.id),
    // Volumetric weight bracket in kg (upper bound, inclusive)
    maxWeightKg: integer("max_weight_kg").notNull(),
    priceCopecks: bigint("price_copecks", { mode: "bigint" }).notNull(),
    // Extra per additional kg above maxWeightKg (for open-ended last bracket)
    extraPerKgCopecks: bigint("extra_per_kg_copecks", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("shipping_tariffs_zone_idx").on(t.zoneId)]
);

// Volumetric weight coefficient: vol_weight = L*W*H / divisor
// Standard courier divisor is 5000 (cm³ → kg)
export const shippingSettings = pgTable("shipping_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(), // e.g. "volumetric_divisor"
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type ShippingZone = typeof shippingZones.$inferSelect;
export type ShippingTariff = typeof shippingTariffs.$inferSelect;
