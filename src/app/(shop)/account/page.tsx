import type { Metadata } from "next";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { getCurrentCustomer } from "@/modules/customers";
import { getOrdersForCustomer, orderStatusLabel } from "@/modules/orders";
import { formatRub } from "@/lib/utils/money";
import { urls } from "@/lib/utils/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: false },
};

export default async function AccountDashboardPage() {
  // Layout guard guarantees a customer here, but re-resolve for type-safety.
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orders = await getOrdersForCustomer(customer.id, customer.email);
  const latest = orders[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold">
          Здравствуйте, {customer.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Здесь — ваши заказы и личные данные.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Package className="h-4 w-4" />
            Всего заказов
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{orders.length}</p>
          {orders.length > 0 && (
            <Link
              href={urls.accountOrders()}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Все заказы <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="rounded-lg border border-border p-5">
          <p className="text-sm text-muted-foreground">Последний заказ</p>
          {latest ? (
            <Link href={urls.order(latest.id)} className="group mt-2 block">
              <p className="text-lg font-semibold group-hover:text-primary transition-colors">
                {latest.number}
              </p>
              <p className="text-sm text-muted-foreground">
                {orderStatusLabel(latest.status)} · {formatRub(latest.totalCopecks)}
              </p>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Заказов пока нет</p>
          )}
        </div>
      </div>

      {orders.length === 0 && (
        <Link
          href={urls.catalog()}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Перейти в каталог <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
