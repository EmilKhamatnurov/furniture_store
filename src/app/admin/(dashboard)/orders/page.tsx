import Link from "next/link";
import { listOrders } from "@/modules/admin";
import { ORDER_STATUS_LABELS } from "@/modules/orders";
import { formatRub } from "@/lib/utils/money";
import { OrderStatusBadge } from "../status-badge";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/modules/orders/db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Заказы" };

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_VALUES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = STATUS_VALUES.includes(sp.status as OrderStatus)
    ? (sp.status as OrderStatus)
    : undefined;
  const page = Number(sp.page) || 1;

  const result = await listOrders({ status, page });

  const filterHref = (s?: OrderStatus) =>
    s ? `/admin/orders?status=${s}` : "/admin/orders";

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold">Заказы</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip href={filterHref()} active={!status}>
          Все
        </FilterChip>
        {STATUS_VALUES.map((s) => (
          <FilterChip key={s} href={filterHref(s)} active={status === s}>
            {ORDER_STATUS_LABELS[s]}
          </FilterChip>
        ))}
      </div>

      {result.orders.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-border p-8 text-center">
          Заказов с таким статусом нет
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Номер</th>
                <th className="px-4 py-2.5 font-medium">Дата</th>
                <th className="px-4 py-2.5 font-medium">Покупатель</th>
                <th className="px-4 py-2.5 font-medium">Статус</th>
                <th className="px-4 py-2.5 font-medium text-right">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {order.number}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {order.items.length} поз.
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {dateFmt.format(order.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div>{order.shippingAddress.fullName}</div>
                    <div className="text-xs text-muted-foreground">{order.email}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium whitespace-nowrap">
                    {formatRub(order.totalCopecks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Стр. {result.page} из {result.totalPages} · всего {result.total}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <PageLink status={status} page={result.page - 1}>
                ← Назад
              </PageLink>
            )}
            {result.page < result.totalPages && (
              <PageLink status={status} page={result.page + 1}>
                Вперёд →
              </PageLink>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/30"
      )}
    >
      {children}
    </Link>
  );
}

function PageLink({
  status,
  page,
  children,
}: {
  status?: OrderStatus | undefined;
  page: number;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  return (
    <Link
      href={`/admin/orders?${params.toString()}`}
      className="rounded-md border border-border px-3 py-1.5 hover:bg-muted transition-colors"
    >
      {children}
    </Link>
  );
}
