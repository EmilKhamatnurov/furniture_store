import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrderDetail, allowedTransitions } from "@/modules/admin";
import { formatRub } from "@/lib/utils/money";
import { OrderStatusBadge } from "../../status-badge";
import { OrderStatusForm } from "./order-status-form";
import { NoteForm } from "./note-form";
import type { OrderEventType } from "@/modules/orders/db/schema";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const EVENT_LABELS: Record<OrderEventType, string> = {
  created: "Заказ создан",
  payment_initiated: "Платёж инициирован",
  payment_received: "Платёж получен",
  assembly_started: "Передан в сборку",
  shipped: "Отправлен",
  delivered: "Доставлен",
  completed: "Выполнен",
  cancellation_requested: "Запрошена отмена",
  cancelled: "Отменён",
  refund_requested: "Запрошен возврат",
  refunded: "Возврат оформлен",
  note_added: "Заметка",
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await getOrderDetail(orderId);
  if (!order) notFound();

  const addr = order.shippingAddress;
  const addrLine = [
    addr.postalCode,
    addr.region,
    addr.city,
    addr.street,
    addr.apartment ? `кв. ${addr.apartment}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Все заказы
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold">
            {order.number}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <span className="text-sm text-muted-foreground">
          {dateFmt.format(order.createdAt)}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: items + customer */}
        <div className="space-y-6">
          {/* Items */}
          <Section title="Состав заказа">
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variantLabel} · SKU {item.sku} · {item.quantity} шт
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {formatRub(item.totalPriceCopecks)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-3 mt-1 space-y-1.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Товары</span>
                <span className="tabular-nums">{formatRub(order.subtotalCopecks)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Доставка
                  {order.shippingAddress.zoneName ? ` · ${order.shippingAddress.zoneName}` : ""}
                </span>
                <span className="tabular-nums">
                  {order.shippingCopecks > 0n ? formatRub(order.shippingCopecks) : "Бесплатно"}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-1.5 border-t border-border">
                <span>Итого</span>
                <span className="tabular-nums">{formatRub(order.totalCopecks)}</span>
              </div>
            </div>
          </Section>

          {/* Customer */}
          <Section title="Покупатель и доставка">
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Row label="Получатель" value={addr.fullName} />
              <Row label="Телефон" value={addr.phone} />
              <Row label="Email" value={order.email} />
              <Row label="Адрес" value={addrLine} />
            </dl>
            {order.customerNote && (
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">Комментарий клиента: </span>
                {order.customerNote}
              </p>
            )}
          </Section>

          {/* Payments */}
          <Section title="Платежи">
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Платежей нет</p>
            ) : (
              <ul className="space-y-2">
                {order.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 text-sm border border-border rounded-md px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{formatRub(p.amountCopecks)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.yukassaPaymentId}
                      </p>
                    </div>
                    <span className="text-xs font-medium rounded-full bg-secondary px-2.5 py-0.5 shrink-0">
                      {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Event log */}
          <Section title="История">
            <ol className="space-y-3">
              {order.events.map((ev) => {
                const note =
                  ev.payload && typeof ev.payload === "object" && "note" in ev.payload
                    ? String((ev.payload as { note?: unknown }).note ?? "")
                    : "";
                return (
                  <li key={ev.id} className="flex gap-3 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/40 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {EVENT_LABELS[ev.eventType]}{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          · {ev.actorType}
                          {ev.actorId ? ` (${ev.actorId})` : ""}
                        </span>
                      </p>
                      {note && <p className="text-muted-foreground">{note}</p>}
                      <p className="text-xs text-muted-foreground">
                        {dateFmt.format(ev.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Section>
        </div>

        {/* Right: actions */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <Section title="Управление статусом">
            <OrderStatusForm
              orderId={order.id}
              options={allowedTransitions(order.status)}
            />
          </Section>

          <Section title="Внутренняя заметка">
            <NoteForm orderId={order.id} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
