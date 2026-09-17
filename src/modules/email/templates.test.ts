import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/modules/orders/access", () => ({
  createOrderAccessToken: () => "test-access-token",
}));

import { renderAdminNewOrder } from "./templates";
import type { Order, OrderItem } from "@/modules/orders/db/schema";

const order = {
  id: "11111111-1111-1111-1111-111111111111",
  number: "FS-2026-00001",
  email: "buyer@example.com",
  status: "draft",
  shippingAddress: {
    fullName: "Иван Петров",
    phone: "+7 999 000 00 00",
    region: "Республика Башкортостан",
    city: "Уфа",
    street: "ул. Пушкина, д. 10",
    postalCode: "450000",
    zoneName: "Уфа — в черте города (demo)",
  },
  subtotalCopecks: 6500000n,
  shippingCopecks: 250000n,
  discountCopecks: 0n,
  totalCopecks: 6750000n,
  customerNote: null,
  adminNote: null,
  customerId: null,
  createdAt: new Date("2026-09-18T00:00:00.000Z"),
  updatedAt: new Date("2026-09-18T00:00:00.000Z"),
  paidAt: null,
  shippedAt: null,
  completedAt: null,
} satisfies Order;

const item = {
  id: "22222222-2222-2222-2222-222222222222",
  orderId: order.id,
  variantId: "33333333-3333-3333-3333-333333333333",
  productName: "ТВ-тумба 2000",
  variantLabel: "Натуральный",
  sku: "DEV-TV-2000-1",
  quantity: 1,
  unitPriceCopecks: 6500000n,
  totalPriceCopecks: 6500000n,
} satisfies OrderItem;

describe("renderAdminNewOrder", () => {
  it("notifies the manager when an unpaid order is created", () => {
    const rendered = renderAdminNewOrder({ ...order, items: [item] });

    expect(rendered.subject).toContain("ожидает оплаты");
    expect(rendered.html).toContain(`/admin/orders/${order.id}`);
    expect(rendered.html).not.toContain(`?t=`);
  });

  it("labels a subsequent notification as paid", () => {
    const rendered = renderAdminNewOrder(
      { ...order, status: "paid", items: [item] },
      { paymentReceived: true }
    );

    expect(rendered.subject).toContain("оплачен");
  });
});
