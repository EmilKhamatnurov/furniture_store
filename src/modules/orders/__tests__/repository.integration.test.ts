import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

// This suite never runs against a developer's working database by accident.
// Enable it only with a dedicated disposable database and explicit opt-in.
const runDbIntegration = process.env["RUN_DB_INTEGRATION_TESTS"] === "true";
const describeDb = runDbIntegration ? describe : describe.skip;

type Db = typeof import("@/lib/db").db;

describeDb("orders repository (PostgreSQL integration)", () => {
  let db: Db;
  let createOrder: typeof import("@/modules/orders").createOrder;
  let getOrderById: typeof import("@/modules/orders").getOrderById;
  let categories: typeof import("@/modules/catalog/db/schema").categories;
  let products: typeof import("@/modules/catalog/db/schema").products;
  let productVariants: typeof import("@/modules/catalog/db/schema").productVariants;
  let orders: typeof import("@/modules/orders/db/schema").orders;

  const suffix = crypto.randomUUID().replaceAll("-", "");
  const categoryId = crypto.randomUUID();
  const productId = crypto.randomUUID();
  const variantId = crypto.randomUUID();
  let orderId: string | null = null;

  beforeAll(async () => {
    ({ db } = await import("@/lib/db"));
    ({ createOrder, getOrderById } = await import("@/modules/orders"));
    ({ categories, products, productVariants } = await import("@/modules/catalog/db/schema"));
    ({ orders } = await import("@/modules/orders/db/schema"));

    await db.insert(categories).values({
      id: categoryId,
      slug: `integration-${suffix}`,
      name: "Integration category",
      sortOrder: 999,
      isActive: true,
    });
    await db.insert(products).values({
      id: productId,
      slug: `integration-product-${suffix}`,
      name: "Integration table",
      categoryId,
      basePriceCopecks: 12000000n,
      lengthCm: 160,
      widthCm: 80,
      heightCm: 75,
      weightGrams: 42000,
      isActive: true,
      sortOrder: 999,
    });
    await db.insert(productVariants).values({
      id: variantId,
      productId,
      sku: `INT-${suffix}`,
      label: "Integration oak",
      options: [{ name: "Материал", value: "Дуб" }],
      priceCopecks: 12500000n,
      stockQuantity: 2,
      isActive: true,
    });
  });

  afterAll(async () => {
    if (!db) return;
    if (orderId) await db.delete(orders).where(eq(orders.id, orderId));
    await db.delete(productVariants).where(eq(productVariants.id, variantId));
    await db.delete(products).where(eq(products.id, productId));
    await db.delete(categories).where(eq(categories.id, categoryId));
  });

  it("creates an atomic order with immutable item and amount snapshots", async () => {
    const order = await createOrder({
      email: "integration@example.com",
      shippingAddress: {
        fullName: "Integration Test",
        phone: "+79990000000",
        region: "Республика Башкортостан",
        city: "Уфа",
        street: "Тестовая, 1",
        postalCode: "450000",
        zoneName: "Уфа — в черте города (demo)",
      },
      shippingCopecks: 250000n,
      items: [
        {
          variantId,
          productName: "Integration table",
          variantLabel: "Integration oak",
          sku: `INT-${suffix}`,
          quantity: 2,
          unitPriceCopecks: 12500000n,
        },
      ],
    });
    orderId = order.id;

    expect(order.subtotalCopecks).toBe(25000000n);
    expect(order.shippingCopecks).toBe(250000n);
    expect(order.totalCopecks).toBe(25250000n);

    const saved = await getOrderById(order.id);
    expect(saved?.items).toEqual([
      expect.objectContaining({
        variantId,
        productName: "Integration table",
        variantLabel: "Integration oak",
        quantity: 2,
        unitPriceCopecks: 12500000n,
        totalPriceCopecks: 25000000n,
      }),
    ]);
    expect(saved?.events).toEqual([
      expect.objectContaining({ eventType: "created", actorType: "customer" }),
    ]);
  });
});
