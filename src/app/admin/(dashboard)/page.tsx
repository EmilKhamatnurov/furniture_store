import Link from "next/link";
import { ShoppingCart, Wallet, Clock } from "lucide-react";
import { getDashboardStats, getRecentOrders } from "@/modules/admin";
import { formatRub } from "@/lib/utils/money";
import { OrderStatusBadge } from "./status-badge";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminDashboardPage() {
  const [stats, recent] = await Promise.all([getDashboardStats(), getRecentOrders(8)]);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold">Дашборд</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Всего заказов"
          value={String(stats.totalOrders)}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Выручка (оплачено)"
          value={formatRub(stats.revenueCopecks)}
          hint={`${stats.paidOrders} оплаченных`}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Требуют отгрузки"
          value={String(stats.needsAttention)}
          hint="оплачено / в сборке"
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Последние заказы</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            Все заказы
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-border p-6 text-center">
            Заказов пока нет
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Номер</th>
                  <th className="px-4 py-2.5 font-medium">Дата</th>
                  <th className="px-4 py-2.5 font-medium">Статус</th>
                  <th className="px-4 py-2.5 font-medium text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {dateFmt.format(order.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      {formatRub(order.totalCopecks)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
