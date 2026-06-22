import type { OrderStatus } from "./db/schema";

// ---------------------------------------------------------------------------
// Order status presentation — shared label + badge tone.
// Pure module (no server-only) so it can be used in client components too.
// ---------------------------------------------------------------------------

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Ожидает оплаты",
  pending_payment: "Ожидает оплаты",
  paid: "Оплачен",
  assembling: "В сборке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  completed: "Выполнен",
  cancelled: "Отменён",
  refunded: "Возврат",
};

export type BadgeTone = "neutral" | "warning" | "success" | "danger";

export const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  draft: "warning",
  pending_payment: "warning",
  paid: "success",
  assembling: "neutral",
  shipped: "neutral",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
  refunded: "danger",
};

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
