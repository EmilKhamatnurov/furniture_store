import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, PackageCheck, XCircle } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/modules/orders/db/schema";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { formatRub } from "@/lib/utils/money";
import { CartClearer } from "./cart-clearer";
import { PayButton } from "./pay-button";
import { canAccessOrder } from "./authorize";
import type { OrderStatus } from "@/modules/orders/db/schema";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ t?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderId } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) return { title: "Заказ не найден" };
  return {
    title: `Заказ ${order.number}`,
    robots: { index: false, follow: false },
  };
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { orderId } = await params;
  const { t } = await searchParams;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!order) notFound();

  // Hide PII behind a capability token or order ownership; otherwise 404
  // (don't reveal that the order exists).
  const allowed = await canAccessOrder(orderId, t, order.customerId, order.email);
  if (!allowed) notFound();

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

  const statusInfo = getStatusInfo(order.status);

  return (
    <>
      {/* Clear cart only after fresh checkout (draft status = just created) */}
      {order.status === "draft" && <CartClearer />}

      <Container>
        <div className="py-12 md:py-20 max-w-2xl mx-auto">

          {/* Status banner */}
          <div className="text-center space-y-3 mb-10">
            <div className="flex justify-center">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full ${statusInfo.iconBg}`}
              >
                <statusInfo.Icon className={`h-8 w-8 ${statusInfo.iconColor}`} />
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              {statusInfo.title}
            </h1>
            <p className="text-muted-foreground">
              Заказ{" "}
              <span className="font-semibold text-foreground">{order.number}</span>{" "}
              {statusInfo.subtitle}
            </p>
          </div>

          {/* Pay button — shown for draft and pending_payment orders */}
          {(order.status === "draft" || order.status === "pending_payment") && (
            <div className="mb-8">
              <PayButton orderId={orderId} accessToken={t} />
              {order.status === "pending_payment" && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Платёж ожидает подтверждения. Если он не завершился, нажмите ещё раз.
                </p>
              )}
            </div>
          )}

          {/* Order items */}
          <div className="rounded-lg border border-border overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Состав заказа
              </p>
            </div>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="px-5 py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variantLabel} · {item.quantity} шт
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {formatRub(item.totalPriceCopecks)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="px-5 py-4 border-t border-border space-y-1.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Товары</span>
                <span className="tabular-nums">{formatRub(order.subtotalCopecks)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Доставка{addr.zoneName ? ` · ${addr.zoneName}` : ""}</span>
                <span className="tabular-nums">
                  {order.shippingCopecks > 0n ? formatRub(order.shippingCopecks) : "Бесплатно"}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-1.5 border-t border-border">
                <span>Итого</span>
                <span className="tabular-nums">{formatRub(order.totalCopecks)}</span>
              </div>
            </div>
          </div>

          {/* Contact & address */}
          <div className="rounded-lg border border-border px-5 py-4 mb-8 space-y-1.5 text-sm">
            <Row label="Получатель" value={addr.fullName} />
            <Row label="Телефон" value={addr.phone} />
            <Row label="Email" value={order.email} />
            <Row label="Адрес" value={addrLine} />
            {order.customerNote && (
              <Row label="Комментарий" value={order.customerNote} />
            )}
          </div>

          {/* Next-step hint — only for paid orders awaiting manager callback */}
          {(order.status === "draft" || order.status === "paid") && (
            <div className="rounded-lg border border-border bg-secondary/30 px-5 py-4 text-sm text-muted-foreground mb-8">
              {order.status === "paid"
                ? <>
                    Оплата получена. Наш менеджер свяжется с вами по телефону{" "}
                    <span className="font-medium text-foreground">{addr.phone}</span>{" "}
                    для уточнения деталей доставки.
                  </>
                : <>
                    Оплатите заказ выше. Наш менеджер свяжется с вами по телефону{" "}
                    <span className="font-medium text-foreground">{addr.phone}</span>{" "}
                    после подтверждения оплаты.
                  </>
              }
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/">На главную</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/catalog">Продолжить покупки</Link>
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface StatusInfo {
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

function getStatusInfo(status: OrderStatus): StatusInfo {
  switch (status) {
    case "draft":
      return {
        Icon: Clock,
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        title: "Заказ оформлен!",
        subtitle: "принят. Перейдите к оплате, чтобы подтвердить заказ.",
      };
    case "pending_payment":
      return {
        Icon: Clock,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        title: "Ожидаем оплату",
        subtitle: "ожидает подтверждения платежа.",
      };
    case "paid":
    case "assembling":
    case "shipped":
    case "delivered":
    case "completed":
      return {
        Icon: order_status_is_paid_or_later(status) ? CheckCircle2 : PackageCheck,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        title: statusLabel(status),
        subtitle: statusSubtitle(status),
      };
    case "cancelled":
      return {
        Icon: XCircle,
        iconBg: "bg-destructive/10",
        iconColor: "text-destructive",
        title: "Заказ отменён",
        subtitle: "был отменён.",
      };
    case "refunded":
      return {
        Icon: XCircle,
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
        title: "Возврат оформлен",
        subtitle: "был возвращён.",
      };
  }
}

function order_status_is_paid_or_later(status: OrderStatus): boolean {
  return status === "paid" || status === "completed" || status === "delivered";
}

function statusLabel(status: OrderStatus): string {
  const labels: Partial<Record<OrderStatus, string>> = {
    paid: "Заказ оплачен!",
    assembling: "Заказ собирается",
    shipped: "Заказ отправлен",
    delivered: "Заказ доставлен",
    completed: "Заказ выполнен",
  };
  return labels[status] ?? "Заказ";
}

function statusSubtitle(status: OrderStatus): string {
  const subtitles: Partial<Record<OrderStatus, string>> = {
    paid: "успешно оплачен.",
    assembling: "передан в сборку.",
    shipped: "передан в доставку.",
    delivered: "доставлен.",
    completed: "завершён. Спасибо за покупку!",
  };
  return subtitles[status] ?? "обновлён.";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
