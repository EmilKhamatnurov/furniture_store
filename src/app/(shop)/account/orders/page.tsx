import type { Metadata } from "next";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { getCurrentCustomer } from "@/modules/customers";
import {
  getOrdersForCustomer,
  orderStatusLabel,
  ORDER_STATUS_TONE,
  type BadgeTone,
} from "@/modules/orders";
import { Button } from "@/components/ui/button";
import { formatRub } from "@/lib/utils/money";
import { urls } from "@/lib/utils/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мои заказы",
  robots: { index: false, follow: false },
};

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-green-100 text-green-700",
  danger: "bg-destructive/10 text-destructive",
};

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function AccountOrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orders = await getOrdersForCustomer(customer.id, customer.email);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold">Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-lg border border-border py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/25" />
          <div>
            <p className="font-medium">У вас пока нет заказов</p>
            <p className="text-sm text-muted-foreground">
              Загляните в каталог — там много интересного
            </p>
          </div>
          <Button asChild>
            <Link href={urls.catalog()}>В каталог</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <li key={order.id}>
                <Link
                  href={urls.order(order.id)}
                  className="group flex items-center gap-4 rounded-lg border border-border px-5 py-4 hover:border-foreground/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{order.number}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          TONE_CLASS[ORDER_STATUS_TONE[order.status]]
                        }`}
                      >
                        {orderStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dateFmt.format(order.createdAt)} · {itemCount} тов.
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums shrink-0">
                    {formatRub(order.totalCopecks)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
