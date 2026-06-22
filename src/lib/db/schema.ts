// Re-export all domain schemas for Drizzle's schema-aware query builder.
// Each module defines its own tables; we barrel-export them here so drizzle()
// gets the full picture for relational queries.

export * from "@/modules/catalog/db/schema";
export * from "@/modules/orders/db/schema";
export * from "@/modules/payments/db/schema";
export * from "@/modules/customers/db/schema";
export * from "@/modules/shipping/db/schema";
export * from "@/modules/cms/db/schema";
