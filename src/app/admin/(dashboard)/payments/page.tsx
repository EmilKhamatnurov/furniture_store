import Link from "next/link";
import { listPayments } from "@/modules/admin";
import { formatRub } from "@/lib/utils/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Платежи" };

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_TONE: Record<string, string> = {
  succeeded: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  waiting_for_capture: "bg-amber-100 text-amber-700",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-secondary text-secondary-foreground",
  partially_refunded: "bg-secondary text-secondary-foreground",
};

export default async function AdminPaymentsPage() {
  const payments = await listPayments();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold">Платежи</h1>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-border p-8 text-center">
          Платежей пока нет
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Заказ</th>
                <th className="px-4 py-2.5 font-medium">YuKassa ID</th>
                <th className="px-4 py-2.5 font-medium">Создан</th>
                <th className="px-4 py-2.5 font-medium">Статус</th>
                <th className="px-4 py-2.5 font-medium text-right">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/orders/${p.orderId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {p.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                    {p.yukassaPaymentId}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {dateFmt.format(p.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_TONE[p.status] ?? "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium whitespace-nowrap">
                    {formatRub(p.amountCopecks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
