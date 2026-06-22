import { orderStatusLabel, ORDER_STATUS_TONE, type BadgeTone } from "@/modules/orders";
import type { OrderStatus } from "@/modules/orders/db/schema";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-green-100 text-green-700",
  danger: "bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        TONE_CLASS[ORDER_STATUS_TONE[status]]
      }`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}
