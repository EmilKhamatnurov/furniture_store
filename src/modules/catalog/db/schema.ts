import {
  pgTable,
  text,
  bigint,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Catalog schema
// Prices stored as bigint (kopecks). Never use numeric/float for money.
// ---------------------------------------------------------------------------

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    parentId: uuid("parent_id"),
    imageKey: text("image_key"), // S3 object key
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("categories_slug_idx").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
  ]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    // Rich text / HTML for the product page body
    body: text("body"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    // Base price in kopecks — variants may override
    basePriceCopecks: bigint("base_price_copecks", { mode: "bigint" }).notNull(),
    // Volumetric dimensions (cm) for shipping cost calculation
    lengthCm: integer("length_cm").notNull().default(0),
    widthCm: integer("width_cm").notNull().default(0),
    heightCm: integer("height_cm").notNull().default(0),
    weightGrams: integer("weight_grams").notNull().default(0),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    // schema.org extra attributes as JSON: [{name, value}]
    attributes: jsonb("attributes").$type<Array<{ name: string; value: string }>>(),
    isActive: boolean("is_active").notNull().default(true),
    isArchived: boolean("is_archived").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_category_idx").on(t.categoryId),
    index("products_active_idx").on(t.isActive, t.isArchived),
  ]
);

// Product images — ordered list of S3 keys
export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    s3Key: text("s3_key").notNull(),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)]
);

// Variants: e.g., "Дуб / Серый велюр", "Орех / Бежевый"
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    // Human-readable label, e.g. "Дуб / Серый велюр"
    label: text("label").notNull(),
    // Options as JSON: [{name: "Дерево", value: "Дуб"}, {name: "Обивка", value: "Серый велюр"}]
    options: jsonb("options")
      .notNull()
      .$type<Array<{ name: string; value: string }>>(),
    // Price override — if null, falls back to products.base_price_copecks
    priceCopecks: bigint("price_copecks", { mode: "bigint" }),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    // Variant-specific dimensions if different from product
    lengthCm: integer("length_cm"),
    widthCm: integer("width_cm"),
    heightCm: integer("height_cm"),
    weightGrams: integer("weight_grams"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("product_variants_sku_idx").on(t.sku),
    index("product_variants_product_idx").on(t.productId),
  ]
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
